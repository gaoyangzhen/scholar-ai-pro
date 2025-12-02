@echo off
cd /d "%~dp0"

echo Starting Backend Server...
start "Scholar AI Backend" cmd /k "cd backend && "E:\Software\anaconda3\python.exe" backend_server.py"

echo Starting Frontend...
start "Scholar AI Frontend" cmd /k "npm run dev"

echo Project started! You can now access the app at http://localhost:5173
pause
