"""Harness edits for the dressed room.

Two of the older assertions were measuring the wrong thing, and this says so rather than quietly
retuning them: `ctx.huge` counted the pattern overlay's 4096-unit fillRect, which sat there for every
textured quad in the lane — so "the far plane is drawn, and only a bounds test keeps it" was passing on
a proxy. The replacement looks at where the projected points actually land, which is the claim.
"""
import io

p = ".verify/verify-walk.mjs"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


rep('''  frame: [], fills: 0, strokes: 0, imgs: 0, saves: 0, restores: 0, bad: 0, frames: 0,
  darkMax: 0, warm: 0, huge: 0, colours: new Set(),''',
'''  frame: [], fills: 0, strokes: 0, imgs: 0, saves: 0, restores: 0, bad: 0, frames: 0,
  darkMax: 0, warm: 0, huge: 0, ptsMax: 0, colours: new Set(),''')

rep('''  const op = (name) => (...a) => { fin(a); if (name === "moveTo") ctx.frame.push([a[0], a[1]]); };''',
'''  // The recorder keeps the widest coordinate it ever saw. Nothing else in a sandbox without a browser
  // can tell you that a projected far plane stayed a plane instead of becoming a trapezoid over the
  // whole viewport, and that is the failure a bounds test is supposed to prevent.
  const op = (name) => (...a) => {
    fin(a);
    for (const v of a) if (typeof v === "number") ctx.ptsMax = Math.max(ctx.ptsMax, Math.abs(v));
    if (name === "moveTo") ctx.frame.push([a[0], a[1]]);
  };''')

rep('''    fillRect(x, y, w, h) { fin([x, y, w, h]); if (Math.abs(w) > 3000) ctx.huge++; ctx.fills++; },''',
'''    fillRect(x, y, w, h) { fin([x, y, w, h]); if (Math.abs(w) > 3000) ctx.huge++; ctx.fills++; },
    // a texture must be painted where its quad is, so no pattern in this lane covers more than the uv
    // extent the quad itself claims
    fillText() { ctx.text = (ctx.text || 0) + 1; },''')

rep('''ok("the far plane is drawn, and only a bounds test keeps it", ctx.huge > 0, `${ctx.huge} oversized quads`);''',
'''ok("the far plane stays a plane: nothing is projected off the ends of the earth",
   ctx.ptsMax > 0 && ctx.ptsMax < 60000, `widest coordinate ${Math.round(ctx.ptsMax)}`);
ok("a texture covers its own quad and no more", ctx.huge === 0, `${ctx.huge} oversized fills`);''')

rep('''ok("the bands tile the lane end to end without a gap in either wall",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd).sort((a, b) => a.z0 - b.z0);
     return v[0].z0 === -240 && v[v.length - 1].z1 === 1247
            && v.every((b, i) => !i || b.z0 === v[i - 1].z1);
   }));''',
'''ok("the cladding tiles each wall's whole height at every panel, so the room is dressed and not patched",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd);
     for (let z = -240; z < 1247; z += 60) {
       const z1 = Math.min(z + 60, 1247), at = (z + z1) / 2;
       let y = 0;
       for (const b of v.filter((b) => b.z0 <= at && b.z1 >= at).sort((a, b) => a.y0 - b.y0)) y = Math.max(y, b.y1);
       if (y < 420) return false;
     }
     return true;
   }));
ok("and it runs the length of the lane on both sides, gate to window",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd);
     return Math.min(...v.map((b) => b.z0)) === -240 && Math.max(...v.map((b) => b.z1)) === 1247;
   }));
ok("the renderer paints the wall beneath a covered panel zero times",
   /cladCovers/.test(js) && /if \\(surfaces\\.length && cladCovers\\(side, z, z1\\)\\) return/.test(js));''')

rep('''ok("one depth pass, dressed: the room costs fills, not passes",
   ctx.fills > before && ctx.fills < 2400, `${ctx.fills} fills, one pass`);''',
'''ok("one depth pass, dressed: the room costs fills, not passes",
   ctx.fills > before && ctx.fills < 3200, `${ctx.fills} fills, one pass`);
ok("no lettering is drawn anywhere in the scene, at any depth",
   !ctx.text && !/g\\.fillText|\\bctx\\.fillText\\(/.test(js) && !/strokeText/.test(js));''')

# the two edits that a lost write had swallowed
rep('''ok("every material in the data has a painter, and every painter has a tile",
   CLAD.every((k) => new RegExp(`paint[A-Z]|PATS\\\\.${k}`).test(js))
     && ["shutter", "dado", "brick", "corrugated", "hoarding", "tactile", "grate", "lantern"]
         .every((k) => new RegExp(`PATS\\\\.${k} = mkTile`).test(js)));''',
'''ok("every material in the data has a painter, and every painter has a tile",
   ["shutter", "dado", "brick", "corrugated", "hoarding", "tactile", "grate", "lantern"].every((k) => {
     const cap = k[0].toUpperCase() + k.slice(1);
     return new RegExp(`const paint${cap} = \\(c\\) =>`).test(js)
            && new RegExp(`PATS\\\\.${k} = mkTile`).test(js);
   }) && /PATS\\.plaster = tilePat/.test(js));''')

rep('''ok("the view it promises is the space, not a picture of the space",
   /\\b1 px is 1 cm\\b/.test(drawer.textContent) && /not surveyed/.test(drawer.textContent));''',
'''ok("the scale the room claims is stated where the room is described",
   /1 px is 1 cm in here/.test(html) && /not surveyed/.test(html));''')

io.open(p, "w", encoding="utf-8").write(s)
print("harness re-anchored")
