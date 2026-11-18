@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-web.ps1"
if errorlevel 1 (
  echo.
  echo [FAILED] sync did not finish, see the error above.
  pause
  exit /b 1
)
echo.
pause
