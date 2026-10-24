/*
 * Three.js renderer for every walkable scene.
 *
 * The lane, authored props, compact far backdrops and sourced `backdrop.world.prims` are all submitted
 * as world-space meshes to one camera and depth buffer. site.js remains the authoring/interaction layer:
 * it supplies each frame's polygons, camera, light values and hit targets, and this file is the only
 * picture there is — the Canvas2D lane painter that used to ride alongside was deleted in round 54
 * (owner ruling), and where WebGL is absent the engine reports "off" and the lane says so in words
 * rather than degrading into a second renderer. Lamps, pools, shadows and wires are Three.js geometry too.
 *
 * Spatial basis, declared once (round 46, from the Mint spatial-contracts §1 review — an
 * experiment showed that a basis left undeclared gets re-invented, wrongly, by every consumer):
 * world units are centimetres with +y up; the lane plane is (x across, depth along); the walker's
 * facing is a yaw in DEGREES whose zero looks down +depth, forward being (sin yaw, cos yaw), and
 * the eye sits at the authored height plus the body's own height and bob. Every mesh reaching this
 * renderer is already in those world centimetres — site.js normalizes once, before submission, and
 * no object re-derives the basis per piece. Screen space is derived, never authored: one projection
 * (projectLanePoint) maps world to canvas for the 2D fallback, camera matrices do it for WebGL.
 *
 * No location, dimensions, labels or scene detail are authored here. This file only turns scene records
 * and per-frame polygons into meshes. Pattern maps are procedural material samples, never invented
 * signage or a replacement for the authored surfaces.
 */

const THREE_VERSION = "0.186.1";
const NIGHT_LAMPS = ["#37c46b", "#e0435c", "#3f7de0", "#b04de0", "#e0a13f"];
const FALLBACK_COLOR = "#46536a";
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function hexRgb(value) {
  const s = String(value || "").trim();
  let m = s.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [70, 83, 106];
}

function blendHex(a, b, amount) {
  const ca = hexRgb(a), cb = hexRgb(b), t = clamp(amount, 0, 1);
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

function colorAlpha(value) {
  const match = String(value || "").match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)$/i);
  return match ? clamp(Number(match[1]), 0, 1) : 1;
}

function pointsFor(p) {
  if (Array.isArray(p.p) && p.p.length >= 3) return p.p.map((v) => [Number(v[0]), Number(v[1]), Number(v[2])]);
  if (Array.isArray(p.q) && p.q.length >= 6) {
    const out = [];
    for (let i = 0; i + 1 < p.q.length; i += 2) out.push([Number(p.q[i]), Number(p.h || 0), Number(p.q[i + 1])]);
    return out;
  }
  return [];
}

function cleanPolygon(points) {
  const out = [];
  for (const p of points) {
    if (!p || p.length < 3 || p.some((n) => !Number.isFinite(n))) continue;
    const last = out[out.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) > 1e-4) out.push(p);
  }
  if (out.length > 3) {
    const a = out[0], b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= 1e-4) out.pop();
  }
  return out;
}

function polygonUV(points, p) {
  if (!p.pat) return points.map(() => [0, 0]);
  // Three.js UVs are normalized: one authored `u` centimetres-per-tile period is 1.0, not
  // 128. The Canvas2D painter expresses this same tile in source pixels, where it uses 128 / u.
  const k = 1 / (Number(p.u) || 1000);
  if (p.ax === "v" && points.length > 1) {
    const [x0, , z0] = points[0], [x1, , z1] = points[1];
    const len = Math.hypot(x1 - x0, z1 - z0) || 1;
    const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
    return points.map(([x, y, z]) => [((x - x0) * ux + (z - z0) * uz) * k, -y * k]);
  }
  const r = (Number(p.rot) || 0) * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r);
  return points.map(([x, , z]) => [(x * cr - z * sr) * k, (x * sr + z * cr) * k]);
}

function triangulate(THREE, points) {
  if (points.length < 3) return [];
  // A world ring can be a ground plane, a vertical cliff, or a wall. Project it by dropping the
  // dominant normal axis; always dropping Y silently discarded every vertical surface.
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  if (Math.max(ax, ay, az) < 1e-5) return [];
  const contour = points.map((p) => new THREE.Vector2(
    ax >= ay && ax >= az ? p[1] : p[0],
    ax >= ay && ax >= az ? p[2] : (ay >= az ? p[2] : p[1]),
  ));
  try {
    const result = THREE.ShapeUtils.triangulateShape(contour, []);
    if (result && result.length) return result;
  } catch (_) { /* A degenerate source ring is omitted rather than guessed. */ }
  return [];
}

function linearColor(THREE, value) {
  const c = new THREE.Color();
  c.set(`#${hexRgb(value).map((v) => v.toString(16).padStart(2, "0")).join("")}`);
  return [c.r, c.g, c.b];
}

function sourceColor(p, state) {
  const day = clamp(Number(state.day) || 0, 0, 1);
  const dayPage = Boolean(state.dayPage);
  const dark = dayPage ? day < 0.25 : true;
  if (p.il && dark) {
    const lamp = NIGHT_LAMPS[Math.floor((Number(state.time) || 0) / 7) % NIGHT_LAMPS.length];
    /* The illumination plays on water; it does not repaint it. A lit sheet returned the lamp
       colour whole, which turned the Horseshoe into a flat amber plane after dark (round 58:
       measured at the rail, the four bands collapsed to one). Water keeps most of its own colour
       and takes the light as a wash, so the bands, the lip and the strands the shader draws all
       survive the night. */
    if (p.t === "w") return blendHex(p.c || FALLBACK_COLOR, lamp, 0.46);
    return lamp;
  }
  if (p.cn && dayPage) return blendHex(p.cn, p.c || FALLBACK_COLOR, day);
  return p.c || FALLBACK_COLOR;
}

/*
 * Pure geometry staging, also used by the Node verification gate. Each sourced flat/textured polygon
 * becomes triangles in world centimetres. The other record verbs stay typed so the browser builder
 * can give water, mist, light, rainbow and the existing night effect their own 3D treatment.
 */
export function buildWorldGeometry(THREE, world) {
  const groups = new Map();
  const water = [], mist = [], rainbows = [], lights = [], fireworks = [];
  const unsupported = new Set();
  let triangles = 0;
  const prims = Array.isArray(world && world.prims) ? world.prims : [];

  for (const p of prims) {
    const type = p.t || "f";
    if (type === "f" || type === "x") {
      const points = cleanPolygon(pointsFor(p));
      const faces = triangulate(THREE, points);
      if (!faces.length) continue;
      const uv = polygonUV(points, p);
      const key = p.pat || "__flat";
      // A color's alpha is an actual source property (foam bands, for example), not a fourth RGB
      // byte. Keep unlike alpha values in separate materials so one transparent surface cannot turn
      // every solid face sharing its texture into a blended mesh. Iron scroll is a transparent tile;
      // its record color is only the fallback/tint, while the tile itself carries the open pattern.
      const opacity = key === "ironscroll" ? 1 : colorAlpha(p.c);
      const batchId = `${key}|${opacity.toFixed(3)}`;
      if (!groups.has(batchId)) groups.set(batchId, {
        key, opacity, positions: [], uvs: [], colors: [], items: [],
      });
      const group = groups.get(batchId);
      const start = group.positions.length / 3;
      const color = linearColor(THREE, p.c || FALLBACK_COLOR);
      for (const face of faces) {
        for (const index of face) {
          const v = points[index], t = uv[index];
          group.positions.push(v[0], v[1], v[2]);
          group.uvs.push(t[0], t[1]);
          group.colors.push(color[0], color[1], color[2]);
        }
      }
      const count = group.positions.length / 3 - start;
      if (count) {
        group.items.push({ start, count, prim: p });
        triangles += count / 3;
      }
    } else if (type === "w") water.push({ prim: p, points: cleanPolygon(pointsFor(p)) });
    else if (type === "m") mist.push(p);
    else if (type === "rb") rainbows.push(p);
    else if (type === "l") lights.push(p);
    else if (type === "fw") fireworks.push(p);
    else unsupported.add(type);
  }
  return { groups: [...groups.values()], water, mist, rainbows, lights, fireworks, unsupported: [...unsupported], triangles };
}

function seeded(name) {
  let seed = 2166136261;
  for (let i = 0; i < name.length; i++) seed = Math.imul(seed ^ name.charCodeAt(i), 16777619);
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function patternCanvas(name) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  // The falling-water tile is drawn at twice the others' size: it is the one material a visitor
  // stands a metre from, and at 128 a single strand was nineteen centimetres of screen.
  canvas.width = canvas.height = name === "fallsw" ? 256 : 128;
  const c = canvas.getContext("2d");
  if (!c) return null;
  const rnd = seeded(name);
  c.fillStyle = "#bcbcbc";
  c.fillRect(0, 0, 128, 128);
  const line = (x1, y1, x2, y2, color, width = 1) => {
    c.strokeStyle = color; c.lineWidth = width;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  };
  const spot = (x, y, r, color) => {
    c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  };
  const noise = (n, lo = 100, span = 80) => {
    for (let i = 0; i < n; i++) {
      const v = Math.round(lo + rnd() * span);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(Math.floor(rnd() * 128), Math.floor(rnd() * 128), 1 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 3));
    }
  };

  if (name === "fallsg") {
    /* Round 60 — the curtain's structure tile, and the end of the flat wall.

       The `fallsw` tile is a transparent strand overlay, so its RGB is white wherever a strand
       touches: sampled as a mask it read 1.0 over almost the whole tile, the sheet's "structure"
       term sat at its maximum, and every metre of the Horseshoe came out the same near-white —
       the 一片平光 the owner kept reporting. This tile is opaque tone data instead: broad columns
       of aerated white, the cold green water between them, medium strands and a grain, each drawn
       twice so the repeat has no seam and each fading along whole periods so it moves. */
    const S = canvas.width;
    c.fillStyle = "rgb(122,122,122)"; c.fillRect(0, 0, S, S);
    let seed = 90211;
    const flow = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const column = (count, wMin, wMax, toneLo, toneHi) => {
      for (let i = 0; i < count; i++) {
        const x = flow() * S, w = wMin + flow() * (wMax - wMin);
        const tone = Math.round(toneLo + flow() * (toneHi - toneLo));
        const waves = 1 + Math.floor(flow() * 2), phase = flow() * Math.PI * 2;
        const g = c.createLinearGradient(0, 0, 0, S);
        for (let k = 0; k <= 12; k++) {
          const f = 0.45 + 0.55 * Math.sin(phase + (k / 12) * waves * Math.PI * 2);
          const v = Math.round(122 + (tone - 122) * f);
          g.addColorStop(k / 12, `rgb(${v},${v},${v})`);
        }
        c.fillStyle = g;
        c.fillRect(x, 0, w, S);
        if (x + w > S) c.fillRect(x - S, 0, w, S);
      }
    };
    column(7, 16, 34, 176, 246);      // the aerated columns the body of it hangs in
    column(22, 4, 11, 150, 236);      // the streams strung between them
    column(9, 7, 18, 52, 96);         // the cold water that shows through
    column(46, 1, 3, 150, 210);       // the grain
  } else if (name === "fallsw") {
    /* The authored material is a transparent overlay: full-height white/dark-green strands that a
       shader scrolls down the sheet. A grey opaque background here turned the Niagara water into a
       striped wall in WebGL.

       Round 58: near the rail this tile is metre-scale, and one width of strand read as paint. A
       curtain of water is at least three widths at once — the broad ropes the body of it hangs in,
       the streams strung between them, and a grain that only exists at arm's length — so the tile
       carries all three, each drawn twice (once shifted half a tile) so the repeat has no seam.
       Every strand fades along whole periods of its own length: that is what makes the loop read
       as water moving rather than as stripes standing still. */
    const S = canvas.width;
    c.clearRect(0, 0, S, S);
    let seed = 35071;
    const flow = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const strand = (count, wMin, wMax, aMin, aMax, periods, dark) => {
      for (let i = 0; i < count; i++) {
        const x = flow() * S, w = wMin + flow() * (wMax - wMin);
        const a = aMin + flow() * (aMax - aMin);
        const waves = 1 + Math.floor(flow() * periods), phase = flow() * Math.PI * 2;
        const gradient = c.createLinearGradient(0, 0, 0, S);
        for (let k = 0; k <= 10; k++) {
          const fade = 0.52 + 0.48 * Math.sin(phase + (k / 10) * waves * Math.PI * 2);
          gradient.addColorStop(k / 10, dark
            ? `rgba(30,80,92,${(a * 0.6 * fade).toFixed(3)})`
            : `rgba(255,255,255,${(a * fade).toFixed(3)})`);
        }
        c.fillStyle = gradient;
        c.fillRect(x, 0, w, S);
        if (x + w > S) c.fillRect(x - S, 0, w, S);
      }
    };
    /* Widths in the tile's own 256 px, and the tile is metres of sheet on the page (the lane maps
       128 units to `DPM` 2 — 64 cm of wall — so a `tileCm` of 900 is a tile every 4.6 m of water).
       The first cut drew thirty ropes a few pixels wide: at twenty metres from the rail that is a
       sub-pixel comb, and a comb averages to a flat wash — which is exactly how the sheet read.
       Water at this distance hangs in ropes a metre across with strands between them. */
    strand(9, 18, 44, 0.10, 0.34, 1, false);          // the ropes the body hangs in
    strand(26, 5, 16, 0.10, 0.40, 2, false);          // the streams between them
    strand(7, 10, 30, 0.10, 0.26, 1, true);           // the green water showing through
    strand(70, 1.2, 3.4, 0.06, 0.22, 2, false);       // the grain at arm's length
  } else if (name === "canopy") {
    /* Round 65: the wooded slope behind the strip, at the distance it is read.

       The tile used to speckle the mass with half-metre spots on a twenty-metre tile, which is
       finer than a pixel at a hundred metres: mipmapping averaged the whole treeline into one
       flat green band behind the shopfronts, and the band was the thing the eye found first. A
       tree crown is two metres across, so the masses are drawn at two metres, with darker
       hollows under them -- at a hundred metres the line still has a texture and still reads as
       trees rather than as a painted wall. */
    c.fillStyle = "#6d6d6d"; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 90; i++) {
      const v = Math.round(70 + rnd() * 150), r = 9 + rnd() * 21;
      spot(rnd() * 128, rnd() * 128, r, `rgb(${v},${v},${v})`);
    }
    for (let i = 0; i < 28; i++) {
      const v = Math.round(34 + rnd() * 44), r = 7 + rnd() * 15;
      spot(rnd() * 128, rnd() * 128, r, `rgb(${v},${v},${v})`);
    }
  } else if (name === "hotelw") {
    /* Round 65: the Fallsview hotels' own wall.

       The hotels were drawn with the shared `towerwin` tile -- a dark grid of bright and dark
       squares on a near-black ground -- which is a slab with no material: measured on the frame
       from the promenade, the towers came out at luma 50-60 against a sky of 75, so they were
       darker than the weather and read as silhouettes rather than as buildings. The hotels on
       the Fallsview side are pale concrete and glass, and this tile is that: a pale ashlar
       ground, one storey to a tile (the record gives the tile the height of a floor), a
       spandrel band at the sill line, and a row of dark windows with a pale reveal under each
       and a mullion down the middle. */
    c.fillStyle = "rgb(174,171,163)"; c.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 16) line(0, y, 128, y, "rgba(96,94,88,0.32)", 1);
    c.fillStyle = "rgb(150,148,142)"; c.fillRect(0, 84, 128, 44);       // the spandrel between storeys
    line(0, 84, 128, 84, "rgba(78,76,72,0.5)", 1);
    for (let x = 4; x < 128; x += 10) {
      c.fillStyle = "rgb(44,48,56)"; c.fillRect(x, 18, 7, 44);          // the window
      c.fillStyle = "rgba(152,168,188,0.32)"; c.fillRect(x + 1, 30, 5, 7);   // the sky in it
      c.fillStyle = "rgb(208,204,195)"; c.fillRect(x, 62, 7, 2);        // the reveal under the sill
      c.fillStyle = "rgba(66,64,60,0.55)"; c.fillRect(x + 3, 18, 1, 44);     // the mullion
    }
    noise(70, 120, 48);
  } else if (name === "towerwin" || name === "cityn") {
    const dark = name === "cityn" ? 52 : 88;
    c.fillStyle = `rgb(${dark},${dark},${dark})`; c.fillRect(0, 0, 128, 128);
    const cellW = name === "cityn" ? 9 : 14, cellH = name === "cityn" ? 12 : 13;
    for (let y = 3, row = 0; y < 128; y += cellH, row++) {
      for (let x = 3, col = 0; x < 128; x += cellW, col++) {
        const v = rnd() < (name === "cityn" ? 0.34 : 0.46) ? 205 + Math.floor(rnd() * 46) : 90 + Math.floor(rnd() * 55);
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(x, y, Math.max(2, cellW - 4), Math.max(2, cellH - 5));
      }
      if (row % 2 === 0) line(0, y + cellH - 1, 128, y + cellH - 1, "rgba(30,30,30,0.5)", 1);
    }
  } else if (name === "trcwall") {
    /* Round 64: the Centre's own wall, not a generic course of stone.

       The record asks for "tall windows, one tile the wall's height", and until now the WebGL tile
       for it was the same masonry every other wall in the world used: courses of blocks and no
       openings at all. The building the visitor walks under was therefore a blank board of stone,
       and the tall windows the record names never reached the screen. This tile is the wall:
       pale ashlar, a base course, a string course between the storeys, and two rows of tall
       windows — arched in the lower storey, square above — dark against the stone. */
    c.fillStyle = "rgb(176,176,176)"; c.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 18) {
      line(0, y, 128, y, "rgba(64,64,64,0.42)", 1);
      let x = (y / 18) % 2 ? -14 : 0;
      while (x < 128) { const w = 22 + Math.floor(rnd() * 26); line(x, y, x, y + 18, "rgba(64,64,64,0.3)", 1); x += w; }
    }
    c.fillStyle = "rgb(146,146,146)"; c.fillRect(0, 120, 128, 8);     // the base course
    c.fillStyle = "rgb(202,202,202)"; c.fillRect(0, 60, 128, 4);      // the string course
    const win = (x, y, w, h, arch) => {
      c.fillStyle = "rgb(56,56,56)";
      c.fillRect(x, y + (arch ? w / 2 : 0), w, h - (arch ? w / 2 : 0));
      if (arch) { c.beginPath(); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.fill(); }
      c.fillStyle = "rgba(150,162,176,0.45)";
      c.fillRect(x + 1, y + h * 0.34, w - 2, Math.max(1, h * 0.14));
      c.fillStyle = "rgb(34,34,34)";
      c.fillRect(x + w / 2 - 0.5, y + (arch ? w / 2 : 2), 1, h - (arch ? w / 2 : 2));
      c.fillRect(x, y + h * 0.62, w, 1);
    };
    win(14, 72, 22, 46, true); win(53, 72, 22, 46, true); win(92, 72, 22, 46, true);
    win(16, 18, 18, 34, false); win(55, 18, 18, 34, false); win(94, 18, 18, 34, false);
    noise(90, 150, 58);
  } else if (name === "stonewall" || name === "strata" || name === "tunnelc") {
    const step = name === "strata" ? 13 : 18;
    for (let y = 0, row = 0; y < 128; y += step, row++) {
      const v = 133 + Math.floor(rnd() * 48);
      c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, 128, step - 1);
      let x = row % 2 ? -16 : 0;
      while (x < 128) {
        const w = 24 + Math.floor(rnd() * 31);
        line(x, y, x, y + step, "rgba(48,48,48,0.42)", 1);
        if (name === "stonewall") {
          line(x + 2, y + step - 3, x + w - 4, y + step - 3, "rgba(232,232,232,0.18)", 1);
        }
        x += w;
      }
      if (name === "strata") line(0, y + 2, 128, y + 2, "rgba(235,235,235,0.23)", 1);
    }
    noise(85, 118, 78);
  } else if (name === "rapids" || name === "foam") {
    c.fillStyle = name === "foam" ? "#9e9e9e" : "#777777"; c.fillRect(0, 0, 128, 128);
    for (let y = 2; y < 128; y += name === "foam" ? 9 : 7) {
      const v = 145 + Math.floor(rnd() * 95);
      line(0, y, 128, y + (rnd() - 0.5) * 4, `rgba(${v},${v},${v},${name === "foam" ? 0.48 : 0.36})`, 1 + rnd() * 2);
    }
    for (let i = 0; i < (name === "foam" ? 165 : 76); i++) {
      spot(rnd() * 128, rnd() * 128, 0.7 + rnd() * 2.4, `rgba(240,240,240,${0.18 + rnd() * 0.4})`);
    }
  } else if (name === "ironscroll") {
    // Match the authored open iron tile: transparent between the rails and rings, so the gorge stays
    // visible through the parapet instead of receiving an opaque grey mesh.
    c.clearRect(0, 0, 128, 128);
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 128, 11); c.fillRect(0, 117, 128, 11);
    c.fillRect(0, 0, 8, 128);
    c.fillRect(64, 11, 7, 15); c.fillRect(64, 102, 7, 15);
    c.fillRect(8, 61, 20, 7); c.fillRect(107, 61, 21, 7);
    c.strokeStyle = "#ffffff"; c.lineWidth = 7;
    c.beginPath(); c.arc(67.5, 64, 38, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 5;
    c.beginPath(); c.arc(67.5, 64, 19, Math.PI * 0.3, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(67.5, 64, 5, 0, Math.PI * 2); c.fill();
  } else {
    noise(220, 112, 92);
  }
  return canvas;
}

function makeTexture(THREE, name, renderer) {
  const canvas = patternCanvas(name);
  if (!canvas) return null;
  const texture = new THREE.CanvasTexture(canvas);
  // The falls shader reads the tile as a mask/tone data source. Other canvases are authored in sRGB
  // display colors and use Three's normal color-space conversion.
  texture.colorSpace = name === "fallsw" || name === "fallsg" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (renderer && renderer.capabilities) texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function setGeometry(THREE, data, dynamic = false) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
  if (data.uvs && data.uvs.length) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(data.uvs, 2));
  if (data.colors && data.colors.length) geometry.setAttribute("color", new THREE.Float32BufferAttribute(data.colors, 3));
  if (data.indices && data.indices.length) geometry.setIndex(data.indices);
  if (dynamic) {
    const position = geometry.getAttribute("position");
    if (position) position.setUsage(THREE.DynamicDrawUsage);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

const laneTextureIds = new WeakMap();
let laneTextureSerial = 0;
const laneAlphaCache = new WeakMap();

function laneObjectId(value) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) return "none";
  let id = laneTextureIds.get(value);
  if (!id) { id = `source-${++laneTextureSerial}`; laneTextureIds.set(value, id); }
  return id;
}

function laneColor(THREE, value) {
  const text = String(value || FALLBACK_COLOR).trim();
  const rgb = text.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  const color = new THREE.Color();
  if (rgb) color.setRGB(Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255, THREE.SRGBColorSpace);
  else if (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(text)) color.set(text);
  else {
    try { color.setStyle(text, THREE.SRGBColorSpace); }
    catch (_) { color.set(FALLBACK_COLOR); }
  }
  return { rgb: [color.r, color.g, color.b], alpha: rgb && rgb[4] !== undefined ? clamp(Number(rgb[4]), 0, 1) : 1 };
}

function laneTextureHasAlpha(source) {
  if (!source || typeof source !== "object") return false;
  const cached = laneAlphaCache.get(source);
  if (cached !== undefined) return cached;
  let alpha = true;
  try {
    const context = typeof source.getContext === "function" && source.getContext("2d");
    if (context && source.width && source.height) {
      const pixels = context.getImageData(0, 0, source.width, source.height).data;
      alpha = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) { alpha = true; break; }
      }
    }
  } catch (_) { alpha = true; }
  laneAlphaCache.set(source, alpha);
  return alpha;
}

function projectLanePoint(point, state) {
  const camera = state.camera || {};
  const dx = point[0] - (Number(camera.x) || 0), dz = point[2] - (Number(camera.z) || 0);
  const sy = Number(camera.sy) || 0, cy = Number.isFinite(Number(camera.cy)) ? Number(camera.cy) : 1;
  const sp = Number(camera.sp) || 0, cp = Number.isFinite(Number(camera.cp)) ? Number(camera.cp) : 1;
  const x = dx * cy - dz * sy, az = dx * sy + dz * cy, ay = (Number(camera.eye) || 0) - point[1];
  const y = ay * cp - az * sp, z = az * cp + ay * sp;
  if (z <= 1e-4) return [0.5, 0.5];
  const width = Math.max(1, Number(state.width) || 1), height = Math.max(1, Number(state.height) || 1);
  const focal = Math.max(1, Number(state.focal) || 1);
  const sx = width * 0.5 + focal * x / z, syScreen = height * 0.5 + focal * y / z;
  return [sx, syScreen];
}

/* The lane painter already emits each surface as a world-space polygon. This staging step keeps those
   exact corners, UVs, dynamic colors, opacity, and light values, then submits triangles to one mesh
   per material instead of flattening the scene to the Canvas2D projection. */
export function buildLaneGeometry(THREE, quads, state = {}) {
  const groups = new Map();
  let triangles = 0, quadCount = 0;
  const day = clamp(Number(state.day) || 0, 0, 1);
  // The floor the night fold may darken a surface down to, as a fraction toward the murk navy.
  // Round 49 raised the floor (0.5/0.72 -> 0.40/0.58) under the owner's ruling that a night the
  // visitor asked for must read as a picture, measured on the composited frame — the painter's own
  // 2D night keeps its full lift; the lit path now matches its legibility, not an invented brightness.
  const night = clamp((Number(state.night) || 0) * 0.40, 0, 0.58);
  const dayPage = Boolean(state.dayPage);
  const fogMax = clamp(state.fogMax === undefined ? 0.6 : Number(state.fogMax), 0, 0.6);
  const dayGain = Number.isFinite(Number(state.dayGain)) ? Number(state.dayGain) : 1;
  const sourceQuads = Array.isArray(quads) ? quads : [];

  for (const q of sourceQuads) {
    if (!q || !Array.isArray(q.world) || q.world.length < 3) continue;
    const points = [], texcoords = [];
    for (let i = 0; i < q.world.length; i++) {
      const p = q.world[i];
      if (!Array.isArray(p) || p.length < 3 || !p.slice(0, 3).every(Number.isFinite)) continue;
      const last = points[points.length - 1];
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) <= 1e-5) continue;
      points.push([p[0], p[1], p[2]]);
      const uv = Array.isArray(q.uv) && Array.isArray(q.uv[i]) ? q.uv[i] : [0, 0];
      texcoords.push([Number(uv[0]) || 0, Number(uv[1]) || 0]);
    }
    if (points.length > 3 && Math.hypot(points[0][0] - points[points.length - 1][0],
        points[0][1] - points[points.length - 1][1], points[0][2] - points[points.length - 1][2]) <= 1e-5) {
      points.pop(); texcoords.pop();
    }
    if (points.length < 3) continue;

    const textureSource = q.mode === "pat" && q.textureSource ? q.textureSource : null;
    const image = q.mode === "pic" && q.img && q.img.complete && q.img.naturalWidth ? q.img : null;
    const soft = q.soft && typeof q.soft === "object" ? q.soft : null;
    const textureKind = soft ? "soft" : textureSource ? "pattern" : image ? "image" : "flat";
    const textureKey = textureKind === "pattern"
      ? (q.textureKey || laneObjectId(textureSource))
      : textureKind === "image" ? (q.imageKey || laneObjectId(image))
        : textureKind === "soft" ? "radial-soft" : "flat";

    let colorText = "#ffffff";
    if (soft) colorText = `rgb(${soft.rgb || "238,244,247"})`;
    else if (textureKind === "flat") {
      if (q.mode === "flat") colorText = q.arg;
      else colorText = q.fallback || FALLBACK_COLOR;
    }
    const color = laneColor(THREE, colorText);
    const alpha = clamp(color.alpha * (q.alpha === undefined ? 1 : Number(q.alpha) || 0)
      * (soft ? clamp(Number(soft.a) || 0, 0, 1) : 1), 0, 1);
    const texturedAlpha = textureKind === "pattern" ? laneTextureHasAlpha(textureSource) : textureKind === "image" || textureKind === "soft";
    const transparent = alpha < 0.999 || texturedAlpha;
    const key = `${textureKind}:${textureKey}|${transparent ? "blend" : "solid"}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, textureKey, textureKind, textureSource, image,
        transparent, positions: [], uvs: [], colors: [], opacities: [],
        lights: [], air: [], darkness: [], daylight: [], quads: 0, triangles: 0 };
      groups.set(key, group);
    }

    let uvForPoint;
    if (textureKind === "pattern") {
      uvForPoint = (i) => [texcoords[i][0] / 128, texcoords[i][1] / 128];
    } else if (textureKind === "image") {
      const iw = Math.max(1, Number(image.naturalWidth) || 1), ih = Math.max(1, Number(image.naturalHeight) || 1);
      uvForPoint = (i) => [texcoords[i][0] / iw, -texcoords[i][1] / ih];
    } else if (textureKind === "soft") {
      /* Round 58: a soft quad is a puff, and a puff's radial falloff belongs to the puff.
         This used to project each corner to the screen and divide by a radius in *pixels*, so a
         spray plume 25 m across the gorge was measured against a radius of 1 and sampled the same
         texel everywhere — a flat pale wash over the whole frame, which is what the falls looked
         like from Terrapin Point. The corners of the quad are its own edges now: 0.5 in the middle,
         nothing at the rim, whatever size the mist is. */
      const n = points.length;
      uvForPoint = (i) => {
        if (n === 4) return [[0, 1], [1, 1], [1, 0], [0, 0]][i] || [0.5, 0.5];
        const a = (i / Math.max(1, n)) * Math.PI * 2;
        return [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)];
      };
    } else uvForPoint = () => [0, 0];

    const air = q.air === undefined
      ? clamp((Number(q.z) - 420) / 2450, 0, 1) * fogMax * (dayPage ? 1 - 0.62 * day : 1)
      : clamp(Number(q.air) || 0, 0, 0.6);
    const lit = Number(q.lit) || 0;
    const isNoLight = Boolean(q.nolite);
    const darkness = isNoLight ? 0 : night;
    const sun = q.day === false || isNoLight ? 0
      : day * dayGain * (q.daygain === undefined ? 1 : Number(q.daygain));
    const faces = triangulate(THREE, points);
    if (!faces.length) continue;
    for (const face of faces) {
      for (const index of face) {
        const p = points[index], uv = uvForPoint(index);
        group.positions.push(p[0], p[1], p[2]);
        group.uvs.push(uv[0], uv[1]);
        group.colors.push(color.rgb[0], color.rgb[1], color.rgb[2]);
        group.opacities.push(alpha);
        group.lights.push(lit);
        group.air.push(air);
        group.darkness.push(darkness);
        group.daylight.push(sun);
      }
      group.triangles++;
      triangles++;
    }
    group.quads++;
    quadCount++;
  }
  return { groups: [...groups.values()], triangles, quads: quadCount };
}

function laneShaderMaterial(THREE, map, transparent) {
  const material = new THREE.MeshStandardMaterial({
    map: map || null, vertexColors: true, side: THREE.DoubleSide, transparent,
    depthWrite: !transparent, depthTest: true, fog: false, flatShading: true,
    roughness: 0.92, metalness: 0, envMapIntensity: 0.45,
    // the same self-lit murk floor the surveyed batches carry — halls paint their tiles through
    // lane quads, and an interior's light must not depend on the sky outside a sky it never has
    emissive: new THREE.Color(0x16223c), emissiveIntensity: 0,
  });
  material.userData.nightGlow = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLaneWarm = { value: new THREE.Color("#ffe4ba") };
    shader.uniforms.uLaneNight = { value: new THREE.Color("#16223c") };
    shader.uniforms.uLaneSun = { value: new THREE.Color("#928874") };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float aOpacity; attribute float aLit; attribute float aAir;
        attribute float aDarkness; attribute float aDaylight;
        varying float vLaneOpacity; varying float vLaneLit; varying float vLaneAir;
        varying float vLaneDarkness; varying float vLaneDaylight;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vLaneOpacity=aOpacity; vLaneLit=aLit; vLaneAir=aAir;
        vLaneDarkness=aDarkness; vLaneDaylight=aDaylight;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform vec3 uLaneWarm; uniform vec3 uLaneNight; uniform vec3 uLaneSun;
        varying float vLaneOpacity; varying float vLaneLit; varying float vLaneAir;
        varying float vLaneDarkness; varying float vLaneDaylight;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float laneWarm=clamp(vLaneLit-0.55,0.0,1.15)*0.24;
        float laneDark=min(0.62,1.0-(1.0-clamp(vLaneAir,0.0,0.6))*(1.0-clamp(vLaneDarkness,0.0,0.58)));
        diffuseColor.rgb=mix(diffuseColor.rgb,uLaneWarm,laneWarm);
        diffuseColor.rgb=mix(diffuseColor.rgb,uLaneNight,laneDark);
        /* Round 63: the sun multiplies, it does not add.
           This was an add of uLaneSun * daylight * 0.62 — a constant on every lane surface, which
           is why a grey paver (0.44 albedo) came out at 0.81: the lift was bigger than the surface's
           own value, so the plaza, the shopfronts and the falls' mist all drifted to the same pale
           cream and the whole district read as one washed field. Sunlight on a surface is its own
           colour times the light, never plus a colour; multiplying keeps the paving dark and the
           cream walls cream, and it is the same fix the round-58 mist needed. */
        diffuseColor.rgb*=1.0+max(0.0,vLaneDaylight)*0.62;
        /* Round 65: the murk floor is the surface's own texture, tinted -- not a flat wash.

           The night added the murk navy as a constant, so every surface in the lane got the
           same amount of light added on top of it: the promenade's paving, whose joints are a
           few per cent of its own value, was drowned by them and the ground read as one flat
           navy field (measured: 33,61,119, no structure anywhere in it). The murk now carries
           the surface's own value into the tint, so the paving's joints survive the night the
           way a street's joints do under its lamps, and the flat part of the floor is no
           brighter than it was. */
        float murkK=min(0.62,vLaneDarkness);
        float murkTex=clamp(dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722))*2.2,0.0,1.0);
        diffuseColor.rgb+=uLaneNight*murkK*3.2*murkTex;
        diffuseColor.a*=clamp(vLaneOpacity,0.0,1.0);
`);
  };
  material.customProgramCacheKey = () => "huaxu-walk-lane-v1";
  material.userData.huaxuWalkLane = true;
  return material;
}

function softLaneTexture(THREE) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.62)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function updateLaneMesh(THREE, mesh, data) {
  const vertexCount = data.positions.length / 3;
  if (!vertexCount) { mesh.geometry.setDrawRange(0, 0); mesh.visible = false; return; }
  let geometry = mesh.geometry;
  let capacity = geometry.userData.vertexCapacity || 0;
  if (capacity < vertexCount) {
    capacity = Math.max(256, 2 ** Math.ceil(Math.log2(vertexCount)));
    const next = new THREE.BufferGeometry();
    const attributes = [
      ["position", 3], ["uv", 2], ["color", 3], ["aOpacity", 1], ["aLit", 1],
      ["aAir", 1], ["aDarkness", 1], ["aDaylight", 1],
    ];
    for (const [name, itemSize] of attributes) {
      const attribute = new THREE.BufferAttribute(new Float32Array(capacity * itemSize), itemSize);
      attribute.setUsage(THREE.DynamicDrawUsage);
      next.setAttribute(name, attribute);
    }
    next.userData.vertexCapacity = capacity;
    if (geometry) geometry.dispose();
    mesh.geometry = geometry = next;
  }
  const attributes = [
    ["position", data.positions], ["uv", data.uvs], ["color", data.colors], ["aOpacity", data.opacities],
    ["aLit", data.lights], ["aAir", data.air], ["aDarkness", data.darkness], ["aDaylight", data.daylight],
  ];
  for (const [name, values] of attributes) {
    const attribute = geometry.getAttribute(name);
    attribute.array.set(values);
    attribute.needsUpdate = true;
  }
  geometry.setDrawRange(0, vertexCount);
  mesh.visible = true;
}

function updateColorAttribute(THREE, geometry, items, state) {
  const attr = geometry.getAttribute("color");
  if (!attr) return;
  const a = attr.array;
  for (const item of items) {
    const c = linearColor(THREE, sourceColor(item.prim, state));
    const end = item.start + item.count;
    for (let i = item.start; i < end; i++) {
      const j = i * 3;
      a[j] = c[0]; a[j + 1] = c[1]; a[j + 2] = c[2];
    }
  }
  attr.needsUpdate = true;
}

export function buildWaterGeometry(THREE, data) {
  const positions = [], uvs = [], colors = [], opacities = [], fallProgress = [], indices = [], items = [];
  // Each authored waterfall quad is already a measured four-corner sheet. The fall gradient and
  // streaks are fragment-shader work; subdividing every sheet into hundreds of extra quads only
  // repeats that shader and makes a headless GPU crawl without adding sourced shape.
  const across = 1, down = 1;
  const bands = new Map();
  for (const item of data.water) {
    if (item.prim.pat !== "fallsw") continue;
    const value = clamp(Number(item.prim.pa) || 0, 0, 1).toFixed(3);
    if (!bands.has(value)) bands.set(value, item.prim);
  }
  const bandValues = [...bands.keys()].map(Number).sort((a, b) => a - b);
  const bandIndex = new Map(bandValues.map((value, index) => [value.toFixed(3), index]));
  const cuts = bandValues.length === 4 ? [0, 0.05, 0.15, 0.42, 1]
    : Array.from({ length: bandValues.length + 1 }, (_, i) => i / Math.max(1, bandValues.length));
  const bandPrims = bandValues.map((value) => bands.get(value.toFixed(3)));
  for (const { prim, points } of data.water) {
    if (points.length !== 4) continue;
    const [tl, tr, br, bl] = points;
    const start = positions.length / 3;
    const baseColor = linearColor(THREE, prim.c || "#3f9c8a");
    const acrossLength = Math.hypot(tr[0] - tl[0], tr[2] - tl[2]) || 1;
    const ux = (tr[0] - tl[0]) / acrossLength, uz = (tr[2] - tl[2]) / acrossLength;
    const texScale = 1 / (Number(prim.u) || 1000);
    const opacity = clamp(prim.pa === undefined ? 1 : Number(prim.pa), 0, 1);
    const b = prim.pat === "fallsw" ? (bandIndex.get(clamp(Number(prim.pa) || 0, 0, 1).toFixed(3)) ?? -1) : -1;
    for (let y = 0; y <= down; y++) {
      const v = y / down;
      const progress = b < 0 ? -1 : cuts[b] + v * (cuts[b + 1] - cuts[b]);
      for (let x = 0; x <= across; x++) {
        const u = x / across;
        const lx = tl[0] + (bl[0] - tl[0]) * v, ly = tl[1] + (bl[1] - tl[1]) * v, lz = tl[2] + (bl[2] - tl[2]) * v;
        const rx = tr[0] + (br[0] - tr[0]) * v, ry = tr[1] + (br[1] - tr[1]) * v, rz = tr[2] + (br[2] - tr[2]) * v;
        const px = lx + (rx - lx) * u, py = ly + (ry - ly) * u, pz = lz + (rz - lz) * u;
        positions.push(px, py, pz);
        // Use the record's centimetres-per-tile and the world-space height, not 0..1 for every
        // three-metre panel. This keeps water grain fine, aligned and continuous across the curve.
        // The tangent may turn a little from cell to cell; anchoring it in world coordinates prevents
        // the exact repeated stripe that the previous per-panel UV reset produced.
        uvs.push((px * ux + pz * uz) * texScale, -py * texScale);
        colors.push(baseColor[0], baseColor[1], baseColor[2]);
        opacities.push(opacity);
        fallProgress.push(progress);
      }
    }
    for (let y = 0; y < down; y++) {
      for (let x = 0; x < across; x++) {
        const a = start + y * (across + 1) + x;
        const b = a + 1, d = a + across + 1, c = d + 1;
        indices.push(a, d, b, b, d, c);
      }
    }
    items.push({ start, count: positions.length / 3 - start, prim });
  }
  return { positions, uvs, colors, opacities, fallProgress, indices, items, bandPrims,
    subdivisions: { across, down } };
}

function cloudTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const c = canvas.getContext("2d");
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  /* A soft core and a long, quiet tail. The old ramp reached 0.46 in the middle, which stacked to
     an opaque lid wherever puffs overlapped; a spray cloud is mostly thin. */
  /* Round 60 — 沒有霧, and the arithmetic of it: a 0.30 core times a 0.19 per-puff alpha is five
     per cent, so the plume that was authored over the Horseshoe painted nothing the eye could find.
     The density belongs in the puff's own alpha, where the count and the falloff can be reasoned
     about; the tile only has to be a round cloud with a soft edge. */
  g.addColorStop(0, "rgba(255,255,255,0.62)");
  g.addColorStop(0.28, "rgba(255,255,255,0.40)");
  g.addColorStop(0.60, "rgba(255,255,255,0.15)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeClouds(THREE, scene, prims) {
  const descriptors = [];
  for (const p of prims) {
    const [ox, oy, oz] = p.o || [0, 0, 0];
    const count = Math.max(1, Math.min(16, p.np || 9));
    for (let k = 0; k < count; k++) {
      const f = count === 1 ? 0 : k / (count - 1);
      /* Round 59: a puff is a puff, not a screen.

         Size used to be 0.32-0.54 of the authored width, so a plume authored 84 m wide drew
         billboards 27-45 m in radius — one of them covered half the frame at the Table Rock rail,
         and three of them, each with the same radial falloff, stacked into the flat beige wall with
         diagonal stripes that stood between the promenade and the gorge. Round 58's lesson for the
         falls applies to its spray: what is *drawn* has to be smaller than what it stands for, and
         the whole comes from many small puffs rather than from one big gradient. */
      descriptors.push({ p, k, count, f, ox, oy, oz, size: (p.w || 1000) * (0.15 + 0.11 * f) });
    }
  }
  if (!descriptors.length) return null;
  const positions = new Float32Array(descriptors.length * 4 * 3);
  const uvs = new Float32Array(descriptors.length * 4 * 2);
  const colors = new Float32Array(descriptors.length * 4 * 4);
  const indices = [];
  for (let i = 0; i < descriptors.length; i++) {
    const b = i * 4;
    uvs.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: { uCloud: { value: cloudTexture(THREE) } },
    vertexShader: `attribute vec4 aColor; varying vec2 vUv; varying vec4 vColor;
      void main(){ vUv=uv; vColor=aColor; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D uCloud; varying vec2 vUv; varying vec4 vColor;
      void main(){ vec4 tex=texture2D(uCloud,vUv); gl_FragColor=vec4(vColor.rgb, tex.a*vColor.a); }`,
    // depthTest off, deliberately: spray is overlay-grade. The sheet it rises from and the deck it
    // crosses are opaque writers that render first, so a depth-tested billboard anchored behind them
    // is clipped to nothing — measured in round 43 (a full record set, 0.3/255 of visible change).
    // The veil over the rail is the whole effect, and renderOrder 2 still puts it after the water and
    // before the rainbow.
    /* Round 59: depth-tested after all.

       The note above is right about *order* and wrong about *depth*: `depthTest: false` on an
       overlay drawn after the world means the Horseshoe's plume — 400 m out, spread over the whole
       bowl — paints over the parapet, the deck and the near bank alike, and from the Table Rock
       rail the gorge came out one flat pale wash with the rail's own coping showing through it.
       Writing no depth but *testing* it keeps the veil in front of the sheet it rises from and stops
       it covering what is nearer than it is. */
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "surveyed spray billboards";
  mesh.renderOrder = 2;
  scene.add(mesh);
  return { geometry, descriptors };
}

function makeRainbows(THREE, scene, prims) {
  const positions = [], colors = [], indices = [], items = [];
  const bands = [[255, 110, 100, 0.16], [255, 206, 110, 0.16], [140, 220, 140, 0.15], [130, 180, 255, 0.18]];
  for (const p of prims) {
    const [ox, oy, oz] = p.o || [0, 0, 0], r = Number(p.r) || 1000;
    const nx = Number(p.ux) || 0, nz = Number(p.uz) || 1, segments = 14;
    const start = indices.length;
    for (let band = 0; band < bands.length; band++) {
      const [cr, cg, cb, ca] = bands[band];
      const r0 = r * (1 - band * 0.035), r1 = r0 - r * 0.035;
      const first = positions.length / 3;
      for (let a = 0; a <= segments; a++) {
        const t = 0.22 * Math.PI + (0.56 * Math.PI * a) / segments;
        for (const rr of [r0, r1]) {
          positions.push(ox + nx * Math.cos(t) * rr, oy + Math.sin(t) * rr, oz + nz * Math.cos(t) * rr);
          colors.push(cr / 255, cg / 255, cb / 255, ca * Math.sin(Math.PI * a / segments));
        }
      }
      for (let a = 0; a < segments; a++) {
        const q = first + a * 2;
        indices.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
      }
      items.push(p);
    }
    if (indices.length === start) continue;
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.ShaderMaterial({
    vertexShader: `attribute vec4 aColor; varying vec4 vColor; void main(){ vColor=aColor; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec4 vColor; void main(){ gl_FragColor=vColor; }`,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "recorded spray rainbow";
  mesh.renderOrder = 3;
  scene.add(mesh);
  return { mesh, items };
}

function makeLights(THREE, scene, prims) {
  const positions = [], colors = [];
  for (const p of prims) {
    const c = linearColor(THREE, p.c || "#ffd9a0");
    for (const xyz of p.pts || []) {
      positions.push(Number(xyz[0]), Number(xyz[1]), Number(xyz[2]));
      colors.push(...c);
    }
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  points.name = "sourced distant lights";
  points.renderOrder = 1;
  scene.add(points);
  return points;
}

function makeFireworks(THREE, scene, prims) {
  if (!prims.length) return null;
  const positions = new Float32Array(prims.length * 24 * 3);
  const colors = new Float32Array(prims.length * 24 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.85, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  points.name = "authored night bursts";
  points.renderOrder = 4;
  scene.add(points);
  return { geometry, prims };
}

function skyColorAt(stops, elevation, dayPage, day) {
  const ss = (Array.isArray(stops) ? stops : []).filter((s) => s && Number.isFinite(Number(s.e)) && s.c)
    .slice().sort((a, b) => Number(a.e) - Number(b.e));
  if (!ss.length) return FALLBACK_COLOR;
  let lo = ss[0], hi = ss[ss.length - 1];
  for (let i = 0; i < ss.length - 1; i++) {
    if (elevation >= ss[i].e && elevation <= ss[i + 1].e) { lo = ss[i]; hi = ss[i + 1]; break; }
    if (elevation < ss[i].e) { lo = hi = ss[i]; break; }
  }
  let amount = 0;
  if (hi !== lo) amount = clamp((elevation - lo.e) / (hi.e - lo.e), 0, 1);
  let a = lo.n && dayPage ? blendHex(lo.n, lo.c, day) : (lo.n && !dayPage ? lo.n : lo.c);
  let b = hi.n && dayPage ? blendHex(hi.n, hi.c, day) : (hi.n && !dayPage ? hi.n : hi.c);
  return blendHex(a || FALLBACK_COLOR, b || FALLBACK_COLOR, amount);
}

function backdropSkyStops(backdrop, dayPage, day) {
  backdrop = backdrop || {};
  const stops = backdrop.skyAround && Array.isArray(backdrop.skyAround.stops) ? backdrop.skyAround.stops : [];
  if (stops.length || !backdrop.skyGradient || !Array.isArray(backdrop.sky)) return stops;
  // The hub street's authored sky is a continuous height gradient rather than an equirectangular
  // colour table. Its far-plane heights map to elevation angles at the authored 120 m horizon.
  const dayColor = (hex, gain) => dayPage && day > 0.01
    ? blendHex(hex, blendHex(hex, "#d3e3f4", 0.62), day * gain) : hex;
  return backdrop.sky.map((band) => ({
    e: Math.atan2(((Number(band.y0) + Number(band.y1)) * 0.5) - 168, 120000) * 180 / Math.PI,
    c: dayColor(band.c || FALLBACK_COLOR, 0.8 + 0.12 * (Number(band.glow) || 0)),
  }));
}

function makeSkyEnvironment(THREE, renderer, backdrop, dayPage, day) {
  if (typeof document === "undefined" || !renderer || !THREE.PMREMGenerator) return null;
  const stops = backdropSkyStops(backdrop || {}, dayPage, day);
  if (!stops.length) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 128;   // azimuth is uniform; only the elevation axis carries data
  const c = canvas.getContext("2d");
  if (!c) return null;
  for (let y = 0; y < canvas.height; y++) {
    const elevation = 90 - (180 * y) / (canvas.height - 1);
    c.fillStyle = skyColorAt(stops, elevation, dayPage, day);
    c.fillRect(0, y, canvas.width, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.NoColorSpace;   // the site's own convention (see buildRenderer): display
                                             // values are the working space; a decode here would dim the
                                             // reflections against the very sky they were sampled from
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
    texture.dispose();
    return env;
  } catch (e) {
    texture.dispose();
    return null;   // no environment is a worse-looking but complete scene; a throw is not
  }
}

function makeSkyTexture(THREE, backdrop, dayPage, day) {
  backdrop = backdrop || {};
  if (typeof document === "undefined") return new THREE.Color(FALLBACK_COLOR);
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const c = canvas.getContext("2d");
  const stops = backdropSkyStops(backdrop, dayPage, day);
  if (!c || !stops.length) return new THREE.Color(FALLBACK_COLOR);
  for (let y = 0; y < canvas.height; y++) {
    const elevation = 90 - (180 * y) / (canvas.height - 1);
    c.fillStyle = skyColorAt(stops, elevation, dayPage, day);
    c.fillRect(0, y, canvas.width, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function updateClouds(THREE, clouds, camera, state, reducedMotion) {
  if (!clouds) return;
  const { geometry, descriptors } = clouds;
  const pos = geometry.getAttribute("position");
  const col = geometry.getAttribute("aColor");
  const yaw = Math.atan2(camera.sy, camera.cy);
  const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3(rightX, 0, rightZ);
  const p = new THREE.Vector3();
  const rgb = new THREE.Color();
  for (let i = 0; i < descriptors.length; i++) {
    const d = descriptors[i], prim = d.p;
    const { k, f, count, ox, oy, oz, size } = d;
    const drift = reducedMotion ? 0 : Math.sin(state.time * 0.3 + k) * (prim.w || 1000) * 0.03;
    const side = (k % 2 ? 1 : -1) * (prim.w || 1000) * 0.08 + drift;
    const centerX = ox + rightX * side, centerY = oy + (prim.h || 1000) * (0.18 + 0.7 * f), centerZ = oz + rightZ * side;
    const r = size, ry = r * 0.62;
    const vi = i * 4, xyz = [
      [centerX - right.x * r - up.x * ry, centerY - right.y * r - up.y * ry, centerZ - right.z * r - up.z * ry],
      [centerX + right.x * r - up.x * ry, centerY + right.y * r - up.y * ry, centerZ + right.z * r - up.z * ry],
      [centerX + right.x * r + up.x * ry, centerY + right.y * r + up.y * ry, centerZ + right.z * r + up.z * ry],
      [centerX - right.x * r + up.x * ry, centerY - right.y * r + up.y * ry, centerZ - right.z * r + up.z * ry],
    ];
    for (let q = 0; q < 4; q++) pos.setXYZ(vi + q, xyz[q][0], xyz[q][1], xyz[q][2]);
    const dark = state.dayPage ? state.day < 0.25 : true;
    /* Round 60: the plume takes the lamps the way the sheet does — half of them. The illumination
       plays on the spray; it does not turn the cloud over the Horseshoe into a purple object, which
       is what a full lamp colour did at 3 a.m. on a still frame. */
    const tint = prim.il && dark ? NIGHT_LAMPS[Math.floor((state.time || 0) / 7) % NIGHT_LAMPS.length] : "#eef4f7";
    rgb.set("#eef4f7");
    if (prim.il && dark) rgb.lerp(new THREE.Color(tint), 0.55);
    /* Each puff is weaker than before because there are three times as many of them; the plume's
       density comes from the count, the way it does in the photographs. */
    const alpha = Math.min(1, (Number(prim.al) || 0.3) * 2.3) * (1 - 0.50 * f) * (prim.il && dark ? 0.5 : 1);
    for (let q = 0; q < 4; q++) col.setXYZW(vi + q, rgb.r, rgb.g, rgb.b, alpha);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function updateFireworks(THREE, fireworks, state, reducedMotion) {
  if (!fireworks) return;
  const { geometry, prims } = fireworks, pos = geometry.getAttribute("position"), col = geometry.getAttribute("color");
  const time = reducedMotion ? 0 : state.time;
  let index = 0;
  for (let pi = 0; pi < prims.length; pi++) {
    const p = prims[pi], [ox, oy, oz] = p.o || [0, 0, 0], r = Number(p.r) || 1000;
    for (let burst = 0; burst < 3; burst++) {
      const phase = [0, 2.1, 4.2][burst], life = Math.max(0, Math.sin(time * 0.45 + phase));
      const color = new THREE.Color(NIGHT_LAMPS[(burst * 2 + 1) % NIGHT_LAMPS.length]);
      const cx = ox + (burst - 1) * r * 0.4, cy = oy + (0.9 + burst * 0.12) * r, cz = oz;
      for (let k = 0; k < 8; k++, index++) {
        const angle = (k / 8) * Math.PI * 2;
        const radius = r * (0.12 + life * 0.3);
        const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius * 0.8, z = cz;
        pos.setXYZ(index, life > 0.05 ? x : x, life > 0.05 ? y : -1e7, z);
        col.setXYZ(index, color.r, color.g, color.b);
      }
    }
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  geometry.computeBoundingSphere();
  const dark = state.dayPage && state.day < 0.25;
  fireworks.geometry.attributes.position.needsUpdate = true;
  fireworks.geometry.userData.active = dark;
  if (fireworks.geometry.userData.object) fireworks.geometry.userData.object.visible = dark;
}

function effectMaskTexture(THREE, draw) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  draw(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function effectTextures(THREE) {
  const radial = effectMaskTexture(THREE, (context) => {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.66)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  });
  const beam = effectMaskTexture(THREE, (context) => {
    const vertical = context.createLinearGradient(0, 0, 0, 128);
    vertical.addColorStop(0, "rgba(255,255,255,0.55)");
    vertical.addColorStop(0.46, "rgba(255,255,255,0.22)");
    vertical.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = vertical; context.fillRect(0, 0, 128, 128);
    context.globalCompositeOperation = "destination-in";
    const across = context.createLinearGradient(0, 0, 128, 0);
    across.addColorStop(0, "rgba(255,255,255,0)");
    across.addColorStop(0.5, "rgba(255,255,255,1)");
    across.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = across; context.fillRect(0, 0, 128, 128);
  });
  const spill = effectMaskTexture(THREE, (context) => {
    const along = context.createLinearGradient(0, 0, 0, 128);
    along.addColorStop(0, "rgba(255,255,255,0.96)");
    along.addColorStop(0.45, "rgba(255,255,255,0.58)");
    along.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = along; context.fillRect(0, 0, 128, 128);
    context.globalCompositeOperation = "destination-in";
    const across = context.createLinearGradient(0, 0, 128, 0);
    across.addColorStop(0, "rgba(255,255,255,0)");
    across.addColorStop(0.5, "rgba(255,255,255,1)");
    across.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = across; context.fillRect(0, 0, 128, 128);
  });
  return { radial, beam, spill };
}

function scaledEffectTint(THREE, tint, strength, dayPage, forceScale = false) {
  const info = laneColor(THREE, tint || "#ffd69e");
  const isHex = /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(String(tint || ""));
  let opacity = info.alpha;
  if (isHex) opacity = dayPage || forceScale ? strength : 1;
  else opacity *= strength;
  return { color: new THREE.Color().setRGB(info.rgb[0], info.rgb[1], info.rgb[2]), opacity: clamp(opacity, 0, 1) };
}

export function createSceneEffects(THREE, scene, source, materials = [], textures = new Map()) {
  source = source || {};
  const lamps = Array.isArray(source.lamps) ? source.lamps : [];
  const wires = Array.isArray(source.wires) ? source.wires : [];
  const marks = Array.isArray(source.marks) ? source.marks : [];
  const radial = effectTextures(THREE);
  for (const [key, texture] of Object.entries(radial)) if (texture) textures.set(`effects-${key}`, texture);
  const geometries = [];
  const makeMaterial = (parameters) => {
    const material = new THREE.MeshBasicMaterial({ toneMapped: false, ...parameters });
    materials.push(material);
    return material;
  };
  const makeSpriteMaterial = (parameters) => {
    const material = new THREE.SpriteMaterial({ toneMapped: false, depthTest: true, depthWrite: false,
      transparent: true, blending: THREE.AdditiveBlending, ...parameters });
    materials.push(material);
    return material;
  };
  const planeGeometry = new THREE.PlaneGeometry(1, 1);
  geometries.push(planeGeometry);
  const addGroundPlane = (name, map, color, opacity, blending = THREE.AdditiveBlending) => {
    const material = makeMaterial({ map, color, opacity, transparent: true, depthTest: true,
      depthWrite: false, blending, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(planeGeometry, material);
    mesh.name = name; mesh.rotation.x = -Math.PI / 2; mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  };
  const makeSprite = (name, map, color, opacity) => {
    const material = makeSpriteMaterial({ map, color, opacity });
    const sprite = new THREE.Sprite(material);
    sprite.name = name; sprite.frustumCulled = false; scene.add(sprite);
    return sprite;
  };

  const lampEntries = lamps.map((lamp, index) => {
    const glow = makeSprite(`3D lamp halo ${index + 1}`, radial.radial, "#ffffff", 0);
    const bulb = lamp.bulb ? makeSprite(`3D lamp source ${index + 1}`, radial.radial, "#fff0ce", 0.92) : null;
    const pool = addGroundPlane(`3D ground pool ${index + 1}`, radial.radial, "#ffa454", 0);
    const reflection = addGroundPlane(`3D wet reflection ${index + 1}`, radial.radial, "#ffd69e", 0);
    let spill = null;
    if (lamp.spill) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      geometries.push(geometry);
      const material = makeMaterial({ map: radial.spill, color: "#ffd69e", opacity: 0, transparent: true,
        depthTest: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      spill = new THREE.Mesh(geometry, material);
      spill.name = `3D window-light spill ${index + 1}`; spill.frustumCulled = false; scene.add(spill);
    }
    const beams = [];
    if (lamp.body === "lantern") {
      for (const [name, width, gain] of [["lantern penumbra", 2.5, 0.30], ["lantern beam", 1, 0.22]]) {
        const radiusTop = Math.max(1, (lamp.size || 24) * 0.85 * width);
        const radiusBottom = Math.max(2, (lamp.size || 24) * 2.9 * width);
        const beamGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom,
          Math.max(1, (lamp.y || 0) - (lamp.size || 24) - 2), 16, 1, true);
        geometries.push(beamGeometry);
        const material = makeMaterial({ map: radial.beam, color: "#ffd69e", opacity: 0, transparent: true,
          depthTest: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(beamGeometry, material);
        mesh.name = `3D ${name} ${index + 1}`; mesh.frustumCulled = false; scene.add(mesh);
        beams.push({ mesh, width, gain, core: gain === 0.22 });
      }
    }
    let spot = null;
    if (lamp.spot) {
      const geometry = new THREE.CylinderGeometry(16, Math.max(2, (lamp.r || 46) * 1.7),
        Math.max(1, (lamp.y || 0) - 90), 16, 1, true);
      geometries.push(geometry);
      const material = makeMaterial({ map: radial.beam, color: "#ffe2b2", opacity: 0, transparent: true,
        depthTest: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      spot = new THREE.Mesh(geometry, material);
      spot.name = `3D diorama spotlight ${index + 1}`; spot.frustumCulled = false; scene.add(spot);
    }
    return { lamp, glow, bulb, pool, reflection, spill, beams, spot };
  });

  const reflectors = [];
  for (const mark of marks) {
    if (mark.kind !== "wet") continue;
    for (const entry of lampEntries) {
      const lamp = entry.lamp;
      if (lamp.wet || lamp.x < mark.x0 || lamp.x > mark.x1 || lamp.z < mark.z0 || lamp.z > mark.z1) continue;
      const mesh = addGroundPlane(`3D wet-mark reflection ${reflectors.length + 1}`, radial.radial, "#ffd69e", 0.15);
      reflectors.push({ mesh, lamp, radius: (lamp.r || 30) * 2.2 });
    }
  }

  const wireMaterial = new THREE.LineBasicMaterial({ color: "#090f1c", transparent: true, opacity: 0.9,
    depthTest: true, depthWrite: false, toneMapped: false });
  materials.push(wireMaterial);
  const lineSpecs = wires.map((wire) => ({ type: "wire", a: wire.a, b: wire.b, sag: wire.sag || 40 }));
  for (const { lamp } of lampEntries) {
    if (lamp.wet) lineSpecs.push({ type: "wet-cord", lamp });
    if (lamp.body === "lantern") lineSpecs.push({ type: "lantern-cord", lamp });
  }
  const lines = lineSpecs.map((spec, index) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(9 * 3);
    const position = new THREE.BufferAttribute(positions, 3);
    position.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", position);
    geometries.push(geometry);
    const line = new THREE.Line(geometry, wireMaterial);
    line.name = `3D wire or lamp cord ${index + 1}`; line.frustumCulled = false; line.renderOrder = 6;
    scene.add(line);
    return { spec, line };
  });

  const shadowGeometry = new THREE.BufferGeometry();
  const shadowPositions = new Float32Array(12 * 3);
  shadowGeometry.setAttribute("position", new THREE.BufferAttribute(shadowPositions, 3).setUsage(THREE.DynamicDrawUsage));
  shadowGeometry.setDrawRange(0, 0);
  geometries.push(shadowGeometry);
  const umbra = new THREE.Mesh(shadowGeometry, makeMaterial({ color: "#0c1222", transparent: true,
    opacity: 0, depthTest: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  umbra.name = "3D authored wall shadow"; umbra.frustumCulled = false; umbra.renderOrder = 4; scene.add(umbra);
  const penumbraGeometry = shadowGeometry.clone();
  penumbraGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geometries.push(penumbraGeometry);
  const penumbra = new THREE.Mesh(penumbraGeometry, makeMaterial({ color: "#0c1222", transparent: true,
    opacity: 0, depthTest: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  penumbra.name = "3D authored wall penumbra"; penumbra.frustumCulled = false; penumbra.renderOrder = 4; scene.add(penumbra);

  const bodyShadow = addGroundPlane("3D walker ground shadow", radial.radial, "#03060e", 0.5, THREE.NormalBlending);
  const smooth = (v) => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
  const radialLimit = (state, worldRadius, depth, minimumPixels) => {
    const focal = Math.max(1, Number(state.focal) || 1);
    return Math.max(worldRadius, minimumPixels * Math.max(1, depth) / focal);
  };
  const poolRadius = (lamp) => clamp(138 * Math.sqrt(Math.max(40, lamp.y || 0) / 300)
    * (0.55 + 0.75 * (lamp.k === undefined ? 0.5 : lamp.k))
    * (lamp.body === "lantern" ? Math.max(1, (lamp.size || 22) / 22) * 0.74 : 1), 46, 330);

  function update(state) {
    const effectState = state.effects || source;
    const day = clamp(Number(state.day) || 0, 0, 1), night = clamp(Number(state.night) || 0, 0, 1);
    const dayPage = Boolean(state.dayPage), time = Number(state.time) || 0;
    const phase = Number.isFinite(Number(effectState.phase)) ? Number(effectState.phase) : (time / 240) % 1;
    const reduced = Boolean(effectState.reducedMotion);
    const dayFall = (value) => dayPage ? value * (1 - 0.88 * day) : value;
    const litOn = (lamp) => lamp.liton ? smooth((phase - lamp.liton) / 0.08) : 1;
    const strength = (lamp) => (lamp.k === undefined ? 0.5 : lamp.k)
      * dayFall(0.12 + 0.88 * night) * litOn(lamp);
    const sway = (lamp) => (!lamp.swing || reduced)
      ? 0 : Math.sin(time * 2 * Math.PI / (lamp.period || 4) + (lamp.phase || 0)) * lamp.swing;

    for (const entry of lampEntries) {
      const { lamp, glow, bulb, pool, reflection, spill, beams, spot } = entry;
      const dx = sway(lamp), amount = strength(lamp), point = new THREE.Vector3(lamp.x + dx, lamp.y, lamp.z);
      glow.position.copy(point);
      const glowRadius = radialLimit(state, Math.max(6, lamp.r || 30), Math.hypot(lamp.x - state.camera.x, lamp.z - state.camera.z), 6);
      glow.scale.set(glowRadius * 2, glowRadius * 2, 1);
      const glowTint = scaledEffectTint(THREE, lamp.tint || "rgba(255,216,158,0.42)", amount, dayPage);
      glow.material.color.copy(glowTint.color); glow.material.opacity = glowTint.opacity;
      glow.visible = glowTint.opacity > 0.002;

      if (bulb) {
        bulb.position.copy(point);
        const depth = Math.max(1, Math.hypot(lamp.x - state.camera.x, lamp.z - state.camera.z));
        const radius = radialLimit(state, 9, depth, 1.5);
        bulb.scale.set(radius * 2, radius * 2, 1);
        bulb.visible = true;
      }

      const radius = poolRadius(lamp);
      pool.position.set(lamp.x + dx, 3, lamp.z);
      pool.scale.set(radius * 2, radius * 0.68, 1);
      const poolTint = scaledEffectTint(THREE, lamp.tint || "rgba(255,216,158,0.42)", 0.8 * amount, dayPage, true);
      pool.material.color.copy(poolTint.color); pool.material.opacity = poolTint.opacity;
      pool.visible = amount > 0.05 && !lamp.spill;

      const reflectionRadius = Math.max(8, (lamp.r || 30) * 3.6);
      reflection.position.set(lamp.x + dx, 4, lamp.z);
      reflection.scale.set(reflectionRadius * 2, reflectionRadius * 0.62, 1);
      reflection.material.opacity = 0.15;
      reflection.visible = lamp.wet && !dayPage;

      if (spill) {
        const widthRadius = radius, length = Math.min(210, widthRadius * (lamp.spill || 1));
        const sign = lamp.x >= 0 ? -1 : 1, x0 = lamp.x + sign * 8, x1 = lamp.x + sign * (length + 40);
        const positions = spill.geometry.getAttribute("position");
        positions.setXYZ(0, x0, 3, lamp.z - widthRadius);
        positions.setXYZ(1, x0, 3, lamp.z + widthRadius);
        positions.setXYZ(2, x1, 3, lamp.z + widthRadius * 0.6);
        positions.setXYZ(3, x1, 3, lamp.z - widthRadius * 0.6);
        positions.needsUpdate = true;
        const tint = scaledEffectTint(THREE, lamp.tint || "rgba(255,216,158,0.42)", 0.7 * amount, dayPage, true);
        spill.material.color.copy(tint.color); spill.material.opacity = tint.opacity;
        spill.visible = amount > 0.05;
      }

      for (const beam of beams) {
        const top = (lamp.y || 0) - (lamp.size || 24), bottom = 2;
        beam.mesh.position.set(lamp.x + dx * 1.25, (top + bottom) / 2, lamp.z);
        beam.mesh.visible = amount > 0.05;
        const scalar = beam.core ? 0.15 + beam.gain * amount : beam.gain * amount;
        const tint = scaledEffectTint(THREE, lamp.tint || "rgba(255,216,158,0.42)", scalar, dayPage, true);
        beam.mesh.material.color.copy(tint.color); beam.mesh.material.opacity = tint.opacity;
      }
      if (spot) {
        spot.position.set(lamp.x, ((lamp.y || 0) + 90) / 2, lamp.z);
        spot.visible = dayFall(1) >= 0.06;
        spot.material.opacity = 0.05;
      }
    }

    for (const reflector of reflectors) {
      const depth = Math.max(1, Math.hypot(reflector.lamp.x - state.camera.x, reflector.lamp.z - state.camera.z));
      const radius = radialLimit(state, reflector.radius, depth, 8);
      reflector.mesh.position.set(reflector.lamp.x, 4, reflector.lamp.z);
      reflector.mesh.scale.set(radius * 2, radius * 0.3, 1);
      reflector.mesh.visible = !dayPage;
    }

    for (const entry of lines) {
      const { spec, line } = entry, positions = line.geometry.getAttribute("position");
      let a, b, sag;
      if (spec.type === "wire") { a = spec.a; b = spec.b; sag = spec.sag; }
      else {
        const lamp = spec.lamp, dx = sway(lamp);
        a = [lamp.x, Number(effectState.ceil) || 0, lamp.z];
        b = spec.type === "wet-cord" ? [lamp.x + dx * 0.4, lamp.y + 6, lamp.z]
          : [lamp.x + dx, lamp.h || (lamp.y + 14), lamp.z];
        sag = 0;
      }
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        positions.setXYZ(i,
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag,
          a[2] + (b[2] - a[2]) * t);
      }
      positions.needsUpdate = true;
    }

    const wall = Number(effectState.wall) || 0, zFar = Number(effectState.zFar) || 0, zBack = Number(effectState.zBack) || 0;
    const azimuth = Number(state.sunAz) || 0;
    const wallSide = azimuth < 0 ? -1 : 1, cross = Math.min(1, Math.abs(azimuth));
    const surfaces = Array.isArray(effectState.surfaces) ? effectState.surfaces : [];
    const wallThere = !surfaces.some((surface) => surface.side === wallSide && surface.kind === "open");
    const sun = clamp(1 - night, 0, 1), altitude = (8 + 62 * sun) * Math.PI / 180;
    const length = wallThere && dayPage && day > 0.05
      ? Math.min(wall * 1.6, (620 / Math.tan(altitude)) * cross) : 0;
    if (length > 6) {
      const x0 = wallSide * (wall - 4), x1 = x0 - wallSide * length, x2 = x1 - wallSide * length * 0.45;
      const setStrip = (mesh, start, end, opacity) => {
        const attr = mesh.geometry.getAttribute("position");
        const points = [[start, 2, zFar], [end, 2, zFar], [end, 2, zBack], [start, 2, zBack]];
        attr.setXYZ(0, ...points[0]); attr.setXYZ(1, ...points[1]); attr.setXYZ(2, ...points[2]); attr.setXYZ(3, ...points[0]);
        attr.setXYZ(4, ...points[2]); attr.setXYZ(5, ...points[3]);
        attr.needsUpdate = true; mesh.geometry.setDrawRange(0, 6); mesh.material.opacity = opacity; mesh.visible = true;
      };
      setStrip(umbra, x1, x0, 0.30 * day);
      setStrip(penumbra, x2, x1, 0.14 * day);
    } else {
      umbra.visible = false; penumbra.visible = false;
      umbra.geometry.setDrawRange(0, 0); penumbra.geometry.setDrawRange(0, 0);
    }

    const camera = state.camera || {};
    bodyShadow.position.set(Number(camera.x) || 0, 2, (Number(camera.z) || 0) + 40);
    bodyShadow.scale.set(52, 18, 1);
    bodyShadow.visible = true;
  }

  return {
    update,
    dispose() { for (const geometry of geometries) geometry.dispose(); },
  };
}

function buildRenderer(THREE, canvas, backdrop, api) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  // Round 48, the lighting base the owner signed off on. The palette of this site is authored as
  // display values and the renderer's SRGB output (an encode every surface used to get, which the
  // tuned colours already compensate for) is KEPT — the filmic curve rides on top of it, so the
  // one-line diff against the old look is literally `enc(aces(in))` versus `enc(in)`: highlights
  // roll off, the deepest darks firm up, midtones barely move. Exposure 0.75 (against three's
  // internal /0.6) is the calibrated amount that keeps the authored sky inside a stop of before.
  // The 2D mirror in site.js reproduces the same composite transform, matrix for matrix.
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;
  // Glow sprites stay outside the curve on purpose — a lantern is allowed to blow out, a wall is not.

  renderer.setClearColor(0x141e36, 1);
  backdrop = backdrop || {};
  const scene = new THREE.Scene();
  scene.background = makeSkyTexture(THREE, backdrop, api.dayPage, api.day);
  // The environment is the same authored sky the backdrop is painted from — one elevation table,
  // sampled once, turned into a prefiltered radiance map by PMREM. Reflections and the visible sky
  // cannot disagree, because they read the same record (the one-world-query rule, pointed at light).
  const environment = makeSkyEnvironment(THREE, renderer, backdrop, api.dayPage, api.day);
  if (environment) scene.environment = environment;
  // A hemisphere light, coloured from the same elevation table as the sky and the environment:
  // it is the floor under which a scene may never go black — PMREM can fail on a weak software
  // renderer, and a lit-painted world must degrade to "gentle sky bounce", not to "unlit black".
  {
    const hs = backdropSkyStops(backdrop, api.dayPage, api.day);
    const skyC = hs.length ? skyColorAt(hs, 45, api.dayPage, api.day) : FALLBACK_COLOR;
    const gndC = hs.length ? skyColorAt(hs, -45, api.dayPage, api.day) : FALLBACK_COLOR;
    scene.add(new THREE.HemisphereLight(skyC, gndC, 0.5));
  }
  // Night the visitor chose must still be a picture, not a blackout: the painter folds its murk
  // as navy rather than black on purpose, and the lit path folds the same navy, continuously, as
  // the sun goes — the authored night colour, never a made-up lamp.
  const nightAmbient = new THREE.AmbientLight(0x16223c, 0);
  scene.add(nightAmbient);
  // The hall's own constant, when the record has no sky to borrow. White is not a made-up lamp:
  // it is the identity — show the authored colours as authored. The record's light lives inside
  // the tiles (the painter's washes) and inside the lane shader's per-quad warm/murk mix, so a
  // tinted ambient here would fold twice. This only lifts the shells off the unlit black that
  // round 51 measured (4.2 luma where the painter paints its tiles at full).
  const hallAmbient = new THREE.AmbientLight(0xffffff, 0);
  scene.add(hallAmbient);
  scene.fog = new THREE.FogExp2(FALLBACK_COLOR, 0.000005);
  const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);
  const staged = buildWorldGeometry(THREE, backdrop.world || {});
  const materials = [];
  const colorBatches = [];
  const textures = new Map();
  const laneTextures = new Map();
  const laneMaterials = new Map();
  const laneMeshes = new Map();
  let laneSoftTexture = null;
  let laneAnisotropy = null;
  let sceneEffects = null;
  const stats = { triangles: staged.triangles, waterTriangles: 0, waterSheets: staged.water.length,
    mistLayers: staged.mist.length, batches: staged.groups.length, unsupported: staged.unsupported,
    laneTriangles: 0, laneQuads: 0, laneMeshes: 0 };

  for (const batch of staged.groups) {
    const geometry = setGeometry(THREE, batch);
    const map = batch.key === "__flat" ? null : (textures.get(batch.key) || makeTexture(THREE, batch.key, renderer));
    if (map && !textures.has(batch.key)) textures.set(batch.key, map);
    const transparent = batch.opacity < 0.999 || batch.key === "ironscroll";
    // Lit but not shiny: the world is painted, and PBR here is about the sky's ambient wrapping
    // the volumes, not about pretending to be varnished. flatShading is load-bearing — the batches
    // carry no normal attribute, and the derivative path needs none.
    const material = new THREE.MeshStandardMaterial({ map, vertexColors: true, side: THREE.DoubleSide,
      opacity: batch.opacity, transparent, depthWrite: !transparent, fog: true, flatShading: true,
      roughness: 0.95, metalness: 0, envMapIntensity: 0.55,
      // The 2D painter gets its night legibility from washes layered ADDITIVELY over the tile
      // colours — which are authored dark. A lighting model multiplies those dark albedos by dark
      // light and the lane blacks out (measured, round 49: ground band luma 27, no lighting change
      // could lift it). The emissive is the 3D counterpart of that additive wash: same authored
      // murk navy, scaled by night, never a new colour.
      emissive: new THREE.Color(0x16223c), emissiveIntensity: 0,
      polygonOffset: batch.key !== "__flat", polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    material.userData.nightGlow = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `surveyed world: ${batch.key}`;
    mesh.frustumCulled = true;
    scene.add(mesh);
    materials.push(material);
    colorBatches.push({ geometry, items: batch.items });
  }

  const waterData = buildWaterGeometry(THREE, staged);
  stats.waterTriangles = waterData.indices.length / 3;
  let water = null;
  if (waterData.positions.length) {
    const geometry = setGeometry(THREE, waterData);
    geometry.setAttribute("aOpacity", new THREE.Float32BufferAttribute(waterData.opacities, 1));
    geometry.setAttribute("aFall", new THREE.Float32BufferAttribute(waterData.fallProgress, 1));
    const streaks = textures.get("fallsw") || makeTexture(THREE, "fallsw", renderer);
    if (streaks && !textures.has("fallsw")) textures.set("fallsw", streaks);
    const sheetTile = makeTexture(THREE, "fallsg", renderer);
    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uStreaks: { value: streaks }, uSheet: { value: sheetTile }, uTime: { value: 0 }, uMotion: { value: 1 },
        uBand0: { value: new THREE.Color(waterData.bandPrims[0]?.c || "#3f9c8a") },
        uBand1: { value: new THREE.Color(waterData.bandPrims[1]?.c || "#7cc3b5") },
        uBand2: { value: new THREE.Color(waterData.bandPrims[2]?.c || "#c4e2de") },
        uBand3: { value: new THREE.Color(waterData.bandPrims[3]?.c || "#e4f0ef") },
        /* Round 59 — 夜間水色, on the surveyed curtains as well as the brink-built ones.

           This material is its own shader, so the world's night pass (which walks the batch colours)
           never touched it: at 3 a.m. the Horseshoe stayed daylight teal while every rock around it
           went navy, which is exactly backwards. The illumination does not put the falls out; it puts
           lamps on it. The sheet takes the warm light by night, and the water between its strands
           keeps the cold of the gorge, which is what photographs of the lit falls show. */
        uNight: { value: 0 },
      }]),
      vertexShader: `attribute vec3 color; attribute float aOpacity; attribute float aFall;
        varying vec2 vUv; varying vec3 vColor; varying float vOpacity; varying float vFall;
        #include <fog_pars_vertex>
        void main(){ vUv=uv; vColor=color; vOpacity=aOpacity; vFall=aFall;
          vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform sampler2D uStreaks; uniform sampler2D uSheet; uniform float uTime; uniform float uMotion; uniform float uNight;
        uniform vec3 uBand0; uniform vec3 uBand1; uniform vec3 uBand2; uniform vec3 uBand3;
        varying vec2 vUv; varying vec3 vColor; varying float vOpacity; varying float vFall;
        #include <fog_pars_fragment>
        vec3 fallColor(float f){
          if(f<0.0) return vColor;
          if(f<0.05) return mix(uBand0,uBand1,smoothstep(0.0,0.05,f));
          if(f<0.15) return mix(uBand1,uBand2,smoothstep(0.05,0.15,f));
          if(f<0.42) return mix(uBand2,uBand3,smoothstep(0.15,0.42,f));
          return uBand3;
        }
        void main(){
          // Interpolate the source's four falling-water color stops across their measured height
          // ranges: separate opaque band faces read as stacked slabs from the upper deck.
          vec3 base=fallColor(vFall);
          // The lamps on the lit falls: warm white, more of it toward the foot where the sheet is
          // aerated and catches the light, and never enough to lose the sheet's own colour.
          vec3 lit=mix(base,vec3(1.0,0.905,0.775),uNight*0.62);
          // A centimetre-mapped, transparent grain tile travels down the sheet. Clear gaps leave the
          // band color visible; the old per-quad sine repeated a high-frequency "window" moire.
          // Round 58: two octaves, the second at three times the frequency and twice the speed. One
          // octave is a stripe at arm's length; water is a sheet of strands moving past each other.
          /* Round 59 — the surveyed curtains get the ropes the brink-built falls got.

             the fallsw tile is 24 m of water per repeat, so at the Table Rock rail the
             Horseshoe was a 57 m wall of one stretched texture and read as the same 一片平光 the
             owner reported from the American side. What a sheet at fifteen metres shows is *ropes*:
             water hanging in columns a metre or two wide with dark water between them. Those are
             built here from the world-space u (vUv.x, already centimetres of the real crest), so the
             columns keep their size however close the visitor stands, and the seams are pushed
             around by the same tile so they do not line up. */
          /* Round 60 — 一片平光, solved at the scale the eye reads it.

             Round 59 built the ropes and left them switched off. ropePhase is a sine at 1.5 m, and
             ropeAA fades to its mean as soon as one rope is smaller than a pixel: at the Table Rock
             rail the nearest sheet is 30 m off and the apex 260 m, so most of what the visitor sees
             was past that threshold — the ropes measured as present in the shader and as absent in
             the frame. What a 57 m curtain needs is structure at every scale at once: masses ten
             metres across that never alias, ropes a metre and a half that fade out with distance as
             water does, and a grain that only ever adds a tooth. The contrast is carried by the tile
             samples (mipmapped by their own derivatives) rather than by any procedural stripe, and
             the sheet is no longer mixed nearly solid to white: 0.82 coverage of a saturated bright
             was why the Horseshoe read as a plaster bowl. */
          // Three scales of the tone tile, mipmapped by their own derivatives: 24 m columns of water,
          // the 9 m streams inside them, and a 3 m grain. Weighted downward, so the sheet keeps a
          // wide light and a wide shadow at any distance and only gains a tooth up close.
          float sBroad=texture2D(uSheet,vec2(vUv.x+0.11,vUv.y*0.55+uTime*0.05*uMotion)).r;
          float sMid=texture2D(uSheet,vec2(vUv.x*2.7+0.53,vUv.y*1.6+uTime*0.19*uMotion)).r;
          float sFine=texture2D(uSheet,vec2(vUv.x*7.1+0.27,vUv.y*4.2+uTime*0.61*uMotion)).r;
          float nBand=texture2D(uStreaks,vec2(vUv.x*0.47+0.07,vUv.y*0.62+uTime*0.16*uMotion)).g;
          vec4 grain=texture2D(uStreaks,vec2(vUv.x*3.1+0.19,vUv.y*2.6+uTime*1.05*uMotion));
          // The columns themselves: three sines of the crest, 21 m, 9 m and 3.7 m apart, summed to
          // one irregular width. A tile alone could not carry this — every mip of it converges on
          // its own mean, and the mean is the flat wash. These are low enough in frequency to be
          // safe at 400 m and irregular enough not to read as a comb at 30 m.
          float colA=0.5+0.5*sin(vUv.x*3.1+0.6);
          float colB=0.5+0.5*sin(vUv.x*11.0+1.3);
          float colC=0.5+0.5*sin(vUv.x*29.0+2.6);
          float columns=0.50*colA+0.34*colB+0.16*colC;
          float mass=clamp(columns*0.62+(sBroad*0.6+sMid*0.3+sFine*0.1)*0.38,0.0,1.0);
          float structure=pow(smoothstep(0.32,0.68,mass),0.85);
          // The sheet's shadow is the *water's* green, not the pale of the band it happens to be in:
          // by the middle of the drop the authored stops are already near white, so a shadow mixed
          // from them was a white shadow, which is how a 57 m curtain read as one flat wall.
          vec3 cold=mix(mix(uBand0,uBand1,0.30),vec3(0.62,0.76,0.79),0.42);
          vec3 deep=cold*vec3(0.44,0.58,0.62);
          // Round 69: the pale end stops short of paper. Measured at the rail, the sheet's brightest
          // value and its p95 were both 227 — the same value as the sky it is seen against, and an
          // edge cannot exist between two equal values. That is a large part of why the crest read
          // as a cut-out rather than as water.
          vec3 aerated=min(vec3(1.0),mix(cold,vec3(1.0),0.62)*0.99+vec3(0.05));
          /* Round 69 — 水面本身沒有明暗, and that is what "flat" means.
             Measured on the round-68 artefact at the rail: the upper sheet sat at one value across
             120 px of a 57 m fall (sd 31-33), because past vFall 0.42 the authored stop is uBand3,
             which is near white, and the structure term is near 1 nearly everywhere. Falling water
             is not one value: the upper third is sheet you can still see into (dense, green, dark),
             the lower third is the boil it becomes (aerated, pale), and that gradient is a function
             of the drop and of nothing else. It multiplies the existing structure rather than
             replacing it, so the strands the owner has already seen keep their shape. */
          float densityDark=smoothstep(0.05,0.26,vFall)*(1.0-smoothstep(0.52,0.88,vFall));
          float boilLift=smoothstep(0.55,0.95,vFall);
          vec3 color=mix(deep,aerated,structure);
          color*=mix(1.0,0.74,densityDark*0.85);
          color=mix(color,min(vec3(1.0),color*1.05+vec3(0.03)),boilLift*0.45);
          // By night the whole sheet is under the lamps: the same structure, lit warm.
          color=mix(color,min(vec3(1.0),lit*1.12),uNight*0.38);
          // The ropes: 1.5 m columns, still antialiased by their footprint, but only allowed to add
          // a third of the sheet's contrast now that the tile carries the rest.
          float ropePhase=vUv.x*100.0+nBand*11.0;
          float rope=pow(0.5+0.5*sin(ropePhase),2.2);
          float ropeAA=clamp(1.8-fwidth(ropePhase),0.0,1.0);
          rope=mix(0.5,rope,ropeAA);
          float below=smoothstep(0.05,0.20,vFall);
          vec3 seam=color*vec3(0.58,0.74,0.80);
          vec3 crestLift=min(vec3(1.0),color*1.10+vec3(0.10));
          color=mix(color,mix(seam,crestLift,rope),0.30*below);
          // A tooth of fine grain, never more: the second octave used to add brightness instead of
          // tooth and was half of the flat white.
          float tooth=(grain.r-0.5)*0.16*smoothstep(0.02,0.30,vFall);
          color=clamp(color+vec3(tooth),0.0,1.0);
          // The lip, and the dark the water turns as it leaves the edge and the light stops reaching
          // through it: a sheet with a white lip over a cold band reads as falling water at once.
          float belowLip=smoothstep(0.030,0.115,max(vFall,0.0))*(1.0-smoothstep(0.115,0.30,max(vFall,0.0)));
          color=mix(color,color*vec3(0.72,0.86,0.90),belowLip*0.55);
          float lip=smoothstep(0.028,0.0,max(vFall,0.0));
          color=mix(color,vec3(0.968,0.988,0.986),lip*0.72);
          // The foot: over the last third the strands go, the sheet loses its own colour and pales
          // into the spray it raises, which is what hides the plunge from every rim above it.
          // Round 69: the foot started at 60% of the drop and paled to 0.93, which measured as the
          // last 40% of the curtain sitting at the tone-map ceiling with no interior detail — the
          // white wash under the crest. The aeration is real, but it belongs in the last quarter and
          // it ends at the aerated value, not above it.
          float foot=smoothstep(0.74,1.0,max(vFall,0.0));
          color=mix(color,mix(base,vec3(0.84,0.88,0.885),0.58),foot*0.78);
          gl_FragColor=vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
      side: THREE.DoubleSide, transparent: false, depthWrite: true, depthTest: true, fog: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "surveyed waterfall sheets";
    mesh.frustumCulled = true;
    mesh.renderOrder = 1;
    scene.add(mesh);
    materials.push(material);
    colorBatches.push({ geometry, items: waterData.items });
    water = material;
  }

  const clouds = makeClouds(THREE, scene, staged.mist);
  const rainbow = makeRainbows(THREE, scene, staged.rainbows);
  const lights = makeLights(THREE, scene, staged.lights);
  const fireworks = makeFireworks(THREE, scene, staged.fireworks);
  if (fireworks) fireworks.geometry.userData.object = scene.children.find((x) => x.name === "authored night bursts");
  const reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0, lastSky = "", lastDay = -1, lastHeld = -1, lastDayPage = null;

  const laneTextureFor = (group) => {
    if (group.textureKind === "flat") return null;
    if (group.textureKind === "soft") {
      if (!laneSoftTexture) laneSoftTexture = softLaneTexture(THREE);
      return laneSoftTexture;
    }
    const source = group.textureKind === "image" ? group.image : group.textureSource;
    if (!source) return null;
    const cacheKey = `${group.textureKind}:${group.textureKey}`;
    let entry = laneTextures.get(cacheKey);
    if (!entry) {
      const texture = group.textureKind === "image" ? new THREE.Texture(source) : new THREE.CanvasTexture(source);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = group.textureKind === "pattern" ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      /* Round 64: a floor is a surface seen at a grazing angle, and a mipmap chosen by the depth
         derivative alone averages a paving's joints away long before the eye would. The world
         prims have had anisotropic filtering for rounds; the lane's own surfaces did not, so the
         plaza's paving was smoothed into a sheet by the filter and not by the paving. Eight taps
         is what the software renderer here offers, and a floor is where it shows. */
      if (renderer && renderer.capabilities) {
        if (laneAnisotropy === null) laneAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.anisotropy = laneAnisotropy;
      }
      texture.needsUpdate = true;
      entry = { texture, source };
      laneTextures.set(cacheKey, entry);
    } else if (entry.source !== source) {
      entry.source = source;
      entry.texture.image = source;
      entry.texture.needsUpdate = true;
    }
    return entry.texture;
  };

  const updateLane = (state) => {
    const lane = buildLaneGeometry(THREE, state.quads, state);
    const active = new Set();
    for (const group of lane.groups) {
      active.add(group.key);
      let entry = laneMeshes.get(group.key);
      const map = laneTextureFor(group);
      if (!entry) {
        const materialKey = `${group.textureKind}:${group.textureKey}|${group.transparent ? "blend" : "solid"}`;
        let material = laneMaterials.get(materialKey);
        if (!material) {
          material = laneShaderMaterial(THREE, map, group.transparent);
          laneMaterials.set(materialKey, material);
          materials.push(material);
        }
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
        mesh.name = `walk lane: ${group.textureKind}/${group.textureKey}`;
        mesh.frustumCulled = false;
        scene.add(mesh);
        entry = { mesh, textureKey: `${group.textureKind}:${group.textureKey}` };
        laneMeshes.set(group.key, entry);
      }
      if (entry.mesh.material.map !== map) {
        entry.mesh.material.map = map;
        entry.mesh.material.needsUpdate = true;
      }
      updateLaneMesh(THREE, entry.mesh, group);
    }
    for (const [key, entry] of laneMeshes) {
      if (active.has(key)) continue;
      entry.mesh.visible = false;
      entry.mesh.geometry.setDrawRange(0, 0);
    }
    stats.laneTriangles = lane.triangles;
    stats.laneQuads = lane.quads;
    stats.laneMeshes = lane.groups.length;
  };

  function render(state) {
    // the hour rides in every frame's state (site.js builds it from the chosen phase): night K
    // opens as the sun drops below the painter's own dusk line, and nothing else changes
    {
      const nightK = Math.max(0, Math.min(1, ((Number(state.night) || 0) - 0.45) / 0.5));
      // A hall has no sky to borrow: its record's dusk is lamp-lit and constant, and in the painter
      // the tiles carry that constant themselves (lit wash over authored colours) and the shell
      // takes neither the sun's lift nor the night's murk (site.js: "own lamps whatever the hour").
      // Round 51 mirrored only half of that — it held the hall at the full navy fold forever, and
      // round 53 is the bill: a hall at 30,53,103 mean RGB (blue 3.4 times red, the owner's 紫色)
      // where the painter paints 111,121,138. So the navy of the night now rides the MOVING hour
      // (hourK) — an interior's authored fixed night is its lamps, not the sky's colour — and the
      // hall's constant is the lamp wash plus a quarter of the murk as air, both from the record.
      // Without any floor at all a hall still collapses to the round-51 black (4.2 luma), so the
      // floor stays structural: it just arrives warm now.
      const hallK = state.dayPage ? 0 : 1;
      const hourK = state.dayPage ? nightK : 0;
      nightAmbient.intensity = 0.62 * hourK;
      hallAmbient.intensity = 1.6 * hallK;
      for (const m of materials) if (m.userData && m.userData.nightGlow) m.emissiveIntensity = 4.5 * hourK;
    }
    const w = Math.max(1, Math.round(state.width)), h = Math.max(1, Math.round(state.height));
    if (w !== width || h !== height) { renderer.setSize(w, h, false); width = w; height = h; }
    const focal = Math.max(1, Number(state.focal) || 1), near = 20;
    camera.position.set(state.camera.x, state.camera.eye, state.camera.z);
    const yaw = Math.atan2(state.camera.sy, state.camera.cy);
    const pitch = Math.atan2(state.camera.sp, state.camera.cp);
    camera.lookAt(
      state.camera.x + Math.sin(yaw) * Math.cos(pitch),
      state.camera.eye - Math.sin(pitch),
      state.camera.z + Math.cos(yaw) * Math.cos(pitch),
    );
    camera.projectionMatrix.makePerspective(-w * 0.5 * near / focal, w * 0.5 * near / focal,
      h * 0.5 * near / focal, -h * 0.5 * near / focal, near, camera.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    const day = clamp(Number(state.day) || 0, 0, 1);
    const time = reducedMotion ? 0 : Number(state.time) || 0;
    const held = Math.floor(time / 7);
    const dayPage = Boolean(state.dayPage);
    const colorsChanged = lastDay < 0 || Math.abs(day - lastDay) > 0.004 || held !== lastHeld || dayPage !== lastDayPage;
    if (colorsChanged) {
      const colorState = { ...state, day, time, dayPage };
      for (const batch of colorBatches) updateColorAttribute(THREE, batch.geometry, batch.items, colorState);
      if (water) {
        for (let i = 0; i < 4; i++) {
          const prim = waterData.bandPrims[i];
          const fallback = ["#3f9c8a", "#7cc3b5", "#c4e2de", "#e4f0ef"][i];
          water.uniforms[`uBand${i}`].value.set(prim ? sourceColor(prim, colorState) : fallback);
        }
      }
      lastDay = day; lastHeld = held; lastDayPage = dayPage;
    }
    if (water) {
      water.uniforms.uTime.value = time; water.uniforms.uMotion.value = reducedMotion ? 0 : 1;
      // Same curve the lane's falls use, so the two curtains go lit on the same evening.
      water.uniforms.uNight.value = Math.max(0, Math.min(1, ((Number(state.night) || 0) - 0.45) / 0.5));
    }
    updateClouds(THREE, clouds, state.camera, { ...state, day, time }, reducedMotion);
    if (rainbow) {
      const sun = Number(state.sunAz) || 0;
      rainbow.mesh.visible = Boolean(state.dayPage && day >= 0.3 && rainbow.items.some((p) => sun * (p.west ? 1 : -1) >= 0.12));
    }
    if (fireworks) updateFireworks(THREE, fireworks, { ...state, day, time }, reducedMotion);
    if (lights && lights.material) lights.material.opacity = state.dayPage && day > 0.6 ? 0.62 : 0.9;
    updateLane({ ...state, day, dayPage, time });
    if (state.effects) {
      if (!sceneEffects) sceneEffects = createSceneEffects(THREE, scene, state.effects, materials, textures);
      sceneEffects.update({ ...state, day, dayPage, time });
    }

    if (Math.abs(day - Number(lastSky.split("|")[0])) > 0.004 || lastSky.endsWith(`|${Boolean(state.dayPage)}`) === false) {
      const texture = makeSkyTexture(THREE, backdrop, Boolean(state.dayPage), day);
      if (scene.background && scene.background.isTexture) scene.background.dispose();
      scene.background = texture;
      const stops = backdropSkyStops(backdrop, Boolean(state.dayPage), day);
      const horizon = skyColorAt(stops, 0, Boolean(state.dayPage), day);
      scene.fog.color.set(horizon);
      lastSky = `${day}|${Boolean(state.dayPage)}`;
    }
    renderer.render(scene, camera);
  }

  return {
    version: THREE_VERSION,
    render,
    dispose() {
      if (environment) environment.dispose();
      canvas.hidden = true;
      for (const entry of laneMeshes.values()) entry.mesh.geometry.dispose();
      for (const material of laneMaterials.values()) material.dispose();
      for (const texture of laneTextures.values()) texture.texture.dispose();
      if (laneSoftTexture) laneSoftTexture.dispose();
      if (sceneEffects) sceneEffects.dispose();
      if (scene.background && scene.background.isTexture) scene.background.dispose();
      renderer.dispose();
      for (const texture of textures.values()) texture.dispose();
      for (const material of materials) material.dispose();
    },
    stats,
  };
}

// The lane has one renderer now, so a failure names itself instead of degrading into a second
// picture: the authored sentence in the info card is raised, the lane reports it through its own
// published channel (`noteOffline`, which stands the words in the viewport that cannot be drawn),
// and the list still reads.
function noteNoWebGL(layer, why) {
  const note = layer.querySelector("[data-walk-fallback]");
  if (note) note.hidden = false;
  const api = layer.__walk;
  if (api && typeof api.noteOffline === "function") api.noteOffline();
  if (window.console && typeof console.warn === "function") console.warn(why);
}

async function mount() {
  const layer = document.querySelector(".walk[data-walk]");
  const canvas = layer && layer.querySelector("[data-walk-three]");
  const api = layer && layer.__walk;
  const backdrop = api && api.backdrop || {};
  if (!layer || !canvas || !api || typeof api.attachThree !== "function") return;
  try {
    const THREE = await import(`./vendor/three-${THREE_VERSION}/three.module.js`);
    const engine = buildRenderer(THREE, canvas, backdrop, api);
    if (!api.attachThree(engine)) {
      engine.dispose(); canvas.hidden = true; layer.dataset.walkRenderer = "off";
      noteNoWebGL(layer, "Three.js refused the scene:"); return;
    }
    layer.dataset.walkRenderer = "three";
    layer.__walk.threeStats = engine.stats;
  } catch (error) {
    canvas.hidden = true;
    layer.dataset.walkRenderer = "off";
    noteNoWebGL(layer, "Three.js world failed:");
    if (window.console && typeof console.warn === "function") console.warn("Three.js world could not mount:", error);
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  mount();
}
