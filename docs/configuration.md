# Configuration

The Katlas MyST Plugin supports a hierarchical configuration system that allows you to control settings at the global, project, and individual diagram levels.

## Configuration Precedence

When rendering a diagram, the plugin merges configuration from three sources in the following order of priority (highest to lowest):

1.  **Diagram/File Config** (Highest Priority)
    *   Configuration defined directly in the Mermaid code block frontmatter or directive options.
    *   Example:
        ```mermaid
        ---
        config:
          theme: neutral
        ---
        graph TD; A-->B;
        ```
    *   Overrides everything else.

2.  **World Plugin Config** (Medium Priority)
    *   Configuration defined in your project's `ktl-myst-plugin.yml` file.
    *   This is where you set project-wide defaults like the theme `forest`.
    *   Example:
        ```yaml
        items:
          - pattern: "**/*"
            diagrams:
              mermaid:
                theme: forest
        ```
    *   Overrides the default package configuration.

3.  **Default Package Config** (Lowest Priority)
    *   The fallback configuration bundled with the plugin itself (`default_mermaid_config.yml`).
    *   Sets sensible defaults (e.g., `theme: default`, `fontFamily`, `layout: elk`).

## Mermaid Configuration References

The plugin supports the standard Mermaid configuration options. For a complete list of available settings, please refer to the official Mermaid documentation:

-   **[Mermaid Configuration Schema](https://mermaid.js.org/config/schema-docs/config.html)**: Full list of all configuration options.
-   **[Mermaid Theming](https://mermaid.js.org/config/theming.html)**: Details on available themes and customization variables.

When configuring your diagram, you can use any valid key from the Mermaid schema under the `config` key.

### Supported Mermaid Version
The plugin dynamically fetches the latest configuration schema from `https://mermaid.js.org/schemas/config.schema.json`. It is designed to work with the Mermaid version bundled by your MyST frontend or theme (typically the latest stable release).

## Global Config File

You can also specify a separate global configuration file in your `ktl-myst-plugin.yml`:

```yaml
diagrams:
  mermaid:
    global_config: "path/to/mermaid-global-config.yml"
```

This file acts as a base for level #2. The settings in `ktl-myst-plugin.yml` will override settings in this external file, and both will override the package defaults.
