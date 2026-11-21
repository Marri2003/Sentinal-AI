#!/bin/bash
# S entinelAI GitHub Setup Script

echo "🔧 Setting up SentinelAI repository..."

# 1. Initialize Git if not already done
if [ ! -d ".git" ]; then
    git init
    echo "✓ Git repository initialized"
fi

# 2. Setup Git LFS
git lfs install
echo "✓ Git LFS installed"

# 3. Track large model files with Git LFS
git lfs track "saved_models/*.pth"
git lfs track "saved_models/*.pkl"
git lfs track "*.pth"
git lfs track "*.pkl"
echo "✓ Git LFS tracking configured for model files"

# 4. Add remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/SentinelAI-Model.git
echo "✓ Remote repository added"

# 5. Add all files (respecting .gitignore)
git add .
echo "✓ Files staged for commit (ignoring heavy models & scratch folders)"

# 6. Initial commit
git commit -m "Initial commit: SentinelAI Multi-Modal Phishing Detection System

- Text analysis pipeline (XLM-RoBERTa)
- Metadata analysis pipeline (FFNN)
- Image analysis pipeline (OCR + MobileNetV2)
- Decision fusion module with dynamic weight redistribution
- FastAPI backend with /predict and /justify endpoints
- Multilingual support (English, Hindi, Telugu)
- 53 safe patterns + 10 phishing patterns
- Trained models tracked with Git LFS"

echo "✓ Initial commit created"

# 7. Push to GitHub
echo "📤 Ready to push to GitHub"
echo "Run: git push -u origin main"
echo ""
echo "⚠️  IMPORTANT: Replace YOUR_USERNAME with your GitHub username in:"
echo "    - setup_git.sh (line 20)"
echo "    - README.md"

