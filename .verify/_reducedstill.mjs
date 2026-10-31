/* reduced motion must still be a still picture: the moving tiles are skipped when the visitor asked
   for less motion (js/scene3d.js reads prefers-reduced-motion once, at boot). */
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: "rooms-goat.html", hour: "day", reduce: true });
await arrive(page, 3); await aim(page, 88, { pitch: -2 }); await park(page);
const a = (await page.screenshot()).toString("base64");
await sleep(1200);
const b = (await page.screenshot()).toString("base64");
console.log(`reduced motion: two frames 1.2 s apart are ${a === b ? "IDENTICAL" : "different"}`);
await browser.close();
