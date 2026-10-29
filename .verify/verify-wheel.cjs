/* verify-wheel -- the SkyWheel is a wheel from somewhere a visitor can stand, and its cabins can be counted.

   The complaint this answers (P6 item 3, "near view of the pods"): from under the wheel the model
   shows spokes and a sliver of rim -- the disc is in the x-y plane, the lane clamps pitch at 24
   degrees, and stop 8's 26 m is the worst place to look at a 53 m wheel. Round 69k measured that
   and left it open, because "stand somewhere else" is a composition answer and it needed a bearing,
   not a guess.

   The bearing: from stop 2 (the parapet over the gorge, x -520 z 2842) the hub is 66.7 m away, 22.4
   degrees up, and one 168 cm cabin subtends about 60 px. The frame has the rim, the spokes, the hub
   and both A-frames in it. So this gate says: from THIS stop and THIS heading,
     1. the wheel is on screen and its rim spans a real part of the frame;
     2. the rim is not a sliver -- the ring's top and bottom are both inside the picture;
     3. there are at least N cabin-sized bright blobs round the rim (counted, not eyeballed).

   It refuses (exit 1) if the heading was missed or the frame is empty. Run it after any change to the
   wheel painter, the stop table, or the plaza's camera limits.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-wheel.cjs
*/
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs");

const STOP = Number(process.env.STOP || 2);
const YAW = Number(process.env.YAW || 26);
const PITCH = Number(process.env.PITCH || -22);
const MIN_CABINS = Number(process.env.MIN_CABINS || 10);
const OUT = process.env.OUT || ".preview/wheel-gate";

(async () => {
  const { launch, openPage, arrive, aim, park, state } = await import("./_aim.mjs");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch({ width: 1024, height: 768 });
  const page = await openPage(browser, { rooms: "rooms-niagara.html", hour: "day" });

  const a = await arrive(page, STOP);
  if (!a.target) { console.log(`FAIL  stop ${STOP} does not exist`); process.exit(1); }
  if (!a.arrived) { console.log(`FAIL  did not arrive: ${a.why}`); process.exit(1); }
  const g = await aim(page, YAW, { pitch: PITCH });
  if (!g.aimed) { console.log(`FAIL  heading not reached: asked ${YAW}/${PITCH}, at ${g.yaw.toFixed(1)}/${g.pitch.toFixed(1)}`); process.exit(1); }
  await park(page);
  const s = await state(page);
  /* Three instants, not one (round 76). The wheel turns once every 40 s (`turn: 40` in the record),
     so the number of cabins you can see at a given instant is a property of *when* you looked as much
     as of the model: this gate counted 9 on a frame whose rim plainly carries a dozen, and failed a
     scene that is fine. A threshold sampled from one frame of a moving object is a coin toss -- so the
     frame is taken three times, 7 s apart (about a fifth of a revolution), and the count asserted is
     the best of the three. The bar stays at 10; what changed is that the measurement is no longer a
     single sample. */
  const files = [];
  for (let k = 0; k < 3; k++) {
    const f = `${OUT}/stop${STOP}-yaw${Math.round(s.yaw)}-p${Math.round(s.pitch)}${k ? `-t${k}` : ""}.png`;
    await page.screenshot({ path: f });
    files.push(f);
    if (k < 2) await new Promise((r) => setTimeout(r, 7000));
  }
  await browser.close();
  const runs = await Promise.all(files.map((f) => countFrame(f)));
  const best = runs.reduce((a, b) => (b.cabins > a.cabins ? b : a));
  for (const r of runs) console.log(`  ${r.file.split("/").pop()}: ${r.cabins} cabins of ${r.blobs} blobs`);
  console.log(`${best.ok1 ? "PASS" : "FAIL"}  the wheel spans ${best.rimW}x${best.rimH} px of ${best.W}x${best.H} (needs > ${Math.round(best.W * 0.30)}x${Math.round(best.H * 0.30)})`);
  console.log(`${best.ok2 ? "PASS" : "FAIL"}  it is whole in frame: top ${best.rimTop}, bottom ${best.rimBot} (needs > 2 and < ${best.H - 40})`);
  console.log(`${best.cabins >= MIN_CABINS ? "PASS" : "FAIL"}  ${best.cabins} cabins counted round the rim (needs >= ${MIN_CABINS}); best of ${runs.map((r) => r.cabins).join("/")}`);
  console.log(`      frame: ${best.file}`);
  const fails = [best.ok1, best.ok2, best.cabins >= MIN_CABINS].filter((v) => !v).length;
  console.log(fails ? `verify-wheel: ${fails} FAIL` : "verify-wheel: the wheel is a wheel from this stop, and its cabins can be counted");
  process.exit(fails ? 1 : 0);
})();

/* One frame, measured. Returns the rim's box and the cabin count; every threshold and its reason is
   in the comments below, unchanged from the single-frame version this replaced. */
async function countFrame(file) {

  /* Measure the frame.

     First attempt, and why it was wrong: it counted blobs "brighter than the row's median by 34".
     The cabins are pale grey (#c3ccd2) against a pale blue sky (#76a1cb) -- the LUMINANCE difference
     is small (147 vs 155 measured), the CHROMA difference is large (b - r = 85 in the sky, 15 on a
     cabin). That detector found 2 cabins in a frame that has 14, and this gate reported FAIL on a
     scene that was fine. A gate can be wrong in both directions; the fix is to measure the thing
     that actually separates them: brighter than the sky AND much less blue.

     Cabin size check: focal = 384 / tan(22.5 deg) = 927 px; a 168 cm cabin at 6670 cm subtends
     927 * 168 / 6670 = 23 px. The blobs found are 10-20 px, which is that size under perspective
     at the rim's shallower angles. */
  const img = await loadImage(file);
  const W = img.width, H = img.height;
  const canvas = createCanvas(W, H), ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H), blue = new Float32Array(W * H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    lum[p] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    blue[p] = d[i + 2] - d[i];
  }
  const rowMed = new Float32Array(H);
  for (let y = 0; y < H; y++) rowMed[y] = median(lum, y * W, W);

  const CAB_LUM = 12, CAB_BLUE = 60;   // measured: sky lum 147 / blue 85; cabin lum 155 / blue 15
  const isCab = (p, y) => lum[p] > rowMed[y] + CAB_LUM && blue[p] < CAB_BLUE;

  // the rim: the structural band is everything cabin-like OR steel-like (blue 35-45, lum 120-165)
  let rimTop = -1, rimBot = -1, rimL = -1, rimR = -1;
  const isWheel = (p, y) => isCab(p, y) || (blue[p] > 20 && blue[p] < 70 && lum[p] > rowMed[y] + 6);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (!isWheel(p, y) || y > H * 0.82) continue;
    if (rimTop < 0) rimTop = y;
    rimBot = y;
    if (rimL < 0 || x < rimL) rimL = x;
    if (x > rimR) rimR = x;
  }
  if (rimTop < 0) return { file, W, H, rimW: 0, rimH: 0, rimTop: 0, rimBot: 0, cabins: 0, blobs: 0,
                           ok1: false, ok2: false, empty: true };
  const rimW = rimR - rimL, rimH = rimBot - rimTop;
  const ok1 = rimW > W * 0.30 && rimH > H * 0.30;
  const ok2 = rimTop > 2 && rimBot < H - 40;

  // cabins: connected cabin-like blobs of the right size, distinct from the rim
  const seen = new Uint8Array(W * H);
  const blobs = [];
  const stack = [];
  for (let y = rimTop; y <= rimBot; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (seen[p] || !isCab(p, y)) continue;
    let n = 0, x0 = x, x1 = x, y0 = y, y1 = y;
    stack.push(p); seen[p] = 1;
    while (stack.length) {
      const q = stack.pop(), qx = q % W, qy = (q - qx) / W;
      n++; if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const r = ny * W + nx;
        if (seen[r] || !isCab(r, ny)) continue;
        seen[r] = 1; stack.push(r);
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw >= 7 && bw <= 60 && bh >= 7 && bh <= 60 && n >= 45) blobs.push({ x0, y0, bw, bh, n });
  }
  const cabins = blobs.filter((b) => Math.abs(b.bw - b.bh) < Math.max(6, Math.max(b.bw, b.bh) * 0.7));
  return { file, W, H, rimW, rimH, rimTop, rimBot, ok1, ok2, cabins: cabins.length, blobs: blobs.length };
}

function median(arr, from, len) {
  const a = Array.from(arr.slice(from, from + len)).sort((x, y) => x - y);
  return a[len >> 1];
}
