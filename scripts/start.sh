#!/bin/sh
cd "$(dirname "$0")/server"
if [ -f .env ]; then
  exec node --env-file=.env bin/server.js "$@"
else
  exec node bin/server.js "$@"
fi
