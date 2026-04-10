@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   SCS Docker: pull images + start stack
echo ========================================
echo.
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found. Install Docker Desktop and try again.
    pause
    exit /b 1
)

echo Pulling pre-built images from Docker Hub ^(skip if offline / use local^)...
docker compose pull
if errorlevel 1 (
    echo [WARN] pull failed, continuing with local cache or build...
)

echo.
echo Starting mysql + ai-service + backend...
docker compose up -d
if errorlevel 1 (
    echo [ERROR] docker compose up failed.
    pause
    exit /b 1
)

echo.
echo OK. Backend: http://localhost:8081   AI: http://localhost:8000
echo Optional UI ^(build once^): docker compose -f docker-compose.frontend.yml up -d --build
echo   then open http://localhost:9080/
echo.
pause
endlocal
exit /b 0
