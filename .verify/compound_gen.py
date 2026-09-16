"""Tokyo as a compound: the end of the lane becomes a window onto the crossing, the tower and the mountain.

All of it is data, so the renderer never invents a place: the aperture, the arcade's rhythm, and the
far plane are authored here in scene centimetres and reach `js/site.js` as JSON islands.
"""
import io

p = "_gen_html.py"
s = io.open(p, encoding="utf-8").read()


def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f"x{s.count(old)}: {old[:70]!r}"
    s = s.replace(old, new, n)


# ---- 1. lamps can be authored whole, not only as a ceiling depth ----
rep('''    ceiling = LANE_CEIL - 34
    lights = [{"x": 0, "y": ceiling, "z": round(z * Z_SCALE), "r": 30} for z in d.get("lamps", [])]''',
    '''    ceiling = LANE_CEIL - 34
    lights = []
    for lamp in d.get("lamps", []):
        if isinstance(lamp, (int, float)):
            lights.append({"x": 0, "y": ceiling, "z": round(lamp * Z_SCALE), "r": 30})
        else:                       # authored whole: x, y, r, k, tint; z is still a record depth
            lights.append(dict(lamp, z=round(lamp["z"] * Z_SCALE)))''')

# ---- 2. the district's own scene data ----
rep('''        "lamps": [20, 120, 220, 320, 402],''',
    '''        # A bare number is a bulb on the ceiling line at that record depth; a dict is authored whole.
        # The last one is not a bulb at all: it is the city's own bounce coming in through the window,
        # which is why the end of the lane is the brightest part of it, and why it draws no glass and
        # throws no pool on the asphalt.
        "lamps": [20, 120, 220, 320, 402,
                  {"z": 430, "y": 240, "x": 0, "r": 900, "k": 0.55, "bulb": False,
                   "tint": "rgba(146,178,255,0.26)"}],
        # The arcade's rhythm overhead: where a beam crosses the ceiling, in scene centimetres.
        "beams": [220, 520, 820, 1120],
        # The window cut in the end wall, and what you see through it. These are NOT record depths and
        # are not multiplied by Z_SCALE: nothing here is hung from a record, and the far plane is
        # authored so a picture of Tokyo reads at the scale a picture shows it at. Mount Fuji is not
        # 900 m away, and the page does not pretend it is.
        "vista": {"x": 0, "y0": 108, "y1": 336, "w": 470},
        "backdrop": {
            "plaza": {"y": -260, "z0": 1240, "z1": 12000, "half": 3600},
            "crossing": {"y": -260, "z0": 2100, "z1": 3600, "x0": -1150, "x1": 1150,
                         "stripes": 9, "width": 96, "diagonals": True},
            "city": [
                {"x": -2200, "z": 2900, "w": 900, "h": 900, "win": 0.65},
                {"x": 2300, "z": 3100, "w": 800, "h": 1100, "win": 0.6},
                {"x": -1500, "z": 4200, "w": 1300, "h": 1500, "win": 0.5},
                {"x": -450, "z": 4600, "w": 1500, "h": 2300, "win": 0.42},
                {"x": 900, "z": 4100, "w": 1100, "h": 1200, "win": 0.6},
                {"x": 2100, "z": 4800, "w": 1400, "h": 2900, "win": 0.34},
                {"x": -2900, "z": 5400, "w": 1800, "h": 2600, "win": 0.4},
                {"x": 3400, "z": 5600, "w": 1600, "h": 1800, "win": 0.5},
            ],
            "tower": {"x": 1500, "z": 12000, "half": 520, "top": 4200,
                      "decks": [1500, 2600], "mast": 4700},
            "mountain": {"x": -18000, "z": 90000, "base": -260, "top": 14000,
                         "half": 30000, "crown": 5200, "snow": 0.3},
            "sky": [{"y0": -260, "y1": 1400, "c": "#3a4666", "glow": 0.62},
                    {"y0": 1400, "y1": 4200, "c": "#26314d"},
                    {"y0": 4200, "y1": 40000, "c": "#141e36"}],
        },''')

# Two things were hanging on the end wall; that wall is a window now, so they move to the sides.
rep('''            {"id": "poster-ticket", "kind": "poster", "img": "IMG/tokyo-poster-ticket.jpg", "x": 96, "z": 428, "y": 108, "ry": 0,''',
    '''            {"id": "poster-ticket", "kind": "poster", "img": "IMG/tokyo-poster-ticket.jpg", "x": -310, "z": 392, "y": 108, "ry": 90,''')
rep('''            {"id": "tower", "src": "IMG/tokyo-tower.jpg", "x": -170, "z": 424, "y": 96, "ry": 0,''',
    '''            {"id": "tower", "src": "IMG/tokyo-tower.jpg", "x": 314, "z": 380, "y": 96, "ry": -90,''')

# A rail to lean on, because the window sits at exactly the height you would put your hands on.
rep('''            {"id": "bin-2", "kind": "bin", "x": -262, "z": 356, "y": 0, "ry": 90,''',
    '''            {"id": "ledge", "kind": "ledge", "x": 0, "z": 426, "y": 96, "ry": 0,
             "title": "The lookout rail at the window",
             "hint": "The crossing, the tower and the mountain beyond are drawn at the size a "
                     "picture of them shows, not surveyed: 1 px is 1 cm in here, and a mountain does "
                     "not fit. Nothing out there is a record of anybody standing in it."},
            {"id": "bin-2", "kind": "bin", "x": -262, "z": 356, "y": 0, "ry": 90,''')

rep('''    "pipe": (16, 300, 16), "awning": (170, 12, 110), "sign": (120, 40, 10),
}''',
    '''    "pipe": (16, 300, 16), "awning": (170, 12, 110), "sign": (120, 40, 10),
    "ledge": (430, 12, 60),
}''')

# ---- 3. the islands ----
rep('''    return (f'<script type="application/json" data-walk-lights>{json.dumps(lights)}</script>\\n'
            f'      <script type="application/json" data-walk-wires>{json.dumps(wires)}</script>')''',
    '''    # Scene geometry travels as authored numbers only: the lights, the cables, the arcade, the
    # aperture, the far plane. An empty island is omitted rather than emitted as `[]`.
    islands = [("data-walk-lights", lights), ("data-walk-wires", wires),
               ("data-walk-beams", d.get("beams", []))]
    if d.get("vista"):
        islands.append(("data-walk-vista", d["vista"]))
    if d.get("backdrop"):
        islands.append(("data-walk-backdrop", d["backdrop"]))
    return "\\n      ".join(
        f'<script type="application/json" {name}>{json.dumps(data)}</script>'
        for name, data in islands if data)''')

# ---- 4. the copy: what the page says the space is ----
rep('''"id": "tokyo", "label": "Tokyo", "purpose": "Travel notes", "status": "open",''',
    '''"id": "tokyo", "label": "Tokyo",
        "purpose": "A compound, walked: alley, crossing, tower, mountain", "status": "open",''')
io.open(p, "w", encoding="utf-8").write(s)
import ast
ast.parse(s)
print("compound data in")
