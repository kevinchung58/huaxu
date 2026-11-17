/* verify-demo -- a pressed model answers in its own words, and then gives the record line back.

   Two defects that a walk-and-press pass found and that no state read could see:

   1. THE WRONG WORDS. The carousel had `demo` in its record, no row of its own in the press's
      sentence table, and nothing in its drawing that read the press: it kept turning as it always
      does while the record line read out the drawbridge's sentence ("the leaves rise, a boat takes
      the opening"). `_uxwalk` called it SCENE, because a ride that never stands still changes its
      quad count whether or not anyone pressed it.

   2. THE RECORD THAT NEVER CAME BACK. The demonstration's pump borrowed the idle pulse's timer
      handle, and the frame loop cancels that handle the moment the walker moves. Press a model,
      take one step inside the envelope, and the hold was never released: the line kept the
      demonstration's sentence and refused every later one for the rest of the visit (measured on
      the tree before the fix: still held 35 s after a 4-second demonstration, and after walking on).

   3. THE RIDE THAT WENT NOWHERE. The incline answers a look from eighty metres. From the fun row
      (stop 6) its car lifted the body 3.9 m over the paving and set it down where it stood, saying
      "You step off at the top, onto the Fallsview deck" at street level; from the deck (stop 5) it
      carried the visitor from the deck to the deck and said the same, because "am I at the bottom"
      was `height < 900` and the deck is authored at 553. There was no ride down at all.

   4. THE SENTENCE NOBODY COULD READ. A one-off line (the car has arrived, night has come) was
      written into a region that the next frame rewrites; and the night's sentence named "the
      falls' own colours" on pages that have no falls.

   5. THE LANE THAT NEVER RESTED AGAIN. A resting lane redraws about ten times a second (the idle
      pulse) and no more. The hour button started its own timer in the pulse's handle without
      stopping the one already in it, so every press left one more redraw chain running for the rest
      of the visit: 9 ticks a second at rest, 19 after one press, 30 after two (measured), each a
      full night's draw. The page still answered -- the picture did not: the browser's own frame
      rate fell from 60 to 4 a second on the software rasteriser and stayed there. Nothing that
      reads state or a frame sees this; the count of ticks does. The incline's pump borrowed the
      same handle and is held to the same rule.

   6. THE BAR NO FINGER COULD PRESS. The bar ("Read . The Horseshoe Falls") is the lane's one
      control for a finger -- a phone has no E. `.walk-hud > *` turns pointer events off for the
      layout rows and the controls opt back in by class; `.walk-open` was never on that list, so
      every tap on the bar went through it to the scene. Every instrument that pressed the bar did
      it with `element.click()` from inside the page, which does not hit-test. This presses it with
      the mouse and with a touch, at the point a visitor would.

   This stands where a visitor stands (Niagara: stop 8 facing 180 for the carousel, stop 6 facing 90
   for the wheel), presses E, and reads the line a screen reader is given.

     sh bin/gate node .verify/verify-demo.mjs        [BASE=http://127.0.0.1:8081]
*/
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
let pass = 0, fail = 0;
const ok = (good, text) => { console.log(`${good ? "PASS" : "FAIL"}  ${text}`); if (good) pass++; else fail++; };
const rec = (page) => page.evaluate(() => {
  const r = document.querySelector("[data-walk-record]"), reach = document.querySelector(".walk-hit.is-reach");
  return { held: r.dataset.demoHold === "1", text: r.textContent, reach: reach ? reach.dataset.obj : "", live: reach ? reach.__demoAt !== undefined : false };
});
const stand = async (page, stop, yaw, want) => {
  const a = await arrive(page, stop), g = await aim(page, yaw);
  await park(page);
  const r = await rec(page);
  ok(a.arrived && g.aimed && r.reach === want, `stop ${stop} facing ${yaw}: "${want}" is the thing in reach (arrived ${a.arrived}, aimed ${g.aimed}, in reach "${r.reach}")`);
  return r.reach === want;
};

const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: "rooms-niagara.html", hour: "day", base: BASE });
await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());

// 1. the carousel says a carousel's sentence, and lets go when its round is over
if (await stand(page, 8, 180, "carousel")) {
  await page.keyboard.press("e"); await sleep(400);
  const now = await rec(page);
  ok(now.held && now.live && /carousel/i.test(now.text) && !/leaves|boat/i.test(now.text),
     `the carousel answers as a carousel: "${now.text.slice(0, 80)}"`);
  await sleep(14000);
  const later = await rec(page);
  ok(!later.held && !later.live, `fourteen seconds on, its ten-second round is over and the line is free (held ${later.held}, envelope ${later.live ? "open" : "closed"})`);
}

// 2. the wheel: press, take one step inside the envelope, stand -- the line must come back
if (await stand(page, 6, 90, "skywheel")) {
  await page.keyboard.press("e"); await sleep(400);
  const now = await rec(page);
  ok(now.held && /wheel/i.test(now.text), `the wheel answers as a wheel: "${now.text.slice(0, 60)}"`);
  await page.keyboard.down("s"); await sleep(700); await page.keyboard.up("s");
  await sleep(27000);
  const later = await rec(page);
  ok(!later.held, `a step taken during the demonstration does not strand the line: 28 s on it is ${later.held ? `STILL HELD on "${later.text.slice(0, 40)}"` : "free"}`);
  await page.keyboard.down("w"); await sleep(700); await page.keyboard.up("w"); await sleep(1500);
  const walked = await rec(page);
  ok(!/courtesy turn/.test(walked.text), `and walking on, the line no longer reads the wheel's sentence ("${walked.text.slice(0, 50)}")`);
}
// 3. the incline carries the visitor to a deck and back, and says where they are
const body = (p) => p.evaluate(() => { const w = document.querySelector("[data-walk]").__walk; return { x: Math.round(w.x), z: Math.round(w.depth), h: Math.round(w.height) }; });
const deck = await page.evaluate(() => {
  const f = JSON.parse(document.querySelector("[data-walk]").getAttribute("data-lane-floors") || "[]")[0];
  const el = document.querySelector('[data-obj="falls-incline"]');
  return { z0: f[0], z1: f[1], h: f[2], x0: f[3], x1: f[4], top: Number(el.dataset.rideTop) };
});
ok(deck.h === deck.top, `the record's deck (${deck.h} cm, z ${deck.z0}-${deck.z1}, x ${deck.x0}-${deck.x1}) is the ride's own top (${deck.top})`);
if (await stand(page, 6, 180, "falls-incline")) {
  const from = await body(page);
  await page.keyboard.press("e"); await sleep(4300);
  const at = await body(page), line = await rec(page);
  const onDeck = at.h === deck.h && at.z >= deck.z0 && at.z <= deck.z1 && at.x >= deck.x0 && at.x <= deck.x1;
  ok(onDeck, `from the fun row (z ${from.z}, ${Math.round((from.z - deck.z1) / 100)} m past the deck) the car ends ON the deck: x ${at.x}, z ${at.z}, height ${at.h}`);
  ok(/step off at the top/.test(line.text), `and the line can still be read a second after arriving: "${line.text.slice(0, 44)}"`);
  await sleep(2500);
  const stays = await body(page);
  ok(stays.h === deck.h, `the deck holds: ${stays.h} cm two and a half seconds later`);
  // ...and down again, from where the car left them
  await aim(page, 180); await park(page);
  const r = await rec(page);
  if (r.reach === "falls-incline" || r.reach === "incline-upper-door") {
    await page.keyboard.press("e"); await sleep(4300);
    const down = await body(page), said = await rec(page);
    ok(down.h === 0 && !(down.x >= deck.x0 && down.x <= deck.x1 && down.z >= deck.z0 && down.z <= deck.z1),
       `pressed on the deck, the car goes DOWN: x ${down.x}, z ${down.z}, height ${down.h} (off the deck, on the ground)`);
    ok(/step off at the bottom/.test(said.text), `and says so for long enough to read: "${said.text.slice(0, 44)}"`);
  } else ok(false, `on the deck facing 180 the ride is in reach (in reach: "${r.reach}")`);
}
await page.close();

// 4. the hour's sentence: readable a second later, and no falls where there are none
for (const [file, falls] of [["street.html", false], ["rooms-niagara.html", true]]) {
  const p = await openPage(browser, { rooms: file, hour: "day", base: BASE });
  await p.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  const q = await p.evaluate(() => { const b = document.querySelector("[data-walk-hour]").getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.click(q[0], q[1]); await sleep(1200);
  const line = (await rec(p)).text;
  ok(/^Night comes/.test(line) && /falls/.test(line) === falls,
     `${file}: a second after the button the line still reads "${line}" (${falls ? "this place has falls" : "no falls here, none named"})`);
  await p.close();
}
// 5. when it is over, the picture still moves. What a visitor loses to a lane that never rests is
//    the browser's own frame rate, so that is what is counted: animation frames a second on the
//    street, at rest and again after four presses of the hour button (measured on the tree that
//    leaked: 60 at rest, then 8, 4 and 1; fixed: 60 throughout). The lane's own tick count is
//    printed beside it and NOT judged here -- on this rasteriser five chains tick barely faster
//    than one (8.8 a second against 12 to 14), because one already fills the machine. The exact
//    count of chains, and the ride's, are `tests/idle-pulse.test.cjs`, where time is a number.
{
  const p = await openPage(browser, { rooms: "street.html", hour: "day", base: BASE });
  await p.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  await arrive(p, 1); await park(p);
  await p.evaluate(() => { window.__frames = 0; const f = () => { window.__frames++; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const rate = async (secs = 4) => {
    const read = () => p.evaluate(() => [window.__frames, document.querySelector("[data-walk]").__walk.ticks || 0]);
    const a = await read(); await sleep(secs * 1000); const b = await read();
    return { frames: (b[0] - a[0]) / secs, ticks: (b[1] - a[1]) / secs };
  };
  const rest = await rate();
  ok(rest.frames > 20, `street at rest: the browser draws ${rest.frames.toFixed(0)} frames a second (the lane ticks ${rest.ticks.toFixed(1)})`);
  const q = await p.evaluate(() => { const b = document.querySelector("[data-walk-hour]").getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  for (let i = 0; i < 4; i++) { await p.mouse.click(q[0], q[1]); await sleep(1500); }
  await sleep(4000);   // the hour's sentence is held three seconds
  const after = await rate();
  ok(after.frames >= rest.frames * 0.6, `street, four presses of the hour button later: ${after.frames.toFixed(0)} frames a second (the lane ticks ${after.ticks.toFixed(1)})`);
  await p.close();
}
// 6. the bar, by a real mouse click and by a real touch on a phone
for (const phone of [false, true]) {
  const p = await openPage(browser, { rooms: "rooms-niagara.html", hour: "day", base: BASE });
  if (phone) { await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(800); }
  await p.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  await arrive(p, 2); await park(p);
  const bar = await p.evaluate(() => {
    const b = document.querySelector("[data-walk-open]"); if (!b || b.hidden) return null;
    const q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, top = document.elementFromPoint(x, y);
    return { x, y, name: b.textContent.trim(), onTop: top === b || b.contains(top), under: top ? `${top.tagName.toLowerCase()}.${String(top.className).split(" ")[0]}` : "nothing" };
  });
  const how = phone ? "a touch on a 390 x 844 phone" : "a mouse click";
  if (!bar) { ok(false, `${how}: Niagara stop 2 shows the bar`); await p.close(); continue; }
  if (phone) await p.touchscreen.tap(bar.x, bar.y); else await p.mouse.click(bar.x, bar.y);
  await sleep(900);
  const card = await p.evaluate(() => { const c = document.querySelector("[data-walk-card]"); return c && !c.hidden ? (c.querySelector("h2, h3, [data-walk-card-title]")?.textContent || "open").trim().slice(0, 40) : ""; });
  ok(bar.onTop && card !== "", `${how} on the bar "${bar.name}" opens its card (${card ? `"${card}"` : `nothing opened; the point belongs to ${bar.under}`})`);
  await p.close();
}
await browser.close();
console.log(`\nverify-demo: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
