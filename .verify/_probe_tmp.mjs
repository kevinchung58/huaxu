/* Probe: which scene object paints the dark vertical band at the centre of the plaza floor?
   Loads rooms.html, walks to a stop, then shoots the same frame with layers switched off and
   prints the luma across a row of the floor for each. Diagnostic, not committed. */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const BASE = "http://127.0.0.1:8080";
const STOP = Number(process.env.STOP || 5);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
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
await page.goto(`${BASE}/rooms.html`, { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
await page.evaluate(() => { try { localStorage.setItem("huaxu.walk-hour.v1", "night"); } catch (e) {} });
await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), STOP);
await sleep(4000);
await page.mouse.move(2, 2);
const names = await page.evaluate(() => window.__threeScene.children.map((c) => c.name || c.type));
console.log("children", JSON.stringify(names));
const shot = async (tag, filter) => {
  await page.evaluate((f) => {
    window.__threeScene.children.forEach((c) => {
      const n = c.name || c.type;
      c.visible = f === "*" ? true : !new RegExp(f).test(n);
    });
  }, filter);
  await sleep(600);
  const path = `/tmp/probe-${tag}.png`;
  await page.screenshot({ path });
  const v = await page.evaluate(async (src) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = src; });
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const row = (y) => { const d = g.getImageData(0, y, c.width, 1).data; const out = [];
      for (let x = 460; x < 580; x += 10) out.push(Math.round(0.3 * d[x * 4] + 0.59 * d[x * 4 + 1] + 0.11 * d[x * 4 + 2]));
      return out; };
    return { y520: row(520), y700: row(700) };
  }, `data:image/png;base64,${require("fs").readFileSync(path).toString("base64")}`);
  console.log(tag.padEnd(18), "y520", v.y520.join(","), "| y700", v.y700.join(","));
};
await shot("all", "*");
await shot("no-bodyshadow", "^3D walker ground shadow$");
await shot("no-pools", "^3D ground pool");
await browser.close();
