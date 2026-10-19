/*
 * Three.js renderer for every walkable scene.
 *
 * The lane, authored props, compact far backdrops and sourced `backdrop.world.prims` are all submitted
 * as world-space meshes to one camera and depth buffer. site.js remains the authoring/interaction layer:
 * it supplies each frame's polygons, camera, light values and hit targets. Its transparent Canvas2D
 * surface is transparent while this renderer is active and remains the complete Canvas2D fallback
 * when WebGL is absent or a context fails; lamps, pools, shadows and wires are Three.js geometry too.
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
  if (p.il && dark) return NIGHT_LAMPS[Math.floor((Number(state.time) || 0) / 7) % NIGHT_LAMPS.length];
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
  canvas.width = canvas.height = 128;
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

  if (name === "fallsw") {
    // The authored material is a transparent overlay: 52 full-height white/dark-green streams,
    // softened along the drop on whole periods so the repeated tile has no horizontal seam. A grey
    // opaque background here turned the Niagara water into a striped wall in WebGL.
    c.clearRect(0, 0, 128, 128);
    let seed = 35071;
    const flow = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 64; i++) {
      const x = flow() * 128, w = 0.8 + flow() * 4.2, a = 0.12 + flow() * 0.42;
      const dark = i % 4 === 0, periods = 1 + Math.floor(flow() * 2), phase = flow() * Math.PI * 2;
      const gradient = c.createLinearGradient(0, 0, 0, 128);
      for (let k = 0; k <= 8; k++) {
        const fade = 0.55 + 0.45 * Math.sin(phase + (k / 8) * periods * Math.PI * 2);
        const alpha = (a * fade).toFixed(3);
        gradient.addColorStop(k / 8, dark ? `rgba(34,82,92,${(a * 0.55 * fade).toFixed(3)})`
          : `rgba(255,255,255,${alpha})`);
      }
      c.fillStyle = gradient; c.fillRect(x, 0, w, 128);
      if (x + w > 128) c.fillRect(x - 128, 0, w, 128);
    }
  } else if (name === "canopy") {
    c.fillStyle = "#777777"; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 115; i++) {
      const v = Math.round(96 + rnd() * 145), r = 3 + rnd() * 9;
      spot(rnd() * 128, rnd() * 128, r, `rgb(${v},${v},${v})`);
    }
  } else if (name === "towerwin" || name === "hotelw" || name === "cityn") {
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
  } else if (name === "stonewall" || name === "strata" || name === "tunnelc" || name === "trcwall") {
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
  texture.colorSpace = name === "fallsw" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
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
  const night = clamp((Number(state.night) || 0) * 0.5, 0, 0.72);
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
      const radius = Math.max(1, Number(soft.r) || 1), aspect = Math.max(0.01, Number(soft.k) || 1);
      uvForPoint = (i) => {
        const [sx, sy] = projectLanePoint(points[i], state);
        return [0.5 + (sx - Number(soft.x || 0)) / (2 * radius),
                0.5 + (sy - Number(soft.y || 0)) / (2 * radius * aspect)];
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
  const material = new THREE.MeshBasicMaterial({
    map: map || null, vertexColors: true, side: THREE.DoubleSide, transparent,
    depthWrite: !transparent, depthTest: true, fog: false,
  });
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
        float laneDark=min(0.72,1.0-(1.0-clamp(vLaneAir,0.0,0.6))*(1.0-clamp(vLaneDarkness,0.0,0.72)));
        diffuseColor.rgb=mix(diffuseColor.rgb,uLaneWarm,laneWarm);
        diffuseColor.rgb=mix(diffuseColor.rgb,uLaneNight,laneDark);
        diffuseColor.rgb+=uLaneSun*max(0.0,vLaneDaylight)*0.62;
        diffuseColor.a*=clamp(vLaneOpacity,0.0,1.0);`);
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
  g.addColorStop(0, "rgba(255,255,255,0.46)");
  g.addColorStop(0.35, "rgba(255,255,255,0.24)");
  g.addColorStop(0.72, "rgba(255,255,255,0.075)");
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
    const count = Math.max(1, Math.min(9, p.np || 5));
    for (let k = 0; k < count; k++) {
      const f = count === 1 ? 0 : k / (count - 1);
      descriptors.push({ p, k, count, f, ox, oy, oz, size: (p.w || 1000) * (0.32 + 0.22 * f) });
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
    transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
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
    const tint = prim.il && dark ? NIGHT_LAMPS[Math.floor((state.time || 0) / 7) % NIGHT_LAMPS.length] : "#eef4f7";
    rgb.set(tint);
    const alpha = (Number(prim.al) || 0.3) * (1 - 0.6 * f) * (prim.il && dark ? 0.5 : 1);
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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x141e36, 1);
  backdrop = backdrop || {};
  const scene = new THREE.Scene();
  scene.background = makeSkyTexture(THREE, backdrop, api.dayPage, api.day);
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
  let sceneEffects = null;
  const stats = { triangles: staged.triangles, waterTriangles: 0, waterSheets: staged.water.length,
    mistLayers: staged.mist.length, batches: staged.groups.length, unsupported: staged.unsupported,
    laneTriangles: 0, laneQuads: 0, laneMeshes: 0 };

  for (const batch of staged.groups) {
    const geometry = setGeometry(THREE, batch);
    const map = batch.key === "__flat" ? null : (textures.get(batch.key) || makeTexture(THREE, batch.key, renderer));
    if (map && !textures.has(batch.key)) textures.set(batch.key, map);
    const transparent = batch.opacity < 0.999 || batch.key === "ironscroll";
    const material = new THREE.MeshBasicMaterial({ map, vertexColors: true, side: THREE.DoubleSide,
      opacity: batch.opacity, transparent, depthWrite: !transparent, fog: true,
      polygonOffset: batch.key !== "__flat", polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
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
    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uStreaks: { value: streaks }, uTime: { value: 0 }, uMotion: { value: 1 },
        uBand0: { value: new THREE.Color(waterData.bandPrims[0]?.c || "#3f9c8a") },
        uBand1: { value: new THREE.Color(waterData.bandPrims[1]?.c || "#7cc3b5") },
        uBand2: { value: new THREE.Color(waterData.bandPrims[2]?.c || "#c4e2de") },
        uBand3: { value: new THREE.Color(waterData.bandPrims[3]?.c || "#e4f0ef") },
      }]),
      vertexShader: `attribute vec3 color; attribute float aOpacity; attribute float aFall;
        varying vec2 vUv; varying vec3 vColor; varying float vOpacity; varying float vFall;
        #include <fog_pars_vertex>
        void main(){ vUv=uv; vColor=color; vOpacity=aOpacity; vFall=aFall;
          vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform sampler2D uStreaks; uniform float uTime; uniform float uMotion;
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
          // A centimetre-mapped, transparent grain tile travels down the sheet. Clear gaps leave the
          // band color visible; the old per-quad sine repeated a high-frequency "window" moire.
          vec4 grain=texture2D(uStreaks,vec2(vUv.x,vUv.y+uTime*0.38*uMotion));
          float lightStreak=smoothstep(0.18,0.78,grain.r);
          vec3 bright=min(vec3(1.0),base*1.32+vec3(0.06));
          vec3 dark=base*vec3(0.52,0.71,0.77);
          vec3 strand=mix(dark,bright,lightStreak);
          float coverage=vFall<0.0?0.0:clamp(grain.a*vOpacity,0.0,0.75);
          vec3 color=mix(base,strand,coverage);
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
    if (water) { water.uniforms.uTime.value = time; water.uniforms.uMotion.value = reducedMotion ? 0 : 1; }
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
      engine.dispose(); canvas.hidden = true; layer.dataset.walkRenderer = "canvas2d"; return;
    }
    layer.dataset.walkRenderer = "three";
    layer.__walk.threeStats = engine.stats;
  } catch (error) {
    canvas.hidden = true;
    layer.dataset.walkRenderer = "canvas2d";
    if (window.console && typeof console.warn === "function") console.warn("Three.js world fallback:", error);
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  mount();
}
