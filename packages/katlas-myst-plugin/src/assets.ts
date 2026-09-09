/**
 * Bundled assets, ported from the python plugin's
 * plugins/mermaid/assets/{default_mermaid_config.yml, ktl-mermaid.css}.
 * Inlined so the built .mjs is a single self-contained file.
 */

export const DEFAULT_MERMAID_CONFIG: Record<string, unknown> = {
  // https://mermaid.js.org/config/schema-docs/config.html
  layout: 'elk',
  fontFamily: 'var(--mermaid-font-family)',
  elk: {
    mergeEdges: true,
    nodePlacementStrategy: 'NETWORK_SIMPLEX',
  },
  theme: 'default',
  themeVariables: {
    fontFamily: 'var(--mermaid-font-family)',
    fontSize: 'var(--mermaid-font-size)',
  },
  logLevel: 'fatal',
  darkMode: false,
  markdownAutoWrap: true,
  // Custom plugin options — stripped before the config reaches mermaid
  katlas: {
    dualRender: true,
  },
};

export const KTL_MERMAID_CSS = `
/* Mermaid dual-render toggling */
.mermaid-light { display: block; }
.mermaid-dark { display: none; }
html.dark .mermaid-light { display: none; }
html.dark .mermaid-dark { display: block; }

:root {
  --mermaid-font-family: 'Architects Daughter', cursive;
  --mermaid-font-size: 14px;
  --mermaid-primary-color: #ECECFF;
  --mermaid-primary-text: #333;
  --mermaid-primary-border: #9370DB;
  --mermaid-line-color: #333;
  --mermaid-secondary-color: #ffffde;
  --mermaid-tertiary-color: #fff;
}

html[data-theme="dark"] {
  --mermaid-primary-color: #2D2D2D;
  --mermaid-primary-text: #F0F0F0;
  --mermaid-primary-border: #BB86FC;
  --mermaid-line-color: #E0E0E0;
  --mermaid-secondary-color: #383838;
  --mermaid-tertiary-color: #121212;
}

.mermaid text { font-family: var(--mermaid-font-family) !important; }

.mermaid g.node rect,
.mermaid g.node circle,
.mermaid g.node polygon {
  fill: var(--mermaid-primary-color) !important;
  stroke: var(--mermaid-primary-border) !important;
  stroke-width: 1.5px;
}
.mermaid g.node .label {
  color: var(--mermaid-primary-text) !important;
  fill: var(--mermaid-primary-text) !important;
}
.mermaid g.edgePath path {
  stroke: var(--mermaid-line-color) !important;
  stroke-width: 2px;
}
.mermaid .edgeLabel {
  background-color: var(--mermaid-tertiary-color) !important;
  color: var(--mermaid-primary-text) !important;
}
.mermaid g.cluster rect {
  fill: var(--mermaid-secondary-color) !important;
  stroke: var(--mermaid-primary-border) !important;
}
`;
