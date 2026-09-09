/**
 * Katlas mermaid support, ported from the python plugin
 * (python/katlas-myst-plugin/src/katlas_myst_plugin/plugins/mermaid/main.py).
 *
 * Runs IN-PROCESS as a mystmd javascript plugin — the executable python
 * variant spawned one process per page transform in parallel (~250 procs,
 * >6GB on a 165-page world), which is why this port exists.
 *
 * Differences from the python version, both deliberate:
 * - No mermaid config-schema validation (the python code fetched
 *   https://mermaid.js.org/schemas/config.schema.json at build time — a
 *   network dependency that CI must not have; validation only logged warnings).
 * - CSS injection was already a no-op in python (MyST escapes raw <style>);
 *   the CSS reaches diagrams via themeCSS inside the mermaid config, same
 *   as python did.
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type {DirectiveSpec, TransformSpec, GenericNode, GenericParent} from 'myst-common';
import {DEFAULT_MERMAID_CONFIG, KTL_MERMAID_CSS} from './assets.js';
import type {KatlasMystPluginConfig} from './config.js';

type Dict = Record<string, unknown>;

function log(msg: string): void {
  console.log(`[KatlasMermaidPlugin] ${msg}`);
}

/** Fill gaps in `destination` from `source` — destination (local) wins. */
function deepMerge(source: Dict, destination: Dict): Dict {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const node = (destination[key] ??= {});
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        deepMerge(value as Dict, node as Dict);
      }
    } else if (!(key in destination)) {
      destination[key] = value;
    }
  }
  return destination;
}

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Parse a mermaid frontmatter block (---\nconfig: ...\n---) off the diagram code. */
function splitFrontmatter(value: string): {localConfig: Dict; code: string} {
  if (value.trim().startsWith('---')) {
    const parts = value.split('---');
    if (parts.length >= 3) {
      try {
        const parsed = yaml.load(parts[1]) as Dict | undefined;
        const code = parts.slice(2).join('---');
        if (parsed && typeof parsed === 'object' && 'config' in parsed) {
          return {localConfig: (parsed.config as Dict) ?? {}, code};
        }
        return {localConfig: {}, code};
      } catch {
        // fall through — treat the whole value as code
      }
    }
  }
  return {localConfig: {}, code: value};
}

function createMermaidNode(original: GenericNode, config: Dict, extraClass?: string): GenericNode {
  const {localConfig, code} = splitFrontmatter(String(original.value ?? ''));

  const merged = deepCopy(localConfig);
  deepMerge(config, merged);
  delete merged.katlas;

  // Dark-mode cleanup: outside the 'base' theme, mermaid rejects CSS-variable
  // color values in themeVariables.
  const theme = (merged.theme as string) ?? 'default';
  if (theme !== 'base' && merged.themeVariables && typeof merged.themeVariables === 'object') {
    const vars = merged.themeVariables as Dict;
    for (const [k, v] of Object.entries(vars)) {
      if (typeof v === 'string' && v.startsWith('var(--')) delete vars[k];
    }
    if (Object.keys(vars).length === 0) delete merged.themeVariables;
  }

  // Scope the plugin CSS to the diagram via themeCSS (safe inside MyST).
  const existingCss = (merged.themeCSS as string) ?? '';
  merged.themeCSS = `${existingCss}\n${KTL_MERMAID_CSS}`;

  let finalValue: string;
  try {
    const yml = yaml.dump(merged, {noRefs: true});
    const indented = yml
      .split('\n')
      .map(l => (l ? `  ${l}` : l))
      .join('\n');
    finalValue = `---\nconfig:\n${indented}\n---\n${code.trim()}`;
  } catch {
    finalValue = String(original.value ?? '');
  }

  const mermaidNode: GenericNode = {...deepCopy(original), type: 'mermaid', value: finalValue};
  if (extraClass) {
    return {type: 'container', kind: 'div', class: extraClass, children: [mermaidNode]};
  }
  return mermaidNode;
}

function stripIdentifiers(node: GenericNode): void {
  delete node.identifier;
  delete node.label;
  delete node.html_id;
  const child = (node.children as GenericNode[] | undefined)?.[0];
  if (child) {
    delete child.identifier;
    delete child.label;
    delete child.html_id;
  }
}

function isMermaid(node: GenericNode): boolean {
  if (node.type === 'mermaid') return true;
  return node.type === 'code' && String(node.lang ?? '').trim().toLowerCase() === 'mermaid';
}

/** Recursively transform; returns the replacement list for the given node. */
function transformNodes(node: GenericNode, globalConfig: Dict, katlas: Dict): GenericNode[] {
  // Fallback: a ktl:mermaid directive that reached the transform unconverted.
  if (node.type === 'mystDirective' && node.name === 'ktl:mermaid') {
    node = {type: 'mermaid', value: node.value ?? ''};
  }

  if (isMermaid(node)) {
    if (katlas.dualRender !== false) {
      const light = createMermaidNode(node, deepCopy(globalConfig), 'mermaid-light');
      const darkConfig = deepCopy(globalConfig);
      darkConfig.theme = 'dark';
      const dark = createMermaidNode(node, darkConfig, 'mermaid-dark');

      const {identifier, label, html_id} = node;
      stripIdentifiers(light);
      stripIdentifiers(dark);

      const wrapper: GenericNode = {
        type: 'container',
        kind: 'div',
        class: 'katlas-mermaid-dual-container',
        children: [light, dark],
      };
      if (identifier) wrapper.identifier = identifier;
      if (label) wrapper.label = label;
      if (html_id) wrapper.html_id = html_id;
      return [wrapper];
    }
    return [createMermaidNode(node, deepCopy(globalConfig))];
  }

  if (node.children) {
    const next: GenericNode[] = [];
    for (const child of node.children as GenericNode[]) {
      next.push(...transformNodes(child, globalConfig, katlas));
    }
    node.children = next;
  }
  return [node];
}

function loadGlobalMermaidConfig(configPath: string | undefined, configDir: string): Dict {
  if (configPath) {
    const abs = path.resolve(configDir, configPath);
    if (fs.existsSync(abs)) {
      try {
        const loaded = (yaml.load(fs.readFileSync(abs, 'utf8')) as Dict) ?? {};
        log(`Loaded global mermaid config from ${abs}`);
        return loaded;
      } catch (e) {
        log(`WARNING: Failed to load mermaid config at ${abs}: ${e}`);
      }
    } else {
      log(`WARNING: Mermaid config file not found at ${abs}`);
    }
  }
  return deepCopy(DEFAULT_MERMAID_CONFIG);
}

export function runMermaidTransform(tree: GenericParent, pluginConfig: KatlasMystPluginConfig): GenericParent {
  const mermaidPluginConfig = (pluginConfig.diagrams?.mermaid ?? {}) as Dict;
  const configDir = pluginConfig._configDir ?? process.cwd();
  const mermaidConfig = loadGlobalMermaidConfig(
    mermaidPluginConfig.global_config as string | undefined,
    configDir,
  );

  // Overrides from ktl-myst-plugin.yml win over the global/default config.
  const overrides = deepCopy(mermaidPluginConfig);
  delete overrides.global_config;
  delete overrides.enabled;
  const effective = deepMerge(mermaidConfig, overrides);

  const katlas = (effective.katlas as Dict) ?? {};
  delete effective.katlas;
  if (!('dualRender' in katlas)) katlas.dualRender = true;

  if (tree.children) {
    const next: GenericNode[] = [];
    for (const child of tree.children as GenericNode[]) {
      next.push(...transformNodes(child, effective, katlas));
    }
    tree.children = next;
  }
  return tree;
}

export function makeMermaidDirective(): DirectiveSpec {
  return {
    name: 'ktl:mermaid',
    doc: 'Mermaid diagram directive (katlas theme-aware dual rendering)',
    arg: {type: String},
    body: {type: String},
    run(data): GenericNode[] {
      return [{type: 'mermaid', value: String(data.body ?? '')}];
    },
  };
}

export function makeMermaidTransform(pluginConfig: KatlasMystPluginConfig): TransformSpec {
  return {
    name: 'katlas-mermaid',
    doc: 'Theme-aware dual (light/dark) mermaid rendering',
    stage: 'document',
    plugin: () => (tree: GenericParent) => runMermaidTransform(tree, pluginConfig),
  };
}
