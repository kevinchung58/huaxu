/* _coupling -- what `js/site.js` is made of, measured before anyone cuts it.

   `TODO.md` section 3 P3 asks for one 9,479-line closure to become native ES modules. Two things
   make that expensive, and both are numbers rather than opinions:

     1. how many top-level names there are, and how much of the file each one is reachable from --
        a name that most of the file reads is an *interface* whether or not anyone wrote it down;
     2. how the sections of the file depend on each other, so a cut can be made at a seam instead of
        wherever the line count happens to look tidy.

   This reads the file as text (it is one closure with plain `const`/`function` statements at two
   spaces of indent, so the top level is legible without a JS parser) and reports, per section:

     - names declared in it, and how many other sections reference them;
     - the names the whole file leans on (`fan-in`: how many sections read the name, and how many
       times the identifier appears outside its own declaration).

   A name declared and read in one section is local work. A name read from five sections is part of
   the interface a split has to design. This is the measurement that turns "288 names" into a list
   with sizes.

   Diagnostic, exit 0. Run:  node .verify/_coupling.mjs   [FILE=js/site.js]
*/
import fs from "node:fs";

const FILE = process.env.FILE || "js/site.js";
const src = fs.readFileSync(FILE, "utf8");
const lines = src.split("\n");

/* The file's own section markers -- the dashed comment lines such as "the model kit (round 36)".
   A name belongs to the last marker above it; the text before the first one is the section "(top)". */
const marks = [];
lines.forEach((l, i) => {
  const m = l.match(/^\s*\/\* -{3,}\s*(.+?)\s*-{3,}/);
  if (m) marks.push({ line: i, name: m[1].replace(/\s*\(round [^)]*\)\s*$/, "") });
});
const sectionOf = (line) => {
  let best = "(top)";
  for (const m of marks) if (m.line <= line) best = m.name;
  return best;
};

/* Top-level declarations of the closure: two spaces of indent, `const`/`let`/`function`, possibly
   several names in one destructuring-free list (`const a = 1, b = 2;` takes only `a` and is rare
   enough here to under-count by a handful). */
const decls = [];
lines.forEach((l, i) => {
  const m = l.match(/^ {2}(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/);
  if (m) decls.push({ name: m[1], line: i, section: sectionOf(i) });
});
const byName = new Map();
for (const d of decls) if (!byName.has(d.name)) byName.set(d.name, d);

const occurrences = (name) => {
  const re = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`, "g");
  return (src.match(re) || []).length;
};
const sectionsReading = (name, own) => {
  const re = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`, "g");
  const seen = new Set();
  lines.forEach((l, i) => {
    re.lastIndex = 0;
    if (re.test(l) && sectionOf(i) !== own) seen.add(sectionOf(i));
  });
  return seen;
};

const rows = [...byName.values()].map((d) => {
  const n = occurrences(d.name);
  const reads = sectionsReading(d.name, d.section);
  return { ...d, uses: n - 1, sections: reads.size, readers: [...reads] };
}).sort((a, b) => b.sections - a.sections || b.uses - a.uses);

console.log(`${FILE}: ${lines.length} lines, ${marks.length} sections, ${byName.size} top-level names`);
console.log(`\n${"name".padEnd(22)} ${"line".padStart(5)} ${"uses".padStart(5)} ${"sections".padStart(8)}  declared in`);
for (const r of rows.slice(0, 40)) {
  console.log(`${r.name.padEnd(22)} ${String(r.line + 1).padStart(5)} ${String(r.uses).padStart(5)} ${String(r.sections).padStart(8)}  ${r.section}`);
}

/* Every section, with how many of its own names are read elsewhere -- a section whose names are
   read nowhere else is a candidate for the first cut, because moving it cannot change behaviour. */
console.log("\nsections");
const bySection = new Map();
for (const r of rows) {
  const e = bySection.get(r.section) || { names: 0, shared: 0, lines: 0 };
  e.names++;
  if (r.sections > 0) e.shared++;
  bySection.set(r.section, e);
}
for (const m of marks.concat([{ line: lines.length, name: null }])) { /* sections measured by span */ }
let start = 0;
const spans = [];
marks.forEach((m, i) => {
  if (i > 0) spans.push({ name: marks[i - 1].name, from: marks[i - 1].line, to: m.line });
});
spans.push({ name: marks.length ? marks[marks.length - 1].name : "(top)", from: marks.length ? marks[marks.length - 1].line : 0, to: lines.length });
spans.unshift({ name: "(top)", from: 0, to: marks.length ? marks[0].line : lines.length });
for (const s of spans) {
  const e = bySection.get(s.name);
  if (!e) continue;
  console.log(`  ${s.name.padEnd(34)} ${String(s.to - s.from).padStart(5)} lines  ` +
              `${String(e.names).padStart(3)} names  ${String(e.shared).padStart(3)} read elsewhere`);
}

const unread = rows.filter((r) => r.uses === 0).map((r) => r.name);
console.log(`\nnames declared and never read as an identifier (may be exported or dead): ${unread.length}` +
            (unread.length ? `\n  ${unread.join(", ")}` : ""));
const hub = rows.filter((r) => r.sections >= 5);
console.log(`names read from 5+ sections (the interface a split must design): ${hub.length}`);
