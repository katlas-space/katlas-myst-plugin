# Katlas MyST Plugin

Welcome to the documentation for the **Katlas MyST Plugin**.

## Features

- **Mermaid Diagrams**: Enhanced rendering with global configuration and styling.
- **Unified Architecture**: Single plugin handles multiple features.

### Prerequisites

-   **Conda**: Required for environment management.
-   **MyST CLI**: The plugin is designed to work with `myst`.

### Setup with Conda (Recommended)

The plugin works best when installed in a dedicated Conda environment. This allows the plugin to automatically manage its own dependencies.

1.  **Create an `environment.yml`** in your project root:
    ```yaml
    name: ktl-env
    channels:
      - conda-forge
      - defaults
    dependencies:
      - python=3.11
      - pip
      - pip:
        - katlas-myst-plugin
    ```

2.  **Create the environment**:
    ```bash
    conda env create -f environment.yml
    ```

3.  **Configure the Plugin**:
    Create or update `ktl-myst-plugin.yml` to point to this environment:
    ```yaml
    python:
      environment: ktl-env
      manage: auto
    ```

This setup ensures that even if you run `myst build` from a different environment, the plugin will automatically switch to `ktl-env` to execute its logic.

## Usage

Add `ktl-myst-plugin.py` wrapper to your project root and configure `myst.yml`.

```yaml
project:
  plugins:
    - ./ktl-myst-plugin.py
```

## Documentation

-   [Configuration Guide](configuration.md): Learn about configuration precedence and options.
-   [Architecture & Design](architecture.md): Understand the plugin's internal structure and design.
-   [Contributing Guide](contributing.md): How to set up development environment and submit changes.
