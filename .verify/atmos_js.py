"""The room's own atmosphere: what the walls are clad in, what is on the ground, what hangs over you,
and the handful of new shapes those things need.

No pattern here is a photograph, and no position here is chosen by the renderer: both come from the
generator's islands, so the lane can be re-dressed by editing data. The only lettering in the scene
remains absent on purpose.
"""
import io

p = "js/site.js"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


# ---- pattern painters ------------------------------------------------------------------------------
rep('''  const paintWindows = (c) => {''',
'''  const paintShutter = (c) => {
    // A rolling shutter is horizontal ribs plus a bottom rail and a padlock hasp: nothing else, and
    // specifically no shop name, because a name would be a claim about a shop that does not exist.
    c.fillStyle = "#4d5f5a"; c.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 8) {
      c.fillStyle = "rgba(10,18,30,0.5)"; c.fillRect(0, y + 6, 128, 2);
      c.fillStyle = "rgba(212,228,240,0.10)"; c.fillRect(0, y, 128, 1);
    }
    c.fillStyle = "#3c4a47"; c.fillRect(0, 96, 128, 32);
    c.fillStyle = "rgba(9,14,26,0.75)"; c.fillRect(56, 104, 16, 12);
    c.fillStyle = "rgba(226,236,246,0.5)"; c.fillRect(60, 108, 8, 3);
  };
  const paintDado = (c) => {
    c.fillStyle = "#3f5170"; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "rgba(12,20,36,0.55)"; c.lineWidth = 2;
    for (let y = 0; y <= 128; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
    for (let y = 0; y < 128; y += 32) {
      for (let k = 0; k < 4; k++) {
        const x = k * 32 + (y / 32 % 2 ? 16 : 0);
        c.strokeRect(x, y, 32, 32);
        c.fillStyle = "rgba(214,232,255,0.07)"; c.fillRect(x + 3, y + 3, 11, 4);   // the glaze line
      }
    }
  };
  const paintBrick = (c) => {
    c.fillStyle = "#4a4038"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      const y = r * 16;
      for (let k = -1; k < 5; k++) {
        const x = k * 32 + (r % 2 ? 16 : 0);
        c.fillStyle = `rgb(${72 + (r * 7 + k * 11) % 18},${56 + (r * 5 + k * 7) % 14},${50 + (r * 3 + k) % 12})`;
        c.fillRect(x + 1, y + 1, 30, 14);
      }
    }
  };
  const paintCorrugated = (c) => {
    c.fillStyle = "#586474"; c.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 12) {
      c.fillStyle = "rgba(9,15,26,0.42)"; c.fillRect(x + 8, 0, 4, 128);
      c.fillStyle = "rgba(224,236,248,0.14)"; c.fillRect(x, 0, 3, 128);
    }
    c.fillStyle = "rgba(9,15,26,0.4)"; c.fillRect(0, 0, 128, 5); c.fillRect(0, 123, 128, 5);
  };
  const paintHoarding = (c) => {
    // Plywood over an opening, with the seam and the screw line: the most common wall a lane has.
    c.fillStyle = "#6b5a41"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(20,14,8,0.5)"; c.fillRect(62, 0, 4, 128);
    c.strokeStyle = "rgba(240,226,196,0.09)"; c.lineWidth = 1;
    for (let y = 8; y < 128; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
    c.fillStyle = "rgba(16,20,28,0.6)";
    for (const [sx, sy] of [[10, 12], [50, 12], [76, 12], [118, 12], [10, 116], [118, 116]]) c.fillRect(sx, sy, 3, 3);
  };
  const paintTactile = (c) => {
    // The yellow guide path, its truncated domes in a grid: this is the detail that tells a pedestrian
    // lane is a *street* rather than a corridor, and it is the last thing an alley gets before it is
    // rendered as a floor plane.
    c.fillStyle = "#b08a2a"; c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        const x = k * 32 + 16, y = r * 32 + 16;
        c.fillStyle = "rgba(255,222,128,0.85)"; c.beginPath(); c.arc(x, y, 8, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(96,72,18,0.55)"; c.beginPath(); c.arc(x + 2, y + 3, 6, 0, 6.2832); c.fill();
        c.fillStyle = "rgba(255,236,176,0.9)"; c.beginPath(); c.arc(x - 2, y - 3, 3, 0, 6.2832); c.fill();
      }
    }
    c.strokeStyle = "rgba(60,44,10,0.6)"; c.lineWidth = 2; c.strokeRect(1, 1, 126, 126);
  };
  const paintGrate = (c) => {
    c.fillStyle = "#242c3a"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "#0d1420";
    for (let x = 8; x < 128; x += 18) c.fillRect(x, 6, 8, 116);
    c.strokeStyle = "rgba(196,210,228,0.22)"; c.lineWidth = 3; c.strokeRect(2, 2, 124, 124);
  };
  const paintWindows = (c) => {''')

rep('''    tilePat = mkTile(paintWall);
    floorPat = mkTile(paintFloor);
    winPat = mkTile(paintWindows);''',
'''    tilePat = mkTile(paintWall);
    floorPat = mkTile(paintFloor);
    winPat = mkTile(paintWindows);
    PATS.shutter = mkTile(paintShutter);
    PATS.dado = mkTile(paintDado);
    PATS.brick = mkTile(paintBrick);
    PATS.corrugated = mkTile(paintCorrugated);
    PATS.hoarding = mkTile(paintHoarding);
    PATS.plaster = tilePat;
    PATS.tactile = mkTile(paintTactile);
    PATS.grate = mkTile(paintGrate);''')

rep('''  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null, winPat = null;''',
'''  let W = 0, H = 0, focal = 620, tilePat = null, floorPat = null, winPat = null;
  // One lookup for every cladding the walls and the ground can be wearing; a kind with no entry falls
  // back to the wall's own tiles, which is the honest default for a surface nobody specified.
  const PATS = {};''')

# ---- the authored dressing, read from its islands ---------------------------------------------------
rep('''  const bd = (readIsland("[data-walk-backdrop]")[0]) || null;''',
'''  const bd = (readIsland("[data-walk-backdrop]")[0]) || null;
  const surfaces = readIsland("[data-walk-surfaces]");
  const marks = readIsland("[data-walk-marks]");''')

rep('''  const SHAPE = { vending: "box", shrine: "box", utility: "box", ac: "box", crate: "box",''',
    '''  const SHAPE = { vending: "box", shrine: "box", utility: "box", ac: "box", crate: "box",
                  booth: "glass", bikes: "bikes", planter: "planter", cones: "cones",
                  mailbox: "box", signA: "aboard", banner: "cloth", front: "front",''')

rep('''                      steps: "#565f74", pipe: "#5c6a80", awning: "#8a3f3a", sign: "#2b3a56",
                      drain: "#111a2c" };''',
'''                      steps: "#565f74", pipe: "#5c6a80", awning: "#8a3f3a", sign: "#2b3a56",
                      drain: "#111a2c", booth: "#8b9ab0", bikes: "#39435a", planter: "#6e5540",
                      cones: "#c96a34", mailbox: "#9c3b33", signA: "#c8c2b2", banner: "#8f3a3a",
                      front: "#2c3a56", ledge: "#6b7890" };''')

# ---- cladding and ground marks, tiled into the same panels as the wall ----------------------------
rep('''    if (bd) drawFar(C);''',
'''    /* Cladding, panel by panel.

       A band of shutter is drawn as the same 60 cm slices as the wall behind it, because an affine
       texture map is only exact across a panel that narrow — a single stretched quad over four metres
       of corrugated sheet would bend the ribs where the wall bends them differently, and that
       mismatch is exactly what makes a scene read as a decal. Two centimetres off the wall keeps the
       depth sort deciding in the cladding's favour without a visible offset, so there is no z-fight
       and nothing to polygon-offset. */
    surfaces.forEach((sc) => {
      const px = sc.side * (WALL - 2);
      const from = Math.max(sc.z0, Z_BACK), to = Math.min(sc.z1, Z_FAR);
      const pat = PATS[sc.kind] || tilePat;
      for (let z = Math.floor(from / SEG) * SEG; z < to; z += SEG) {
        const z0 = Math.max(z, from), z1 = Math.min(z + SEG, to);
        if (z1 - z0 < 1) continue;
        const q = add(C, [[px, sc.y0, z0], [px, sc.y0, z1], [px, sc.y1, z1], [px, sc.y1, z0]],
            [z0 * DPM, -sc.y0 * DPM, z1 * DPM, -sc.y0 * DPM, z1 * DPM, -sc.y1 * DPM, z0 * DPM, -sc.y1 * DPM],
            "pat", pat);
        if (q) {
          q.lit = lightAt(px, (sc.y0 + sc.y1) / 2, (z0 + z1) / 2) * (sc.kind === "shutter" ? 1.12 : 1);
          // A shutter is metal and catches the light; plywood and brick mostly do not.
          if (sc.kind === "hoarding") q.lit *= 0.86;
        }
      }
    });
    drawMarks(C);
    if (bd) drawFar(C);''')

rep('''  const drawFar = (C) => {''',
'''  const drawMarks = (C) => {
    // The ground's own kit: the tactile guide path along each wall, a painted gutter line at the
    // threshold, grates, one manhole, and a wet patch that is only worth drawing because something
    // above it is bright enough to be seen in it.
    marks.forEach((mk) => {
      const pat = PATS[mk.kind];
      if (mk.kind === "manhole") {
        const cx = (mk.x0 + mk.x1) / 2, cz = (mk.z0 + mk.z1) / 2, r = (mk.x1 - mk.x0) / 2;
        const ring = (rad, col) => {
          const pts = [];
          for (let i = 0; i < 8; i++) {
            const a0 = (i / 8) * 6.2832;
            pts.push([cx + Math.cos(a0) * rad, 1, cz + Math.sin(a0) * rad * 0.8]);
          }
          const q = add(C, pts, ZERO8.slice(0, 16), "flat", col);
          if (q) { q.lit = lightAt(cx, 2, cz); q.air = haze(q.z) * 0.7; }
        };
        ring(r, "#2b3648");
        ring(r * 0.78, "#1a2330");
        return;
      }
      if (mk.kind === "wet") {
        const q = add(C, [[mk.x0, 1, mk.z0], [mk.x1, 1, mk.z0], [mk.x1, 1, mk.z1], [mk.x0, 1, mk.z1]],
                      ZERO8, "flat", "rgba(150,182,224,0.10)");
        if (q) { q.air = 0; q.lit = 0.2; }
        return;
      }
      const long = (mk.z1 - mk.z0) > SEG;
      const steps = long ? Math.ceil((mk.z1 - mk.z0) / SEG) : 1;
      for (let i = 0; i < steps; i++) {
        const z0 = mk.z0 + (i / steps) * (mk.z1 - mk.z0);
        const z1 = mk.z0 + ((i + 1) / steps) * (mk.z1 - mk.z0);
        const q = add(C, [[mk.x0, 1, z0], [mk.x1, 1, z0], [mk.x1, 1, z1], [mk.x0, 1, z1]],
            [z0 * DPM * 2, mk.x0 * DPM * 2, z0 * DPM * 2, mk.x1 * DPM * 2,
             z1 * DPM * 2, mk.x1 * DPM * 2, z1 * DPM * 2, mk.x0 * DPM * 2], "pat", pat);
        if (q) {
          q.lit = lightAt((mk.x0 + mk.x1) / 2, 4, (z0 + z1) / 2) * (mk.kind === "gutter" ? 0.8 : 1.05);
          q.air = haze(q.z) * 0.7;
        }
      }
    });
  };

  const drawFar = (C) => {''')

# ---- the new shapes --------------------------------------------------------------------------------
rep('''      } else if (shape === "plate") {''',
'''      } else if (shape === "front") {
        // A closed front with its interior light still on: the recess, its two jambs, the transom
        // above the shutter, and the warm plane at the back of it. Five quads, and the spill on the
        // ground is the authored lamp, not a painted gradient.
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;
        const inset = 34;
        const face = (dx, dz, y0, y1, col, lit) => {
          const half = m.w / 2;
          const p0 = along ? [m.x + dir * dx, y0, m.z - half] : [m.x - half, y0, m.z + dz];
          const p1 = along ? [m.x + dir * dx, y0, m.z + half] : [m.x + half, y0, m.z + dz];
          const q = add(C, [p0, p1, [p1[0], y1, p1[2]], [p0[0], y1, p0[2]]], ZERO8, "flat", col);
          if (q) { q.lit = lit; drawn.push(q); }
        };
        face(0, 0, 0, m.h, mix("#1a2740", 0.05), lit * 0.6);
        face(inset, 0, 0, m.h, mix("#2e3c56", -0.1), lit);            // the back of the recess
        face(inset, 0, m.h * 0.86, m.h, mix("#f0c98a", 0.2), 1.55);   // the light still burning
        face(inset / 2, -m.w / 2, 0, m.h * 0.86, mix(base, -0.18), lit * 0.7);
        face(inset / 2, m.w / 2, 0, m.h * 0.86, mix(base, -0.18), lit * 0.7);
      } else if (shape === "glass") {
        // A box you can see through: the frame first, then the panes at a fraction of the alpha an
        // opaque face would use, so the far side of the lane stays legible behind it. Painting glass
        // as a solid is the one way a booth reads as a cabinet.
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", "rgba(186,214,240,0.20)");
          if (q) { q.lit = lit; drawn.push(q); }
        });
        const top = add(C, [[m.x - m.w / 2, m.y + m.h, m.z - m.d / 2], [m.x + m.w / 2, m.y + m.h, m.z - m.d / 2],
                            [m.x + m.w / 2, m.y + m.h, m.z + m.d / 2], [m.x - m.w / 2, m.y + m.h, m.z + m.d / 2]],
                        ZERO8, "flat", mix("#5f6c80", 0.1));
        if (top) { top.lit = lit * 1.2; drawn.push(top); }
      } else if (shape === "bikes") {
        const along = Math.abs(m.ry) > 45;
        for (let b = 0; b < 2; b++) {
          const off = b ? m.w * 0.28 : -m.w * 0.22;
          const zc = along ? m.z + off : m.z;
          const xc = along ? m.x : m.x + off;
          const r = 33;
          for (const [sx, label] of [[-42, "w"], [42, "w"]]) {
            const pts = [];
            for (let i = 0; i < 8; i++) {
              const a0 = (i / 8) * 6.2832;
              pts.push(along ? [xc, m.y + r + Math.sin(a0) * r, zc + sx + Math.cos(a0) * r * 0.35]
                             : [xc + sx + Math.cos(a0) * r * 0.35, m.y + r + Math.sin(a0) * r, zc]);
            }
            const q = add(C, pts, ZERO8.slice(0, 16), "flat", "#141d2e");
            if (q) { q.lit = lit * 0.8; drawn.push(q); }
          }
          const frame = add(C, along
              ? [[xc, m.y + 26, zc - 30], [xc, m.y + 26, zc + 30], [xc, m.y + 72, zc + 24], [xc, m.y + 72, zc - 24]]
              : [[xc - 30, m.y + 26, zc], [xc + 30, m.y + 26, zc], [xc + 24, m.y + 72, zc], [xc - 24, m.y + 72, zc]],
              ZERO8, "flat", mix(base, 0.22));
          if (frame) { frame.lit = lit; drawn.push(frame); }
        }
      } else if (shape === "planter") {
        facesOf(m).forEach((f) => {
          const toward = f.n[0] * (C.x - f.p[0][0]) + f.n[1] * (C.eye - f.p[0][1])
                       + f.n[2] * (C.z - f.p[0][2]);
          if (toward <= 0) return;
          const q = add(C, f.p, ZERO8, "flat", mix(base, f.k));
          if (q) { q.lit = lit; drawn.push(q); }
        });
        // what grows in it, three leaves deep: a lane with only grey in it is a drawing of a lane
        for (let i = 0; i < 3; i++) {
          const q = add(C, [[m.x - 26 + i * 22, m.y + m.h, m.z - 14 + i * 9],
                            [m.x - 4 + i * 22, m.y + m.h, m.z + 16 - i * 8],
                            [m.x + 8 + i * 16, m.y + m.h + 34 - i * 7, m.z + 4],
                            [m.x - 18 + i * 16, m.y + m.h + 26 - i * 6, m.z - 6]],
                        ZERO8, "flat", i % 2 ? "#3f5b3a" : "#4a6a41");
          if (q) { q.lit = lit * 0.9; drawn.push(q); }
        }
      } else if (shape === "cones") {
        for (let i = 0; i < 2; i++) {
          const cx = m.x + (i ? 20 : -20), cz = m.z + (i ? 8 : -6);
          const q = add(C, [[cx - 17, m.y, cz], [cx + 17, m.y, cz], [cx + 5, m.y + m.h, cz],
                            [cx - 5, m.y + m.h, cz]], ZERO8, "flat", mix(base, 0.1));
          if (q) { q.lit = lit; drawn.push(q); }
          const band = add(C, [[cx - 12, m.y + 34, cz - 1], [cx + 12, m.y + 34, cz - 1],
                               [cx + 9, m.y + 46, cz - 1], [cx - 9, m.y + 46, cz - 1]],
                           ZERO8, "flat", "#e6eaf0");
          if (band) { band.lit = lit * 1.3; drawn.push(band); }
        }
      } else if (shape === "aboard") {
        // A folding board: two faces at an angle, both blank, and the shadow they cast on each other.
        const q0 = add(C, [[m.x - m.w / 2, m.y, m.z - m.d / 2], [m.x + m.w / 2, m.y, m.z - m.d / 2],
                           [m.x + m.w / 2 - 6, m.y + m.h, m.z + 4], [m.x - m.w / 2 + 6, m.y + m.h, m.z + 4]],
                       ZERO8, "flat", mix(base, 0.12));
        if (q0) { q0.lit = lit; drawn.push(q0); }
        const q1 = add(C, [[m.x + m.w / 2, m.y, m.z + m.d / 2], [m.x - m.w / 2, m.y, m.z + m.d / 2],
                           [m.x - m.w / 2 + 6, m.y + m.h, m.z - 4], [m.x + m.w / 2 - 6, m.y + m.h, m.z - 4]],
                       ZERO8, "flat", mix(base, -0.28));
        if (q1) { q1.lit = lit * 0.7; drawn.push(q1); }
      } else if (shape === "plate") {''')

io.open(p, "w", encoding="utf-8").write(s)
print("room dressing in")
