import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let logged = false;
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!logged) console.log("REQ", req.url());
  if (!/js\/scene3d\.js/.test(req.url())) return req.continue();
  try {
    let body = (await (await fetch(req.url())).text()).replace(
      "const scene = new THREE.Scene();",
      "const scene = new THREE.Scene(); window.__threeScene = scene;");   
    body = body.replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
                        "const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000); window.__cam = camera;");
    if (!logged) { logged = true; console.log("patched scene3d:", /__cam/.test(body)); }
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { if (!logged) console.log("FETCH FAIL", String(e).slice(0,120)); req.continue(); }
});
await page.goto("http://127.0.0.1:8080/rooms-niagara.html", { waitUntil: "load", timeout: 90000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 60000 });
await sleep(2500);
await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[3].click());
await page.waitForFunction(() => { const w = document.querySelector("[data-walk]").__walk; if (!w.__t) w.__t = [];
  w.__t.push([w.depth, performance.now()]); if (w.__t.length > 12) w.__t.shift();
  const a = w.__t[0], b = w.__t[w.__t.length - 1];
  return Math.abs(b[0] - a[0]) < 40 && b[1] - a[1] > 900; }, { timeout: 240000, polling: 500 }).catch(() => {});
await sleep(1200);
const out = await page.evaluate(() => {
  const cam = window.__cam;
  console.log("dbg", typeof window.__cam, typeof window.__threeScene, Object.keys(window.__HX_PLACES||{}).length);
  if (!cam) return { err: "no camera" };
  const place = Object.values(window.__HX_PLACES || {})[0];
  const prims = place["data-walk-backdrop"].world.prims.filter((q) => q.t === "m");
  cam.updateMatrixWorld(true);
  const V = cam.position.constructor;
  const p = (x, y, z) => { const v = new V(x, y, z).project(cam);
    return [Math.round((v.x + 1) / 2 * 1024), Math.round((1 - v.y) / 2 * 768), +v.z.toFixed(3)]; };
  const on = prims.map((q) => ({ px: p(q.o[0], q.o[1], q.o[2]), al: q.al, o: q.o }))
    .filter((r) => r.px[0] >= 0 && r.px[0] < 1024 && r.px[1] >= 0 && r.px[1] < 768);
  const grid = Array.from({ length: 6 }, () => Array(8).fill(0));
  for (const r of on) grid[Math.min(5, Math.floor(r.px[1] / 128))][Math.min(7, Math.floor(r.px[0] / 128))]++;
  const col = prims.filter((q) => q.w < 3200).map((q) => ({ px: p(q.o[0], q.o[1], q.o[2]), w: q.w, al: q.al, y: q.o[1] }))
    .sort((a, b) => a.y - b.y);
  let sw = 0, sx = 0, sy = 0;
  for (const r of on) { sw += r.al; sx += r.px[0] * r.al; sy += r.px[1] * r.al; }
  const apex = sw ? [Math.round(sx / sw), Math.round(sy / sw), +sw.toFixed(2)] : null;
  return { pos: [cam.position.x, cam.position.y, cam.position.z], rot: [cam.rotation.x, cam.rotation.y, cam.rotation.z],
           fov: cam.fov, aspect: +(cam.aspect || 0).toFixed(3), n: prims.length, onScreen: on.length,
           grid, brightest: on.sort((a, b) => b.al - a.al).slice(0, 5), apex,
           column: col.map((c) => [c.px[0], c.px[1], Math.round(c.y / 100), c.w]) };
});
console.log(JSON.stringify(out, null, 1).slice(0, 9000));
const yawNow = () => page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
const TARGET = Number(process.env.AIM_YAW || -109);
for (let i = 0; i < 24; i++) {
  const y = await yawNow();
  const d = TARGET - y;
  if (Math.abs(d) < 3) { console.log("aimed at", y.toFixed(1)); break; }
  const key = d > 0 ? "ArrowRight" : "ArrowLeft";
  await page.keyboard.down(key); await sleep(Math.min(400, Math.max(90, Math.abs(d) * 1.6)));
  await page.keyboard.up(key); await sleep(450);
}
await page.mouse.move(2, 2); await sleep(900);
await page.screenshot({ path: ".preview/water/aim/on.png" });
console.log("final yaw", (await yawNow()).toFixed(1));
console.log("sheet y range", JSON.stringify(await page.evaluate(() => ({ lo: window.__ymin, hi: window.__ymax }))));
// What is the white cut-out? Hide one system at a time and shoot the same frame.
const systems = await page.evaluate(() => {
  const out = [];
  window.__threeScene.traverse((o) => { if (o.isMesh && o.geometry) {
    const g = o.geometry; g.computeBoundingBox();
    const b = g.boundingBox; const s = [(b.max.x - b.min.x) / 100, (b.max.y - b.min.y) / 100, (b.max.z - b.min.z) / 100];
    out.push({ name: o.name || o.parent?.name || "(unnamed)", tris: (g.index ? g.index.count : g.attributes.position.count) / 3,
               span: s.map((v) => Math.round(v)), mat: o.material?.type,
               col: o.material?.color ? "#" + o.material.color.getHexString() : null,
               transparent: !!o.material?.transparent, opacity: o.material?.opacity });
  } });
  return out.filter((m) => m.span[0] > 100 || m.span[2] > 100).slice(0, 30);
});
console.log("big systems:", JSON.stringify(systems, null, 0).slice(0, 2500));
await page.evaluate(() => { const m = window.__threeScene.getObjectByName("surveyed spray billboards"); if (m) m.visible = false; });
await sleep(700);
await page.screenshot({ path: ".preview/water/aim/nospray.png" });
await page.evaluate(() => { window.__threeScene.traverse((o) => { if (o.isMesh) o.visible = o.name === "surveyed spray billboards"; }); });
await sleep(700);
await page.screenshot({ path: ".preview/water/aim/onlyspray.png" });
await page.evaluate(() => { window.__threeScene.traverse((o) => { if (o.isMesh) o.visible = true; }); });
await page.evaluate(() => { const m = window.__threeScene.getObjectByName("surveyed waterfall sheets"); if (m) m.visible = false; });
await sleep(700);
await page.screenshot({ path: ".preview/water/aim/nosheets.png" });
await page.evaluate(() => { const m = window.__threeScene.getObjectByName("surveyed waterfall sheets"); if (m) {
  const g = m.geometry; const pos = g.attributes.position; let lo = 1e9, hi = -1e9;
  for (let i = 1; i < pos.count * 3; i += 3) { const y = pos.array[i]; if (y < lo) lo = y; if (y > hi) hi = y; }
  window.__ymin = lo; window.__ymax = hi;
} });
await browser.close();
