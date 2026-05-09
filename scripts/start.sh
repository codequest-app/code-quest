#!/bin/sh
cd "$(dirname "$0")/server"

# Rebuild better-sqlite3 if Node.js version doesn't match prebuilt binary
NATIVE_FILE="node_modules/better-sqlite3/build/Release/better_sqlite3.node"
if [ -f "$NATIVE_FILE" ]; then
  BUILD_VER=$(node -e "try{require('$NATIVE_FILE')}catch(e){if(e.code==='ERR_DLOPEN_FAILED')console.log('mismatch')}" 2>/dev/null)
  if [ "$BUILD_VER" = "mismatch" ]; then
    echo "Rebuilding better-sqlite3 for current Node.js version..."
    cd node_modules/better-sqlite3 && npx --yes prebuild-install || npx --yes node-gyp rebuild
    cd ../..
  fi
fi

if [ -f .env ]; then
  exec node --env-file=.env bin/server.js "$@"
else
  exec node bin/server.js "$@"
fi
