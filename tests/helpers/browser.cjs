/* A real Chromium for layout tests, independent of env.test.cjs removing /tmp/al2023. */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const zlib = require("node:zlib");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

async function launch() {
  const libs = fs.mkdtempSync(path.join(os.tmpdir(), "huaxu-test-libs-"));
  try {
    const dir = path.resolve(path.dirname(require.resolve("@sparticuz/chromium")), "../bin");
    const archive = zlib.brotliDecompressSync(fs.readFileSync(path.join(dir, "al2023.tar.br")));
    execFileSync("tar", ["-xf", "-", "-C", libs], { input: archive });
    const browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
      headless: true,
      env: { ...process.env, LD_LIBRARY_PATH: `${path.join(libs, "lib")}:${process.env.LD_LIBRARY_PATH || ""}` },
    });
    return { browser, close: async () => {
      try { await browser.close(); } finally { fs.rmSync(libs, { recursive: true, force: true }); }
    } };
  } catch (error) {
    fs.rmSync(libs, { recursive: true, force: true });
    throw error;
  }
}
module.exports = { launch };
