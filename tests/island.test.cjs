/* Exercise the island gate's verdict with a stubbed browser. A gate may only pass if every
   requested page/stop was actually measured; an unavailable camera or a missed arrival is not
   evidence of a non-empty scene. The real-browser ray check remains in verify-island.cjs. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../.verify/verify-island.cjs"), "utf8");
const anchor = 'await import("./_aim.mjs")';
assert.equal(source.split(anchor).length, 2, "the browser stub replaces exactly one import");
const script = new vm.Script(source.replace(anchor, "await Promise.resolve(__aim)"));

async function run(options = {}) {
  const lines = [];
  let code = null;
  const stops = [{ i: 0, z: 60, x: 0, yaw: 0, pitch: 0, label: "first stop" }];
  const makePage = () => {
    let calls = 0;
    return {
      evaluate: async (fn, args) => {
        calls += 1;
        if (calls === 1) return !options.noCamera;
        if (calls === 2) return options.noStops ? [] : stops;
        if (options.onlySky || options.transparentFirst || options.behindSky || options.outsideClip ||
            options.additiveFirst || options.spriteFirst || options.lightBeforeScenery) return fn(args);
        return { miss: 0, n: 60, pct: 0 };
      },
      close: async () => {},
    };
  };
  const __aim = {
    launch: async () => ({ close: async () => {} }),
    openPage: async () => { if (options.openError) throw new Error("unavailable"); return makePage(); },
    arrive: async () => options.missed ? { arrived: false, why: "not at the requested stop" } : { arrived: true },
    aim: async () => ({ aimed: true }),
    park: async () => {},
    state: async () => ({ yaw: 0, pitch: 0 }),
  };
  const skyOnly = { __cam: {}, __threeScene: { children: [] }, __THREE: {
    AdditiveBlending: 2,
    Vector2: class {},
    Raycaster: class {
      setFromCamera() {}
      intersectObjects() {
        // The browser's sky is rendered first with depth testing/writing disabled. A more distant
        // surface within the camera's clip range is still visible over it; one outside is not.
        const hit = (name, z = 0, material = {}) => ({
          object: { name, material },
          point: { clone: () => ({ project: () => ({ z }) }) },
        });
        const sky = hit("authored sky");
        if (options.transparentFirst) return [hit("3D lamp halo 1", 0, { opacity: 0 }), sky];
        if (options.additiveFirst) return [hit("lamp halo", 0, { opacity: 0.17, blending: 2 }), sky];
        if (options.spriteFirst) {
          const sprite = hit("effect sprite"); sprite.object.isSprite = true; return [sprite, sky];
        }
        if (options.lightBeforeScenery) return [hit("lamp halo", 0, { opacity: 0.17, blending: 2 }), hit("visible scenery")];
        if (options.behindSky) return [sky, hit("visible scenery", 0)];
        if (options.outsideClip) return [hit("clipped scenery", options.clipZ), sky];
        return [sky];
      }
    },
  } };
  await script.runInNewContext({
    __aim, window: skyOnly, console: { log: (...args) => lines.push(args.join(" ")) },
    require: () => ({ walkPages: () => ["first.html", "second.html"] }),
    process: { env: options.useDefault ? {} : { PAGES: options.pages ?? "fixture.html" },
      exit: (n) => { code = n; } },
  });
  return { code, output: lines.join("\n") };
}

test("the scene gate passes when its requested stop was measured", async () => {
  const r = await run();
  assert.equal(r.code, 0, r.output);
  assert.match(r.output, /all 1 stops see something/);
});

test("the scene gate checks every discovered page by default", async () => {
  const r = await run({ useDefault: true });
  assert.equal(r.code, 0, r.output);
  assert.match(r.output, /first\.html/);
  assert.match(r.output, /second\.html/);
  assert.match(r.output, /all 2 stops see something/);
});

test("the sky dome is not counted as scene geometry", async () => {
  const r = await run({ onlySky: true });
  assert.equal(r.code, 1, r.output);
  assert.match(r.output, /empty\s+100%/);
});

test("geometry behind the sky dome is visible within the camera frustum", async () => {
  const r = await run({ behindSky: true });
  assert.equal(r.code, 0, r.output);
  assert.match(r.output, /empty\s+0%/);
});

test("geometry beyond the camera's clip planes is not counted as visible", async (t) => {
  for (const [name, clipZ] of [["before near", -2], ["beyond far", 2]]) {
    await t.test(name, async () => {
      const r = await run({ outsideClip: true, clipZ });
      assert.equal(r.code, 1, r.output);
      assert.match(r.output, /empty\s+100%/);
    });
  }
});

test("an invisible effect cannot conceal a sky-only frame", async () => {
  const r = await run({ transparentFirst: true });
  assert.equal(r.code, 1, r.output);
  assert.match(r.output, /empty\s+100%/);
});

test("a light overlay or sprite alone is not scenery", async (t) => {
  for (const [name, options] of [
    ["additive glow", { additiveFirst: true }], ["sprite", { spriteFirst: true }],
  ]) {
    await t.test(name, async () => {
      const r = await run(options);
      assert.equal(r.code, 1, r.output);
      assert.match(r.output, /empty\s+100%/);
    });
  }
});

test("a glow does not hide the scenery behind it", async () => {
  const r = await run({ lightBeforeScenery: true });
  assert.equal(r.code, 0, r.output);
  assert.match(r.output, /empty\s+0%/);
});

test("the scene gate refuses incomplete coverage", async (t) => {
  for (const [name, options] of [
    ["no requested pages", { pages: "," }],
    ["page did not open", { openError: true }],
    ["camera unavailable", { noCamera: true }],
    ["page has no stops", { noStops: true }],
    ["stop was not reached", { missed: true }],
  ]) {
    await t.test(name, async () => {
      const r = await run(options);
      assert.equal(r.code, 1, r.output);
      assert.match(r.output, /FAIL|no pages/i);
    });
  }
});
