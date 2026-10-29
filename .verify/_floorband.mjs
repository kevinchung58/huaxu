/* _floorband -- how bright is the pavement a visitor actually stands on, per page.

   The Goat Island floor was recorded at 143.7 luma against the record's own 121, and "the floor is
   too bright" is a claim about a rendered frame, not about a colour in a record. This photographs
   the bottom band of the frame (the pavement under the visitor's feet, below any prop's silhouette)
   at each page's first stop and prints mean / sd. Floor styles differ by place, so the number is
   only comparable page to page for the same style -- `FLOOR_PERIOD`'s rule.

   Diagnostic, exit 0. Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_floorband.mjs
*/
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { launch, openPage, arrive, park } from "./_aim.mjs";

const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const browser = await launch({ width: 1024, height: 768 });
for (const file of PAGES) {
  const page = await openPage(browser, { rooms: file, hour: "day", reduce: true });
  const a = await arrive(page, 0);
  await park(page, 900);
  const f = `/tmp/floor-${file}.png`;
  await page.screenshot({ path: f });
  await page.close();
  const im = await loadImage(f);
  const c = createCanvas(1024, 768), g = c.getContext("2d");
  g.drawImage(im, 0, 0);
  /* The pavement band: under the feet, clear of the HUD strip at the very bottom. */
  const d = g.getImageData(160, 700, 704, 34).data;
  let s = 0, s2 = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    s += l; s2 += l * l; n += 1;
  }
  const mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  console.log(`${file.padEnd(20)} stop 0 pavement band  mean ${mean.toFixed(1).padStart(6)}  sd ${sd.toFixed(1).padStart(5)}`);
}
await browser.close();
