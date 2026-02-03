#!/usr/bin/env sh
# Generate JWT_SECRET using openssl (no Node required). Use on VPS where Node is not installed.
# Run from repo root: sh coaching-platform-backend/scripts/generate-secrets.sh
# Or from backend dir: sh scripts/generate-secrets.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_PATH="${SCRIPT_DIR}/../.env"
EXAMPLE_PATH="${SCRIPT_DIR}/../.env.example"

if [ ! -f "$ENV_PATH" ] && [ -f "$EXAMPLE_PATH" ]; then
  cp "$EXAMPLE_PATH" "$ENV_PATH"
  echo "Created .env from .env.example"
fi

if [ ! -f "$ENV_PATH" ]; then
  echo "Error: .env not found. Create coaching-platform-backend/.env from .env.example first."
  exit 1
fi

# Only replace if current value looks like a placeholder
if grep -q '^JWT_SECRET=your-super-secret-jwt-key-change-this-in-production' "$ENV_PATH" 2>/dev/null || \
   grep -q '^JWT_SECRET=change-this-in-production' "$ENV_PATH" 2>/dev/null || \
   grep -q '^JWT_SECRET=your-jwt-secret' "$ENV_PATH" 2>/dev/null; then
  NEW_SECRET="$(openssl rand -hex 32)"
  # GNU sed (Linux): sed -i "s|...|"
# BSD sed (macOS): sed -i '' "s|...|"
case "$(uname -s)" in
  Darwin) sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_SECRET}|" "$ENV_PATH" ;;
  *)      sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_SECRET}|" "$ENV_PATH" ;;
esac
  echo "Generated and wrote: JWT_SECRET"
else
  echo "JWT_SECRET already set (no placeholder replaced)."
fi
