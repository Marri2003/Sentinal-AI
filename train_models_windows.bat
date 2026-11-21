@echo off
setlocal
if not exist .venv\Scripts\python.exe (
  echo Create the environment and install requirements first. See README_RUN_FIRST.md
  pause
  exit /b 1
)
.venv\Scripts\python.exe train\train_text_model.py
if errorlevel 1 exit /b 1
.venv\Scripts\python.exe train\train_metadata_model.py
