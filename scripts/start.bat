@echo off
cd /d "%~dp0server"
if exist .env (
  node --env-file=.env bin\server.js %*
) else (
  node bin\server.js %*
)
