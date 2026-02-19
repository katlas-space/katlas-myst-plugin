import { type MystPlugin } from 'myst-common';
import { loadConfig } from './config.js';


console.log('[katlas-myst-plugin] Loading plugin...');
const config = loadConfig(process.cwd());

if (config.diagrams?.mermaid?.enabled) {
    console.log('[katlas-myst-plugin] Mermaid support enabled (Skeleton)');
    // Register mermaid directives/roles here later
}

if (config.python?.environment) {
    console.log(`[katlas-myst-plugin] Python environment specified: ${config.python.environment}`);
    // Python env validation hook here later
}




const plugin: MystPlugin = {
    name: 'katlas-myst-plugin',
    directives: [],
    roles: [],
    transforms: [],
};

export default plugin;
