@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ============================================================
echo   🤗  SENTINELAI — HUGGING FACE GRADIO SPACE DEPLOYER
echo ============================================================
echo.
echo This script deploys your FastAPI backend + trained models (1.1GB)
echo to a 100%% FREE Hugging Face Gradio Space (16 GB RAM + Tesseract OCR).
echo (No credit card, no phone verification, and no Docker required!)
echo.
echo ------------------------------------------------------------
echo STEP 1: CREATE YOUR GRADIO SPACE ON HUGGING FACE
echo ------------------------------------------------------------
echo If you have not created your space yet:
echo   1. Open: https://huggingface.co/new-space
echo   2. Name: sentinelai-backend
echo   3. License: MIT
echo   4. Space SDK: Select GRADIO
echo   5. Hardware: CPU Basic (2 vCPU, 16 GB RAM) - Free
echo   6. Visibility: Public
echo   7. Click 'Create Space'
echo.
echo ------------------------------------------------------------
echo STEP 2: ENTER YOUR SPACE URL
echo ------------------------------------------------------------
set /p HF_URL="Enter your Space Git URL (e.g. https://huggingface.co/spaces/YOUR_USERNAME/sentinelai-backend): "

if "%HF_URL%"=="" (
    echo [ERROR] No Space URL provided. Aborting.
    pause
    exit /b 1
)

echo.
echo ------------------------------------------------------------
echo STEP 3: PREPARING GRADIO DEPLOYMENT PACKAGE
echo ------------------------------------------------------------

:: 1. Ensure Git LFS is active
git lfs install
git lfs track "saved_models/*.pth"
git lfs track "*.pth"

:: 2. Configure remote 'hf'
git remote remove hf 2>nul
git remote add hf %HF_URL%
echo [✓] Remote 'hf' set to: %HF_URL%

:: 3. Create or switch to huggingface deployment branch
git branch -D huggingface 2>nul
git checkout -b huggingface

:: 4. Copy Hugging Face README with Gradio YAML frontmatter
copy /y hf_space_readme.md README.md >nul

:: 5. Force-add backend files, metadata models, tokenizer, and microservice code
echo [✓] Staging backend files, lightweight models, and tokenizer...
git add -f saved_models/metadata_model.pth
git add -f saved_models/metadata_scaler.pkl
git add -f saved_models/text_tokenizer/
git add app.py packages.txt requirements.txt config.py
git add app/ models/ fusion/ utils/ README.md .gitattributes

:: 6. Commit deployment
git commit -m "deploy: Hugging Face Gradio Space with FastAPI, XLM-RoBERTa & Tesseract OCR"

echo.
echo ------------------------------------------------------------
echo STEP 4: PUSHING TO HUGGING FACE SPACES
echo ------------------------------------------------------------
echo When prompted for credentials:
echo   - Username: Your Hugging Face Username
echo   - Password: Your Hugging Face User Access Token (with WRITE access)
echo     (Get token from: https://huggingface.co/settings/tokens)
echo.
git push -u hf huggingface:main --force

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed! Please check your Space URL and write token.
) else (
    echo.
    echo ============================================================
    echo [🎉 SUCCESS] Backend pushed to Hugging Face Spaces!
    echo ============================================================
    echo Hugging Face is now installing Tesseract OCR and launching the app.
    echo Check build progress at your Space page on huggingface.co.
    echo.
    echo Once built (Running status), your live API endpoint will be:
    echo   https://YOUR_USERNAME-sentinelai-backend.hf.space
    echo.
    echo Update your Vercel Environment Variable:
    echo   VITE_API_BASE_URL = https://YOUR_USERNAME-sentinelai-backend.hf.space
    echo ============================================================
)

:: Switch back to master/main branch so local workspace remains clean
git checkout master 2>nul || git checkout main 2>nul
echo.
pause
