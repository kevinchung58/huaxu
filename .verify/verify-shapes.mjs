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
let bad = 0, total = 0;
for (const f of ["rooms-toronto.html", "rooms.html", "rooms-fukuoka.html", "street.html"]) {
  if (!fs.existsSync(f)) continue;
  const ids = [...fs.readFileSync(f, "utf8").matchAll(/data-obj="([A-Za-z0-9-]+)"/g)].map((m) => m[1]);
  const miss = ids.filter((id) => SHAPE[kindOf(id)] === undefined);
  total += ids.length;
  console.log(`${f}: ${ids.length} props, ${miss.length} unresolved`);
  if (miss.length) { bad += miss.length; console.log("   draws as a plain plane: " + miss.join("  ")); }
}
console.log(bad ? `\n${bad}/${total} prop(s) fall through to "plane"` : `\nall ${total} props resolve to a shape`);
process.exit(bad ? 1 : 0);
