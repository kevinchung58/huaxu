/* audit-all -- every prop in a room, measured on the view that shows it biggest.

   The previous version pressed an arrow key 13 times to turn 90 degrees and slept 1.7 s after a
   stop click. Round 69i measured what those two moves are worth: a key press turns at least 14.4
   degrees (the lane clamps dt at 0.12 s), and a 1.7 s sleep on a 74 m glide photographs the lane's
   mouth. So its frames were of headings and places nobody asked for -- and its verdict ("three flat
   props in Toronto") was a claim about those frames, not about the scene.

   This version uses `_aim.mjs` for both moves: the body is waited for at the stop's own `--z`, the
   head is dragged to a heading and the heading is read back, and a miss is refused. It then finds,
   for every prop, the view that shows it largest, and measures THAT view over three frames. A prop
   that is never on screen in any tested view is a failure, printed as one, because a measurement
   tool that measures nothing must not report success.

   Status: this is a DIAGNOSTIC, not a gate. It reports every prop and exits 0; `STRICT=1` makes it
   exit 1 on a flat or unseen prop, which is how it should be run once the open list is empty. A
   report must not wear a gate's authority: the three props still flat at round 69k are named in
   TODO.md §3 P6, not hidden behind a green tick.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-toronto.html node .verify/audit-all.mjs
         YAWS='-165,-135,-105,-75,-45,-15,15,45,75,105,135,165' for a finer sweep.
*/
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";
import { launch, openPage, arrive, aim, park, state, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const OUT = process.env.OUT || "";
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const YAWS = (process.env.YAWS || "-150,-105,-60,-15,30,75,120,165").split(",").map(Number);
const MIN_SD = Number(process.env.MIN_SD || 20);
/* The documented acceptance (TODO section 3) judges a prop on the view that shows it LARGEST, and only
   when that view is big enough to judge: 120 x 120 px. Below that a tree 20 m off is a few dozen
   pixels and no honest statistic can be taken from it, so it is reported as "too small to judge"
   rather than as flat. Round 70: the code was judging the MEDIAN view instead, which failed every
   small prop in the room and put twenty of twenty-six on a list of defects. */
const AREA_MIN = Number(process.env.AREA_MIN || 14400);   // 120 x 120 px
const VW = 1024, VH = 768;

const html = fs.readFileSync(ROOMS, "utf8");
const IDS = [...new Set((html.match(/data-obj="[^"]*"/g) || []).map((s) => s.slice(10, -1)))];
const STOPS = [...html.matchAll(/data-walk-stop="(\d+)"/g)].map((m) => Number(m[1]));

const browser = await launch({ width: VW, height: VH });
const page = await openPage(browser, { rooms: ROOMS, hour: "day", width: VW, height: VH });

const boxes = () => page.evaluate((ids) => {
  const out = {};
  for (const id of ids) {
    const el = document.querySelector(`[data-obj="${id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.round(r.left)), y = Math.max(0, Math.round(r.top));
    const w = Math.min(1024, Math.round(r.right)) - x, h = Math.min(768, Math.round(r.bottom)) - y;
    if (w < 6 || h < 6) continue;
    out[id] = { x, y, w, h };
  }
  return out;
}, IDS);

async function shoot() { const f = `/tmp/audit-${Math.random().toString(36).slice(2)}.png`; await page.screenshot({ path: f }); return f; }

async function measure(files, box) {
  const imgs = [];
  for (const f of files) imgs.push(await loadImage(f));
  const px = [];
  for (const im of imgs) {
    const c = createCanvas(box.w, box.h), g = c.getContext("2d");
    g.drawImage(im, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    px.push(g.getImageData(0, 0, box.w, box.h).data);
  }
  const A = px[0];
  let s = 0, s2 = 0, n = 0; const seen = new Set();
  for (let p = 0; p < A.length; p += 4) {
    const l = (A[p] * 299 + A[p + 1] * 587 + A[p + 2] * 114) / 1000;
    s += l; s2 += l * l; n++; seen.add(((A[p] >> 3) << 10) | ((A[p + 1] >> 3) << 5) | (A[p + 2] >> 3));
  }
  const mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  let d = 0, big = 0;
  for (let i = 1; i < px.length; i++) {
    const B = px[i];
    for (let p = 0; p < A.length; p += 4) {
      const v = (Math.abs(A[p] - B[p]) + Math.abs(A[p + 1] - B[p + 1]) + Math.abs(A[p + 2] - B[p + 2])) / 3;
      d += v; if (v > 14) big++;
    }
  }
  d /= (3 * (A.length / 4)); big = 100 * big / (3 * (A.length / 4));
  return { mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10, colours: seen.size,
           motion: Math.round(d * 100) / 100, moved: Math.round(big * 1) / 100 };
}

const best = {};   // id -> the view that shows it largest
const views = {};  // id -> { n, over }: every tested view, and how many clear MIN_SD
/* The stated acceptance is per prop: "at least half of its views with sd > 20". A best view alone
   cannot answer that, so every view a prop appears in is counted, not only the one kept. */
for (const stop of STOPS) {
  const a = await arrive(page, stop);
  if (!a.target) { console.log(`SKIP stop ${stop}: no such stop`); continue; }
  console.log(`STOP ${stop} "${a.target.label}" ${a.arrived ? "arrived" : a.blocked ? "blocked: " + a.why : "MISSED: " + a.why}`);
  if (!a.arrived && !a.blocked) continue;
  for (const yaw of YAWS) {
    const g = await aim(page, yaw, { width: VW, height: VH });
    if (!g.aimed) { console.log(`  yaw ${yaw}: NOT AIMED (${g.off.toFixed(1)} deg)`); continue; }
    await park(page);
    const b = await boxes();
    const files = [];
    for (let i = 0; i < 3; i++) { files.push(await shoot()); if (i < 2) await sleep(600); }
    for (const [id, box] of Object.entries(b)) {
      const area = box.w * box.h;
      const v = (views[id] = views[id] || { n: 0, over: 0, sds: [] });
      v.n++;
      const m = await measure(files, box);
      v.sds.push(m.sd);
      if (m.sd > MIN_SD) v.over++;
      if (!best[id] || area > best[id].area) {
        best[id] = { area, stop, yaw: Math.round(g.yaw), ...m, box };
        if (OUT) fs.copyFileSync(files[0], `${OUT}/${id}-stop${stop}-yaw${Math.round(g.yaw)}.png`);
      }
    }
    for (const f of files) fs.unlinkSync(f);
  }
}

const rows = Object.entries(best).sort((a, b) => a[1].sd - b[1].sd);
console.log(`\n${"prop".padEnd(16)} ${"view".padEnd(10)} ${"px".padStart(7)} ${"mean".padStart(6)} ${"sd".padStart(6)} ${"best".padStart(6)} ${"col".padStart(5)} ${"views>20".padStart(9)}  note`);
for (const [id, r] of rows) {
  const v = views[id];
  const med = [...v.sds].sort((a, b) => a - b)[Math.floor(v.sds.length / 2)];
  console.log(`${id.padEnd(16)} ${`${r.stop}:${r.yaw}`.padEnd(10)} ${String(r.area).padStart(7)} ` +
              `${String(r.mean).padStart(6)} ${String(r.sd).padStart(6)} ${String(Math.round(med * 10) / 10).padStart(6)} ` +
              `${String(r.colours).padStart(5)} ${`${v.over}/${v.n}`.padStart(9)}` +
              `${r.area < AREA_MIN ? "  too small to judge" : ""}`);
}
const missing = IDS.filter((id) => !best[id]);
const flat = rows.filter(([, r]) => r.area >= AREA_MIN && r.sd < MIN_SD).map(([id]) => id);
const small = rows.filter(([, r]) => r.area < AREA_MIN).map(([id]) => id);
console.log(`\nprops ${IDS.length}, measured ${IDS.length - missing.length}, ` +
            `flat (sd<${MIN_SD} on >= ${AREA_MIN} px) ${flat.length}, too small to judge ${small.length}`);
if (missing.length) console.log(`NEVER ON SCREEN: ${missing.join(", ")}`);
if (missing.length || flat.length) {
  const strict = process.env.STRICT === "1";
  console.log(`${strict ? "FAIL" : "REPORT (not a gate)"}: ${flat.length} flat (${flat.join(", ")}), ${missing.length} unseen` +
              (small.length ? `; too small to judge: ${small.join(", ")}` : ""));
  await browser.close();
  process.exit(strict ? 1 : 0);
}
console.log("audit: every prop measured on its largest view");
await browser.close();
