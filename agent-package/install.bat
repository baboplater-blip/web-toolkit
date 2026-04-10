@echo off
title Agent Control Panel - Install

echo.
echo ================================================================
echo   Agent Control Panel - PC Agent Install
echo ================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo         Download from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Node.js OK
echo.

echo [2/3] Installing packages...
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo       Done.
echo.

echo [3/3] Register this PC
npx tsx src/setup.ts

pause
