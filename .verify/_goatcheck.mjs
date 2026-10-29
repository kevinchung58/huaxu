/* the shipped Terrapin Point stop: is the body legal there, and is the falls in frame + pressable? */
import { launch, openPage, arrive, park, state } from "./_aim.mjs";
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: "rooms-goat.html", hour: "day", reduce: true });
const a = await arrive(page, 3);
await park(page);
const r = await page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  const el = document.querySelector('[data-obj="falls-horseshoe"]');
  const b = el.getBoundingClientRect();
  const cx = Math.round(b.left + b.width / 2), cy = Math.round(b.top + b.height / 2);
  const at = document.elementFromPoint(cx, cy);
  return { x: Math.round(w.x), z: Math.round(w.depth), yaw: +w.yaw.toFixed(1), pitch: +w.pitch.toFixed(1),
           blockedAtSelf: w.blockedAt(w.x, w.depth),
           box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
           inFrame: b.left >= 0 && b.right <= 1024 && b.top >= 0 && b.bottom <= 768,
           pressed: at ? (at.closest("[data-obj]") || {}).dataset?.obj || at.className : null };
});
console.log(`arrived ${a.arrived ? "yes" : "NO: " + a.why}  at x ${r.x} z ${r.z} yaw ${r.yaw} pitch ${r.pitch}` +
            `  inside a solid: ${r.blockedAtSelf}`);
console.log(`falls marker ${r.box.join(",")} inFrame ${r.inFrame}  press at its centre reaches ${r.pressed}`);
await browser.close();
