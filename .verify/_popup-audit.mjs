/* _popup-audit -- which gesture opens a card, and on what.

   The owner's complaint (round 71): "many unnecessary objects pop this window; it disrupts
   operating the scene". A card that opens while you are walking is a defect, and the way to fix
   one is to name the gesture that opened it. This probe presses the keys a visitor presses and
   taps the places a visitor taps, and prints every card that appears, with the props it landed on.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-cntower.html STOP=3 node .verify/_popup-audit.mjs
*/
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const STOP = process.env.STOP === undefined ? null : Number(process.env.STOP);
const GRID = Number(process.env.GRID || 5);

const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day" });
if (STOP !== null) {
  const a = await arrive(page, STOP);
  if (!a.arrived) { console.log(`did not arrive at ${STOP}: ${a.why}`); }
}
await aim(page, Number(process.env.YAW || 0));
await park(page);

const read = () => page.evaluate(() => {
  const c = document.querySelector("[data-walk-card]");
  const reach = document.querySelector(".walk-hit.is-reach");
  return {
    open: c ? !c.hidden : null,
    mode: c ? c.dataset.mode : null,
    title: c && !c.hidden ? (c.querySelector("[data-walk-title]")?.textContent || "").trim() : "",
    where: c && !c.hidden ? (c.querySelector("[data-walk-where]")?.textContent || "").trim() : "",
    reach: reach ? reach.dataset.obj : null,
    active: document.activeElement ? document.activeElement.className : "",
  };
});
const close = async () => {
  await page.evaluate(() => document.querySelector("[data-walk-card-close]")?.click());
  await sleep(80);
};
const note = (gesture, r) => console.log(`${gesture.padEnd(26)} ${r.open ? `CARD "${r.title}" (${r.where})` : "-"}` +
                                         `   reach=${r.reach || "-"} focus=${r.active || "-"}`);

console.log(`\n== ${ROOMS}${STOP === null ? "" : ` stop ${STOP}`} — gestures a visitor makes while operating`);
let before = await read();
note("on arrival", before);

for (const key of ["Space", "Enter", "e", "i"]) {
  await close();
  await page.keyboard.press(key);
  await sleep(350);
  note(`press ${key}`, await read());
}

for (const [key, ms] of [["d", 120], ["a", 120], ["d", 700], ["w", 700]]) {
  await close();
  await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(260);
  note(`hold ${key} ${ms}ms`, await read());
}

/* Taps on a grid: the visitor clicks the picture to look at it, or to focus the page. */
await close();
let landed = 0, opened = 0;
for (let gy = 0; gy < GRID; gy++) for (let gx = 0; gx < GRID; gx++) {
  const x = Math.round(80 + (gx * (1024 - 160)) / (GRID - 1));
  const y = Math.round(120 + (gy * (768 - 260)) / (GRID - 1));
  const under = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    const hit = el && el.closest ? el.closest(".walk-hit") : null;
    return hit ? { obj: hit.dataset.obj, quiet: hit.dataset.quiet === "1", kind: hit.dataset.kind } : null;
  }, { x, y });
  await page.mouse.click(x, y);
  await sleep(200);
  const r = await read();
  if (under) landed++;
  if (r.open) {
    opened++;
    console.log(`tap ${String(x).padStart(4)},${String(y).padStart(3)}  under=${under ? under.obj + "[" + under.kind + (under.quiet ? ",quiet" : "") + "]" : "canvas"}` +
                `  -> CARD "${r.title}"`);
    await close();
  }
}
console.log(`\ntaps: ${landed}/${GRID * GRID} landed on a prop's box; ${opened} opened a card`);

/* The bar: the finger's one press. It is reported last, because it is the only thing on this page
   that is allowed to open a card, and the audit is only complete if it names what it opened. */
for (const yaw of [0, 90, 180, 270]) {
  await close();
  await aim(page, yaw);
  await park(page);
  const bar = await page.evaluate(() => {
    const b = document.querySelector("[data-walk-open]");
    return b && !b.hidden ? b.textContent.trim() : null;
  });
  if (!bar) { console.log(`bar yaw ${String(yaw).padStart(3)}  nothing in reach, so no bar`); continue; }
  await page.evaluate(() => document.querySelector("[data-walk-open]").click());
  await sleep(300);
  const r = await read();
  console.log(`bar yaw ${String(yaw).padStart(3)}  names ${JSON.stringify(bar)} -> ${r.open ? `CARD "${r.title}"` : "-"}`);
  if (r.open) await close();
}
await browser.close();
