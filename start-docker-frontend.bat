@echo off
setlocal
cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found.
    pause
    exit /b 1
)

REM 本机已用 docker compose up 起过后端时，容器内访问 Windows 宿主机后端用 host.docker.internal
if not defined BACKEND_UPSTREAM set "BACKEND_UPSTREAM=http://host.docker.internal:8081"

echo BACKEND_UPSTREAM=%BACKEND_UPSTREAM%
echo Pulling frontend image ^(if any^)...
docker compose -f docker-compose.frontend.yml pull
echo Starting frontends ^(default port 9080, override with FRONTEND_HOST_PORT in .env^)...
docker compose -f docker-compose.frontend.yml up -d
if errorlevel 1 (
    echo First run or missing image: building ^(may take several minutes^)...
    docker compose -f docker-compose.frontend.yml up -d --build
)

echo Open http://localhost:9080/  ^(admin: /admin/  mobile: /mobile/^)
pause
endlocal
exit /b 0
