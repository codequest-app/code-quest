#!/bin/sh
DIR="$(dirname "$0")"
NODE="$DIR/runtime/node"
if [ ! -x "$NODE" ]; then
  NODE="$(command -v node)"
fi
cd "$DIR/server"
if [ -f .env ]; then
  exec "$NODE" --env-file=.env bin/server.js "$@"
else
  exec "$NODE" bin/server.js "$@"
fi
