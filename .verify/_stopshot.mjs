/* _stopshot -- the frame a visitor gets by pressing one stop, with no aiming by the instrument.
   Run: FILE=rooms-goat.html STOP=3 OUT=.preview/goat-pitch/shipped.png node .verify/_stopshot.mjs
        HOUR=night (default day) shoots the same stop after dark; STOP=0,3,6 shoots several in one
        browser, writing OUT with the stop number before its extension.
        BASE=http://127.0.0.1:8081 shoots another tree served on another port -- the "before" of a
        before/after pair without stashing the work (`git worktree add /tmp/base <commit>`, then
        `python3 -m http.server 8081 --bind 127.0.0.1` inside it). */
import { launch, openPage, arrive, park, state } from "./_aim.mjs";
const FILE = process.env.FILE || "rooms-goat.html";
const STOPS = String(process.env.STOP || 3).split(",").map(Number);
const OUT = process.env.OUT || "/tmp/stop.png";
const HOUR = process.env.HOUR || "day";
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: FILE, hour: HOUR, reduce: true,
                                       ...(process.env.BASE ? { base: process.env.BASE } : {}) });
for (const STOP of STOPS) {
  const out = STOPS.length > 1 ? OUT.replace(/(\.\w+)$/, `-${STOP}$1`) : OUT;
  const a = await arrive(page, STOP);
  await park(page, 1200);
  await page.screenshot({ path: out });
  const s = await state(page);
  console.log(`${FILE} ${HOUR} stop ${STOP} "${a.target.label}" ${a.arrived ? "arrived" : "MISSED"} ` +
              `yaw ${s.yaw.toFixed(1)} pitch ${s.pitch.toFixed(1)} -> ${out}`);
}
await browser.close();
