import os
from unittest.mock import patch, mock_open
from katlas_myst_plugin.plugins.css.main import get_css_content

def test_get_css_content_found():
    """Test retrieving CSS content when file exists."""
    with patch("os.path.exists") as mock_exists, \
         patch("builtins.open", mock_open(read_data="body { color: red; }")):
        
        mock_exists.return_value = True
        content = get_css_content()
        assert content == "body { color: red; }"

def test_get_css_content_missing():
    """Test retrieving CSS content when file missing."""
    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = False
        content = get_css_content()
        assert content is None
