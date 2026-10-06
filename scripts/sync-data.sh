#!/usr/bin/env bash
# Copy the open flood data from a floodboy-oracle flood-news checkout into data/.
# Usage: scripts/sync-data.sh <path to lab/flood-news>
# The source of truth is collect.py there; this repo only serves it.
set -euo pipefail
src="${1:?usage: scripts/sync-data.sh <path to lab/flood-news>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
cp "$src/events.json" "$root/data/events.json"
cp "$src/gods-eyes/news.json" "$root/data/news.json"
python3 -c "import json,sys; e=json.load(open(sys.argv[1]))['events']; n=json.load(open(sys.argv[2])); print(f'data: {len(e)} events, {len(n)} news rows')" "$root/data/events.json" "$root/data/news.json"
