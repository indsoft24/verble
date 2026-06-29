#!/usr/bin/env bash
# Safe VPS deploy for Verble — resource-capped builds, zero-downtime swap, rollback on failure.
# Disconnect-safe when started with: nohup ./scripts/deploy-vps.sh web >> /var/log/verble-deploy.log 2>&1 &

set -euo pipefail

COMPOSE_FILE="docker-compose.vps.yml"
LOCK_FILE="/var/run/verble-deploy.lock"
WEB_PORT=3001
BACKEND_PORT=5001
BUILD_MEMORY_MAX="1400M"
BUILD_CPU_QUOTA="70%"
# Deploy logs use India time (matches Verble schedule TZ). Override: VERBLE_LOG_TZ=UTC
LOG_TZ="${VERBLE_LOG_TZ:-Asia/Kolkata}"

cd "$(dirname "$0")/.."

SERVICE="${1:-web}"

case "$SERVICE" in
  web|backend|all) ;;
  *)
    echo "Usage: $0 [web|backend|all]" >&2
    echo "  web     — frontend only (default)" >&2
    echo "  backend — API only" >&2
    echo "  all     — backend then web" >&2
    exit 1
    ;;
esac

log() {
  echo "[$(TZ="$LOG_TZ" date '+%Y-%m-%d %H:%M:%S %Z')] $*"
}

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

image_for_service() {
  case "$1" in
    web) echo "verble-web" ;;
    backend) echo "verble-backend" ;;
    *) echo "unknown" >&2; return 1 ;;
  esac
}

tag_backup() {
  local image
  image="$(image_for_service "$1")"
  if docker image inspect "$image" >/dev/null 2>&1; then
    log "Tagging current $image as ${image}:prev"
    docker tag "$image" "${image}:prev"
  fi
}

rollback_service() {
  local service=$1
  local image
  image="$(image_for_service "$service")"
  if docker image inspect "${image}:prev" >/dev/null 2>&1; then
    log "Rolling back $service to ${image}:prev"
    docker tag "${image}:prev" "$image"
    compose up -d --no-deps "$service"
    return 0
  fi
  log "No ${image}:prev backup — cannot roll back $service"
  return 1
}

prune_build_cache() {
  log "Pruning dangling build cache (last 24h)..."
  docker builder prune -f --filter "until=24h" >/dev/null 2>&1 || true
}

run_capped_build() {
  local target=$1
  log "Building $target (COMPOSE_PARALLEL_LIMIT=1, memory cap $BUILD_MEMORY_MAX)..."
  export DOCKER_BUILDKIT=1
  export COMPOSE_DOCKER_CLI_BUILD=1
  export COMPOSE_PARALLEL_LIMIT=1

  if command -v systemd-run >/dev/null 2>&1; then
    systemd-run --scope -p "MemoryMax=$BUILD_MEMORY_MAX" -p "CPUQuota=$BUILD_CPU_QUOTA" -- \
      env DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 COMPOSE_PARALLEL_LIMIT=1 \
      docker compose -f "$COMPOSE_FILE" build "$target"
  else
    log "systemd-run not found — building without cgroup caps"
    compose build "$target"
  fi
}

health_check() {
  local service=$1
  local i

  case "$service" in
    web)
      for i in 1 2 3 4 5 6 7 8 9 10; do
        if curl -sf "http://127.0.0.1:${WEB_PORT}/health" >/dev/null 2>&1; then
          log "Web health check passed (http://127.0.0.1:${WEB_PORT}/health)"
          return 0
        fi
        sleep 2
      done
      log "Web health check failed after 20s"
      return 1
      ;;
    backend)
      for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
        if curl -sf "http://127.0.0.1:${BACKEND_PORT}/" >/dev/null 2>&1; then
          log "Backend health check passed (http://127.0.0.1:${BACKEND_PORT}/)"
          return 0
        fi
        sleep 2
      done
      log "Backend health check failed after 30s"
      return 1
      ;;
  esac
}

deploy_one() {
  local service=$1
  local image
  image="$(image_for_service "$service")"

  log "=== Deploying $service ==="

  if curl -sf "http://127.0.0.1:${WEB_PORT}/health" >/dev/null 2>&1 || \
     docker ps --format '{{.Names}}' | grep -q "verble-"; then
    log "Stack is running — old container continues serving during build"
  fi

  tag_backup "$service"

  if ! run_capped_build "$service"; then
    log "Build failed for $service"
    prune_build_cache
    exit 1
  fi

  log "Swapping $service container (zero-downtime: --no-deps)..."
  compose up -d --no-deps "$service"

  if ! health_check "$service"; then
    log "Deploy failed health check — rolling back $service"
    rollback_service "$service" || true
    prune_build_cache
    exit 1
  fi

  log "=== $service deploy succeeded ==="
}

on_error() {
  log "Deploy aborted"
  prune_build_cache
}

trap on_error ERR

main() {
  log "Verble deploy started (target=$SERVICE, cwd=$(pwd))"

  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "Another deploy is in progress (lock: $LOCK_FILE). Exiting."
    exit 1
  fi

  case "$SERVICE" in
    web) deploy_one web ;;
    backend) deploy_one backend ;;
    all)
      deploy_one backend
      deploy_one web
      ;;
  esac

  log "Deploy complete."
}

main
