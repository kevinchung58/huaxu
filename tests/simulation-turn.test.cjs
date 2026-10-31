/* A sweep must actually attain each heading. A tap can move almost 3 degrees, so a smaller
   acceptance window can oscillate forever between two headings; a failed turn must not look like
   completed coverage. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function turnFunction(file, env) {
  const src = fs.readFileSync(path.resolve(__dirname, "../.verify", file), "utf8");
  const match = src.match(/const turnTo = async \(target\) => \{[\s\S]*?\n\s*\};/);
  assert.ok(match, `${file}: a heading instrument exists`);
  return new Function("env", "FILE", "file", `${match[0]}\nreturn turnTo;`)(env, "fixture.html", "fixture.html");
}

for (const file of ["_wedge.cjs", "_wedge2.cjs", "verify-collision.cjs"]) {
  test(`${file} accepts a heading within half a tap without oscillating`, async () => {
    let yaw = 0, dir = 0, frames = 0;
    const env = { walk: () => ({ yaw }), key: (key) => { dir = key === "arrowright" ? 1 : -1; },
      keyUp: () => { dir = 0; }, pump: async (n) => { frames += n; yaw += dir * 2.975 * n / 2; } };
    await turnFunction(file, env)(1.49);
    assert.ok(frames <= 4, `unnecessary oscillation: ${frames} frames`);
    assert.ok(Math.abs(yaw - 1.49) <= 1.5, `wrong yaw: ${yaw}`);
  });
  test(`${file} rejects a heading that cannot be reached`, async () => {
    const env = { walk: () => ({ yaw: 0 }), key() {}, keyUp() {}, pump: async () => {} };
    await assert.rejects(turnFunction(file, env)(90), /could not turn/i);
  });
}
