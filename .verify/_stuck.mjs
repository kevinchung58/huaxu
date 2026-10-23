/* What is the body wedged against at (676, 4814) on the Niagara page?

   The collision gate reported eleven stuck-and-escapable moments on that page, all at the same
   spot. This prints the solids around it and what the lane's own collider says about the body
   there, so the fix can be written against the geometry rather than against the symptom.
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const PX = Number(process.env.PX || 676), PZ = Number(process.env.PZ || 4814);

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${FILE}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

const out = await page.evaluate(({ PX, PZ }) => {
  const w = document.querySelector("[data-walk]").__walk;
  const R = w.radius;
  const px = (el, p) => { const v = el.style.getPropertyValue(p); return v ? parseFloat(v) : 0; };
  const props = Array.from(document.querySelectorAll('[data-obj][data-solid="true"]')).map((el) => {
    const a = ((px(el, "--ry") || parseFloat(el.dataset.ry || 0)) * Math.PI) / 180;
    return { id: el.dataset.obj, x: px(el, "--x"), z: px(el, "--z"),
             w: parseFloat(el.dataset.w) || 0, d: parseFloat(el.dataset.d) || 0,
             c: Math.cos(a), s: Math.sin(a), ry: px(el, "--ry") };
  });
  const near = props.map((b) => {
    const dx = PX - b.x, dz = PZ - b.z;
    const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
    const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
    return { id: b.id, x: b.x, z: b.z, w: b.w, d: b.d, ry: b.ry,
             lx: +lx.toFixed(1), ld: +ld.toFixed(1),
             gap: +Math.max(0, Math.hypot(ox, od) - R).toFixed(1) };
  }).sort((a, b) => a.gap - b.gap).slice(0, 6);
  const probes = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const qx = PX + Math.sin(a) * 45, qz = PZ + Math.cos(a) * 45;
    probes.push({ deg: k * 45, x: Math.round(qx), z: Math.round(qz), blocked: !!w.blockedAt(qx, qz) });
  }
  return { radius: R, half: w.halfWidth, near, probes,
           blockedHere: !!w.blockedAt(PX, PZ) };
}, { PX, PZ });
console.log(JSON.stringify(out, null, 1));
await browser.close();
