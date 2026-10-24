#!/usr/bin/env node
/*
 * The Three.js walkable-scene gate. Run from the repository root after `_gen_html.py`:
 * `node bin/verify-three.mjs`.
 *
 * This is a structural/geometry gate, not a visual claim: it imports the exact vendored runtime,
 * converts every generated sourced-world record through the production triangulator, and asserts
 * that each emitted value is finite and every world verb has a renderer path. Browser appearance
 * still requires the scene screenshots and a real WebGL-capable browser review.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as THREE from "../js/vendor/three-0.186.1/three.module.js";
import { buildLaneGeometry, buildWaterGeometry, buildWorldGeometry, createSceneEffects } from "../js/scene3d.js";

const ROOT = process.cwd();
const VERSION = "0.186.1";
const supported = new Set(["f", "x", "w", "m", "l", "rb", "fw"]);
const pageFiles = fs.readdirSync(ROOT).filter((name) => /^rooms.*\.html$/.test(name) || name === "street.html").sort();
const sceneSource = fs.readFileSync(path.join(ROOT, "js/scene3d.js"), "utf8");
const siteSource = fs.readFileSync(path.join(ROOT, "js/site.js"), "utf8");
const generator = fs.readFileSync(path.join(ROOT, "_gen_html.py"), "utf8");
const cssSource = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
const license = path.join(ROOT, `js/vendor/three-${VERSION}/LICENSE`);

assert.equal(THREE.REVISION, "186", "the imported runtime must match Three.js 0.186.1");
assert.ok(fs.statSync(license).size > 900, "the upstream MIT license must ship beside the runtime");
assert.match(sceneSource, new RegExp(`const THREE_VERSION = "${VERSION}"`));
assert.match(sceneSource, /world\.prims/);
assert.match(sceneSource, /buildLaneGeometry\(THREE, state\.quads, state\)/,
  "each frame's world-space lane polygons must be submitted to Three.js");
assert.match(sceneSource, /new THREE\.Mesh\(new THREE\.BufferGeometry\(\), material\)/,
  "walk geometry must be drawn by depth-tested Three.js meshes");
assert.match(sceneSource, /function createSceneEffects\(/,
  "dynamic lamps, pools, shadows and wires must have a Three.js scene-effects pass");
assert.match(sceneSource, /3D lamp halo[\s\S]*3D ground pool[\s\S]*3D wire or lamp cord[\s\S]*3D authored wall shadow/,
  "lighting, reflections, wall shadows and overhead lines must stay in world space");
assert.match(siteSource, /noteOffline,/,
  "the lane must publish the renderer-less channel the mount reports through");
assert.match(sceneSource, /api\.noteOffline\(\)/,
  "a refused mount must raise the lane's own no-WebGL statement, not only the card's note");
assert.match(siteSource, /effects: \{ lamps, wires, marks, surfaces, wall: WALL/,
  "site.js must submit the authored light records to the Three.js frame");
// round 54, at the owner's ruling ("全站該是 3d js"): the Canvas2D lane painter is deleted, and
// this gate is what keeps it deleted — any revival of paint calls or of the second canvas fails here.
assert.doesNotMatch(siteSource, /g\.fillRect|forEach\(emit\)|canvas2d|getContext\("2d"\)(?![\s\S]{0,80}tile)/,
  "no Canvas2D lane painting may return to site.js");
assert.match(cssSource, /\.walk-three-canvas \{\s*position: absolute;[\s\S]{0,140}z-index: 1/);
assert.doesNotMatch(cssSource, /\.walk-canvas/, "the fallback canvas has no styles to inherit back to life");
assert.match(cssSource, /\.walk-hits \{[\s\S]*?z-index: 3/);
assert.match(siteSource, /if \(bd\) drawFar\(C\);/,
  "compact distant scenes must also reach the 3D renderer");
assert.doesNotMatch(siteSource, /drawWorld\(/,
  "the surveyed world is scene3d's alone now: no second painter may redraw it");
assert.match(generator, /js\/scene3d\.js/);
assert.match(generator, /three-0\.186\.1\/three\.core\.js/);
assert.match(generator, /three-0\.186\.1\/three\.module\.js/);

let worldPages = 0, totalTriangles = 0, totalWaterTriangles = 0, totalWater = 0, totalMist = 0;
let walkPages = 0;
for (const file of pageFiles) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  if (!html.includes('class="walk"')) continue;
  walkPages++;
  assert.match(html, /<canvas class="walk-three-canvas" data-walk-three/,
    `${file} needs a Three.js scene canvas`);
  assert.doesNotMatch(html, /data-walk-canvas/,
    `${file} must not carry a fallback canvas — the lane is Three.js only`);
  assert.match(html, /<script type="module" src="js\/scene3d\.js\?v=[0-9a-z]+"><\/script>/,
    `${file} needs the cache-busted Three.js bridge`);
  // Round 55: there is no fallback picture, so the renderer-less lane must ship the panel that says
  // so — and it must ship it closed, because a lane that always wears that panel is a broken page.
  // Round 64: the panel carries role="status" — it is the live region that announces why the
  // lane cannot be drawn, and a live region nested inside another live region is worse than
  // none. So the markup reads `... hidden role="status">` and this check reads the panel as
  // "the panel element, shipped closed" instead of as one literal string.
  assert.match(html, /<div class="walk-offline" data-walk-offline hidden[^>]*>/,
    `${file} needs the no-WebGL panel, shipped closed`);
  assert.match(html, /data-walk-offline-where/, `${file} needs the panel's standing-position line`);
  /* P2 (round 69): a big place keeps its world data in js/places/<place>.js and leaves an empty
     marker carrying `data-place`. Read the marker's file exactly as the page's <script src> does —
     the check is still "what does this page hand the renderer", just through the file it points at
     instead of through an inline blob. */
  const inline = html.match(/<script type="application\/json" data-walk-backdrop>([\s\S]*?)<\/script>/);
  const marker = html.match(/<script type="application\/json" data-walk-backdrop data-place="([a-z0-9-]+)"><\/script>/);
  let backdrop = null;
  if (inline) {
    backdrop = JSON.parse(inline[1]);
  } else if (marker) {
    const dataFile = path.join(ROOT, "js", "places", `${marker[1]}.js`);
    assert.ok(fs.existsSync(dataFile), `${file} points its world at ${dataFile}, which the generator did not write`);
    const src = fs.readFileSync(dataFile, "utf8");
    const assignment = src.slice(src.indexOf("window.__HX_PLACES["));
    const obj = assignment.slice(assignment.indexOf("=") + 1, assignment.lastIndexOf(";"));
    const store = JSON.parse(obj);
    backdrop = store["data-walk-backdrop"];
    assert.ok(backdrop && backdrop.world, `${dataFile} must carry the backdrop the marker promises`);
  }
  if (!backdrop) continue;
  const prims = backdrop.world && backdrop.world.prims;
  if (!Array.isArray(prims) || !prims.length) continue;

  worldPages++;
  const types = new Set(prims.map((p) => p.t || "f"));
  for (const type of types) assert.ok(supported.has(type), `${file} has an unhandled world type: ${type}`);

  const geometry = buildWorldGeometry(THREE, backdrop.world);
  assert.ok(geometry.triangles > 0, `${file} must emit 3D triangles`);
  assert.equal(geometry.unsupported.length, 0, `${file} must not drop a world verb`);
  assert.ok(geometry.groups.length > 0, `${file} must produce material batches`);
  if (file === "rooms-niagara.html" || file === "rooms-journey.html") {
    assert.ok(geometry.groups.some((batch) => batch.opacity < 1), `${file} must preserve translucent foam bands`);
    assert.ok(geometry.groups.some((batch) => batch.key === "ironscroll"), `${file} must keep open ironwork tiles`);
  }
  for (const batch of geometry.groups) {
    assert.ok(batch.positions.length > 0, `${file}/${batch.key} has no positions`);
    assert.equal(batch.positions.length % 9, 0, `${file}/${batch.key} has partial triangles`);
    for (const value of batch.positions.concat(batch.uvs, batch.colors)) {
      assert.ok(Number.isFinite(value), `${file}/${batch.key} contains a non-finite vertex or attribute`);
    }
    const patterned = batch.items.find(({ prim }) => prim.pat && Number(prim.u) > 0);
    if (patterned) {
      const { prim, start } = patterned;
      const i0 = start * 3, i1 = i0 + 3, t0 = start * 2, t1 = t0 + 2;
      const [x0, y0, z0] = batch.positions.slice(i0, i0 + 3);
      const [x1, y1, z1] = batch.positions.slice(i1, i1 + 3);
      const [u0, v0] = batch.uvs.slice(t0, t0 + 2);
      const [u1, v1] = batch.uvs.slice(t1, t1 + 2);
      let expectedU, expectedV;
      if (prim.ax === "v") {
        const [a, , c] = prim.p[0], [b, , d] = prim.p[1];
        const length = Math.hypot(b - a, d - c) || 1;
        const ux = (b - a) / length, uz = (d - c) / length;
        expectedU = ((x1 - x0) * ux + (z1 - z0) * uz) / (Number(prim.u) || 1000);
        expectedV = -(y1 - y0) / (Number(prim.u) || 1000);
      } else {
        const angle = (Number(prim.rot) || 0) * Math.PI / 180;
        expectedU = ((x1 - x0) * Math.cos(angle) - (z1 - z0) * Math.sin(angle)) / (Number(prim.u) || 1000);
        expectedV = ((x1 - x0) * Math.sin(angle) + (z1 - z0) * Math.cos(angle)) / (Number(prim.u) || 1000);
      }
      assert.ok(Math.abs((u1 - u0) - expectedU) < 1e-8 && Math.abs((v1 - v0) - expectedV) < 1e-8,
        `${file}/${batch.key} UVs must use one normalized repeat per authored tile`);
    }
  }
  for (const sheet of geometry.water) {
    assert.equal(sheet.points.length, 4, `${file} water sheets must have authored four-corner boundaries`);
    for (const point of sheet.points) for (const value of point) assert.ok(Number.isFinite(value));
    if (sheet.prim.pat === "fallsw") {
      assert.ok(Number.isFinite(sheet.prim.u) && sheet.prim.u > 0, `${file} fall grain needs a source tile scale`);
      assert.ok(Number.isFinite(sheet.prim.pa) && sheet.prim.pa >= 0 && sheet.prim.pa <= 1,
        `${file} fall grain opacity must stay in range`);
    }
  }
  const waterGeometry = buildWaterGeometry(THREE, geometry);
  assert.deepEqual(waterGeometry.subdivisions, { across: 1, down: 1 },
    `${file} source water quads use shader detail instead of wasteful tessellation`);
  assert.equal(waterGeometry.indices.length / 3, waterGeometry.items.length * 2,
    `${file} each authored four-corner water sheet stays two triangles`);
  assert.equal(waterGeometry.positions.length % 3, 0, `${file} water positions must be complete vertices`);
  assert.equal(waterGeometry.uvs.length, waterGeometry.positions.length / 3 * 2,
    `${file} water UVs must correspond to every world-space vertex`);
  assert.equal(waterGeometry.opacities.length, waterGeometry.positions.length / 3,
    `${file} authored water opacity must reach every vertex`);
  assert.equal(waterGeometry.fallProgress.length, waterGeometry.positions.length / 3,
    `${file} waterfall color progression must reach every vertex`);
  for (const value of waterGeometry.positions.concat(waterGeometry.uvs, waterGeometry.colors,
    waterGeometry.opacities, waterGeometry.fallProgress)) assert.ok(Number.isFinite(value), `${file} water mesh is finite`);
  if (geometry.water.some((sheet) => sheet.prim.pat === "fallsw")) {
    assert.equal(waterGeometry.bandPrims.length, 4, `${file} falling water keeps all four authored color bands`);
    assert.ok(waterGeometry.fallProgress.some((v) => v >= 0), `${file} fall mesh has a continuous vertical gradient`);
    const item = waterGeometry.items.find(({ prim }) => prim.pat === "fallsw");
    const source = geometry.water.find((sheet) => sheet.prim === item.prim);
    const delta = waterGeometry.uvs[item.start * 2 + 2] - waterGeometry.uvs[item.start * 2];
    const across = Math.hypot(source.points[1][0] - source.points[0][0],
      source.points[1][2] - source.points[0][2]);
    assert.ok(Math.abs(delta - across / waterGeometry.subdivisions.across / item.prim.u) < 1e-8,
      `${file} water UVs must use one normalized repeat per authored falls grain tile`);
  }
  totalTriangles += geometry.triangles;
  totalWaterTriangles += waterGeometry.indices.length / 3;
  totalWater += geometry.water.length;
  totalMist += geometry.mist.length;
  console.log(`PASS  ${file}: ${geometry.triangles} world + ${waterGeometry.indices.length / 3} water triangles, ` +
    `${geometry.groups.length} material batches, ${geometry.water.length} water sheets, ` +
    `${geometry.mist.length} spray layers`);
}

assert.ok(walkPages >= 7, "every generated walkable page must load the Three.js scene renderer");

const square = (z) => [[-50, 0, z], [50, 0, z], [50, 100, z], [-50, 100, z]];
const tileSource = { width: 128, height: 128 }; // no canvas context in Node; conservatively translucent
const imageSource = { complete: true, naturalWidth: 64, naturalHeight: 32 };
const lane = buildLaneGeometry(THREE, [
  { z: 120, world: square(120), uv: [[0, 0], [0, 0], [0, 0], [0, 0]],
    mode: "flat", arg: "#56789a", lit: 1.2, air: 0.1, daygain: 0.75 },
  { z: 130, world: square(130), uv: [[0, 0], [0, 0], [0, 0], [0, 0]],
    mode: "flat", arg: "rgba(255,220,160,0.5)", alpha: 0.8, nolite: true, day: false },
  { z: 140, world: square(140), uv: [[0, 0], [128, 0], [128, 128], [0, 128]],
    mode: "pat", arg: null, textureSource: tileSource, textureKey: "tile-test", lit: 0.7 },
  { z: 150, world: square(150), uv: [[0, 0], [64, 0], [64, -32], [0, -32]],
    mode: "pic", img: imageSource, imageKey: "image-test", lit: 0.8 },
  { z: 160, world: square(160), uv: [[0, 0], [0, 0], [0, 0], [0, 0]], mode: "flat", arg: "#ffffff",
    soft: { rgb: "255,255,255", a: 0.3, x: 512, y: 384, r: 20, k: 0.62 } },
], { width: 1024, height: 768, focal: 620, day: 0.4, dayPage: true, night: 0.2,
  fogMax: 0.4, dayGain: 0.8, camera: { x: 0, z: 0, eye: 168, sy: 0, cy: 1, sp: 0, cp: 1 } });
assert.equal(lane.quads, 5, "flat, patterned, photographed, and soft quads all reach Three.js");
assert.equal(lane.triangles, 10, "each authored quad is triangulated into two depth-tested faces");
assert.equal(lane.groups.length, 5, "each distinct blend/material path gets its own batch");
assert.ok(lane.groups.some((g) => g.textureKind === "pattern" && g.uvs.includes(1) &&
  g.uvs.every((v) => v >= 0 && v <= 1)), "procedural 128-pixel tiles repeat at normalized UV 1.0");
assert.ok(lane.groups.some((g) => g.textureKind === "image" && g.uvs.some((v) => Math.abs(v - 1) < 1e-8)),
  "picture UVs normalize against the source image size");
assert.ok(lane.groups.some((g) => g.textureKind === "soft"), "spray retains its radial alpha material");
for (const group of lane.groups) {
  for (const values of [group.positions, group.uvs, group.colors, group.opacities,
    group.lights, group.air, group.darkness, group.daylight])
    for (const value of values) assert.ok(Number.isFinite(value), `${group.key} lane attribute must be finite`);
}
console.log(`PASS  dynamic lane: ${lane.quads} quads, ${lane.triangles} triangles, ${lane.groups.length} material batches, all attributes finite`);

const savedDocument = globalThis.document;
const gradient = { addColorStop() {} };
const context2d = { createRadialGradient: () => gradient, createLinearGradient: () => gradient, fillRect() {} };
globalThis.document = { createElement: () => ({ width: 128, height: 128, getContext: () => context2d }) };
const effectScene = new THREE.Scene(), effectMaterials = [], effectTextures = new Map();
const effectSource = {
  lamps: [
    { x: 80, y: 290, z: 240, r: 26, k: 0.45, tint: "rgba(255,205,150,0.55)", wet: true,
      bulb: true, body: "lantern", size: 22, h: 270, swing: 12, period: 4, phase: 0.2, liton: 0.2 },
    { x: 380, y: 120, z: 500, r: 40, k: 0.4, tint: "#ffd69e", wet: false,
      bulb: true, body: null, spill: 1 },
  ],
  wires: [{ a: [-100, 420, 50], b: [100, 420, 50], sag: 30 }],
  marks: [{ kind: "wet", x0: 300, x1: 410, z0: 400, z1: 600 }],
  surfaces: [{ side: -1, kind: "solid" }], wall: 455, ceil: 420, zBack: -200, zFar: 4000,
  phase: 0.5, reducedMotion: false,
};
const sceneEffects = createSceneEffects(THREE, effectScene, effectSource, effectMaterials, effectTextures);
const effectState = { width: 1024, height: 768, focal: 620, day: 0.5, dayPage: true, night: 0.25,
  time: 1.5, sunAz: -0.6, camera: { x: 0, z: 0 }, effects: effectSource };
sceneEffects.update(effectState);
const effectByName = (name) => effectScene.children.find((child) => child.name === name);
const halo = effectByName("3D lamp halo 1"), pool = effectByName("3D ground pool 1");
const spill = effectByName("3D window-light spill 2"), umbra = effectByName("3D authored wall shadow");
assert.ok(halo && halo.visible && halo.scale.x > 0, "lamp halo is a camera-facing 3D sprite");
assert.ok(pool && pool.visible && Math.abs(pool.position.y - 3) < 1e-8 && Math.abs(pool.rotation.x + Math.PI / 2) < 1e-8,
  "lamp pool is a depth-tested horizontal world plane");
assert.ok(spill && spill.visible && spill.geometry.getAttribute("position").array.some((v) => v !== 0),
  "a front spill updates its own world-space trapezoid");
assert.ok(umbra && umbra.visible && umbra.geometry.drawRange.count === 6,
  "daylight wall shadows are triangulated 3D floor geometry");
assert.ok(effectScene.children.some((child) => child.name === "3D lantern beam 1")
  && effectScene.children.some((child) => child.name === "3D wire or lamp cord 1"),
  "lantern volumes and overhead wires are Three.js objects");
const wire = effectByName("3D wire or lamp cord 1");
assert.ok(wire.isLine && wire.material.isLineBasicMaterial,
  "overhead cables use a native Three.js line material");
for (const child of effectScene.children) {
  const position = child.geometry && child.geometry.getAttribute("position");
  if (position) for (const value of position.array) assert.ok(Number.isFinite(value), `${child.name} position must be finite`);
}
sceneEffects.update({ ...effectState, day: 0, dayPage: false, night: 0.9, time: 2.5,
  effects: { ...effectSource, phase: 0.1, reducedMotion: true } });
assert.equal(halo.visible, false, "a lamp remains off before its authored phase");
assert.equal(umbra.visible, false, "daylight shadows disappear on a night-authored page");
assert.equal(effectByName("3D wet-mark reflection 1").visible, true,
  "a wet mark keeps a reflected 3D light when daylight is absent");
const lampReflection = effectByName("3D wet reflection 1");
assert.ok(lampReflection.visible && lampReflection.material.opacity > 0,
  "a wet lamp has a visible 3D reflection plane at night");
sceneEffects.dispose();
for (const material of effectMaterials) material.dispose();
for (const texture of effectTextures.values()) texture.dispose();
if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
console.log(`PASS  scene effects: ${effectScene.children.length} world-space meshes/lines, finite dynamic buffers, day/night state updates`);

assert.ok(worldPages > 0, "at least one generated sourced world must exercise backdrop geometry");
assert.ok(totalWater >= 216, "the waterfall worlds must retain all authored water sheets");
console.log(`PASS  Three.js ${VERSION} imported; ${walkPages} walkable pages, ${worldPages} sourced worlds, ` +
  `${totalTriangles} world + ${totalWaterTriangles} water triangles, ${totalWater} waterfall sheets, ` +
  `${totalMist} spray layers; no Canvas2D lane painter anywhere (owner ruling, round 54).`);
