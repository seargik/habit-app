"use strict";

const assert = require("node:assert/strict");
const model = require("../migration-v4.js");

const v3 = {
  version: 3,
  appVersion: "3.0-public-safe",
  createdAt: "2026-05-16T05:05:04.216Z",
  habits: [
    { id: "trading_discipline", name: "Trading", min: "legacy trading minimum" },
    { id: "son_quality_time", name: "Son", min: "legacy fatherhood text" }
  ],
  entries: {
    "2026-05-15": {
      date: "2026-05-15",
      metrics: { sleep: "7", energy: "4", stress: "3", body: "4" },
      habits: {
        trading_discipline: { status: "fail", comment: "old trade comment" },
        son_quality_time: { status: "min", comment: "old son comment" },
        h1: { status: "", comment: "" }
      },
      dayNote: "old day note",
      updatedAt: "2026-05-16T05:10:43.366Z"
    },
    "2026-08-08": {
      date: "2026-08-08",
      metrics: { sleep: "", energy: "", stress: "", body: "" },
      habits: {
        trading_discipline: { status: "", comment: "" },
        son_quality_time: { status: "", comment: "" }
      },
      dayNote: "",
      updatedAt: "2026-08-08T10:31:44.124Z"
    }
  },
  unknownFutureField: { preserveMe: true }
};

const originalJson = JSON.stringify(v3);
const migrated = model.migrateV3ToV4(v3);

assert.equal(JSON.stringify(v3), originalJson, "source v3 object must not be mutated");
assert.equal(migrated.version, 4);
assert.deepEqual(migrated.entries, v3.entries, "entries must be exactly preserved");
assert.deepEqual(migrated.unknownFutureField, { preserveMe: true }, "unknown top-level fields must survive");
assert.equal(migrated.habits.filter((h) => h.definitionSetId === "legacy_v3").length, 2);
assert.equal(migrated.habits.filter((h) => h.definitionSetId === "life_v4").length, 10);

const oldDate = model.definitionsForDate(migrated, "2026-07-09");
assert.deepEqual(oldDate.map((h) => h.id), ["trading_discipline", "son_quality_time"]);
assert.ok(oldDate.every((h) => h.startDate === "2026-05-15"));
assert.ok(oldDate.every((h) => h.endDate === "2026-08-07"));

const cutoverDate = model.definitionsForDate(migrated, "2026-08-08");
assert.equal(cutoverDate.length, 10);
assert.deepEqual(cutoverDate.map((h) => h.id), [
  "ai_engineering",
  "metaforge_product",
  "trading_investing",
  "career_income",
  "body_nutrition",
  "son_connection",
  "people_contact",
  "money",
  "recovery_tomorrow",
  "life_experience"
]);
assert.equal(cutoverDate.some((h) => h.id === "trading_discipline"), false);
assert.equal(migrated.entries["2026-08-08"].habits.trading_discipline.status, "", "old raw keys remain untouched on cutover day");

const settings = model.definitionsForSettings(migrated, "2026-08-08");
assert.ok(settings.slice(0, 10).every((h) => h.definitionSetId === "life_v4"), "currently valid definitions come first in settings");
assert.ok(settings.slice(10).every((h) => h.definitionSetId === "legacy_v3"), "expired definitions follow current definitions");

const migratedAgain = model.normalizeV4(migrated);
assert.deepEqual(migratedAgain.entries, v3.entries, "normalizing v4 must not change history");

assert.throws(
  () => model.migrateV3ToV4({ version: 2, habits: [], entries: {} }),
  /Expected schema version 3/,
  "wrong source version must be rejected rather than silently rewritten"
);

console.log("migration-v4 tests: PASS");
