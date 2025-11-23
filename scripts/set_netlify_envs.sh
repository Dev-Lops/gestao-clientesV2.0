#!/usr/bin/env bash
set -euo pipefail
missing=(CRON_SECRET DATABASE_URL EMAIL_FROM FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY NODE_ENV)
for key in "${missing[@]}"; do
  raw=$(grep -m1 -E "^\s*${key}=" .env || true)
  if [ -z "$raw" ]; then
    echo "[SKIP] $key: not found in .env"
    continue
  fi
  val=${raw#*=}
  val=${val%\"}
  val=${val#\"}
  val=${val%\'}
  val=${val#\'}
  case "$key" in
    NEXT_PUBLIC_*) scope="--scope builds"; secret="";;
    EMAIL_FROM) scope="--scope builds functions"; secret="";;
    NODE_ENV) scope="--scope builds functions"; secret="";;
    *) scope="--scope functions"; secret="--secret";;
  esac
  printf 'Setting %s in production...\n' "$key"
  if netlify env:set "$key" "$val" --context production $scope $secret --force >/dev/null 2>&1; then
    echo "[OK] $key set"
  else
    echo "[ERR] $key failed"
  fi
done
