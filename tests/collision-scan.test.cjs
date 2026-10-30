/* Exercise the collision gate's real painted-wall scan against a synthetic world. The walker
   supplies the bounds; inventing dataset fields can silently truncate an otherwise green gate. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../.verify/verify-collision.cjs"), "utf8");
const start = source.indexOf("  // V4 (round 45):");
const end = source.indexOf("\n  // V2:", start);
assert.ok(start >= 0 && end > start, "the painted-wall scan is present");
assert.equal(source.indexOf("  // V4 (round 45):", start + 1), -1, "the scan has one anchor");
const scan = new vm.Script(`(() => {\n${source.slice(start, end)}\n})()`);

function run(z, blocked, maxDepth = 15900) {
  const prim = { t: "f", p: [[-20, 0, z], [20, 0, z], [20, 200, z], [-20, 200, z]] };
  const layer = { dataset: { laneW: "400" } }; // no invented laneStart/laneLen attributes
  const backdrop = { textContent: JSON.stringify({ world: { prims: [prim] } }), dataset: {} };
  const W = { wallHalf: 200, halfWidth: 176, minDepth: -30, maxDepth,
              blockedAt: () => blocked };
  const env = { doc: { querySelector: (s) => s === "[data-walk]" ? layer : backdrop },
                w: {}, walk: () => W };
  let verdict;
  scan.runInNewContext({ env, W, mn: W.minDepth, mx_: W.maxDepth, file: "fixture.html",
    ok: (name, pass, detail) => { verdict = { name, pass, detail }; } });
  return verdict;
}

test("a painted wall past 60 m is checked inside the walker's actual range", () => {
  const r = run(8000, false);
  assert.equal(r.pass, false, r.detail);
  assert.match(r.detail, /1 bottom-edge runs scanned/);
});

test("a longer walk is not capped at 300 m", () => {
  const r = run(32000, false, 45000);
  assert.equal(r.pass, false, r.detail);
  assert.match(r.detail, /1 bottom-edge runs scanned/);
});

test("a painted wall before depth zero is checked inside the walker's actual range", () => {
  const r = run(-20, false);
  assert.equal(r.pass, false, r.detail);
  assert.match(r.detail, /1 bottom-edge runs scanned/);
});

test("a covered painted wall remains a pass", () => {
  const r = run(8000, true);
  assert.equal(r.pass, true, r.detail);
  assert.match(r.detail, /1 bottom-edge runs scanned/);
});
