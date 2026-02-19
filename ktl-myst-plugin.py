#!/usr/bin/env python3
import sys
import json
import argparse
import os
import yaml

# Configuration Constants
CONFIG_FILENAME = "ktl-myst-plugin.yml"

# Add the python package to sys.path so we can import it
repo_root = os.path.dirname(os.path.abspath(__file__))
python_pkg_src = os.path.join(repo_root, "python", "katlas-myst-plugin", "src")
sys.path.insert(0, python_pkg_src)

from katlas_myst_plugin.mermaid import run_mermaid_transform
from katlas_myst_plugin.environment import check_environment

def log(msg):
    print(f"[ktl-myst-plugin] {msg}", file=sys.stderr)

def load_config():
    """Load the YAML config file."""
    # Look for config in the current working directory (project root)
    config_path = os.path.join(os.getcwd(), CONFIG_FILENAME)
    
    if not os.path.exists(config_path):
        log(f"WARNING: Config file not found at {config_path}")
        return {}

    try:
        with open(config_path, 'r') as f:
            full_config = yaml.safe_load(f) or {}
            log(f"Loaded config from {config_path}")
            return full_config
    except Exception as e:
        log(f"ERROR: Failed to parse config file: {e}")
        return {}

PLUGIN_SPEC = {
    "name": "Katlas MyST Plugin",
    "directives": [
        {
            "name": "ktl:mermaid",
            "doc": "Mermaid diagram directive",
            "body": {"type": "string"},
            "arg": {"type": "string"}
        }
    ],
    "transforms": [
        {
            "name": "katlas-mermaid",
            "stage": "document"
        }
    ]
}

def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--transform") 
    group.add_argument("--directive") 
    parser.add_argument("--format", default="json")
    
    args, unknown = parser.parse_known_args()

    if args.directive == 'ktl:mermaid':
        # Directive handling:
        # MyST sends the directive info as JSON to stdin.
        # We need to return the AST node(s) for this directive.
        # Based on the user's reference, we should read stdin and return a node.
        
        # The data passed to a directive usually contains:
        # { name, domain, options, body, ... }
        try:
            input_data = sys.stdin.read()
            if input_data.strip():
                data = json.loads(input_data)
                
                # We return a generic 'mermaid' node or a placeholder that our transform handles.
                # Since we have a 'katlas-mermaid' transform that looks for 'mermaid' nodes
                # (or code blocks), we can construct a mermaid node here.
                
                # "body" in the input data is the content of the directive.
                node = {
                    "type": "mermaid",
                    "value": data.get("body", "")
                }
                print(json.dumps([node]))
            else:
                 # Should not happen for a directive call
                 print(json.dumps([]))
        except Exception as e:
            log(f"Error in directive: {e}")
            sys.exit(1)

    elif args.transform:
        # Load global config once
        config = load_config()
        
        # Verify environment
        check_environment(config, base_path=repo_root)

        # The value of args.transform is the transform name (e.g. 'katlas-mermaid')
        try:
            # log(f"Starting transform: {args.transform}")
            input_data = sys.stdin.read()
            if input_data.strip():
                # log(f"Processing transform request: {args.transform}")
                data = json.loads(input_data)
                if args.transform == 'katlas-mermaid':
                    result = run_mermaid_transform(data, config)
                    print(json.dumps(result))
                else:
                    # Should not happen given PLUGIN_SPEC, but good fallback
                    print(json.dumps(data))
            else:
                pass
        except Exception as e:
            log(f"Critical Error during transform: {e}")
            sys.exit(1)
    else:
        print(json.dumps(PLUGIN_SPEC))

if __name__ == "__main__":
    main()
