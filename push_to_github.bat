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
git commit -m "feat: complete startup accelerator AI platform

- 7-agent LangGraph pipeline (Intake, Validation, Market, Founder, Strategy, Investor, Report)
- Context-aware investor negotiation with full evaluation context
- Robust JSON parsing for LLM responses
- Fixed config.py to remove unused DB/Redis dependencies
- Improved all agent system prompts with structured formatting
- Founder analysis with video fallback to written pitch
- FastAPI backend with /upload /evaluate /negotiate endpoints
- Next.js 15 frontend with Zustand state management
- ChromaDB RAG for market intelligence
- Auto-generated PowerPoint pitch deck
- Comprehensive README and .gitignore"

echo Committed.

REM Push to main branch
git branch -M main
git push -u origin main --force

echo.
echo === Done! Code pushed to https://github.com/AnveshAnnepaga/startup ===
pause
