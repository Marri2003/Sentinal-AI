#!/usr/bin/env bash
set -euo pipefail
if [[ ! -x .venv/bin/python ]]; then
  echo 'Create the environment first. See README_RUN_FIRST.md' >&2
  exit 1
fi
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
