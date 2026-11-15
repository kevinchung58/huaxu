/* Every model a record makes pressable has its own sentence.

   `demo` is authored in the records and read in two places in the lane: the shape branch that
   animates the answer and the table of what the record line says. A value with no row fell through
   to the last branch of a ternary, which is how the carousel spoke the drawbridge's sentence. This
   reads the pages the generator wrote and the table the lane ships, and holds them to each other. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PAGES = fs.readdirSync(ROOT).filter((f) => /^(street|rooms(-\w+)?)\.html$/.test(f));
const site = fs.readFileSync(path.join(ROOT, "js", "site.js"), "utf8");
const table = (site.match(/const DEMOS = \{([\s\S]*?)\n  \};/) || [])[1] || "";
const rows = [...table.matchAll(/^\s{4}(\w+): \{ hold: ([^,]+), say: ("(?:[^"\\]|\\.)*")/gm)]
  .map((m) => ({ id: m[1], say: JSON.parse(m[3]) }));
const authored = new Map();
for (const file of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const m of html.matchAll(/<button[^>]*data-demo="([^"]*)"[^>]*>/g)) {
    const id = (m[0].match(/data-obj="([^"]*)"/) || [])[1];
    authored.set(`${file}:${id}`, m[1]);
  }
}

test("the lane ships a sentence table, and the pages author demonstrations", () => {
  assert.ok(rows.length >= 4, `DEMOS rows read: ${rows.map((r) => r.id).join(", ")}`);
  assert.ok(authored.size >= 5, `authored demos: ${[...authored].join(" ")}`);
});

test("every authored demo value has its own row", () => {
  const known = new Set(rows.map((r) => r.id));
  for (const [where, value] of authored) assert.ok(known.has(value), `${where} authors demo="${value}", which has no row in DEMOS`);
});

test("no two models share a sentence", () => {
  const seen = new Map();
  for (const r of rows) {
    assert.ok(!seen.has(r.say), `"${r.id}" says the same as "${seen.get(r.say)}"`);
    seen.set(r.say, r.id);
  }
});

test("the demonstration's pump owns its timer and never the idle pulse's", () => {
  const from = site.indexOf("if (m.el.dataset.demo !== undefined) {");
  const block = site.slice(from, site.indexOf("tutorAnswered();", from));
  assert.ok(from > 0 && /demoPulse = setTimeout\(pump, 90\)/.test(block), "the pump is scheduled on demoPulse");
  assert.ok(!/[^A-Za-z]pulse = /.test(block), "the idle pulse's handle is not written here: the frame loop cancels it on the first step");
});
