/* Drive the body into the spot the collision gate found it stuck in, and watch the solver.

   The gate reported eleven stuck-and-escapable moments on the Niagara page, all at
   (676, 4814) — the body's east edge against the upper station's block. This walks to that stop,
   presses forward the way the gate does, and prints the solver's own numbers so the cause is
   read off the machine rather than guessed at.
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const WZ = Number(process.env.WZ || 4814);

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${FILE}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));

const solver = () => page.evaluate(() => document.querySelector("[data-walk]").__walk.solver);

/* Ride the rail to the stop nearest the reported spot. */
const stop = await page.evaluate((WZ) => {
  let best = null, bestD = Infinity;
  document.querySelectorAll("[data-walk-stop]").forEach((el) => {
    const z = parseFloat(el.style.getPropertyValue("--z")) || 0;
    const d = Math.abs(z - WZ);
    if (d < bestD) { bestD = d; best = { z, x: parseFloat(el.style.getPropertyValue("--x")) || 0 }; }
  });
  return best;
}, WZ);
console.log("stop:", JSON.stringify(stop));
await page.evaluate((WZ) => {
  let best = null, bestD = Infinity;
  document.querySelectorAll("[data-walk-stop]").forEach((el) => {
    const z = parseFloat(el.style.getPropertyValue("--z")) || 0;
    const d = Math.abs(z - WZ);
    if (d < bestD) { bestD = d; best = el; }
  });
  best.click();
}, WZ);
await new Promise((r) => setTimeout(r, 6000));
console.log("at the stop:", JSON.stringify(await solver()));

/* Lean the heading east so the drift carries the body toward the block. */
await page.keyboard.down("d");
await new Promise((r) => setTimeout(r, 700));
await page.keyboard.up("d");
/* Press forward and watch. */
await page.keyboard.down("w");
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 500));
  const s = await solver();
  if (i % 4 === 0 || Math.abs(s.x) > 560)
  console.log(`  ${i} x=${s.x.toFixed(1)} z=${s.depth.toFixed(1)} yaw=${s.yaw.toFixed(0)} ` +
              `vx=${s.vx.toFixed(1)} vd=${s.vd.toFixed(1)} half=${s.half} ` +
              `contact=${s.contact ? `(${s.contact.nx.toFixed(2)},${s.contact.nz.toFixed(2)}) p=${s.contact.p.toFixed(1)}` : "none"}`);
}
await page.keyboard.up("w");

/* What is in front of the body, and what the lane says about the ground ahead? */
const around = await page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  const s = w.solver;
  const px = (el, p) => { const v = el.style.getPropertyValue(p); return v ? parseFloat(v) : 0; };
  const props = Array.from(document.querySelectorAll('[data-obj][data-solid="true"]')).map((el) => {
    const a = ((px(el, "--ry") || parseFloat(el.dataset.ry || 0)) * Math.PI) / 180;
    return { id: el.dataset.obj, x: px(el, "--x"), z: px(el, "--z"),
             w: parseFloat(el.dataset.w) || 0, d: parseFloat(el.dataset.d) || 0,
             c: Math.cos(a), s: Math.sin(a) };
  });
  const near = props.map((b) => {
    const dx = s.x - b.x, dz = s.depth - b.z;
    const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
    const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
    return { id: b.id, x: b.x, z: b.z, w: b.w, d: b.d,
             gap: +Math.max(0, Math.hypot(ox, od) - s.radius).toFixed(1),
             lx: +lx.toFixed(1), ld: +ld.toFixed(1) };
  }).sort((a, b) => a.gap - b.gap).slice(0, 5);
  const probes = [];
  for (const dz of [2, 10, 30, 60]) {
    const row = { dz, here: !!w.blockedAt(s.x, s.depth + dz) };
    for (const dx of [-4, -2, 0, 2, 4]) row["dx" + dx] = !!w.blockedAt(s.x + dx, s.depth + dz);
    probes.push(row);
  }
  return { solver: s, near, probes };
});
console.log(JSON.stringify(around, null, 1));
await browser.close();
