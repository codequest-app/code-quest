@echo off
set "DIR=%~dp0"
set "NODE=%DIR%node.exe"
if not exist "%NODE%" set "NODE=node"
cd /d "%DIR%server"
if exist .env (
  "%NODE%" --env-file=.env bin\server.js %*
) else (
  "%NODE%" bin\server.js %*
)
