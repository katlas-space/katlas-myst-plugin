# Katlas MyST Plugin

A **mystmd** (Jupyter Book v2) plugin that integrates Katlas-specific features, including enhanced Mermaid diagram support and theme-aware rendering.

## 🚀 Usage Patterns

This plugin can be used in three ways, depending on your project needs:

### A. Global/Local Installation (Recommended)
Using **uv** (recommended for speed and reliability) or **pip**:
```bash
# Using uv
uv pip install katlas-myst-plugin

# Using pip
pip install katlas-myst-plugin
```

Enable it in your `myst.yml`:
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

### C. Bundled Source (Legacy/Offline)
For zero-dependency environments, you can bundle the source directly.
1. Copy the `katlas_myst_plugin` source directory into a `plugins/` folder in your project.
2. Use the `ktl-myst-plugin.py` wrapper. It will automatically detect and prioritize the local source.

## 🏗️ Development

We use `uv` for dependency management. To set up your local development environment:

```bash
# Clone the repository
git clone https://github.com/katlas-space/katlas-myst-plugin.git
cd katlas-myst-plugin

# Install in editable mode with dev dependencies
uv pip install -e "python/katlas-myst-plugin[dev]"

# Run tests
uv run pytest python/katlas-myst-plugin
```

## 📖 Further Reading

- [Architecture & Design](docs/architecture.md)
- [Configuration Hierarchy](docs/configuration.md)
- [Contributing Guide](docs/contributing.md)
