/* Aim, then shoot: stand at an authored stop and turn to a computed yaw by dragging, so a frame is
   of a named prop and not of wherever the camera happened to stop.

   Two traps this instrument exists to avoid, both found the hard way:
     - a drag starts with a mouse-down in the middle of the frame, where a prop's hit box is: the
       "turn" opened a prop's card, and a card makes the walk ignore the keys until it is closed;
     - a stop's glide is slow under swiftshader and a "has it stopped" test on two samples can
       return early while it is still gliding, so the wait is on the stop's own --z target.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms.html \
           VIEWS='0:-103,1:106,2:0' node .verify/_aim.mjs .preview/aim/tokyo */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const ROOMS = process.env.ROOMS || "rooms.html";
const OUT = process.argv[2] || ".preview/aim";
const VIEWS = (process.env.VIEWS || "0:0").split(",").map((v) => v.split(":").map(Number));
const BASE = process.env.BASE || "http://127.0.0.1:8080";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await sleep(2500);
const state = () => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  return w ? { x: w.x, z: w.depth, yaw: w.yaw, pitch: w.pitch } : null;
});

for (const [stopIdx, wantYaw] of VIEWS) {
  const target = await page.evaluate((i) => {
    const el = document.querySelectorAll("[data-walk-stop]")[i];
    return Number.parseFloat(getComputedStyle(el).getPropertyValue("--z"));
  }, stopIdx);
  await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), stopIdx);
  for (let n = 0; n < 80; n++) {
    await sleep(250);
    const s = await state();
    if (s && Math.abs(s.z - target) < 4) break;
  }
  await sleep(900);
  /* Turn with a held arrow key, not a drag. A drag starts with a mouse-down in the middle of the
     frame, which is where a prop's hit box usually is -- so the "turn" opened a prop's card, and a
     card makes every further key a no-op while it is up (site.js `busy`). The key turn is the same
     rate the visitor has (TURN_RATE 75 deg/s) and cannot press anything. */
  for (let guard = 0; guard < 10; guard++) {
    const s = await state();
    const d = ((wantYaw - s.yaw + 540) % 360) - 180;
    if (Math.abs(d) < 2) break;
    const key = d > 0 ? "ArrowRight" : "ArrowLeft";
    await page.keyboard.down(key);
    await sleep(Math.max(60, Math.abs(d) / 75 * 1000));
    await page.keyboard.up(key);
    await sleep(350);
  }
  const s = await state();
  await sleep(700);
  const name = `stop${stopIdx}-yaw${Math.round(wantYaw)}`;
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("SHOT", name, "at", s && `x${s.x.toFixed(0)} z${s.z.toFixed(0)} yaw${s.yaw.toFixed(0)}`);
}
await browser.close();
