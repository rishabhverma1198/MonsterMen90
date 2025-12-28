@echo off
chcp 65001 >nul
title Monster Men90 Platform - Quick Start

echo.
echo 🚀 MONSTER MEN90 - SIMPLE START
echo ================================
echo.

echo 🔧 Installing dependencies (if needed)...
if not exist "node_modules" (
    echo Installing root dependencies...
    npm install >nul 2>&1
)

if not exist "MonsterBackend\node_modules" (
    echo Installing backend dependencies...
    cd MonsterBackend && npm install >nul 2>&1 && cd ..
)

if not exist "MonsterFrontend\node_modules" (
    echo Installing frontend dependencies...
    cd MonsterFrontend && npm install >nul 2>&1 && cd ..
)

echo.
echo ✅ All dependencies ready!
echo.
echo 🌐 Starting both servers...
echo.
echo 📊 URLs:
echo    • Frontend: http://localhost:5173
echo    • Backend:  http://localhost:3001
echo    • Admin:    http://localhost:5173/admin/login
echo.
echo ⚠️  Keep this window open to stop servers (Ctrl+C)
echo.

npm run dev

echo.
echo 🛑 Servers stopped.
pause