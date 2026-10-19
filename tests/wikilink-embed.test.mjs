#!/usr/bin/env node
// Standalone test for the wikilink-embed transform.
// Usage: node tests/wikilink-embed.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const {runWikilinkEmbedTransform} = await import(
  '../packages/katlas-myst-plugin/dist/index.mjs'
).then((m) => ({runWikilinkEmbedTransform: null})).catch(() => ({runWikilinkEmbedTransform: null}));

// The built index.mjs is bundled — reach the transform through a direct import
// of the source file after a quick tsx-style compile would be cleanest, but we
// instead exercise the transform via a tiny stub that re-exports it.
// Here we re-build on the fly from source for the test harness.

import {spawnSync} from 'node:child_process';
const pkgDir = path.resolve(__dirname, '..', 'packages', 'katlas-myst-plugin');

// Compile the single file to CJS so we can import it directly.
const stubOut = path.join(os.tmpdir(), `wikilink-embed-${Date.now()}.mjs`);
const esbuildBin = path.join(pkgDir, 'node_modules', '.bin', 'esbuild');
const esbuildRoot = path.join(__dirname, '..', 'node_modules', '.bin', 'esbuild');
const esbuild = fs.existsSync(esbuildBin) ? esbuildBin : esbuildRoot;
const r = spawnSync(
  esbuild,
  [
    path.join(pkgDir, 'src', 'wikilink-embed.ts'),
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${stubOut}`,
  ],
  {stdio: 'inherit'},
);
if (r.status !== 0) {
  console.error('esbuild compile failed');
  process.exit(1);
}
const mod = await import(stubOut);
const {runWikilinkEmbedTransform: run} = mod;

function assert(cond, msg) {
  if (!cond) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

function deepFind(node, pred, out = []) {
  if (pred(node)) out.push(node);
  if (Array.isArray(node.children)) for (const c of node.children) deepFind(c, pred, out);
  return out;
}

// ─── Fixtures ──────────────────────────────────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wikilink-embed-'));
const assets = path.join(tmp, 'episteme', 'assets');
fs.mkdirSync(assets, {recursive: true});

const diagramsPath = path.join(assets, 'diagrams.md');
fs.writeFileSync(
  diagramsPath,
  `---
title: Diagrams
---

## credential-factors

\`\`\`mermaid
flowchart LR
    I["Identity"] --> P["Proof"]
\`\`\`

## card-transaction

\`\`\`mermaid
sequenceDiagram
    C->>T: present card
    T->>B: authorize
\`\`\`

A paragraph of text inside this section — phase-1 should drop it with a warning.
`,
);

const contentPath = path.join(tmp, 'episteme', 'understand.md');

// ─── Harness ───────────────────────────────────────────────────────────────
function makeTree(embedText) {
  // Mimic the shape MyST produces for a paragraph whose only content is text.
  return {
    type: 'root',
    children: [{type: 'paragraph', children: [{type: 'text', value: embedText}]}],
  };
}
const vfile = {
  path: contentPath,
  message: (m) => console.log(`    [vfile message] ${m}`),
};
const projectRoot = tmp;

// ─── Test 1: embed by heading ──────────────────────────────────────────────
console.log('Test 1: ![[assets/diagrams#credential-factors]]');
let tree = makeTree('![[assets/diagrams#credential-factors]]');
run(tree, vfile, projectRoot);
let codes = deepFind(tree, (n) => n.type === 'code');
assert(codes.length === 1, 'exactly one code node emitted');
assert(codes[0].lang === 'mermaid', 'code node has lang=mermaid');
assert(/Identity/.test(codes[0].value), 'code value contains the Identity diagram text');

// ─── Test 2: embed by heading (second heading) ─────────────────────────────
console.log('Test 2: ![[assets/diagrams#card-transaction]]');
tree = makeTree('![[assets/diagrams#card-transaction]]');
run(tree, vfile, projectRoot);
codes = deepFind(tree, (n) => n.type === 'code');
assert(codes.length === 1, 'exactly one code node for second heading');
assert(/sequenceDiagram/.test(codes[0].value), 'contains sequenceDiagram text');

// ─── Test 3: unresolved target → text preserved + warning ──────────────────
console.log('Test 3: ![[missing-file#heading]] (should warn, preserve text)');
tree = makeTree('![[missing-file#heading]]');
run(tree, vfile, projectRoot);
const texts = deepFind(tree, (n) => n.type === 'text');
assert(
  texts.some((t) => t.value.includes('![[missing-file#heading]]')),
  'original text preserved when target missing',
);
assert(deepFind(tree, (n) => n.type === 'code').length === 0, 'no code node emitted for miss');

// ─── Test 4: whole-file embed (no selector) ────────────────────────────────
console.log('Test 4: ![[assets/diagrams]] (no selector = whole file)');
tree = makeTree('![[assets/diagrams]]');
run(tree, vfile, projectRoot);
codes = deepFind(tree, (n) => n.type === 'code');
assert(codes.length === 2, 'two code nodes from whole file (both mermaid blocks)');

// ─── Test 5: block-id selector (^block-id) ─────────────────────────────────
console.log('Test 5: ![[assets/diagrams-block#^credential-factors-block]]');
fs.writeFileSync(
  path.join(assets, 'diagrams-block.md'),
  `\`\`\`mermaid
flowchart LR
    A --> B
\`\`\`
^credential-factors-block
`,
);
tree = makeTree('![[assets/diagrams-block#^credential-factors-block]]');
run(tree, vfile, projectRoot);
codes = deepFind(tree, (n) => n.type === 'code');
assert(codes.length === 1, 'one code node for block-id reference');
assert(/A --> B/.test(codes[0].value), 'block-id resolved to right fence');

// ─── Test 6: mixed inline text — embed within prose ────────────────────────
console.log('Test 6: inline embed within prose text');
tree = {
  type: 'root',
  children: [
    {
      type: 'paragraph',
      children: [{type: 'text', value: 'before ![[assets/diagrams#credential-factors]] after'}],
    },
  ],
};
run(tree, vfile, projectRoot);
codes = deepFind(tree, (n) => n.type === 'code');
assert(codes.length === 1, 'inline embed extracted even inside prose');
const allText = deepFind(tree, (n) => n.type === 'text')
  .map((t) => t.value)
  .join('|');
assert(/before/.test(allText) && /after/.test(allText), 'surrounding text preserved');

// ─── Cleanup ───────────────────────────────────────────────────────────────
fs.rmSync(tmp, {recursive: true, force: true});

if (process.exitCode) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
}
console.log('\n✅ All wikilink-embed tests passed.');
