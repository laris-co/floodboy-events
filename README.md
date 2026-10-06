# Floodboy Events

[![ci](https://github.com/laris-co/floodboy-events/actions/workflows/ci.yml/badge.svg)](https://github.com/laris-co/floodboy-events/actions/workflows/ci.yml)
![PocketBase](https://img.shields.io/badge/PocketBase-v0.40.4-b8dbe4)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

<!-- ha-buttons -->
[![Add the repository to my Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Flaris-co%2Ffloodboy-events)
[![Open the add-on in my Home Assistant](https://my.home-assistant.io/badges/supervisor_addon.svg)](https://my.home-assistant.io/redirect/supervisor_addon/?addon=09134991_floodboy_events&repository_url=https%3A%2F%2Fgithub.com%2Flaris-co%2Ffloodboy-events)
<!-- /ha-buttons -->

Open flood data for Thailand, Chiang Mai first, served by [PocketBase](https://pocketbase.io).
Two public read-only collections:

- **`news`**: the God's Eyes news layer. Warnings, forecasts and incidents with `time_utc`
  (when it happened) and `published_utc` (when it went public), so lead time is measurable.
  `storm_id = cm-2026-10-05` is the 5 Oct 2026 Chiang Mai storm.
- **`events`**: one row per flood event (2026 season plus historical Ping River P.1 peaks). Every
  row cites the source URLs it was read from, and figures are quoted exactly as the source gives them.

Anyone may read: `GET /api/collections/news/records`, `GET /api/collections/events/records`.
Only superusers write; rows come from `data/*.json` through `pocketbase floodboy-import`.
The data is collected by floodboy-oracle (AI) in
[laris-co/floodboy-oracle](https://github.com/laris-co/floodboy-oracle) (`lab/flood-news/collect.py`, issue #10).
Deployed to white by `.github/workflows/deploy-white.yml` (see `scripts/deploy-white.sh`).

## Quick start

```sh
just serve                 # no Docker: provision + run (needs pocketbase); just start = under pm2
just password              # login admin@local.test + this machine's shared dev password
```

Or with Docker: `docker compose up --build -d`, then `docker compose logs` (random logins, shown ONCE).

`docker compose down -v` deletes everything; the next start provisions again.

## Deploy to Home Assistant

The buttons above add the repository to Home Assistant. From a checkout, one command installs or
updates the add-on **and starts it** (Home Assistant never starts an add-on after installing it),
then waits until PocketBase answers:

```sh
scripts/ha-deploy.mjs --ha http://homeassistant.local:8123 --wait   # --wait: right after git push
```

It signs in with a long-lived access token kept in `~/.config/ha-deploy/<host>.token` (mode 600).

## Make it your project

A new repo from this template **names itself after the repository** (`catlab-bro` → "Catlab
Bro") and opens a **setup issue** with the rest of the checklist:

```sh
# replace the `notes` example in pocketbase/pb_migrations/ + its checks in scripts/e2e.mjs
scripts/export-collections.sh && scripts/sync-addon.sh
scripts/local-e2e.sh       # → LOCAL E2E: ALL PASS
```

Or tell a coding agent: *"Set up this template for my project, following AGENTS.md."*

## What's inside

| | |
|---|---|
| `pocketbase/` | migrations, hooks, `collections.json`: the part you edit |
| `addon/<slug>/` | the image (pinned, SHA-256-verified PocketBase) and Home Assistant add-on |
| `ui/` | an example app UI, released as `dist.zip` and served at `/` (the admin page moves to `/_setup/`) |
| `scripts/` | provisioning, rename, e2e tests, sync, Home Assistant deploy, PocketBase version bump, privacy check |
| `AGENTS.md` | instructions for AI coding agents |

## Docs

- [Tutorial: install on Home Assistant](docs/home-assistant/README.md): screenshots, from the store to the signed-in dashboard
- [Running it](docs/running.md): without Docker (or under pm2), as a Home Assistant add-on, on an existing PocketBase, network and security
- [Repository layout](docs/layout.md): every file and what it does
- [Testing](docs/testing.md): what the e2e covers and how to bump PocketBase

MIT, see [LICENSE](LICENSE).
