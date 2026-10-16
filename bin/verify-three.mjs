#!/usr/bin/env node
/*
 * The Three.js walkable-world gate. Run from the repository root after `_gen_html.py`:
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
import { buildWaterGeometry, buildWorldGeometry } from "../js/scene3d.js";

const ROOT = process.cwd();
const VERSION = "0.186.1";
const supported = new Set(["f", "x", "w", "m", "l", "rb", "fw"]);
const pageFiles = fs.readdirSync(ROOT).filter((name) => /^rooms.*\.html$/.test(name) || name === "street.html").sort();
const sceneSource = fs.readFileSync(path.join(ROOT, "js/scene3d.js"), "utf8");
const siteSource = fs.readFileSync(path.join(ROOT, "js/site.js"), "utf8");
const generator = fs.readFileSync(path.join(ROOT, "_gen_html.py"), "utf8");
const license = path.join(ROOT, `js/vendor/three-${VERSION}/LICENSE`);

assert.equal(THREE.REVISION, "186", "the imported runtime must match Three.js 0.186.1");
assert.ok(fs.statSync(license).size > 900, "the upstream MIT license must ship beside the runtime");
assert.match(sceneSource, new RegExp(`const THREE_VERSION = "${VERSION}"`));
assert.match(sceneSource, /world\.prims/);
assert.match(siteSource, /if \(bd && !threeRenderer\) drawFar\(C\);/,
  "the Canvas2D background painter must remain active when WebGL is unavailable");
assert.match(siteSource, /if \(threeRenderer\) \{\s*if \(typeof g\.clearRect === "function"\)/,
  "the 2D overlay must clear to transparency only while the Three.js canvas is active");
assert.match(generator, /js\/scene3d\.js/);
assert.match(generator, /three-0\.186\.1\/three\.core\.js/);
assert.match(generator, /three-0\.186\.1\/three\.module\.js/);

let worldPages = 0, totalTriangles = 0, totalWaterTriangles = 0, totalWater = 0, totalMist = 0;
for (const file of pageFiles) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const match = html.match(/<script type="application\/json" data-walk-backdrop>([\s\S]*?)<\/script>/);
  if (!match) continue;
  const backdrop = JSON.parse(match[1]);
  const prims = backdrop.world && backdrop.world.prims;
  if (!Array.isArray(prims) || !prims.length) continue;

  worldPages++;
  assert.match(html, /<canvas class="walk-three-canvas" data-walk-three/,
    `${file} needs the lower WebGL canvas`);
  assert.match(html, /<script type="module" src="js\/scene3d\.js\?v=[0-9a-z]+"><\/script>/,
    `${file} needs the cache-busted Three.js bridge`);
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

assert.ok(worldPages > 0, "at least one generated walkable scene must exercise the Three.js path");
assert.ok(totalWater >= 216, "the waterfall worlds must retain all authored water sheets");
console.log(`PASS  Three.js ${VERSION} imported; ${worldPages} sourced worlds, ${totalTriangles} world + ` +
  `${totalWaterTriangles} water triangles, ${totalWater} waterfall sheets, ${totalMist} spray layers; ` +
  `Canvas2D fallback remains wired.`);
