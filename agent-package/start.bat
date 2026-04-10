@echo off
title Agent Control Panel - Running

echo.
echo ================================================================
echo   Agent Control Panel - PC Agent
echo ================================================================
echo.
echo   Close this window to stop the agent.
echo   Web: https://agent-control-panel-phi.vercel.app
echo.
echo ================================================================
echo.

if not exist .env (
    echo [ERROR] .env file not found.
    echo         Run install.bat first.
    echo.
    pause
    exit /b 1
)

npx tsx src/index.ts

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Agent stopped unexpectedly.
    echo.
    pause
)
