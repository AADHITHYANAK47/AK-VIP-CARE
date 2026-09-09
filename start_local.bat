@echo off
echo ==========================================================
echo    CareerLens AI - Full-Stack Deployment Launcher
echo ==========================================================

echo [*] Starting Backend Service on port 8000...
start cmd /k "cd backend && python run.py"

timeout /t 2 /nobreak >nul

echo [*] Starting Frontend Server on port 5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo CareerLens AI services launched!
echo Frontend: http://localhost:5173
echo Backend Docs: http://localhost:8000/docs
pause
