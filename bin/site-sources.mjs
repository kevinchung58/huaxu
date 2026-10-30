/* site-sources -- the parts of the page programme, in the order the page loads them.

   `js/site.js` used to be one 9,501-line file, and every gate that wanted to know something about
   it read that path. Splitting it is therefore not a matter of moving text: 22 gates read the file
   *as text* (markers, tables, anchors) and 6 evaluate it into a page (`w.eval`), so the list has to
   exist once and everything -- the generator, the gates, the tests and the instruments -- has to
   read it from that one place. That is `bin/site-sources.json`: a plain JSON array, so a CommonJS
   test, an ES-module gate and Python can all read it without a build step or a second copy.

   What a split must not change is the programme. Concatenating these files in order is byte-for-byte
   the old single file's behaviour: classic scripts share one global lexical environment, so a
   top-level `let` in `js/overlay.js` is the same binding a later script reads -- the same thing
   `w.eval` does with the joined text, and the same thing a browser does with separate `<script>`
   tags. `.verify/verify-sources.mjs` holds that: the list, the pages, the duplicate-name check and
   a parse of the joined text.

   Run (from a gate):  import { siteFiles, siteText } from "../bin/site-sources.mjs";
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/** The parts, in load order. */
export const siteFiles = () => JSON.parse(fs.readFileSync(path.join(HERE, "site-sources.json"), "utf8"));

/** Every part joined in load order -- the programme the page runs. */
export const siteText = (root = ROOT) =>
  siteFiles().map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n");

/** The path of one part, for a gate that needs to patch a single file in memory. */
export const sitePath = (file, root = ROOT) => path.join(root, file);
