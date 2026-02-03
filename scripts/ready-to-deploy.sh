#!/usr/bin/env sh
# Run from repo root: ./scripts/ready-to-deploy.sh
# Generates JWT secret (if placeholder), builds and starts the VPS Docker stack.

set -e
cd "$(dirname "$0")/.."

echo ">>> Generating JWT and internal secrets (backend .env)..."
if command -v node >/dev/null 2>&1; then
  node coaching-platform-backend/scripts/generate-secrets.js
else
  sh coaching-platform-backend/scripts/generate-secrets.sh
fi

echo ">>> Building Docker images..."
docker compose -f docker-compose.vps.yml build

echo ">>> Starting stack (web, backend, mongo, redis)..."
docker compose -f docker-compose.vps.yml up -d

echo ">>> Verble is running. Frontend: http://localhost:3000"
echo "    Logs: docker compose -f docker-compose.vps.yml logs -f"
