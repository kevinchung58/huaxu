/* _stopprobe2.mjs — does clicking a stop chip glide, and how fast?

   Written in round 72 while `verify-wheel` was failing with "body settled -2693 cm from --z": the
   rail was fine and the machine was loaded (1.5 s frames), which the arrival instrument could not
   tell from a body at rest. This probe prints the raw samples — time, depth, the lane's own frameMs —
   so the next person can see which of the two it is in five seconds.

   Run: LD_LIBRARY_PATH=/tmp/al2023/lib ROOM=rooms-niagara.html STOP=2 node .verify/_stopprobe2.mjs
*/
import { launch, openPage, sleep, state } from "./_aim.mjs";

const ROOM = process.env.ROOM || "rooms-niagara.html";
const STOP = Number(process.env.STOP || 2);
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOM });
await sleep(1500);

const before = await state(page);
const info = await page.evaluate((i) => {
  const chips = document.querySelectorAll("[data-walk-stop]");
  const el = chips[i];
  if (!el) return { missing: true, count: chips.length };
  const r = el.getBoundingClientRect();
  return { count: chips.length, label: el.getAttribute("aria-label"),
           cls: el.className, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
           inert: !!el.closest("[inert]"), disabled: el.disabled };
}, STOP);
console.log("chips:", JSON.stringify(info));
console.log("before:", JSON.stringify({ z: Math.round(before.z), x: Math.round(before.x) }));

await page.evaluate((i) => {
  window.__samples = [];
  const w = document.querySelector("[data-walk]").__walk;
  window.__t0 = performance.now();
  const tick = () => {
    window.__samples.push({ t: Math.round(performance.now() - window.__t0), z: Math.round(w.depth),
                            frameMs: Math.round(w.frameMs || 0) });
    if (window.__samples.length < 24) setTimeout(tick, 200);
  };
  setTimeout(tick, 60);
  document.querySelectorAll("[data-walk-stop]")[i].click();
}, STOP);
await sleep(1200);
const mid = await state(page);
await sleep(Number(process.env.WAIT || 4000));
const after = await state(page);
console.log("after 1.2 s:", JSON.stringify({ z: Math.round(mid.z), x: Math.round(mid.x) }));
console.log("after the wait:", JSON.stringify({ z: Math.round(after.z), x: Math.round(after.x) }));
console.log("samples:", JSON.stringify(await page.evaluate(() => window.__samples)));
console.log(JSON.stringify(await page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  return { gliding: w ? !!w.gliding : null, keys: ["w", "a", "s", "d"].filter(() => false),
           status: document.querySelector("[data-walk-status]")?.textContent?.trim() || "",
           card: !document.querySelector("[data-walk-card]").hidden,
           plate: document.getElementById("room-plate")?.className || "" };
})));
await browser.close();
