@echo off
echo ========================================
echo   LAUNCHING BUYPLOT SAFE (6th SEM)
echo ========================================

:: Start the Backend in a new window
echo [1/2] Starting FastAPI Backend...
start cmd /k "cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

:: Start the Frontend in a new window
echo [2/2] Starting React Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo All systems launching! 
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
pause