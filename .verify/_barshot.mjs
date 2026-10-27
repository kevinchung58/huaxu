/* _barshot -- the reach bar, in the frame it appears in. Round 71: the bar is the finger's only
   verb, so it has to be seen, not only queried. Writes .preview/bar/<room>-<yaw>.png.
   Run: LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-cntower.html STOP=3 YAW=180 node .verify/_barshot.mjs */
import fs from "node:fs";
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";
const ROOMS = process.env.ROOMS || "rooms-cntower.html";
const STOP = process.env.STOP === undefined ? null : Number(process.env.STOP);
const YAW = Number(process.env.YAW || 0);
const OUT = process.env.OUT || ".preview/bar";
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day" });
if (STOP !== null) { const a = await arrive(page, STOP); if (!a.arrived) console.log(`did not arrive: ${a.why}`); }
await aim(page, YAW);
await park(page);
await sleep(400);
const bar = await page.evaluate(() => {
  const b = document.querySelector("[data-walk-open]");
  if (!b || b.hidden) return null;
  const r = b.getBoundingClientRect();
  return { text: b.textContent.trim(), box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
});
const name = `${OUT}/${ROOMS.replace(".html", "")}-stop${STOP}-yaw${YAW}.png`;
await page.screenshot({ path: name });
console.log(bar ? `bar "${bar.text}" at ${bar.box.join(",")}` : "no bar in reach", "->", name);
await browser.close();
