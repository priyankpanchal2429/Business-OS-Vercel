@echo off
TITLE Business-OS Launcher
echo ===================================================
echo    STARTING BUSINESS-OS
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server...
start "Business-OS Backend" cmd /k "cd server && npm start"

echo.
echo [2/2] Starting Frontend Client...
start "Business-OS Client" cmd /k "cd client && npm run dev"

echo.
echo ===================================================
echo    Services Started
echo ===================================================
echo.
echo Please do not close the other terminal windows.
echo.
pause
