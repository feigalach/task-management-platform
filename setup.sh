#!/usr/bin/env bash
#
# One-shot setup for the Task Management Platform.
# Run this once from the project root:
#
#   ./setup.sh
#
# It will:
#   1. Start a PostgreSQL container via Docker Compose (creates the
#      'task_management' database automatically on first run)
#   2. Create server/.env and client/.env from their .env.example files
#      (only if they don't already exist, so it's safe to re-run)
#   3. npm install for both server and client
#   4. Run TypeORM migrations (creates users + tasks tables)
#   5. Seed 3 demo users
#
# Requirements: Node.js 18+, npm, and Docker Desktop (running).
#
# On Windows, run this from Git Bash or WSL.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

DB_NAME="${DB_NAME:-task_management}"

info()  { echo -e "\033[1;34m[setup]\033[0m $1"; }
warn()  { echo -e "\033[1;33m[setup]\033[0m $1"; }
error() { echo -e "\033[1;31m[setup]\033[0m $1"; }

# ---------------------------------------------------------------------------
# 0. Sanity checks
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  error "Node.js is not installed or not on PATH. Install Node.js 18+ and re-run."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  error "npm is not installed or not on PATH."
  exit 1
fi

info "Node version: $(node -v)"

# ---------------------------------------------------------------------------
# 1. Database (PostgreSQL via Docker Compose)
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  error "Docker is not installed or not on PATH. Install Docker Desktop and re-run."
  exit 1
fi

info "Starting PostgreSQL container via Docker Compose..."
(cd "$ROOT_DIR" && docker compose up -d)

info "Waiting for PostgreSQL to accept connections..."
READY=0
for i in $(seq 1 30); do
  if docker exec pg-taskmanagement pg_isready -U postgres >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -eq 1 ]; then
  info "PostgreSQL is ready (database '$DB_NAME' is created automatically by the container)."
else
  error "PostgreSQL did not become ready in time. Check 'docker logs pg-taskmanagement'."
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. .env files
# ---------------------------------------------------------------------------
if [ ! -f "$SERVER_DIR/.env" ]; then
  cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
  info "Created server/.env from .env.example (edit it if your DB credentials differ)."
else
  info "server/.env already exists - leaving it untouched."
fi

if [ ! -f "$CLIENT_DIR/.env" ]; then
  cp "$CLIENT_DIR/.env.example" "$CLIENT_DIR/.env"
  info "Created client/.env from .env.example."
else
  info "client/.env already exists - leaving it untouched."
fi

# ---------------------------------------------------------------------------
# 3. Install dependencies
# ---------------------------------------------------------------------------
info "Installing server dependencies..."
(cd "$SERVER_DIR" && npm install)

info "Installing client dependencies..."
(cd "$CLIENT_DIR" && npm install)

# ---------------------------------------------------------------------------
# 4. Migrations
# ---------------------------------------------------------------------------
info "Running database migrations..."
(cd "$SERVER_DIR" && npm run migration:run)

# ---------------------------------------------------------------------------
# 5. Seed demo users
# ---------------------------------------------------------------------------
info "Seeding demo users..."
(cd "$SERVER_DIR" && npm run seed)

echo ""
info "Setup complete!"
info "Start the app with: ./start.sh"
info "  (or manually: 'npm run dev' inside server/, and 'npm run dev' inside client/)"
