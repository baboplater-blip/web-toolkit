@echo off
chcp 65001 >nul
title Agent Control Panel - 설치

echo.
echo ================================================================
echo   Agent Control Panel - PC Agent 설치
echo ================================================================
echo.

:: Node.js 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo        https://nodejs.org 에서 LTS 버전을 설치해주세요.
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js %node -v% 확인 완료
echo.

:: npm install
echo [2/3] 패키지 설치 중...
call npm install --silent
if %errorlevel% neq 0 (
    echo [오류] 패키지 설치 실패
    pause
    exit /b 1
)
echo       패키지 설치 완료
echo.

:: PC 등록 (setup.ts가 이름 입력 + .env 생성까지 처리)
echo [3/3] PC 등록
npx tsx src/setup.ts

pause
