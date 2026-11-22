const assert = require("assert");
const { getReturnDate } = require("./services/travelDates");

assert.strictEqual(
  getReturnDate("2026-03-10T00:00:00.000Z", 3).toISOString(),
  "2026-03-12T00:00:00.000Z"
);
assert.strictEqual(
  getReturnDate("2026-03-10T00:00:00.000Z", 1).toISOString(),
  "2026-03-10T00:00:00.000Z"
);
assert.strictEqual(getReturnDate(null, 3), null);
assert.strictEqual(getReturnDate("invalid-date", 3), null);
assert.strictEqual(getReturnDate("2026-03-10", 0), null);
