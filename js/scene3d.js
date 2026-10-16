/*
 * Three.js bridge for surveyed walkable-world backdrops.
 *
 * This is the first, deliberately narrow WebGL slice of the walk renderer: the outdoor world behind
 * Niagara, Journey and the CN Tower is built from the existing sourced `backdrop.world.prims` record.
 * The authored lane and its hit targets stay in their current coordinate system, drawn by site.js on
 * the transparent 2D overlay; Canvas2D remains the complete fallback when WebGL is missing.
 *
 * No location, dimensions, labels or scene detail are authored here. This file only turns the record's
 * polygons and typed effects into meshes. Pattern maps are procedural grayscale material samples,
 * never photographs or invented signage.
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
    for (let i = 0; i < 52; i++) {
      const x = flow() * 128, w = 0.8 + flow() * 3.6, a = 0.1 + flow() * 0.34;
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
  const ss = stops.slice().sort((a, b) => Number(a.e) - Number(b.e));
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

function makeSkyTexture(THREE, backdrop, dayPage, day) {
  if (typeof document === "undefined") return new THREE.Color(FALLBACK_COLOR);
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const c = canvas.getContext("2d");
  const stops = backdrop.skyAround && Array.isArray(backdrop.skyAround.stops) ? backdrop.skyAround.stops : [];
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

function buildRenderer(THREE, canvas, backdrop, api) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x141e36, 1);
  const scene = new THREE.Scene();
  scene.background = makeSkyTexture(THREE, backdrop, api.dayPage, api.day);
  scene.fog = new THREE.FogExp2(FALLBACK_COLOR, 0.000005);
  const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);
  const staged = buildWorldGeometry(THREE, backdrop.world);
  const materials = [];
  const colorBatches = [];
  const textures = new Map();

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
          vec3 bright=mix(base,min(vec3(1.0),base*1.14+vec3(0.035)),0.75);
          vec3 dark=base*vec3(0.62,0.82,0.86);
          vec3 strand=mix(dark,bright,lightStreak);
          float coverage=vFall<0.0?0.0:clamp(grain.a*vOpacity,0.0,0.58);
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

    if (Math.abs(day - Number(lastSky.split("|")[0])) > 0.004 || lastSky.endsWith(`|${Boolean(state.dayPage)}`) === false) {
      const texture = makeSkyTexture(THREE, backdrop, Boolean(state.dayPage), day);
      if (scene.background && scene.background.isTexture) scene.background.dispose();
      scene.background = texture;
      const stops = backdrop.skyAround && backdrop.skyAround.stops || [];
      const horizon = skyColorAt(stops, 0, Boolean(state.dayPage), day);
      scene.fog.color.set(horizon);
      lastSky = `${day}|${Boolean(state.dayPage)}`;
    }
    renderer.render(scene, camera);
  }

  return {
    version: THREE_VERSION,
    render,
    dispose() { canvas.hidden = true; renderer.dispose(); for (const texture of textures.values()) texture.dispose(); },
    stats: { triangles: staged.triangles, waterTriangles: waterData.indices.length / 3,
      waterSheets: staged.water.length, mistLayers: staged.mist.length,
      batches: staged.groups.length, unsupported: staged.unsupported },
  };
}

async function mount() {
  const layer = document.querySelector(".walk[data-walk]");
  const canvas = layer && layer.querySelector("[data-walk-three]");
  const api = layer && layer.__walk;
  const backdrop = api && api.backdrop;
  const prims = backdrop && backdrop.world && backdrop.world.prims;
  if (!layer || !canvas || !api || !Array.isArray(prims) || !prims.length || typeof api.attachThree !== "function") return;
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
