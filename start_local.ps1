Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🚀 CareerLens AI - Full-Stack Deployment Launcher      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python and Node
Write-Host "[*] Checking runtime environment..." -ForegroundColor White
python --version
node -v

# 1. Start Backend in separate job/window
Write-Host "[*] Launching Backend API (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python run.py"

# Wait 2 seconds for backend to start
Start-Sleep -Seconds 2

# 2. Start Frontend
Write-Host "[*] Launching Frontend Development Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n✅ CareerLens AI is running!" -ForegroundColor Green
Write-Host "   🌐 Frontend UI: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   🔌 Backend API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   🔍 Differentiator 1: EEOC 4/5ths Fairness Audit Dashboard" -ForegroundColor Yellow
Write-Host "   🔄 Differentiator 2: Self-Improving Match Engine (Feedback Loop)" -ForegroundColor Yellow
