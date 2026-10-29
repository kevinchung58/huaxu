/* verify-mirror -- what the visitor SEES is what answers when they tap it.

   Round 70 found the picture was the model's left-right mirror: every `[data-obj]` hit rectangle
   satisfied `x_rect = W - x_paint`, so the boxes, the reach test (what pressing E opens) and the
   `_map` tool's left and right were all on the opposite side of the scene from the thing they
   named. The cause was the camera -- Three's `lookAt` with up = +Y looking down +Z has a right axis
   of -X, while the lane's own painter puts +X on the right of the screen -- and the fix swaps the
   projection's left and right (js/site.js cannot; js/scene3d.js `makePerspective`).

   This gate is the property a visitor would test and a screenshot cannot: **tap the thing you are
   looking at, and get that thing.** The tap point is a measured constant, not a guess: `_mark.mjs`
   drew `skyline-cn`'s own rectangle on the frame and the towers sit inside it (frame
   `.preview/mirror-gate/stop4-yaw30.png`; towers x 163-466, y 165-660, box [163,172,305,566]).
   380,400 is on a gold tower. Its mirror at 644 answers with the streetcar -- which is exactly the
   failure this gate was written for: before the flip, 380 was wall and 644 was the towers.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-mirror.mjs
*/
import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { launch, openPage, arrive, aim, park } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const STOP = Number(process.env.STOP || 4);
const YAW = Number(process.env.YAW || 30);
const IDS = process.env.IDS || "skyline-cn";
const OUT = process.env.OUT || ".preview/mirror-gate";

fs.mkdirSync(OUT, { recursive: true });
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: "day" });
const a = await arrive(page, STOP);
if (!a.target) { console.log(`FAIL  stop ${STOP} does not exist in ${ROOMS}`); process.exit(1); }
if (!a.arrived) { console.log(`FAIL  did not arrive at stop ${STOP}: ${a.why}`); process.exit(1); }
const g = await aim(page, YAW);
if (!g.aimed) { console.log(`FAIL  heading not reached: ${YAW} vs ${g.yaw.toFixed(1)}`); process.exit(1); }
await park(page);
await page.screenshot({ path: `${OUT}/stop${STOP}-yaw${Math.round(g.yaw)}.png` });

/* Where the prop is PAINTED, found without knowing its colour exactly.

   The towers are the only warm objects in that direction (cream, gold, red granite: r - b from +15 to
   +100), and the hall's wall behind them is blue-grey (r - b about -10), the floor green. So the
   largest connected cluster of "warmer than the wall" pixels in the frame is the towers, and its
   centroid is where the picture puts them. Tapping cannot answer this question -- a tap hits the hit
   box wherever the box is, which is exactly the thing under test -- so this reads the paint. */
const img = await loadImage(`${OUT}/stop${STOP}-yaw${Math.round(g.yaw)}.png`);
const W = img.width, H = img.height;
const canvas = createCanvas(W, H), ictx = canvas.getContext("2d");
ictx.drawImage(img, 0, 0);
const px = ictx.getImageData(0, 0, W, H).data;
const warm = new Uint8Array(W * H);
for (let p = 0, i = 0; i < px.length; i += 4, p++) {
  if (px[i] - px[i + 2] > 8 && (px[i] + px[i + 1] + px[i + 2]) / 3 > 60) warm[p] = 1;
}
// Largest connected cluster (4-way, over every pixel; the floor overlay excludes the HUD's corners).
const seen = new Uint8Array(W * H);
let best = null;
const stack = [];
for (let p = 0; p < W * H; p++) {
  if (seen[p] || !warm[p]) continue;
  let n = 0, sx = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
  stack.push(p); seen[p] = 1;
  while (stack.length) {
    const q = stack.pop(), qx = q % W, qy = (q - qx) / W;
    n++; sx += qx;
    if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = qx + dx, ny = qy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const r = ny * W + nx;
      if (seen[r] || !warm[r]) continue;
      seen[r] = 1; stack.push(r);
    }
  }
  if (!best || n > best.n) best = { n, cx: sx / n, x0, x1, y0, y1 };
}
if (!best || best.n < 2000) { console.log(`FAIL  nothing warm on screen to locate the towers (${best ? best.n : 0} px)`); process.exit(1); }

const rect = await page.evaluate((id) => {
  const el = document.querySelector(`[data-obj="${id}"]`);
  if (!el || el.style.visibility === "hidden") return null;
  const q = el.getBoundingClientRect();
  return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)];
}, IDS);
await browser.close();
if (!rect) { console.log(`FAIL  ${IDS} has no hit box at this heading -- it would be untappable`); process.exit(1); }

/* Share of the paint that the box covers, and share its mirror covers. A box that names the towers
   holds most of the towers; a box on the other side of the frame holds none of them. */
const inRect = (x, y, [rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh;
const mirror = [W - rect[0] - rect[2], rect[1], rect[2], rect[3]];
let insideBox = 0, insideMirror = 0, total = 0;
for (let p = 0, i = 0; i < px.length; i += 4, p++) {
  if (!warm[p]) continue;
  const x = p % W, y = (p - x) / W;
  total++;
  if (inRect(x, y, rect)) insideBox++;
  if (inRect(x, y, mirror)) insideMirror++;
}
const shareBox = insideBox / Math.max(1, total), shareMirror = insideMirror / Math.max(1, total);
const ok = shareBox >= 0.7 && shareBox > shareMirror * 2;
console.log(`  paint: ${best.n} px, x ${best.x0}-${best.x1}, y ${best.y0}-${best.y1}`);
console.log(`  hit box: ${rect.join(",")}; its mirror: ${mirror.join(",")}`);
console.log(`${ok ? "PASS" : "FAIL"}  the box covers ${(100 * shareBox).toFixed(0)} % of the paint; ` +
            `the mirrored box covers ${(100 * shareMirror).toFixed(0)} % (needs >= 70 % and twice the mirror)`);
if (!ok && shareMirror > shareBox) console.log("      <- the picture is mirrored: js/scene3d.js makePerspective must swap left and right");
console.log(ok ? "verify-mirror: the thing you see is the thing that answers"
                : "verify-mirror: the thing you see is NOT the thing that answers");
process.exit(ok ? 0 : 1);
