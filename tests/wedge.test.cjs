/* The wide movement probe must exercise the same place data as the live page, rather than an
   empty backdrop after external scripts are stripped by jsdom. Extract its boot function so this
   regression checks the real instrument without running the long diagnostic sweep. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const vm = require("node:vm");

function loadProbe(name) {
  const probe = path.resolve(__dirname, `../.verify/${name}.cjs`);
  const source = fs.readFileSync(probe, "utf8");
  const end = source.indexOf("\n(async () => {");
  assert.ok(end > 0, `${name}: the sweep starts after its boot function`);
  const mod = { exports: {} };
  new Function("require", "module", `${source.slice(0, end)}\nmodule.exports = { boot, patchedSite: typeof patchedSite === "function" ? patchedSite : null };`)(createRequire(probe), mod);
  return { ...mod.exports, source, probe };
}

async function withPage(boot, file, check) {
  const env = await boot(file);
  try {
    assert.equal(env.errors.length, 0, env.errors.slice(0, 3).join(" / "));
    await check(env);
  } finally {
    env.w.close();
  }
}

for (const name of ["_wedge", "_wedge2"]) {
  const { boot } = loadProbe(name);
  test(`${name} boots each externally sourced world`, async (t) => {
    for (const place of ["cntower", "goat", "journey", "niagara"]) {
      await t.test(place, () => withPage(boot, `rooms-${place}.html`, (env) => {
        const backdrop = env.w.__HX_PLACES?.[place]?.["data-walk-backdrop"];
        assert.ok(backdrop?.world?.prims?.length > 0, `${place}: sourced world data is present`);
        assert.equal(env.walk().backdrop, backdrop, `${place}: the walker loaded that world`);
      }));
    }
  });

  test(`${name} advances the input clock with its simulated frames`, () => withPage(boot, "rooms.html", async (env) => {
    const before = env.w.performance.now();
    await env.pump(3);
    assert.equal(env.w.performance.now() - before, 51, "key timing and animation frames share the same clock");
  }));

  test(`${name} still boots an inline-data room`, () => withPage(boot, "rooms.html", (env) => {
    assert.ok(env.walk(), "the walker is ready");
    assert.ok(env.doc.querySelectorAll("[data-walk-stop]").length > 0, "the rail stops are present");
  }));

  test(`${name} chooses the requested page before beginning the sweep`, () => {
    const { source, probe } = loadProbe(name);
    const anchor = "const env = await boot(FILE);";
    assert.equal(source.split(anchor).length - 1, 1, "one boot anchor");
    const capture = source.replace(anchor, "globalThis.selectedPage = FILE; return;");
    const choose = (argv, env) => {
      const context = { require: createRequire(probe), process: { argv, env }, console };
      vm.runInNewContext(capture, context, { filename: probe });
      return context.selectedPage;
    };
    assert.equal(choose(["node", probe], { GATE_PAGE: "rooms-niagara" }), "rooms-niagara.html");
    assert.equal(choose(["node", probe, "street.html"], { GATE_PAGE: "rooms-niagara" }), "street.html");
  });
}

// Exercise each instrument's own exit calculation on a widened lane. The real walker reports
// that the east exit is blocked (as a painted wall can be even when no DOM prop occupies it).
async function diagnosticExits(name) {
  const { source, probe } = loadProbe(name);
  const anchor = "const env = await boot(FILE);";
  let instrument = source.replace(anchor, "const env = globalThis.fixture;");
  assert.notEqual(instrument, source, "the diagnostic boot was replaced once");
  const layer = { getAttribute: (key) => key === "data-lane-ws" ? "[[8294,9396,1750]]" : null };
  const prop = {
    dataset: { obj: "fixture", w: "20", d: "10", ry: "0" },
    style: { getPropertyValue: (key) => key === "--x" ? "965" : key === "--z" ? "8500" : "" },
  };
  const walk = { x: 1000, depth: 8500, yaw: 0, halfWidth: 676, radius: 24,
    minDepth: -30, maxDepth: 10350, blockedAt: (x) => x > 1000,
    solver: { contact: null, vx: 0, vd: 0 } };
  const fixture = { walk: () => walk, key() {}, keyUp() {}, pump: async () => {}, w: {},
    doc: { querySelector: (key) => key === "[data-walk]" ? layer : null, querySelectorAll: () => [prop] } };
  let stall;
  const context = { require: createRequire(probe), fixture,
    process: { argv: ["node", probe], env: { ROUNDS: "1" } },
    console: { log: (label, data) => { if (label === "STALL") stall = JSON.parse(data); } } };
  if (name === "_wedge") {
    const end = instrument.indexOf('  const stops = Array.from(env.doc.querySelectorAll("[data-walk-stop]"));');
    assert.ok(end > 0, "the sweep boundary is present");
    instrument = `${instrument.slice(0, end)}\n  await watch(["w"], 21);\n})();`;
  } else {
    const end = instrument.indexOf("    let hits = 0, frames = 0;");
    assert.ok(end > 0, "the traced exit boundary is present");
    instrument = `${instrument.slice(0, end)}\n    globalThis.exits = forwardExits(1000, 8500, 0, ["w"]);\n  }\n})();`;
  }
  await vm.runInNewContext(instrument, context, { filename: probe });
  return name === "_wedge" ? stall?.exits : Array.from(context.exits);
}

for (const name of ["_wedge", "_wedge2"]) {
  test(`${name} respects widened bounds and real painted-wall colliders when finding exits`, async () => {
    assert.deepEqual(await diagnosticExits(name), [0, 315]);
  });
}

test("a sweep cannot report coverage for a missed or unfinished rail stop", () => {
  const helper = path.resolve(__dirname, "../.verify/_wedge-geometry.cjs");
  assert.ok(fs.existsSync(helper), "the probe's stop check is available");
  const { atStop } = require(helper);
  const stop = { style: { getPropertyValue: (key) => key === "--z" ? "100" : key === "--x" ? "20" : "" } };
  assert.equal(atStop({ x: 20, depth: 100, glide: null }, stop), true);
  assert.equal(atStop({ x: 20, depth: 100, glide: { x: 20, z: 100 } }, stop), false);
  assert.equal(atStop({ x: 0, depth: 100, glide: null }, stop), false, "a lateral miss is not arrival");
  assert.equal(atStop({ x: 20, depth: 92, glide: null }, stop), false, "a depth miss is not arrival");
  assert.equal(atStop({ x: NaN, depth: 100, glide: null }, stop), false);
  const centered = { style: { getPropertyValue: (key) => key === "--z" ? "100" : "" } };
  assert.equal(atStop({ x: 47, depth: 100, glide: null }, centered), true, "an un-authored x stays free");
});

test("the stop sweep returns to the authored stop before every movement", async () => {
  const { source } = loadProbe("_wedge");
  const start = source.indexOf('  const stops = Array.from(env.doc.querySelectorAll("[data-walk-stop]"));');
  const end = source.indexOf("  for (const b of props) {", start);
  assert.ok(start > 0 && end > start, "the stop sweep is present");
  const run = new Function("env", "atStop", "turnTo", "watch", "console", "process", "FILE", "props",
    `return (async () => { ${source.slice(start, end)} })();`);
  const state = { x: 20, depth: 100, glide: null };
  const stop = { style: { getPropertyValue: (key) => key === "--z" ? "100" : key === "--x" ? "20" : "" },
    click() { state.x = 20; state.depth = 100; } };
  const env = { doc: { querySelectorAll: () => [stop] }, walk: () => state, pump: async () => {} };
  const visits = [];
  const watch = async (keys) => { visits.push([state.x, state.depth, keys.join("+")]); state.depth += 10; };
  const { atStop } = require("../.verify/_wedge-geometry.cjs");
  await run(env, atStop, async () => {}, watch, { log() {} }, { exit: () => { throw Error("bad coverage"); } }, "fixture.html", []);
  assert.equal(visits.length, 18, "16 headings and two forward/turn combinations are exercised");
  assert.ok(visits.every(([x, z]) => x === 20 && z === 100), JSON.stringify(visits));
});

test("solver tracing records rounded numbers without changing solver precision", () => {
  const { patchedSite } = loadProbe("_wedge2");
  const patched = patchedSite();
  const along = patched.split("\n").find((line) => line.includes("__d.along0"));
  const hop = patched.split("\n").find((line) => line.includes("__d.hop2"));
  assert.ok(along && hop, "both diagnostic anchors are present");
  const readAlong = new Function("cx", "oldX", "tX", "cz", "oldDepth", "tD", "__d", `${along}\nreturn along;`);
  const readHop = new Function("sx", "oldX", "sd", "oldDepth", "h2", "__d", `${hop}\nreturn hop2;`);
  const input = 1.20049;
  assert.equal(readAlong(input, 0, 1, 0, 0, 0, {}), input, "the along value is not rounded before the solver reads it");
  assert.equal(readHop(input, 0, 0, 0, null, {}), input, "the hop threshold sees the original distance");
});
