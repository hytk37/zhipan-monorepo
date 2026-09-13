@echo off
cd /d "%~dp0"
echo Starting HX API Server...
echo.
node api-server.js
echo.
echo Server stopped. Press any key to exit...
pause >nul
