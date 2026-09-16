"""The renderer half of the compound: a cut window, a far plane, an arcade.

Everything here answers data the generator authors; nothing is placed by eye in JS. The aperture is a
hole in one wall painted over farther quads by the existing depth sort, so there is no clip path, no
second canvas, and no library.
"""
import io

p = "js/site.js"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


# ---- culling has to know about far planes ---------------------------------------------------------
rep('''  const quads = [];
  const add = (C, corners, uv, mode, arg, img) => {''',
'''  const quads = [];
  const add = (C, corners, uv, mode, arg, img, big) => {''')

rep('''    let off = 0;
    cp.forEach((q) => {
      const sx = W * 0.5 + (focal * q.x) / q.z, sy = H * 0.5 + (focal * q.y) / q.z;
      if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80) off += 1;
    });
    if (!off) return null;''',
'''    let off = 0, bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    cp.forEach((q) => {
      const sx = W * 0.5 + (focal * q.x) / q.z, sy = H * 0.5 + (focal * q.y) / q.z;
      bx0 = Math.min(bx0, sx); bx1 = Math.max(bx1, sx);
      by0 = Math.min(by0, sy); by1 = Math.max(by1, sy);
      if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80) off += 1;
    });
    /* A far plane must not be culled by its corners: the sky covers the view by being larger than
       it, so every corner lands off-screen and the whole backdrop would disappear. Big quads are
       tested against their bounds instead, and they stay in the same list, so the depth sort still
       puts them behind the room rather than under a fixed overlay. */
    if (!off && !(big && bx1 > 0 && bx0 < W && by1 > 0 && by0 < H)) return null;''')

# ---- new islands ----------------------------------------------------------------------------------
rep('''  const wires = readIsland("[data-walk-wires]");''',
'''  const wires = readIsland("[data-walk-wires]");
  const beams = readIsland("[data-walk-beams]");
  const vista = (readIsland("[data-walk-vista]")[0]) || null;
  const bd = (readIsland("[data-walk-backdrop]")[0]) || null;''')

rep('''    tint: L.bulb === false ? "rgba(255,192,104,0.5)" : "rgba(255,216,158,0.42)",''',
    '''    tint: L.tint || (L.bulb === false ? "rgba(255,192,104,0.5)" : "rgba(255,216,158,0.42)"),''')

# ---- a facade pattern for the far buildings --------------------------------------------------------
rep('''  loadPics();
  const size = () => {''',
'''  const paintWindows = (c) => {
    // Windows are a pattern, like the tiles and the asphalt: a photographed facade would be the one
    // lie available for free here, because it would carry somebody's actual street. Which cells are
    // lit is arithmetic on the tile index, so a block is stable frame to frame and never flickers.
    c.fillStyle = "#1b2740"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      for (let k = 0; k < 8; k++) {
        const i = r * 8 + k;
        if (i % 3 === 0 || i % 7 === 4) {
          c.fillStyle = i % 5 === 0 ? "rgba(255,232,180,0.72)" : "rgba(206,226,255,0.5)";
          c.fillRect(k * 16 + 3, r * 16 + 4, 9, 7);
        }
      }
    }
    c.strokeStyle = "rgba(9,14,26,0.55)"; c.lineWidth = 1;
    for (let r = 0; r <= 8; r++) { c.beginPath(); c.moveTo(0, r * 16); c.lineTo(128, r * 16); c.stroke(); }
  };
  loadPics();
  const size = () => {''')

rep('''    tilePat = mkTile(paintWall);
    floorPat = mkTile(paintFloor);''',
'''    tilePat = mkTile(paintWall);
    floorPat = mkTile(paintFloor);
    winPat = mkTile(paintWindows);''')
rep('''  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null;''',
    '''  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null, winPat = null;''')

# ---- the far plane --------------------------------------------------------------------------------
rep('''  const draw = () => {''',
'''  const drawFar = (C) => {
    /* One convention, stated once: the compound is authored in scene centimetres, and the far plane is
       authored at the scale a *picture* of Tokyo shows rather than 1:1 — a mountain does not fit in a
       space that is 12 m long, and pretending it did is the sort of flourish this lane refuses. The
       air on these quads is authored instead of taken from `haze()`, because fog computed from a z of
       90000 would erase the very thing the window exists to show. */
    const band = (b) => {
      const q = add(C, [[-150000, b.y0, 120000], [150000, b.y0, 120000],
                        [150000, b.y1, 120000], [-150000, b.y1, 120000]],
                    ZERO8, "flat", b.c, null, true);
      if (q) { q.air = 0; q.lit = b.glow || 0; }
    };
    (bd.sky || []).forEach(band);
    const mt = bd.mountain;
    if (mt) {
      const q = add(C, [[mt.x - mt.half, mt.base, mt.z], [mt.x + mt.half, mt.base, mt.z],
                        [mt.x + mt.crown, mt.top, mt.z], [mt.x - mt.crown, mt.top, mt.z]],
                    ZERO8, "flat", "#2e3d5c", null, true);
      if (q) { q.air = 0.12; q.lit = 0.3; }
      const line = mt.top - (mt.top - mt.base) * mt.snow;
      const cap = add(C, [[mt.x - mt.crown, mt.top, mt.z], [mt.x + mt.crown, mt.top, mt.z],
                          [mt.x + mt.crown * 1.9, line, mt.z], [mt.x - mt.crown * 1.9, line, mt.z]],
                      ZERO8, "flat", "#c9d8f2", null, true);
      if (cap) { cap.air = 0.14; cap.lit = 0.5; }
    }
    const tw = bd.tower;
    if (tw) {
      const taper = (y) => tw.half * (1 - (y / tw.top) * 0.84);
      // Three banded sections, two decks and a mast: at night the tower reads as stripes of colour,
      // and a lattice nobody can resolve at that distance would be decoration, not sightline.
      const cuts = [0, tw.top * 0.42, tw.top * 0.72, tw.top];
      for (let i = 0; i < cuts.length - 1; i++) {
        const y0 = cuts[i], y1 = cuts[i + 1];
        const q = add(C, [[tw.x - taper(y0), y0, tw.z], [tw.x + taper(y0), y0, tw.z],
                          [tw.x + taper(y1), y1, tw.z], [tw.x - taper(y1), y1, tw.z]],
                      ZERO8, "flat", i % 2 ? "#c9613a" : "#e8e2d4", null, true);
        if (q) { q.air = 0.1; q.lit = 0.62; }
      }
      const mast = add(C, [[tw.x - 18, tw.top, tw.z], [tw.x + 18, tw.top, tw.z],
                           [tw.x + 6, tw.mast, tw.z], [tw.x - 6, tw.mast, tw.z]],
                       ZERO8, "flat", "#d8d2c4", null, true);
      if (mast) mast.air = 0.1;
      (tw.decks || []).forEach((dy) => {
        const w = taper(dy) * 1.5;
        const deck = add(C, [[tw.x - w, dy, tw.z], [tw.x + w, dy, tw.z],
                             [tw.x + w, dy + 90, tw.z], [tw.x - w, dy + 90, tw.z]],
                         ZERO8, "flat", "#f0d9a8", null, true);
        if (deck) { deck.air = 0.06; deck.lit = 0.9; }
      });
    }
    const plaza = bd.plaza;
    if (plaza) {
      const fl = add(C, [[-plaza.half, plaza.y, plaza.z0], [plaza.half, plaza.y, plaza.z0],
                          [plaza.half, plaza.y, plaza.z1], [-plaza.half, plaza.y, plaza.z1]],
          [plaza.z0 * DPM, -plaza.half * DPM, plaza.z0 * DPM, plaza.half * DPM,
           plaza.z1 * DPM, plaza.half * DPM, plaza.z1 * DPM, -plaza.half * DPM],
          "pat", floorPat, null, true);
      if (fl) { fl.air = 0.22; fl.lit = 0.5; }
    }
    const cross = bd.crossing;
    if (cross) {
      const n = cross.stripes || 8, span = cross.x1 - cross.x0;
      for (let i = 0; i < n; i++) {
        const z = cross.z0 + ((i + 0.5) / n) * (cross.z1 - cross.z0);
        const q = add(C, [[cross.x0, cross.y + 1, z - cross.width / 2],
                          [cross.x1, cross.y + 1, z - cross.width / 2],
                          [cross.x1, cross.y + 1, z + cross.width / 2],
                          [cross.x0, cross.y + 1, z + cross.width / 2]],
                      ZERO8, "flat", "#c7d3e8", null, true);
        if (q) { q.air = 0.18; q.lit = 0.72; }
      }
      if (cross.diagonals) {
        // The scramble's own gesture: bands running along the crossing as well as across it, so the
        // ground reads as somewhere people converge from every corner, not a single zebra.
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const cx = cross.x0 + span * t;
          const cz = cross.z0 + (cross.z1 - cross.z0) * t;
          const q = add(C, [[cx - cross.width / 2, cross.y + 1, cz - cross.width / 2],
                            [cx + cross.width / 2, cross.y + 1, cz - cross.width / 2],
                            [cx + cross.width / 2, cross.y + 1, cz + cross.width / 2],
                            [cx - cross.width / 2, cross.y + 1, cz + cross.width / 2]],
                        ZERO8, "flat", "#b9c7de", null, true);
          if (q) { q.air = 0.2; q.lit = 0.62; }
        }
      }
    }
    (bd.city || []).forEach((b) => {
      const hw = b.w / 2, k = 0.5 + (b.win || 0.4);
      const face = add(C, [[b.x - hw, 0, b.z], [b.x + hw, 0, b.z], [b.x + hw, b.h, b.z],
                           [b.x - hw, b.h, b.z]],
          [(b.x - hw) * k, 0, (b.x + hw) * k, 0, (b.x + hw) * k, -b.h * k, (b.x - hw) * k, -b.h * k],
          "pat", winPat, null, true);
      if (face) { face.air = 0.14; face.lit = 0.46; }
      const side = b.x < 0 ? 1 : -1;
      const sf = add(C, [[b.x + side * hw, 0, b.z - hw], [b.x + side * hw, 0, b.z + hw],
                          [b.x + side * hw, b.h, b.z + hw], [b.x + side * hw, b.h, b.z - hw]],
          [(b.z - hw) * k, 0, (b.z + hw) * k, 0, (b.z + hw) * k, -b.h * k, (b.z - hw) * k, -b.h * k],
          "pat", winPat, null, true);
      if (sf) { sf.air = 0.14; sf.lit = 0.3; }
      const lip = add(C, [[b.x - hw, b.h, b.z], [b.x + hw, b.h, b.z], [b.x + hw, b.h, b.z - 40],
                          [b.x - hw, b.h, b.z - 40]], ZERO8, "flat", "#0f1727", null, true);
      if (lip) lip.air = 0.1;
    });
  };

  const draw = () => {''')

# ---- the end wall becomes a window, and the far plane is drawn through it --------------------------
rep('''    const far = add(C, [[-WALL, 0, Z_FAR], [WALL, 0, Z_FAR], [WALL, CEIL, Z_FAR], [-WALL, CEIL, Z_FAR]],
        [0, 0, WALL * DPM * 2, 0, WALL * DPM * 2, -CEIL * DPM * 2, 0, -CEIL * DPM * 2], "pat", tilePat);
    if (far) far.lit = lightAt(0, 210, Z_FAR);''',
'''    const wallPiece = (x0, y0, x1, y1, at) => {
      const q = add(C, [[x0, y0, Z_FAR], [x1, y0, Z_FAR], [x1, y1, Z_FAR], [x0, y1, Z_FAR]],
          [x0 * DPM, -y0 * DPM, x1 * DPM, -y0 * DPM, x1 * DPM, -y1 * DPM, x0 * DPM, -y1 * DPM],
          "pat", tilePat);
      if (q) q.lit = at;
      return q;
    };
    if (vista) {
      // Four pieces around the opening, plus jambs and a sill: a hole in a wall has a reveal, and
      // without one the vista reads as a decal of a window rather than a route out of the room.
      const vx0 = Math.max(-WALL, vista.x - vista.w / 2), vx1 = Math.min(WALL, vista.x + vista.w / 2);
      wallPiece(-WALL, 0, WALL, vista.y0, lightAt(0, 40, Z_FAR));
      wallPiece(-WALL, vista.y1, WALL, CEIL, lightAt(0, 380, Z_FAR));
      wallPiece(-WALL, vista.y0, vx0, vista.y1, lightAt(-300, 210, Z_FAR));
      wallPiece(vx1, vista.y0, WALL, vista.y1, lightAt(300, 210, Z_FAR));
      const deep = 26;
      [vx0, vx1].forEach((ex) => {
        const q = add(C, [[ex, vista.y0, Z_FAR], [ex, vista.y0, Z_FAR - deep],
                          [ex, vista.y1, Z_FAR - deep], [ex, vista.y1, Z_FAR]],
                      ZERO8, "flat", mix("#465572", -0.16));
        if (q) q.lit = lightAt(ex * 0.6, 210, Z_FAR) * 1.2;
      });
      const sill = add(C, [[vx0, vista.y0, Z_FAR], [vx1, vista.y0, Z_FAR],
                           [vx1, vista.y0, Z_FAR - deep], [vx0, vista.y0, Z_FAR - deep]],
                       ZERO8, "flat", mix("#5a6a88", 0.1));
      if (sill) sill.lit = lightAt(0, 120, Z_FAR) * 1.3;
    } else {
      wallPiece(-WALL, 0, WALL, CEIL, lightAt(0, 210, Z_FAR));
    }
    if (bd) drawFar(C);''')

# ---- the arcade over the lane ----------------------------------------------------------------------
rep('''    meta.forEach((m) => {
      const hw = m.w / 2;''',
'''    beams.forEach((bz) => {          // so the ceiling has a rhythm, and the lane reads as a podium
      const y = CEIL - 26, half = 11;
      const under = add(C, [[-WALL, y, bz - half], [WALL, y, bz - half], [WALL, y, bz + half],
                            [-WALL, y, bz + half]], ZERO8, "flat", mix("#2c3a56", -0.1));
      if (under) under.lit = lightAt(0, CEIL - 30, bz) * 0.85;
      const face = add(C, [[-WALL, y, bz - half], [WALL, y, bz - half], [WALL, CEIL, bz - half],
                           [-WALL, CEIL, bz - half]], ZERO8, "flat", mix("#232f4a", -0.06));
      if (face) face.lit = AMBIENT * 0.7;
    });

    meta.forEach((m) => {
      const hw = m.w / 2;''')

io.open(p, "w", encoding="utf-8").write(s)
print("renderer patched")
