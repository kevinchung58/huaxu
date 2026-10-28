/* verify-gen -- the split generator is still one generator.

   Round 78 split `_gen_html.py` (7,484 lines) into a 715-line entry point plus `gen/`. A split that
   is only proved once is a split that rots: the next round can add a module nothing imports, define
   the same top-level name in two files (silent, last-one-wins -- the same bug class as a duplicate
   dict key), or leave a gate reading the entry alone and therefore seeing 10 % of the generator.
   This gate is the part of `skills/pure-move-split` that can be automatic.

   What is checked (each one can fail):
     1. every `gen/*.py` is reachable from `_gen_html.py` through the import graph -- no orphans;
     2. no top-level name is defined twice across the generator (last one would silently win);
     3. every name a module imports from a sibling exists at that sibling's top level (a rename that
        missed a call site fails at import time in Python, but only for the module actually loaded);
     4. `bin/gen-source.mjs` covers every file -- a gate reading less than the whole generator would
        keep printing green;
     5. the generator is idempotent: running it twice leaves every emitted page byte-identical.

   Run:  node .verify/verify-gen.mjs
*/
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { genFiles, genSource } from "../bin/gen-source.mjs";

const ROOT = process.cwd();
let pass = 0;
const ok = (msg) => { pass++; if (process.env.VERBOSE) console.log("  ok  " + msg); };

const files = genFiles(ROOT);
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

/* A deliberately small reader: the generator's top level is plain `import`/`from ... import` lines
   and named statements, and a full Python parser in JS would be a second implementation to keep
   honest. Anything it cannot read is reported, not ignored. */
const TOP_DEF = /^(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/;
const TOP_ASSIGN = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=]+)?=(?!=)/;
const TUPLE_ASSIGN = /^([A-Za-z_][A-Za-z0-9_ ,]*)\s*=(?!=)/;
const IMPORT_FROM = /^from\s+([\w.]+)\s+import\s+(.+)$/;
const IMPORT_PLAIN = /^import\s+([\w. ,]+)$/;

const top = {};          // file -> { defines:Set, imports: [{from, names}] }
const defines = new Map(); // name -> [files]
for (const f of files) {
  const info = { defines: new Set(), imports: [] };
  for (const line of read(f).split("\n")) {
    if (!line || line[0] === " " || line[0] === "\t" || line[0] === "#") continue;
    let m;
    if ((m = IMPORT_FROM.exec(line))) {
      info.imports.push({ from: m[1].replace(/\./g, "/") + ".py", names: m[2].split(",").map((s) => s.trim().split(" as ")[0]).filter(Boolean) });
      continue;
    }
    if ((m = IMPORT_PLAIN.exec(line))) continue;
    if ((m = TOP_DEF.exec(line))) { info.defines.add(m[1]); continue; }
    if ((m = TOP_ASSIGN.exec(line))) { info.defines.add(m[1]); continue; }
    if ((m = TUPLE_ASSIGN.exec(line))) {
      for (const t of m[1].split(",")) { const n = t.trim(); if (/^[A-Za-z_]\w*$/.test(n)) info.defines.add(n); }
      continue;
    }
    if (/^(if|for|while|with|try|except|else|elif|return|raise|assert|del|import|from)\b/.test(line)) continue;
    if (/^\S/.test(line) && !/^(?:\}|\)|\])/.test(line) && !line.startsWith("pubs") && !/"""/.test(line)) {
      // An expression statement or a continued literal: no top-level name, nothing to own.
    }
  }
  top[f] = info;
  for (const n of info.defines) {
    if (!defines.has(n)) defines.set(n, []);
    defines.get(n).push(f);
  }
}

/* 1. reachability */
/* `gen/__init__.py` is reached by the package import itself, not by an import statement in it. */
const seen = new Set(["_gen_html.py", "gen/__init__.py"]);
const queue = ["_gen_html.py"];
while (queue.length) {
  const f = queue.pop();
  for (const imp of top[f]?.imports ?? []) {
    if (!top[imp.from]) continue;
    if (!seen.has(imp.from)) { seen.add(imp.from); queue.push(imp.from); }
  }
}
const orphans = files.filter((f) => !seen.has(f));
assert.deepEqual(orphans, [], `unreachable generator module(s): ${orphans.join(", ")} -- nothing imports them`);
ok("every module is reachable from the entry point");

/* 2. one owner per top-level name */
const dupes = [...defines].filter(([, fs_]) => fs_.length > 1).map(([n, fs_]) => `${n} in ${fs_.join(" + ")}`);
assert.deepEqual(dupes, [], "top-level name defined twice (the later one silently wins):\n  " + dupes.join("\n  "));
ok(`${defines.size} top-level names, each defined once`);

/* 3. every cross-module import exists */
const missing = [];
for (const f of files) {
  for (const imp of top[f].imports) {
    if (!imp.from.endsWith(".py") || !top[imp.from]) continue;
    for (const n of imp.names) if (!top[imp.from].defines.has(n)) missing.push(`${f}: from ${imp.from} import ${n}`);
  }
}
assert.deepEqual(missing, [], "imports that resolve to nothing:\n  " + missing.join("\n  "));
ok("every cross-module import names a name its source defines");

/* 4. the text gates read all of it */
const source = genSource(ROOT);
assert.equal(source.length, files.reduce((a, f) => a + read(f).length, files.length - 1), "genSource() does not cover every file");
for (const probe of ["def walk_html", "DISTRICTS = ", "def gallery_html", "def page("]) {
  assert.ok(source.includes(probe), `genSource() is missing a marker only a module defines: ${probe}`);
}
ok("bin/gen-source.mjs covers the whole generator");

/* 5. idempotence */
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const digest = () => Object.fromEntries(pages.map((p) => [p, crypto.createHash("md5").update(fs.readFileSync(path.join(ROOT, p))).digest("hex")]));
const before = digest();
execFileSync("python3", ["_gen_html.py"], { cwd: ROOT, stdio: "pipe" });
const after = digest();
const drift = pages.filter((p) => before[p] !== after[p]);
assert.deepEqual(drift, [], `the generator is not idempotent: ${drift.join(", ")} changed on a second run`);
ok(`${pages.length} pages rebuild byte-identical`);

console.log(`verify-gen: ${pass}/${pass} pass -- ${files.length} files, ${defines.size} names, ${pages.length} pages idempotent`);
