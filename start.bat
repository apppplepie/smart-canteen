@echo off
setlocal EnableDelayedExpansion
pushd "%~dp0"
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo ========================================
echo   SCS One-Click Start
echo ========================================
echo.

call :ensure_and_start_backend
call :ensure_and_start_ai
call :ensure_and_start_frontend admin
call :ensure_and_start_frontend screen
call :ensure_and_start_frontend mobile

echo.
echo All services started in separate windows. Close window to stop.
pause
popd
endlocal
exit /b 0

:ensure_and_start_backend
echo [Backend] checking...
if not exist "%ROOT%\backend\pom.xml" (
    echo [Backend] pom.xml not found, skip.
    exit /b 0
)
pushd "%ROOT%\backend"
where mvn >nul 2>&1
if errorlevel 1 (
    echo [Backend] mvn not in PATH, skip.
    popd
    exit /b 0
)
if not exist "target" (
    echo [Backend] first run: mvn compile...
    mvn compile -q
    if !errorlevel! neq 0 (
        echo [Backend] mvn install -DskipTests...
        mvn install -DskipTests -q
    )
)
echo [Backend] starting Spring Boot...
start "SCS-Backend" cmd /k "call _run_backend.bat"
popd
exit /b 0

:ensure_and_start_ai
echo [AI-Service] checking...
if not exist "%ROOT%\ai-service\requirements.txt" (
    echo [AI-Service] requirements.txt not found, skip.
    exit /b 0
)
pushd "%ROOT%\ai-service"
set "PYCMD=python"
where python >nul 2>&1
if errorlevel 1 (
    set "PYCMD=py"
    where py >nul 2>&1
    if errorlevel 1 (
        echo [AI-Service] Python not found, skip.
        popd
        exit /b 0
    )
)
%PYCMD% -c "import uvicorn" 2>nul
if !errorlevel! neq 0 (
    echo [AI-Service] pip install -r requirements.txt...
    %PYCMD% -m pip install -r requirements.txt -q
)
echo [AI-Service] starting FastAPI...
start "SCS-AI-Service" cmd /k "call _run_ai.bat"
popd
exit /b 0

:ensure_and_start_frontend
set "dir=%~1"
echo [Frontend %dir%] checking...
if not exist "%ROOT%\%dir%\package.json" (
    echo [Frontend %dir%] package.json not found, skip.
    exit /b 0
)
pushd "%ROOT%\%dir%"
set "PM=npm"
if exist "pnpm-lock.yaml" (
    where pnpm >nul 2>&1
    if not errorlevel 1 set "PM=pnpm"
)
if "%PM%"=="npm" if exist "yarn.lock" (
    where yarn >nul 2>&1
    if not errorlevel 1 set "PM=yarn"
)
where %PM% >nul 2>&1
if errorlevel 1 (
    echo [Frontend %dir%] npm/pnpm/yarn not found, skip.
    popd
    exit /b 0
)
if not exist "node_modules" (
    echo [Frontend %dir%] %PM% install...
    %PM% install
)
echo [Frontend %dir%] starting dev...
start "SCS-Frontend-%dir%" cmd /k "call _run_frontend.bat"
popd
exit /b 0
