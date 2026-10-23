/* What is the lane offering when the visitor comes back to the Niagara model in Toronto? */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto("http://127.0.0.1:8080/rooms-toronto.html#at-falls-n", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 30000 });
await sleep(4000);
console.log(JSON.stringify(await page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  const hits = Array.from(document.querySelectorAll(".walk-hit"));
  const near = hits.map((el) => {
    const r = el.getBoundingClientRect();
    const x = parseFloat(el.style.getPropertyValue("--x")) || 0;
    const z = parseFloat(el.style.getPropertyValue("--z")) || 0;
    return { obj: el.dataset.obj, kind: el.dataset.kind, quiet: el.dataset.quiet === "1",
             d: Math.round(Math.hypot(x - w.x, z - w.depth)), vis: el.style.visibility };
  }).filter((p) => p.d < 600 && p.vis !== "hidden").sort((a, b) => a.d - b.d).slice(0, 8);
  return { x: Math.round(w.x), z: Math.round(w.depth), yaw: Math.round(w.yaw),
           reach: document.querySelector(".walk-hit.is-reach")?.dataset.obj || null,
           status: document.querySelector("[data-walk-status]")?.textContent || "",
           near };
}), null, 1));
await browser.close();
