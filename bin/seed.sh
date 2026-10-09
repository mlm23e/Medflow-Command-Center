#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
RESET=false
CONFIRM_RESET=true

usage() {
    echo "Usage: bin/seed.sh [--reset] [--yes]" >&2
}

while (($#)); do
    case "$1" in
        --reset) RESET=true ;;
        --yes) CONFIRM_RESET=false ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Error: unknown option '$1'." >&2; usage; exit 2 ;;
    esac
    shift
done

if [ "$CONFIRM_RESET" = false ] && [ "$RESET" = false ]; then
    echo "Error: --yes can only be used with --reset." >&2
    usage
    exit 2
fi

if [ "$RESET" = true ] && [ "$CONFIRM_RESET" = true ]; then
    echo "Warning: --reset deletes the demo hospitals and their equipment, work orders, and reports."
    if ! read -r -p "Continue? Type 'yes' to confirm: " answer; then
        echo "Reset cancelled: confirmation was not received." >&2
        exit 1
    fi
    if [ "$answer" != "yes" ]; then
        echo "Reset cancelled."
        exit 1
    fi
fi

if [ -x "$BACKEND_DIR/.venv/bin/python" ]; then
    PYTHON="$BACKEND_DIR/.venv/bin/python"
elif [ -x "$BACKEND_DIR/.venv/Scripts/python.exe" ]; then
    PYTHON="$BACKEND_DIR/.venv/Scripts/python.exe"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON="$(command -v python3)"
else
    echo "Error: Python was not found. Run bin/setup.sh first or install Python 3." >&2
    exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
    echo "Error: required prerequisite 'psql' was not found." >&2
    exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo "Error: DATABASE_URL is missing and backend/.env does not exist." >&2
        exit 1
    fi
    DATABASE_URL="$(cd "$BACKEND_DIR" && "$PYTHON" -c 'from dotenv import dotenv_values; print(dotenv_values(".env").get("DATABASE_URL", ""))')"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not configured in the environment or backend/.env." >&2
    exit 1
fi
export DATABASE_URL

if ! PSQL_URL="$("$PYTHON" -c 'import os; from sqlalchemy.engine import make_url; url = make_url(os.environ["DATABASE_URL"]); print(url.set(drivername="postgresql").render_as_string(hide_password=False))' 2>/dev/null)"; then
    echo "Error: DATABASE_URL is invalid or the database URL dependencies are unavailable." >&2
    exit 1
fi

if ! psql "$PSQL_URL" -X -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null 2>&1; then
    echo "Error: database is unreachable or authentication failed; check DATABASE_URL and database availability." >&2
    exit 1
fi

cd "$BACKEND_DIR"
if ! "$PYTHON" -m app.scripts.create_tables; then
    echo "Error: database table creation failed." >&2
    exit 1
fi

if [ "$RESET" = true ]; then
    if ! psql "$PSQL_URL" -X -v ON_ERROR_STOP=1 -c "DELETE FROM hospitals WHERE name IN ('Ascension - Florida - Pensacola', 'Cedars - New York - Poughkeepsie', 'Shriners - Wisconsin - Madison', 'Community Health - Montana - Great Falls')"; then
        echo "Error: could not clear demo seed data." >&2
        exit 1
    fi
fi

if ! "$PYTHON" -m app.scripts.seed_users; then
    echo "Error: demo user seeding failed." >&2
    exit 1
fi

if ! psql "$PSQL_URL" -X -v ON_ERROR_STOP=1 -f "$REPO_ROOT/db/sql/DML.sql"; then
    echo "Error: business data seeding failed." >&2
    exit 1
fi

echo "Seed complete."