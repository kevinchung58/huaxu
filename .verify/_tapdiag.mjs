/* Why does the head stop turning after a tap?

   A tap on a wall thing focuses that thing's button. If the button lives outside the lane's own
   keyboard scope, the head would still turn -- and if it does not, the visitor has found a corner
   of the world where the arrow keys go dead. This isolates the cause: turn, tap, turn again.
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const ROOMS = process.env.ROOMS || "rooms-niagara.html";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => {
  const st = document.querySelector("[data-walk-status]")?.textContent || "";
  const hits = Array.from(document.querySelectorAll(".walk-hit")).filter((el) => el.style.visibility !== "hidden");
  return !/Building|Loading/i.test(st) && hits.length > 0;
}, { timeout: 60000 });
await sleep(1200);

const yaw = () => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  const el = document.activeElement;
  return { yaw: w ? +w.yaw.toFixed(1) : null,
           active: el ? `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}` : "none",
           busy: (() => { const c = document.querySelector("[data-walk-card]");
                          return c ? !c.hidden : null; })() };
});

const turn = async (ms) => {
  await page.keyboard.down("ArrowLeft");
  await sleep(ms);
  await page.keyboard.up("ArrowLeft");
  await sleep(250);
};

console.log("before      ", JSON.stringify(await yaw()));
await turn(400);
console.log("after turn  ", JSON.stringify(await yaw()));

// tap a live prop
const target = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll(".walk-hit")).find((e) => e.dataset.quiet !== "1"
    && e.dataset.landmark !== "1" && !e.dataset.leave);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!(r.left > 0 && r.top > 0 && r.right < innerWidth && r.bottom < innerHeight)) return null;
  return { obj: el.dataset.obj, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});
console.log("target      ", JSON.stringify(target));
if (target) {
  await page.mouse.click(target.x, target.y);
  await sleep(400);
}
console.log("after tap   ", JSON.stringify(await yaw()));
await turn(400);
console.log("after turn 2", JSON.stringify(await yaw()));

// and the same through a synthetic event, to tell a dead key from a dead handler
await page.evaluate(() => document.documentElement.dispatchEvent(
  new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
await sleep(400);
await page.evaluate(() => document.documentElement.dispatchEvent(
  new KeyboardEvent("keyup", { key: "ArrowLeft", bubbles: true })));
await sleep(300);
console.log("after synth ", JSON.stringify(await yaw()));

await browser.close();
