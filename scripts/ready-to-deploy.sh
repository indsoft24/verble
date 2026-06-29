#!/usr/bin/env sh
# First-time VPS setup only — generates secrets and starts the stack (no image build).
# For code updates use: ./scripts/deploy-vps.sh [web|backend|all]

set -e
cd "$(dirname "$0")/.."

echo ">>> Generating JWT and internal secrets (backend .env)..."
if command -v node >/dev/null 2>&1; then
  node coaching-platform-backend/scripts/generate-secrets.js
else
  sh coaching-platform-backend/scripts/generate-secrets.sh
fi

echo ">>> Starting stack (mongo, redis, backend, web)..."
docker compose -f docker-compose.vps.yml up -d

echo ">>> Verble stack started."
echo "    First deploy / code updates: ./scripts/deploy-vps.sh web"
echo "    Disconnect-safe: nohup ./scripts/deploy-vps.sh web >> /var/log/verble-deploy.log 2>&1 &"
echo "    Logs: docker compose -f docker-compose.vps.yml logs -f"
