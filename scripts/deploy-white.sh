#!/usr/bin/env bash
# Deploy on the self-hosted runner `floodboy-events-white` (Linux x64, runs as the runner user).
# Called by .github/workflows/deploy-white.yml; also runnable by hand on white.
#
#   1. make sure the pinned pocketbase binary is there (version + SHA-256 from the Dockerfile)
#   2. copy the checkout to $DEPLOY_DIR, keeping pocketbase/pb_data and .env
#   3. first run: `pm2.sh start` (random logins, PB_DEV_LOGINS=0); later runs: `pm2.sh restart`
#   4. `floodboy-import data/events.json data/news.json` (upsert by key; nothing deleted)
#   5. health check + row counts
#
# THIS REPO IS PUBLIC, SO ITS ACTIONS LOGS ARE PUBLIC. Provisioning prints the generated logins
# once: that output goes to $DEPLOY_DIR/provision.log (mode 600) on white, never to stdout.
set -euo pipefail

src="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/floodboy-events}"
BIN_DIR="${BIN_DIR:-$HOME/.local/floodboy-events/bin}"

kv() { [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | tail -n 1 | sed 's/^"\(.*\)"$/\1/' || true; }
dockerfile="$(ls "$src"/addon/*/Dockerfile | head -n 1)"
version="$(sed -n 's/^ARG POCKETBASE_VERSION=//p' "$dockerfile" | head -n 1)"
sha="$(sed -n 's/^ARG POCKETBASE_SHA256_AMD64=//p' "$dockerfile" | head -n 1)"
[ "$(uname -sm)" = "Linux x86_64" ] || { echo "deploy-white: expects Linux x86_64" >&2; exit 1; }

# 1. pinned binary
pb="$BIN_DIR/pocketbase"
if [ ! -x "$pb" ] || [ "$("$pb" --version | awk '{print $NF}')" != "$version" ]; then
  echo "deploy-white: installing pocketbase $version"
  mkdir -p "$BIN_DIR"
  tmp="$(mktemp -d)"
  zip="pocketbase_${version}_linux_amd64.zip"
  curl -fsSL -o "$tmp/$zip" "https://github.com/pocketbase/pocketbase/releases/download/v${version}/${zip}"
  echo "${sha}  $tmp/$zip" | sha256sum -c -
  unzip -o -q "$tmp/$zip" pocketbase -d "$BIN_DIR"
  rm -rf "$tmp"
fi
export POCKETBASE="$pb"

# 2. copy the code, keep data and local settings
mkdir -p "$DEPLOY_DIR"
rsync -a --delete \
  --exclude '/pocketbase/pb_data/' --exclude '/.env' --exclude '/provision.log' --exclude '/.git/' \
  "$src"/ "$DEPLOY_DIR"/
cd "$DEPLOY_DIR"
if [ ! -f .env ]; then
  printf 'PORT=%s\nPB_DEV_LOGINS=0\n' "$(kv project.env DEFAULT_PORT)" > .env
  chmod 600 .env
fi
port="$(kv .env PORT)"
name="$(kv project.env PROJECT_SLUG)"

# 3. start or restart under pm2
if pm2 describe "$name" >/dev/null 2>&1; then
  scripts/pm2.sh restart >/dev/null
  echo "deploy-white: restarted $name"
else
  umask 077
  if ! scripts/pm2.sh start > provision.log 2>&1; then
    echo "deploy-white: first start failed; read $DEPLOY_DIR/provision.log on white" >&2
    exit 1
  fi
  echo "deploy-white: started $name (logins in $DEPLOY_DIR/provision.log and pocketbase/pb_data, on white only)"
  pm2 save >/dev/null
fi

for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null

# 4. data
"$pb" floodboy-import data/events.json data/news.json \
  --dir pocketbase/pb_data --migrationsDir pocketbase/pb_migrations --hooksDir pocketbase/pb_hooks

# 5. what is being served
for col in events news; do
  n="$(curl -fsS "http://127.0.0.1:$port/api/collections/$col/records?perPage=1" | sed -n 's/.*"totalItems":\([0-9]*\).*/\1/p')"
  echo "deploy-white: $col = $n rows on 127.0.0.1:$port"
done
