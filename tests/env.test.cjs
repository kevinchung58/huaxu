/* The environment wrapper, asserted instead of remembered.

   `bin/gate` exists because three failures in this sandbox look like something else: a wiped
   `node_modules` ("cannot find module puppeteer-core"), a wiped `/tmp/al2023/lib` (puppeteer exits
   `Code: 127 ... libnspr4.so`, which reads as a crashed browser) and a busy box (the two gates that
   measure speed or collision quietly measure the other process instead of failing). A wrapper that
   silently stops doing one of those is worse than no wrapper, because every gate command in
   `TODO.md` now goes through it -- so the four promises are tested here, cheaply, on a shell this
   test itself can watch.

   Run: node --test
*/
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const fs = require("node:fs");
const listening = () => {
  try {
    execFileSync("curl", ["-s", "-o", "/dev/null", "--max-time", "2", "http://127.0.0.1:8080/index.html"]);
    return true;
  } catch (e) { return false; }
};
const run = (args, env = {}) => {
  try {
    const stdout = execFileSync("sh", ["bin/gate", ...args],
      { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    return { code: error.status, stdout: String(error.stdout || ""), stderr: String(error.stderr || "") };
  }
};

test("gate hands the command the browser's library path", () => {
  const r = run(["sh", "-c", "printf %s \"$LD_LIBRARY_PATH\""], { LD_LIBRARY_PATH: "" });
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^\/tmp\/al2023\/lib/, "the first entry must be the unpacked Chromium libs");
});

test("gate restores /tmp/al2023 when the sandbox wiped it", () => {
  // The one destructive step this test takes, and it is the step the wrapper exists for: the
  // directory is rebuilt from node_modules by bin/chromium-libs, so a failure here is a broken
  // environment for the rest of the run -- which is exactly what should happen.
  execFileSync("rm", ["-rf", "/tmp/al2023"]);
  const r = run(["sh", "-c", "test -f /tmp/al2023/lib/libnspr4.so && echo present"]);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /present/);
});

test("gate returns the command's own exit code", () => {
  assert.equal(run(["sh", "-c", "exit 7"]).code, 7);
});

test("gate refuses a speed gate while a Chromium is already running", () => {
  // The pattern is aimed at the test runner's own process, so "a Chromium is running" is true by
  // construction: the rule under test is the refusal, not the detection of a real browser.
  const r = run(["node", ".verify/verify-feel.mjs"], { GATE_CHROMIUM_PATTERN: "node" });
  assert.equal(r.code, 3, "a busy box must refuse, not measure");
  assert.match(r.stderr, /REFUSED/);
});

test("gate does not refuse an ordinary gate on the same busy box", () => {
  const r = run(["sh", "-c", "echo ran"], { GATE_CHROMIUM_PATTERN: "node" });
  assert.equal(r.code, 0);
  assert.equal(r.stdout.trim(), "ran");
});

test("gate starts the page server a browser gate needs, and stops it again", (t) => {
  if (listening()) { t.skip("a preview is already serving 8080; nothing to start"); return; }
  // The gate's own argument list is what says it needs the server: the wrapper reads the script for
  // the URL it loads, exactly as it reads a real gate.
  const probe = "/tmp/gate-probe.mjs";
  fs.writeFileSync(probe, "// loads http://127.0.0.1:8080/index.html\n");
  const r = run(["node", "-e",
    "fetch('http://127.0.0.1:8080/index.html').then((x) => console.log('status', x.status))", probe]);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /status 200/, "the page must have been served");
  assert.equal(listening(), false, "the server bin/gate started must not outlive the gate");
});
