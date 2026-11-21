@echo off
setlocal
chcp 65001 >nul

echo ============================================================
echo    🛡️  SENTINELAI GITHUB REPOSITORY INITIALIZER
echo ============================================================
echo.

:: 1. Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH!
    echo Please install Git for Windows from: https://git-scm.com/download/win
    echo (Or use GitHub Desktop: https://desktop.github.com/)
    echo.
    pause
    exit /b 1
)

:: 2. Initialize Git if needed
if not exist ".git" (
    echo [1/4] Initializing Git repository...
    git init
    git branch -M main
) else (
    echo [1/4] Git repository already initialized.
)

:: 3. Stage all files respecting .gitignore
echo [2/4] Staging files (respecting .gitignore: ignoring .venv, 1.1GB models, binaries)...
git add .

:: 4. Commit
echo [3/4] Creating commit...
git commit -m "feat: SentinelAI Complete Project (FastAPI backend + clean React 18 frontend)"

echo.
echo [4/4] Commit ready!
echo.
echo ============================================================
echo NEXT STEPS TO PUSH TO GITHUB:
echo ============================================================
echo 1. Create a new repository on https://github.com/new
echo    (Name it e.g. "SentinelAI" or "SentinelAI_Complete_Project")
echo    (Do NOT check "Add README" or ".gitignore" on GitHub)
echo.
echo 2. Run these two commands:
echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
echo    git push -u origin main
echo ============================================================
echo.
pause
