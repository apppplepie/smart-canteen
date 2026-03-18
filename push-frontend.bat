@echo off
REM 打包前端镜像并推送到 Docker Hub，供服务器拉取部署
REM 用法：先设置 DOCKERHUB_USER（或在本目录 .env 里写 DOCKERHUB_USER=你的用户名）
REM       push-frontend.bat

if "%DOCKERHUB_USER%"=="" (
  echo 请先设置 DOCKERHUB_USER，例如：set DOCKERHUB_USER=你的用户名
  echo 或在项目根目录 .env 里写一行：DOCKERHUB_USER=你的用户名
  exit /b 1
)

echo Building scs-frontends...
docker compose -f docker-compose.frontend.yml build
if errorlevel 1 exit /b 1

echo Pushing %DOCKERHUB_USER%/scs-frontends:latest...
docker push %DOCKERHUB_USER%/scs-frontends:latest
if errorlevel 1 (
  echo 推送失败，请先执行：docker login
  exit /b 1
)

echo 完成。在服务器上执行：
echo   export DOCKERHUB_USER=%DOCKERHUB_USER%
echo   docker compose -f docker-compose.frontend.deploy.yml pull
echo   docker compose -f docker-compose.frontend.deploy.yml up -d
