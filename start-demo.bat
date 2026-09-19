@echo off
chcp 65001 >nul
title Smart Canteen - One-click Public Demo Tunnel
cd /d "%~dp0"

echo ============================================================
echo   Smart Canteen System - One-click Public Demo
echo   (local server + Cloudflare public tunnel + QR page)
echo ============================================================
echo.

rem ---- locate node ----
set "NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE=%ProgramFiles%\nodejs\node.exe"
  ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
  ) else (
    echo   [ERROR] Node.js not found.
    echo   Please install Node.js 18 or newer: https://nodejs.org
    echo.
    pause
    exit /b 1
  )
)

rem ---- sanity check: must run from the repo root ----
if not exist "backend\scripts\share.js" (
  echo   [ERROR] backend\scripts\share.js not found.
  echo   Put this file in the repo root folder and run it again.
  echo.
  pause
  exit /b 1
)

rem ---- start: local server + tunnel + open the QR projector page ----
rem   extra args are forwarded, e.g.  start-demo.bat --port 8090
"%NODE%" "backend\scripts\share.js" --open %*

echo.
echo   Tunnel stopped. The public URL is no longer reachable.
echo   Press any key to close this window...
pause >nul
