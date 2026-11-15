/* verify-hour -- one hour is one picture, however the visitor got to it.

   The hour is the visitor's and it is stored, so there are two ways to be standing in a night: press
   the sun/moon button on a page that opened by day, or open a page with the night already chosen
   (every reload and every next page once it is stored). Until this gate existed those were two
   different pictures: the sky's light -- its PMREM and the hemisphere's two colours -- was made once
   from the hour at boot, and the button repainted the dome only. Measured at Niagara stop 6, the
   same `clock: night` gave pale lavender facades one way and flat navy the other, and "day" after a
   night boot was a daylit sky over near-black buildings. The lane's state reports the same hour for
   both, so nothing that reads state can see it; this reads the frame.

   For each page:  boot by day -> D0, press the button -> N1;  boot at night -> N0, press -> D1.
   N1 must be N0 and D1 must be D0. The frame is cut into a 12 x 9 grid and each cell's mean colour is
   compared. A different light moves EVERY cell (before the fix: mean 91.8 by night and 188.5 by day,
   summed over R, G and B); a thing that moves between two boots moves a few (after it: mean 1.3 and
   1.0, with one cell at 20.4 where the wheel's bunting had turned -- reduced motion stills the sway,
   not the wheel's clock). So the verdict is the mean and the number of cells that are far apart,
   never the single worst cell.

     sh bin/gate node .verify/verify-hour.mjs
   The default is the six pages that have the button (Nakamise and the CN Tower hold one hour and are
   skipped out loud if named). Before the fix Niagara, the street and Goat Island failed; Mojiko
   passed at stop 1.

     PAGES=rooms-niagara.html:6,street.html:1  [BASE=http://127.0.0.1:8081]  [OUT=.preview/hour]  [MEAN=4] [FAR=24] [CELLS=8]
*/
import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { launch, openPage, arrive, park, sleep } from "./_aim.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const OUT = process.env.OUT || ".preview/hour";
// Distances are |dR|+|dG|+|dB| between two cells' mean colours.
const MEAN = Number(process.env.MEAN || 4);      // the whole frame's mean distance
const FAR = Number(process.env.FAR || 24);       // a cell this far apart is "a different cell"...
const CELLS = Number(process.env.CELLS || 8);    // ...and at most this many of the 108 may be
const PAGES = (process.env.PAGES || "rooms-niagara.html:6,street.html:1,rooms-fukuoka.html:1,rooms-toronto.html:1,rooms-goat.html:1,rooms-journey.html:1")
  .split(",").map((s) => { const [file, stop] = s.split(":"); return { file, stop: Number(stop || 0) }; });
const GX = 12, GY = 9;
fs.mkdirSync(OUT, { recursive: true });

const cells = async (png) => {
  const img = await loadImage(png);
  const c = createCanvas(img.width, img.height).getContext("2d");
  c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, img.width, img.height).data;
  const out = [];
  for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
    const x0 = Math.floor(gx * img.width / GX), x1 = Math.floor((gx + 1) * img.width / GX);
    const y0 = Math.floor(gy * img.height / GY), y1 = Math.floor((gy + 1) * img.height / GY);
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * img.width + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    out.push([r / n, g / n, b / n]);
  }
  return out;
};
const apart = (a, b) => {
  let worst = 0, sum = 0, at = 0, far = 0;
  a.forEach((p, i) => { const v = Math.abs(p[0] - b[i][0]) + Math.abs(p[1] - b[i][1]) + Math.abs(p[2] - b[i][2]); sum += v; if (v > FAR) far++; if (v > worst) { worst = v; at = i; } });
  const mean = sum / a.length;
  return { worst, mean, far, same: mean <= MEAN && far <= CELLS,
           text: `mean ${mean.toFixed(1)} (limit ${MEAN}), ${far} of ${a.length} cells over ${FAR} (limit ${CELLS}), worst ${worst.toFixed(1)} at ${at % GX},${Math.floor(at / GX)}` };
};
const press = async (page) => {
  const r = await page.evaluate(() => { const q = document.querySelector("[data-walk-hour]")?.getBoundingClientRect(); return q ? [q.left + q.width / 2, q.top + q.height / 2] : null; });
  if (!r) return false;
  await page.mouse.click(r[0], r[1]);
  await sleep(2500);
  return true;
};
const clock = (page) => page.evaluate(() => document.querySelector("[data-walk]").dataset.walkClock || "");
const stand = async (browser, file, stop, hour) => {
  const page = await openPage(browser, { rooms: file, hour, base: BASE, reduce: true });
  await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  if (stop) { const a = await arrive(page, stop); if (!a.arrived) console.log(`  (${file} stop ${stop}: short by ${Math.round(a.short || 0)} cm; both boots stand at the same place)`); }
  await park(page, 1500);
  return page;
};

const browser = await launch({ width: 1024, height: 768 });
let pass = 0, fail = 0;
const ok = (good, text) => { console.log(`${good ? "PASS" : "FAIL"}  ${text}`); if (good) pass++; else fail++; };
for (const { file, stop } of PAGES) {
  const n = `${file.replace(".html", "")}-s${stop}`;
  const f = (k) => `${OUT}/${n}-${k}.png`;
  let page = await stand(browser, file, stop, "day");
  await page.screenshot({ path: f("D0-booted-day") });
  if (!(await press(page))) { console.log(`skip  ${file}: no hour button (a held hour has one picture by construction)`); await page.close(); continue; }
  const c1 = await clock(page);
  await page.screenshot({ path: f("N1-pressed-to-night") });
  await page.close();
  page = await stand(browser, file, stop, "night");
  const c0 = await clock(page);
  await page.screenshot({ path: f("N0-booted-night") });
  await press(page);
  await page.screenshot({ path: f("D1-pressed-to-day") });
  await page.close();
  ok(c1 === "night" && c0 === "night", `${n}: both ways report night (pressed "${c1}", booted "${c0}")`);
  const [D0, N1, N0, D1] = await Promise.all(["D0-booted-day", "N1-pressed-to-night", "N0-booted-night", "D1-pressed-to-day"].map((k) => cells(f(k))));
  const night = apart(N1, N0), day = apart(D1, D0), hours = apart(D0, N0);
  ok(night.same, `${n}: night pressed = night booted   ${night.text}`);
  ok(day.same, `${n}: day pressed = day booted       ${day.text}`);
  ok(hours.mean > 6 * MEAN, `${n}: day and night are different pictures (mean ${hours.mean.toFixed(1)}), so the two rows above can fail`);
}
await browser.close();
console.log(`\nverify-hour: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
