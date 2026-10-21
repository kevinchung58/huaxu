/* One lane frame, re-saved as a JPEG cover sheet for the album's place card.

   USAGE  (the browser is the only picture this site has; round 54 retired the canvas harness)
     node .verify/_walkshot.mjs journey-frame 20            # PAGE=rooms-journey.html env selects the room
     node .verify/make-cover.mjs journey-frame IMG/journey-cover.jpg

   The cover is a generated frame of the walkable district, the same pixels the real renderer
   paints, held as a JPEG where the album reads it. It is never a photograph of the real place:
   the IMG rule for the card's prefix says "generated", and the card's caption says drawn. */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const [pick, out] = process.argv.slice(2);
if (!pick || !out) {
  console.error("usage: node .verify/make-cover.mjs <frame-file-or-index> <out.jpg>   (frames in /tmp/lane)");
  process.exit(2);
}
const dir = ".preview/day";
const file = pick.endsWith(".png") ? pick : `${pick}.png`;
const src = fs.existsSync(path.join(dir, file)) ? file : null;
if (!src) { console.error(`no frame ${file} in ${dir} — capture one with .verify/_walkshot.mjs first`); process.exit(2); }
const img = await loadImage(path.join(dir, src));
const cv = createCanvas(img.width, img.height);
cv.getContext("2d").drawImage(img, 0, 0);
fs.writeFileSync(out, cv.toBuffer("image/jpeg", 82));
console.log(`cover ${out} <- ${src}`);
