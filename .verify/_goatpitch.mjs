/* _goatpitch -- the Terrapin Point stop at a range of pitches, so the owner can pick one.
   Diagnostic; it changes nothing in the product. For each pitch it records the frame, what the
   centre of the frame is (flat wall vs textured falls), and where the falls' own marker sits.
   Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_goatpitch.mjs */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";
import { launch, openPage, arrive, aim, park, state, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-goat.html";
const STOP = Number(process.env.STOP || 3);
const YAW = Number(process.env.YAW || 88);
const PITCHES = (process.env.PITCHES || "14,8,4,0,-2").split(",").map(Number);
const OUT = ".preview/goat-pitch";
fs.mkdirSync(OUT, { recursive: true });

const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day", reduce: true });
const a = await arrive(page, STOP);
console.log(`stop ${STOP} "${a.target.label}" ${a.arrived ? "arrived" : "MISSED " + a.why}`);
for (const pitch of PITCHES) {
  const g = await aim(page, YAW, { pitch });
  await park(page);
  await sleep(700);
  const file = `${OUT}/pitch${pitch}.png`;
  await page.screenshot({ path: file });
  const s = await state(page);
  const box = await page.evaluate(() => {
    const el = document.querySelector('[data-obj="falls-horseshoe"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
             inFrame: r.right > 0 && r.left < 1024 && r.bottom > 0 && r.top < 768 };
  });
  /* The centre third of the frame: a wall is one flat colour, water and the falls are not. */
  const im = await loadImage(file);
  const c = createCanvas(1024, 768), ctx = c.getContext("2d");
  ctx.drawImage(im, 0, 0);
  const d = ctx.getImageData(341, 256, 342, 256).data;
  let s1 = 0, s2 = 0, n = 0; const seen = new Set();
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    s1 += l; s2 += l * l; n++;
    seen.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4));
  }
  const mean = s1 / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  console.log(`  pitch ${String(pitch).padStart(3)} (got ${s.pitch.toFixed(1)})  centre mean ${mean.toFixed(1)} sd ${sd.toFixed(1)} colours ${seen.size}` +
              `  falls ${box ? `${box.x},${box.y} ${box.w}x${box.h} ${box.inFrame ? "in frame" : "OFF FRAME"}` : "no marker"}`);
}
await browser.close();
