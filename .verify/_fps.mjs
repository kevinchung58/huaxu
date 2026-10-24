/* _fps — frames per second on a page, in the same headless browser the gates use.
   Diagnostic (exit 0). Round 69: the mist fix doubled the spray billboards (216 → 436 large
   alpha quads) and a timing-sensitive walk gate started flaking, so the cost of the plume has to
   be a number, not a worry. Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_fps.mjs [page] */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const FILE = process.env.FILE || process.argv[2] || "rooms-niagara.html";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(`${BASE}/${FILE}`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 90000 });
await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[3]?.click());
await new Promise((r) => setTimeout(r, 6000));
const out = [];
for (let i = 0; i < 3; i += 1) {
  const fps = await page.evaluate(() => new Promise((resolve) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n += 1; if (performance.now() - t0 < 5000) requestAnimationFrame(tick); else resolve(n / ((performance.now() - t0) / 1000)); };
    requestAnimationFrame(tick);
  }));
  out.push(fps);
}
console.log(`${FILE}: ${out.map((f) => f.toFixed(1)).join(" / ")} fps  (errors ${errs.length})`);
await browser.close();
process.exit(0);
