/**
 * Obsidian-style wikilink-embed support: `![[path#heading]]` and `![[path]]`.
 *
 * Why: so authors can keep shared diagram files (DRY) that render correctly in
 * BOTH Obsidian (native support for `![[...]]` embeds) and MyST (this plugin).
 *
 * Design:
 *   - A text-level pattern match on `![[path(#selector)?]]` runs at the
 *     `document` stage, BEFORE the ktl-mermaid visitor and MyST's own cross-
 *     reference resolution.
 *   - For each match: resolve the path (relative to the current file;
 *     absolute paths resolve against the project root), read the target
 *     markdown, extract the requested section (by `# heading` or `^block-id`),
 *     then emit AST nodes for every mermaid / code block found in that section.
 *   - This phase-1 implementation handles mermaid and other fenced code
 *     blocks. Paragraph / list text in a transcluded section is dropped with
 *     a VFile warning — rich-text transclusion is phase 2.
 *
 * Compatibility notes:
 *   - Obsidian needs no plugin: it renders `![[path#^block-id]]` natively.
 *   - MyST core does not parse `![[...]]`. The source `![[...]]` reaches this
 *     plugin inside a `text` node unchanged (MyST sees it as "![" + bracketed
 *     wikilink text, which produces either a broken image or a trailing text
 *     node; we normalise both forms).
 *   - For a mermaid code block inside the target section, the output node is
 *     `{type: 'code', lang: 'mermaid', value: ...}` — exactly the shape the
 *     ktl-mermaid transform expects. The two plugins compose without
 *     coordination.
 */

import fs from 'fs';
import path from 'path';
import type {GenericNode, GenericParent, TransformSpec} from 'myst-common';
import type {VFile} from 'vfile';

type Dict = Record<string, unknown>;

// Match `![[path(#selector)?]]`.  Path must not contain `#`, `]`, or `|`.
// Selector may be a heading name OR `^block-id`.
const EMBED_PATTERN = /!\[\[([^#\]|]+)(?:#(\^?[^\]|]+))?\]\]/g;

function log(msg: string): void {
  // Reserved for future diagnostic hooks. Keep quiet in the normal build path —
  // transclusion failures surface via VFile warnings, not stdout noise.
  void msg;
}

interface ResolveContext {
  currentFile: string;
  projectRoot: string;
}

/**
 * Resolve a target path from a wikilink to an absolute file path.
 *
 * Tries, in order:
 *   1. Absolute from project root if the target starts with "/"
 *   2. Relative to the current file
 *   3. Relative to the project root (vault-root style — Obsidian default)
 *
 * Returns the first path that exists on disk; otherwise returns the
 * relative-to-current-file resolution so the caller can surface a useful
 * "not found" error.
 */
function resolveTargetPath(target: string, ctx: ResolveContext): string {
  let p = target.trim();
  if (!p.endsWith('.md')) p = `${p}.md`;

  // 1. explicit absolute (leading slash) → project root
  if (p.startsWith('/')) {
    return path.join(ctx.projectRoot, p);
  }

  // 2. relative to current file
  const relative = path.resolve(path.dirname(ctx.currentFile), p);
  if (fs.existsSync(relative)) return relative;

  // 3. vault-root fallback — resolve as if the target were relative to project root
  const vaultRoot = path.resolve(ctx.projectRoot, p);
  if (fs.existsSync(vaultRoot)) return vaultRoot;

  // Return the current-file-relative path so error messages are informative
  return relative;
}

/**
 * Extract the chunk of markdown under a selector (heading or ^block-id).
 * If no selector is given, returns the entire body (frontmatter stripped).
 */
function extractSection(
  source: string,
  selector: string | undefined,
): {chunk: string; headingLevel: number} | undefined {
  // Strip frontmatter
  let body = source;
  if (body.startsWith('---')) {
    const end = body.indexOf('\n---', 3);
    if (end !== -1) body = body.slice(end + 4);
  }

  if (!selector) {
    return {chunk: body, headingLevel: 0};
  }

  const lines = body.split('\n');

  // Block-id selector: `^block-id` placed on its own line (Obsidian convention).
  // We take the block that ENDS at that marker — meaning the previous code
  // fence or paragraph. For code fences specifically we walk back to the
  // opening fence.
  if (selector.startsWith('^')) {
    const id = selector.slice(1);
    const re = new RegExp(`^\\^${id}\\s*$`);
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        // Walk upward to find the preceding block boundary.
        let end = i - 1;
        while (end >= 0 && lines[end].trim() === '') end--;
        if (end < 0) return undefined;
        // If end line is a code fence close, walk back to its opening fence.
        if (lines[end].startsWith('```')) {
          let start = end - 1;
          while (start >= 0 && !lines[start].startsWith('```')) start--;
          if (start < 0) return undefined;
          return {chunk: lines.slice(start, end + 1).join('\n'), headingLevel: 0};
        }
        // Otherwise, walk back to the previous blank line (paragraph boundary).
        let start = end;
        while (start > 0 && lines[start - 1].trim() !== '') start--;
        return {chunk: lines.slice(start, end + 1).join('\n'), headingLevel: 0};
      }
    }
    return undefined;
  }

  // Heading selector: match `## heading`, `### heading`, etc. The match is
  // case-insensitive on the exact heading text; both the literal heading text
  // and a kebab-case slug of it are accepted (so `#my-heading` and `#My Heading`
  // both work).
  const target = selector.trim().toLowerCase();
  const slug = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2];
    if (text.toLowerCase() === target || slug(text) === target) {
      // Found the heading; collect lines until next heading of same or higher level.
      const start = i + 1;
      let end = lines.length;
      for (let j = start; j < lines.length; j++) {
        const nm = lines[j].match(/^(#{1,6})\s+/);
        if (nm && nm[1].length <= level) {
          end = j;
          break;
        }
      }
      return {chunk: lines.slice(start, end).join('\n'), headingLevel: level};
    }
  }
  return undefined;
}

/**
 * Parse all fenced code blocks out of a markdown chunk and emit matching
 * AST nodes. Non-code content (paragraphs, lists, headings) is NOT emitted
 * in this phase — a warning is attached if any is present.
 */
function chunkToCodeNodes(chunk: string): {nodes: GenericNode[]; droppedProse: boolean} {
  const nodes: GenericNode[] = [];
  const lines = chunk.split('\n');
  let i = 0;
  let droppedProse = false;
  while (i < lines.length) {
    const line = lines[i];
    const open = line.match(/^```\s*(\S*)\s*$/);
    if (open) {
      const lang = open[1] || '';
      const bodyStart = i + 1;
      let j = bodyStart;
      while (j < lines.length && !lines[j].startsWith('```')) j++;
      const value = lines.slice(bodyStart, j).join('\n');
      const node: GenericNode = {type: 'code', value};
      if (lang) (node as Dict).lang = lang;
      nodes.push(node);
      i = j + 1;
    } else {
      if (line.trim() !== '' && !line.startsWith('#')) droppedProse = true;
      i++;
    }
  }
  return {nodes, droppedProse};
}

/**
 * Replace text in a text node with mixed text/resolved-embed children.
 * Walks a single text node and returns the replacement children; the parent
 * handles splicing.
 */
function expandTextNode(
  textNode: GenericNode,
  ctx: ResolveContext,
  vfile: VFile,
): GenericNode[] | undefined {
  const value = typeof textNode.value === 'string' ? textNode.value : '';
  if (!value || !value.includes('![[')) return undefined;

  const out: GenericNode[] = [];
  let last = 0;
  const regex = new RegExp(EMBED_PATTERN.source, 'g');
  let m: RegExpExecArray | null;
  let anyMatch = false;
  while ((m = regex.exec(value)) !== null) {
    anyMatch = true;
    const [full, targetPath, selector] = m;
    if (m.index > last) {
      out.push({type: 'text', value: value.slice(last, m.index)});
    }
    try {
      const abs = resolveTargetPath(targetPath, ctx);
      if (!fs.existsSync(abs)) {
        warn(vfile, `wikilink-embed: target not found: ${abs} (from ${full})`);
        out.push({type: 'text', value: full});
      } else {
        const source = fs.readFileSync(abs, 'utf8');
        const section = extractSection(source, selector);
        if (!section) {
          warn(vfile, `wikilink-embed: selector not found in ${abs}: ${selector}`);
          out.push({type: 'text', value: full});
        } else {
          const {nodes, droppedProse} = chunkToCodeNodes(section.chunk);
          if (nodes.length === 0) {
            warn(
              vfile,
              `wikilink-embed: no code blocks found under ${selector ?? '(whole file)'} in ${abs}`,
            );
            out.push({type: 'text', value: full});
          } else {
            if (droppedProse) {
              warn(
                vfile,
                `wikilink-embed: dropped non-code content in ${abs}#${selector ?? ''} (phase-1 only emits code blocks)`,
              );
            }
            out.push(...nodes);
          }
        }
      }
    } catch (err) {
      warn(vfile, `wikilink-embed: error resolving ${full}: ${(err as Error).message}`);
      out.push({type: 'text', value: full});
    }
    last = m.index + full.length;
  }
  if (!anyMatch) return undefined;
  if (last < value.length) {
    out.push({type: 'text', value: value.slice(last)});
  }
  return out;
}

function warn(vfile: VFile, message: string): void {
  if (vfile && typeof vfile.message === 'function') {
    vfile.message(message, undefined, 'katlas-wikilink-embed');
  } else {
    log(`WARN: ${message}`);
  }
}

/**
 * Recursively visit parent nodes and expand any text children that contain
 * `![[...]]` patterns. Replacements are inserted in place.
 *
 * One subtlety: when the text node is the ONLY content in a paragraph and the
 * replacement nodes are block-level (code, image, container), we also unwrap
 * the paragraph so the block-level content lands at the right nesting level.
 */
function visitParent(parent: GenericParent, ctx: ResolveContext, vfile: VFile): GenericNode[] {
  if (!parent.children) return [parent];
  const next: GenericNode[] = [];
  let changed = false;
  for (const child of parent.children as GenericNode[]) {
    if (child.type === 'text') {
      const replacement = expandTextNode(child, ctx, vfile);
      if (replacement) {
        next.push(...replacement);
        changed = true;
      } else {
        next.push(child);
      }
    } else if (child.children) {
      const subResult = visitParent(child as GenericParent, ctx, vfile);
      // visitParent returns [self] or an unwrapped sequence. Detect either
      // case as "changed" so the parent's children get updated.
      if (subResult.length !== 1 || subResult[0] !== child) {
        changed = true;
      }
      next.push(...subResult);
    } else {
      next.push(child);
    }
  }
  if (changed) {
    // A paragraph whose only children (after expansion) are block-level nodes
    // should unwrap so the blocks appear at document scope rather than nested
    // inside <p>.
    if (parent.type === 'paragraph' && allBlockLevel(next)) {
      return next;
    }
    parent.children = next;
  }
  return [parent];
}

function allBlockLevel(nodes: GenericNode[]): boolean {
  const blockTypes = new Set(['code', 'image', 'container', 'block', 'mermaid']);
  return nodes.every((n) => blockTypes.has(n.type ?? ''));
}

/** Walk upward from a file to find the enclosing MyST project (dir with myst.yml). */
function findProjectRoot(startFile: string, fallback: string): string {
  let dir = path.dirname(startFile);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'myst.yml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return fallback;
}

export function runWikilinkEmbedTransform(
  tree: GenericParent,
  vfile: VFile,
  pluginRoot: string,
): GenericParent {
  const currentFile = vfile.path ?? path.join(pluginRoot, 'unknown.md');
  const projectRoot = findProjectRoot(currentFile, pluginRoot);
  const ctx: ResolveContext = {currentFile, projectRoot};
  const resultChildren: GenericNode[] = [];
  if (tree.children) {
    for (const child of tree.children as GenericNode[]) {
      if (child.children) {
        resultChildren.push(...visitParent(child as GenericParent, ctx, vfile));
      } else if (child.type === 'text') {
        const replacement = expandTextNode(child, ctx, vfile);
        resultChildren.push(...(replacement ?? [child]));
      } else {
        resultChildren.push(child);
      }
    }
    tree.children = resultChildren;
  }
  return tree;
}

export function makeWikilinkEmbedTransform(projectRoot: string): TransformSpec {
  return {
    name: 'katlas-wikilink-embed',
    doc: 'Resolve Obsidian-style `![[path#heading]]` embeds (shared mermaid files, etc.)',
    // Run BEFORE 'document' stage transforms so ktl-mermaid sees the resolved
    // code nodes alongside inline ones.
    stage: 'document',
    plugin: () => (tree: GenericParent, vfile: VFile) => runWikilinkEmbedTransform(tree, vfile, projectRoot),
  };
}
