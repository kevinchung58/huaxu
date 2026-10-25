import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  try {
    const body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();", "const scene = new THREE.Scene(); window.__threeScene = scene;");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
});
await page.goto("http://127.0.0.1:8080/rooms.html", { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
await page.evaluate(() => { try { localStorage.setItem("huaxu.walk-hour.v1", "night"); } catch (e) {} });
await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[5].click());
await sleep(4500);
await page.mouse.move(2, 2);
await sleep(400);
const shot = async (tag, re) => {
  await page.evaluate((f) => {
    window.__threeScene.children.forEach((c) => { c.visible = f === "*" ? true : !new RegExp(f).test(c.name || c.type); });
  }, re);
  await sleep(700);
  const p = `/tmp/p3-${tag}.png`;
  await page.screenshot({ path: p });
  const b64 = fs.readFileSync(p).toString("base64");
  const r = await page.evaluate(async (src) => {
    const img = new Image(); await new Promise((res) => { img.onload = res; img.src = src; });
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const row = (y) => { const d = g.getImageData(0, y, c.width, 1).data; const out = [];
      for (let x = 440; x <= 600; x += 8) out.push(Math.round(0.3 * d[x*4] + 0.59 * d[x*4+1] + 0.11 * d[x*4+2]));
      return out; };
    return { y460: row(460), y620: row(620) };
  }, `data:image/png;base64,${b64}`);
  console.log(tag.padEnd(16), "y460", r.y460.join(","), "\n                 y620", r.y620.join(","));
};
await shot("all", "*");
await shot("no-umbra", "^3D authored wall (shadow|penumbra)$");
await shot("no-bodyshadow", "^3D walker ground shadow$");
await shot("no-effects", "^3D ");
await page.evaluate(() => window.__threeScene.children.forEach((c) => { c.visible = true; }));
await browser.close();
