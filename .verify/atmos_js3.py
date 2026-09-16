"""The last of the dressing: paper lanterns with bodies, and a shopfront recess built in the wall's own
axes instead of assuming which wall it is on.
"""
import io

# ---- generator: a hanging light has to say how big it is and where the cord ties off ---------------
p = "_gen_html.py"
g = io.open(p, encoding="utf-8").read()
a = '''    for L in d.get("lanterns", []):
        lights.append(dict(L, r=max(96, L["r"] * 3.4), k=0.72, bulb=False,
                           tint="rgba(255,158,86,0.52)", body="lantern"))'''
b = '''    for L in d.get("lanterns", []):
        # The authored radius is the paper; how far the light reaches is a multiple of it. A glow with
        # no body is a smudge, so `size` and `h` travel with it and the renderer draws what it is told.
        lights.append(dict(L, r=max(96, L["r"] * 3.4), size=L["r"], h=L["y"] + round(L["r"] * 1.15),
                           k=0.72, bulb=False, tint="rgba(255,158,86,0.52)", body="lantern"))'''
assert g.count(a) == 1, "lantern block"
io.open(p, "w", encoding="utf-8").write(g.replace(a, b, 1))

# ---- renderer ---------------------------------------------------------------------------------------
p = "js/site.js"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


rep('''    wet: L.bulb !== false,
  }));''',
'''    wet: L.bulb !== false,
    // Sources with something hanging from the wire: a bulb is a dot of light, a lantern is a body you
    // can walk under. Which lights have a body is decided by the district, not by the renderer.
    body: L.body || null, size: L.size || 0, h: L.h || 0,
  }));''')

rep('''  const paintWindows = (c) => {''',
'''  const paintLantern = (c) => {
    // One tile is mapped across the whole body, so the tile's seam is the lantern's top and bottom: the
    // white rims are painted straddling row zero and land on both ends for free. The ribs are a period
    // of the tile rather than a count, which is what keeps them horizontal at every depth.
    c.fillStyle = "#b0402e"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(238,230,212,0.92)"; c.fillRect(0, 120, 128, 8); c.fillRect(0, 0, 128, 8);
    for (let y = 20; y < 120; y += 16) {
      c.fillStyle = "rgba(52,18,14,0.5)"; c.fillRect(0, y, 128, 2);
      c.fillStyle = "rgba(255,206,150,0.15)"; c.fillRect(0, y - 6, 128, 4);
    }
    c.fillStyle = "rgba(12,10,16,0.42)"; c.fillRect(0, 56, 128, 3);
  };
  const paintWindows = (c) => {''')

rep('''    PATS.grate = mkTile(paintGrate);''',
'''    PATS.grate = mkTile(paintGrate);
    PATS.lantern = mkTile(paintLantern);''')

rep('''    drawMarks(C);
    if (bd) drawFar(C);''',
'''    drawMarks(C);
    lamps.forEach((L) => {
      if (L.body !== "lantern" || L.z < Z_BACK - 40 || L.z > Z_FAR + 40) return;
      // Two planes crossed like a plus: from any yaw one is nearly edge on and the other carries the
      // silhouette. It is the cheapest thing that still reads as a volume, and it costs no trig.
      const R = L.size || 24, hh = R * 1.25, UV = [0, 0, 128, 0, 128, -128, 0, -128];
      [[L.x - R, L.z, L.x + R, L.z], [L.x, L.z - R, L.x, L.z + R]].forEach(([ax, az, bx, bz]) => {
        const q = add(C, [[ax, L.y - hh, az], [bx, L.y - hh, bz], [bx, L.y + hh, bz], [ax, L.y + hh, az]],
                      UV, "pat", PATS.lantern);
        if (q) { q.lit = 1.5; q.air = haze(q.z) * 0.5; }
      });
    });
    if (bd) drawFar(C);''')

rep('''    lamps.forEach((L) => { if (L.wet) strand([L.x, CEIL, L.z], [L.x, L.y + 6, L.z], 0); });''',
'''    // Anything with a body is tied to the wire above it, at the height the data gave it rather than a
    // constant: a lantern at 2.6 m and a bulb at 2.7 m do not hang the same length.
    lamps.forEach((L) => {
      if (L.wet) strand([L.x, CEIL, L.z], [L.x, L.y + 6, L.z], 0);
      if (L.body === "lantern") strand([L.x, CEIL, L.z], [L.x, L.h || (L.y + 14), L.z], 0);
    });''')

rep('''      } else if (shape === "front") {
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
        face(inset / 2, m.w / 2, 0, m.h * 0.86, mix(base, -0.18), lit * 0.7);''',
'''      } else if (shape === "front") {
        // A closed front with a light still burning behind it: the recess, its jambs, the transom, and
        // nothing else. Every point goes through `P`, which takes the wall's own axes — a front on a
        // side wall runs along z and one on the end wall along x, so a face built from either one
        // outright is wrong the moment the other is authored.
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;                 // into the lane, whichever wall this is
        const half = m.w / 2, ins = m.d, head = m.h * 0.84;
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, air) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (air !== undefined) q.air = air; drawn.push(q); }
        };
        // A lit front is never lit to the floor: the bottom of a closed front is shade, and the band of
        // light is above the shutter, where the interior lamp actually hangs.
        Q([P(-half, ins, 0), P(half, ins, 0), P(half, ins, m.h), P(-half, ins, m.h)], mix(base, -0.14), lit);
        Q([P(-half, ins, head), P(half, ins, head), P(half, ins, m.h), P(-half, ins, m.h)], "#f0c98a", 1.6, 0.05);
        Q([P(-half, 0, 0), P(-half, 0, head), P(-half, ins, head), P(-half, ins, 0)], mix("#4d5f5a", -0.3), lit * 0.6);
        Q([P(half, 0, 0), P(half, 0, head), P(half, ins, head), P(half, ins, 0)], mix("#4d5f5a", -0.3), lit * 0.6);
        Q([P(-half, 0, head), P(-half, ins, head), P(-half, ins, m.h), P(-half, 0, m.h)], mix("#4d5f5a", -0.06), lit * 0.8);
        Q([P(half, 0, head), P(half, ins, head), P(half, ins, m.h), P(half, 0, m.h)], mix("#4d5f5a", -0.06), lit * 0.8);''')

io.open(p, "w", encoding="utf-8").write(s)
print("lanterns and the front in")
