import os
import sys

def get_css_content():
    """Reads the bundled CSS file from the package static directory."""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        css_path = os.path.join(current_dir, "..", "mermaid", "assets", "ktl-mermaid.css")
        
        if os.path.exists(css_path):
            with open(css_path, "r", encoding="utf-8") as f:
                return f.read()
        
        return None
    except Exception as e:
        print(f"[ktl-myst-plugin] Error reading CSS: {e}", file=sys.stderr)
        return None

def run_css_transform(data, config):
    """
    CSS injection is disabled because MyST escapes raw <style> tags in the AST.
    Users should include the plugin's CSS in their myst.yml site options instead.
    """
    return data
