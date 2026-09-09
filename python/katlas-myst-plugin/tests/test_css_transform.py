from katlas_myst_plugin.plugins.css.main import run_css_transform, get_css_content


def test_run_css_transform_is_noop():
    """CSS injection into the AST is deliberately disabled (MyST escapes raw
    <style> tags); the CSS reaches diagrams via themeCSS inside the mermaid
    config instead. The transform must pass the tree through unchanged."""
    data = {
        "type": "root",
        "children": [
            {"type": "heading", "depth": 1, "children": [{"type": "text", "value": "Test"}]}
        ],
    }
    result = run_css_transform(data, {})
    assert result is data
    assert len(result["children"]) == 1


def test_get_css_content_reads_bundled_asset():
    css = get_css_content()
    assert css is not None
    assert ".mermaid" in css
