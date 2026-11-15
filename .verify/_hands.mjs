/* _hands -- three things only a hand finds, as one probe (not a gate).

   PART=1  the sun/moon button by a real mouse click at Niagara stop 6: where it is, how big, what the
           record line says, and frames at 150 / 600 / 2500 ms.
   PART=2  walking into the side walls of the night street from stop 1 (the door glows at arm's length).
   PART=3  a 390 x 844 touch phone on the street and at Niagara: how far a 180 px drag turns the head
           (12 degrees at `DRAG_DEG_PER_PX` 0.065 -- a full-width swipe is 25), where the pad is and
           how far 2.5 s of it walks, and the hour button's size under a thumb (30 x 30 px).

   Frames go to .preview/play/hands. Run it ALONE: with another browser pass on the same machine the
   software rasteriser drops to a frame every few seconds and a "walked 28 cm" reading is the frame
   rate, not a wall (that is how PART=2's first reading was wrong).

     PART=3 sh bin/gate node .verify/_hands.mjs
*/
import fs from "node:fs";
import { launch, openPage, arrive, aim, park, sleep, state } from "./_aim.mjs";
const OUT = ".preview/play/hands"; fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
const browser = await launch({ width: 1024, height: 768 });
const part = process.env.PART || "1,2,3";
const clickEl = async (page, sel) => {
  const r = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, q.width, q.height, getComputedStyle(e).visibility, e.hidden]; }, sel);
  if (!r) { log("  NO ELEMENT", sel); return null; }
  await page.mouse.click(r[0], r[1]);
  return r;
};
const info = (page) => page.evaluate(() => {
  const L = document.querySelector("[data-walk]"); const w = L.__walk;
  return { clock: L.dataset.walkClock, record: (document.querySelector("[data-walk-record]")?.textContent || "").trim().slice(0, 90),
           x: Math.round(w.x), z: Math.round(w.depth), yaw: Math.round(w.yaw), quads: w.quads,
           bar: document.querySelector("[data-walk-open]")?.hidden ? "" : (document.querySelector("[data-walk-open]")?.textContent || "").trim() };
});
if (part.includes("1")) {
  log("== 1. the hour button, by a real click (rooms-niagara stop 6)");
  const page = await openPage(browser, { rooms: "rooms-niagara.html", hour: "day" });
  const a = await arrive(page, 6); log("  arrived", a.arrived);
  // close the tutor so the frame is the scene
  await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  await park(page); await page.screenshot({ path: `${OUT}/hour-1-day.png` }); log("  day", JSON.stringify(await info(page)));
  const r = await clickEl(page, "[data-walk-hour]"); log("  hour button at", JSON.stringify(r));
  await sleep(150); await page.screenshot({ path: `${OUT}/hour-2-night-150ms.png` });
  await sleep(450); await page.screenshot({ path: `${OUT}/hour-2-night-600ms.png` });
  await sleep(1900); await page.screenshot({ path: `${OUT}/hour-2-night-2500ms.png` }); log("  night", JSON.stringify(await info(page)));
  await clickEl(page, "[data-walk-hour]");
  await sleep(2500); await page.screenshot({ path: `${OUT}/hour-3-day-again.png` }); log("  day again", JSON.stringify(await info(page)));
  await page.close();
}
if (part.includes("2")) {
  log("== 2. standing in a halo (street, night, by the Toronto door)");
  const page = await openPage(browser, { rooms: "street.html", hour: "night" });
  await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  const a = await arrive(page, 1); log("  arrived", a.arrived, JSON.stringify(await info(page)));
  for (const yaw of [-90, 90]) {
    const g = await aim(page, yaw); await park(page);
    await page.screenshot({ path: `${OUT}/halo-yaw${yaw}-a-centre.png` });
    await page.keyboard.down("w"); await sleep(2500); await page.keyboard.up("w"); await park(page);
    log(`  yaw ${yaw} aimed ${g.aimed}; after walking at the wall:`, JSON.stringify(await info(page)));
    await page.screenshot({ path: `${OUT}/halo-yaw${yaw}-b-at-wall.png` });
    await aim(page, 0); await park(page);
    await page.screenshot({ path: `${OUT}/halo-yaw${yaw}-c-along-wall.png` });
    await arrive(page, 1);
  }
  await page.close();
}
if (part.includes("3")) {
  log("== 3. a phone (390 x 844, touch), street then niagara, night");
  for (const rooms of ["street.html", "rooms-niagara.html"]) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => log("PAGEERROR", e.message));
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("huaxu.walk-hour.v1", "night"); } catch (e) {} });
    await page.goto(`http://127.0.0.1:8080/${rooms}`, { waitUntil: "networkidle0", timeout: 120000 });
    await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 60000 });
    await sleep(1500);
    const n = rooms.replace(".html", "");
    await page.screenshot({ path: `${OUT}/phone-${n}-1-arrive.png` }); log(`  ${rooms} arrive`, JSON.stringify(await info(page)));
    await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
    await sleep(400);
    // look: a touch drag across the picture
    await page.touchscreen.touchStart(300, 300); for (let i = 1; i <= 12; i++) { await page.touchscreen.touchMove(300 - i * 15, 300); await sleep(16); } await page.touchscreen.touchEnd();
    await sleep(900); await page.screenshot({ path: `${OUT}/phone-${n}-2-dragged.png` }); log("   after a 180 px drag", JSON.stringify(await info(page)));
    // walk: the pad
    const pad = await page.evaluate(() => { const e = document.querySelector("[data-walk-pad]"); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.width, q.height, getComputedStyle(e).display]; });
    log("   pad", JSON.stringify(pad));
    if (pad && pad[2] > 0) {
      const cx = pad[0] + pad[2] / 2, cy = pad[1] + pad[3] / 2;
      await page.touchscreen.touchStart(cx, cy); for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(cx, cy - i * 6); await sleep(16); }
      await sleep(2500); await page.touchscreen.touchEnd();
      await sleep(900); await page.screenshot({ path: `${OUT}/phone-${n}-3-walked.png` }); log("   after pushing the pad 2.5 s", JSON.stringify(await info(page)));
    }
    // the hour button by a tap
    const hb = await page.evaluate(() => { const e = document.querySelector("[data-walk-hour]"); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, q.width, q.height]; });
    if (hb) { await page.touchscreen.tap(hb[0], hb[1]); await sleep(2500); await page.screenshot({ path: `${OUT}/phone-${n}-4-day-by-tap.png` }); log("   hour tapped", JSON.stringify(hb), JSON.stringify(await info(page))); }
    await page.close();
  }
}
await browser.close();
