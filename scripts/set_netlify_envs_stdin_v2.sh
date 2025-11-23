#!/usr/bin/env bash
set -euo pipefail
# Keys to set from .env
keys=(DATABASE_URL CRON_SECRET EMAIL_FROM FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY)

for key in "${keys[@]}"; do
  echo "Processing $key..."
  # Extract value robustly; handle multiline FIREBASE_PRIVATE_KEY
  if [ "$key" = "FIREBASE_PRIVATE_KEY" ]; then
    if ! grep -q "^\s*FIREBASE_PRIVATE_KEY=" .env; then
      echo "[SKIP] $key: not found in .env"
      continue
    fi
    val=$(awk 'BEGIN{p=0} /^\s*FIREBASE_PRIVATE_KEY=/{p=1; sub(/^[^=]*=/,""); sub(/^"/,""); print; next} p{print; if($0 ~ /-----END PRIVATE KEY-----/){p=0; exit}}' .env | sed -e '$s/"$//')
  else
    # single-line extraction (handles quoted values)
    val=$(perl -0777 -ne 'if (/^\s*'"$key"'=(?:"|')?(.*?)(?:"|')?\s*$/m) { print $1 } elsif (/^\s*'"$key"'=(?:"|')?([\s\S]*?)(?:"|')?/m) { print $1 }' .env || true)
  fi

  if [ -z "$val" ]; then
    echo "[SKIP] $key: not found or empty in .env"
    continue
  fi

  # choose scope and whether to mark as secret
  secret_flag="--secret"
  scope="--scope functions"
  if [ "$key" = "EMAIL_FROM" ]; then
    secret_flag=""
    scope="--scope builds functions"
  fi

  printf 'Setting %s in production...\n' "$key"
  # pass the value via stdin to netlify env:set to safely handle multiline
  if printf '%s' "$val" | netlify env:set "$key" --context production $scope $secret_flag --force; then
    echo "[OK] $key set"
  else
    echo "[ERR] $key failed"
  fi
done
