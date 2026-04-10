@echo off
chcp 65001 >nul
title Agent Control Panel - 실행 중

echo.
echo ================================================================
echo   Agent Control Panel - PC Agent
echo ================================================================
echo.
echo   이 창을 닫으면 Agent가 중지됩니다.
echo   웹: https://agent-control-panel-phi.vercel.app
echo.
echo ================================================================
echo.

:: .env 파일 확인
if not exist .env (
    echo [오류] .env 파일이 없습니다.
    echo        install.bat 을 먼저 실행해주세요.
    echo.
    pause
    exit /b 1
)

:: Agent 실행
npx tsx src/index.ts

:: 에러로 종료된 경우
if %errorlevel% neq 0 (
    echo.
    echo [오류] Agent가 비정상 종료되었습니다.
    echo        위 에러 메시지를 확인해주세요.
    echo.
    pause
)
