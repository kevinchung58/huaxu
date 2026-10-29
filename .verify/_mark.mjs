/* _mark -- draw one rectangle on a frame, so a projected box can be held against the paint.

   Round 70's finding: the `[data-obj]` rectangle for `skyline-cn` sits on bare wall, 32 degrees
   from the towers it names. A number taken over that rectangle measures the wall. This draws the
   rectangle so the mistake is visible before it is quoted.

   Run:  node .verify/_mark.mjs SRC DST X Y W H [LABEL]     (a red 4 px outline + one label line)
*/
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";

const [src, dst, ...rest] = process.argv.slice(2);
const nums = rest.map(Number);
if (!src || !dst || nums.length < 4 || nums.slice(0, 4).some((v) => !Number.isFinite(v))) {
  console.error("usage: node .verify/_mark.mjs SRC DST X Y W H [LABEL]");
  process.exit(2);
}
const [x, y, w, h] = nums;
const label = rest.length > 4 ? rest.slice(4).join(" ") : "";
const im = await loadImage(src);
const c = createCanvas(im.width, im.height), g = c.getContext("2d");
g.drawImage(im, 0, 0);
g.strokeStyle = "#ff2d55"; g.lineWidth = 4;
g.strokeRect(x + 2, y + 2, w - 4, h - 4);
if (label) {
  g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(x + 2, y + 2, Math.min(w - 4, 8 + label.length * 13), 32);
  g.fillStyle = "#ff2d55"; g.font = "bold 22px sans-serif";
  g.fillText(label, x + 10, y + 27);
}
fs.writeFileSync(dst, c.toBuffer("image/png"));
console.log(`wrote ${dst} — ${w}x${h} at ${x},${y}${label ? ` "${label}"` : ""}`);
