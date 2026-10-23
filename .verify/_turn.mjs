/* Which way does each turn key turn the head, and how fast?

   The complaint was "the controls are not the normal kind". A turn that goes the wrong way is not
   a matter of taste, so this reads the lane's own yaw before and after a short hold of each key.
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const HOLD = Number(process.env.HOLD || 300);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${FILE}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

const yaw = () => page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
const wrap = (d) => { while (d > 180) d -= 360; while (d < -180) d += 360; return d; };

for (const key of ["d", "a", "ArrowRight", "ArrowLeft"]) {
  const before = await yaw();
  const t0 = Date.now();
  await page.keyboard.down(key);
  await sleep(HOLD);
  const during = await yaw();
  await page.keyboard.up(key);
  await sleep(200);
  // wait for a frame: on a software rasteriser a frame can be half a second, and a tap that no
  // frame saw is paid out by the next one -- reading the yaw too early reads the old picture.
  await sleep(1200);
  const after = await yaw();
  const secs = (Date.now() - t0) / 1000;
  console.log(`${key.padEnd(11)} yaw ${before.toFixed(1)} → ${during.toFixed(1)} (${wrap(during - before).toFixed(1)}° in ` +
              `${(secs * 1000).toFixed(0)} ms = ${(wrap(during - before) / secs).toFixed(0)}°/s), after ${after.toFixed(1)}`);
}
await browser.close();
