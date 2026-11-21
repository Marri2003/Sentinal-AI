@echo off
title SentinelAI Full System Launcher
echo ========================================================
echo         SentinelAI Phishing Detection System
echo ========================================================
echo.
echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "SentinelAI Backend (Port 8000)" cmd /k "run_windows.bat"

echo Waiting 3 seconds for backend models to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Launching Frontend Server on http://127.0.0.1:5173 ...
start "SentinelAI Frontend (Port 5173)" cmd /k "run_frontend.bat"

echo.
echo ========================================================
echo  Both Backend and Frontend are launching in separate windows!
echo  Your browser should open to http://127.0.0.1:5173 automatically.
echo ========================================================
pause
