import os
import pytest
from unittest.mock import patch, MagicMock
from katlas_myst_plugin.core.environment import check_environment, get_env_path

def test_check_environment_match(monkeypatch):
    """Test when current environment matches configured one."""
    monkeypatch.setenv("CONDA_DEFAULT_ENV", "ktl-env")
    config = {"python": {"environment": "ktl-env"}}
    
    # Should return silently
    check_environment(config)

@patch("katlas_myst_plugin.core.environment.get_env_path")
@patch("subprocess.run")
def test_check_environment_mismatch_auto(mock_run, mock_get_env_path, monkeypatch):
    """Test auto-management logic when env mismatch."""
    monkeypatch.setenv("CONDA_DEFAULT_ENV", "base")
    config = {"python": {"environment": "ktl-env", "manage": "auto"}}
    
    # Mock get_env_path to return a path (simulating env exists)
    mock_get_env_path.return_value = "/path/to/ktl-env"
    
    # Mock subprocess.run for re-spawning
    # We expect it to exit with the return code of the child process
    mock_run.return_value.returncode = 0
    
    # Mock os.path.exists so it finds the python executable
    with patch("os.path.exists", return_value=True):
        with pytest.raises(SystemExit) as exc:
            check_environment(config)
    
    assert exc.value.code == 0
    # Verify child spawn
    mock_run.assert_called()
    args, kwargs = mock_run.call_args
    assert "/path/to/ktl-env/bin/python" in args[0][0] or "python" in args[0][0]

@patch("subprocess.run")
def test_get_env_path(mock_run):
    """Test parsing of conda env list."""
    mock_stdout = b'{"envs": ["/opt/conda/envs/base", "/opt/conda/envs/ktl-env"]}'
    mock_run.return_value.stdout = mock_stdout.decode()
    mock_run.return_value.returncode = 0
    
    path = get_env_path("ktl-env")
    assert path == "/opt/conda/envs/ktl-env"
    
    path_none = get_env_path("non-existent")
    assert path_none is None
