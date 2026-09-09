import json
import os
import subprocess
import sys


def log(msg):
    print(f"[ktl-myst-plugin] {msg}", file=sys.stderr)


def _envs_from_registry():
    """Read conda's env registry file (~/.conda/environments.txt).

    This is how we avoid shelling out to `conda env list` — a conda CLI
    invocation costs ~1-2s and >100MB, and MyST invokes executable plugins
    once per page transform, in parallel. Reading the registry is ~free.
    """
    registry = os.path.expanduser(os.path.join("~", ".conda", "environments.txt"))
    try:
        with open(registry, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]
    except OSError:
        return []


def get_env_path(env_name):
    """Find the path of a conda environment by name. Returns path or None."""
    for path in _envs_from_registry():
        if os.path.basename(path) == env_name:
            return path
    # Fallback: the conda CLI (slow — only reached when the registry file is
    # missing or does not list the env).
    try:
        result = subprocess.run(
            ["conda", "env", "list", "--json"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            for path in json.loads(result.stdout).get("envs", []):
                if os.path.basename(path) == env_name:
                    return path
    except Exception:
        pass
    return None


def check_environment(config, base_path=None):
    """Ensure we run in the configured environment (manage: auto only).

    Design constraints, learned the hard way (2026-09-08 postmortem):
    - MyST spawns executable plugins once per page transform, IN PARALLEL.
      Anything expensive here is multiplied by the page count.
    - This function must therefore never create environments: dozens of
      concurrent `conda env create` runs hung a 16GB machine. If the env is
      missing we fail loudly with the command to run, instead of creating it.
    - `manage: manual` (the default) does no subprocess work at all.
    """
    python_config = config.get("python", {})
    expected_env = python_config.get("environment", "ktl-env")
    manage_mode = python_config.get("manage", "manual")

    current_env = os.environ.get("CONDA_DEFAULT_ENV")
    if current_env == expected_env:
        return
    if manage_mode != "auto":
        return

    env_path = get_env_path(expected_env)
    if not env_path:
        log(
            f"ERROR: conda environment '{expected_env}' not found. Auto-creation is "
            f"deliberately not supported (parallel invocations would each try to "
            f"create it). Create it once, then re-run:\n"
            f"    conda env create -f environment.yml -n {expected_env}"
        )
        sys.exit(1)

    python_exe = os.path.join(env_path, "bin", "python")
    if not os.path.exists(python_exe):
        python_exe = os.path.join(env_path, "python.exe")  # Windows layout
    if not os.path.exists(python_exe):
        log(f"ERROR: Python executable not found under {env_path}")
        sys.exit(1)

    log(f"Re-spawning in environment '{expected_env}' at {env_path}...")
    cmd = [python_exe, sys.argv[0]] + sys.argv[1:]
    child_env = os.environ.copy()
    child_env["CONDA_DEFAULT_ENV"] = expected_env
    try:
        sys.stdout.flush()
        sys.stderr.flush()
        ret = subprocess.run(
            cmd, stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr, env=child_env
        )
        sys.exit(ret.returncode)
    except Exception as e:
        log(f"ERROR: Failed to re-spawn in conda environment: {e}")
        sys.exit(1)
