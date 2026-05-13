#!/bin/sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$DIR/runtime/node"
SQLITE_NODE="$DIR/node_modules/better-sqlite3/build/Release/better_sqlite3.node"

NODE_VERSION="22.15.0"
SQLITE_VERSION="12.6.2"

# ── Detect platform ──

detect_platform() {
  OS=$(uname -s)
  ARCH=$(uname -m)

  case "$OS" in
    Linux)  OS_NAME="linux" ;;
    Darwin) OS_NAME="darwin" ;;
    *)      echo "Unsupported OS: $OS"; exit 1 ;;
  esac

  case "$ARCH" in
    x86_64)        ARCH_NAME="x64" ;;
    aarch64|arm64) ARCH_NAME="arm64" ;;
    *)             echo "Unsupported arch: $ARCH"; exit 1 ;;
  esac
}

# ── Download Node.js ──

download_node() {
  echo "[setup] Downloading Node.js $NODE_VERSION ($OS_NAME-$ARCH_NAME)..."
  mkdir -p "$DIR/runtime"
  TMP=$(mktemp -d)
  URL="https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-$OS_NAME-$ARCH_NAME.tar.gz"
  curl --progress-bar -f -o "$TMP/node.tar.gz" "$URL"
  tar xz -C "$TMP" -f "$TMP/node.tar.gz"
  cp "$TMP/node-v$NODE_VERSION-$OS_NAME-$ARCH_NAME/bin/node" "$DIR/runtime/node"
  chmod +x "$DIR/runtime/node"
  rm -rf "$TMP"
  echo "[setup] Node.js downloaded."
}

# ── Download better-sqlite3 prebuilt ──

download_sqlite() {
  NAPI=$("$NODE" -e "process.stdout.write(process.versions.modules)")
  echo "[setup] Downloading better-sqlite3 $SQLITE_VERSION (node-v$NAPI-$OS_NAME-$ARCH_NAME)..."
  mkdir -p "$DIR/node_modules/better-sqlite3/build/Release"
  TMP=$(mktemp -d)
  URL="https://github.com/WiseLibs/better-sqlite3/releases/download/v$SQLITE_VERSION/better-sqlite3-v$SQLITE_VERSION-node-v$NAPI-$OS_NAME-$ARCH_NAME.tar.gz"
  curl --progress-bar -f -o "$TMP/sqlite.tar.gz" "$URL"
  tar xz -C "$TMP" -f "$TMP/sqlite.tar.gz"
  cp "$TMP/build/Release/better_sqlite3.node" "$SQLITE_NODE"
  rm -rf "$TMP"
  echo "[setup] better-sqlite3 downloaded."
}

# ── Main ──

detect_platform

if [ ! -x "$NODE" ]; then
  download_node
fi

if [ ! -f "$SQLITE_NODE" ]; then
  download_sqlite
fi

cd "$DIR"
if [ -f .env ]; then
  exec "$NODE" --env-file=.env bin/server.js "$@"
else
  exec "$NODE" bin/server.js "$@"
fi
