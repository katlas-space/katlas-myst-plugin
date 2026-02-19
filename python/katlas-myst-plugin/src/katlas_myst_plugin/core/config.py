import os
import sys
import yaml

CONFIG_FILENAME = "ktl-myst-plugin.yml"

def log(msg):
    print(f"[ktl-myst-plugin] {msg}", file=sys.stderr)

def load_config(base_path=None):
    """Load the YAML config file."""
    # Look for config in the current working directory (project root) by default
    path = base_path if base_path else os.getcwd()
    config_path = os.path.join(path, CONFIG_FILENAME)
    
    if not os.path.exists(config_path):
        # log(f"WARNING: Config file not found at {config_path}")
        return {}

    try:
        with open(config_path, 'r') as f:
            full_config = yaml.safe_load(f) or {}
            log(f"Loaded config from {config_path}")
            return full_config
    except Exception as e:
        log(f"ERROR: Failed to parse config file: {e}")
        return {}
