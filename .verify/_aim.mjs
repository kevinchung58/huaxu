/* _aim — photograph a stop at a chosen heading, and say where the spray actually lands.

   Why this exists: the rail stop's own `data-view-yaw` is a number somebody wrote, and for two
   rounds the mist was tuned against frames shot at that number while the plume stood outside the
   frame. `_view.mjs` turns with the visitor's own arrow keys and is honest but slow to settle;
   this one turns, stops when the head has arrived, and then answers the only question that
   matters -- how many of the spray billboards are inside the picture, and where.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib AIM_YAW=-97 STOP=3 node .verify/_aim.mjs
         MIST=red ... paints the spray red first (does the plume have a shape or is it a wash?)
         OUT=.preview/x/yaw-97.png  (default .preview/water/aim/yaw-<n>.png)
*/
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const STOP = Number(process.env.STOP || 3);
const AIM = Number(process.env.AIM_YAW || -97);
const OUT = process.env.OUT || `.preview/water/aim/yaw${Math.round(AIM)}.png`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT.slice(0, OUT.lastIndexOf("/")) || ".", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => { errors.push(String(e)); console.log("PAGEERROR", String(e).slice(0, 160)); });

// scene3d.js keeps camera and scene private; publishing them changes no behaviour.
await page.setRequestInterception(true);
let patched = false;
page.on("request", async (req) => {
  if (!/js\/scene3d\.js/.test(req.url())) return req.continue();
  try {
    let body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();", "const scene = new THREE.Scene(); window.__threeScene = scene;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
               "const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000); window.__cam = camera;");
    if (process.env.MIST === "red") {
      const before = body;
      body = body.replace("void main(){ vec4 tex=texture2D(uCloud,vUv); gl_FragColor=vec4(vColor.rgb, tex.a*vColor.a); }",
                          "void main(){ vec4 tex=texture2D(uCloud,vUv); gl_FragColor=vec4(1.0,0.0,0.0, max(0.35, tex.a*vColor.a)); }");
      if (body === before) console.log("  !! cloud shader anchor moved; MIST=red did nothing");
    }
    if (!patched) { patched = true; console.log("patched scene3d: camera", /__cam/.test(body)); }
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { console.log("FETCH FAIL", String(e).slice(0, 90)); req.continue(); }
});

await page.goto(`${BASE}/${FILE}`, { waitUntil: "load", timeout: 90000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 60000 });
await sleep(2500);
await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), STOP);
// the rail glides: wait for the body to stop moving rather than for a stopwatch
await page.waitForFunction(() => {
  const w = document.querySelector("[data-walk]").__walk;
  if (!w.__aimT) w.__aimT = [];
  w.__aimT.push([w.depth, performance.now()]);
  if (w.__aimT.length > 12) w.__aimT.shift();
  const a = w.__aimT[0], b = w.__aimT[w.__aimT.length - 1];
  return Math.abs(b[0] - a[0]) < 40 && b[1] - a[1] > 900;
}, { timeout: 240000, polling: 500 }).catch(() => console.log("  (did not settle; shooting anyway)"));

// Turn with the visitor's own keys. One burst overshoots by tens of degrees on a software
// rasteriser (a frame can be a third of a second), so the burst is sized from the distance and
// the loop re-reads the head afterwards -- measured, never assumed.
const yawNow = () => page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
for (let i = 0; i < 40; i++) {
  const y = await yawNow(), d = AIM - y;
  if (Math.abs(d) < 2) { console.log("aimed at", y.toFixed(1)); break; }
  const key = d > 0 ? "ArrowRight" : "ArrowLeft";
  await page.keyboard.down(key);
  await sleep(Math.min(400, Math.max(80, Math.abs(d) * 1.6)));
  await page.keyboard.up(key);
  await sleep(400);
}

// where the spray is, in pixels, from the page's own camera
// Aim at an object, not at a number: the offset between where the head points and where a chosen
// column stands is read off the camera's own basis, so no yaw convention has to be guessed.
const aimAt = async (anchor) => {
  const r = await page.evaluate((a) => {
    const cam = window.__cam, V = cam.position.constructor;
    const prims = Object.values(window.__HX_PLACES)[0]["data-walk-backdrop"].world.prims;
    const cols = prims.filter((q) => q.t === "m" && q.w < 2200 && q.o[1] > -4000);
    if (!cols.length) return { err: "no column" };
    const top = cols.reduce((m, q) => (q.o[1] > m.o[1] ? q : m), cols[0]);
    const m = cam.matrixWorld.elements;
    const f = [-m[8], -m[9], -m[10]], rt = [m[0], m[1], m[2]];
    const d = [top.o[0] - cam.position.x, top.o[1] - cam.position.y, top.o[2] - cam.position.z];
    const off = Math.atan2(d[0] * rt[0] + d[2] * rt[2], d[0] * f[0] + d[1] * f[1] + d[2] * f[2]) * 180 / Math.PI;
    return { yaw: document.querySelector("[data-walk]").__walk.yaw, offset: +off.toFixed(1), crown: top.o };
  }, anchor);
  if (r.err) return r;
  const target = r.yaw + r.offset * Number(process.env.SIGN || 1);
  console.log("aimAt: yaw", r.yaw.toFixed(1), "offset", r.offset, "→ target", target.toFixed(1), "crown", r.crown);
  for (let i = 0; i < 24; i++) {
    const y = await yawNow(), d = target - y;
    if (Math.abs(d) < 2) break;
    const key = d > 0 ? "ArrowRight" : "ArrowLeft";
    await page.keyboard.down(key); await sleep(Math.min(300, Math.max(70, Math.abs(d) * 1.4)));
    await page.keyboard.up(key); await sleep(380);
  }
  return { target };
};
if (process.env.AIM_AT) await aimAt(Number(process.env.AIM_AT));

const where = await page.evaluate(() => {
  const cam = window.__cam;
  if (!cam) return { err: "no camera" };
  const V = cam.position.constructor;
  const prims = Object.values(window.__HX_PLACES || {})[0]["data-walk-backdrop"].world.prims.filter((q) => q.t === "m");
  const on = [];
  for (const q of prims) {
    const v = new V(q.o[0], q.o[1], q.o[2]).project(cam);
    const px = (v.x + 1) / 2 * 1024, py = (1 - v.y) / 2 * 768;
    if (v.z < 1 && px >= 0 && px < 1024 && py >= 0 && py < 768) on.push([Math.round(px), Math.round(py), q.al]);
  }
  const grid = Array.from({ length: 6 }, () => Array(8).fill(0));
  for (const [x, y] of on) grid[Math.min(5, Math.floor(y / 128))][Math.min(7, Math.floor(x / 128))]++;
  const wsum = on.reduce((a, r) => a + r[2], 0) || 1;
  return { n: prims.length, onScreen: on.length,
           centroid: on.length ? [Math.round(on.reduce((a, r) => a + r[0] * r[2], 0) / wsum),
                                 Math.round(on.reduce((a, r) => a + r[1] * r[2], 0) / wsum)] : null,
           grid, yaw: Math.round(document.querySelector("[data-walk]").__walk.yaw) };
});
console.log("spray", JSON.stringify(where));

// the HUD out of the picture: a preview card floats over the canvas when it rests on it
await page.mouse.move(2, 2);
await page.evaluate(() => document.querySelectorAll(".walk-card,.walk-stops,.walk-tools").forEach((e) => { e.style.display = "none"; }));
await sleep(900);
await page.screenshot({ path: OUT });
console.log("SHOT", OUT, "at yaw", (await yawNow()).toFixed(1), errors.length ? `(${errors.length} page errors)` : "");
await browser.close();
