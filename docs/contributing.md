# Contributing to Katlas MyST Plugin

Thank you for your interest in contributing to the Katlas MyST Plugin! We welcome contributions from the community to help improve the project.

## Development Setup

To set up your development environment, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/katlas/katlas-myst-plugin.git
    cd katlas-myst-plugin
    ```

2.  **Create a virtual environment (Recommended):**
    ```bash
    conda create -n ktl-myst-plugin python=3.11
    conda activate ktl-myst-plugin
    ```

3.  **Install dependencies:**
    ```bash
    pip install -e .[dev]
    pip install pytest pytest-mock
    ```

## Running Tests

We use `pytest` for unit testing. To run the test suite:

```bash
pytest python/katlas-myst-plugin
```

Ensure all tests pass before submitting your changes.

## Project Structure

1.  **`python/katlas-myst-plugin/`**: The main Python package source code.
    *   `src/katlas_myst_plugin/core/`: Core utilities (config, environment).
    *   `src/katlas_myst_plugin/plugins/`: Logic for individual features (Mermaid, CSS).
    *   `src/katlas_myst_plugin/cli.py`: The main command-line interface.
2.  **`wrappers/`**: Thin wrapper scripts for bootstrapping the plugin.
3.  **`docs/`**: Documentation (MyST Markdown).

## Submitting Changes

1.  **Fork the repository** on GitHub.
2.  **Create a new branch** for your feature or bug fix: `git checkout -b my-feature-branch`.
3.  **Make your changes** and commit them with clear, descriptive messages.
4.  **Run tests** to ensure no regressions.
5.  **Push your branch** to your fork: `git push origin my-feature-branch`.
6.  **Open a Pull Request** against the `main` branch of the original repository.

## Coding Standards

*   Follow PEP 8 guidelines for Python code.
*   Write clear and concise comments where necessary.
*   Update documentation if your changes affect user-facing features or configuration.

## License

By contributing, you agree that your contributions will be licensed under the project's [license](#license).
