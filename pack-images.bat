@echo off
REM 在项目根目录执行，生成 images.tar.gz，拷到服务器后解压到 /srv/scs/
setlocal
cd /d "%~dp0"

if not exist "images" (
    echo [WARN] images 目录不存在，创建空目录并打包。
    mkdir images 2>nul
)

echo Packing images/ to images.tar.gz ...
tar -czvf images.tar.gz images
if %errorlevel% neq 0 (
    echo tar failed. If tar not found, install 7-Zip and run: 7z a -ttar images.tar images && 7z a -tgzip images.tar.gz images.tar
    exit /b 1
)
echo Done. Upload images.tar.gz to server, then run:
echo   cd /srv/scs ^&^& tar -xzvf images.tar.gz
echo   (or: tar -xzvf images.tar.gz -C /srv/scs)
pause
