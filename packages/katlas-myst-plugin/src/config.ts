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
}

export function loadConfig(projectPath: string = '.'): KatlasMystPluginConfig {
    const configPath = path.join(projectPath, 'ktl-myst-plugin.yml');
    const worldConfigPath = path.join(projectPath, 'katlas-world.yml');

    if (fs.existsSync(configPath)) {
        try {
            const fileContents = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(fileContents) as KatlasMystPluginConfig;
            console.log(`[katlas-myst-plugin] Loaded configuration from ${configPath}`);
            return config;
        } catch (e) {
            console.error(`[katlas-myst-plugin] Error loading ${configPath}:`, e);
        }
    }

    // Fallback or additional check for katlas-world.yml (implement later if needed)

    console.log('[katlas-myst-plugin] No configuration found, using defaults.');
    return {};
}
