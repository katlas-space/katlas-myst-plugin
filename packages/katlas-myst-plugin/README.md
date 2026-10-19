# @katlas-space/mystmd-plugin-dual-mermaid-and-embed

A **mystmd** ([Jupyter Book v2](https://mystmd.org)) plugin bundling two independent features behind opt-in config flags:

1. **Dual-render mermaid diagrams** — light/dark theme-aware rendering that toggles with the browser's color scheme. Also provides a `ktl:mermaid` directive. Fixes mermaid config issues the stock mermaid support doesn't handle (schema-free, CI-safe, no network at build time).
2. **Obsidian-style wikilink-embed transclusion** — resolves `![[path#heading]]` and `![[path#^block-id]]` embeds at MyST build time. Content works natively in Obsidian and renders identically in MyST. Enables shared diagram files (DRY) across any multi-project MyST / Jupyter Book workspace.

The plugin is intentionally generic — no dependency on any particular theme or project layout. The source lives at [katlas-space/katlas-myst-plugin](https://github.com/katlas-space/katlas-myst-plugin); the published package is scope-neutral.

## Install and load

### Option 1 — Load from GitHub Release URL (no install)

Simplest. mystmd fetches once and caches locally after that.

```yaml
# myst.yml
project:
  plugins:
    - https://github.com/katlas-space/katlas-myst-plugin/releases/download/v0.1.0/index.mjs
```

### Option 2 — Install via GitHub Packages

Add to `.npmrc` in your project (or `~/.npmrc`):

```
@katlas-space:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @katlas-space/mystmd-plugin-dual-mermaid-and-embed@0.1.0
```

And reference in `myst.yml`:

```yaml
project:
  plugins:
    - node_modules/@katlas-space/mystmd-plugin-dual-mermaid-and-embed/dist/index.mjs
```

## Configure

Both features are **opt-in**. The plugin reads either `myst-plugin.yml` or (legacy) `ktl-myst-plugin.yml` at or above the current working directory (walks up 4 levels).

```yaml
# myst-plugin.yml at your project root (or workspace root)

diagrams:
  mermaid:
    enabled: true                              # default true if omitted
    global_config: ./mermaid-global-config.yml # optional; path to a mermaid config override

embeds:
  wikilink:
    enabled: true                              # default FALSE — opt in explicitly
```

### `global_config` for mermaid

A YAML file with keys matching the mermaid config schema. Example:

```yaml
# mermaid-global-config.yml
theme: neutral
fontFamily: Inter, system-ui, sans-serif
flowchart:
  curve: basis
```

Config precedence: diagram frontmatter → `global_config` → bundled defaults.

## Features in detail

### Dual-render mermaid

Every mermaid code fence (`` ```mermaid ``` ``) becomes two containers in the output: `.mermaid-light` and `.mermaid-dark`, nested inside `.katlas-mermaid-dual-container`. Site CSS toggles which is visible based on the active color scheme:

```css
.mermaid-light { display: block; }
.mermaid-dark  { display: none; }
html.dark .mermaid-light { display: none; }
html.dark .mermaid-dark  { display: block; }
```

Labels and identifiers on the original fence are hoisted onto the wrapper, so cross-references keep working.

The plugin **does not** fetch the mermaid config schema from mermaid.js.org at build time — builds are network-free by design. Config validation is delegated to mermaid itself at render time.

**ELK layout caveat**: `layout: elk` requires the site theme to bundle `@mermaid-js/layout-elk`. Without it, client-side mermaid renders an *empty* diagram. The default config therefore sets no layout (mermaid's dagre default). Opt into elk via config only if your theme registers the ELK layout loader.

### Wikilink-embed

Content files embed a specific block from a shared file:

```markdown
![[episteme/2-connect/assets/diagrams#credential-factors]]
```

The target file (`episteme/2-connect/assets/diagrams.md`) organises diagrams under headings:

```markdown
## credential-factors

​```mermaid
flowchart LR
    A --> B
​```
```

Path resolution tries, in order:
1. Absolute from project root if the target starts with `/`
2. Relative to the current file
3. Vault-root fallback (relative to project root — matches Obsidian's auto-resolution)

Selector forms:
- `#heading-slug` — matches heading text or its kebab-slug
- `#^block-id` — Obsidian block-reference convention (`^identifier` on its own line after a block)
- omitted — embed the whole file (frontmatter stripped)

Phase 1 scope: emits every fenced code block in the selected section as an AST `code` node. Non-code content (paragraphs, lists) is dropped with a VFile warning. Full prose transclusion is phase 2.

**Obsidian compatibility**: `![[path#heading]]` is Obsidian's native embed syntax — no Obsidian plugin needed. The MyST plugin resolves it on the build side so the deployed site renders identically.

## Compose with other plugins

The wikilink-embed transform runs **before** the mermaid transform. A wikilink that resolves to a mermaid code block hits ktl-mermaid as if it were authored inline — no coordination between the two.

Any other plugin visiting `code` nodes with `lang: mermaid` (or any other language) also sees resolved transclusions.

## Development

```bash
git clone https://github.com/katlas-space/katlas-myst-plugin.git
cd katlas-myst-plugin/packages/katlas-myst-plugin
npm install
npm run build       # emits dist/index.mjs
npm test            # runs tests/wikilink-embed.test.mjs
```

The `dist/index.mjs` bundle has no runtime dependencies — it's a single file that mystmd can load directly.

## Release

Releases are tagged `v*` on main. The [`.github/workflows/release.yml`](.github/workflows/release.yml) workflow:

1. Verifies the tag matches `package.json` version
2. Builds and tests
3. Creates a GitHub Release with `dist/index.mjs` as an asset
4. Publishes to GitHub Packages (`@katlas-space` scope)

To cut a release:

```bash
# bump packages/katlas-myst-plugin/package.json version to 0.2.0
git commit -am "release: v0.2.0"
git tag v0.2.0
git push --follow-tags
```

## Legacy: Python executable variant

A Python-based plugin variant exists under `python/katlas-myst-plugin/` for PDF/typst exports where diagrams must be pre-rendered server-side. **Do not enable it for site builds** — mystmd spawns executable plugins once per page transform, in parallel. On a 165-page project this reached ~250 concurrent processes and over 6GB of memory, hanging the machine (2026-09-08 postmortem). The javascript plugin above performs the same transform in-process at no measurable memory cost.

## License

MIT.
