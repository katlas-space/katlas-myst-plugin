# Katlas MyST Plugin

A **mystmd** (Jupyter Book v2) plugin that integrates Katlas-specific features, including enhanced Mermaid diagram support and CSS management.

## Features

- **Enhanced Mermaid Support**:
    - Global configuration via `myst.yml`.
    - Page-level configuration via frontmatter.
    - Python-based directive implementation for improved control.
    - Integrates with standard MyST Mermaid rendering pipeline.

## Installation

1.  Clone this repository.
2.  Install the package:
    ```bash
    pip install ./python/katlas-myst-plugin
    ```

## Usage

### 1. Enable the plugin in `myst.yml`

This plugin provides a Python executable that MyST calls. Configure it in your project's `myst.yml`:

```yaml
project:
  plugins:
    - katlas-myst-plugin  # Or path to local executable if developing
```

### 2. Configure Mermaid Globally

You can configure Mermaid settings in `myst.yml`:

```yaml
site:
  options:
    mermaid:
      look: handDrawn
      layout: elk
      theme: forest
      themeVariables:
        fontFamily: "Architects Daughter, cursive"
```

### 3. Manual CSS Inclusion

To include custom styles (e.g., for Mermaid fonts), copy the provided `ktl-style.css` to your project and reference it:

```yaml
site:
  options:
    style: ./ktl-style.css
```

## Structure

-   `python/`: Python package implementation.
-   `packages/`: Node.js packages (if any).
-   `tests/`: Integration tests and fixtures.
-   `examples/`: Example configurations and schemas.

## Configuration Priority

1.  **Inline (Highest)**: Directives or code blocks with inline config.
2.  **Page Frontmatter**: Settings in the page's `mermaid` key.
3.  **Site Options (Global)**: Defaults defined in `myst.yml`.
