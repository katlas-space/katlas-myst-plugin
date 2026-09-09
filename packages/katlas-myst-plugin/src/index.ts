import {type MystPlugin} from 'myst-common';
import {loadConfig} from './config.js';
import {makeMermaidDirective, makeMermaidTransform} from './mermaid.js';

console.log('[katlas-myst-plugin] Loading plugin (in-process javascript variant)...');
const config = loadConfig(process.cwd());

const mermaidEnabled = config.diagrams?.mermaid?.enabled !== false;
if (mermaidEnabled) {
  console.log('[katlas-myst-plugin] Mermaid support enabled (dual light/dark rendering)');
}

const plugin: MystPlugin = {
  name: 'katlas-myst-plugin',
  directives: mermaidEnabled ? [makeMermaidDirective()] : [],
  roles: [],
  transforms: mermaidEnabled ? [makeMermaidTransform(config)] : [],
};

export default plugin;
