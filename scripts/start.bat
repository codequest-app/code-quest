@echo off
setlocal enabledelayedexpansion

set "DIR=%~dp0"
set "NODE=%DIR%runtime\node.exe"
set "SQLITE_NODE=%DIR%server\node_modules\better-sqlite3\build\Release\better_sqlite3.node"
set "NODE_VERSION=22.15.0"
set "SQLITE_VERSION=12.6.2"

:: ── 下載 Node.js ──

if not exist "%NODE%" (
  echo [setup] Downloading Node.js %NODE_VERSION% (windows-x64)...
  mkdir "%DIR%runtime" 2>nul
  set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip"
  set "TMP_ZIP=%TEMP%\node-win-x64.zip"
  set "TMP_DIR=%TEMP%\node-win-x64"
  curl -fsSL -o "!TMP_ZIP!" "!NODE_URL!"
  powershell -Command "Expand-Archive -Path '!TMP_ZIP!' -DestinationPath '!TMP_DIR!' -Force"
  copy "!TMP_DIR!\node-v%NODE_VERSION%-win-x64\node.exe" "%NODE%" >nul
  rmdir /s /q "!TMP_DIR!" 2>nul
  del "!TMP_ZIP!" 2>nul
  echo [setup] Node.js downloaded.
)

:: ── 取得 NAPI version ──

if not exist "%SQLITE_NODE%" (
  for /f %%i in ('"%NODE%" -e "process.stdout.write(process.versions.modules)"') do set "NAPI=%%i"
  echo [setup] Downloading better-sqlite3 %SQLITE_VERSION% (node-v!NAPI!-win32-x64)...
  set "SQLITE_URL=https://github.com/WiseLibs/better-sqlite3/releases/download/v%SQLITE_VERSION%/better-sqlite3-v%SQLITE_VERSION%-node-v!NAPI!-win32-x64.tar.gz"
  set "TMP_DIR=%TEMP%\better-sqlite3"
  mkdir "!TMP_DIR!" 2>nul
  curl -fsSL -o "!TMP_DIR!\sqlite.tar.gz" "!SQLITE_URL!"
  powershell -Command "tar -xzf '!TMP_DIR!\sqlite.tar.gz' -C '!TMP_DIR!'"
  mkdir "%DIR%server\node_modules\better-sqlite3\build\Release" 2>nul
  copy "!TMP_DIR!\build\Release\better_sqlite3.node" "%SQLITE_NODE%" >nul
  rmdir /s /q "!TMP_DIR!" 2>nul
  echo [setup] better-sqlite3 downloaded.
)

:: ── 啟動 server ──

cd /d "%DIR%server"
if exist .env (
  "%NODE%" --env-file=.env bin\server.js %*
) else (
  "%NODE%" bin\server.js %*
)
