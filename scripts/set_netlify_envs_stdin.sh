#!/usr/bin/env bash
set -euo pipefail
missing=(CRON_SECRET DATABASE_URL EMAIL_FROM FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY NODE_ENV)
for key in "${missing[@]}"; do
  # Special handling for multiline FIREBASE_PRIVATE_KEY
  if [[ "$key" == "FIREBASE_PRIVATE_KEY" ]]; then
    # Collect lines from the line that starts with FIREBASE_PRIVATE_KEY= through the END PRIVATE KEY marker
    if ! grep -q "^\s*FIREBASE_PRIVATE_KEY=" .env; then
      echo "[SKIP] $key: not found in .env"
      continue
    fi
    # awk: start printing after the first '=' of the FIREBASE_PRIVATE_KEY line, then print following lines until END PRIVATE KEY line
    val=$(awk 'BEGIN{p=0} /^\s*FIREBASE_PRIVATE_KEY=/{p=1; sub(/^[^=]*=/,""); sub(/^\"/,""); print; next} p{print; if($0 ~ /-----END PRIVATE KEY-----/){p=0; exit}}' .env)
    # remove trailing closing quote if present on last line
    val=$(printf "%s" "$val" | sed -e '$s/"$//')
  else
    # single-line value extraction
    raw=$(awk -F= -v k="$key" '$0 ~ "^\s*"k"=" {sub("^[^=]*=","",$0); print; exit}' .env || true)
    if [ -z "$raw" ]; then
      echo "[SKIP] $key: not found in .env"
      continue
    fi
    val=$raw
    # strip surrounding quotes (single or double)
    if [[ $val =~ ^\"(.*)\"$ ]]; then
      val="${BASH_REMATCH[1]}"
    elif [[ $val =~ ^\'(.*)\'$ ]]; then
      val="${BASH_REMATCH[1]}"
    fi
  fi
  case "$key" in
    NEXT_PUBLIC_*) scope="--scope builds"; secret_flag="";;
    EMAIL_FROM) scope="--scope builds functions"; secret_flag="";;
    NODE_ENV) scope="--scope builds functions"; secret_flag="";;
    *) scope="--scope functions"; secret_flag="--secret";;
  esac
  printf 'Setting %s in production...\n' "$key"
  # Use stdin to pass value safely (works for multiline)
  printf '%s' "$val" | netlify env:set "$key" --context production $scope $secret_flag --force >/dev/null 2>&1 && echo "[OK] $key set" || echo "[ERR] $key failed"
done
