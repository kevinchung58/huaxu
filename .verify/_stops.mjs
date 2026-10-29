/* _stops.mjs -- does the stop strip go where it says?

   Round 75. Every walk page carries a row of stops; each button holds the lane position it means
   (`--z`, and `--x` where the lane is wide). Clicking one starts a glide. This probe clicks every
   stop on every page, waits for the body to come to rest (or 30 s), and prints the shortfall.

   Why it exists: `.verify/_aim.mjs`'s `arrive()` waits up to five minutes and treats "stopped moving"
   as arrival, so a gate can be perfectly green while a visitor who clicks a stop lands a third of the
   way there. That is what happened -- street.html's last stop is 4118 cm in and the glide was still
   walking after 2.2 s, and rooms-goat.html's stop 1 (7105 cm) moved the body **9 cm** and stopped.

   Run: node .verify/_stops.mjs          (all pages)
        PAGES=rooms-goat.html node .verify/_stops.mjs
*/
import { launch, openPage, park, sleep } from "./_aim.mjs";

const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,"
  + "rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const CAP = Number(process.env.CAP || 30000);

const browser = await launch({ width: 1024, height: 768 });
let bad = 0, total = 0;
for (const rooms of PAGES) {
  const page = await openPage(browser, { rooms, hour: "day" });
  const n = await page.evaluate(() => document.querySelectorAll("[data-walk-stop]").length);
  const want = await page.evaluate(() => Array.from(document.querySelectorAll("[data-walk-stop]")).map((el) => ({
    z: parseFloat(getComputedStyle(el).getPropertyValue("--z")) || 0,
    x: parseFloat(getComputedStyle(el).getPropertyValue("--x")) || 0,
    label: el.getAttribute("aria-label"),
  })));
  const rows = [];
  for (let i = 0; i < n; i++) {
    await page.evaluate((k) => document.querySelectorAll("[data-walk-stop]")[k].click(), i);
    const t0 = Date.now();
    /* Wait on the lane's own answer, not on stillness: a loaded machine shows a resting body for a
       second at a time, and "it stopped moving" is exactly the judgment that made round 72's arrival
       instrument wrong. `__walk.glide` is null once the glide has finished, been cancelled, or never
       started. */
    while (Date.now() - t0 < CAP) {
      await sleep(120);
      const g = await page.evaluate(() => document.querySelector("[data-walk]").__walk.glide);
      if (!g) break;
    }
    await sleep(150);
    const at = await page.evaluate(() => {
      const w = document.querySelector("[data-walk]").__walk;
      return { z: Math.round(w.depth), x: Math.round(w.x) };
    });
    const dz = Math.round(at.z - want[i].z);
    const dx = Math.round(at.x - want[i].x);
    const short = Math.hypot(dz, dx);
    total++;
    if (short > 25) bad++;
    rows.push(`${short > 25 ? "SHORT" : "ok   "} stop ${i} "${want[i].label}" `
      + `want z${Math.round(want[i].z)} x${Math.round(want[i].x)} got z${at.z} x${at.x}  ${short} cm off, ${Date.now() - t0} ms`);
  }
  console.log(`${rooms}\n  ` + rows.join("\n  "));
  await page.close();
}
await browser.close();
console.log(`\n${total - bad}/${total} stops arrive where they say (within 25 cm)`);
if (bad) process.exitCode = 1;
