/* Shape audit: does every prop on every room reach the branch that draws it?

   `const shape = SHAPE[kindOf(m.kind)] || "plane"` (site.js) turns any id the table has never
   heard of into a flat card: no crash, no console warning, and a diorama island with no planting
   on it. kindOf() accepts a bare kind or `kind-n`; anything else silently falls through.

   Run:  node .verify/verify-shapes.mjs   */
import fs from "node:fs";
const js = fs.readFileSync("js/site.js", "utf8");
const grab = (re) => { const m = js.match(re); return m ? m[1] : ""; };
// keys are camel-cased in places (`signA`), so the parser has to take capitals or it reports
// props as unresolved that the site has been resolving all along
const pairs = (body) => Object.fromEntries([...body.matchAll(/"?([A-Za-z][A-Za-z0-9]*)"?\s*:\s*"([A-Za-z0-9]+)"/g)]
  .map((m) => [m[1], m[2]]));
const SHAPE = { ...pairs(grab(/const SHAPE = \{([\s\S]*?)\};/)),
                ...pairs(grab(/Object\.assign\(SHAPE, \{([\s\S]*?)\}\);/)) };
const TINT = pairs(grab(/const PROP_TINT = \{([\s\S]*?)\};/));
const kindOf = (id) => {
  if (TINT[id] !== undefined || SHAPE[id] !== undefined) return id;
  let best = null;
  for (const k of Object.keys(SHAPE)) if (id.startsWith(k + "-") && (!best || k.length > best.length)) best = k;
  return best || id;
};
/* Every page that carries props, read off the disk. The list used to be four names typed in by hand,
   so the three spaces built after it (the CN Tower, Niagara, Journey) were never audited, and three
   of the tower's four props drew as fallback planes from round 21 to round 31. */
const PAGES = fs.readdirSync(".").filter((f) => f.endsWith(".html")
  && fs.readFileSync(f, "utf8").includes('data-obj="')).sort();
let bad = 0, total = 0;
for (const f of PAGES) {
  if (!fs.existsSync(f)) continue;
  const page = fs.readFileSync(f, "utf8");
  const ids = [...page.matchAll(/data-obj="([A-Za-z0-9-]+)"/g)].map((m) => m[1]);
  // Round 54: resolve by the kind the record actually declares.  Names like `luna-island` or
  // `midway-stall` were authored as an island and a stall — the id heuristic called them
  // unresolved while the site was drawing them fine, and it missed the two kinds (board,
  // foodstall) that were genuinely falling through under ids that looked resolved.
  const kinds = {};
  for (const b of page.matchAll(/<button[^>]*>/g)) {
    const o = b[0].match(/data-obj="([A-Za-z0-9-]+)"/);
    const k = b[0].match(/data-kind="([A-Za-z0-9-]+)"/);
    if (o && k) kinds[o[1]] = k[1];
  }
  const miss = ids.filter((id) => SHAPE[kindOf(kinds[id] || id)] === undefined);
  total += ids.length;
  console.log(`${f}: ${ids.length} props, ${miss.length} unresolved`);
  if (miss.length) { bad += miss.length; console.log("   draws as a plain plane: " + miss.join("  ")); }
}
/* A shape the table names and the painter never branches on is the round-21 defect again: the id
   resolves, the audit above is satisfied, and the prop is drawn by the default branch as a card.
   `plane` is the one value that *is* the default, so it is the one value allowed to have no branch.
   This is the check that would have caught a `bench: "bench"` written before the bench was painted,
   and it is what makes "the shape is named" mean "the shape is drawn" from now on. */
/* A shape that draws nothing is allowed only when the record says where its words live.

   `kind: landmark` is the one branch whose body is drawn by the world prims instead of by the prop
   (site.js `shape === "landmark"`), and the press mark is placed by a different flag —
   `data-landmark="1"`. A landmark record without that flag therefore paints nothing and gets no
   box: it is a paragraph with a page anchor, and the only place a visitor can meet it is the
   written list at the foot of the page (`<li id="thing-<obj>">`). That is legitimate for
   rooms-goat's three far-bank records (round 75 turned them into scenery on purpose), and it is
   invisible when it is not legitimate: `.verify/audit-all.mjs` reported woodline-c1, channel-e and
   pool-lower as NEVER ON SCREEN from six stops and eight headings, and only the page's own list
   could say whether that was a defect or the design. So the invariant is written down here: a
   landmark record either has a mark, or it is quiet AND listed by id. */
const marks = { drawn: 0, records: 0 };
for (const f of PAGES) {
  const page = fs.readFileSync(f, "utf8");
  for (const b of page.matchAll(/<button[^>]*>/g)) {
    const tag = b[0];
    if (!/data-kind="landmark"/.test(tag)) continue;
    const id = (tag.match(/data-obj="([A-Za-z0-9-]+)"/) || [])[1];
    if (/data-landmark="1"/.test(tag)) { marks.drawn++; continue; }
    const quiet = /data-quiet="1"/.test(tag);
    const listed = new RegExp(`<li id="thing-${id}"`).test(page);
    if (quiet && listed) { marks.records++; continue; }
    bad++;
    console.log(`\n   ${f}: "${id}" is a landmark record with no mark and no written entry ` +
                `(quiet ${quiet}, listed ${listed}) — it paints nothing, presses nothing and says nothing`);
  }
}
console.log(`landmark records: ${marks.drawn} with a press mark, ${marks.records} with a written entry only`);
const shapes = [...new Set(Object.values(SHAPE))].sort();
const unpainted = shapes.filter((v) => v !== "plane" && !new RegExp(`shape === "${v}"`).test(js));
if (unpainted.length) {
  bad += unpainted.length;
  console.log(`\n   named in SHAPE but never branched on in site.js (drawn as a card): ${unpainted.join(" ")}`);
} else {
  console.log(`every one of the ${shapes.length} named shapes has its own painter`);
}
console.log(bad ? `\n${bad}/${total} prop(s) fall through to "plane"` : `\nall ${total} props resolve to a shape`);
process.exit(bad ? 1 : 0);
