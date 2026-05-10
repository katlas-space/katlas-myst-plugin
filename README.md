# Katlas MyST Plugin

A **mystmd** (Jupyter Book v2) plugin that integrates Katlas-specific features, including enhanced Mermaid diagram support and theme-aware rendering.

## 🚀 Usage Patterns

This plugin can be used in three ways, depending on your project needs:

### A. Global/Local Installation (Recommended for Users)
1. Install the package:
   ```bash
   pip install katlas-myst-plugin
   ```
2. Enable it in your `myst.yml`:
   ```yaml
   project:
     plugins:
       - katlas-myst-plugin
   ```

### B. Project Wrapper (Recommended for Custom Environments)
Use the lightweight `ktl-myst-plugin.py` wrapper in your project root to handle environment bootstrapping.
1. Copy `wrappers/ktl-myst-plugin.py` to your project root.
2. Enable it in `myst.yml`:
   ```yaml
   project:
     plugins:
       - ./ktl-myst-plugin.py
   ```

### C. Bundled Source (Recommended for Professional CI/CD)
For zero-dependency CI (no private repo access needed), you can bundle the source directly.
1. Copy the `katlas_myst_plugin` source directory into a `plugins/` folder in your project.
2. Use the `ktl-myst-plugin.py` wrapper. It will automatically detect and prioritize the local source.

## 🎨 Enhanced Mermaid Support

The plugin provides a `ktl:mermaid` directive and document transformations to support:
- **Dual Rendering**: Generates both light and dark mode SVGs.
- **Theme-Aware Toggling**: Automatically switches diagrams based on your site theme.
- **Global Configuration**: Set defaults in `myst.yml`.

### Configuration Example (`myst.yml`)

```yaml
site:
  options:
    mermaid:
      theme: forest
      themeVariables:
        fontFamily: "Inter, sans-serif"
```

## 🏗️ Structure

- `python/`: Core Python package implementation.
- `wrappers/`: Bootstrap scripts for various environments.
- `docs/`: Full documentation portal.

## 📖 Further Reading

- [Architecture & Design](docs/architecture.md)
- [Configuration Hierarchy](docs/configuration.md)
- [Contributing Guide](docs/contributing.md)
