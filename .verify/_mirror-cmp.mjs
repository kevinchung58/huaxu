/* _mirror-cmp -- is picture B the exact horizontal mirror of picture A?

   Round 70 flipped the 3D frustum to stop the picture being the model's left-right mirror. The claim
   that followed ("the image is exactly the old one flipped, so nothing else changed") is testable,
   and this is the test: compare A(x) with B(W-1-x) pixel by pixel.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_mirror-cmp.mjs A.png B.png
*/
import { createCanvas, loadImage } from "@napi-rs/canvas";

const [fa, fb] = process.argv.slice(2);
if (!fa || !fb) { console.error("usage: node .verify/_mirror-cmp.mjs A.png B.png"); process.exit(2); }
const A = await loadImage(fa), B = await loadImage(fb);
if (A.width !== B.width || A.height !== B.height) {
  console.log(`FAIL  sizes differ: ${A.width}x${A.height} vs ${B.width}x${B.height}`);
  process.exit(1);
}
const W = A.width, H = A.height;
const ca = createCanvas(W, H), cb = createCanvas(W, H);
ca.getContext("2d").drawImage(A, 0, 0);
cb.getContext("2d").drawImage(B, 0, 0);
const da = ca.getContext("2d").getImageData(0, 0, W, H).data;
const db = cb.getContext("2d").getImageData(0, 0, W, H).data;
let sum = 0, big = 0, n = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const a = (y * W + x) * 4, b = (y * W + (W - 1 - x)) * 4;
  const d = (Math.abs(da[a] - db[b]) + Math.abs(da[a + 1] - db[b + 1]) + Math.abs(da[a + 2] - db[b + 2])) / 3;
  sum += d; if (d > 8) big++; n++;
}
const mean = sum / n, pct = (100 * big) / n;
console.log(`A vs mirrored B: mean |d| ${mean.toFixed(2)} of 255; pixels differing > 8: ${pct.toFixed(2)} %`);
console.log(mean < 2 && pct < 1 ? "MIRROR: the two frames are the same picture, flipped"
                                : "NOT a clean mirror — something other than handedness changed");
