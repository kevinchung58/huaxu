/* What a pattern tile does to the colour it is laid on.
 *
 *   node .verify/_tilemean.mjs [name ...]        (no server, no browser)
 *
 * A world prim's colour reaches the screen as  vertex colour x tile, in linear light, and the tile is
 * an sRGB canvas. So a tile is a multiplier, and its mean is how much of the authored colour is left.
 * This prints, per tile: the sRGB mean a painter thinks in, the LINEAR mean the renderer multiplies
 * by, and the share of the tile under 10% linear (the part that goes to black whatever the colour).
 * It evaluates the page's own patternCanvas (the function is lifted from js/scene3d.js as text), so
 * it cannot drift from what is drawn.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createCanvas } = require("@napi-rs/canvas");
const src = fs.readFileSync(new URL("../js/scene3d.js", import.meta.url), "utf8");
const cut = (from, to) => {
  const a = src.indexOf(from), b = src.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`_tilemean: cannot find ${JSON.stringify(from)} in js/scene3d.js`);
  return src.slice(a, b);
};
const body = cut("function patternCanvas(name) {", "\nfunction makeTexture(");
const seededSrc = cut("function seeded(", "\nfunction ");
globalThis.document = { createElement: () => createCanvas(128, 128) };
const patternCanvas = new Function(`${seededSrc}\n${body}\nreturn patternCanvas;`)();
const names = process.argv.slice(2);
const all = names.length ? names : [...new Set([...body.matchAll(/name === "([a-z0-9]+)"/g)].map((m) => m[1]))];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
console.log("tile        sRGB mean   linear mean   <10% linear");
for (const name of all) {
  const cv = patternCanvas(name);
  const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
  let s = 0, l = 0, dark = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const yl = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
    s += y; l += yl; n++; if (yl < 0.1) dark++;
  }
  console.log(`${name.padEnd(12)}${(s / n).toFixed(1).padStart(8)}${(l / n).toFixed(3).padStart(13)}${(100 * dark / n).toFixed(1).padStart(12)} %`);
}
