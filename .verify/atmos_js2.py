"""The second half of the dressing: the lanterns' bodies, a correct shopfront recess, and the small
generator fields those two need.

Written after reading the shipped emit() contract rather than guessing it: fills ride on `q.arg`,
`q.lit` is the warm pass, `q.air` is the air, and a "pat" quad samples its pattern through an exact
affine fit of the quad's own four corners — which is why a lantern gets one tile mapped whole and the
ribs land where the body is, without a single stroke of path drawing.
"""
import io

# ---- generator: the body of a lantern is authored too -------------------------------------------
p = "_gen_html.py"
g = io.open(p, encoding="utf-8").read()
a = '''            lights.append({"x": s["x"], "y": s["y"], "z": s["z"], "r": round(s["r"] * 3.4), "k": 0.62,
                           "tint": "rgba(255,176,92,0.5)", "body": "lantern", "bulb": False})'''
b = '''            # x, y and z are real positions in the lane; `r` is how far the light reaches, `size` how
            # wide the paper is, and `h` where the cord ties off. A glow with no body is a smudge.
            lights.append({"x": s["x"], "y": s["y"], "z": s["z"], "r": round(s["r"] * 3.4), "k": 0.62,
                           "tint": "rgba(255,176,92,0.5)", "body": "lantern", "bulb": False,
                           "size": round(s["r"] * 0.9), "h": round(s["y"] + s["r"] * 1.15)})'''
assert g.count(a) == 1
g = g.replace(a, b, 1)
io.open(p, "w", encoding="utf-8").write(g)

# ---- renderer ----------------------------------------------------------------------------------------
p = "js/site.js"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


rep('''    wet: L.bulb !== false,
  }));''',
'''    wet: L.bulb !== false,
    // A source with something hanging from the wire: a bulb is a dot, a lantern is a body, and the
    // cord is only drawn for sources that have one. Which lights are bare is authored upstream.
    body: L.body || null, size: L.size || 0, h: L.h || 0,
  }));''')

rep('''  const paintWindows = (c) => {''',
'''  const paintLantern = (c) => {
    // One tile is mapped across the whole body, so the seam of the tile is its top and bottom: the
    // white rims are painted straddling row zero and appear at both ends for free. The ribs are a
    // period of the tile, not a count, which is what keeps them horizontal at every depth.
    c.fillStyle = "#b0402e"; c.fillRect(0, 0, 128, 128);
    c.fillStyle = "rgba(240,232,214,0.95)"; c.fillRect(0, 120, 128, 8); c.fillRect(0, 0, 128, 8);
    for (let y = 20; y < 120; y += 16) {
      c.fillStyle = "rgba(52,18,14,0.55)"; c.fillRect(0, y, 128, 2);
      c.fillStyle = "rgba(255,206,150,0.16)"; c.fillRect(0, y - 6, 128, 4);
    }
    c.fillStyle = "rgba(12,10,16,0.5)"; c.fillRect(0, 56, 128, 3);   // the paper's spine
  };
  const paintWindows = (c) => {''')

rep('''    PATS.grate = mkTile(paintGrate);''',
'''    PATS.grate = mkTile(paintGrate);
    PATS.lantern = mkTile(paintLantern);''')

rep('''    drawMarks(C);
    if (bd) drawFar(C);''',
'''    drawMarks(C);
    lamps.forEach((L) => {
      if (L.body !== "lantern" || L.z < Z_BACK || L.z > Z_FAR + 40) return;
      // Two planes crossed like a plus. A lantern is roughly round, so from any yaw one of the two is
      // nearly edge on and the other carries the shape: the cheapest thing that still reads as a
      // volume you could walk under, with none of the per-frame trigonometry a lathe would cost.
      const R = L.size || 24, hh = R * 1.3;
      const UV = [0, 0, 128, 0, 128, -128, 0, -128];
      [[L.x - R, L.z, L.x + R, L.z], [L.x, L.z - R, L.x, L.z + R]].forEach(([ax, az, bx, bz]) => {
        const q = add(C, [[ax, L.y - hh, az], [bx, L.y - hh, bz], [bx, L.y + hh, bz], [ax, L.y + hh, az]],
                      UV, "pat", PATS.lantern);
        if (q) { q.lit = 1.45; q.air = haze(q.z) * 0.5; }
      });
    });
    if (bd) drawFar(C);''')

rep('''    lamps.forEach((L) => { if (L.wet) strand([L.x, CEIL, L.z], [L.x, L.y + 6, L.z], 0); });''',
'''    // A hanging lamp is tied to the wire above it, so the cord is drawn for anything with a body —
    // with `h` from the data rather than computed from a constant, because a lantern at 2.5 m and a
    // bulb at 2.7 m do not hang the same length.
    lamps.forEach((L) => {
      if (L.wet) strand([L.x, CEIL, L.z], [L.x, L.y + 6, L.z], 0);
      if (L.body === "lantern") strand([L.x, CEIL, L.z], [L.x, L.h || (L.y + 14), L.z], 0);
    });''')

# the shopfront, correctly: a recess is a box with its front face left off, and its two jambs have to
# run between the wall and the back plane in the wall's own axes, not be guessed at
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
        // nothing else. Every point is built through `P`, which takes the wall's own axes — a front on
        // a side wall runs along z, one on the end wall along x, and a face that hardcodes either is
        // wrong the moment the other one is authored.
        const along = Math.abs(m.ry) > 45;
        const dir = m.x < 0 ? 1 : -1;              // into the lane, whichever wall it is on
        const half = m.w / 2, ins = m.d, top = m.h * 0.84;
        const P = (u, v, y) => (along ? [m.x + dir * v, y, m.z + u] : [m.x + u, y, m.z + dir * v]);
        const Q = (pts, col, l, murk) => {
          const q = add(C, pts, ZERO8, "flat", col);
          if (q) { q.lit = l; if (murk !== undefined) q.air = murk; drawn.push(q); }
        };
        Q([P(-half, ins, 0), P(half, ins, 0), P(half, ins, m.h), P(-half, ins, m.h)], mix(base, -0.1), lit);
        // the light, and the dark band of shutter under it: a lit front is never lit to the floor
        Q([P(-half, ins, top), P(half, ins, top), P(half, ins, m.h), P(-half, ins, m.h)], "#f0c98a", 1.6, 0.04);
        Q([P(-half, 0, top), P(-half, ins, top), P(-half, ins, m.h), P(-half, 0, m.h)], mix("#4d5f5a", -0.1), lit * 0.8);
        Q([P(half, 0, top), P(half, ins, top), P(half, ins, m.h), P(half, 0, m.h)], mix("#4d5f5a", -0.1), lit * 0.8);
        Q([P(-half, 0, 0), P(-half, 0, top), P(-half, ins, top), P(-half, ins, 0)], mix("#4d5f5a", -0.28), lit * 0.55);
        Q([P(half, 0, 0), P(half, 0, top), P(half, ins, top), P(half, ins, 0)], mix("#4d5f5a", -0.28), lit * 0.55);''')

io.open(p, "w", encoding="utf-8").write(s)
print("lanterns and the front in")
