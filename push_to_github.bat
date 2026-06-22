@echo off
cd /d "d:\Tekworks\startup-idea-validator\startup"

echo === Startup Accelerator AI - Git Push Script ===
echo.

REM Initialize git if not already done
if not exist ".git" (
    git init
    echo Git initialized.
)

REM Set remote
git remote remove origin 2>nul
git remote add origin https://github.com/AnveshAnnepaga/startup.git
echo Remote set to: https://github.com/AnveshAnnepaga/startup.git

REM Configure git user (update if needed)
git config user.email "anvesh@example.com"
git config user.name "AnveshAnnepaga"

REM Stage all files (gitignore will exclude venv, node_modules, .env, chroma_db)
git add .
echo Files staged.

REM Commit
git commit -m "chore: prep for Hugging Face and Vercel deployment

- Replaced hardcoded localhost APIs with NEXT_PUBLIC_API_URL
- Swapped PPTX exporter for ReportLab PDF pitch deck generator
- Generated Hugging Face Dockerfile
- Sanitized Content-Disposition filenames"

echo Committed.

REM Push to GitHub
git branch -M main
git push -u origin main --force

echo.
echo === Done! Code pushed to https://github.com/AnveshAnnepaga/startup ===
pause
