import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Plugin configuration schema. Loaded from `myst-plugin.yml` or
 * (legacy) `ktl-myst-plugin.yml` at or above the current working directory.
 *
 * Both features are opt-in via nested `enabled` flags. The plugin only runs
 * work when flags are true, so the dist is safe to load even if a project
 * doesn't use either feature.
 */
export interface PluginConfig {
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
    embeds?: {
        /**
         * Obsidian-style `![[path#heading]]` and `![[path#^block-id]]` transclusion.
         * Lets authors keep shared diagram files that render in both Obsidian
         * (natively) and MyST (via this transform).
         */
        wikilink?: {
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

/**
 * Back-compat alias. Older code imports this name — keep it exported so a
 * minor-version bump of this plugin doesn't force consumers to rename.
 * @deprecated Use `PluginConfig` instead.
 */
export type KatlasMystPluginConfig = PluginConfig;

const CONFIG_FILENAMES = ['myst-plugin.yml', 'ktl-myst-plugin.yml'];
const MAX_UPWARD_LEVELS = 4;

const PLUGIN_TAG = '[mystmd-plugin-dual-mermaid-and-embed]';

/**
 * Find a plugin config file starting at projectPath and walking upward.
 * Checks `myst-plugin.yml` first, then legacy `ktl-myst-plugin.yml` for
 * backward compatibility with older projects.
 */
export function loadConfig(projectPath: string = '.'): PluginConfig {
    let dir = path.resolve(projectPath);
    for (let i = 0; i <= MAX_UPWARD_LEVELS; i++) {
        for (const name of CONFIG_FILENAMES) {
            const configPath = path.join(dir, name);
            if (fs.existsSync(configPath)) {
                try {
                    const config =
                        (yaml.load(fs.readFileSync(configPath, 'utf8')) as PluginConfig) ?? {};
                    config._configDir = dir;
                    console.log(`${PLUGIN_TAG} loaded config from ${configPath}`);
                    return config;
                } catch (e) {
                    console.error(`${PLUGIN_TAG} error loading ${configPath}:`, e);
                    return {};
                }
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    console.log(`${PLUGIN_TAG} no config found, using defaults`);
    return {};
}
