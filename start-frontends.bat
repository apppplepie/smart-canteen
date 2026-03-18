@echo off
setlocal EnableDelayedExpansion
pushd "%~dp0"
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo Starting admin, screen, mobile...
call :run admin
call :run screen
call :run mobile
echo All three frontends started in separate windows.
pause
popd
endlocal
exit /b 0

:run
set "dir=%~1"
if not exist "%ROOT%\%dir%\package.json" exit /b 0
pushd "%ROOT%\%dir%"
set "PM=npm"
if exist "pnpm-lock.yaml" (where pnpm >nul 2>&1 && set "PM=pnpm")
if not exist "node_modules" (%PM% install)
start "SCS-Frontend-%dir%" cmd /k "call _run_frontend.bat"
popd
exit /b 0
