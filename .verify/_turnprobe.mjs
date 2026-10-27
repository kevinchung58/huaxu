/* _turnprobe -- how far one key tap turns the head, and how far one pixel of drag does.

   Round 71: the owner says left/right turning is too large. That is a number before it is a
   feeling, and this is the number: a tap of D (down and up in one frame) is paid out at the
   lane's turn rate for the press it never got, and a drag sets the heading from distance.

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
await browser.close();
