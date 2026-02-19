import pytest
import os
from unittest.mock import patch, mock_open
from katlas_myst_plugin.plugins.mermaid.main import transform_nodes, create_mermaid_node

# Sample Data
SAMPLE_MERMAID_NODE = {
    "type": "mermaid",
    "value": "graph TD; A-->B"
}

SAMPLE_CODE_BLOCK = {
    "type": "code",
    "lang": "mermaid",
    "value": "graph TD; A-->B"
}

def test_transform_mermaid_node_single():
    """Test transforming a mermaid node (single render)."""
    config = {"theme": "default"}
    settings = {"dualRender": False}
    
    nodes = transform_nodes(SAMPLE_MERMAID_NODE, config, settings)
    assert len(nodes) == 1
    assert nodes[0]["type"] == "mermaid"
    assert "graph TD" in nodes[0]["value"]

def test_transform_mermaid_node_dual():
    """Test transforming a mermaid node (dual render)."""
    config = {"theme": "default"}
    settings = {"dualRender": True}
    
    nodes = transform_nodes(SAMPLE_MERMAID_NODE, config, settings)
    assert len(nodes) == 2
    # Check classes
    # Wait, create_mermaid_node wraps in container div if extra_class provided
    assert nodes[0]["type"] == "container"
    assert nodes[0]["class"] == "mermaid-light"
    assert nodes[1]["type"] == "container"
    assert nodes[1]["class"] == "mermaid-dark"

def test_transform_code_block():
    """Test transforming a code block with lang=mermaid."""
    config = {"theme": "default"}
    settings = {"dualRender": False}
    
    nodes = transform_nodes(SAMPLE_CODE_BLOCK, config, settings)
    assert len(nodes) == 1
    assert nodes[0]["type"] == "mermaid"

def test_config_merging():
    """Test merging global and local config."""
    # This logic is inside create_mermaid_node
    node = {
        "type": "mermaid",
        "value": "---\nconfig:\n  theme: dark\n---\ngraph TD"
    }
    global_config = {"theme": "default", "look": "handDrawn"}
    
    # We can inspect the output value to see if 'handDrawn' persisted and 'dark' overrode 'default'
    # The output value is a string with YAML frontmatter.
    result = create_mermaid_node(node, global_config, None)
    
    assert "theme: dark" in result["value"]
    assert "look: handDrawn" in result["value"]
