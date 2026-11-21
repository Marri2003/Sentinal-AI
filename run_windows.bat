@echo off
setlocal
if not exist .venv\Scripts\python.exe (
  echo Create the environment first. See README_RUN_FIRST.md
  pause
  exit /b 1
)
if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" (
  set "PATH=%PATH%;C:\Program Files\Tesseract-OCR"
  set "TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe"
)

.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
