import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    // Bundle runtime deps: the built .mjs is loaded directly by mystmd from
    // documentation projects that have no node_modules of their own.
    noExternal: ['js-yaml'],
    outExtension() {
        return {
            js: '.mjs',
        };
    },
});
