/* _overlay-audit — every interface that appears on a page, and the gesture that made it appear.

   The owner's round-71 correction killed the card that a tap used to open. Round 72 is the same
   question asked about everything else: 「甚至其他的東西…我發現很多東西因為選取會跳這種介面。你全面審查
   清楚，有必要的在跳。」 So this probe does not assume which surfaces exist. It lists them, presses
   everything a visitor can press, and reports each transition from hidden to shown with the gesture
   that caused it. A surface that appears without a gesture naming it is the defect.

   The surfaces it watches, by selector (all of them are "an interface over the picture"):
     [data-walk-card]        the lane's own note / a prop's record
     [data-walk-listpanel]   "the lane, written out"
     [data-walk-game]        the stalls' toys
     [data-walk-tutor]       the first-visit guide strip
     [data-walk-offline]     the no-WebGL statement
     [data-walk-banner]      the district seam's banner
     #room-plate             the story reel / the frames of a lane
     #featured-modal, #ig-plate, .dot-game-panel   the album's plates (non-walk pages)

   Run:
     LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-toronto.html node .verify/_overlay-audit.mjs
     LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=index.html PROPS=0 STOPS=0 node .verify/_overlay-audit.mjs
*/
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const STOP = process.env.STOP === undefined ? null : Number(process.env.STOP);
const YAW = process.env.YAW === undefined ? null : Number(process.env.YAW);
const PROPS = process.env.PROPS !== "0";
const STOPS = process.env.STOPS !== "0";
const TOOLS = process.env.TOOLS !== "0";
const SURFACES = [
  "[data-walk-card]", "[data-walk-listpanel]", "[data-walk-game]", "[data-walk-tutor]",
  "[data-walk-offline]", "[data-walk-banner]", "#room-plate", "#featured-modal", "#ig-plate",
  ".dot-game-panel", "[data-walk-open]",
];

const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day" });
if (STOP !== null) {
  const a = await arrive(page, STOP);
  if (!a.arrived) console.log(`did not arrive at ${STOP}: ${a.why}`);
}
if (YAW !== null) await aim(page, YAW);
await park(page);
await sleep(500);

/* What is showing right now. `hidden`, `display:none`, zero size and the drawer's `is-closed`
   class all count as not showing; a banner is a transient and is read the same way. */
const shown = () => page.evaluate((sels) => {
  const vis = (el) => {
    if (!el) return false;
    if (el.hidden) return false;
    if (el.classList.contains("is-closed")) return false;
    if (el.classList.contains("is-open")) return true;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  };
  const out = {};
  for (const s of sels) {
    const els = Array.from(document.querySelectorAll(s));
    out[s] = els.filter(vis).map((el) => {
      const t = (queryTitle(el) || "").slice(0, 46);
      return t;
    });
  }
  return out;
  function queryTitle(el) {
    const t = el.querySelector?.("[data-walk-title]");
    if (t && t.textContent.trim()) return t.textContent.trim();
    return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }
}, SURFACES);

const key = (v) => page.keyboard.press(v);
const hold = async (k, ms) => { await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); await sleep(180); };
/* Fold what a gesture opened, but never with Escape: with nothing open, Escape walks the visitor
   out of the room (that is the lane's own contract), and a probe that navigates away measures the
   next page. Each surface is closed through its own control, which is what a visitor would use. */
const closeAll = async () => {
  for (let i = 0; i < 4; i++) {
    const did = await page.evaluate(() => {
      const pick = (sel) => document.querySelector(sel);
      const order = ["[data-walk-card-close]", "[data-walk-list-close]", "[data-game-close]",
                     "[data-room-close]", "[data-ig-close]", "[data-close]"];
      for (const sel of order) {
        const el = pick(sel);
        if (!el) continue;
        const modal = el.closest("[hidden]");
        if (modal) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        el.click();
        return true;
      }
      return false;
    });
    if (!did) break;
    await sleep(240);
  }
};

let last = await shown();
const report = (gesture, cur) => {
  const opened = [];
  for (const s of SURFACES) {
    const a = (last[s] || []).length, b = (cur[s] || []).length;
    if (b > a) opened.push(`${s}${cur[s][b - 1] ? ` "${cur[s][b - 1]}"` : ""}`);
  }
  if (opened.length) console.log(`${gesture.padEnd(34)} -> ${opened.join(" | ")}`);
  last = cur;
};

console.log(`\n== ${ROOMS}${STOP === null ? "" : ` stop ${STOP}`} — what appears, and on what`);
const onArrival = await shown();
const arrived = SURFACES.filter((s) => (onArrival[s] || []).length);
console.log(`on arrival                         ${arrived.length ? "SHOWING " + arrived.map((s) => `${s} "${onArrival[s][0]}"`).join(" | ") : "nothing over the picture"}`);

/* 1. the keys */
for (const k of ["Space", "Enter", "e", "i", "l", "Escape"]) {
  await closeAll();
  await key(k);
  await sleep(320);
  report(`press ${k}`, await shown());
  await closeAll();
}

/* 2. the tool row, one control at a time */
if (TOOLS) {
  const tools = await page.evaluate(() => Array.from(document.querySelectorAll("[data-walk-tools] button, .walk-tools button"))
    .map((b, i) => ({ i, sel: b.dataset.walkFov !== undefined ? `[data-walk-fov="${b.dataset.walkFov}"]`
      : b.dataset.walkJump !== undefined ? "[data-walk-jump]"
      : b.dataset.walkInfo !== undefined ? "[data-walk-info]"
      : b.dataset.walkList !== undefined ? "[data-walk-list]"
      : b.dataset.walkTutorReplay !== undefined ? "[data-walk-tutor-replay]"
      : b.dataset.walkHour !== undefined ? "[data-walk-hour]"
      : `button:nth-of-type(${i + 1})`,
        label: b.getAttribute("aria-label") || b.textContent.trim() })));
  for (const t of tools) {
    await closeAll();
    const box = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, t.sel);
    if (!box) continue;
    await page.mouse.click(box.x, box.y);
    await sleep(320);
    report(`click tool "${t.label}"`.slice(0, 34), await shown());
    await closeAll();
  }
}

/* 3. the stop rail */
if (STOPS) {
  const n = await page.evaluate(() => document.querySelectorAll("[data-walk-stop]").length);
  for (let i = 0; i < n; i++) {
    await closeAll();
    const box = await page.evaluate((i) => {
      const el = document.querySelectorAll("[data-walk-stop]")[i];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), label: el.getAttribute("aria-label") };
    }, i);
    if (!box) continue;
    await page.mouse.click(box.x, box.y);
    await sleep(340);
    report(`click stop ${i} "${(box.label || "").slice(0, 12)}"`.slice(0, 34), await shown());
    await closeAll();
  }
}

/* 4. every prop box that is on the screen, clicked once each */
if (PROPS) {
  const boxes = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".walk-hit").forEach((el) => {
      if (el.style.visibility === "hidden") return;
      const r = el.getBoundingClientRect();
      if (!(r.left > 4 && r.top > 4 && r.right < innerWidth - 4 && r.bottom < innerHeight - 4)) return;
      if (r.width < 12 || r.height < 12) return;
      if (r.top < 90 || r.bottom > 640) return;      // keep the pointer off the HUD
      out.push({ obj: el.dataset.obj, quiet: el.dataset.quiet, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
    });
    return out;
  });
  for (const b of boxes) {
    await closeAll();
    await page.mouse.click(b.x, b.y);
    await sleep(340);
    report(`click prop ${b.obj}${b.quiet === "1" ? " (scenery)" : ""}`.slice(0, 34), await shown());
    await closeAll();
  }
  console.log(`props clicked: ${boxes.length} (${boxes.filter((b) => b.quiet === "1").length} of them scenery)`);
}

/* 5. the picture itself, and a selection drag across it */
await closeAll();
for (const [x, y] of [[512, 380], [200, 300], [820, 300], [512, 560]]) {
  await page.mouse.click(x, y);
  await sleep(260);
  report(`tap the picture ${x},${y}`, await shown());
}
await page.mouse.move(300, 200);
await page.mouse.down();
await page.mouse.move(700, 420, { steps: 4 });
await page.mouse.up();
await sleep(300);
report("drag a selection across it", await shown());

await browser.close();
