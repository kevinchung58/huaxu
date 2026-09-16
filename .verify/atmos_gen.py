"""Tokyo as an atmosphere in the room: what the walls are made of, what hangs over you, what is on the
floor, and what is standing against the wall.

Everything is authored here as data (scene centimetres for the surfaces of the room, record
centimetres for anything hung from a record), so the renderer never invents a position, a light, or a
letter. There is no invented signage and no lettering of any kind: where a real lane would have a shop
name, this one has a blank board and says why.
"""
import io

p = "_gen_html.py"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


# ---------------------------------------------------------------- 1. wall surfaces, floor marks, lanterns
rep('''        # The arcade's rhythm overhead: where a beam crosses the ceiling, in scene centimetres.
        "beams": [220, 520, 820, 1120],''',
'''        # The arcade's rhythm overhead: where a beam crosses the ceiling, in scene centimetres.
        "beams": [220, 520, 820, 1120],
        # What the walls are made of. This is the street's own kit, band by band: rolling shutters over
        # closed fronts, glazed tile up to hand height where a shopfront was glazed, painted plaster
        # above, corrugated patching where a wall has been opened and closed again, a plank hoarding
        # where a building is being worked on. Side -1 is the left wall, 1 the right, 0 the end wall;
        # the extents are scene centimetres, and the renderer tiles each band into the same 60 cm panels
        # as the wall behind it so an affine map stays exact.
        "surfaces": [
            {"side": -1, "z0": -240, "z1": 60, "y0": 0, "y1": 420, "kind": "plaster"},
            {"side": -1, "z0": 60, "z1": 300, "y0": 0, "y1": 300, "kind": "shutter"},
            {"side": -1, "z0": 60, "z1": 300, "y0": 300, "y1": 420, "kind": "corrugated"},
            {"side": -1, "z0": 300, "z1": 470, "y0": 0, "y1": 130, "kind": "dado"},
            {"side": -1, "z0": 300, "z1": 470, "y0": 130, "y1": 420, "kind": "brick"},
            {"side": -1, "z0": 470, "z1": 760, "y0": 0, "y1": 290, "kind": "shutter"},
            {"side": -1, "z0": 470, "z1": 760, "y0": 290, "y1": 420, "kind": "plaster"},
            {"side": -1, "z0": 760, "z1": 1010, "y0": 0, "y1": 420, "kind": "hoarding"},
            {"side": -1, "z0": 1010, "z1": 1247, "y0": 0, "y1": 120, "kind": "dado"},
            {"side": -1, "z0": 1010, "z1": 1247, "y0": 120, "y1": 420, "kind": "brick"},
            {"side": 1, "z0": -240, "z1": 40, "y0": 0, "y1": 420, "kind": "brick"},
            {"side": 1, "z0": 40, "z1": 190, "y0": 0, "y1": 300, "kind": "shutter"},
            {"side": 1, "z0": 40, "z1": 190, "y0": 300, "y1": 420, "kind": "plaster"},
            {"side": 1, "z0": 190, "z1": 470, "y0": 0, "y1": 140, "kind": "dado"},
            {"side": 1, "z0": 190, "z1": 470, "y0": 140, "y1": 420, "kind": "plaster"},
            {"side": 1, "z0": 470, "z1": 660, "y0": 0, "y1": 420, "kind": "hoarding"},
            {"side": 1, "z0": 660, "z1": 900, "y0": 0, "y1": 290, "kind": "shutter"},
            {"side": 1, "z0": 660, "z1": 900, "y0": 290, "y1": 420, "kind": "corrugated"},
            {"side": 1, "z0": 900, "z1": 1247, "y0": 0, "y1": 130, "kind": "dado"},
            {"side": 1, "z0": 900, "z1": 1247, "y0": 130, "y1": 420, "kind": "brick"},
        ],
        # And on the ground: the tactile guide path that runs beside the walls in a real lane, a painted
        # gutter line, two grates, a manhole, and one wet patch that holds the machine's light.
        "marks": [
            {"kind": "tactile", "x0": -300, "x1": -272, "z0": -240, "z1": 1247},
            {"kind": "tactile", "x0": 272, "x1": 300, "z0": -240, "z1": 1247},
            {"kind": "gutter", "x0": -318, "x1": 318, "z0": 1230, "z1": 1244},
            {"kind": "grate", "x0": -118, "x1": -42, "z0": 148, "z1": 168},
            {"kind": "grate", "x0": 60, "x1": 136, "z0": 700, "z1": 720},
            {"kind": "manhole", "x0": -40, "x1": 40, "z0": 430, "z1": 510},
            {"kind": "wet", "x0": -300, "x1": -60, "z0": 980, "z1": 1240},
        ],
        # Paper lanterns, hung where a wire already crosses the lane: each one is a light source with a
        # body, which is the only way the room can be lit by something you can also point at.
        "lanterns": [
            {"x": -120, "y": 268, "z": 150, "r": 27},
            {"x": 40, "y": 252, "z": 150, "r": 31},
            {"x": 210, "y": 262, "z": 560, "r": 26},
            {"x": -170, "y": 272, "z": 900, "r": 29},
        ],''')

# ---------------------------------------------------------------- 2. what stands in the room
rep('''            {"id": "bin-2", "kind": "bin", "x": -262, "z": 356, "y": 0, "ry": 90,''',
'''            {"id": "front-a", "kind": "front", "x": -316, "z": 62, "y": 0, "ry": 90,
             "glow": [{"r": 190, "k": 0.85, "tint": "rgba(255,166,86,0.42)", "dy": 150}],
             "title": "A closed front with its light still on",
             "hint": "Shutter down, interior light still running: the one hour of a lane where a room "
                     "is still warm and nobody is in it. Drawn, and nothing is for sale here."},
            {"id": "booth", "kind": "booth", "x": 246, "z": 85, "y": 0, "ry": -90,
             "glow": [{"r": 120, "k": 0.6, "tint": "rgba(214,232,255,0.34)", "dy": 160}],
             "title": "A telephone box",
             "hint": "Empty, and it holds no message: a district does not get to leave a note from "
                     "somebody. Glass is drawn as glass here, which means you can see the far side."},
            {"id": "bikes", "kind": "bikes", "x": -250, "z": 179, "y": 0, "ry": 0,
             "title": "Two bicycles, leaned against the wall",
             "hint": "Drawn bicycles. Nobody is claimed as their owner, and nothing is said about why "
                     "they are there — a lane has bicycles in it, that is all this asserts."},
            {"id": "planters", "kind": "planter", "x": 236, "z": 148, "y": 0, "ry": -90,
             "title": "Two planters by a closed front",
             "hint": "Set dressing with something growing in it, because an alley with only grey in it "
                     "is a drawing of an alley rather than one."},
            {"id": "cones", "kind": "cones", "x": -120, "z": 82, "y": 0, "ry": 0,
             "title": "A pair of cones, stored rather than working",
             "hint": "Nothing is being repaired here. They are stacked where they were left, which is "
                     "the only reason they are in the scene."},
            {"id": "mailbox", "kind": "mailbox", "x": 314, "z": 262, "y": 0, "ry": -90,
             "title": "A post box at the corner",
             "hint": "Red, boxy, at a corner: the shape that says Tokyo louder than any signage could, "
                     "and it carries no lettering because none is ours to invent."},
            {"id": "board-a", "kind": "signA", "x": -236, "z": 300, "y": 0, "ry": 0,
             "title": "A folding board, blank",
             "hint": "The one prop that could have carried a menu or a price and does not: invented "
                     "lettering would be a claim about a shop that does not exist."},
            {"id": "banner-left", "kind": "banner", "x": -316, "z": 221, "y": 232, "ry": 90,
             "title": "A cloth banner, hanging still",
             "hint": "Drawn as cloth so it has a fold and a weight. No text on it, same reason as the "
                     "board."},
            {"id": "banner-right", "kind": "banner", "x": 316, "z": 372, "y": 244, "ry": -90,
             "title": "A second banner, further down",
             "hint": "Two of them is what a lane has; three would be a set design."},
            {"id": "bin-2", "kind": "bin", "x": -262, "z": 356, "y": 0, "ry": 90,''')

rep('''    "pipe": (16, 300, 16), "awning": (170, 12, 110), "sign": (120, 40, 10),
    "ledge": (430, 12, 60),
}''',
'''    "pipe": (16, 300, 16), "awning": (170, 12, 110), "sign": (120, 40, 10),
    "ledge": (430, 12, 60),
    "front": (170, 300, 40), "booth": (110, 215, 110), "bikes": (150, 102, 55),
    "planter": (104, 50, 46), "cones": (74, 70, 34), "mailbox": (52, 74, 36),
    "signA": (70, 86, 52), "banner": (56, 150, 6),
}''')

# ---------------------------------------------------------------- 3. the islands
rep('''    islands = [("data-walk-lights", lights), ("data-walk-wires", wires),
               ("data-walk-beams", d.get("beams", []))]''',
'''    # Lanterns are lights, so they join the light island rather than becoming a decoration the
    # lighting does not know about. `dy` lets a prop's glow sit where the fitting actually is.
    for o in placed:
        for g in o.get("glow", []):
            w, h, _dep = OBJ_SIZE.get(o["kind"], (120, 160, 12))
            lights.append({"x": o["x"], "y": o.get("y", 0) + g.get("dy", h - 18), "z": o["z"],
                           "r": g["r"], "k": g["k"], "bulb": False,
                           **({"tint": g["tint"]} if "tint" in g else {})})
    for L in d.get("lanterns", []):
        lights.append(dict(L, r=max(96, L["r"] * 3.4), k=0.72, bulb=False,
                           tint="rgba(255,158,86,0.52)", body="lantern"))
    islands = [("data-walk-lights", lights), ("data-walk-wires", wires),
               ("data-walk-beams", d.get("beams", [])),
               ("data-walk-surfaces", d.get("surfaces", [])), ("data-walk-marks", d.get("marks", []))]''')

# the old glow loop is now superseded by the one above, which honours dy and tint
rep('''    for o in placed:
        for g in o.get("glow", []):
            _w, h, _dep = OBJ_SIZE.get(o["kind"], (120, 160, 12))
            lights.append({"x": o["x"], "y": o.get("y", 0) + h - 18, "z": o["z"],
                           "r": g["r"], "k": g["k"], "bulb": False})
''', "")

# ---------------------------------------------------------------- 4. what the page says the room is
rep('''        "purpose": "A compound, walked: alley, crossing, tower, mountain", "status": "open",''',
    '''        "purpose": "A Tokyo lane, dressed: shutters, lanterns, a crossing at its end",
        "status": "open",''')
io.open(p, "w", encoding="utf-8").write(s)
import ast
ast.parse(s)
print("atmosphere data in")
