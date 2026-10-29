/* _stopshot -- the frame a visitor gets by pressing one stop, with no aiming by the instrument.
   Run: FILE=rooms-goat.html STOP=3 OUT=.preview/goat-pitch/shipped.png node .verify/_stopshot.mjs */
import { launch, openPage, arrive, park, state } from "./_aim.mjs";
const FILE = process.env.FILE || "rooms-goat.html";
const STOP = Number(process.env.STOP || 3);
const OUT = process.env.OUT || "/tmp/stop.png";
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: FILE, hour: "day", reduce: true });
const a = await arrive(page, STOP);
await park(page, 1200);
await page.screenshot({ path: OUT });
const s = await state(page);
console.log(`${FILE} stop ${STOP} "${a.target.label}" ${a.arrived ? "arrived" : "MISSED"} ` +
            `yaw ${s.yaw.toFixed(1)} pitch ${s.pitch.toFixed(1)} -> ${OUT}`);
await browser.close();
