/// <reference path="../pb_data/types.d.ts" />
// Console command: load the open flood data from JSON files, upserting by `key`, so it is safe
// to run on every deploy. Rows not in the files are left alone (nothing is deleted).
//   pocketbase floodboy-import <events.json> <news.json> --dir ... --migrationsDir ... --hooksDir ...
// events.json: {"meta": ..., "events": [...]} with `id` per row (stored as `key`).
// news.json: a JSON array with `id` per row (stored as `key`).
$app.rootCmd.addCommand(new Command({
  use: "floodboy-import <events.json> <news.json>",
  short: "Upsert open flood data (events + news) from JSON files",
  run: (cmd, args) => {
    if (!args || args.length !== 2) throw new Error("usage: floodboy-import <events.json> <news.json>")

    const upsert = (collectionName, rows) => {
      const collection = $app.findCollectionByNameOrId(collectionName)
      const fields = collection.fields.fieldNames()
      let created = 0
      let updated = 0
      for (const row of rows) {
        const key = String(row.id || "")
        if (!key) throw new Error(collectionName + ": row without id")
        let record
        try {
          record = $app.findFirstRecordByData(collectionName, "key", key)
          updated++
        } catch (_) {
          record = new Record(collection)
          created++
        }
        record.set("key", key)
        for (const name of Object.keys(row)) {
          if (name === "id" || fields.indexOf(name) < 0) continue
          const value = row[name]
          record.set(name, value === undefined ? null : value)
        }
        $app.save(record)
      }
      console.log(collectionName + ": " + created + " created, " + updated + " updated")
    }

    const events = JSON.parse(toString($os.readFile(args[0])))
    upsert("events", Array.isArray(events) ? events : events.events)
    upsert("news", JSON.parse(toString($os.readFile(args[1]))))
  },
}))
