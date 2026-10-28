/* _uxwalk -- the visitor's own pass, not a gate: at every stop, turn through the room and press E on
   whatever is in reach, then record what the press actually did to the screen.

   Round 74 exists because a press can be "answered" and still be bad. The owner's ruling is that only
   the objects which have nothing to *show* may open text: 「只留該需要用文字彈出介面介紹的物件。其他就像你
   說的可以用E去互動看有沒有變化。」 So this probe counts, per press:

     - which surface took the screen (a reel of photographs, a text card, the written lane, a toy);
     - **how much of the picture that surface covers** (a text panel over the scene is a pop-up; a door
       opening is not);
     - whether the scene itself changed (quads), which is the "看有沒有變化" answer;
     - the sentence the record line announced, and how the visitor gets back.

   It prints one line per press and a summary. It is a measuring instrument, not a gate; the gate for
   the rule is `.verify/verify-ux.mjs`.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_uxwalk.mjs
         ROOMS=rooms-goat.html STOPS=0,2 HEADINGS=0,90 node .verify/_uxwalk.mjs
*/
import fs from "node:fs";
import { launch, openPage as openPageRaw, arrive, aim, park, sleep } from "./_aim.mjs";

const PAGES = (process.env.ROOMS || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const HEADINGS = (process.env.HEADINGS || "0,90,180,270").split(",").map(Number);
const OUT = process.env.OUT || ".preview/ux74";
fs.mkdirSync(OUT, { recursive: true });

const line = (r) => `${(r.rooms + " s" + r.si + " @" + r.heading).padEnd(24)} ${((r.obj || "-") + (r.verb ? ":" + r.verb : "")).padEnd(30)} `
  + `${(r.answer || r.note || "").padEnd(11)} ${String(r.covers ?? 0).padStart(3)}%  ${(r.quads || "").padEnd(11)} `
  + `${(r.ms ? r.ms + "ms" : "").padEnd(7)} ${r.record || ""}`;

const read = (page) => page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const area = (el) => {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.round((r.width * r.height) / (innerWidth * innerHeight) * 100);
  };
  const plate = q("#room-plate.is-open");
  const card = q("[data-walk-card]:not([hidden])");
  const list = q("[data-walk-listpanel]:not(.is-closed)");
  const game = q("[data-walk-game]:not([hidden])");
  const reach = q(".walk-hit.is-reach");
  const w = q("[data-walk]")?.__walk;
  return {
    plate: area(plate), card: area(card), list: area(list), game: area(game),
    plateTitle: plate ? (q("[data-walk-title]")?.textContent || "").trim().slice(0, 60) : "",
    cardTitle: card ? (q("[data-walk-title]")?.textContent || "").trim().slice(0, 60) : "",
    reach: reach ? reach.dataset.obj : null,
    verb: reach ? reach.dataset.verb : "",
    reachTitle: reach ? (reach.dataset.title || "").slice(0, 48) : "",
    bar: q("[data-walk-open]")?.hidden ? "" : (q("[data-walk-open]")?.textContent || "").trim().slice(0, 48),
    quads: w ? w.quads : -1,
    record: (q("[data-walk-record]")?.textContent || "").trim().slice(0, 86),
    yaw: w ? Math.round(w.yaw) : 0,
  };
});

/* Fold everything with its own close control, never with Escape: Escape with nothing open is the
   room's door, so a probe that folds with Esc leaves the building (and puppeteer reports it as
   "execution context destroyed", which looks like a crash rather than a door). */
const fold = async (page) => {
  await page.evaluate(() => {
    const c = document.querySelector("[data-walk-card]:not([hidden]) [data-walk-card-close]");
    if (c) c.click();
    const d = document.querySelector("#room-plate.is-open [data-room-close]");
    if (d) d.click();
    const g = document.querySelector("[data-walk-game]:not([hidden]) [data-game-close]");
    if (g) g.click();
    const l = document.querySelector("[data-walk-listpanel]:not(.is-closed)");
    if (l) document.querySelector("[data-walk-list]")?.click();
  });
  await sleep(200);
};

const browser = await launch({ width: 1024, height: 768 });
const rows = [];
const push = (r) => {
  rows.push(r);
  // Written as we go: a press that leaves the room destroys the page's execution context (a door is
  // supposed to), and a crash forty minutes in must not take the evidence with it.
  fs.appendFileSync(`${OUT}/presses.txt`, line(r) + "\n");
};
fs.writeFileSync(`${OUT}/presses.txt`, "");
let page = null, atPage = "";
const openPage = async (rooms, si) => {
  if (page) await page.close().catch(() => {});
  page = await openPageRaw(browser, { rooms, hour: "day" });
  atPage = rooms;
  if (si !== null) await arrive(page, si);
  return page;
};
for (const rooms of PAGES) {
  page = await openPage(rooms, null);
  const stopCount = await page.evaluate(() => document.querySelectorAll("[data-walk-stop]").length);
  const wanted = process.env.STOPS ? process.env.STOPS.split(",").map(Number) : [...Array(stopCount).keys()];
  for (const si of wanted) {
    if (page === null) await openPage(rooms, si);
    let a = await arrive(page, si);
    if (!a.arrived) { push({ rooms, si, heading: "-", note: `did not arrive: ${a.why}` }); continue; }
    for (const h of HEADINGS) {
      /* Everything here runs against a page that a previous press may have left. Rather than guess
         which call will notice the navigation, the whole visit is one attempt: a door press that
         leaves is recorded as LEFT and the room is opened again at the same stop. */
      let before = null;
      const t0 = Date.now();
      try {
        await fold(page);
        await aim(page, h);
        await park(page, 420);
        before = await read(page);
        if (!before.reach) { push({ rooms, si, heading: h, reach: null, note: "nothing in reach" }); continue; }
        const url0 = page.url();
        await page.keyboard.press("e");
        await sleep(700);
        const after = await read(page);
        /* A door's answer is a different page. `page.url()` is the honest test: the old document can
           still be read for a moment after the navigation starts, and it then reports the *next*
           room's quads, which is how a door was once classified as a scene change. */
        const answer = page.url() !== url0 ? "LEFT"
          : after.plate ? "PHOTOS" : after.card ? "TEXT" : after.list ? "TEXT(lane)"
          : after.game ? "TOY" : after.quads !== before.quads ? "SCENE"
          : after.record && after.record !== before.record ? "WORDS" : "?!";
        push({ rooms, si, heading: h, obj: before.reach, verb: before.verb, title: before.reachTitle,
          answer, covers: answer === "LEFT" ? 0 : Math.max(after.plate, after.card, after.list, after.game),
          quads: `${before.quads}->${after.quads}`,
          record: answer === "LEFT" ? `left for ${page.url().replace(/^.*\//, "")}` : after.record,
          ms: Date.now() - t0,
          back: after.plate || after.card || after.list || after.game ? "Esc" : "-" });
        /* A door's answer is a different document, so there is nothing left of this room to fold and
           the next heading has to start from the room the visit was in. */
        if (answer === "LEFT") await openPage(rooms, si); else await fold(page);
      } catch (err) {
        const left = /destroyed|navigation/i.test(String(err && err.message));
        const was = left ? `left to ${page.url().replace(/^.*\//, "")}` : String(err && err.message).slice(0, 80);
        push({ rooms, si, heading: h, obj: before && before.reach, verb: before && before.verb,
          title: before && before.reachTitle, answer: left ? "LEFT" : "?!",
          covers: 0, quads: "", record: was, ms: Date.now() - t0, back: left ? "Back" : "-" });
        await openPage(rooms, si);
        console.error(`reopened ${rooms} at stop ${si}: ${page.url()} with `
          + `${await page.evaluate(() => document.querySelectorAll("[data-walk-stop]").length)} stops`);
      }
    }
  }
  await page.close();
}
await browser.close();
console.log("\n" + rows.map(line).join("\n"));
console.log(`(the same lines were written to ${OUT}/presses.txt as they were taken)`);

const presses = rows.filter((r) => r.answer);
const tally = presses.reduce((a, r) => { a[r.answer] = (a[r.answer] || 0) + 1; return a; }, {});
const text = rows.filter((r) => /^TEXT/.test(r.answer || ""));
const guessed = rows.filter((r) => r.reach === null).length;
console.log(`\n${presses.length} presses answered, ${rows.length - presses.length} headings with nothing in reach `
  + `(${guessed} empty)`);
console.log(`answers: ${JSON.stringify(tally)}`);
console.log(`text surfaces: ${text.length} — ${text.map((r) => `${r.obj}(${r.covers}%)`).join(", ") || "none"}`);
const verbs = presses.reduce((a, r) => { a[r.verb || "?"] = (a[r.verb || "?"] || 0) + 1; return a; }, {});
console.log(`pressed by verb: ${JSON.stringify(verbs)}`);
console.log(`written to ${OUT}/presses.txt`);
