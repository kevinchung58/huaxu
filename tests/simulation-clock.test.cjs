/* jsdom exposes window.performance through a getter: assigning a replacement silently does nothing.
   These movement harnesses must advance performance.now with the rAF timestamps they pump. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

function extractBoot(name, marker) {
  const file = path.resolve(__dirname, "../.verify", name);
  const source = fs.readFileSync(file, "utf8");
  const end = source.indexOf(marker);
  assert.ok(end > 0, `${name}: the boot boundary exists`);
  const module = { exports: {} };
  new Function("require", "module", `${source.slice(0, end)}\nmodule.exports = { boot };`)(createRequire(file), module);
  return module.exports.boot;
}

const boots = [
  ["shared unit harness", require("./helpers/boot.cjs").boot],
  ["collision gate", extractBoot("verify-collision.cjs", "\nasync function pageGate")],
  ["room journey gate", extractBoot("verify-rooms-e2e.cjs", "\nasync function walkDeep")],
  ["wall probe", extractBoot("wall-probe.cjs", "\nasync function probePage")],
  ["aisle probe", extractBoot("_aisleprobe.cjs", "\nasync function walkDeep")],
];
for (const [name, boot] of boots) {
  test(`${name} uses the simulated frame clock for input timing`, async () => {
    const env = await boot("rooms.html");
    try {
      const start = env.w.performance.now();
      await env.pump(3);
      assert.equal(env.w.performance.now() - start, 51);
    } finally { env.w.close(); }
  });
}
