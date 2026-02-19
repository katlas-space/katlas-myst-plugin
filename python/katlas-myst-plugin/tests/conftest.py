import sys
import os
import pytest

# Add src to path so we can import the package under test
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

@pytest.fixture
def mock_env(monkeypatch):
    """Mock environment variables."""
    monkeypatch.setenv("CONDA_DEFAULT_ENV", "ktl-test-env")

@pytest.fixture
def sample_config():
    return {
        "diagrams": {
            "mermaid": {
                "theme": "forest"
            }
        },
        "python": {
            "environment": "ktl-test-env"
        }
    }
