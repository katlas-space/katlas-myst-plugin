import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface KatlasMystPluginConfig {
    python?: {
        environment?: string;
        manage?: string;
    };
    diagrams?: {
        mermaid?: {
            enabled?: boolean;
            theme?: string;
            global_config?: string;
            [key: string]: unknown;
        };
        kroki?: {
            enabled?: boolean;
        };
    };
    widgets?: {
        enabled?: boolean;
    };
    utils?: {
        [key: string]: boolean | object;
    };
    /** Directory the config file was found in (for resolving relative paths). */
    _configDir?: string;
}

const CONFIG_FILENAME = 'ktl-myst-plugin.yml';
const MAX_UPWARD_LEVELS = 4;

/**
 * Find ktl-myst-plugin.yml starting at projectPath and walking upward —
 * worlds build with cwd at the world directory while the config lives at
 * the estate root (e.g. katlas-worlds/ktl-myst-plugin.yml).
 */
export function loadConfig(projectPath: string = '.'): KatlasMystPluginConfig {
    let dir = path.resolve(projectPath);
    for (let i = 0; i <= MAX_UPWARD_LEVELS; i++) {
        const configPath = path.join(dir, CONFIG_FILENAME);
        if (fs.existsSync(configPath)) {
            try {
                const config =
                    (yaml.load(fs.readFileSync(configPath, 'utf8')) as KatlasMystPluginConfig) ?? {};
                config._configDir = dir;
                console.log(`[katlas-myst-plugin] Loaded configuration from ${configPath}`);
                return config;
            } catch (e) {
                console.error(`[katlas-myst-plugin] Error loading ${configPath}:`, e);
                return {};
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    console.log('[katlas-myst-plugin] No configuration found, using defaults.');
    return {};
}
