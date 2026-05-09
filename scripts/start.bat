@echo off
cd /d "%~dp0server"

:: Rebuild better-sqlite3 if Node.js version doesn't match
node -e "try{require('./node_modules/better-sqlite3/build/Release/better_sqlite3.node')}catch(e){if(e.code==='ERR_DLOPEN_FAILED'){process.exit(1)}}" 2>nul
if errorlevel 1 (
  echo Rebuilding better-sqlite3 for current Node.js version...
  cd node_modules\better-sqlite3
  npx --yes prebuild-install 2>nul || npx --yes node-gyp rebuild
  cd ..\..
)

if exist .env (
  node --env-file=.env bin\server.js %*
) else (
  node bin\server.js %*
)
