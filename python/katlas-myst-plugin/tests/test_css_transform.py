import pytest
from katlas_myst_plugin.plugins.css.main import run_css_transform

def test_run_css_transform_ast():
    """Test that the CSS transform injects the correct node type into the AST."""
    # Mock data (AST root)
    data = {
        "type": "root",
        "children": [
            {"type": "heading", "depth": 1, "children": [{"type": "text", "value": "Test"}]}
        ]
    }
    config = {}
    
    # Run transform
    # Note: This will actually read the local ktl-mermaid.css
    result = run_css_transform(data, config)
    
    # Verify injection
    assert len(result["children"]) == 2
    style_node = result["children"][0]
    
    # We want to ensure this is treated as RAW HTML and not text
    assert style_node["type"] in ["html", "raw"]
    if style_node["type"] == "raw":
        assert style_node["format"] == "html"
    
    assert "<style>" in style_node["value"]
    assert "</style>" in style_node["value"]
