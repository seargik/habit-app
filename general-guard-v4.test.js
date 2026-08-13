"use strict";

const assert = require("node:assert/strict");
const guard = require("../general-guard-v4.js");

assert.equal(guard.isValidGeneral(""), true);
assert.equal(guard.isValidGeneral("0"), true);
assert.equal(guard.isValidGeneral("7.5"), true);
assert.equal(guard.isValidGeneral("10"), true);
assert.equal(guard.isValidGeneral("-0.1"), false);
assert.equal(guard.isValidGeneral("10.1"), false);
assert.equal(guard.isValidGeneral("abc"), false);

class MemoryStorage {
  constructor(value) { this.value = value; }
  getItem(key) { return key === "lifeTrackerData.v4" ? this.value : null; }
}

const storage = new MemoryStorage(JSON.stringify({
  version: 4,
  entries: {
    "2026-08-12": { metrics: { general: "7.5" } },
    "2026-08-11": { metrics: {} }
  }
}));

assert.equal(guard.storedGeneralForDate(storage, "2026-08-12"), "7.5");
assert.equal(guard.storedGeneralForDate(storage, "2026-08-11"), "");
assert.equal(guard.storedGeneralForDate(storage, "2026-01-01"), "");

const elements = {
  general: { value: "12" },
  dateInput: { value: "2026-08-12" },
  saveStatus: { textContent: "" }
};
const root = {
  localStorage: storage,
  document: { getElementById: (id) => elements[id] || null }
};

assert.equal(guard.sanitizeGeneralInput(root), false, "invalid General should be rejected");
assert.equal(elements.general.value, "7.5", "invalid General should be restored to the last persisted value");
assert.match(elements.saveStatus.textContent, /not saved/i);

assert.equal(guard.sanitizeGeneralInput(root), true, "restored valid value should pass");

console.log("general-guard-v4 tests: PASS");
