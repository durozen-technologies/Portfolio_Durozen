@echo off
setlocal
cd /d "%~dp0"

echo =======================================================
echo   Starting DUROZEN Creative Portfolio and Admin Portal
echo =======================================================

set PYTHON_CMD=python
if exist "backend\venv\Scripts\python.exe" (
    set PYTHON_CMD=backend\venv\Scripts\python.exe
)

echo 1. Starting FastAPI Backend Server (Port 8000)...
start "DUROZEN Backend API" cmd /k "%PYTHON_CMD% backend\run.py"

echo 2. Starting Next.js Frontend Server (Port 3000)...
start "DUROZEN Frontend Website" cmd /k "cd frontend && npm run dev"

echo Waiting for servers to initialize...
timeout /t 3 /nobreak > nul

echo Opening Website and Admin Portal in your default browser...
start http://localhost:3000
start http://localhost:3000/admin

echo.
echo Both servers are running!
echo Frontend: http://localhost:3000
echo Admin:    http://localhost:3000/admin
echo Backend:  http://localhost:8000
echo.

