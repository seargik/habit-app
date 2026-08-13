"use strict";

const assert = require("node:assert/strict");
const model = require("../migration-v4.js");
const carryover = require("../legacy-carryover-v4.js");

const v3 = {
  version: 3,
  createdAt: "2026-05-16T05:05:04.216Z",
  habits: [
    { id: "legacy_a", name: "Legacy A", min: "A" },
    { id: "legacy_b", name: "Legacy B", min: "B" }
  ],
  entries: {
    "2026-08-09": {
      date: "2026-08-09",
      metrics: {},
      habits: {
        legacy_a: { status: "done", comment: "real post-cutover v3 data" },
        legacy_b: { status: "", comment: "" }
      },
      dayNote: "",
      updatedAt: "2026-08-09T12:00:00.000Z"
    }
  }
};

const migrated = model.migrateV3ToV4(v3);
const historyBeforeInstall = JSON.stringify(migrated.entries);

assert.deepEqual(
  model.definitionsForDate(migrated, "2026-08-09").map((h) => h.id),
  [
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
  ],
  "base v4 definitions should still be the only normal definitions after cutover"
);

carryover.install(model);
const defs = model.definitionsForDate(migrated, "2026-08-09");
const legacyA = defs.find((h) => h.id === "legacy_a");
const legacyB = defs.find((h) => h.id === "legacy_b");

assert.ok(legacyA, "meaningful legacy record after cutover must remain visible");
assert.equal(legacyA._legacyCarryover, true);
assert.match(legacyA.name, /^Legacy carryover · /);
assert.equal(legacyB, undefined, "empty legacy placeholder after cutover should stay hidden");
assert.equal(JSON.stringify(migrated.entries), historyBeforeInstall, "carryover visibility must not rewrite history");

assert.equal(carryover.hasMeaningfulRecord({ status: "", comment: "", notes: "" }), false);
assert.equal(carryover.hasMeaningfulRecord({ status: "min", comment: "" }), true);
assert.equal(carryover.hasMeaningfulRecord({ status: "", comment: "text" }), true);

console.log("legacy-carryover-v4 tests: PASS");
