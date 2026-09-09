# Katlas MyST Plugin

A **mystmd** (Jupyter Book v2) plugin that integrates Katlas-specific features, including enhanced Mermaid diagram support (dual light/dark theme-aware rendering) and the `ktl:mermaid` directive.

## Two variants — pick by build type

| Variant | Runs | Use for |
|---|---|---|
| **JavaScript** (`packages/katlas-myst-plugin`) | **In-process** inside mystmd | **HTML/site builds — the default.** Zero extra processes; diagrams render client-side by the theme |
| Python executable (`python/katlas-myst-plugin`) | One subprocess **per page transform, in parallel** | PDF/typst exports only, where diagrams must be pre-rendered |

> ⚠️ **Never enable the executable python variant for site builds of a large
> project.** mystmd spawns executable plugins once per page transform, in
> parallel — on a 165-page project this reached ~250 concurrent processes and
> over 6GB of memory, hanging the machine (2026-09-08 postmortem). The
> javascript variant performs the same transform in-process at no measurable
> memory cost. The python `manage: auto` conda bootstrapping is retired for
> the same reason (`manage: manual` only).

## 🚀 Usage

### A. JavaScript plugin (recommended)

Build the self-contained bundle and reference it from `myst.yml`:

```bash
cd packages/katlas-myst-plugin && npx tsup   # emits dist/index.mjs (single file, deps bundled)
```

```yaml
project:
  plugins:
    - ./ktl-myst-plugin.mjs   # copy of dist/index.mjs placed in your project
```

The bundle has no runtime dependencies — copy `dist/index.mjs` anywhere
(e.g. a documentation monorepo root shared by many projects) and reference it
with a relative path.

**Config discovery**: the plugin looks for `ktl-myst-plugin.yml` in the build
directory and then walks upward (up to 4 levels), so per-project builds inside
a multi-project estate find the estate-root config.

### B. Python executable (PDF/typst pre-rendering only)

1. Copy `wrappers/ktl-myst-plugin.py` next to your project.
2. Enable it in `myst.yml` **for the export build only**:
   ```yaml
   project:
     plugins:
       - ./ktl-myst-plugin.py
   ```

## Mermaid notes

- The transform emits **dual light/dark containers**
  (`.mermaid-light` / `.mermaid-dark` inside `.katlas-mermaid-dual-container`)
  toggled by CSS; labels/identifiers are hoisted to the wrapper so
  cross-references keep working.
- Config precedence: diagram frontmatter → `ktl-myst-plugin.yml`
  (`diagrams.mermaid.*`) → `global_config` file → bundled defaults.
- **`layout: elk` requires the site theme to bundle `@mermaid-js/layout-elk`.**
  Without it, client-side mermaid renders an *empty* diagram (found 2026-09-09;
  the katlas book theme does not bundle it). The default config therefore sets
  no layout (mermaid's dagre default). Opt into elk via config only if your
  theme registers the ELK layout loader.
- Unlike the python variant, the javascript plugin does **not** fetch the
  mermaid config schema from mermaid.js.org at build time — builds are
  network-free by design (CI-safe); config validation is delegated to mermaid
  itself at render time.

## 🏗️ Development

```bash
git clone https://github.com/katlas-space/katlas-myst-plugin.git
cd katlas-myst-plugin

# JavaScript plugin
cd packages/katlas-myst-plugin && npm install && npx tsup

# Python plugin (uv recommended)
uv pip install -e "python/katlas-myst-plugin[dev]"
uv run pytest python/katlas-myst-plugin
```

## 📖 Further Reading

- [Architecture & Design](docs/architecture.md)
- [Configuration Hierarchy](docs/configuration.md)
- [Contributing Guide](docs/contributing.md)
