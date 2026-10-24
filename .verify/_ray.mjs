/* _ray — what is actually at a pixel, read out of the live scene by raycasting.
   Diagnostic (exit 0). Built for round 69 because a black slab crossed the falls and no amount of
   reading the record said which of 1,351 prims it was: the frame says *where*, the raycaster says
   *what*. Prints, for each sample pixel, the first three hits with the mesh name, the hit point in
   world cm and the face material.
   Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_ray.mjs [stop] [px,py ...] */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const STOP = Number(process.argv[2] || 3);
const YAW = Number(process.env.YAW || -90);
const PX = (process.argv.slice(3).join(" ") || "300,340 560,330 800,330 900,600 700,700")
  .split(" ").map((s) => s.split(",").map(Number));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 160)));
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  try {
    const body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
               "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
});
await page.goto(`${BASE}/${FILE}`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 90000 });
await sleep(2000);
const target = await page.evaluate((i) => {
  const el = document.querySelectorAll("[data-walk-stop]")[i];
  const z = parseFloat(el.style.getPropertyValue("--z")) || 0; el.click(); return z;
}, STOP);
for (let i = 0; i < 600; i++) {
  const d = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  if (Math.abs(d - target) < 8) break; await sleep(300);
}
await page.evaluate(async (yaw) => {
  const w = document.querySelector("[data-walk]").__walk, view = document.querySelector("[data-walk]");
  for (let i = 0; i < 600; i++) {
    const err = ((yaw - w.yaw + 540) % 360) - 180;
    if (Math.abs(err) <= 1.5) break;
    const key = err > 0 ? "arrowright" : "arrowleft";
    view.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    await new Promise((r) => setTimeout(r, 16));
    view.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
    await new Promise((r) => setTimeout(r, 24));
  }
}, YAW);
await sleep(1200);
const hits = await page.evaluate((pts) => {
  const scene = window.__threeScene, cam = window.__cam, THREE = window.__THREE;
  const ray = new THREE.Raycaster();
  const out = [];
  for (const [px, py] of pts) {
    const ndc = new THREE.Vector2((px / 1024) * 2 - 1, -(py / 768) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(scene.children, true).slice(0, 3).map((x) => ({
      mesh: x.object.name || "(unnamed)",
      mat: x.object.material && (x.object.material.name || x.object.material.type),
      p: x.point.toArray().map((v) => Math.round(v)),
      d: Math.round(x.distance),
    }));
    out.push({ px, py, h });
  }
  return out;
}, PX);
for (const r of hits) {
  console.log(`pixel ${r.px},${r.py}`);
  for (const h of r.h) console.log(`   ${String(h.d).padStart(6)} cm  ${h.mesh.padEnd(34)} at ${JSON.stringify(h.p)}`);
}
await browser.close();
process.exit(0);
