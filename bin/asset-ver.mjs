/* asset-ver -- the page's `?v=` token, computed the one way every reader computes it.

   `gen/site.py` derives each page's cache-buster from the bytes of the assets a page loads, so that a
   returning visitor cannot get a current page with a stale renderer. Two gates used to recompute that
   hash from their own hard-coded list, which is the same defect the token exists to prevent, one
   level up: the list moved (the page programme became four files) and the copies went stale, so
   `verify-walk` failed while the pages were right.

   Now the lists live in JSON -- `bin/asset-list.json` for the assets that are not the page programme,
   `bin/site-sources.json` for the programme itself -- and Python, ESM gates and CJS tests all read
   those two files. The order is: the static assets, then the programme, in load order.
*/
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteFiles } from "./site-sources.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/** Every file the token covers, in the order it is hashed. */
export const assetFiles = () =>
  [...JSON.parse(fs.readFileSync(path.join(HERE, "asset-list.json"), "utf8")), ...siteFiles()];

/** The ten hex digits a page must carry in every `?v=`. */
export const assetVer = (root = ROOT) => {
  const h = crypto.createHash("sha1");
  for (const f of assetFiles()) h.update(fs.readFileSync(path.join(root, f)));
  return h.digest("hex").slice(0, 10);
};
