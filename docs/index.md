# Getting Started

Welcome to the **Katlas MyST Plugin** documentation. This plugin enhances your MyST documentation portal with theme-aware diagrams and unified styling.

## 🏁 Quick Start

The simplest way to use the plugin is via `pip`:

1.  **Install the plugin**:
    ```bash
    pip install katlas-myst-plugin
    ```

2.  **Enable in `myst.yml`**:
    ```yaml
    project:
      plugins:
        - katlas-myst-plugin
    ```

---

## 🛠️ Advanced Usage Patterns

For professional projects requiring robust CI/CD or custom environment management, we recommend using the **Wrapper Pattern**.

### 1. The Wrapper Pattern
Copy the `ktl-myst-plugin.py` script from the repository into your project root. This allows you to:
- Use specific Python environments.
- Support **Bundled Mode** (no package installation required on CI).

### 2. Bundled Mode (Zero-Dependency CI)
Drawing from the [gitinspector-rs](https://github.com/softmentor/gitinspector-rs) implementation, you can bundle the plugin source directly:

1.  Create a `plugins/` directory in your documentation root.
2.  Copy the `katlas_myst_plugin` package directory into `plugins/`.
3.  Add the `ktl-myst-plugin.py` wrapper to your project root.
4.  The wrapper will automatically detect the local source and use it, ensuring your CI build is fast and reliable without needing external repository access.

---

## 📚 Documentation

- [**Architecture & Design**](architecture.md): Understand the "Thin Wrapper & Pluggable Core" design.
- [**Configuration Guide**](configuration.md): Learn about configuration precedence (Local > World > Default).
- [**Contributing**](contributing.md): Setup your local development environment.
