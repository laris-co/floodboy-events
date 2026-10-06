/// <reference path="../pb_data/types.d.ts" />
// Open flood data: `news` (the God's Eyes news layer: warnings, forecasts, incidents with
// time_utc / published_utc) and `events` (one row per flood event, every row cited).
//
// Both are OPEN DATA: anyone may list and view (rule ""). Only superusers write (rule null):
// rows come from data/*.json through the `floodboy-import` command (pb_hooks/import.pb.js),
// never from clients. Source of truth: laris-co/floodboy-oracle lab/flood-news/collect.py.

migrate((app) => {
  const PUBLIC = ""
  const SUPERUSERS_ONLY = null
  const SCOPE = ["chiang-mai", "thailand"]
  const PHASE = ["before", "during", "after"]

  app.save(new Collection({
    type: "base",
    name: "news",
    listRule: PUBLIC, viewRule: PUBLIC,
    createRule: SUPERUSERS_ONLY, updateRule: SUPERUSERS_ONLY, deleteRule: SUPERUSERS_ONLY,
    fields: [
      { type: "text", name: "key", required: true, max: 300 },
      { type: "date", name: "time_utc", required: true },
      { type: "select", name: "time_precision", maxSelect: 1, values: ["minute", "hour", "day"] },
      { type: "date", name: "published_utc" },
      { type: "number", name: "lat" },
      { type: "number", name: "lon" },
      { type: "text", name: "latlon_source", max: 500 },
      { type: "select", name: "scope", required: true, maxSelect: 1, values: SCOPE },
      { type: "select", name: "phase", required: true, maxSelect: 1, values: PHASE },
      { type: "select", name: "kind", maxSelect: 1, values: ["warning", "forecast", "incident", "news", "recovery"] },
      { type: "text", name: "title_th", required: true, max: 5000 },
      { type: "number", name: "value" },
      { type: "text", name: "unit", max: 100 },
      { type: "url", name: "media_url" },
      { type: "url", name: "source_url", required: true },
      { type: "select", name: "confidence", maxSelect: 1, values: ["measured", "inferred"] },
      { type: "text", name: "storm_id", max: 100 },
      { type: "text", name: "event_id", max: 300 },
      { type: "text", name: "severity", max: 50 },
      { type: "json", name: "nearby_floodboy", maxSize: 20000 },
      { type: "text", name: "note", max: 2000 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_news_key` ON `news` (`key`)",
      "CREATE INDEX `idx_news_time` ON `news` (`time_utc`)",
      "CREATE INDEX `idx_news_storm` ON `news` (`storm_id`)",
    ],
  }))

  app.save(new Collection({
    type: "base",
    name: "events",
    listRule: PUBLIC, viewRule: PUBLIC,
    createRule: SUPERUSERS_ONLY, updateRule: SUPERUSERS_ONLY, deleteRule: SUPERUSERS_ONLY,
    fields: [
      { type: "text", name: "key", required: true, max: 300 },
      { type: "text", name: "event_date", required: true, max: 30 },
      { type: "date", name: "event_start" },
      { type: "date", name: "event_end" },
      { type: "number", name: "year", onlyInt: true },
      { type: "bool", name: "historical" },
      { type: "select", name: "scope", required: true, maxSelect: 1, values: SCOPE },
      { type: "text", name: "region", max: 50 },
      { type: "text", name: "province", max: 100 },
      { type: "text", name: "province_text", max: 1000 },
      { type: "json", name: "provinces", maxSize: 5000 },
      { type: "text", name: "district", max: 500 },
      { type: "text", name: "place", max: 2000 },
      { type: "number", name: "lat" },
      { type: "number", name: "lon" },
      { type: "text", name: "latlon_source", max: 500 },
      { type: "text", name: "type", max: 50 },
      { type: "select", name: "kind", maxSelect: 1, values: ["warning", "forecast", "incident", "news", "recovery"] },
      { type: "select", name: "phase", maxSelect: 1, values: PHASE },
      { type: "text", name: "severity", max: 50 },
      { type: "bool", name: "verified" },
      { type: "text", name: "summary_th", max: 10000 },
      { type: "json", name: "numbers", maxSize: 20000 },
      { type: "number", name: "p1_peak_m" },
      { type: "text", name: "p1_peak_date", max: 30 },
      { type: "json", name: "nearby_floodboy", maxSize: 20000 },
      { type: "json", name: "source_urls", maxSize: 50000 },
      { type: "json", name: "sources", maxSize: 200000 },
      { type: "text", name: "note", max: 2000 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_events_key` ON `events` (`key`)",
      "CREATE INDEX `idx_events_scope` ON `events` (`scope`)",
    ],
  }))
}, (app) => {
  for (const name of ["news", "events"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch (_) {
      // already gone
    }
  }
})
