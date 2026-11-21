@echo off
title SentinelAI Frontend Server
echo ========================================================
echo        SentinelAI Web Frontend (Vercel Replica)
echo ========================================================
echo Starting local frontend on http://127.0.0.1:5173 ...
echo Backend API target: http://127.0.0.1:8000
echo.

if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe run_frontend.py
) else (
    python run_frontend.py
)

pause
