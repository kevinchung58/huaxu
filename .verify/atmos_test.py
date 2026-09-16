"""The harness for a dressed room: what has to stay true now that the walls, the ground and the wire
carry the atmosphere.

The rule the assertions follow: a thing is only in the scene if the data says so, and a claim is only
in the copy if the data can pay for it.
"""
import io

p = ".verify/verify-walk.mjs"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


# ---- 1: the dressing is data ---------------------------------------------------------------------
rep('''ok("nothing writes prose into the scene", qa(".walk-hit").every((b) => !b.textContent.trim()));''',
'''const surf = island("surfaces"), ground = island("marks");
const CLAD = ["plaster", "shutter", "corrugated", "dado", "brick", "hoarding"];
ok("the walls are clad by data: every band names a material that has a pattern",
   !!surf && surf.length >= 18 && surf.every((v) => CLAD.includes(v.kind)), `${surf ? surf.length : 0} bands`);
ok("a band cannot lie about the lane: inside the walls, below the ceiling, on one side",
   surf.every((v) => Math.abs(v.side) === 1 && v.z0 >= -240 && v.z1 <= 1247 && v.y0 >= 0 && v.y1 <= 420
                    && v.y1 > v.y0 && v.z1 > v.z0));
ok("shutters, not paint, do most of the work: they are the commonest cladding",
   surf.filter((v) => v.kind === "shutter").length >= 4
     && surf.filter((v) => v.kind === "plaster").length < surf.length / 2);
ok("the bands tile the lane end to end without a gap in either wall",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd).sort((a, b) => a.z0 - b.z0);
     return v[0].z0 === -240 && v[v.length - 1].z1 === 1247
            && v.every((b, i) => !i || b.z0 === v[i - 1].z1);
   }));
ok("the ground is marked, not left as a plane", !!ground && ground.length >= 6);
ok("a pedestrian lane has its guide path, on both sides, for its whole length",
   ground.filter((m) => m.kind === "tactile").length === 2
     && ground.filter((m) => m.kind === "tactile").every((m) => m.z1 - m.z0 > 1400 && m.x1 - m.x0 < 40));
ok("every mark lies flat on the floor and inside the walls",
   ground.every((m) => m.x0 >= -318 && m.x1 <= 318 && m.z0 >= -240 && m.z1 <= 1247
                       && m.x1 > m.x0 && m.z1 > m.z0));
const lanterns = lights.filter((L) => L.body === "lantern");
ok("a lantern is a light source, so the room is lit by what hangs in it",
   lanterns.length === 4 && lanterns.every((L) => L.bulb === false && L.tint));
ok("and each one says how wide the paper is and where the cord ties off",
   lanterns.every((L) => L.size >= 20 && L.size <= 40 && L.h > L.y && L.y > 200 && L.y < 400));
const props = qa(".walk-hit").map((b) => ({ obj: b.dataset.obj,
  x: parseFloat(b.style.getPropertyValue("--x")), z: parseFloat(b.style.getPropertyValue("--z")) }));
ok("no corner of the lane is lit by an unpointable glow",
   lights.filter((L) => L.bulb === false && L.body !== "lantern").every((L) =>
     props.some((pr) => pr.x === L.x && pr.z === L.z) || L.z === 1247),
   `${lights.filter((L) => L.bulb === false && L.body !== "lantern").length} non-bulb sources`);
ok("the street kit is in the tab order, so it is part of the space and not a painted backdrop",
   ["front-a", "booth", "bikes", "planters", "cones", "mailbox", "board-a", "banner-left", "banner-right"]
     .every((id) => ids.includes(id)));
ok("the board stays blank and the copy says why: no lettering is ours to invent",
   /folding board, blank/i.test(html) && /invented lettering/i.test(html)
     && !/g\\.fillText|\\bfillText\\(/.test(js));
ok("nothing writes prose into the scene", qa(".walk-hit").every((b) => !b.textContent.trim()));''')

# ---- 2: the raster now has to paint them --------------------------------------------------------
rep('''ok("the backdrop adds its own fills to the room, not a second pass over it", ctx.fills > before);''',
'''ok("the backdrop adds its own fills to the room, not a second pass over it", ctx.fills > before);
ok("one depth pass, dressed: the room costs fills, not passes",
   ctx.fills > before && ctx.fills < 2400 && ctx.frames < 400, `${ctx.fills} fills, ${ctx.frames} clips`);
ok("the cladding is tiled into the wall's own panels, so an affine map stays exact",
   /surfaces\\.forEach/.test(js) && /PATS\\[sc\\.kind\\]/.test(js) && /SEG/.test(js));
ok("every material in the data has a painter, and every painter has a tile",
   CLAD.every((k) => new RegExp(`paint[A-Z]|PATS\\\\.${k}`).test(js))
     && ["shutter", "dado", "brick", "corrugated", "hoarding", "tactile", "grate", "lantern"]
         .every((k) => new RegExp(`PATS\\\\.${k} = mkTile`).test(js)));
ok("the room's atmosphere is drawn, not photographed: no material image is loaded for it",
   !/IMG\\/[a-z0-9-]*(shutter|brick|tile|plaster|corrugated|wood|asphalt)/.test(js + html));
ok("a shopfront is a recess in whichever wall it hangs on, built through the wall's own axes",
   /const P = \\(u, v, y\\) =>/.test(js) && !/face\\(inset\\/2/.test(js));
ok("glass lets the far side through, and says so in code", /rgba\\(186,214,240,0\\.2\\d?\\)/.test(js));
ok("a hanging lamp is tied to the wire: the cord is drawn for a body, at the authored height",
   /L\\.body === "lantern"\\) strand\\(\\[L\\.x, CEIL, L\\.z\\], \\[L\\.x, L\\.h/.test(js));''')

# ---- 4: the drawer copy now names the dressing -------------------------------------------------
rep('''ok("the district card states its kind and its new purpose",
   /A compound, walked: alley, crossing, tower, mountain/.test(drawer.textContent));''',
'''ok("the district card states its kind and its new purpose",
   /A Tokyo lane, dressed: shutters, lanterns, a crossing at its end/.test(drawer.textContent));
ok("the view it promises is the space, not a picture of the space",
   /\\b1 px is 1 cm\\b/.test(drawer.textContent) && /not surveyed/.test(drawer.textContent));''')

io.open(p, "w", encoding="utf-8").write(s)
print("harness updated")
