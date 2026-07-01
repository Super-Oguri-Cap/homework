@echo off
title Project Launcher

echo.
echo ==========================================
echo   Vue3 + Express Full Stack Launcher
echo ==========================================
echo.
echo   Backend API  : http://localhost:3000
echo   Frontend     : http://localhost:5173
echo.

echo [1/2] Starting backend...
start "Backend" /d "%~dp0backend" cmd /k "npm start"

echo [2/2] Starting frontend...
start "Frontend" /d "%~dp0" cmd /k "npm run dev"

echo.
echo ==========================================
echo   Done! Open http://localhost:5173
echo ==========================================
echo.

pause
