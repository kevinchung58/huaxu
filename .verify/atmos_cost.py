"""The dressing has to be free, or it is not dressing — it is a second scene painted over the first.

Two changes here, both about that. The wall loop consults the cladding instead of sitting underneath
it, so a shutter *is* the wall at that spot and the same rectangle is not painted twice. And a
textured quad no longer fills the screen with its pattern: it fills the patch of uv space the quad
actually covers, and it drops the flat under-fill that was hiding behind an opaque tile.
"""
import io

p = "js/site.js"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


rep('''    path();
    if (q.mode === "flat") g.fillStyle = q.arg; else g.fillStyle = "#2b3a56";
    g.fill();
    if (q.mode === "pat" && q.arg) {
      const m = affine(q.pts, q.pts.map((p) => [p.u, p.v]));
      if (m) {
        g.save(); path(); g.clip(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        g.fillStyle = q.arg; g.fillRect(-2048, -2048, 4096, 4096); g.restore();
      }
    } else if (q.mode === "pic" && q.img && q.img.complete && q.img.naturalWidth) {''',
'''    path();
    /* A textured quad is one fill, not two.

       Every tile in this lane is painted opaque — the wall's own, the asphalt, the shutters — so the
       flat colour that used to go down first was invisible work, and the pattern used to be filled
       over 4096² units and clipped back, which costs the same whether the quad is a 60 cm panel or a
       speck. The uv extent of the quad covers it exactly, and if the affine fit fails the flat colour
       is still what you see. */
    let fitted = false;
    if (q.mode === "pat" && q.arg) {
      const m = affine(q.pts, q.pts.map((p) => [p.u, p.v]));
      if (m) {
        const us = q.pts.map((p) => p.u), vs = q.pts.map((p) => p.v);
        const u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us);
        const v0 = Math.min.apply(null, vs), v1 = Math.max.apply(null, vs);
        g.save(); path(); g.clip(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        g.fillStyle = q.arg;
        g.fillRect(u0 - 1, v0 - 1, u1 - u0 + 2, v1 - v0 + 2);
        g.restore();
        fitted = true;
      }
    }
    if (!fitted) { g.fillStyle = q.mode === "flat" ? q.arg : "#2b3a56"; g.fill(); }
    if (!fitted && q.mode === "pic" && q.img && q.img.complete && q.img.naturalWidth) {''')

# The wall loop slices itself around the cladding rather than wearing it as a second layer.
rep('''    for (let z = Z_BACK; z < Z_FAR; z += SEG) {
      const z1 = Math.min(z + SEG, Z_FAR);
      const zc = (z + z1) / 2;
      [-1, 1].forEach((side) => {
        const px = side * WALL;
        const q = add(C, [[px, 0, z], [px, 0, z1], [px, CEIL, z1], [px, CEIL, z]],
                      [z * DPM, 0, z1 * DPM, 0, z1 * DPM, -CEIL * DPM, z * DPM, -CEIL * DPM],
                      "pat", tilePat);
        if (q) q.lit = lightAt(px, 210, zc);
      });''',
'''    // Whether the authored bands tile a panel's whole height: if they do, the wall's own tiling is
    // not painted at all, because the cladding will be. Anything less than full coverage keeps it, so
    // a half-dressed wall shows plaster behind the shutter rather than the void.
    const cladCovers = (side, z0, z1) => {
      const rows = surfaces.filter((sc) => sc.side === side && sc.z0 < z1 && sc.z1 > z0).sort((a, b) => a.y0 - b.y0);
      let y = 0;
      for (const r of rows) {
        if (r.y0 > y + 0.01) break;
        if (r.y1 > y) y = r.y1;
        if (y >= CEIL) return true;
      }
      return y >= CEIL;
    };
    for (let z = Z_BACK; z < Z_FAR; z += SEG) {
      const z1 = Math.min(z + SEG, Z_FAR);
      const zc = (z + z1) / 2;
      [-1, 1].forEach((side) => {
        if (surfaces.length && cladCovers(side, z, z1)) return;
        const px = side * WALL;
        const q = add(C, [[px, 0, z], [px, 0, z1], [px, CEIL, z1], [px, CEIL, z]],
                      [z * DPM, 0, z1 * DPM, 0, z1 * DPM, -CEIL * DPM, z * DPM, -CEIL * DPM],
                      "pat", tilePat);
        if (q) q.lit = lightAt(px, 210, zc);
      });''')

io.open(p, "w", encoding="utf-8").write(s)
print("emit and the wall loop in")
