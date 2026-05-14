#!/bin/sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$DIR/runtime/node"

NODE_VERSION="22.15.0"
NODE_MODULES="131"

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
  curl -fL --progress-bar -o "$TMP/node.tar.gz" "$URL"
  tar -xzf "$TMP/node.tar.gz" -C "$TMP"
  cp "$TMP/node-v$NODE_VERSION-$OS_NAME-$ARCH_NAME/bin/node" "$DIR/runtime/node"
  chmod +x "$DIR/runtime/node"
  rm -rf "$TMP"
  echo "[setup] Node.js downloaded."
}

# ── Resolve Node.js ──

resolve_node() {
  SYSTEM_NODE=$(command -v node 2>/dev/null || true)
  if [ -n "$SYSTEM_NODE" ]; then
    SYSTEM_MODULES=$("$SYSTEM_NODE" -e "process.stdout.write(process.versions.modules)" 2>/dev/null || true)
    if [ "$SYSTEM_MODULES" = "$NODE_MODULES" ]; then
      NODE="$SYSTEM_NODE"
      echo "[setup] Using system Node.js ($("$NODE" --version))."
      return
    fi
  fi
  if [ ! -x "$DIR/runtime/node" ]; then
    download_node
  fi
}

# ── Main ──

detect_platform
resolve_node

cd "$DIR"
if [ -f .env ]; then
  exec "$NODE" --env-file=.env main.js "$@"
else
  exec "$NODE" main.js "$@"
fi
