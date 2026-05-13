@echo off
setlocal enabledelayedexpansion

set "DIR=%~dp0"
set "NODE=%DIR%runtime\node.exe"
set "NODE_VERSION=22.15.0"

:: ── Download Node.js ──

if not exist "%NODE%" (
  echo [setup] Downloading Node.js %NODE_VERSION% (windows-x64)...
  mkdir "%DIR%runtime" 2>nul
  set "TMP_ZIP=%TEMP%\node-win-x64.zip"
  set "TMP_DIR=%TEMP%\node-win-x64"
  curl -fsSL -o "!TMP_ZIP!" "https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip"
  powershell -Command "Expand-Archive -Path '!TMP_ZIP!' -DestinationPath '!TMP_DIR!' -Force"
  copy "!TMP_DIR!\node-v%NODE_VERSION%-win-x64\node.exe" "%NODE%" >nul
  rmdir /s /q "!TMP_DIR!" 2>nul
  del "!TMP_ZIP!" 2>nul
  echo [setup] Node.js downloaded.
)

:: ── Start summoner ──

cd /d "%DIR%"
if exist .env (
  "%NODE%" --env-file=.env main.js %*
) else (
  "%NODE%" main.js %*
)
