/* _abdiff -- two frames side by side: where do they differ, and by how much?

   Built to answer "did this refactor change the picture?" and it immediately answered a question
   about the instrument instead. Same build, same stop, same heading, two browser launches: the
   frames differ on a few thousand pixels by ONE unit per channel. Same build and same launch:
   identical. A build one refactor old: 4,249 pixels differ at ±1, 331 at ≥2, 109 at ≥6, 4 at ≥20 --
   i.e. *below* the same-build noise floor of a cross-origin pair (347,294 / 147,475 / 13,434 / 89).

   So this tool reports the distribution, not a pass. Bit-exact frames are not a criterion this
   rasteriser can support; `_scenehash.mjs` is what compares two builds exactly (the quads the lane
   hands the renderer, the camera, the counters). Use this one to look at a difference, and that one
   to decide whether there is one.

   Run:  node .verify/_abdiff.mjs A.png B.png        (writes /tmp/ab-diff.png)
*/
import { createCanvas, loadImage } from "@napi-rs/canvas";
const [fa, fb] = [process.argv[2] || "/tmp/ab-after.png", process.argv[3] || "/tmp/ab-before.png"];
const [a, b] = await Promise.all([loadImage(fa), loadImage(fb)]);
const ca = createCanvas(a.width, a.height), cg = ca.getContext("2d"); cg.drawImage(a, 0, 0);
const cb = createCanvas(b.width, b.height), bg = cb.getContext("2d"); bg.drawImage(b, 0, 0);
const da = cg.getImageData(0, 0, a.width, a.height).data, db = bg.getImageData(0, 0, b.width, b.height).data;
let diff = 0, bx0 = 1e9, bx1 = -1, by0 = 1e9, by1 = -1;
const out = createCanvas(a.width, a.height), og = out.getContext("2d");
const img = og.createImageData(a.width, a.height);
const hist = new Map();
for (let i = 0, p = 0; i < da.length; i += 4, p++) {
  const d = Math.abs(da[i] - db[i]) + Math.abs(da[i+1] - db[i+1]) + Math.abs(da[i+2] - db[i+2]);
  if (d) {
    diff++;
    const x = p % a.width, y = (p / a.width) | 0;
    bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
    const k = `${da[i]},${da[i+1]},${da[i+2]} → ${db[i]},${db[i+1]},${db[i+2]}`;
    hist.set(k, (hist.get(k) || 0) + 1);
    img.data[i] = 255; img.data[i+1] = d > 20 ? 0 : 255; img.data[i+2] = 0; img.data[i+3] = 255;
  } else { img.data[i] = da[i]; img.data[i+1] = da[i+1]; img.data[i+2] = da[i+2]; img.data[i+3] = 40; }
}
og.putImageData(img, 0, 0);
const fs = await import("node:fs");
fs.writeFileSync("/tmp/ab-diff.png", out.toBuffer("image/png"));
console.log(`${diff} pixels differ, box x ${bx0}..${bx1} y ${by0}..${by1}`);
console.log([...hist].sort((p, q) => q[1] - p[1]).slice(0, 6).map(([k, n]) => `  ${n}x ${k}`).join("\n"));
/* The thresholds, so a number can be compared with the noise floor instead of admired on its own. */
const c = { 1: 0, 2: 0, 6: 0, 20: 0 };
for (let i = 0; i < da.length; i += 4) {
  const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
  for (const t of [1, 2, 6, 20]) if (d >= t) c[t]++;
}
console.log(`  ≥1 ${c[1]}  ≥2 ${c[2]}  ≥6 ${c[6]}  ≥20 ${c[20]}  of ${da.length / 4} px   mask /tmp/ab-diff.png`);
