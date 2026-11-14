/* _turnprobe -- how far one key tap turns the head, and how far one pixel of drag does.

   Round 71: the owner says left/right turning is too large. That is a number before it is a
   feeling, and this is the number: a tap of D (down and up in one frame) is paid out at the
   lane's turn rate for the press it never got, and a drag sets the heading from distance.

   It also prints the two cases where the key's ledger used to be wrong, each against what the
   page's own clock says the presses were worth (the sum of each press's length, never less than one
   nudge, at the lane's turn rate):
     - a press that begins before the last release has met a frame -- the tap on a hold's heels,
       which used to be paid only the share one frame happened to catch;
     - a key held while the window loses focus -- its keyup goes elsewhere, and the next release of
       that key used to pay the whole time away as one press.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-toronto.html node .verify/_turnprobe.mjs
*/
import { launch, openPage, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day" });
const yaw = () => page.evaluate(() => +document.querySelector("[data-walk]").__walk.yaw.toFixed(2));

const taps = [];
for (const key of ["d", "a", "ArrowRight"]) {
  for (let i = 0; i < 3; i++) {
    const a = await yaw();
    await page.keyboard.down(key);
    await page.keyboard.up(key);       // one frame at most sees it
    await sleep(300);
    const b = await yaw();
    let d = ((b - a + 540) % 360) - 180;
    taps.push({ key, d: +d.toFixed(2) });
  }
}
console.log("tap turn:", JSON.stringify(taps));

const holds = [];
for (const ms of [200, 500, 1000]) {
  const a = await yaw();
  await page.keyboard.down("d"); await sleep(ms); await page.keyboard.up("d"); await sleep(260);
  const b = await yaw();
  holds.push({ ms, d: +(((b - a + 540) % 360) - 180).toFixed(1) });
}
console.log("hold turn:", JSON.stringify(holds));

const drags = [];
for (const dx of [60, 200, 400]) {
  const a = await yaw();
  await page.mouse.move(512, 384);
  await page.mouse.down();
  await page.mouse.move(512 + dx, 384, { steps: 8 });
  await page.mouse.up();
  await sleep(260);
  const b = await yaw();
  drags.push({ dx, d: +(((b - a + 540) % 360) - 180).toFixed(1), perPx: +((((b - a + 540) % 360) - 180) / dx).toFixed(4) });
}
console.log("drag turn:", JSON.stringify(drags));

/* The ledger cases. `owed` is computed from the page's own key events, so the comparison does not
   depend on how punctual this script's sleeps were. */
await page.evaluate(() => {
  window.__keys = [];
  for (const type of ["keydown", "keyup"]) window.addEventListener(type, (e) => {
    if (!e.repeat) window.__keys.push([type, performance.now()]);
  }, true);
});
const rate = await page.evaluate(() => document.querySelector("[data-walk]").__walk.turnRate);
const owedSince = (from) => page.evaluate((from, rate) => {
  let ms = 0, down = null;
  for (const [type, t] of window.__keys.slice(from)) {
    if (type === "keydown") down = t;
    else if (down !== null) { ms += Math.max(t - down, 35); down = null; }
  }
  return +(ms * rate / 1000).toFixed(2);
}, from, rate);
const mark = () => page.evaluate(() => window.__keys.length);
const turned = (a, b) => +(((b - a + 540) % 360) - 180).toFixed(2);

const heels = [];
for (let i = 0; i < 4; i++) {
  await sleep(600);
  const a = await yaw(), from = await mark();
  await page.keyboard.down("ArrowRight"); await sleep(300); await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowRight"); await sleep(40); await page.keyboard.up("ArrowRight");
  await sleep(600);
  const d = turned(a, await yaw()), owed = await owedSince(from);
  heels.push({ d, owed, short: +(owed - d).toFixed(2) });
}
console.log("a tap on a hold's heels:", JSON.stringify(heels));

const lost = [];
for (const away of [1000, 3000]) {
  await sleep(600);
  await page.keyboard.down("ArrowRight"); await sleep(300);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await sleep(400);
  const a = await yaw();
  await sleep(away);
  await page.keyboard.up("ArrowRight");          // a late keyup, if the visitor was still holding
  await page.keyboard.down("ArrowRight"); await page.keyboard.up("ArrowRight");
  await sleep(600);
  lost.push({ away, afterComingBack: turned(a, await yaw()), aTapIs: +(35 * rate / 1000).toFixed(2) });
}
console.log("a key held through a lost window:", JSON.stringify(lost));
await browser.close();
