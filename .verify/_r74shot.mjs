/* _r74shot -- the round-74 rule as two pictures: what the bar promises before the press, and what the
   press actually puts on the screen. Writes .preview/r74/<room>-<stop>-<verb>.png.
   Run: LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-goat.html STOP=0 node .verify/_r74shot.mjs */
import fs from "node:fs";
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";
const ROOMS = process.env.ROOMS || "rooms-goat.html";
const STOP = process.env.STOP === undefined ? null : Number(process.env.STOP);
const HEADINGS = (process.env.HEADINGS || "0,45,90,135,180,225,270,315").split(",").map(Number);
const OUT = process.env.OUT || ".preview/r74";
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day" });
if (STOP !== null) { const a = await arrive(page, STOP); if (!a.arrived) console.log(`did not arrive: ${a.why}`); }
const inReach = () => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  const b = document.querySelector("[data-walk-open]");
  const hit = document.querySelector(".walk-hit.is-reach");
  return { bar: b && !b.hidden ? b.textContent.trim() : null,
           verb: b?.dataset.verb || "", title: hit?.dataset.title || null,
           hitVerb: hit?.dataset.verb || "" };
});
let found = null;
for (const h of HEADINGS) {
  await aim(page, h); await park(page, 420); await sleep(300);
  const r = await inReach();
  if (r.bar) { found = { ...r, heading: h }; break; }
}
if (!found) { console.log(`${ROOMS}: nothing in reach at any heading`); await browser.close(); process.exit(0); }
const slug = (found.verb || "noverb").trim().replace(/[^a-z]/gi, "").toLowerCase();
const before = `${OUT}/${ROOMS.replace(".html", "")}-stop${STOP}-${slug}-before.png`;
await page.screenshot({ path: before });
const covers = () => page.evaluate(() => {
  const area = (el) => { if (!el) return 0; const r = el.getBoundingClientRect();
    return Math.round((r.width * r.height) / (innerWidth * innerHeight) * 100); };
  return { card: area(document.querySelector("[data-walk-card]:not([hidden])")),
           plate: area(document.querySelector("#room-plate.is-open")),
           list: area(document.querySelector("[data-walk-listpanel]:not(.is-closed)")),
           game: area(document.querySelector("[data-walk-game]:not([hidden])")) };
});
const c0 = await covers();
await page.keyboard.press("e");
await sleep(900);
const c1 = await covers();
const after = `${OUT}/${ROOMS.replace(".html", "")}-stop${STOP}-${slug}-after.png`;
await page.screenshot({ path: after });
console.log(`${ROOMS} stop ${STOP} @${found.heading}°  bar "${found.bar}"  verb ${found.verb || "(none)"} `
  + `| hit "${found.title}" ${found.hitVerb && "(" + found.hitVerb + ")"}\n`
  + `  before ${JSON.stringify(c0)}  after ${JSON.stringify(c1)}\n  ${before}\n  ${after}`);
await browser.close();
