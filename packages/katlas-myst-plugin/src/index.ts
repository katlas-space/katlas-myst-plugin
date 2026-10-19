import {type MystPlugin, type TransformSpec} from 'myst-common';
import {loadConfig} from './config.js';
import {makeMermaidDirective, makeMermaidTransform} from './mermaid.js';
import {makeWikilinkEmbedTransform} from './wikilink-embed.js';

const PLUGIN_TAG = '[mystmd-plugin-dual-mermaid-and-embed]';

console.log(`${PLUGIN_TAG} loading...`);
const config = loadConfig(process.cwd());

const mermaidEnabled = config.diagrams?.mermaid?.enabled !== false;
if (mermaidEnabled) {
  console.log(`${PLUGIN_TAG} mermaid dual-render enabled`);
}

// Wikilink-embed is opt-in — disabled by default so existing worlds behave as before.
const wikilinkEmbedEnabled = config.embeds?.wikilink?.enabled === true;
if (wikilinkEmbedEnabled) {
  console.log(`${PLUGIN_TAG} wikilink-embed enabled (![[path#heading]] transclusion)`);
}

const transforms: TransformSpec[] = [];
if (wikilinkEmbedEnabled) {
  // Run BEFORE mermaid: the wikilink transform resolves `![[x]]` into code
  // nodes that the mermaid transform then themes.
  transforms.push(makeWikilinkEmbedTransform(config._configDir ?? process.cwd()));
}
if (mermaidEnabled) {
  transforms.push(makeMermaidTransform(config));
}

const plugin: MystPlugin = {
  name: 'mystmd-plugin-dual-mermaid-and-embed',
  directives: mermaidEnabled ? [makeMermaidDirective()] : [],
  roles: [],
  transforms,
};

export default plugin;
