/* verify-hotel -- the Fallsview hotels keep their windows at the distance a visitor actually sees them.

   P6 item 1 asked for "a near shot of the hotelw towers". Round 69m measured what "near" can be:
   every hotelw tower in Clifton Hill's world sits 281-1014 m from the nearest authored stop (the
   closest, 60 m tall, is 281.9 m from stop 7). A near shot of a 282 m tower cannot exist, so the
   acceptance had to become something measurable, and this is it: on the frame that shows them
   largest, each tower's window bands read as structure rather than as a flat slab.

   The numbers were taken from `.preview/hotel69m/stop7-yaw90-p-6-1024x768.png` (stop 7, yaw 90,
   pitch -6): tower heads at 205x95, 345x150 and 470x230 measure sd 21.6 / 28.0 / 21.3 with 98 / 97 /
   30 distinct colours. A flat slab would be sd < 6 and a handful of colours; the bar is sd >= 12 and
   >= 24 colours, which is a third of what is measured, so a regression (a lost pattern, a lost band,
   a colour that flattens) fails while ordinary variation does not.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-hotel.cjs
*/
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");

const STOP = Number(process.env.STOP || 7);
const YAW = Number(process.env.YAW || 90);
const PITCH = process.env.PITCH === undefined ? -6 : Number(process.env.PITCH);
const MIN_SD = Number(process.env.MIN_SD || 12);
const MIN_COLOURS = Number(process.env.MIN_COLOURS || 24);
const OUT = process.env.OUT || ".preview/hotel-gate";
/* Boxes over the tower heads, in the 1024x768 frame. They are a composition of one view, so the gate
   checks the heading it reached before it trusts them (below).

   Round 70 re-derived them: the picture used to be the model's left-right mirror, and the fix swapped
   the projection's left and right, so every box authored against the old frame now sits on the other
   side of the screen -- on the umbrella and the lamp post, which is why two of the three "failed".
   The tower is the same tower; its mirror about the frame centre is where it paints now
   (1024 - 470 - 70 = 484, 1024 - 345 - 45 = 634). */
const BOXES = [
  { name: "tower A (282 m, 60 m tall)", x: 484, y: 232, w: 58, h: 68 },
  { name: "tower B (306 m, 99 m tall)", x: 634, y: 108, w: 52, h: 240 },
  { name: "tower C (far, 111 m)", x: 726, y: 104, w: 92, h: 212 },
];

(async () => {
  const { launch, openPage, arrive, aim, park, state } = await import("./_aim.mjs");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch({ width: 1024, height: 768 });
  const page = await openPage(browser, { rooms: "rooms-niagara.html", hour: "day" });

  const a = await arrive(page, STOP);
  if (!a.arrived) { console.log(`FAIL  did not arrive at stop ${STOP}: ${a.why}`); process.exit(1); }
  const g = await aim(page, YAW, { pitch: PITCH });
  if (!g.aimed) {
    console.log(`FAIL  heading not reached: asked ${YAW}/${PITCH}, at ${g.yaw.toFixed(1)}/${g.pitch.toFixed(1)}`);
    process.exit(1);
  }
  await park(page);
  const s = await state(page);
  const file = `${OUT}/stop${STOP}-yaw${Math.round(s.yaw)}-p${Math.round(s.pitch)}.png`;
  await page.screenshot({ path: file });
  await browser.close();

  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height), ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;

  let fails = 0;
  for (const b of BOXES) {
    const lum = [], cols = new Set();
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
      const k = (y * img.width + x) * 4;
      lum.push((d[k] * 299 + d[k + 1] * 587 + d[k + 2] * 114) / 1000);
      cols.add(((d[k] >> 3) << 10) | ((d[k + 1] >> 3) << 5) | (d[k + 2] >> 3));
    }
    const n = lum.length, mean = lum.reduce((p, q) => p + q, 0) / n;
    const sd = Math.sqrt(lum.reduce((p, q) => p + (q - mean) ** 2, 0) / n);
    const ok = sd >= MIN_SD && cols.size >= MIN_COLOURS;
    if (!ok) fails++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${b.name.padEnd(26)} sd ${sd.toFixed(1).padStart(5)} (needs >= ${MIN_SD}), ` +
                `${String(cols.size).padStart(3)} colours (needs >= ${MIN_COLOURS})`);
  }
  console.log(`      frame: ${file}`);
  console.log(fails ? `verify-hotel: ${fails} FAIL` : "verify-hotel: every hotelw tower keeps its window bands at the distance it is seen from");
  process.exit(fails ? 1 : 0);
})();
