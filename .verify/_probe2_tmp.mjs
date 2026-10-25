import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  try {
    const body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();", "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);", "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
});
await page.goto("http://127.0.0.1:8080/rooms.html", { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
await page.evaluate(() => { try { localStorage.setItem("huaxu.walk-hour.v1", "night"); } catch (e) {} });
await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[5].click());
await sleep(5000);
const out = await page.evaluate(() => {
  const T = window.__THREE, cam = window.__cam, scene = window.__threeScene;
  const rc = new T.Raycaster();
  const px = [[512, 240], [512, 400], [512, 520], [512, 700], [420, 700], [600, 700], [512, 760]];
  const res = px.map(([x, y]) => {
    const ndc = new T.Vector2((x / 1024) * 2 - 1, -(y / 768) * 2 + 1);
    rc.setFromCamera(ndc, cam);
    const hits = rc.intersectObjects(scene.children, true).slice(0, 3).map((h) => ({
      n: (h.object.name || h.object.type), d: Math.round(h.distance),
      p: h.point.toArray().map((v) => Math.round(v)) }));
    return { px: [x, y], hits };
  });
  const w = document.querySelector("[data-walk]").__walk;
  return { cam: cam.position.toArray().map((v) => Math.round(v)), yaw: w.yaw, pitch: w.pitch, res };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
