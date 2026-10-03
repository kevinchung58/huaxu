/* Framing audit: from every walk stop, how much of that stop's own table is on screen.
   Read `visibility` rather than a centre-point test — the renderer sets it per object, and a
   big plinth's centre sits below the viewport while its top edge is plainly in view.
   Run:  node .verify/verify-tables.mjs */
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T = {
  1: { name: "lake",   ids: ["plinth-lake","pool-lake","planter-i1","planter-i2","boat-lake","tree-i1","tree-i2","tree-s1","tree-s2"] },
  2: { name: "falls",  ids: ["plinth-falls","falls-n","tree-f1","tree-f2"] },
  3: { name: "market", ids: ["plinth-market","stall-m1","stall-m2","stall-m3","crate-m1","crate-m2","tree-m1"] },
  4: { name: "city",   ids: ["plinth-sky","tower-cn","skyline-cn","dome-rc","track-c","tram-t","tree-c1","tree-c2","tree-c3"] },
};
for (const [stop, t] of Object.entries(T)) {
  console.log(`\nstop${stop}  ${t.name}`);
  for (const deg of [-90, -60, -30, 0, 30, 60, 90]) {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:8080/rooms-toronto.html", { waitUntil: "networkidle0" });
    await sleep(1300);
    await page.evaluate((s) => document.querySelectorAll("[data-walk-stop]")[+s].click(), stop);
    await sleep(2500);
    for (let k = 0; k < Math.round(Math.abs(deg)/7); k++) { await page.keyboard.press(deg<0?"ArrowLeft":"ArrowRight"); await sleep(80); }
    await sleep(900);
    const r = await page.evaluate((ids) => ids.map(id => {
      const el = document.querySelector(`[data-obj="${id}"]`);
      if (!el || getComputedStyle(el).visibility === "hidden") return null;
      const b = el.getBoundingClientRect();
      const ix = Math.max(0, Math.min(b.right,1024) - Math.max(b.left,0));
      const iy = Math.max(0, Math.min(b.bottom,768) - Math.max(b.top,0));
      return { id, frac: +((ix*iy) / Math.max(1, b.width*b.height)).toFixed(2) };
    }).filter(Boolean), t.ids);
    const shown = r.filter(o => o.frac > 0.15);
    console.log(`  ${String(deg).padStart(3)}°  ${String(shown.length).padStart(2)}/${t.ids.length} framed  ` + shown.map(o=>`${o.id}(${o.frac})`).join(" "));
    await page.close();
  }
}
await browser.close();
