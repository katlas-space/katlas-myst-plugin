import os
import yaml
import pytest
from katlas_myst_plugin.core.config import load_config

def test_load_config_success(tmp_path):
    """Test loading a valid config file."""
    config_file = tmp_path / "ktl-myst-plugin.yml"
    config_data = {
        "diagrams": {"mermaid": {"theme": "forest"}}
    }
    with open(config_file, "w") as f:
        yaml.dump(config_data, f)
    
    # Run
    loaded = load_config(base_path=str(tmp_path))
    # Pop internal key before comparison
    loaded.pop("_config_dir", None)
    assert loaded == config_data

def test_load_config_missing(tmp_path):
    """Test loading a missing config file returns empty dict."""
    loaded = load_config(base_path=str(tmp_path))
    assert loaded == {}

def test_load_config_invalid(tmp_path):
    """Test handling of invalid YAML."""
    config_file = tmp_path / "ktl-myst-plugin.yml"
    with open(config_file, "w") as f:
        f.write("invalid: [yaml: content") # Malformed
    
    loaded = load_config(base_path=str(tmp_path))
    # Should handle error and return empty dict (and log error)
    assert loaded == {}
