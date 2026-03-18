@echo off
cd /d "%~dp0"
set PYCMD=python
where python >nul 2>&1
if errorlevel 1 set PYCMD=py
%PYCMD% -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
