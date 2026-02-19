import pytest
import sys
import json
from unittest.mock import patch, MagicMock
from katlas_myst_plugin.cli import main

@patch("sys.exit")
@patch("sys.stdin")
@patch("builtins.print")
def test_cli_directive(mock_print, mock_stdin, mock_exit):
    """Test directive mode argument."""
    test_args = ["cli.py", "--directive", "ktl:mermaid"]
    mock_stdin.read.return_value = json.dumps({"body": "graph TD"})
    
    with patch.object(sys, "argv", test_args):
        main()
        
    # Check output
    mock_print.assert_called()
    output = mock_print.call_args[0][0]
    data = json.loads(output)
    assert len(data) == 1
    assert data[0]["type"] == "mermaid"

@patch("sys.exit")
@patch("sys.stdin")
@patch("builtins.print")
@patch("katlas_myst_plugin.cli.check_environment")
@patch("katlas_myst_plugin.cli.load_config")
@patch("katlas_myst_plugin.cli.run_mermaid_transform")
def test_cli_transform(mock_transform, mock_load, mock_check, mock_print, mock_stdin, mock_exit):
    """Test transform mode argument."""
    test_args = ["cli.py", "--transform", "katlas-mermaid"]
    mock_stdin.read.return_value = json.dumps({"type": "root"})
    mock_transform.return_value = {"type": "root", "transformed": True}
    
    with patch.object(sys, "argv", test_args):
        main()
    
    mock_check.assert_called()
    mock_transform.assert_called()
    
    output = mock_print.call_args[0][0]
    data = json.loads(output)
    assert data.get("transformed") is True

@patch("builtins.print")
def test_cli_spec(mock_print):
    """Test default spec output."""
    test_args = ["cli.py"]
    with patch.object(sys, "argv", test_args):
        main()
        
    mock_print.assert_called()
    output = mock_print.call_args[0][0]
    spec = json.loads(output)
    assert spec["name"] == "Katlas MyST Plugin"
    assert "katlas-mermaid" in [t["name"] for t in spec["transforms"]]
