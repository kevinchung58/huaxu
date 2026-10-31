/* The gate battery is one list, and the list is TODO.md section 2.3.

   `bin/gate-all.py` runs that block; it does not keep a copy of it. The reason is the defect this
   repository has now hit twice: a second copy of one list (the `?v=` asset list) went stale and two
   gates read the wrong digest while the pages were right. Here the copy that matters is the one
   nobody runs -- "a gate that is not on the list does not exist", because no round executes it, so
   it cannot go red. The runner therefore compares list and disk in both directions and exits 2 on
   drift; this test pins that, and pins the two things a parser gets wrong: the browser section of
   the block already writes `sh bin/gate ...` (so it must not be wrapped twice) and the block's first
   line starts a page server (which does not exit, so it must never be executed).

   Run: node --test
*/
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.resolve(__dirname, "..");
const run = (args) => {
  try {
    const stdout = execFileSync("python3", ["bin/gate-all.py", ...args],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status ?? -1, stdout: String(e.stdout || "") + String(e.stderr || "") };
  }
};

test("the runner parses the battery and finds no drift between TODO.md and .verify/", () => {
  const r = run(["--check"]);
  assert.equal(r.code, 0, r.stdout);
  const m = r.stdout.match(/list: (\d+) commands, (\d+) gates listed, (\d+) on disk/);
  assert.ok(m, "the summary line is how a run says what it read:\n" + r.stdout);
  assert.equal(m[2], m[3], "every gate file on disk is named by a command in TODO.md section 2.3");
  assert.ok(Number(m[2]) >= 25, "the battery cannot have collapsed to a handful of gates");
});

test("the runner lists the browser gates behind sh bin/gate and never the server", () => {
  const r = run(["--list"]);
  assert.equal(r.code, 0, r.stdout);
  assert.match(r.stdout, /^\s*\d+\. node --test/m, "no-browser gates run first, unwrapped");
  assert.match(r.stdout, /^\s*\d+\. sh bin\/gate node \.verify\/verify-box\.mjs/m, "browser gates keep their wrapper");
  assert.doesNotMatch(r.stdout, /^\s*\d+\. .*bin\/preview/m, "a server does not exit; it is reported, not run");
  assert.match(r.stdout, /^skipping .*bin\/preview/m, "and the runner says so out loud");
});

test("every command the runner would run names a file that exists", () => {
  const r = run(["--list"]);
  const cmds = r.stdout.split("\n").map((l) => l.replace(/^\s*\d+\.\s*/, ""))
    .filter((l) => /^(node|sh bin\/gate|node_modules|git|md5sum|python3)/.test(l));
  assert.ok(cmds.length >= 25, `parsed ${cmds.length} commands`);
  for (const c of cmds) {
    for (const f of c.match(/(?:\.verify\/|bin\/|tools\/|tests\/)?[A-Za-z0-9_./-]+\.(?:mjs|cjs|py)/g) || []) {
      if (f.startsWith("node_modules/")) continue;
      assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} is named by "${c}" but does not exist`);
    }
  }
});

test("a gate on disk that no line runs is reported as drift (the negative case)", () => {
  const planted = path.join(ROOT, ".verify", "verify-zz-drift.mjs");
  fs.writeFileSync(planted, "// a gate nobody runs does not exist\n");
  try {
    const r = run(["--check"]);
    assert.equal(r.code, 2, "drift must exit 2, not 0:\n" + r.stdout);
    assert.match(r.stdout, /on disk but not in the list: \.verify\/verify-zz-drift\.mjs/);
  } finally {
    fs.unlinkSync(planted);
  }
  assert.equal(run(["--check"]).code, 0, "and removing it restores the list");
});
