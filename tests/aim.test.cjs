/* Arrival must distinguish a stopped body from a body at the requested x AND z. */
const test = require("node:test");
const assert = require("node:assert/strict");

async function check(target, at) {
  const { arrive } = await import("../.verify/_aim.mjs");
  let calls = 0;
  const page = { evaluate: async () => {
    calls += 1;
    if (calls === 1) return target; // stopTarget
    if (calls === 2) return;        // click
    return { ...at, yaw: 0, pitch: 0, quads: 1, frameMs: 0, glide: null };
  } };
  return arrive(page, 0, { tol: 6, arriveMs: 900, settleSamples: 0 });
}

test("arrival refuses a body stopped at the right depth but the wrong lateral position", async () => {
  const r = await check({ z: 100, x: 50 }, { z: 100, x: 10 });
  assert.equal(r.arrived, false);
  assert.equal(r.blocked, true, r.why);
  assert.equal(r.short, 0);
  assert.equal(r.shortX, -40);
  assert.match(r.why, /--x/);
});

test("arrival accepts an unauthored x and the requested depth", async () => {
  const r = await check({ z: 100, x: null }, { z: 100, x: 10 });
  assert.equal(r.arrived, true);
  assert.equal(r.blocked, false);
});
