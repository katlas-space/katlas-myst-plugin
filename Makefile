.PHONY: clean build test lint check-python build-js fixture-build

clean:
	rm -rf dist
	rm -rf packages/katlas-myst-plugin/dist
	rm -rf python/katlas-myst-plugin/build
	rm -rf python/katlas-myst-plugin/dist
	rm -rf tests/fixtures/simple-world/_build

build-js:
	cd packages/katlas-myst-plugin && npm run build

check-python:
	python3 -m pip install -e ./python/katlas-myst-plugin --break-system-packages
	python3 -m pip install jsonschema pyyaml --break-system-packages

build: build-js check-python

fixture-build: build
	cd tests/fixtures/simple-world && myst build

test: fixture-build
	@echo "Verification complete if build succeeded."
