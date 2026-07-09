#!/usr/bin/env bash
#
# Starts both the server (http://localhost:3000) and the client
# (http://localhost:5173) together, after ./setup.sh has been run once.
#
#   ./start.sh
#
# Press Ctrl+C to stop both.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

info() { echo -e "\033[1;34m[start]\033[0m $1"; }

if [ ! -d "$SERVER_DIR/node_modules" ] || [ ! -d "$CLIENT_DIR/node_modules" ]; then
  echo "Dependencies are not installed yet. Run ./setup.sh first."
  exit 1
fi

cleanup() {
  info "Shutting down..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
  wait "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

info "Starting server (http://localhost:3000)..."
(cd "$SERVER_DIR" && npm run dev) &
SERVER_PID=$!

info "Starting client (http://localhost:5173)..."
(cd "$CLIENT_DIR" && npm run dev) &
CLIENT_PID=$!

info "Both processes running. Press Ctrl+C to stop."
wait "$SERVER_PID" "$CLIENT_PID"
