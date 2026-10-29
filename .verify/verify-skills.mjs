/* verify-skills -- the register of skills is checked, not remembered.

   The defect this exists for: at round 69k `skills/` held thirteen skills and `skills/README.md`
   registered four. Nothing failed, because nothing looked. A skill that is not registered is
   invisible to the next session, so the lesson it carries gets re-learned from scratch -- the most
   expensive kind of loss this project has.

   What is checked (each one can fail):
     1. every `skills/<dir>/SKILL.md` exists and has front matter with `name` and `description`;
     2. `name` equals the directory (a mismatch breaks routing silently);
     3. the description is a real sentence about WHEN to use it, not a title (>= 60 chars);
     4. the skill is registered in `skills/README.md` (row naming the directory);
     5. the skill is routed from `SKILLS.md` or `AGENTS.md` (named, so a round can find it);
     6. the file is under 500 lines (the creator's progressive-disclosure cap);
     7. no directory exists with a SKILL.md that nobody can find.

   This gate cannot read intent. It cannot know that a defect class has just been discovered. That
   job belongs to `.verify/verify-skills.mjs`'s sibling rule in SKILLS.md (skill-authoring) -- the
   gate's job is to make forgetting the paperwork impossible, which is the part that can be
   automatic.

   Run:  node .verify/verify-skills.mjs
*/
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "skills");
const readme = fs.readFileSync(path.join(DIR, "README.md"), "utf8");
const routing = fs.readFileSync(path.join(ROOT, "SKILLS.md"), "utf8")
  + "\n" + (fs.existsSync(path.join(ROOT, "AGENTS.md")) ? fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8") : "");

let pass = 0;
const fails = [];
const ok = (msg) => { pass++; };
const bad = (msg) => fails.push(msg);

const dirs = fs.readdirSync(DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

for (const name of dirs) {
  const file = path.join(DIR, name, "SKILL.md");
  if (!fs.existsSync(file)) { bad(`${name}: directory has no SKILL.md`); continue; }
  const text = fs.readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) { bad(`${name}: no front matter`); continue; }
  const fm = m[1];
  const nm = /^name:\s*(.+)$/m.exec(fm);
  const ds = /^description:\s*([\s\S]*?)(?:\n[a-z-]+:|\n*$)/m.exec(fm);
  if (!nm) bad(`${name}: front matter has no name`); else if (nm[1].trim() === name) ok(); else bad(`${name}: name "${nm[1].trim()}" != directory`);
  const desc = ds ? ds[1].replace(/\s+/g, " ").trim() : "";
  if (desc.length < 60) bad(`${name}: description is ${desc.length} chars — say WHEN to use it`);
  else ok();
  if ((text.match(/\n/g) || []).length + 1 > 500) bad(`${name}: over 500 lines (progressive-disclosure cap)`); else ok();
  if (new RegExp("\\|\\s*`?" + name + "`?").test(readme) || readme.includes(`skills/${name}/SKILL.md`) || readme.includes(`\`${name}/SKILL.md\``)) ok();
  else bad(`${name}: not registered in skills/README.md`);
  if (new RegExp("`" + name + "`|skills/" + name).test(routing)) ok();
  else bad(`${name}: not routed from SKILLS.md or AGENTS.md`);
}

/* The reverse direction: a row in the register whose skill no longer exists is a promise the
   repository cannot keep, and it is how a stale table starts. */
const rows = [...readme.matchAll(/\|\s*[^|]*\|\s*`?([a-z][a-z-]*)\/SKILL\.md`?/g)].map((m) => m[1]);
for (const r of new Set(rows)) if (!dirs.includes(r)) bad(`skills/README.md registers "${r}" but skills/${r}/ does not exist`);

const total = dirs.length;
console.log(`skills/ holds ${total}: ${dirs.join(", ")}`);
if (fails.length) {
  for (const f of fails) console.log("FAIL  " + f);
  console.log(`verify-skills: ${pass} pass, ${fails.length} FAIL`);
  process.exit(1);
}
console.log(`verify-skills: ${pass}/${pass} pass — every skill is well formed, registered and routed`);
