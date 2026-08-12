"use strict";

const assert = require("node:assert/strict");
const metrics = require("../metric-visibility-v4.js");

class MemoryStorage {
  constructor(initial = {}) { this.map = new Map(Object.entries(initial)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

assert.deepEqual(
  metrics.normalizeVisibleMetrics(undefined),
  ["general", "sleep", "energy", "stress", "body"],
  "missing visibility settings should keep all metrics visible"
);
assert.deepEqual(
  metrics.normalizeVisibleMetrics(["general", "energy", "energy", "unknown"]),
  ["general", "energy"],
  "visibility settings should deduplicate and ignore unsupported metric ids"
);

const data = {
  version: 4,
  settings: { visibleMetrics: ["general", "sleep", "energy", "stress", "body"] },
  entries: {
    "2026-07-01": {
      date: "2026-07-01",
      metrics: { sleep: "8", energy: "3", stress: "4", body: "3" }
    }
  }
};
const storage = new MemoryStorage({ "lifeTrackerData.v4": JSON.stringify(data) });
const historyBefore = JSON.stringify(metrics.readData(storage).entries);

assert.equal(metrics.writeVisibleMetrics(storage, ["general", "sleep"]), true);
const updated = metrics.readData(storage);
assert.deepEqual(updated.settings.visibleMetrics, ["general", "sleep"]);
assert.equal(JSON.stringify(updated.entries), historyBefore, "changing metric visibility must not modify historical metric values");

assert.equal(metrics.writeVisibleMetrics(storage, []), true, "all metric boxes may be hidden without deleting stored values");
assert.deepEqual(metrics.readData(storage).settings.visibleMetrics, []);
assert.equal(JSON.stringify(metrics.readData(storage).entries), historyBefore);

console.log("metric-visibility-v4 tests: PASS");
