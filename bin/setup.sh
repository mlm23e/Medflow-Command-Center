#!/usr/bin/env bash

set -euo pipefail

echo "== Medflow Setup =="

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"

if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python)"
else
    echo "Error: required prerequisite 'python3' (or 'python') was not found." >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "Error: required prerequisite 'npm' was not found." >&2
    exit 1
fi

for required_file in "$BACKEND_DIR/requirements.txt" "$BACKEND_DIR/.env.example" "$FRONTEND_DIR/package.json"; do
    if [ ! -f "$required_file" ]; then
        echo "Error: required project file '$required_file' was not found." >&2
        exit 1
    fi
done

if ! "$PYTHON_BIN" -m venv --help >/dev/null 2>&1; then
    echo "Error: Python prerequisite 'venv' is unavailable for '$PYTHON_BIN'." >&2
    exit 1
fi

VENV_DIR="$BACKEND_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
else
    echo "Python virtual environment already exists."
fi

if [ -x "$VENV_DIR/bin/python" ]; then
    VENV_PYTHON="$VENV_DIR/bin/python"
elif [ -x "$VENV_DIR/Scripts/python.exe" ]; then
    VENV_PYTHON="$VENV_DIR/Scripts/python.exe"
else
    echo "Error: existing virtual environment has no usable Python executable." >&2
    exit 1
fi

"$VENV_PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"

if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "Created backend/.env from the example; configure it before running the app."
else
    echo "backend/.env already exists; leaving it unchanged."
fi

(cd "$FRONTEND_DIR" && npm install)

echo "Setup complete"