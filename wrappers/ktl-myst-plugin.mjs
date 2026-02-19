#!/usr/bin/env node

/**
 * Katlas MyST Plugin (JS Wrapper)
 * 
 * This script bootstraps the JS plugin implementation.
 * Currently, it delegates to the installed package in node_modules.
 */

import { existsSync } from 'fs';
import { resolve, join } from 'path';

async function main() {
    // Check for local installation
    const localPkg = resolve(process.cwd(), 'node_modules', 'katlas-myst-plugin');

    if (existsSync(localPkg)) {
        try {
            // Import the installed package
            const plugin = await import('katlas-myst-plugin');
            if (plugin.run) {
                await plugin.run();
            } else {
                console.error("Plugin entry point invalid.");
            }
        } catch (e) {
            console.error("Failed to load plugin:", e);
            process.exit(1);
        }
    } else {
        console.error("[ktl-myst-plugin] Error: 'katlas-myst-plugin' not found in node_modules.");
        console.error("Please run: npm install katlas-myst-plugin");
        process.exit(1);
    }
}

main();
