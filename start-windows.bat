@echo off
rem Double-click to start Cross-Ocean HomeBridge on Windows (uses .venv if it exists).
rem The app opens at http://127.0.0.1:8000. Close this window to stop it.
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" run.py
) else (
  python run.py
)
pause
