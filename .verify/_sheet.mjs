/* _sheet -- several frames on one sheet, each labelled with its file name, for the route-scale read
   that `skills/scene-quality-loop` §3 asks for before the full-size one. It replaces nothing: a
   thumbnail confirms coverage and order, and a defect is still read on the full frame.
   Run: node .verify/_sheet.mjs OUT.png A.png B.png ...     (COLS=3 by default, cell 512 px wide) */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
const [out, ...files] = process.argv.slice(2);
if (!out || !files.length) { console.error("usage: _sheet.mjs OUT.png A.png B.png ..."); process.exit(2); }
const COLS = Number(process.env.COLS || 3), CW = Number(process.env.CELL || 512);
// a missing frame used to surface as loadImage's "TypeError: Invalid URL", which names no cause
const gone = files.filter((f) => !fs.existsSync(f));
if (gone.length) { console.error(`_sheet: no such frame: ${gone.join(", ")}`); process.exit(2); }
const imgs = await Promise.all(files.map((f) => loadImage(f)));
const CH = Math.round(CW * imgs[0].height / imgs[0].width), LAB = 18;
const rows = Math.ceil(imgs.length / COLS);
const c = createCanvas(COLS * CW, rows * (CH + LAB)), g = c.getContext("2d");
g.fillStyle = "#111"; g.fillRect(0, 0, c.width, c.height);
g.font = "13px sans-serif"; g.textBaseline = "middle";
imgs.forEach((im, i) => {
  const x = (i % COLS) * CW, y = Math.floor(i / COLS) * (CH + LAB);
  g.drawImage(im, x, y + LAB, CW, CH);
  g.fillStyle = "#eee"; g.fillText(path.basename(files[i]), x + 6, y + LAB / 2);
});
fs.writeFileSync(out, c.toBuffer("image/png"));
console.log(`${imgs.length} frames -> ${out} (${c.width}x${c.height})`);
