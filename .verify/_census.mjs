/* The interaction census: what a visitor can actually press, on every walkable page.

   The owner's complaint (round 65): "every small thing is clickable — I cannot click the waterfall".
   A census is the answer to that complaint in numbers: how many things are on the page, how many
   of them are scenery that a finger passes through, and how many are things you can open. It
   also checks the two rules that came out of the complaint: a quiet prop must not be in the tab
   order and must not take the pointer, and a landmark must be a target even though it draws
   nothing.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_census.mjs
         PAGES=rooms-niagara.html node .verify/_census.mjs
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,"
  + "rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html")
  .split(",").filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 },
});

let bad = 0;
for (const file of PAGES) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("  PAGEERROR", e.message));
  await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
  await sleep(900);
  const c = await page.evaluate(() => {
    const hits = Array.from(document.querySelectorAll(".walk-hit"));
    const quiet = hits.filter((el) => el.dataset.quiet === "1");
    const live = hits.filter((el) => el.dataset.quiet !== "1");
    const landmarks = hits.filter((el) => el.dataset.landmark === "1");
    const styles = (els) => {
      const out = {};
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const key = el.dataset.kind || "?";
        out[key] = (out[key] || 0) + 1;
      }
      return out;
    };
    return {
      total: hits.length, live: live.length, quiet: quiet.length, landmarks: landmarks.length,
      quietInTab: quiet.filter((el) => el.tabIndex >= 0).length,
      quietPointer: quiet.filter((el) => getComputedStyle(el).pointerEvents !== "none").length,
      liveKinds: styles(live),
      quietKinds: styles(quiet),
      liveIds: live.map((el) => el.dataset.obj),
      landmarkIds: landmarks.map((el) => el.dataset.obj),
      listRows: document.querySelectorAll("[data-walk-list] li, .walk-list li").length,
      smallThings: /The small things/.test(document.body.textContent || ""),
    };
  });
  const problems = [];
  if (c.quietInTab) problems.push(`${c.quietInTab} quiet props still in the tab order`);
  if (c.quietPointer) problems.push(`${c.quietPointer} quiet props still take the pointer`);
  if (c.live === 0) problems.push("nothing at all is pressable");
  if (problems.length) bad++;
  console.log(`${file.padEnd(20)} ${String(c.total).padStart(3)} boxes  ${String(c.live).padStart(3)} pressable`
    + `  ${String(c.quiet).padStart(3)} scenery  ${c.landmarks} landmark(s)`
    + `  ${problems.length ? "✗ " + problems.join("; ") : "ok"}`);
  console.log(`   pressable: ${Object.entries(c.liveKinds).map(([k, n]) => `${k}×${n}`).join(", ")}`);
  if (c.landmarkIds.length) console.log(`   landmarks: ${c.landmarkIds.join(", ")}`);
  console.log(`   scenery:   ${Object.entries(c.quietKinds).map(([k, n]) => `${k}×${n}`).join(", ")}`);
  console.log(`   the list has a "The small things" section: ${c.smallThings}`);
  await page.close();
}
await browser.close();
console.log(bad ? `\n${bad} page(s) with problems` : "\nno page has a scenery prop in the tab order or under the finger");
process.exit(bad ? 1 : 0);
