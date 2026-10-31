/* The map is a geometric diagnostic, not a screenshot. It must not name an invisible or clipped
   ray hit as the surface in a pixel, and the sky is a background rather than an occluding mesh. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../.verify/_map.mjs"), "utf8");
const anchor = "const out = await page.evaluate(";
const start = source.indexOf(anchor);
const end = source.indexOf("\n}, { COLS, ROWS, VW, VH, PROBES: PROBE });", start);
assert.ok(start >= 0 && end > start, "the map's page-side raycast is present");
assert.equal(source.indexOf(anchor, start + 1), -1, "the raycast has one anchor");
const callback = source.slice(start + anchor.length, end + 2);
const script = new vm.Script(`(${callback})({ COLS: 1, ROWS: 1, VW: 1024, VH: 768, PROBES: [] })`);

function hit(name, { opacity = 1, clipZ = 0, visible = true, parent = null, blending, isSprite = false } = {}) {
  return { object: { name, visible, parent, isSprite, material: { opacity, blending }, geometry: {} },
           point: { clone: () => ({ project: () => ({ z: clipZ }) }) }, distance: 100 };
}
function map(hits) {
  const T = { AdditiveBlending: 2, Vector2: class {}, Raycaster: class {
    setFromCamera() {} intersectObjects() { return hits; }
  } };
  return script.runInNewContext({ window: { __THREE: T, __cam: {}, __threeScene: { children: [] } } });
}

test("a zero-opacity effect cannot conceal the visible surface", () => {
  assert.equal(map([hit("invisible", { opacity: 0 }), hit("surface")]).cells[0][0], "surface");
});

test("a glow or sprite does not hide the surface behind it", () => {
  assert.equal(map([hit("glow", { blending: 2, opacity: 0.17 }), hit("surface")]).cells[0][0], "surface");
  assert.equal(map([hit("sprite", { isSprite: true }), hit("surface")]).cells[0][0], "surface");
});

test("geometry behind the background sky is still visible", () => {
  assert.equal(map([hit("authored sky"), hit("surface")]).cells[0][0], "surface");
});

test("a clipped surface cannot conceal the sky", () => {
  assert.equal(map([hit("clipped", { clipZ: 2 }), hit("authored sky")]).cells[0][0], "authored sky");
});

test("a hidden parent and an empty scene are reported honestly", () => {
  assert.equal(map([hit("hidden", { parent: { visible: false } }), hit("surface")]).cells[0][0], "surface");
  assert.equal(map([]).cells[0][0], "EMPTY");
});
