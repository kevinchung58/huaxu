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
    /* The private `lib/` above is not everything Chromium opens: the GL libraries and fonts are
       unpacked by `chromium.executablePath()` into /tmp/al2023 and /tmp, and env.test.cjs removes
       /tmp/al2023 and has `bin/gate` unpack it again while this file runs beside it. A launch that
       lands inside that window dies without a word ("Failed to launch the browser process: Code:
       null", empty stderr) -- seen once in a full battery and once in a plain `node --test`, never
       on demand, so the window is the likeliest cause and not a proven one. It says nothing about
       the site either way, so the launch is tried again; a browser that cannot start three times
       in a row is still a failure. */
    let browser = null, last = null;
    for (let attempt = 0; attempt < 3 && !browser; attempt++) {
      try {
        browser = await puppeteer.launch({
          executablePath: await chromium.executablePath(),
          args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
          headless: true,
          env: { ...process.env, LD_LIBRARY_PATH: `${path.join(libs, "lib")}:${process.env.LD_LIBRARY_PATH || ""}` },
        });
      } catch (error) {
        last = error;
        if (!/Failed to launch the browser process/.test(String(error && error.message))) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    if (!browser) throw last;
    return { browser, close: async () => {
      try { await browser.close(); } finally { fs.rmSync(libs, { recursive: true, force: true }); }
    } };
  } catch (error) {
    fs.rmSync(libs, { recursive: true, force: true });
    throw error;
  }
}
module.exports = { launch };
