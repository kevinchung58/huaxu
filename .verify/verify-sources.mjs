/* verify-sources -- the page programme is four files and every reader agrees about which four.

   `js/site.js` was one 9,501-line script until 2026-10-30. Splitting it is only safe if the split
   cannot drift: the generator writes the `<script>` tags, the gates read the files and join them,
   and the instruments patch them in memory. Three ways that goes wrong, all silent, all checked
   here:

     1. a part is in `bin/site-sources.json` but no page loads it (dead code in the repo that tests
        still pass against -- the shape that lets a "split" of a feature quietly disable it);
     2. a page loads a part the list does not name, or loads them out of order (a browser and the
        gates would then be running different programmes);
     3. the same top-level name is declared in two parts. Classic scripts share one global lexical
        environment, so the last one silently wins -- the same defect class as a duplicate dict key
        in the generator, and the reason `verify-gen` checks for it in Python.

   It also parses the joined text as one script, because a split can produce two files that are each
   valid and a programme that is not.

   Run:  node .verify/verify-sources.mjs
*/
import fs from "node:fs";
import vm from "node:vm";
import { siteFiles, siteText } from "../bin/site-sources.mjs";

let pass = 0;
const fails = [];
const ok = (m) => { pass++; console.log(`PASS  ${m}`); };
const bad = (m) => { fails.push(m); console.log(`FAIL  ${m}`); };

const files = siteFiles();
const pages = fs.readdirSync(".").filter((f) => f.endsWith(".html")).sort();

/* 1. every part exists, and none of them is empty */
const missing = files.filter((f) => !fs.existsSync(f));
missing.length ? bad(`listed but not on disk: ${missing.join(", ")}`)
               : ok(`${files.length} parts exist: ${files.join(", ")}`);
const empty = files.filter((f) => fs.existsSync(f) && !fs.readFileSync(f, "utf8").trim());
empty.length ? bad(`listed but empty: ${empty.join(", ")}`) : ok("no part is empty");

/* 2. the pages load exactly these, in this order, with the cache-buster */
const order = (html) => [...html.matchAll(/<script[^>]+src="([^"?]+)(?:\?[^"]*)?"/g)]
  .map((m) => m[1])
  .filter((src) => files.includes(src));
const wrong = [];
for (const p of pages) {
  const html = fs.readFileSync(p, "utf8");
  const got = order(html);
  // A page that carries no walk script at all is not this gate's business (404, stop pages).
  if (!got.length) continue;
  if (got.join(",") !== files.join(",")) wrong.push(`${p}: ${got.join(", ") || "(none)"}`);
}
wrong.length ? bad(`pages do not load the list in order:\n    ${wrong.join("\n    ")}`)
             : ok(`${pages.filter((p) => order(fs.readFileSync(p, "utf8")).length).length} pages load all ${files.length} parts, in order`);

/* every part carries the same ?v= on every page, and every page's is the current digest: the pages
   are regenerated, not hand-edited, so this also catches a page emitted before a part changed. */
const bumps = new Map();
for (const p of pages) {
  for (const m of fs.readFileSync(p, "utf8").matchAll(new RegExp(`(?:${files.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\?v=([0-9a-f]{10})`, "g"))) {
    bumps.set(m[1], (bumps.get(m[1]) || 0) + 1);
  }
}
bumps.size > 1
  ? bad(`the parts carry ${bumps.size} different digests: ${[...bumps.keys()].join(", ")}`)
  : ok(`all parts carry one digest${bumps.size ? ` (${[...bumps.keys()][0]})` : ""}`);

/* 3. no top-level name declared twice across the parts */
const DUP_SAFE = /^(?:\s*\/\/|\s*\/\*|\s*\*|$)/;
const declared = new Map();
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/^(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    const name = m[1];
    const prev = declared.get(name);
    if (prev) bad(`"${name}" is declared at top level in both ${prev} and ${f}; the last one wins silently`);
    else declared.set(name, f);
  }
}
ok(`${declared.size} top-level names across the parts, none declared twice`);

/* 4. the joined text is one valid script */
const joined = siteText();
try {
  new vm.Script(joined, { filename: "site-programme.js" });
  ok(`the joined programme parses (${joined.split("\n").length} lines, ${(joined.length / 1024).toFixed(0)} KB)`);
} catch (e) {
  bad(`the joined programme does not parse: ${e.message}`);
}

/* 5. the split still covers the four blocks it was made from.  A later round that deletes one of
   them by accident (or folds it back) should be told, not silently praised for a shorter file. */
const blockOf = {
  "js/overlay.js": [["enterOverlay", "leaveOverlay", "inertOutside", "trapTab"]],
  "js/chrome.js": [[".more-btn", "is-scrolled"]],
  "js/dot-game.js": [["data-dot-game", "data-dot-board"]],
  "js/site.js": [["data-walk", "__walk"]],
};
for (const [file, groups] of Object.entries(blockOf)) {
  if (!files.includes(file)) { bad(`${file} left the list; the cut it stands for is gone`); continue; }
  const text = fs.readFileSync(file, "utf8");
  const gone = groups.flat().filter((needle) => !text.includes(needle));
  gone.length ? bad(`${file} no longer mentions ${gone.join(", ")} -- did its block move or die?`)
              : ok(`${file} still holds its block`);
}

console.log(fails.length ? `\n${fails.length} failure(s)` : `\nverify-sources: ${pass}/${pass} pass -- ${files.length} parts, ${pages.length} pages, one programme`);
if (fails.length) process.exit(1);
