@echo off
cd /d "%~dp0"
if exist pnpm-lock.yaml (pnpm run dev) else (npm run dev)
pause
