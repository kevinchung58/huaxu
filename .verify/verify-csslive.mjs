/* verify-csslive.mjs — does every selector in css/site.css have a thing to style, and is that thing
   on a page today, made by the script, or waiting on data the build can emit?

   Round 77. Two sweeps before this one were text greps and both lied: a comment saying "the plates
   are .plate-navy, kept as a fallback" made a dead family look alive, and a filename `grid-2-…jpg`
   made a dead rule look used. The owner's ruling is that a mention is not a user, so this probe
   asks the DOM, not the prose, and separates four states:

     LIVE      a page has an element this selector matches right now (a pseudo-element's host
               counts: `::after` is not in jsdom's tree, but a rule for it is live iff its element is)
     RUNTIME   no page has it — the script makes the class, the attribute, the child tag
     DORMANT   neither, but _gen_html.py writes the class for other data (the build's own markup is
               the user: the photograph wall's tiles live here, because no photograph has a date yet)
     DEAD      nothing in the pages, the script, or the generator — and this exits non-zero

   Comments and docstrings are stripped from _gen_html.py first, because that is exactly where the
   last two false positives came from. */
import fs from "node:fs";
import { JSDOM } from "jsdom";

const css = fs.readFileSync("css/site.css", "utf8");
const js = fs.readdirSync("js").filter((f) => f.endsWith(".js"))
  .map((f) => fs.readFileSync("js/" + f, "utf8")).join("\n");

/* the generator, with its prose removed: `#` to end of line and triple-quoted docstrings. The f-string
   templates that emit markup are single-quoted, so they survive — which is the whole point. */
const gen = fs.readFileSync("_gen_html.py", "utf8")
  .replace(/"""[\s\S]*?"""/g, '""')
  .replace(/#[^\n]*/g, "");

const pages = fs.readdirSync(".").filter((f) => f.endsWith(".html"));
const doms = pages.map((p) => new JSDOM(fs.readFileSync(p, "utf8")).window.document);

/* ---------- one entry per selector, with the line it starts on ---------- */
const rules = [];
let buf = "", line = 1, selStart = null;
for (let i = 0; i < css.length; i++) {
  const ch = css[i];
  if (ch === "\n") line++;
  if (ch === "{") {
    const sel = buf.trim().replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (sel && !sel.startsWith("@")) rules.push({ sel, line: selStart ?? line });
    buf = "";
  } else if (ch === "}") { buf = ""; }
  else {
    if (!buf.trim() && !/\s/.test(ch)) selStart = line;
    buf += ch;
  }
}

/* ---------- what the script can make ---------- */
const has = (tok) => js.includes(`"${tok}"`) || js.includes(`'${tok}'`) || js.includes("`" + tok + "`");
const attrWritten = (name) => {
  if (name === "hidden") return /\.hidden\s*=/.test(js) || /setAttribute\(\s*["']hidden["']/.test(js);
  const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return js.includes(`setAttribute("${name}"`) || js.includes(`setAttribute('${name}'`)
    || new RegExp(`\\.${camel}\\s*=`).test(js);
};
const tagCreated = (tag) => new RegExp(`createElement(NS)?\\([^)]*["']${tag}["']\\)`).test(js);

const classesOf = (s) => [...s.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]);
const idsOf = (s) => [...s.matchAll(/#([A-Za-z_][\w-]*)/g)].map((m) => m[1]);
const attrsOf = (s) => [...s.matchAll(/\[([a-zA-Z-]+)/g)].map((m) => m[1]);
const onPage = (t, isId) => doms.some((d) => { try { return !!d.querySelector((isId ? "#" : ".") + t); } catch { return false; } });
const inGen = (t) => new RegExp(`(^|[\\s"'<>])${t}([\\s"'<>]|$)`).test(gen);
const matchesSomePage = (sel) => {
  for (const d of doms) { try { if (d.querySelector(sel)) return true; } catch { return false; } }
  return false;
};

const out = { LIVE: [], RUNTIME: [], DORMANT: [], DEAD: [] };
const seen = new Set();
for (const r of rules) {
  for (const part of r.sel.split(",").map((s) => s.trim()).filter(Boolean)) {
    const key = part.replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    if (/^(from|to|\d+%)$/.test(part)) continue;                    // keyframe stops
    if (!part.replace(/::{1,2}[a-z-]+(\([^)]*\))?/g, "").trim()) continue;   // a lone ::before

    if (matchesSomePage(part)) { out.LIVE.push([r.line, part, ""]); continue; }

    /* a pseudo-element rule is live when the element it hangs on is on a page */
    const bare = part.replace(/::[a-z-]+(\([^)]*\))?/g, "").trim();
    if (bare !== part && matchesSomePage(bare)) {
      out.LIVE.push([r.line, part, "pseudo-element of an element on a page"]); continue;
    }

    const cls = classesOf(part), ids = idsOf(part), as = attrsOf(part);
    const tokens = [...cls.map((c) => [c, false]), ...ids.map((c) => [c, true])];
    const pseudoState = /:(hover|focus|focus-visible|focus-within|active|checked|disabled|target|placeholder-shown|defined|empty|not|first-|last-|only-|nth-)/.test(part);

    /* the child of a live element, built by the script: `.dot-lines polyline` */
    const childTag = (part.match(/(?:^|\s)([a-z][a-z0-9]*)$/) || [])[1];
    if (childTag && tagCreated(childTag) && tokens.length
        && tokens.every(([t, isId]) => onPage(t, isId))) {
      out.RUNTIME.push([r.line, part, `${childTag} built by js inside a live element`]); continue;
    }

    /* every class/attribute it needs is either shipped or written by the script, and at least one
       is the script's — a state the page is put into rather than one it arrives in */
    const allShipped = tokens.length && tokens.every(([t, isId]) => onPage(t, isId));
    const allKnown = tokens.length && tokens.every(([t, isId]) => onPage(t, isId) || has(t));
    const attrDyn = as.length > 0 && as.every(attrWritten);
    if (allKnown && tokens.some(([t]) => has(t))) {
      out.RUNTIME.push([r.line, part, "class/state written by js"]); continue;
    }
    if (allShipped && (pseudoState || attrDyn || as.length === 0)) {
      out.RUNTIME.push([r.line, part, "element ships, state written by js"]); continue;
    }
    if (!tokens.length && !as.length) {
      out.RUNTIME.push([r.line, part, "element-only rule"]); continue;
    }
    if (tokens.some(([t]) => inGen(t))) {
      out.DORMANT.push([r.line, part, "the generator can emit it"]); continue;
    }
    out.DEAD.push([r.line, part, "no page, no script, no generator"]);
  }
}

console.log(`selectors parsed: ${seen.size}   pages: ${pages.length}   LIVE ${out.LIVE.length}`);
for (const k of ["RUNTIME", "DORMANT", "DEAD"]) {
  console.log(`${k.padEnd(8)} ${out[k].length}`);
  for (const [l, s, why] of out[k].sort((a, b) => a[0] - b[0]))
    console.log(`  L${String(l).padEnd(5)} ${s.padEnd(52).slice(0, 52)} ${why}`);
}
if (out.DEAD.length) { console.log("\nCSSLIVE FAILED"); process.exit(1); }
console.log("\nCSSLIVE OK");
