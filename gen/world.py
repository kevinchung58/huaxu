"""`gen/world.py` — the surveyed worlds: Niagara's falls and gorge, Goat Island, Toronto, the tunnel.

Each builder turns open data (OpenStreetMap relations, sourced heights) into the quads and primitives
the renderer draws, in the lane's own centimetres. It knows nothing about HTML: it takes a frame and
returns primitives. Split out of `_gen_html.py` in round 78 and proven byte-identical on all 19
emitted pages; the entry point is `_gen_html.py`.
"""
import json
import math
from gen.site import ROOT
# ── Districts ────────────────────────────────────────────────────────────────
# A district is a themed, walkable space, not a photo set. Two rules are encoded
# here because the owner fixed both on 2026-09-14:
#   1. no district opens without a declared purpose, and that purpose is printed on
#      the picker card. "What is this space for — travel, or a conference?" is the
#      first thing every new district answers; an undeclared purpose is how a travel
#      lane quietly becomes a claim about an event that did not happen.
#   2. status "soon" is a real state and is rendered as one. An unbuilt district stays
#      visibly unbuilt (the reference site's "Level G · Coming soon"; this site's own
#      empty-state rule). Decoration never stands in for content.
# Geometry is px in CSS' own handedness: x is across the lane, z is depth (positive =
# farther; the stylesheet negates it), y is height above the floor, ry turns the thing
# to face down the lane. The camera is the inverse of a camera: the world is moved and
# rotated, the eye never moves — which is why no matrix math is needed to keep a
# visitor inside the walls.
# Two kinds of space, and the kind is the rule set rather than the label: declaring a
# district academic buys it citations and imposes venue/date truth on every frame;
# declaring it personal frees it from that but forbids it from *looking* like a record.
# A travel space that is allowed to be drawn is the point of the split — a personal
# district may be illustration all the way down, and the UI must never let it read as
# attendance, a visit, or evidence.
KINDS = {
    "personal": {
        "label": "Personal",
        "gate": "Drawn frames are allowed. Nothing here may read as a record of "
                "attendance, and no frame claims a place was visited.",
        "cover": "The card's cover is drawn. It shows what the district is about, not what "
                 "the owner saw.",
    },
    "academic": {
        "label": "Academic",
        "gate": "Every frame carries a venue and a date, or it is not shown. Generated "
                "art may not stand in for evidence here.",
        "cover": "The cover must be a record of the room, the board or the stage. A drawn "
                 "cover would be a claim about an event.",
    },
}

# Centimetres, and three of them per kind: width, height, depth. Depth is what turns a prop from a
# decal into a solid — the renderer can then draw its top and its return, you can walk behind it, and
# the hit box wraps the same volume the picture shows, so the thing you can open is the thing you can
# see. Anything not listed falls back to a plausible box, which is the honest default for dressing.
OBJ_SIZE = {
    "vending": (96, 150, 52), "poster": (132, 176, 3), "poster frame": (120, 160, 20),
    "shrine": (66, 46, 44), "utility": (20, 336, 20), "noren": (150, 130, 6),
    "bollard": (16, 62, 16), "steps": (150, 44, 110), "drain": (70, 4, 96),
    "ac": (86, 30, 36), "crate": (62, 46, 52), "bin": (68, 86, 68),
    "pipe": (16, 300, 16), "awning": (170, 12, 110), "sign": (120, 40, 10),
    "ledge": (430, 12, 60),
    # Round 33: a stone post of the Table Rock parapet, the Journey deck's concrete parapet, a
    # tunnel mouth's reveal, and a lamp post on the trail (each sized per prop in its record).
    "parapet": (50, 96, 50), "deckwall": (600, 105, 30), "portal": (240, 175, 30),
    "lamp": (14, 420, 14),
    "glassfloor": (220, 4, 180),
    # The 1:25 Retro High Mart model; the record overrides its exact footprint-derived dimensions.
    "retrohighmart": (129, 508, 126),
    # Nakamise (round 32): one bay of the 1925 shop rows (width set per bay), and Kaminarimon.
    "shopbay": (470, 480, 150), "gate": (910, 700, 60),
    "front": (170, 300, 40), "booth": (110, 215, 110), "bikes": (150, 102, 55),
    "planter": (104, 50, 46), "cones": (74, 70, 34), "mailbox": (52, 74, 36),
    "signA": (70, 86, 52), "banner": (56, 150, 6), "pane": (120, 86, 22),
    "mirror": (78, 78, 24), "ladder": (36, 268, 48), "hydrant": (32, 94, 30),
    "recycle": (58, 72, 52), "meter": (46, 58, 24), "camera": (28, 24, 34),
    # The way on: a plain door at the far end of a lane, and the only object in the district whose
    # whole purpose is the page behind it. Height and width are a door's, not a prop's.
    "door": (96, 210, 14),
    # The winter walkway's kit. A snow bank is wide and low because that is what a ploughed edge
    # looks like; a bench and a rack are the two things every campus walk has and nobody draws.
    "bank": (520, 60, 150), "bench": (150, 84, 48), "rack": (140, 76, 90),
    # Round 64: the shade over the queue — a square canvas on a mast, and the mast is a post.
    "parasol": (420, 60, 420),
}

# Props whose ground footprint is physically occupied. The generator stamps these as collision
# boxes for the walker; floor graphics (drains, tracks, glass floor) and traversable steps are
# deliberately absent. A record may override `solid` per prop when its place calls for an exception.
WALK_SOLID_KINDS = frozenset({
    "bank", "bench", "bikes", "bin", "bollard", "booth", "cones", "crate",
    "hydrant", "ladder", "mailbox", "meter", "pipe", "planter", "plinth", "pole",
    "rack", "recycle", "shrine", "sign", "signA", "stall", "tree", "utility", "vending", "shopbay",
    "parapet", "deckwall", "lamp",
})
EYE = 168                    # the eye is 1.68 m above the floor; 1 px = 1 cm throughout
Z_SCALE = 2.9                # records are authored in the old 4.3 m lane; the space is 12.4 m

# The lane box and the stops belong to the place, not to the site. A Fukuoka alley and a Canadian
# corridor are different rooms; the renderer reads whatever the district authored through
# `data-lane-*`, so those numbers now sit in the record next to the objects that must fit inside them.
# A place that declares no lane gets the Tokyo one, which is what every district written so far
# assumed. `ceil` is a rendering choice rather than a record: the authored 360 is the diagram's lane,
# and the space you stand in needs the extra half metre or the bulbs hang at a walker's eyes.
LANE_FALLBACK = {"w": 640, "d": 430, "ceil": 420, "back": 240}

# The tower's own story: three drawn frames, the same hand as the hall's plates. They are the
# IG-story the prop opens first (landmark-space §2), and the `space` beside them is the district
# the story leads into. The rasters ride the existing `toronto-` IMG rule — generated plates,
# never a record that anyone stood anywhere.
NIAGARA_STORY = {
    "title": "The falls",
    "space": "rooms-niagara.html",
    "frames": [
        {"src": "IMG/niagara-1.jpg", "title": "The horseshoe from Table Rock",
         "alt": "Illustration of Horseshoe Falls from Table Rock: a curved green crest spilling "
                "into white mist, a faint rainbow, the gorge bending away, a railing at the viewer's edge.",
         "caption": "Table Rock: the water goes over the lip a few metres from the rail."},
        {"src": "IMG/niagara-2.jpg", "title": "The promenade, mist ahead",
         "alt": "Illustration of the promenade at Table Rock walking south: rough stone posts and "
                "black iron railing along the gorge at left with a lantern lamp post, a buff stone "
                "building with arched windows at right, a column of white mist rising over the falls ahead.",
         "caption": "The Canadian promenade: the falls announce themselves as weather."},
        {"src": "IMG/niagara-3.jpg", "title": "The American Falls across",
         "alt": "Illustration of the American Falls across the gorge: a straight white sheet onto "
                "grey boulders, Luna and Goat Islands at the right.",
         "caption": "Across the gorge: the American Falls on its talus, the islands between."},
    ],
}
TOWER_STORY = {
    "title": "The tower",
    "space": "rooms-cntower.html",
    "frames": [
        {"src": "IMG/toronto-tower-1.jpg", "title": "The tower at dusk",
         "alt": "Illustration of the CN Tower at dusk: a white-cream silhouette over a low navy "
                "skyline, one amber ring of windows at the main pod, the small upper pod and the mast "
                "above it, a pale band of lake behind.",
         "caption": "The one silhouette the city is known by, drawn at dusk."},
        {"src": "IMG/toronto-tower-2.jpg", "title": "The city from above",
         "alt": "Illustration of the night city seen from above through floor-to-ceiling pod "
                "windows: an aerial grid of navy blocks with amber windows, a dark lake at the shore.",
         "caption": "The LookOut glass at 346 m: the city below reads as a grid with a lake for an edge."},
        {"src": "IMG/toronto-tower-3.jpg", "title": "342 m of drop",
         "alt": "Illustration looking straight down through the glass floor's grid of panels: the "
                "tower's own shaft foreshortened to its three-lobed base, the night streets and the "
                "rail lands far below.",
         "caption": "The Glass Floor: the whole height of the tower read as the drop under your feet."},
    ],
}
# Nakamise's rows, generated from the sourced figures (round 32; TODO section 0n), because every
# number here is the street's: three runs of shops in the street's own order and share of its length,
# the two crossings at a street's width, and every bay a real shop's width -- the average of its row.
# Round 41 adopted the street's own association figures (asakusa-nakamise.jp/about, read 2026-10-17):
# the present street is about 250 m with 87 shops -- 52 on the east side and 35 on the west -- so a
# row's average frontage is 4.8 m east and 7.1 m west (250/52, 250/35). The older tourism figures
# (54/35 for 89 shops) had no official split to prefer and are retired. Walk centimetres
# here; each object is turned into record depth (/ Z_SCALE) as it is made. The murals are the
# ground colours of the Asakusa Emaki read off the night photographs -- sky and water blues, cloud
# golds, pine greens, the paper's cream, a festival red -- because their scenes, which show people,
# are not drawn.
NAKAMISE_RUNS = ((0, 550), (1000, 1850), (2350, 3016))
NAKAMISE_GAPS = ((550, 1000), (1850, 2350))
NAKAMISE_MURALS = (("#d6b45a", "#3f78b5", "#e9e2d0"), ("#4f8a5b", "#e2c46a", "#2f5d9a"),
                   ("#e9e2d0", "#c8473a", "#d6b45a"), ("#2f5d9a", "#e9e2d0", "#4f8a5b"),
                   ("#c8473a", "#d6b45a", "#3f78b5"))


def _nakamise():
    bays, lamps = [], []
    for tag, x, ry, width, row, side in (("w", -380, 90, 710, 35, "west"), ("e", 380, -90, 480, 52, "east")):
        n = 0
        for z0, z1 in NAKAMISE_RUNS:
            count = max(1, round((z1 - z0) / width))
            w = (z1 - z0) / count
            for i in range(count):
                n += 1
                zc = z0 + (i + 0.5) * w
                first, last = i == 0, i == count - 1
                o = {"id": f"shopbay-{tag}{n}", "kind": "shopbay", "x": x, "z": round(zc / Z_SCALE, 2),
                     "y": 0, "ry": ry, "w": round(w), "h": 480, "d": 150, "solid": True,
                     "mural": list(NAKAMISE_MURALS[(2 * n + (tag == "w")) % len(NAKAMISE_MURALS)]),
                     "title": f"A shop on the {side} row, shut for the night",
                     "hint": (f"One bay of the {side} row's {row} shops, at a real shop's width. The "
                              "shutter is down, as it is after about seven; the Asakusa Emaki painted on "
                              "it shows festivals and people, so only its ground colours are kept. The "
                              "fascia carries the shop's name in life and is blank here.")}
                posts = "2" if first and last else "end" if last else "first" if first else None
                if posts:
                    o["posts"] = posts
                bays.append(o)
                # The bay's own light, hanging under its eave as the paper lantern a shut shop
                # still leaves burning. Round 69h: this was a light with no body and a 0.22-alpha
                # tint, which the effects pass multiplies by the lamp's strength -- 0.10 opacity on
                # a 260 cm halo, so the row that is the whole street's light at night was three
                # white pixels in a frame. A hex tint is taken as the strength itself (scaledEffectTint)
                # and `body: lantern` gives it the cord, the paper body's halo and the cone of light
                # down to the walk, which is what makes a shut Nakamise read as lit.
                # `r` is the halo's radius in cm, not the light's reach: the hub street's own
                # lanterns carry 30 on a 22 cm body, and a 260 halo on a 3 m-high lane twice as wide
                # as that one read as a searchlight standing in the walk. Same body, same halo.
                lamps.append({"x": x, "y": 300, "z": round(zc / Z_SCALE, 2), "of": o["id"],
                              "r": 34, "k": 0.55, "body": "lantern", "size": 24,
                              "tint": "#ffd9a6"})
    # the white globes standing on the fascias, at the ends of each run, alternating rows
    for j, (z0, z1) in enumerate(NAKAMISE_RUNS):
        for k2, zz in enumerate((z0 + 40, z1 - 40)):
            lamps.append({"x": -305 if (j + k2) % 2 == 0 else 305, "y": 430, "z": round(zz / Z_SCALE, 2),
                          "r": 26, "k": 0.32, "bulb": True, "tint": "#fff2dc"})
    surfaces = []
    for side in (-1, 1):
        surfaces.append({"side": side, "z0": -103.45, "z1": 1040, "y0": 0, "y1": 500,
                         "kind": "concrete", "tone": 0.8})
        for g0, g1 in NAKAMISE_GAPS:
            surfaces.append({"side": side, "z0": round(g0 / Z_SCALE, 2), "z1": round(g1 / Z_SCALE, 2),
                             "y0": 0, "y1": 500, "kind": "concrete", "tone": 0.7})
    return bays, lamps, surfaces


NAKAMISE_BAYS, NAKAMISE_LAMPS, NAKAMISE_SURFACES = _nakamise()

# Round 56: the street's own small furniture. After the shops shut, what is still on Nakamise is
# not merchandise but the things a working street leaves out -- and every size here is a number the
# object table already carries (skills/japan-place/references/japan-vocabulary.md: the † measured
# figures and the ⚑ ones the site has committed), so the three Japanese rooms cannot drift apart
# about how wide a crate is. The list is authored in scene centimetres like the runs above and put
# through / Z_SCALE as record depth, the same road every other object here takes.
# Nothing in it is lettered, nobody is in it, and the one thing that lights itself is the machine.
def _nakamise_dressing():
    dressing = []

    def put(oid, kind, x, z, ry, w, h, d, title, hint, y=0, glow=None):
        o = {"id": oid, "kind": kind, "x": x, "z": round(z / Z_SCALE, 2), "y": y, "ry": ry,
             "w": w, "h": h, "d": d, "title": title, "hint": hint}
        if glow:
            o["glow"] = glow
        dressing.append(o)

    # The Shin-Nakamise mouth, west pier: the machine that stays on, and the evening's delivery
    # still stacked beside it. 96 x 150 x 52 is the record's machine (⚑ Tokyo); the crate is the
    # table's 62 x 46 x 52 (⚑). A dark arcade mouth with one lit cabinet is the whole picture.
    put("vending-nakamise", "vending", -429, 640, 90, 96, 150, 52,
        "The vending machine, still on",
        "The one thing on this street that does not close: a white cabinet under the arcade's "
        "mouth, its shelves backlit and the cans drawn as studs. No brand and no price -- the "
        "panel over the glass is blank, because what is printed on a real machine is not this "
        "site's to print. It is why the arcade reads at all at this hour.",
        glow=[{"r": 130, "k": 0.62, "dy": 148, "tint": "rgba(196,226,255,0.46)"}])
    for n, (zz, yy) in enumerate(((722, 0), (722, 46), (792, 0))):
        put(f"crate-nakamise-{n + 1}", "crate", -429, zz, 90, 62, 46, 52,
            ("A delivery crate at the pier", "The crate stacked on it", "A crate beside them")[n],
            "A beer crate's size, 62 x 46 x 52, squared against the arcade pier where the "
            "delivery stopped rather than scattered about. Slats and a corner joint; nothing "
            "stencilled on it, because a crate's stencil is its owner's.")
    # The mouth's east pier: the bin, and the bicycles nobody has taken in.
    put("bin-nakamise", "bin", 421, 620, -90, 68, 86, 68,
        "The street's bin",
        "A litter bin beside the arcade's other pier: 68 cm square and 86 high, lid flat and "
        "empty. Its opening is drawn; the words that would sit beside it on a real one are not "
        "here to be read.")
    put("bikes-nakamise", "bikes", 400, 790, -90, 150, 102, 55,
        "Bicycles left against the pier",
        "Two bicycles at a standstill, the way a working street holds them: frames to the pier, "
        "front wheels turned in. 150 long and 102 to the bars, with no badge on either and no "
        "rack to lock them to -- they say the street is used, and nothing about who used it.")
    # Along the rows: the shutters' own furniture. A planter at a corner, a bench under a shutter,
    # a folding board put away face to the shutter, a ladder that was not taken back inside.
    put("planter-nakamise-1", "planter", 278, 1010, 0, 104, 50, 46,
        "A planter at the east corner",
        "A tub at the row's corner where the arcade crosses, 104 x 50 x 46, with a single "
        "shrub in it. The one living thing on the pavement after closing, and it does not need "
        "anybody to be here.")
    put("planter-nakamise-2", "planter", -278, 1838, 0, 104, 50, 46,
        "A planter at the west corner",
        "The same tub at Denboin-dori's corner, on the other side of the street. Two planters "
        "marking two crossings, at the size the table gives a planter.")
    put("bench-nakamise-w", "bench", -292, 1300, 90, 150, 84, 48,
        "A bench against the west shutters",
        "A shop's bench, 150 long and 84 high, standing 13 cm off the shutter with the seat "
        "facing the lane. After closing there is nobody to sit on it; it is here because a "
        "street that holds only paving reads as a diagram of a street.")
    put("signa-nakamise", "signA", -262, 1520, 90, 70, 86, 52,
        "A folding board, put away",
        "A shop's A-frame, folded and stood face to the shutter. Both faces are blank: the "
        "lettering on a real board belongs to the shop that owns it, and there is no shop here "
        "to own it.")
    put("ladder-nakamise", "ladder", -300, 1740, 90, 36, 268, 48,
        "A ladder, left leaning",
        "Two stiles, five rungs and 268 cm of it, leaning at the shutter where the shutter's "
        "own maintenance left it. Leaning, not standing: a ladder that stands free in a lane is "
        "the first thing a gust of wind puts down.")
    # Denboin-dori, the second crossing: the wall's fittings and the corner's furniture.
    put("pipe-nakamise-w", "pipe", -447, 1865, 0, 16, 300, 16,
        "A downpipe at the crossing",
        "Sixteen centimetres of cast downpipe against the wall where Denboin-dori opens, "
        "running 300 up from the paving. The street's rainwater has to go somewhere and it goes "
        "here.")
    put("pipe-nakamise-e", "pipe", 447, 1875, 0, 16, 300, 16,
        "The other downpipe",
        "Its pair on the east side of the same crossing, the same 16 x 300 x 16. The two are "
        "what makes the cross street read as a street rather than a gap in the row.")
    put("ac-nakamise", "ac", -437, 2100, 90, 86, 30, 36,
        "An air-conditioning unit",
        "A wall unit at 240 up: 86 wide, 30 high, 36 deep, its fan grille turned to the lane "
        "and its pipes running down. The table keeps these low and wide on purpose -- that is "
        "the wall-mounted read, not a floor cabinet.", y=240)
    put("rack-nakamise", "rack", -409, 2200, 90, 140, 76, 90,
        "A rack under the wall",
        "A shop's rack, 140 wide and 76 high, standing empty in the recess beside the crossing. "
        "Whatever it holds in the day was taken in with the shutters.")
    put("mirror-nakamise", "mirror", 443, 2345, 90, 78, 78, 24,
        "A convex mirror at Denboin-dori",
        "The most Tokyo object a lane can hold: a 78 cm convex disc on its bracket at 250 up, "
        "turned to the crossing. The glass is drawn blank with one highlight -- a mirror that "
        "invented a reflection would be the renderer making somebody up.", y=250)
    put("mailbox-nakamise", "mailbox", 429, 2290, -90, 52, 74, 36,
        "The postbox at the corner",
        "A red box 52 wide and 74 high at the crossing's corner, its slot on the lane side and "
        "its plate left blank. A postbox is the one street object whose whole face is writing, "
        "and so the one that is most completely empty here.")
    # The last run, before the plaza: the hydrant at the kerb, and a bench at the final shops.
    put("hydrant-nakamise", "hydrant", 280, 2560, 0, 32, 94, 30,
        "The standpipe at the last shops",
        "Thirty-two centimetres of red standpipe at the shutter line, 94 high with its two "
        "caps. Nothing is claimed about water or about anybody's fire; it is a silhouette the "
        "street is known by and it was missing.")
    put("bench-nakamise-e", "bench", 292, 2820, -90, 150, 84, 48,
        "A bench at the last shops",
        "The east row's bench, at the same 150 x 84 x 48 as its pair two crossings back, so the "
        "two ends of the street answer each other.")
    return dressing


NAKAMISE_DRESSING = _nakamise_dressing()

# Moji Port's layout (round 32; TODO section 0n). OpenStreetMap coordinates, turned into metres from
# Mojiko Station and then into the table's frame: the table is read from the head of the No. 1 basin
# looking north-west, so its right is north-east, at 1.5 cm to the metre for every model and for the
# strait beyond the far wall. Walk centimetres out; record depths are these / Z_SCALE.
MOJI_ORIGIN = (33.9451155, 130.9614754)            # Mojiko Station, OSM relation 2532442


def moji_metric_xy(lat, lon):
    """The table's unrounded right/forward metres, before its 1.5 cm/m display scale."""
    e = (lon - MOJI_ORIGIN[1]) * 92436.0
    n = (lat - MOJI_ORIGIN[0]) * 110922.0
    return (e + n) * 0.70711, (n - e) * 0.70711


def moji_xy(lat, lon):
    r, f = moji_metric_xy(lat, lon)                  # right (north-east), forward (north-west)
    return round((r - 214) * 1.5), round(2230 + (f + 50) * 1.5)


_KANMON_S = moji_xy(33.9590201, 130.9637599)        # the Kanmon Bridge's Moji end (OSM way 1116301427)
_KANMON_N = moji_xy(33.9643462, 130.9537995)        # and its Shimonoseki end
_YUME = moji_xy(33.9498014, 130.9297392)            # Kaikyo Yume Tower (OSM way 550189992)
_ext = lambda a, b, k: [round(b[0] + (b[0] - a[0]) * k), round(b[1] + (b[1] - a[1]) * k)]
MOJI_STRAIT = {
    "y": 81, "z0": 2610, "z1": 11000, "half": 9000,
    # The Moji coast running north on the right, from the table's far corner to the bridge's Moji
    # end, and the Shimonoseki shore from the bridge's far end west past the tower. Each line runs on
    # past its last measured point along its own direction (`_ext`): the shore continues, and is not
    # surveyed there.
    "moji": [[360, 2610], list(_KANMON_S), _ext((360, 2610), _KANMON_S, 0.5)],
    "shore": [list(_KANMON_N), list(_YUME), _ext(_KANMON_N, _YUME, 0.6)],
    "yume": {"x": _YUME[0], "z": _YUME[1], "h": round(153 * 1.5), "sphere": round(143 * 1.5), "r": 16},
    "kanmon": {"a": list(_KANMON_S), "b": list(_KANMON_N), "tower": round(141 * 1.5),
               "deck": round(61 * 1.5), "side": round(178 / 1068, 4), "width": 19},
    # Two of the strait's ships on the house clock, mid-channel between the shores.
    "ships": [{"from": [1364, 4400], "to": [-4200, 4700], "len": 225, "period": 80, "phase": 0.0},
              {"from": [-4200, 5000], "to": [1300, 4700], "len": 170, "period": 110, "phase": 0.5}],
}


# Round 36: the buildings left the table for their own stands; the table keeps their locations as
# OpenStreetMap footprints at 1.5 cm to the metre, laid on the board as low site-plan plates. The
# Retro High Mart is added here from way 292429354; its separate tower model uses the same ring at
# 1:25. The six-node outline is mapped geometry, not a surveyed architectural plan.
MOJI_RETRO_TOWER_RING = (
    (130.9639904, 33.9484316), (130.9640685, 33.9485535), (130.9641226, 33.9486380),
    (130.9643610, 33.9485329), (130.9642288, 33.9483265), (130.9641068, 33.9483803),
)
MOJI_TOWER_METRIC_RING = [moji_metric_xy(lat, lon) for lon, lat in MOJI_RETRO_TOWER_RING]
MOJI_TOWER_CENTRE_M = (
    (min(p[0] for p in MOJI_TOWER_METRIC_RING) + max(p[0] for p in MOJI_TOWER_METRIC_RING)) / 2,
    (min(p[1] for p in MOJI_TOWER_METRIC_RING) + max(p[1] for p in MOJI_TOWER_METRIC_RING)) / 2,
)
MOJI_TOWER_FOOTPRINT = [[round(r - MOJI_TOWER_CENTRE_M[0], 6),
                         round(MOJI_TOWER_CENTRE_M[1] - f, 6)]
                        for r, f in MOJI_TOWER_METRIC_RING]
MOJI_TOWER_WIDTH_M = max(p[0] for p in MOJI_TOWER_FOOTPRINT) - min(p[0] for p in MOJI_TOWER_FOOTPRINT)
MOJI_TOWER_DEPTH_M = max(p[1] for p in MOJI_TOWER_FOOTPRINT) - min(p[1] for p in MOJI_TOWER_FOOTPRINT)
MOJI_TOWER_HEIGHT_M = 127.0                 # nominal top incl. the rooftop helipad: CTBUH, ja-wiki (127 m 最高部), AIJ paper (127 m; 126.95 m record, 127.4 m measured); OSM height=115 is an unattributed tag, not adopted
MOJI_TOWER_OBSERVATION_M = 103.0            # City / MLIT describe the public view at this height
MOJI_TOWER_FLOORS = 31
MOJI_TOWER_SCALE = 4.0                      # scene centimetres per metre at 1:25
MOJI_OUTLINES = (
    # Mojiko Station, relation 2532442 (outer ways 188008075, 188008098)
    ((130.9610539, 33.9451938), (130.9611674, 33.9451308), (130.9614933, 33.9449313), (130.9616477, 33.9448255),
     (130.9618394, 33.9450407), (130.9617446, 33.9451002), (130.9618081, 33.9451705), (130.9614982, 33.9453634),
     (130.9614526, 33.9453136), (130.9612892, 33.9454064)),
    # the former Osaka Shosen building, way 627252015
    ((130.9620254, 33.9461348), (130.962158, 33.9460547), (130.9622006, 33.9461033), (130.9622885, 33.9460502),
     (130.9622446, 33.9460003), (130.9623058, 33.9459634), (130.9624488, 33.9461263), (130.9621673, 33.9462964)),
    # the former Moji Customs, way 976479446
    ((130.9633787, 33.9476961), (130.9634407, 33.9476671), (130.9634617, 33.9476974), (130.9634743, 33.9477155),
     (130.9637089, 33.947604), (130.9637901, 33.9477203), (130.9637291, 33.9477495), (130.9637213, 33.9477381),
     (130.9634672, 33.9478621), (130.9634458, 33.9478312), (130.9634659, 33.9478212)),
    # the Dalian Friendship Memorial Hall, way 823695331
    ((130.9641855, 33.9479807), (130.9642155, 33.9479872), (130.9642328, 33.9480147), (130.9642789, 33.9479750),
     (130.9643405, 33.9480243), (130.9642897, 33.9480681), (130.9642984, 33.9480833), (130.9642401, 33.9481056),
     (130.9642557, 33.9481336), (130.9641459, 33.9481757), (130.9641420, 33.9481687), (130.9641170, 33.9481686),
     (130.9640928, 33.9481583), (130.9640739, 33.9481665), (130.9640456, 33.9481553), (130.9640499, 33.9481255),
     (130.9640394, 33.9481070), (130.9640486, 33.9480754), (130.9640671, 33.9480655), (130.9640714, 33.9480400),
     (130.9640972, 33.9480262), (130.9641147, 33.9480255), (130.9641179, 33.9480311), (130.9641358, 33.9480239),
     (130.9641248, 33.9480051), (130.9641520, 33.9479942)),
    # Mojiko Retro High Mart, the six-node building way 292429354 (outline only; height tag conflicts)
    MOJI_RETRO_TOWER_RING,
)
MOJI_BLOCKS = [{"p": [list(moji_xy(lat, lon)) for lon, lat in ring], "h": 1.2}
               for ring in MOJI_OUTLINES]


def _moji_massing(name, block, title):
    """One context block as its own prop, its box the outline's own, so it is sited (and checked for
    clashes) where it stands and not across the whole table."""
    xs, zs = [p[0] for p in block["p"]], [p[1] for p in block["p"]]
    return {"id": f"massing-{name}", "kind": "massing", "x": round((min(xs) + max(xs)) / 2, 1),
            "z": round((min(zs) + max(zs)) / 2 / Z_SCALE, 2), "y": 80, "ry": 0,
            "w": max(xs) - min(xs), "h": block["h"], "d": max(zs) - min(zs), "blocks": [block],
            "title": title,
            "hint": "Its footprint, in the outline the map gives it, at the table's scale. Its model "
                    "is on a stand down the hall."}

# ---- Surveyed worlds (round 33) ------------------------------------------------------------------
# The three Toronto-owned child spaces were walked in round 33 against the standard round 32 set
# ("real, sourced, not made up") and failed it: the LookOut's glass wore a generic aerial tile on both
# hands, the falls were the hall's table model stood large and mirrored, the tunnel had a daylight
# sky for a roof. What replaces them is geometry, not art direction: OpenStreetMap coordinates and the
# sourced heights below, turned into scene centimetres here and drawn by `drawWorld` in js/site.js,
# which invents nothing. Every list says where it came from; TODO section 0o has the sources.

def ll_m(lat, lon, lat0, lon0):
    """Metres east and north of (lat0, lon0) on the local tangent plane (WGS84 series)."""
    phi = math.radians(lat0)
    k_lat = 111132.954 - 559.822 * math.cos(2 * phi) + 1.175 * math.cos(4 * phi)
    k_lon = 111412.84 * math.cos(phi) - 93.5 * math.cos(3 * phi)
    return ((lon - lon0) * k_lon, (lat - lat0) * k_lat)


def dp_simplify(pts, tol):
    """Douglas-Peucker on a 2D polyline in metres: OSM's survey detail kept to `tol` metres."""
    if len(pts) < 3:
        return list(pts)
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    L = math.hypot(dx, dy) or 1e-9
    far, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + bx * ay - by * ax) / L
        if d > far:
            far, idx = d, i
    if far <= tol:
        return [pts[0], pts[-1]]
    return dp_simplify(pts[:idx + 1], tol)[:-1] + dp_simplify(pts[idx:], tol)


def resample(pts, n):
    """A polyline as n+1 points evenly spaced along its length."""
    seg = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
    total = sum(seg) or 1e-9
    out, acc, i = [], 0.0, 0
    for k in range(n + 1):
        target = total * k / n
        while i < len(seg) - 1 and acc + seg[i] < target:
            acc += seg[i]
            i += 1
        t = 0.0 if seg[i] == 0 else min(1.0, max(0.0, (target - acc) / seg[i]))
        out.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t))
    return out


def left_normals(pts):
    """Unit normals to the left of travel along a polyline (east/north metres)."""
    out = []
    for i in range(len(pts)):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1e-9
        out.append((-dy / L, dx / L))
    return out


def clip_rect(poly, x0, y0, x1, y1):
    """Sutherland-Hodgman: a polygon clipped to an axis-aligned cell."""
    def clip(pts, inside, cut):
        out = []
        for i in range(len(pts)):
            p, q = pts[i], pts[(i + 1) % len(pts)]
            pin, qin = inside(p), inside(q)
            if pin:
                out.append(p)
            if pin != qin:
                out.append(cut(p, q))
        return out
    def xcut(x):
        return lambda p, q: (x, p[1] + (q[1] - p[1]) * (x - p[0]) / ((q[0] - p[0]) or 1e-9))
    def ycut(y):
        return lambda p, q: (p[0] + (q[0] - p[0]) * (y - p[1]) / ((q[1] - p[1]) or 1e-9), y)
    pts = list(poly)
    for inside, cut in ((lambda p: p[0] >= x0, xcut(x0)), (lambda p: p[0] <= x1, xcut(x1)),
                        (lambda p: p[1] >= y0, ycut(y0)), (lambda p: p[1] <= y1, ycut(y1))):
        if not pts:
            break
        pts = clip(pts, inside, cut)
    return pts


class LaneFrame:
    """A place's metres (east, north, up) to a lane's scene centimetres: x right, y up, z ahead."""

    def __init__(self, e0, n0, u0, heading):
        self.e0, self.n0, self.u0, self.heading = e0, n0, u0, heading
        h = math.radians(heading)
        self.s, self.c = math.sin(h), math.cos(h)

    def cm(self, e, n, u):
        de, dn = e - self.e0, n - self.n0
        return [round((de * self.c - dn * self.s) * 100), round((u - self.u0) * 100),
                round((de * self.s + dn * self.c) * 100)]

    def dist(self, e, n):
        return math.hypot(e - self.e0, n - self.n0)


def _fn(fr, de, dn):
    """A horizontal direction in the place's metres as a unit vector in the lane's x/z."""
    x, z = de * fr.c - dn * fr.s, de * fr.s + dn * fr.c
    L = math.hypot(x, z) or 1e-9
    return [round(x / L, 3), round(z / L, 3)]


def _prim(t, pts, **kw):
    d = {"t": t, "p": pts}
    d.update({k: v for k, v in kw.items() if v is not None})
    return d


def _hprim(t, fr, pts, elev, **kw):
    """A horizontal polygon, stamped compactly: one height `h` and flat x/z pairs `q`."""
    cms = [fr.cm(e, n, elev) for e, n in pts]
    d = {"t": t, "h": cms[0][1], "q": [v for c in cms for v in (c[0], c[2])]}
    d.update({k: v for k, v in kw.items() if v is not None})
    return d


def grid_hprims(fr, poly, elev, focus, rings=((25, 100), (100, 400), (400, 1600), (1600, 3200)),
                tex=None, **kw):
    """A horizontal polygon cut into square cells round `focus` (place metres), finer near it.
    `tex` (pat, u, rot, reach) dresses the cells within `reach` metres in a tile; past it the flat
    colour, which should be the tile's mean (a tile kilometres deep aliases into moire)."""
    out, inner = [], 0
    fx, fy = focus
    for size, reach in rings:
        k = int(round(reach / size))
        for i in range(-k, k):
            for j in range(-k, k):
                x0, y0 = fx + i * size, fy + j * size
                cx, cy = x0 + size / 2 - fx, y0 + size / 2 - fy
                if max(abs(cx), abs(cy)) < inner:
                    continue
                cell = clip_rect(poly, x0, y0, x0 + size, y0 + size)
                if len(cell) >= 3:
                    if tex and max(abs(cx), abs(cy)) < tex["reach"]:
                        out.append(_hprim("x", fr, cell, elev, pat=tex["pat"], u=tex["u"], rot=tex["rot"], **kw))
                    else:
                        out.append(_hprim("f", fr, cell, elev, **kw))
        inner = reach
    return out


def world_quads_between(fr, top, bot, u_top, u_bot, colour, air, step=1, out=None, t="f", **kw):
    """Faces between two corresponding polylines at two heights (a cliff, a talus, a tree line).
    Each faces outward, square to its own top edge -- toward `bot` across the floor, or, where the
    two lie on one line, to the polyline's left ("L") or right ("R") -- and is not drawn from
    behind. (The side test is exact only with the face's own normal: an offset that runs oblique to
    the edge put a cliff's back in front of the eye 60 m along it.)"""
    res = []
    for i in range(0, len(top) - 1, step):
        j = min(i + step, len(top) - 1)
        ex, ey = top[j][0] - top[i][0], top[j][1] - top[i][1]
        nx, ny = -ey, ex                                   # the edge's left
        if out == "R" or (out is None and nx * (bot[i][0] + bot[j][0] - top[i][0] - top[j][0])
                          + ny * (bot[i][1] + bot[j][1] - top[i][1] - top[j][1]) < 0):
            nx, ny = -nx, -ny
        res.append(_prim(t, [fr.cm(*top[i], u_top), fr.cm(*top[j], u_top),
                             fr.cm(*bot[j], u_bot), fr.cm(*bot[i], u_bot)],
                         c=colour, a=air, fn=_fn(fr, nx, ny), **kw))
    return res


def _outward(foot, a, b):
    """The normal of edge a-b pointing away from the footprint's centroid."""
    cx = sum(e for e, _ in foot) / len(foot)
    cy = sum(n for _, n in foot) / len(foot)
    de, dn = b[1] - a[1], -(b[0] - a[0])
    mx, my = (a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy
    return (de, dn) if de * mx + dn * my >= 0 else (-de, -dn)


def world_extrude(fr, foot, u0, u1, side, top, air, bands=None, **kw):
    """A footprint stood up from u0 to u1: its faces (each facing out) and its roof. `bands` slices
    the faces: [(u_a, u_b, colour), ...] -- a stone base under glass under a fascia."""
    out = []
    slices = bands or [(u0, u1, side)]
    for i in range(len(foot)):
        a, b = foot[i], foot[(i + 1) % len(foot)]
        fn = _fn(fr, *_outward(foot, a, b))
        for (ua, ub, col) in slices:
            out.append(_prim("f", [fr.cm(*a, ua), fr.cm(*b, ua), fr.cm(*b, ub), fr.cm(*a, ub)],
                             c=col, a=air, fn=fn, **kw))
    out.append(_hprim("f", fr, foot, u1, c=top, a=air, **kw))
    return out


# ---- Niagara: Table Rock, the gorge and both falls (OpenStreetMap, read 2026-10-15) ---------------
# Origin: the Niagara Recreation Trail at Table Rock Centre's north-east corner (OSM node 26235703;
# the trail is way 1319958255, lit, paving stones). Heights are metres above the trail.
NIA_O = (43.0791448, -79.0782451)
NIA_RIVER = -58.5        # the lower river: the Horseshoe's sourced 57 m drop below a crest 1.5 m under the rail
NIA_CREST = -1.5         # water at the Horseshoe's brink, just under the terrace rail
NIA_AM_CREST = -1.0      # the American Falls' brink
NIA_TALUS = -29.0        # top of the American Falls' boulders: a free fall inside the sourced 21-30 m
# The wooded bluff's crowns, darkest to lightest. A single tone made the tree line vanish: a crown
# painted in the colour of the slope it stands on has no edge, and a straight horizon is what a
# visitor reads as "a green board" (round 69k, measured at 211-252 m, not 19 km).
CANOPY_CROWNS = ("#4a6a3a", "#557a44", "#3f5c31")
NIA_GOAT_TREES = 14.0    # Goat Island's woods over the gorge (approximate canopy, not surveyed)


def nia(lat, lon):
    return ll_m(lat, lon, *NIA_O)


# The Horseshoe Falls (OSM way 56539663): its brink, from Table Rock round to Terrapin Point.
NIA_HS_CREST = [nia(la, lo) for la, lo in (
    (43.0786657, -79.0784358), (43.0785841, -79.0781523), (43.0783098, -79.0779055),
    (43.0778749, -79.0776641), (43.0775888, -79.0773208), (43.0773341, -79.076736),
    (43.0771450, -79.0764078), (43.0771186, -79.0760548), (43.0768443, -79.0755022),
    (43.0768247, -79.0750033), (43.0769031, -79.07466), (43.0770833, -79.0742738),
    (43.0772596, -79.0741679), (43.0775927, -79.0739626), (43.0775966, -79.073673),
    (43.0776162, -79.0732921), (43.0778043, -79.0731312), (43.0778709, -79.0734155),
    (43.0779493, -79.0738178), (43.0783686, -79.0741289), (43.0787486, -79.0743113),
    (43.0791052, -79.074365), (43.0792580, -79.0744562), (43.0795244, -79.0745527),
    (43.0797595, -79.0744937), (43.0799284, -79.0744982), (43.0799669, -79.0746597))]
# The American Falls (OSM way 217355188): the brink, from Luna Island north to Prospect Point.
NIA_AM_CREST_L = dp_simplify([nia(la, lo) for la, lo in (
    (43.0837240, -79.0704815), (43.0838811, -79.0705211), (43.0839594, -79.070277),
    (43.0840750, -79.0702421), (43.0841671, -79.0699551), (43.0842689, -79.069762),
    (43.0843963, -79.0696011), (43.0845040, -79.0695421), (43.0846411, -79.069475),
    (43.0847920, -79.0693865), (43.0849585, -79.0693516), (43.0850741, -79.0693704),
    (43.0852053, -79.0693355), (43.0853385, -79.0693865), (43.0854169, -79.069188),
    (43.0854992, -79.0690378), (43.0855599, -79.0688688), (43.0856226, -79.0688195))], 2.0)
# Bridal Veil Falls (OSM way 515298933): from Goat Island's corner to Luna Island.
NIA_BV_CREST = [nia(la, lo) for la, lo in ((43.0835070, -79.0709736), (43.0834320, -79.0708507),
                                           (43.0835194, -79.0706932))]
# Goat Island (OSM way 3743454) and Luna Island (OSM way 37356202).
NIA_GOAT = dp_simplify([nia(la, lo) for la, lo in (
    (43.0802484, -79.0751326), (43.0801428, -79.0747088), (43.0799669, -79.0746597),
    (43.0798238, -79.0738837), (43.0785824, -79.0717294), (43.0786262, -79.0708196),
    (43.0784820, -79.0705879), (43.0784570, -79.0699184), (43.0789335, -79.066961),
    (43.0788957, -79.0664331), (43.0784756, -79.0654037), (43.0784632, -79.0615671),
    (43.0786450, -79.0607688), (43.0792093, -79.0603311), (43.0795227, -79.0603225),
    (43.0798863, -79.0606744), (43.0810210, -79.0633438), (43.0816479, -79.0639102),
    (43.0819802, -79.0645196), (43.0818423, -79.0661504), (43.0824441, -79.0672491),
    (43.0824880, -79.0675924), (43.0822184, -79.0692232), (43.0822999, -79.0695579),
    (43.0825318, -79.0700128), (43.0835070, -79.0709736), (43.0838688, -79.0710021),
    (43.0839066, -79.0712829), (43.0838629, -79.0715685), (43.0835588, -79.0716929),
    (43.0832641, -79.0721127), (43.0827732, -79.0722015), (43.0814258, -79.0734961),
    (43.0808396, -79.0749791))], 1.5)
NIA_GOAT_GORGE = [nia(la, lo) for la, lo in (       # the island's face on the lower river
    (43.0802484, -79.0751326), (43.0808396, -79.0749791), (43.0814258, -79.0734961),
    (43.0827732, -79.0722015), (43.0832641, -79.0721127), (43.0835588, -79.0716929),
    (43.0838629, -79.0715685), (43.0839066, -79.0712829), (43.0838688, -79.0710021))]
NIA_LUNA = dp_simplify([nia(la, lo) for la, lo in (
    (43.0835194, -79.0706932), (43.0833272, -79.0704941), (43.0832443, -79.0703909),
    (43.0831359, -79.070154), (43.0830346, -79.0700129), (43.0828823, -79.0699197),
    (43.0829120, -79.0697394), (43.0830581, -79.0696044), (43.0832144, -79.069653),
    (43.0833305, -79.0697787), (43.0833785, -79.0699867), (43.0834513, -79.0701287),
    (43.0836143, -79.0702215), (43.0837367, -79.0704683), (43.0835366, -79.0706753))], 1.0)
# The lower river's Canadian edge, north from the Horseshoe's foot (OSM way 1149263109).
NIA_CA_WATER = [nia(la, lo) for la, lo in (
    (43.0789579, -79.0779869), (43.0791396, -79.0777287), (43.0792626, -79.0775794),
    (43.0805733, -79.0776599), (43.0811244, -79.0773907), (43.0817569, -79.077085),
    (43.0822054, -79.0766206), (43.0837514, -79.0763519), (43.0842591, -79.0758867),
    (43.0849917, -79.0752942), (43.0852344, -79.0748356), (43.0857741, -79.0739679),
    (43.0865178, -79.0742049), (43.0870484, -79.0739055), (43.0870636, -79.0727019))]
# The upper river's Canadian bank, south from the brink (same way, upstream).
NIA_CA_UPPER = [nia(la, lo) for la, lo in (
    (43.0785322, -79.0786434), (43.0772604, -79.0788802), (43.0764679, -79.0783282),
    (43.0756860, -79.0782527), (43.0739517, -79.0766558), (43.0730072, -79.0749109),
    (43.0713689, -79.0722391), (43.0706873, -79.0712619), (43.0702129, -79.069562),
    (43.0698013, -79.0676319))]
# (The Recreation Trail's nine surveyed nodes stood here until round 76. Nothing read them: NIA_RIM_N
# below is authored as offsets in metres, not derived from a line, so the nodes were provenance for a
# decoration. They are recoverable from the commit that carried this file, `git show c46a116:_gen_html.py`.)
# Table Rock Centre (OSM way 420548287), its footprint kept to two metres.
NIA_TABLEROCK = dp_simplify([nia(la, lo) for la, lo in (
    (43.0794969, -79.0798608), (43.0794258, -79.0797307), (43.0794073, -79.079375),
    (43.0793951, -79.0793059), (43.0792962, -79.0793385), (43.0792720, -79.0792012),
    (43.0791392, -79.0792451), (43.0791501, -79.0793068), (43.0787698, -79.0794324),
    (43.0787569, -79.079359), (43.0789555, -79.0792934), (43.0789137, -79.0790562),
    (43.0788339, -79.078974), (43.0787966, -79.0787621), (43.0788087, -79.0786949),
    (43.0788634, -79.0786181), (43.0789136, -79.0785554), (43.0789699, -79.0785361),
    (43.0790573, -79.078492), (43.0791027, -79.0783746), (43.0790975, -79.0783403),
    (43.0791381, -79.0783288), (43.0791777, -79.0783484), (43.0792575, -79.0784037),
    (43.0793161, -79.0785463), (43.0793215, -79.0785797), (43.0795537, -79.0785764),
    (43.0795684, -79.0786673), (43.0796339, -79.0788406), (43.0796713, -79.0790682),
    (43.0796348, -79.0791423), (43.0795119, -79.0791829), (43.0795234, -79.079248),
    (43.0795078, -79.0796773), (43.0795455, -79.0798447))], 2.0)
NIA_SKYLON = nia(43.0851385, -79.0796926)              # Skylon Tower (OSM way 241004747), 160 m
NIA_RAINBOW = (nia(43.0915407, -79.0698017), nia(43.0901556, -79.0677042))   # OSM way 162149070
NIA_PROSPECT = nia(43.0859538, -79.0700909)            # the American Falls' north corner
NIA_US_RIM_N = nia(43.0886329, -79.0661756)            # the US rim at the bridge (OSM relation 14629795)


# Goat Island's shore on the upper river, from Terrapin Point east (the same OSM way, unsimplified).
NIA_GOAT_SOUTH = [nia(la, lo) for la, lo in (
    (43.0799669, -79.0746597), (43.0798238, -79.0738837), (43.0785824, -79.0717294),
    (43.0786262, -79.0708196), (43.0784820, -79.0705879), (43.0784570, -79.0699184),
    (43.0789335, -79.066961), (43.0788957, -79.0664331), (43.0784756, -79.0654037),
    (43.0784632, -79.0615671), (43.0786450, -79.0607688), (43.0792093, -79.0603311))]
# ...and its shore on the American Rapids, from the island's east end back west to Luna's channel.
NIA_GOAT_NORTH = [nia(la, lo) for la, lo in (
    (43.0795227, -79.0603225), (43.0798863, -79.0606744), (43.0810210, -79.0633438),
    (43.0816479, -79.0639102), (43.0819802, -79.0645196), (43.0818423, -79.0661504),
    (43.0824441, -79.0672491), (43.0822184, -79.0692232), (43.0825318, -79.0700128),
    (43.0835070, -79.0709736))]
# The rim of the Canadian gorge north of the terrace: the trail's own line where it runs along the
# wall, then the mapped water's edge set about 40 m inland (the rim itself is not in OSM here).
NIA_RIM_N = [(7.0, 14.0), (3.0, 48), (1.5, 81), (0.5, 113), (25, 160), (47, 221), (70, 290), (106, 340),
             (128, 512), (165, 568), (212, 648), (250, 675), (320, 736), (330, 900), (520, 1180),
             (640, 1352)]
# The terrace's brink, where its rail runs: the trail's corner nearest the falls (OSM node 291955852)
# round the Horseshoe's Canadian end to the upper bank.
NIA_BRINK = [(8.0, -29.0), (2.0, -38.0), (-8.0, -47.0), (-15.5, -53.2), (-32.4, -68.0)]

# The Skylon's street (Wikipedia, read 2026-10-16): 160 m from street level and 236 m from the bottom
# of the falls, so its street is 76 m over the lower river -- 17.5 m above the trail. Roof 149 m, the
# spire 11 m over it. The hill under it is not drawn, so its shaft is carried down to the ground.
NIA_SKYLON_STREET = 236.0 - 160.0 + NIA_RIVER

# The Fallsview bluff (round 35). The Falls Incline Railway climbs it beside Table Rock Centre: 59.8 m
# of track at 30 degrees (Wikipedia, from Ontario.ca), so the bluff rises 29.9 m over a 51.8 m run, at
# the railway's own coordinates (43.079499, -79.080789). Its line north and south of the railway is
# drawn to keep the listed hotels on top and the Skylon below -- approximate, not surveyed.
NIA_BLUFF_RISE = 59.8 * math.sin(math.radians(30))
NIA_BLUFF_RUN = 59.8 * math.cos(math.radians(30))
NIA_INCLINE = nia(43.079499, -79.080789)
NIA_BLUFF_FOOT = [(-215.0, -1000.0), (-205.0, -700.0), (-198.0, -250.0), (NIA_INCLINE[0] + NIA_BLUFF_RUN / 2, NIA_INCLINE[1]),
                  (-120.0, 330.0), (-200.0, 600.0), (-290.0, 1000.0)]
# Wikipedia's "List of tallest buildings in Niagara Falls, Ontario" (read 2026-10-16), every entry
# that is a building and stands on the bluff, with its listed height and floors. Footprints follow the
# Toronto rule (a hotel 30 m square, round 34) except the Tower Hotel, a converted 1962 observation
# tower, drawn as its shaft (16 m, approximate). Left out, and named in the caveat: the Sky Screamer
# (a ride at Marineland, 2 km south), the Casino Tower and the Rainbow Tower (towers by the river
# 1.4-1.6 km north, forms not sourced), the Sheraton on the Falls (its form not sourced either).
NIA_HOTELS = [
    ("Hilton Niagara Falls/Fallsview North Tower", 43.08316, -79.083237, 177.1, 53, 30),
    ("Embassy Suites by Hilton Niagara Falls Fallsview", 43.079464, -79.082092, 118.0, 36, 30),
    ("Niagara Fallsview Casino Resort", 43.082172, -79.080612, 111.0, 32, 30),
    ("Marriott Fallsview Hotel and Spa", 43.07738498, -79.0827426, 107.9, 31, 30),
    ("Hilton Niagara Falls/Fallsview South Tower", 43.082485, -79.083183, 103.0, 30, 30),
    ("Tower Hotel", 43.079047, -79.0821064, 99.0, 30, 16),
    ("Oakes Hotel", 43.080128, -79.081863, 63.4, 21, 30),
    ("DoubleTree Resort by Hilton Fallsview", 43.087219, -79.084038, 63.4, 18, 30),
    ("Niagara Falls Marriott on the Falls", 43.078522, -79.081993, 60.0, 20, 30),
    ("Four Points by Sheraton Fallsview", 43.081654, -79.083244, 51.0, 17, 30),
]


def table_rock_centre(fr, a):
    """Table Rock Centre: the OSM footprint (two storeys, building:levels 2), its walls in buff stone with
    tall windows (`trcwall`, one tile the wall's height), under steep dark roofs, and the Grand Hall's
    cupola -- the building in the photographs. Eaves 9.5 m and the roof's rise are approximate."""
    out = []
    foot, eave, rise, inset = NIA_TABLEROCK, 9.5, 4.0, 2.4
    for i in range(len(foot)):
        p0, p1 = foot[i], foot[(i + 1) % len(foot)]
        out.append(_prim("x", [fr.cm(*p0, 0), fr.cm(*p1, 0), fr.cm(*p1, eave), fr.cm(*p0, eave)],
                         pat="trcwall", u=950, ax="v", c="#7d7566", cn="#1d2026", a=a, dg=0.55,
                         fn=_fn(fr, *_outward_ccw(foot, p0, p1))))
    inner = inset_polygon(foot, inset)
    for i in range(len(foot)):
        j = (i + 1) % len(foot)
        out.append(_prim("f", [fr.cm(*foot[i], eave), fr.cm(*foot[j], eave),
                               fr.cm(*inner[j], eave + rise), fr.cm(*inner[i], eave + rise)],
                         c="#4f5058", cn="#15181d", a=a, dg=0.5, fn=_fn(fr, *_outward_ccw(foot, foot[i], foot[j]))))
    out.append(_hprim("f", fr, inner, eave + rise, c="#4a4b52", cn="#15181d", a=a, dg=0.5))
    # The cupola over the Grand Hall, at the building's east end by the falls (placed from the
    # photographs, approximate): a lantern on the ridge and its pyramid cap.
    ce, cn_ = NIA_TRC_CUPOLA
    lan = [(ce - 1.6, cn_ - 1.6), (ce + 1.6, cn_ - 1.6), (ce + 1.6, cn_ + 1.6), (ce - 1.6, cn_ + 1.6)]
    out += world_extrude(fr, lan, eave + rise, eave + rise + 3.0, "#d7d3c6", "#4f5058", a, cn="#262a31", dg=0.5)
    top = eave + rise + 3.0
    for i in range(4):
        p0, p1 = lan[i], lan[(i + 1) % 4]
        out.append(_prim("f", [fr.cm(*p0, top), fr.cm(*p1, top), fr.cm(ce, cn_, top + 2.4)],
                         c="#4f5058", cn="#15181d", a=a, dg=0.5, fn=_fn(fr, *_outward(lan, p0, p1))))
    return out


def fallsview(fr, air):
    """The bluff behind Table Rock (a wooded slope, `NIA_BLUFF_*`) and the hotels standing on it."""
    out = []
    rise, run = NIA_BLUFF_RISE, NIA_BLUFF_RUN
    foot = resample(NIA_BLUFF_FOOT, 28)
    nrm = left_normals(foot)                       # walking north, the left is west: up the bluff
    top = [(e + nx * run, n + ny * run) for (e, n), (nx, ny) in zip(foot, nrm)]
    # The slope is wooded, as it is behind the Centre in every photograph from the gorge; its south
    # end, where this drawing stops, goes down into the ground rather than ending in a cut face.
    hk = [min(1.0, i / 3) for i in range(len(foot))]
    for i in range(len(foot) - 1):
        j = i + 1
        ex, ey = top[j][0] - top[i][0], top[j][1] - top[i][1]
        a = air(*foot[i])
        out.append(_prim("x", [fr.cm(*top[i], rise * hk[i]), fr.cm(*top[j], rise * hk[j]),
                               fr.cm(*foot[j], 0), fr.cm(*foot[i], 0)],
                         pat="canopy", u=2000, ax="v", c="#3b5631", cn="#121a1c", a=a, dg=0.45,
                         fn=_fn(fr, ey, -ex)))
        # The trees along its top, their crowns 9-15 m over the edge (a seeded run, not a survey).
        # Round 69k: they were painted in the SLOPE's own colour, so a crown standing on the slope
        # had no edge against it and the tree line was a straight rule across the sky. Three tones
        # from a seeded cycle, and the tone is chosen per segment, so neighbouring crowns differ.
        # One crown per 56 m segment was a fence rail, not a wood: its top varied 9-15 m over the
        # whole segment, which at 211 m is a 3-pixel zigzag and reads as a ruled edge. A tree line is
        # TEETH -- 7-9 m trees of different heights -- so the segment is cut into trees and each one
        # stands at its own height, tip between 8 and 18 m over the edge.
        seg = math.hypot(top[j][0] - top[i][0], top[j][1] - top[i][1])
        nt = max(2, round(seg / 7.0))
        for k in range(nt):
            k0, k1 = k / nt, (k + 1) / nt
            e0 = (top[i][0] + (top[j][0] - top[i][0]) * k0, top[i][1] + (top[j][1] - top[i][1]) * k0)
            e1 = (top[i][0] + (top[j][0] - top[i][0]) * k1, top[i][1] + (top[j][1] - top[i][1]) * k1)
            h0 = rise * (hk[i] + (hk[j] - hk[i]) * k0)
            h1 = rise * (hk[i] + (hk[j] - hk[i]) * k1)
            tip0 = h0 + (8 + ((i * 7 + k * 13) % 11)) * (hk[i] + (hk[j] - hk[i]) * k0)
            tip1 = h1 + (8 + ((i * 7 + (k + 1) * 13) % 11)) * (hk[i] + (hk[j] - hk[i]) * k1)
            out.append(_prim("x", [fr.cm(*e0, tip0), fr.cm(*e1, tip1), fr.cm(*e1, h1), fr.cm(*e0, h0)],
                             pat="canopy", u=2000, ax="v", c=CANOPY_CROWNS[(i + k) % 3], cn="#121a1c",
                             a=a, dg=0.45, fn=_fn(fr, ey, -ex)))
        # A second, taller run behind the trees, darker: the depth of a wood is the number of tree
        # lines in it, and one band of crowns -- however toothed -- still reads as a fence.
        t2 = 6 + ((i * 53 + 11) % 11)
        out.append(_prim("x", [fr.cm(*top[i], rise * hk[i] + (t2 + 4) * hk[i]),
                               fr.cm(*top[j], rise * hk[j] + (t2 + 6) * hk[j]),
                               fr.cm(*top[j], rise * hk[j]), fr.cm(*top[i], rise * hk[i])],
                         pat="canopy", u=2000, ax="v", c=CANOPY_CROWNS[(i + 1) % 3], cn="#121a1c", a=a, dg=0.45,
                         fn=_fn(fr, ey, -ex)))
    plateau = top + [(-2400, top[-1][1]), (-2400, top[0][1])]
    # Round 65: the bluff's top was a flat green polygon -- the one colour in the frame with no
    # texture in it at all, and the band a visitor saw over the shopfronts. It is wooded ground
    # seen from a hundred metres, so it wears the same tile as the slope below it.
    out.append(_hprim("f", fr, plateau, rise, pat="canopy", u=2000, c="#5f7b47", cn="#1b2430",
                      a=0.2, s=8.45, dg=0.55))
    for name, la, lo, h, floors, w in NIA_HOTELS:
        e, n = nia(la, lo)
        hw = w / 2
        box = [(e - hw, n - hw), (e + hw, n - hw), (e + hw, n + hw), (e - hw, n + hw)]
        a = air(e, n)
        for i in range(4):
            p0, p1 = box[i], box[(i + 1) % 4]
            out.append(_prim("x", [fr.cm(*p0, rise), fr.cm(*p1, rise), fr.cm(*p1, rise + h), fr.cm(*p0, rise + h)],
                             pat="hotelw", pn="hotelw", u=round(800 * h / floors), ax="v", c="#b6b3ab",
                             a=a, dg=0.55, fn=_fn(fr, *_outward(box, p0, p1))))
        out.append(_hprim("f", fr, box, rise + h, c="#7d7f80", cn="#141c2c", a=a, dg=0.5))
    return out


def _outward_ccw(poly, a, b):
    """The outward normal of edge a-b from the polygon's own winding: exact on a concave outline,
    where the centroid test (`_outward`) can turn an edge in a recess the wrong way round."""
    area = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1]
               for i in range(len(poly)))
    dx, dy = b[0] - a[0], b[1] - a[1]
    return (dy, -dx) if area > 0 else (-dy, dx)


def inset_polygon(poly, d):
    """A simple polygon's outline moved `d` metres inward along each edge's normal (mitred corners,
    the mitre capped at 2.5 d) -- the line a hipped roof's slopes rise to from the eaves."""
    area = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1]
               for i in range(len(poly)))
    sgn = 1.0 if area > 0 else -1.0                 # counter-clockwise: the inside is to the left
    out = []
    for i in range(len(poly)):
        a, b, c = poly[i - 1], poly[i], poly[(i + 1) % len(poly)]
        def nrm(p, q):
            dx, dy = q[0] - p[0], q[1] - p[1]
            L = math.hypot(dx, dy) or 1e-9
            return (-dy / L * sgn, dx / L * sgn)
        n1, n2 = nrm(a, b), nrm(b, c)
        bx, by = n1[0] + n2[0], n1[1] + n2[1]
        L = math.hypot(bx, by) or 1e-9
        cosh = max(0.4, (n1[0] * bx + n1[1] * by) / L)
        k = min(2.5, 1.0 / cosh) * d
        out.append((b[0] + bx / L * k, b[1] + by / L * k))
    return out


NIA_TRC_CUPOLA = (-21.0, 2.0)


def niagara_world(fr, view="rim"):
    """The falls, the gorge and their banks from one lane frame (`view` "rim" or "deck")."""
    P = []
    def air(e, n, k=1.0):
        d = fr.dist(e, n)
        return round(min(0.5, 0.03 + d / 3200 * 0.5) * k, 3)
    up = lambda pts, u: [fr.cm(e, n, u) for e, n in pts]
    # Round 35: what stands below the bank -- the sheets, the gorge walls, the arch -- paints before
    # the ground on the rim (sort layer `low`). The painter sorts these by depth alone, and a sheet
    # 80 m off is "farther" than a terrace cell under the eye only on average: from the Centre's
    # doors the Horseshoe's near end was painted over the terrace it hangs 1.5 m below, a teal wedge
    # on the pavers. An eye above the bank meets anything above it before anything under it, so on
    # the rim the order is exact: water, then what stands in the gorge, then the ground. On the deck
    # the eye is under the bank, the ground is not drawn, and depth keeps the order (no layer).
    low = 8.8 if view == "rim" else None

    # Canadian ground: west of the rim, the terrace and the upper bank, out to 2.4 km.
    canada = list(reversed(NIA_CA_UPPER)) + NIA_BRINK[::-1][1:] + [(7.0, -10.0)] + NIA_RIM_N + \
        [(640, 2400), (-2400, 2400), (-2400, -2400), (863, -2400)]
    focus = (fr.e0 + 22 * fr.s, fr.n0 + 22 * fr.c)
    P += grid_hprims(fr, canada, 0, focus, c="#5f7b47", cn="#1b2430", a=0.08, s=8.5, dg=0.55)
    # The terrace round Table Rock Centre: paved, the colour of the trail's pavers.
    tpave = NIA_BRINK[:4] + [(-26.0, -52.0), (-40.0, -42.0), (-36.0, -2.0), (-30.0, 60.0)] + \
        list(reversed(NIA_RIM_N[:4])) + [(7.0, -10.0)]
    P += grid_hprims(fr, tpave, 0.02, focus, c="#7d7a74", cn="#252a33", a=0.04, s=8.4, dg=1.0)
    # The terrace rail along the brink (round 35, after the photographs of it at the Horseshoe): a
    # low wall of rough grey stone, a rough block for a post every 3 m, and between the posts the
    # black ironwork of rings from the wall's top to 90 cm -- a parapet at the hip, not the bars at
    # hand height it had been. Cut cell by cell between the posts, so a post is never a long wall
    # quad's neighbour in the painter's sort (it would be painted over by the wall behind it).
    blen = sum(math.hypot(q[0] - p[0], q[1] - p[1]) for p, q in zip(NIA_BRINK, NIA_BRINK[1:]))
    br = resample(NIA_BRINK, max(1, round(blen / 3.0)))
    for i in range(len(br)):
        a = br[i]
        b = br[min(i + 1, len(br) - 1)] if i + 1 < len(br) else None
        prev = br[i - 1] if i else br[1]
        ux, uy = (b[0] - a[0], b[1] - a[1]) if b else (a[0] - prev[0], a[1] - prev[1])
        L = math.hypot(ux, uy) or 1.0
        ux, uy = ux / L, uy / L
        nx, ny = -uy, ux                                   # across the wall, toward the terrace
        if nx * (-36.0 - a[0]) + ny * (-20.0 - a[1]) < 0:
            nx, ny = -nx, -ny
        # the post: a rough block 50 cm square, 96 cm high, astride the wall
        foot = [(a[0] + sx * ux * 0.25 + sy * nx * 0.25, a[1] + sx * uy * 0.25 + sy * ny * 0.25)
                for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        for k in range(4):
            fa, fb = foot[k], foot[(k + 1) % 4]
            P.append(_prim("x", [fr.cm(*fa, 0.0), fr.cm(*fb, 0.0), fr.cm(*fb, 0.96), fr.cm(*fa, 0.96)],
                           pat="stonewall", u=110, ax="v", c="#67635b", cn="#1d1f24", a=0.04, dg=0.8,
                           fn=_fn(fr, *_outward(foot, fa, fb))))
        P.append(_hprim("f", fr, foot, 0.96, c="#7a766d", cn="#23262b", a=0.04, dg=0.8))
        if not b:
            break
        # the wall and its ironwork between this post and the next
        p0 = (a[0] + ux * 0.25, a[1] + uy * 0.25)
        p1 = (b[0] - ux * 0.25, b[1] - uy * 0.25)
        t0, t1 = (p0[0] + nx * 0.2, p0[1] + ny * 0.2), (p1[0] + nx * 0.2, p1[1] + ny * 0.2)
        g0, g1 = (p0[0] - nx * 0.2, p0[1] - ny * 0.2), (p1[0] - nx * 0.2, p1[1] - ny * 0.2)
        P.append(_prim("x", [fr.cm(*t0, 0.0), fr.cm(*t1, 0.0), fr.cm(*t1, 0.6), fr.cm(*t0, 0.6)],
                       pat="stonewall", u=110, ax="v", c="#67635b", cn="#1d1f24", a=0.04, dg=0.8,
                       fn=_fn(fr, nx, ny)))
        P.append(_prim("f", [fr.cm(*t0, 0.6), fr.cm(*t1, 0.6), fr.cm(*g1, 0.6), fr.cm(*g0, 0.6)],
                       c="#77736a", cn="#22252a", a=0.04, dg=0.8))
        # the iron, in the wall's middle: the ring tile, a cell 30 cm square, a band one tile high
        # (60 to 90 cm, where the tile's own rails fall on the band's edges); clear between the iron,
        # so it takes no air and no sun of its own (`a` 0, `n`, `d0`).
        P.append(_prim("x", [fr.cm(*p0, 0.6), fr.cm(*p1, 0.6), fr.cm(*p1, 0.9), fr.cm(*p0, 0.9)],
                       pat="ironscroll", u=30, ax="v", c="rgba(18,19,22,0.4)", a=0, n=1, d0=1))

    # The upper river above the brink: from the crest, along Goat Island, out to the rapids' head.
    upper = NIA_HS_CREST + NIA_GOAT_SOUTH[1:] + [(1700, 0), (1700, -2400), (863, -2400)] + \
        list(reversed(NIA_CA_UPPER))
    # Round 35: the near cells wear the rapids (`rapids`, turned to the current, which runs
    # north-north-east into the Canadian end of the bowl); past 400 m the flat colour, the tile's mean.
    P += grid_hprims(fr, upper, NIA_CREST, focus, c="#1d3f42", cn="#101f26", a=0.04, s=9.0, dg=0.5,
                     tex=dict(pat="rapids", u=1200, rot=round((20 - fr.heading) % 360, 1), reach=400))
    for (e0, n0, e1, n1) in ((40, -330, 330, -360), (80, -420, 420, -470), (140, -560, 560, -610),
                             (330, -300, 520, -200), (380, -120, 600, -60)):
        P.append(_hprim("f", fr, [(e0, n0), (e1, n1), (e1, n1 - 9), (e0, n0 - 9)], NIA_CREST + 0.05,
                       c="rgba(236,244,244,0.38)", a=air(e0, n0), s=8.95, d0=1))
    # The American Rapids between Goat Island and the US shore, then the US mainland and its rim.
    am_cr = NIA_AM_CREST_L
    rapids = [am_cr[0], am_cr[-1], (1480, 900), (1700, 400), (1700, 0)] + NIA_GOAT_NORTH + [NIA_LUNA[0]]
    P.append(_hprim("f", fr, rapids, NIA_AM_CREST, c="#5a9698", cn="#1a3038", a=0.18, s=8.9, dg=0.5))
    us = [am_cr[-1], NIA_PROSPECT, NIA_US_RIM_N, (1400, 1600), (3200, 1600), (3200, 900), (1480, 900)]
    P.append(_hprim("f", fr, us, 0, c="#5a7348", cn="#1b2430", a=0.25, s=8.6, dg=0.5))
    us_rim = resample([NIA_PROSPECT, NIA_US_RIM_N], 6)
    P += world_quads_between(fr, us_rim, us_rim, 11, 0, "#33492e", air(800, 900), out="L", cn="#121a1c", dg=0.45)
    us_foot = [(e - 9, n + 4) for e, n in us_rim]
    P += world_quads_between(fr, us_rim, us_foot, 0, NIA_RIVER, "#6c675c", air(800, 900), cn="#1d2026", dg=0.45,
                             s=low)

    # The lower river: from the Horseshoe's foot north under the Rainbow Bridge.
    hs = resample(dp_simplify(NIA_HS_CREST, 1.0), 36)
    nrm = left_normals(hs)
    foot = [(e + nx * 24 * min(1.0, i / 4), n + ny * 24 * min(1.0, i / 4))
            for i, ((e, n), (nx, ny)) in enumerate(zip(hs, nrm))]
    goat_w = [(e - 8, n) for e, n in NIA_GOAT_GORGE]
    amn0 = left_normals(am_cr)
    am_toe = [(e + nx * 36, n + ny * 36) for (e, n), (nx, ny) in zip(am_cr, amn0)]
    lower = NIA_CA_WATER + [(560, 1250), (760, 1500), (1000, 1300), (NIA_US_RIM_N[0] - 12, NIA_US_RIM_N[1])] + \
        list(reversed(us_foot)) + list(reversed(am_toe)) + list(reversed(goat_w)) + list(reversed(foot))
    # Round 60: the river's colour is authored *for the light it lands in*. A teal of #3d706c under
    # this sky's hemisphere, environment and sun came out (146,163,172) on the composited frame — a
    # pale grey plane filling the whole lower half of the view from the rail, which is the flat wash
    # the owner kept naming. Down the gorge the water is nearly black-green; the authored value is
    # set so the *lit* value is that, not so the swatch is.
    P += grid_hprims(fr, lower, NIA_RIVER, focus, c="#1b4341", cn="#0e1a1e", a=0.03, s=9.6, dg=0.92)
    # The foam where the sheet lands: white and nearly solid at the foot, thinning to streaks 75 m
    # out (round 35: one even 55% band read as a grey shelf, not as water churned white).
    # The churned water itself (`foam`, opaque) to 44 m out, then three translucent bands, each
    # thinner than the last, so the white has no edge of its own.
    # Round 60: the churn used to be four bands of *constant* alpha (44/70/100/130 m) and every
    # boundary between them was a step across the pool — at the rail's grazing angle the plunge read
    # as four stacked plates, not as water losing its white. Seven rings now, each fainter than the
    # last and each a third as deep, so the falloff is a falloff: the foam's own texture carries the
    # edge, which is the one place a hard line belongs.
    RING_D = (26, 38, 52, 70, 92, 118, 148)
    rings = [foot] + [[(e + nx * d, n + ny * d) for (e, n), (nx, ny) in zip(hs, nrm)] for d in RING_D]
    # Round 69e: measured from the rail, hiding these eight rings turned the foreground from a
    # white plate into dark green water (`_who`/`_pool` frames). The churn is real, but the rings
    # reached 148 m out at 40/30/22 % -- at a grazing angle 300 m away that is a solid sheet with
    # the river's own colour nowhere in it. The outer rings keep their shape and lose their weight;
    # the white now belongs to the 26 m at the sheet's foot, where the water actually lands.
    for b, al in enumerate((None, 0.30, 0.17, 0.11, 0.07, 0.04, 0.025)):
        for i in range(0, 36, 3):
            j = min(i + 3, 36)
            quad = [rings[b][i], rings[b][j], rings[b + 1][j], rings[b + 1][i]]
            if al is None:
                P.append(_hprim("x", fr, quad, NIA_RIVER + 0.35, pat="foam", u=1800, rot=0, c="#cfdfda",
                               cn="#5f6c74", a=air(*hs[i], 0.8), s=9.5, dg=0.4))
            else:
                P.append(_hprim("f", fr, quad, NIA_RIVER + 0.35 - 0.02 * b, c="rgba(226,238,236,%s)" % al,
                               a=air(*hs[i], 0.8), s=9.5, d0=1))
    am_foam = [(e + nx * 62, n + ny * 62) for (e, n), (nx, ny) in zip(am_cr, amn0)]
    for i in range(len(am_cr) - 1):
        P.append(_hprim("f", fr, [am_toe[i], am_toe[i + 1], am_foam[i + 1], am_foam[i]], NIA_RIVER + 0.3,
                       c="rgba(232,242,240,0.6)", a=air(*am_cr[i], 0.85), s=9.5, d0=1))

    # The Canadian gorge wall (round 35, after the photographs from the river): a sheer face in
    # level beds of pale rock for two-thirds of the drop -- a metre and a half of batter, no more --
    # then the talus, grown over green, down to the water. (It had been a 70-degree slope from the
    # rim, which read from the trail as a dark ramp rather than a cliff.)
    rim_w = resample([NIA_BRINK[0]] + NIA_RIM_N[:13], 30)
    water_w = resample(NIA_CA_WATER[:12], 30)
    cliff_foot = [(e + (we - e) * 0.04, n + (wn - n) * 0.04) for (e, n), (we, wn) in zip(rim_w, water_w)]
    P += world_quads_between(fr, rim_w, cliff_foot, 0, -38, "#847d6e", air(60, 200), t="x", pat="strata",
                             u=1600, ax="v", cn="#1c1f25", dg=0.45, s=low)
    P += world_quads_between(fr, cliff_foot, water_w, -38, NIA_RIVER, "#56663f", air(60, 200), cn="#141a1c", dg=0.45,
                             s=low)
    # North of the lane the rim keeps its parapet: a dark band at hand height.
    par = resample(NIA_RIM_N[1:7], 10)
    P += world_quads_between(fr, par, par, 1.1, 0, "#2b2b2e", 0.06, out="R", cn="#121418")

    # Goat Island: woods on top, a canopy edge, and rock where it faces the gorge.
    P.append(_hprim("f", fr, NIA_GOAT, NIA_GOAT_TREES, c="#3a5532", cn="#121a1c", a=0.2, s=0.002, dg=0.45))
    ring = NIA_GOAT + [NIA_GOAT[0]]
    for i in range(len(ring) - 1):
        a, b = ring[i], ring[i + 1]
        # Round 69 — the far bank read as a black bar across the falls.
        #
        # Measured by raycasting the served frame (`_ray.mjs`, pixel 800,330): the first world hit
        # behind the plume is this Goat Island canopy wall at 326 m, authored #2c4428 with a #0f1618
        # night colour. A dark green at 325 m through 325 m of air does not stay black in daylight:
        # what the eye sees across the bowl is a hazed mid-green because the air itself scatters
        # between the bank and the rail. The authored value is the *surface* value, and the ambient
        # is the only handle this renderer has for distance haze on a `x`-type wall, so both move —
        # the geometry does not. (The same reading the source gives: from Table Rock the far shore
        # is green woodland above the gorge, never a silhouette.)
        P.append(_prim("x", [fr.cm(*a, 0), fr.cm(*b, 0), fr.cm(*b, NIA_GOAT_TREES), fr.cm(*a, NIA_GOAT_TREES)],
                       pat="canopy", u=2000, ax="v", c="#57764a", cn="#24322a", a=air(*a) * 1.9 + 240, dg=0.45,
                       fn=_fn(fr, *_outward(NIA_GOAT, a, b))))
    # Round 69g — 遠岸是一張灰卡. The island's gorge wall was the one big rock face in the frame
    # drawn *without* a tile: a flat `#6e6a5f` quad 300 m out, meeting the west corner (which wears
    # `strata`) at a hard vertical edge and reading 84 luma against its 69. Two greys side by side
    # is what the eye calls a slab, and it is half of what the owner has been pointing at. The same
    # face now wears the same tile as every other rock in the gorge, at the same 16 m scale.
    gg = resample(NIA_GOAT_GORGE, 12)
    gfoot = [(e - 8, n) for e, n in gg]
    P += world_quads_between(fr, gg, gfoot, 0, NIA_RIVER, "#6e6a5f", air(400, 300), t="x",
                             pat="strata", u=2600, ax="v", cn="#1d2026", dg=0.45, s=low)
    # Round 69f — 島的西角沒有臉.
    #
    # The gorge wall above runs along `NIA_GOAT_GORGE`, which begins at the island's *north*-west
    # corner and follows its face north down the lower river. The island's west corner -- the two
    # segments between (253.5, 122.6) and (292.0, 91.3), the rock that faces the Horseshoe and that
    # the crest's own last node meets -- got a canopy top and a canopy wall and no rock underneath.
    #
    # Measured, not guessed: `.verify/_gap.mjs` casts a 10 px grid through the served frame at the
    # Table Rock rail (yaw -109) and reports every ray that goes *down* and meets nothing. The hole
    # is x 550-1020, y 360-510 -- and projecting the island's own mapped corners through the page's
    # camera puts (253.5, 122.6) at x 680 and (292.0, 91.3) at x 564, both at y 366, with the river
    # 149 px below. The pale rectangle in the frame is that face and nothing else; `_ray.mjs` hit
    # nothing at five pixels inside it, which is why no colour or mist change ever moved it.
    #
    # The face is the island's own outline (NIA_GOAT[:3]), offset into the water the way the gorge
    # wall above offsets, so the rock reads as one face with the two it joins.
    # The face wears the gorge's own rock tile. A flat `#6e6a5f` quad that close to the eye (290 m)
    # is a grey card: the Canadian wall two hundred metres further on already wears `strata` at
    # 16 m a tile, and this face is the same dolomite seen at the same distance, so it takes the
    # same tile at the same scale. It also gives the top edge something to break against -- the
    # canopy's own dark line reads as the lip of the island rather than as a drawn border.
    wc = resample(NIA_GOAT[:3], 10)
    wcfoot = [(e - 8, n) for e, n in wc]
    P += world_quads_between(fr, wc, wcfoot, 0, NIA_RIVER, "#6e6a5f", air(400, 300), t="x",
                             pat="strata", u=2600, ax="v", cn="#1d2026", dg=0.45, s=low)
    P.append(_hprim("f", fr, NIA_LUNA, 9, c="#3c5734", cn="#121a1c", a=air(650, 560), dg=0.45))
    lr = NIA_LUNA + [NIA_LUNA[0]]
    for i in range(len(lr) - 1):
        P.append(_prim("f", [fr.cm(*lr[i], NIA_TALUS), fr.cm(*lr[i + 1], NIA_TALUS),
                             fr.cm(*lr[i + 1], 9), fr.cm(*lr[i], 9)], c="#5f5b51", cn="#1b1e24",
                       a=air(650, 560), dg=0.45, fn=_fn(fr, *_outward(NIA_LUNA, lr[i], lr[i + 1]))))

    # A curtain that leaves its brink and falls in a parabola: `throw` metres out at its foot.
    def curtain(crest, u_top, u_bot, throw, colours, k_streaks, taper=0, grain=2400):
        """Four bands down the drop (the glassy brink, its turn white, the upper and the lower sheet),
        each wearing the falling water's grain (`fallsw`, `grain` cm a tile): faint on the brink,
        full below."""
        nr = left_normals(crest)
        tk = [min(1.0, i / taper) if taper else 1.0 for i in range(len(crest))]
        # Round 69f: the bands' heights and colours together decide how much of the drop is water
        # and how much is white. As authored, the two near-white bands covered from 15 % of the drop
        # to the foot -- 85 % of a 57 m curtain, and from the rail the measured falls box came out
        # mean 188 with a standard deviation of 31, one flat plate with a thin teal stripe at the
        # lip. Photographs from Table Rock are the other way round: the sheet keeps its green down
        # to the aerated last third. The green reaches 62 % now, and each band is a step darker, so
        # the sheet has a body, a turn and a foot instead of a lip and a plate.
        cut = [0.0, 0.06, 0.24, 0.62, 1.0]
        for s in range(4):
            fa, fb = cut[s], cut[s + 1]
            ua, ub = u_top + (u_bot - u_top) * fa, u_top + (u_bot - u_top) * fb
            oa, ob = throw * math.sqrt(fa), throw * math.sqrt(fb)
            for i in range(len(crest) - 1):
                j = i + 1
                pa = (crest[i][0] + nr[i][0] * oa * tk[i], crest[i][1] + nr[i][1] * oa * tk[i])
                pb = (crest[j][0] + nr[j][0] * oa * tk[j], crest[j][1] + nr[j][1] * oa * tk[j])
                qa = (crest[i][0] + nr[i][0] * ob * tk[i], crest[i][1] + nr[i][1] * ob * tk[i])
                qb = (crest[j][0] + nr[j][0] * ob * tk[j], crest[j][1] + nr[j][1] * ob * tk[j])
                P.append(_prim("w", [fr.cm(*pa, ua), fr.cm(*pb, ua), fr.cm(*qb, ub), fr.cm(*qa, ub)],
                               c=colours[s], a=air(*crest[i], 0.75), il=1, dg=0.35, s=low,
                               k=(k_streaks if s > 1 else 0), pat="fallsw", u=grain, pa=(0.55, 0.8, 0.95, 1.0)[s]))
    curtain(hs, NIA_CREST, NIA_RIVER, 24, ("#37907f", "#63b7a9", "#a9d2cd", "#e2efee"), 2, taper=4)
    amr = resample(am_cr, 12)
    curtain(amr, NIA_AM_CREST, NIA_TALUS, 4, ("#7fb9ae", "#b6d8d1", "#dfecea", "#e9f2f1"), 2, grain=1400)
    amn = left_normals(amr)
    t_top = [(e + nx * 4, n + ny * 4) for (e, n), (nx, ny) in zip(amr, amn)]
    t_toe = [(e + nx * 36, n + ny * 36) for (e, n), (nx, ny) in zip(amr, amn)]
    for i in range(len(amr) - 1):
        P.append(_prim("w", [fr.cm(*t_top[i], NIA_TALUS), fr.cm(*t_top[i + 1], NIA_TALUS),
                             fr.cm(*t_toe[i + 1], NIA_RIVER), fr.cm(*t_toe[i], NIA_RIVER)],
                       c="#8d8b84", cn="#22252b", a=air(*amr[i], 0.85), k=2, sp=0.22, dg=0.4, s=low))
    bvr = resample(NIA_BV_CREST, 3)
    curtain(bvr, NIA_AM_CREST, NIA_TALUS, 3, ("#7fb9ae", "#b6d8d1", "#dfecea", "#e9f2f1"), 1, grain=1400)

    # The spray. Round 60, and the last of the 一片平光: measured from the rail, the mist alone
    # painted the *whole* frame a flat pale blue (161 billboards, the largest 52 m across, each
    # 0.165 alpha, all overlapping), and every drop of the sheet that no mist covered was already
    # near-white — so the Horseshoe had neither a face nor a veil, only a wash. What a plunge pool
    # actually shows from the rim above it is *columns*: a line of small opaque-hearted puffs
    # springing off the crest, climbing 30 m into the sky, each one a metre or two of cloud and not
    # a plate. What is drawn is smaller than what it stands for; the whole is the sum of the puffs.
    mist_k = 1.0
    def puff(e, n, u, w, h, al, np, j=0.0):
        """One round of spray. `j` scatters it: the first cut of the round-60 mist put every puff on
        the same lattice of crest points and heights, and at 1024 px the plume read as a *grid* of
        soft bubbles -- the eye finds a regular array instantly, and a regular array is the one thing
        cloud is not. The scatter is derived from the position, so it is the same every frame and
        every visit, and the size and the alpha move with it."""
        h1 = math.sin(e * 12.9898 + n * 78.233 + u * 37.719) * 43758.5453
        h1 -= math.floor(h1)
        h2 = math.sin(n * 39.346 + e * 11.135 + u * 83.155) * 24634.6345
        h2 -= math.floor(h2)
        j = min(1.0, max(0.0, j))
        de = (h1 - 0.5) * 2 * j * (w / 100.0) * 0.55
        dn = (h2 - 0.5) * 2 * j * (w / 100.0) * 0.55
        du = (h1 - 0.5) * 2 * j * (h / 100.0) * 0.55
        sw = 1 + (h1 - 0.5) * j * 0.7
        P.append({"t": "m", "o": fr.cm(e + de, n + dn, u + du), "w": int(w * sw), "h": int(h * (2 - sw)),
                  "al": round(al * mist_k * (1 + (h2 - 0.5) * j * 0.5), 3), "a": 0.02, "il": 1, "np": np})
    # 第四個錯，也是最大的那個：霧沿著整條崖線鋪，包括鋪到訪客頭上.
    #
    # 紅染影格（`MIST=red`）把每一朵 billboard 都塗成紅色，於是看得見幾何本身：崖線的每一點都有霧，
    # 連站在桌岩護欄邊的那一端也有——那裡離視點 **20 m**，一朵 35 m 寬的板子在 20 m 處佔掉 82° 的視角，
    # 也就是整個左上角那一塊紅。那不是霧，那是一面貼在臉上的牆。
    #
    # 來源說的是另一件事：馬蹄是**漏斗**，水往弧的中間收，永久霧柱站在中央，兩翼相對乾淨。所以霧的
    # 權重必須是**沿崖線的位置**的函數，而且必須套在**每一列**上（只套一列，其餘各列照樣鋪滿）。
    # 弧的頂點不寫死，從懸崖折線自己算：離兩端連線最遠的那一點。量出來是第 16 點，離桌岩護欄 345 m、
    # 而崖線全長 881 m（來源的 670–820 m 是主瀑寬，量到的是整條 OSM way，兩者不衝突）。
    _ax, _ay = hs[0]
    _bx, _by = hs[-1]
    _cl = math.hypot(_bx - _ax, _by - _ay) or 1.0
    FUNNEL_AT = max(range(len(hs)), key=lambda q: abs((_by - _ay) * (hs[q][0] - _ax) - (_bx - _ax) * (hs[q][1] - _ay)))
    def funnel(i):
        """How much of the plume belongs at crest point i: 1 at the arc's apex, ~0 at the rim.

        σ 3.5 points ≈ 86 m along a brine 881 m long, so the column is about 170 m across at its base
        and the last 200 m at either end of the brink carry almost none. The visitor stands at
        hs[0] — the Table Rock corner — which is 13.7 σ from the apex, so their own end contributes
        nothing, which is also what the photographs show: the plume you see from that rail is the one
        over the middle of the horseshoe, three hundred metres out.
        """
        d = (i - FUNNEL_AT) / 3.5
        return math.exp(-d * d)

    # Round 60, the geometry of it — and the reason two rounds of mist tuning painted nothing: the
    # curtain's top edge stands *on* the crest line and leans downstream to its foot, so every puff
    # placed in the bowl is behind an opaque sheet from the rail, and the plume that everyone can see
    # from the rim is the part that leans back over the brink toward the visitor. The mist is
    # therefore authored on the *upstream* side of the crest (negative distance), where the sightline
    # is: the boil at the lip, the column over the apex, and the low drift that crosses the rail.
    # Where it hangs over the water it is seen against the dark river and reads white, which is what
    # the photographs show and what no amount of density on the far side could ever draw.
    # Round 69e — the plume is built as ONE column, and the rows that spread it are gone.
    #
    # What the frames said: with every other system hidden, these billboards alone covered the whole
    # lower half of the view (`onlyspray`), and at the rail the veil had no centre at all. Five rows
    # had each been written for a different round -- the boil at the lip, the bowl behind it, the
    # rings over the churned water, the climb off the river, the overhang -- and each was reasonable
    # alone; together they stacked 40 m plates along 670 m of brink, thirty deep at the eye, and the
    # sum of thirty translucent plates is not a plume, it is fog. So the boil rows are removed and
    # the plume is authored once, where `funnel()` finds the funnel's throat.
    # Round 69: the plume that stands *in the bowl*, between the sheet's foot and the near bank.
    #
    # Measured on the round-69 frame at the Table Rock rail: mist placed at negative distance from
    # the crest (round 60's fix) draws against the plunge pool 20 px lower in the picture and changes
    # the sheet itself by 1 luma. The plume a rim visitor sees rising *in front of the fall* stands
    # downstream of the brink, over the bowl — that is where `curtain` throws the water (24 m at the
    # foot, its own parabola), so the same positive normal is the side the camera looks across.
    # Authored as a column: dense and wide at the pool, thinning and drifting as it climbs past the
    # lip, so the sheet's foot is veiled and the water above it keeps its own edge.
    # Signed the way the sightline is. The curtain's top edge stands on the crest and leans
    # *downstream*; every puff on the downstream side is behind an opaque sheet from this rail.
    # Red-dye proved it: with the column on +n, one blob of fifty-three was visible. So the whole
    # plume is authored on the upstream side of the brink, where the rail's own line of sight is.
    #
    # The column: eighteen rounds from the plunge pool to 58 m over it. Narrow at the water, where
    # the sheet's momentum is still a jet (9 m), widening as it slows (25 m at the top), leaning
    # downwind as it climbs -- the shape a plume has in every photograph taken from the Parkway.
    # The alpha *falls* as it rises: dense at the foot, thin at the crown, so the top dissolves into
    # the sky instead of stamping a white rectangle on it.
    CE, CN = hs[FUNNEL_AT]
    CNX, CNY = nrm[FUNNEL_AT]
    # Round 69f: the column stopped at the brink and nobody could see it. The first stack rose
    # 56 m from the pool -- the falls' own height, so its crown sat exactly on the crest line,
    # inside the pale band of horizon sky where a #c9d8e0 puff is 4 luma away from the air behind
    # it. Photographs of the Horseshoe from the Parkway show the opposite: the plume stands *above*
    # the brink, thirty to sixty metres clear of it, and it is read against the darker sky at the
    # top of the frame. So the stack climbs to 120 m over the river -- 62 m over the crest -- and
    # only its lowest rounds are read against the sheet.
    # Round 69f — a line of columns, not one. The single column stood at `FUNNEL_AT`, the point of
    # the brink farthest from its own chord, and from the rail that point is 40 degrees off the
    # frame: measured, the plume had 3 of 53 billboards inside the picture at the heading that
    # frames the curtain. A rail visitor does not see the horseshoe's geometric apex; they see the
    # near limb of it, sweeping away from them, and the spray stands along that limb wherever the
    # sheet lands. So the mist is authored as five columns down the brink -- the middle ones
    # tallest, which is the funnel's own shape -- each a stack of ten rounds, each narrower and
    # fainter as it climbs, none of them wider than 22 m at the water.
    for ci, (anchor, tall) in enumerate(((24, 92), (27, 104), (30, 96), (33, 78))):
        e0, n0 = hs[anchor]
        nx0, ny0 = nrm[anchor]
        for k in range(9):
            up = k / 8.0
            # The scatter is the difference between a plume and a ladder: at even heights and a
            # metre of jitter the eye finds the row instantly (the red-dye frame draws them as
            # four stacks of squares). Twelve metres of horizontal scatter, six of height, and
            # the puff's own size grows with the scatter, so no two rounds share an outline.
            jx = ((k * 7 + ci * 3) % 9 - 4) * 3.4
            jy = ((k * 5 + ci * 4) % 7 - 3) * 2.2
            # The width is authored in the renderer's own units. `makeClouds` draws a billboard at
            # 0.15-0.26 of the prim's `w`, so an honest-looking 900 cm is a 1.5 m dot: measured, the
            # mint column came out fourteen pixels wide at 350 m and the natural-colour frame showed
            # nothing where the red-dye frame showed squares. 4200-7600 cm draws puffs 12-20 m
            # across, which is what a spray column at that distance actually looks like.
            puff(e0 + nx0 * (3.0 + 15.0 * up) + jx * 2.2, n0 + ny0 * (3.0 + 15.0 * up) + jy * 2.2,
                 NIA_RIVER + 3.0 + k * (tall / 8.0) + jy * 0.9, 4200 + 3400 * up, 2600 + 1800 * up,
                 0.30 - 0.19 * up, 3, 0.8)
    for anchor in (24, 27, 30, 33):
        e0, n0 = hs[anchor]
        nx0, ny0 = nrm[anchor]
        for k in range(-2, 3):
            t = k / 2.0
            puff(e0 + nx0 * 5 + ny0 * t * 26, n0 + ny0 * 5 - nx0 * t * 26,
                 NIA_RIVER + 1.2, 5200 + 2600 * (1 - abs(t)), 2600,
                 0.05 + 0.10 * (1 - abs(t)), 3, 0.6)
    # The wind: what the column loses is carried downstream and up, four rounds that get thinner as
    # they go -- the haze a visitor sees drifting over the gorge from a kilometre down the Parkway.
    for k, (dn, u, al) in enumerate(((28, 22, 0.10), (46, 30, 0.075), (68, 38, 0.055), (92, 46, 0.04))):
        puff(CE - CNX * dn, CN - CNY * dn, NIA_RIVER + u, 9000 + 2600 * k, 4200 + 900 * k,
             al * 0.55, 4, 0.8)
    # A second row, offset half a step, so the line of puffs has no beat in it.
    # The column over the apex, standing clear of the crest against the sky: the one thing at the
    # Horseshoe that is taller than the fall itself.
    # A plume is not a puff: the column over the bowl is a hundred metres across and sixty high at
    # the apex, and it is soft — which is why it is authored as a few large, thin rounds *behind*
    # the fine boil at the lip rather than as more of the same. The sharp edge is the crest; the
    # cloud above it has none.
    for e, n, w, h, al in ((150, -150, 11000, 9000, 0.13), (205, -175, 9000, 8000, 0.11),
                           (250, -205, 7000, 6000, 0.09)):
        for k in range(3):
            puff(e + 10 * k, n - 9 * k, NIA_CREST + 16 + 20 * k, w, h, al, 7, 0.55)
    # What the deck below the brink sees: the bowl's own cloud, low over the churned water, behind
    # the sheet for the rail and in front of it once the visitor is inside the gorge.

    # Round 69, the fidelity fix: 從桌岩看瀑布，霧是這地方最認得的那一件事。
    #
    # Round 60 moved the crest puffs to the upstream side of the brink, which was the right reading
    # of the geometry — but it put every one of them *above* the crest, against a sky that is already
    # #d4e3ec. Measured on the served frame this round, at the Table Rock rail: 840 billboards cover
    # 20.7% of the picture and change its mean brightness by 1.1 luma. That is a mist that exists in
    # the data, is in front of the camera, and cannot be seen — which is exactly what the owner
    # reported as 沒有霧.
    #
    # The part of a plunge-pool column a rim visitor actually sees is the part standing between them
    # and the *dark*: the lower sheet (measured luma 55) and the churned pool (34). So the column is
    # authored from the river up, upstream of the crest line, where it is in front of the sheet at
    # every height — the sheet leans downstream to 24 m at its foot, so anything at negative distance
    # is nearer the eye than the water it hides. Sources: niagaraparks.com (57 m drop, 670 m crest,
    # 35 m plunge pool) and the same "permanent column of mist above it is visible from far down the
    # Niagara Parkway" the round-60 note quotes. The plume is not decoration here; it is the
    # identifying feature of the place, and it is the one thing the earlier build did not draw.
    # The column does not stop at the crest: it boils up past the lip and leans back over the rail,
    # and that overhang is the part of the plume that reads against the sky from the promenade. One
    # row, thin, so the white above the brink has a *shape* rather than a wash.
    # A low bank far down the gorge, so the gorge's own floor is not a clean line at the horizon.
    puff(610, 650, NIA_RIVER + 2, 7000, 2600, 0.10, 4)
    # The American Falls: a foot cloud under Luna Island's sheet, small, and one at its own plunge.
    for i in range(0, len(amr) - 1, 3):
        e, n = amr[i]
        nx, ny = amn[i]
        puff(e + nx * 20, n + ny * 20, NIA_RIVER + 2, 2200, 1400, 0.16, 4)
    rc = fr.cm(130, -120, NIA_RIVER - 22)
    vx, vz = -rc[0], -rc[2]
    L = math.hypot(vx, vz) or 1
    P.append({"t": "rb", "o": rc, "r": 6200, "ux": round(-vz / L, 4), "uz": round(vx / L, 4), "west": 1})
    P.append({"t": "fw", "o": fr.cm(160, -120, 30), "r": 6000})

    P += table_rock_centre(fr, air(-60, 0))
    # The Fallsview bluff and its hotels (round 35), then the Skylon.
    P += fallsview(fr, air)
    se, sn = NIA_SKYLON
    base = NIA_SKYLON_STREET
    shaft = [(se - 5, sn - 5), (se + 5, sn - 5), (se + 5, sn + 5), (se - 5, sn + 5)]
    # After dark the tower is washed in colour (Wikipedia: 12 RGB wash fixtures and projectors).
    P += world_extrude(fr, shaft, 0, base + 128, "#a4a49e", "#8e8e88", air(se, sn), cn="#262b33", dg=0.5, il=1)
    pod = [(se + 15 * math.cos(a), sn + 15 * math.sin(a)) for a in [k * math.pi / 4 for k in range(8)]]
    P += world_extrude(fr, pod, base + 128, base + 149, "#c9c7bf", "#5f8f80", air(se, sn), cn="#30353e", dg=0.5, il=1)
    spire = [(se - 0.6, sn - 0.6), (se + 0.6, sn - 0.6), (se + 0.6, sn + 0.6), (se - 0.6, sn + 0.6)]
    P += world_extrude(fr, spire, base + 149, base + 160, "#9a9a94", "#9a9a94", air(se, sn), cn="#262b33", dg=0.5)
    # The Rainbow Bridge downstream: a steel arch springing near the water, its deck at the rims.
    (ae, an), (be, bn) = NIA_RAINBOW
    me, mn = (ae + be) / 2, (an + bn) / 2
    L = math.hypot(be - ae, bn - an)
    ux, uy = (be - ae) / L, (bn - an) / L
    P.append(_prim("f", [fr.cm(ae, an, 2.5), fr.cm(be, bn, 2.5), fr.cm(be, bn, -1.5), fr.cm(ae, an, -1.5)],
                   c="#56635b", cn="#181e24", a=air(me, mn), dg=0.45))
    for off in (-8, 8):
        ox, oy = -uy * off, ux * off
        prev = None
        for k in range(11):
            sx = -145 + 29 * k
            y = NIA_RIVER + 8 + (-6 - (NIA_RIVER + 8)) * (1 - (sx / 145) ** 2)
            pt = (me + ux * sx + ox, mn + uy * sx + oy)
            if prev:
                P.append(_prim("f", [fr.cm(*prev[0], prev[1]), fr.cm(*pt, y), fr.cm(*pt, y - 4),
                                     fr.cm(*prev[0], prev[1] - 4)], c="#5d6b62", cn="#181e24",
                               a=air(me, mn), dg=0.45, s=low))
            prev = (pt, y)
    return P


# ---- Goat Island: the island's own surroundings, at the walk's own measure ------------------------
# Round 69m. This page shipped from round 52 with no world at all, and round 58 left a comment
# saying it "borrows" the Canadian page's: no line ever emitted one. `verify-island` measures what
# that costs -- at stop 2 (Terrapin Point) the eye meets nothing in 100 % of the eye-level band, and
# the island's walk stands on fog. Two things hid it for seventeen rounds: the lane's default
# plaster wall, which sealed the walk from 47.5 m on (a wall where a landscape should be reads as a
# wall, not as a missing world), and a projection bug that made the falls unpressable, so nothing
# ever reported the scene as empty either.
#
# What the page needs is not the Canadian page's world. `niagara_world` is authored from the Table
# Rock rail: its terrace, its parapet, its promenade. From the island's point those are things
# 300 m off, *across* the fall. What belongs here is the walk's own surroundings.
#
# The crest is the survey's own, not a shape drawn by eye. `NIA_HS_CREST`'s last 148 m -- points 19
# to 26, the part that closes on Terrapin Point -- are laid into the lane's plane at 1:1 (east to
# +x, north to +z) with the survey's own last node on the lane's point. That is why the crest
# leaves the walk's start 55 m out on the right and comes in to 12 m at the point: it is the same
# brink the Canadian page draws, seen from its American end, at the record's size.
#
# Heights come from the same record as the Canadian page's, in the strip's vertical. The strip
# draws the American Falls' 29 m talus as 19.66 m (its own `falls-american` `h`), so one metre of
# the Niagara record is GOAT_GS centimetres here, and every height below is a record height times
# it: water at the brink 1.5 m under the rail (`NIA_CREST`), the lower river 58.5 m under it
# (`NIA_RIVER`), the island's woods 14 m (`NIA_GOAT_TREES`), both banks at the walk's own level.
GOAT_POINT = (12.0, 161.0)          # NIA_HS_CREST's last node -- Terrapin Point -- in the lane's metres
GOAT_GS = 1966.0 / -NIA_TALUS       # cm of the strip per metre of the record's heights (67.8)
BANK = 90.0                          # the Canadian side of the gorge, in the lane's metres
# The far side of the gorge, at the strip's own compression. The page already keeps distances at
# about a tenth of the record's (the American Falls' 290 m of crest stands 30 m from the walk, and
# the comment above says so); the Canadian bank is 300-670 m from Terrapin in the survey, so it
# stands 90 m here. At 320 m the horseshoe's far curtain was a 3.8 degree strip at the frame's edge
# -- measured in `.preview/goat69mf`, 90x120 px -- which is not what the point looks at.


def goat_crest():
    """The Horseshoe's brink in the lane's plane: the survey's last 148 m, then round the point.

    The two nodes added past the survey's end are `NIA_GOAT`'s first three, which is the island's
    own west corner: at Terrapin the brink *is* the shore, so the water closes round the island the
    way the map closes, not the way a prop edge would.
    """
    tail = NIA_HS_CREST[19:]
    e0, n0 = tail[-1]
    # Round 69m, the one distortion in this file, and why it is one.
    #
    # At 1:1 the brink runs 12 m from the walk at the point and 55 m at the start of it, and from
    # eighteen metres back a 40 m drop is a 1.5 degree band: measured at stop 2 before this, the
    # whole lower two thirds of the frame was the upper river and the sheet was not in it at all.
    # A brink is looked over, not back at. The strip already compresses every distance it draws --
    # the American's 290 m of crest stands 30 m from the walk -- so the brink's own offsets are
    # compressed by the same kind of factor and the page says so, here. The *shape* is the survey's;
    # only its depth away from the walk is the strip's.
    K = 0.30
    out = [(GOAT_POINT[0] + K * (e - e0), GOAT_POINT[1] + n - n0) for e, n in tail]
    for e, n in reversed(NIA_GOAT[:2]):        # (292.0, 91.3) is the survey's own last node
        out.append((GOAT_POINT[0] + e - e0, GOAT_POINT[1] + n - n0))
    out.append((out[-1][0] - 14.0, out[-1][1] + 9.0))       # off the frame, not stopping in mid-air
    return out


def goat_world():
    """The island's walk drawn round: its two waters, the Horseshoe's brink, both far banks."""
    P = []
    fr = LaneFrame(0.0, 0.0, 0.0, 0.0)          # the lane's own metres: +x right, +z ahead
    def U(m):
        return m * GOAT_GS / 100.0
    BRINK, LOW, TREES = U(NIA_CREST), U(NIA_RIVER), U(NIA_GOAT_TREES)
    def air(e, n, k=1.0):
        d = math.hypot(e, n)
        return round(min(0.5, 0.03 + d / 3200 * 0.5) * k, 3)
    cr = goat_crest()

    def normals(pts, side):
        """Unit normals across a crest: `side` +1 is its right, -1 its left (the falling side)."""
        out = []
        for i in range(len(pts)):
            a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy) or 1.0
            out.append((side * dy / L, -side * dx / L))
        return out

    def curtain(crest, nrm, u_top, u_bot, throw, bands, tile):
        """Four bands down a drop, the sheet thrown `throw` metres out at its foot."""
        cut = [0.0, 0.06, 0.24, 0.62, 1.0]
        for s in range(4):
            fa, fb = cut[s], cut[s + 1]
            ua, ub = u_top + (u_bot - u_top) * fa, u_top + (u_bot - u_top) * fb
            oa, ob = throw * math.sqrt(fa), throw * math.sqrt(fb)
            for i in range(len(crest) - 1):
                j = i + 1
                pa = (crest[i][0] + nrm[i][0] * oa, crest[i][1] + nrm[i][1] * oa)
                pb = (crest[j][0] + nrm[j][0] * oa, crest[j][1] + nrm[j][1] * oa)
                qa = (crest[i][0] + nrm[i][0] * ob, crest[i][1] + nrm[i][1] * ob)
                qb = (crest[j][0] + nrm[j][0] * ob, crest[j][1] + nrm[j][1] * ob)
                P.append(_prim("w", [fr.cm(*pa, ua), fr.cm(*pb, ua), fr.cm(*qb, ub), fr.cm(*qa, ub)],
                               c=bands[s], pat="fallsw", u=tile, pa=(0.55, 0.8, 0.95, 1.0)[s]))

    nrm = normals(cr, 1)          # downstream of a crest that runs with +z on its left is +x

    # The upper river: from the walk's own edge out to the brink. The island's shore is the lane's
    # right edge for the whole walk, so this is the water between the visitor and the fall.
    up = [(8.3, -42.0), (8.3, 159.0)] + list(reversed(cr[:8]))
    P.append(_hprim("f", fr, up, BRINK, pat="rapids", u=380, rot=round((20 - 0) % 360, 1),
                    c="#6aa9ab", cn="#17333a", dg=0.5, s=9.0))
    # The water arriving at the brink: 1.6 m of pale churn along the crest, so the eye reads a
    # current running to a lip and not a colour boundary. (The 10 cm lip above carries the line.)
    for i in range(len(cr) - 1):
        a = (cr[i][0] - nrm[i][0] * 2.3, cr[i][1] - nrm[i][1] * 2.3)
        b = (cr[i + 1][0] - nrm[i + 1][0] * 2.3, cr[i + 1][1] - nrm[i + 1][1] * 2.3)
        P.append(_hprim("f", fr, [(cr[i][0] - nrm[i][0] * 0.7, cr[i][1] - nrm[i][1] * 0.7),
                                  (cr[i + 1][0] - nrm[i + 1][0] * 0.7, cr[i + 1][1] - nrm[i + 1][1] * 0.7),
                                  (b[0], b[1]), (a[0], a[1])], BRINK + 0.03,
                        c="rgba(232,242,241,0.34)", pat="foam", u=1400, d0=1, s=9.5))
    # A current on the upper river, so the water arriving at the brink is running water and not a
    # colour field. Three thin foam lines inside the crest, faint to strong: at five metres from the
    # rail a single pattern tile reads as wallpaper (`_box` on the near water: sd 6.3, 27 colours).
    for d in (4.2, 2.6, 1.2):
        for i in range(len(cr) - 1):
            a = (cr[i][0] - nrm[i][0] * d, cr[i][1] - nrm[i][1] * d)
            b = (cr[i + 1][0] - nrm[i + 1][0] * d, cr[i + 1][1] - nrm[i + 1][1] * d)
            a2 = (a[0] - nrm[i][0] * 0.38, a[1] - nrm[i][1] * 0.38)
            b2 = (b[0] - nrm[i + 1][0] * 0.38, b[1] - nrm[i + 1][1] * 0.38)
            P.append(_hprim("f", fr, [a, b, b2, a2], BRINK + 0.02,
                            c="rgba(226,238,236,%.2f)" % (0.20 if d > 3 else (0.26 if d > 2 else 0.32)),
                            pat="foam", u=700, d0=1, s=9.5))
    # The brink's own lip: unbroken pale line where the water lets go. Without it the crest is a
    # colour boundary rather than an edge.
    for i in range(len(cr) - 1):
        a = (cr[i][0] - nrm[i][0] * 0.7, cr[i][1] - nrm[i][1] * 0.7)
        b = (cr[i + 1][0] - nrm[i + 1][0] * 0.7, cr[i + 1][1] - nrm[i + 1][1] * 0.7)
        P.append(_prim("f", [fr.cm(*cr[i], BRINK + 0.10), fr.cm(*cr[i + 1], BRINK + 0.10),
                             fr.cm(*b, BRINK + 0.10), fr.cm(*a, BRINK + 0.10)],
                       c="rgba(238,246,246,0.5)", dg=0.2, d0=1))

    # The curtain: four bands down the drop, the sheet thrown `throw` metres out at its foot. Same
    # cut as the Canadian page's, because it is the same water; a lighter first band, because this
    # one is looked at from six metres and #37907f is a black slab at that range.
    throw = U(24.0)
    bands = ("#4e9c8d", "#63b7a9", "#a9d2cd", "#e2efee")
    curtain(cr, nrm, BRINK, LOW, throw, bands, 150)
    # The American Falls, by the same code and out of the same record: its brink is the prop's own
    # line (x -30 m, z 21-121 m, 0.4 m above the walk), the sheet falls away from the walk, and it
    # lands on the talus the record already puts at -19.26 m. The prop drew this as four bands of
    # the `fallsw` tile on the lane's canvas painter, which at twenty-five metres reads as a picket
    # fence; this is the water shader the Horseshoe has worn since round 59.
    # The arc's far side -- the sheet the visitor actually looks at from Terrapin, and the reason
    # the page still had no falling water in it after three rounds of aiming.
    #
    # The survey's crest turns 180 degrees round the horseshoe. This strip has 150 m of lane and a
    # crest compressed onto its near side, so the far half of the turn folds onto the near half:
    # edge-on to the eye, under the water plane, and invisible -- measured, the sheet occupied 0-1 %
    # of the frame from the middle of the walk and 39 % only from the floor's end, where it is the
    # *near* crest seen obliquely. What stands in front of a visitor at the point is the other half
    # of the same brink, 300-670 m off across the pool, facing back at the island. So it is drawn
    # where the pool puts it -- along the Canadian bank's foot, crest at the brink's height, sheet
    # falling toward the walk -- from the same four bands, the same `curtain()` and the same
    # surveyed crest. Nothing new is invented: the sheet is the horseshoe's own far side, and the
    # only number the strip decides is how far away the compression puts it.
    far = resample([(BANK - 6.0, -520.0), (BANK - 6.0, 620.0)], 12)
    fnr = normals(far, -1)        # its sheet falls toward -x, i.e. toward the island
    curtain(far, fnr, BRINK, LOW, throw, bands, 150)
    for i in range(len(far) - 1):
        a = (far[i][0] - fnr[i][0] * 0.7, far[i][1] - fnr[i][1] * 0.7)
        b = (far[i + 1][0] - fnr[i + 1][0] * 0.7, far[i + 1][1] - fnr[i + 1][1] * 0.7)
        P.append(_prim("f", [fr.cm(*far[i], BRINK + 0.10), fr.cm(*far[i + 1], BRINK + 0.10),
                             fr.cm(*b, BRINK + 0.10), fr.cm(*a, BRINK + 0.10)],
                       c="rgba(238,246,246,0.5)", dg=0.2, d0=1))
    # Its churn, and the permanent mist the horseshoe keeps. The plume is here, 300 m out, and not
    # in front of the eye: a puff a visitor could reach is a screen, not spray (round 60, round 69m).
    ffoot = [(e + nx * throw, n + ny * throw) for (e, n), (nx, ny) in zip(far, fnr)]
    for k, (d0, d1, al) in enumerate(((0.0, 9.0, None), (9.0, 26.0, 0.26))):
        for i in range(len(far) - 1):
            j = i + 1
            q = [(far[i][0] + fnr[i][0] * d0, far[i][1] + fnr[i][1] * d0),
                 (far[j][0] + fnr[j][0] * d0, far[j][1] + fnr[j][1] * d0),
                 (far[j][0] + fnr[j][0] * d1, far[j][1] + fnr[j][1] * d1),
                 (far[i][0] + fnr[i][0] * d1, far[i][1] + fnr[i][1] * d1)]
            if al is None:
                P.append(_hprim("x", fr, q, LOW + 0.35, pat="foam", u=1800, c="#cfdfda", cn="#5f6c74",
                                dg=0.4, s=9.5))
            else:
                P.append(_hprim("f", fr, q, LOW + 0.33, c="rgba(226,238,236,%s)" % al, d0=1, s=9.5))
    # Two columns, not a wash. Sixty overlapping billboards of eighteen metres made an even haze
    # over the whole far bank -- the canopy's edge came out soft and the falls had no plume at all
    # (measured in `.preview/goat69mh`). The horseshoe keeps its mist where its crest turns: one
    # column at the point's own reach and one at the far end of the arc, each a dozen puffs.
    for ce, cn_ in ((-8.0, 40.0), (-4.0, 150.0)):
        for k in range(11):
            up = 3.0 + k * 4.2
            P.append({"t": "m", "o": fr.cm(BANK + ce, cn_ - 2.0 + (k % 3) * 2.0, BRINK + up),
                      "w": 4200 + 260 * (k % 4), "h": 3200, "al": round(0.30 - 0.016 * k, 3),
                      "np": 5})

    amr = [(-30.0, 21.0), (-30.0, 121.0)]
    amn = normals(amr, -1)        # its sheet falls to -x, away from the island
    curtain(amr, amn, U(0.4), -19.26, U(4.0), ("#7fb9ae", "#b6d8d1", "#dfecea", "#e9f2f1"), 300)

    # The water the sheet lands in, from the foot of the curtain out to the Canadian bank.
    foot = [(e + nx * throw, n + ny * throw) for (e, n), (nx, ny) in zip(cr, nrm)]
    P.append(_hprim("f", fr, [(BANK, -520.0)] + foot + [(BANK, 620.0)], LOW,
                    c="#1b4341", cn="#0e1a1e", dg=0.92))
    # The churn at the foot: two bands, the near one opaque, the far one a veil.
    for k, (d0, d1, al) in enumerate(((0.0, 9.0, None), (9.0, 26.0, 0.26))):
        for i in range(0, len(cr) - 1):
            j = i + 1
            q = [(cr[i][0] + nrm[i][0] * d0, cr[i][1] + nrm[i][1] * d0),
                 (cr[j][0] + nrm[j][0] * d0, cr[j][1] + nrm[j][1] * d0),
                 (cr[j][0] + nrm[j][0] * d1, cr[j][1] + nrm[j][1] * d1),
                 (cr[i][0] + nrm[i][0] * d1, cr[i][1] + nrm[i][1] * d1)]
            if al is None:
                P.append(_hprim("x", fr, q, LOW + 0.35, pat="foam", u=1800, c="#cfdfda", cn="#5f6c74",
                                dg=0.4, s=9.5))
            else:
                P.append(_hprim("f", fr, q, LOW + 0.33, c="rgba(226,238,236,%s)" % al, d0=1, s=9.5))

    # The Canadian bank across the lower river: at the walk's own level, so the eye reads the gorge
    # as a wall and not as a horizon. Its edge carries the woodline, and the woodline is where the
    # buildings that belong to the other drawing would rise -- they stay on that page.
    edge = [(BANK, 620.0), (BANK, -520.0)]
    P.append(_hprim("f", fr, [(BANK, 620.0), (BANK + 880.0, 680.0), (BANK + 880.0, -900.0), (BANK, -520.0)], 0.0,
                    c="#5f7b47", cn="#1b2430", dg=0.55))
    P += world_quads_between(fr, edge, edge, 0.0, LOW, "#6f6a5e", air(BANK, 0), t="x", pat="strata",
                             u=1600, ax="v", cn="#1c1f25", dg=0.45, out="R")
    P += world_quads_between(fr, edge, edge, 0.0, TREES, "#57764a", air(BANK, 0), t="x", pat="canopy",
                             u=2000, ax="v", cn="#24322a", dg=0.45, out="R")

    # The island's own face on the channel side: a rock cliff from the walk's left edge down to the
    # water the American Falls lands in, so the left of the lane is an edge and not a cut.
    P.append(_hprim("x", fr, [(-7.4, -42.0), (-8.6, -42.0), (-8.6, 202.0), (-7.4, 202.0)], -0.04,
                    c="#6e6a5f", cn="#1d2026", dg=0.45))
    P += world_quads_between(fr, [(-8.6, 202.0), (-8.6, -42.0)], [(-8.6, 202.0), (-8.6, -42.0)],
                             0.0, -19.0, "#6e6a5f", air(0, 80), t="x", pat="strata", u=2600, ax="v",
                             cn="#1d2026", dg=0.45, out="R")

    # Past the walk's floor the point is water on both sides, not land: the crest turns across here,
    # and a `strata` card filling the wedge stood in front of the brink as a dark slab (measured at
    # stop 3: the shelf met 21 rays between 8.1 and 491 m, the sheet behind it 27 between 17 and
    # 71). The lane's floor (`d`, 162.4 m) is the last paving; everything beyond curls.
    P.append(_hprim("f", fr, [(-8.6, 159.0), (7.5, 159.0), (12.0, 161.0), (8.0, 180.6),
                              (-26.5, 192.3), (-40.0, 200.0), (-40.0, 159.0)], BRINK,
                    c="#6aa9ab", cn="#17333a", dg=0.5, pat="rapids", u=260))

    # The American bank beyond its pool: the far side of the second water, at the walk's level with
    # its own wall down to the river and its own woodline.
    fb = [(-240.0, 230.0), (-240.0, -200.0)]
    P.append(_hprim("f", fr, [(-240.0, 230.0), (-2400.0, 260.0), (-2400.0, -260.0), (-240.0, -200.0)],
                    0.0, c="#5a7348", cn="#1b2430", dg=0.5))
    P += world_quads_between(fr, [(-240.0, -200.0), (-240.0, 230.0)], [(-240.0, -200.0), (-240.0, 230.0)],
                             0.0, -19.0, "#6c675c", air(240, 0), t="x", pat="strata", u=2200, ax="v",
                             cn="#1d2026", dg=0.45, out="L")
    P += world_quads_between(fr, [(-240.0, -200.0), (-240.0, 230.0)], [(-240.0, -200.0), (-240.0, 230.0)],
                             0.0, TREES, "#556f45", air(240, 0), t="x", pat="canopy", u=2000, ax="v",
                             cn="#24322a", dg=0.45, out="L")

    # The rail. Every photograph taken at Terrapin has one, and without it the frames were water,
    # paving and sky with nothing at a metre to read the water's size against: a 96 cm stone parapet
    # along the walk's own edge and across the floor's end, so the visitor stands behind it and the
    # brink starts beyond. Same kit as the Canadian terrace's (`stonewall`, a post every 3 m), at the
    # walk's own scale -- 41 m of rail, 14 posts.
    rl = [(8.1, -4.0), (8.1, 155.4), (6.0, 159.0), (-8.6, 159.0)]
    rlen = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(rl, rl[1:]))
    rr = resample(rl, max(2, round(rlen / 3.0)))
    rn = normals(rr, -1)                 # the walker's side, so the wall is seen from inside
    def parapet(run, side):
        """One run of the same kit: 92 cm of `stonewall`, its coping, a post every 3 m."""
        L = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(run, run[1:]))
        pts = resample(run, max(2, round(L / 3.0)))
        ns = normals(pts, side)         # the walker's side, so the wall is seen from inside
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]
            P.append(_prim("x", [fr.cm(*a, 0.0), fr.cm(*b, 0.0), fr.cm(*b, 0.92), fr.cm(*a, 0.92)],
                           pat="stonewall", u=110, ax="v", c="#7a766d", cn="#23262b", dg=0.8,
                           fn=_fn(fr, *ns[i])))
            P.append(_prim("f", [fr.cm(*a, 0.92), fr.cm(*b, 0.92), fr.cm(*b, 0.96), fr.cm(*a, 0.96)],
                           c="#8d8a80", cn="#2a2d33", dg=0.9))   # the coping, the brightest line
        for i, (e, n) in enumerate(pts):
            P.append({"t": "f", "p": [fr.cm(e - 0.14, n - 0.14, 0.96), fr.cm(e + 0.14, n - 0.14, 0.96),
                                      fr.cm(e + 0.14, n + 0.14, 0.96), fr.cm(e - 0.14, n + 0.14, 0.96)],
                      "c": "#6b6860", "cn": "#202329", "dg": 0.85})

    parapet(rl, -1)
    # Round 69m: the other edge. Stop 1 is called "the rail at the American Falls" and there was no
    # rail on that side at all -- the walk's west edge was a cut with the channel 19 m below it. One
    # run of the same kit, mirrored (`side` +1 puts the face toward the walker).
    parapet([(-8.2, -4.0), (-8.2, 155.4)], 1)

    # The mist. Round 69m first put the Canadian page's funnel test here and it put a column 12.9 m
    # from the eye -- a wall of billboards (round 60's finding again: a puff bigger than the thing it
    # stands for is a screen). The horseshoe's plume belongs at the fall's own foot, 80 m out, which
    # is where the two columns below stand; nothing is placed between the visitor and the brink.
    return P


# ---- Toronto from the LookOut (OpenStreetMap + Wikipedia's list of tallest buildings) -------------
TOR_O = (43.6425637, -79.3870872)       # the CN Tower (OSM way 32742038)
TOR_LOOKOUT = 346.0                     # LookOut level, metres above the base
TOR_GRID = -16.7                        # the downtown street grid's turn from true north


def tor(lat, lon):
    return ll_m(lat, lon, *TOR_O)


# The skyline the LookOut looks at: every tower of 150 m and over in Wikipedia's "List of tallest
# buildings in Toronto", all 117, at the list's coordinates and heights (read 2026-10-15 for the 23 of
# 214 m and over within 4 km, the rest 2026-10-16; the list counts topped-out towers, and so does this).
# Footprints are typical (office 40 m, residential 30 m), not surveyed; bases are the ground's level,
# and the ground is drawn level, though the city climbs away from the lake.
TOR_TOWERS = [
    ("SkyTower at Pinnacle One Yonge", 43.64333, -79.375, 351.8, 34, -4.0),
    ("First Canadian Place", 43.648838, -79.381744, 298.3, 46, 0),
    ("The St. Regis Toronto", 43.649818, -79.380341, 276.9, 34, 0),
    ("Scotia Plaza", 43.649422, -79.379578, 275.0, 44, 0),
    ("Aura", 43.659431, -79.382812, 271.9, 34, 0),
    ("TD Canada Trust Tower", 43.646465, -79.378784, 260.9, 40, 0),
    ("CIBC Square II", 43.64527, -79.3788, 243.1, 44, 0),
    ("CIBC Square I", 43.644161, -79.377762, 241.3, 44, 0),
    ("Commerce Court West", 43.648209, -79.379509, 239.0, 42, 0),
    ("TD Terrace", 43.645195, -79.384583, 236.5, 44, 0),
    ("ICE Condominiums II", 43.642048, -79.381676, 234.2, 30, 0),
    ("Harbour Plaza East", 43.642113, -79.379013, 233.0, 30, 0),
    ("Concord Canada House 1", 43.641399, -79.392265, 231.3, 30, 0),
    ("Sugar Wharf Tower G", 43.64476, -79.371704, 230.2, 30, -2.0),
    ("Harbour Plaza West", 43.642109, -79.379616, 224.0, 30, 0),
    ("Ten York", 43.641106, -79.381248, 224.0, 30, 0),
    ("TD Bank Tower", 43.647568, -79.381012, 222.8, 40, 0),
    ("Sugar Wharf Tower F", 43.644562, -79.371086, 218.4, 30, -2.0),
    ("Prestige at Pinnacle One Yonge", 43.643608, -79.374184, 216.2, 30, -3.0),
    ("Bay Adelaide Centre West", 43.650269, -79.380508, 214.7, 40, 0),
    ("Shangri-La Toronto", 43.649086, -79.386177, 214.0, 30, 0),
    ("One Bloor West", 43.669917, -79.387028, 308.9, 34, 0),
    ("One Bloor", 43.669983, -79.386147, 257.3, 34, 0),
    # The rest of the list within the 4 km (read 2026-10-16, the article's own wikitext): 11 YV,
    # 221.9 m, which the first reading missed, then every tower from 214 m down to 150 m, in the
    # list's order. The footprint follows the list's purpose column -- an office 40 m, a residence,
    # hotel or mixed-use tower 30 m -- except where two listed towers stand closer than that: 55C
    # and Chaz on Charles Street East, and Eight Cumberland between 1 Yorkville and 11 YV, are
    # narrowed to keep 4 m between them rather than moved off their coordinates.
    ("11 YV", 43.671486, -79.388222, 221.91, 30, 0),
    ("Ritz-Carlton Toronto", 43.645226, -79.387009, 209.5, 30, 0),
    ("488 University Avenue", 43.655064, -79.389008, 207.6, 30, 0),
    ("Bay-Wellington Tower", 43.647369, -79.378334, 207.0, 40, 0),
    ("L Tower", 43.646172, -79.376312, 205.0, 30, 0),
    ("Massey Tower", 43.653683, -79.37915, 204.2, 30, 0),
    ("Four Seasons Hotel and Residences West", 43.671764, -79.38987, 204.0, 30, 0),
    ("ICE Condominiums I", 43.641655, -79.382034, 202.3, 30, 0),
    ("Concord Canada House 2", 43.64101, -79.392715, 202.2, 30, 0),
    ("YC Condominiums", 43.661823, -79.383675, 202.2, 30, 0),
    ("88 Scott", 43.648434, -79.376495, 198.2, 30, 0),
    ("Bay Adelaide Centre East", 43.650723, -79.379471, 196.0, 40, 0),
    ("Wellesley on the Park", 43.664406, -79.385292, 194.2, 30, 0),
    ("EY Tower", 43.650162, -79.382515, 188.2, 40, 0),
    ("Toronto House", 43.648094, -79.388229, 186.5, 30, 0),
    ("RBC Centre", 43.645622, -79.385735, 184.9, 40, 0),
    ("Casa II", 43.669441, -79.384201, 184.5, 30, 0),
    ("U Condominiums East Tower", 43.666916, -79.388718, 184.0, 30, 0),
    ("1 Yorkville", 43.671604, -79.387764, 183.2, 26, 0),
    ("TD North Tower", 43.647926, -79.381996, 182.9, 40, 0),
    ("Maple Leaf Square North Tower", 43.642849, -79.380585, 181.3, 30, 0),
    ("8 Wellesley", 43.665043, -79.385155, 181.2, 30, 0),
    ("Casa III", 43.669529, -79.383698, 179.6, 30, 0),
    ("Rosedale on Bloor", 43.671947, -79.377403, 179.0, 30, 0),
    ("INDX Tower", 43.650749, -79.382118, 178.2, 30, 0),
    ("88 Queen Street East", 43.653687, -79.374878, 177.0, 30, 0),
    ("One King West Hotel & Residence", 43.648808, -79.378204, 176.2, 30, 0),
    ("8 Spadina at The Well", 43.643082, -79.394661, 174.1, 40, 0),
    ("Success Tower 2", 43.643204, -79.376892, 173.3, 30, 0),
    ("Royal Bank Plaza South", 43.646198, -79.379761, 173.0, 40, 0),
    ("Maple Leaf Square South Tower", 43.642296, -79.380814, 171.3, 30, 0),
    ("The Selby", 43.671158, -79.377098, 170.6, 30, 0),
    ("Teahouse Condominiums South", 43.663258, -79.383537, 170.0, 30, 0),
    ("Eight Cumberland", 43.671314, -79.387718, 169.8, 26, 0),
    ("55C", 43.668858, -79.383537, 167.0, 18, 0),
    ("252 Church", 43.656181, -79.377342, 166.1, 30, 0),
    ("44 Charles Street West", 43.668678, -79.388229, 166.0, 30, 0),
    ("Karma", 43.661747, -79.384209, 165.9, 30, 0),
    ("Theatre Park", 43.64761, -79.387352, 164.8, 30, 0),
    ("Social", 43.656265, -79.376701, 164.8, 30, 0),
    ("400 King West", 43.6460451, -79.3929238, 164.6, 30, 0),
    ("Burke Condominiums", 43.671421, -79.376309, 163.3, 30, 0),
    ("Residences of College Park I", 43.660305, -79.385063, 163.0, 30, 0),
    ("Burano", 43.662212, -79.386497, 163.0, 30, 0),
    ("Success Tower 1", 43.642719, -79.377144, 161.9, 30, 0),
    ("X2", 43.669582, -79.380569, 161.1, 30, 0),
    ("FIVE", 43.665569, -79.385597, 161.0, 30, 0),
    ("Alias", 43.652061, -79.375542, 158.7, 30, 0),
    ("The Uptown Residences", 43.669468, -79.387459, 158.0, 30, 0),
    ("Three Hundred", 43.644222, -79.389481, 157.9, 30, 0),
    ("Lighthouse Tower Condominium", 43.645248, -79.369301, 157.9, 30, 0),
    ("The Well Residential One", 43.642761, -79.395424, 157.3, 30, 0),
    ("Grid Condos", 43.656948, -79.374092, 157.0, 30, 0),
    ("16 York", 43.642635, -79.382019, 157.0, 40, 0),
    ("Delta Toronto Hotel", 43.643208, -79.383827, 156.8, 30, 0),
    ("One York Street", 43.641617, -79.380264, 156.8, 40, 0),
    ("Festival Tower", 43.64698, -79.390182, 156.7, 30, 0),
    ("Hotel Riu Plaza Toronto", 43.64732, -79.39183, 156.1, 30, 0),
    ("Theatre District Residences", 43.64694, -79.39167, 156.1, 30, 0),
    ("Dundas Square Gardens", 43.657566, -79.374268, 156.0, 30, 0),
    ("No. 55 Mercer", 43.64529, -79.391518, 156.0, 30, 0),
    ("Nobu Residences East Tower", 43.645611, -79.390396, 156.0, 30, 0),
    ("Nobu Residences West Tower", 43.645451, -79.390976, 156.0, 30, 0),
    ("King Blue North Tower", 43.646004, -79.39151, 155.8, 30, 0),
    ("PJ Condos", 43.647514, -79.389877, 155.8, 30, 0),
    ("Maverick", 43.64613, -79.39109, 154.5, 30, 0),
    ("U Condominiums West Tower", 43.666927, -79.389389, 154.0, 30, 0),
    ("87 Peter", 43.647053, -79.392242, 154.0, 30, 0),
    ("Yonge + Rich", 43.651878, -79.376968, 154.0, 30, 0),
    ("TD South Tower", 43.646774, -79.381233, 153.6, 40, 0),
    ("35 Mariner", 43.639828, -79.392036, 153.2, 30, 0),
    ("Montage", 43.641155, -79.394371, 153.0, 30, 0),
    ("IMMIX", 43.662724, -79.384033, 153.0, 30, 0),
    ("Peter & Adelaide", 43.647713, -79.3934323, 153.0, 30, 0),
    ("The Charles at Church", 43.669559, -79.383041, 152.7, 30, 0),
    ("Chaz Yorkville Condos", 43.668934, -79.383865, 151.4, 18, 0),
    ("The 250", 43.654598, -79.380524, 150.6, 30, 0),
    ("Monde", 43.646305, -79.36512, 150.0, 30, 0),
    ("The Saint", 43.652061, -79.374992, 150.0, 30, 0),
    # And the list's 15 beyond 4 km, in its order: Humber Bay and Etobicoke to the west-south-west,
    # Yonge and Eglinton, One Delisle and North York just west of north -- the far glass looks that
    # way from the walk's end (they are slivers on its horizon). The western ones stand behind the
    # core from this chord: drawn so the list is whole, and never in frame.
    ("Eau du Soleil Sky Tower", 43.623436, -79.480064, 228.2, 30, 0),
    ("E Condos South", 43.707436, -79.398018, 195.7, 30, 0),
    ("2221 Yonge", 43.706104, -79.397629, 192.5, 30, 0),
    ("Water's Edge at the Cove", 43.625999, -79.478714, 182.3, 30, 0),
    ("Eau Du Soleil Water Tower", 43.623417, -79.478889, 180.8, 30, 0),
    ("Vita on the Lake", 43.624702, -79.479187, 177.1, 30, 0),
    ("Hullmark Centre I", 43.761433, -79.409859, 169.6, 30, 0),
    ("Lago", 43.625473, -79.478897, 167.5, 30, 0),
    ("Quantum 2", 43.705669, -79.397453, 165.0, 30, 0),
    ("Pinnacle Etobicoke 2A", 43.63191, -79.54246, 161.9, 30, 0),
    ("E2 at E Place", 43.707916, -79.396996, 161.8, 30, 0),
    ("Kipling Station Condos", 43.63814, -79.53779, 160.8, 30, 0),
    ("One Delisle", 43.6889175, -79.3948974, 158.0, 30, 0),
    ("Westlake Village 1", 43.622723, -79.483253, 153.3, 30, 0),
    ("Beyond the Sea Star Tower", 43.621723, -79.482834, 151.5, 30, 0),
]
# The under-150 m context comes from 2025 City massing: z14 AVG_HEIGHT polygons, clipped to the
# lookout's 15 km view and prepared as local east/north metres. The data file includes the audit
# flags and source metadata; only candidates outside 40 m of a named TOR_TOWERS proxy are rendered.
TOR_MASSING_2025 = json.loads((ROOT / "data/toronto-massing-2025.json").read_text(encoding="utf-8"))
TOR_MASSING_2025_FEATURES = [x for x in TOR_MASSING_2025["features"] if x["candidate_for_scene"]]
# The Toronto Islands (OSM relation 10705563, simplified to ~40 m) and the Leslie Street Spit
# (Tommy Thompson Park, OSM way 189780702); Billy Bishop airport (OSM relation 85471).
TOR_ISLANDS = [tor(la, lo) for lo, la in (
    (-79.4049155, 43.6278629), (-79.4042908, 43.6264494), (-79.4007385, 43.6244491),
    (-79.3922309, 43.6178924), (-79.389772, 43.6130676), (-79.3882736, 43.6115568),
    (-79.3821836, 43.6122351), (-79.3715204, 43.6163625), (-79.3669545, 43.6189773),
    (-79.3583527, 43.6250963), (-79.354423, 43.6298036), (-79.3494405, 43.6310442),
    (-79.3530698, 43.6341993), (-79.3567244, 43.6333165), (-79.3563062, 43.6290134),
    (-79.3592886, 43.6256517), (-79.3657635, 43.6214987), (-79.3704692, 43.6208264),
    (-79.3766004, 43.6185149), (-79.3817514, 43.6196097), (-79.3865483, 43.6204608),
    (-79.3893095, 43.6208439), (-79.3903466, 43.6182249), (-79.3899821, 43.6234306),
    (-79.3889831, 43.6244016), (-79.3896458, 43.6267408), (-79.3885497, 43.6278597),
    (-79.3896648, 43.6297552), (-79.3874595, 43.6305459), (-79.3889094, 43.6327235),
    (-79.3921772, 43.6312628), (-79.3949247, 43.6336577))]
TOR_SPIT = dp_simplify([tor(la, lo) for lo, la in (
    (-79.3450575, 43.621791), (-79.3435403, 43.6126919), (-79.3366554, 43.6191997),
    (-79.3272007, 43.6188716), (-79.3236923, 43.6174026), (-79.3220937, 43.6226249),
    (-79.321205, 43.6293394), (-79.3209657, 43.6331755), (-79.3216044, 43.6377822),
    (-79.3200464, 43.6458085), (-79.3216818, 43.6521617), (-79.3280425, 43.6500249),
    (-79.3241548, 43.6472539), (-79.3214683, 43.6453059), (-79.3234378, 43.6375319),
    (-79.3290549, 43.6336186), (-79.3364677, 43.6294405), (-79.3289148, 43.6309204),
    (-79.3316982, 43.626645), (-79.3241848, 43.6258715), (-79.3330988, 43.6223337),
    (-79.3390842, 43.6294174), (-79.3388756, 43.6221511), (-79.3450575, 43.621791))], 25)
TOR_RUNWAY = (tor(43.6276, -79.4030), tor(43.6309, -79.3900))   # the aerodrome's long axis (approximate)
# The harbour edge: Queens Quay's own line (OSM ways 352799162, 41789174, 407215251, 24221150,
# 538879521) set 70 m lakeward for the dock walls; west to Bathurst Quay and east to the Eastern Gap
# and the spit's root, the edge between them read from the islands' gaps (approximate).
TOR_SHORE = [tor(la, lo) for la, lo in (
    (43.6330, -79.4600), (43.6320, -79.4200), (43.6345, -79.4040), (43.6355, -79.3985),
    (43.6355, -79.3978), (43.6360, -79.3954), (43.6369, -79.3930), (43.6381, -79.3876),
    (43.6383, -79.3866), (43.6385, -79.3855), (43.6388, -79.3837), (43.6397, -79.3793),
    (43.6404, -79.3774), (43.6410, -79.3755), (43.6413, -79.3747), (43.6425, -79.3700),
    (43.6420, -79.3600), (43.6390, -79.3530), (43.6370, -79.3505), (43.6385, -79.3440),
    (43.6420, -79.3330), (43.6470, -79.3255), (43.6522, -79.3217), (43.6600, -79.3050),
    (43.6700, -79.2850), (43.6850, -79.2500), (43.7500, -79.1000), (43.8300, -78.9000))]
TOR_SHORE = [tor(la, lo) for la, lo in ((43.5500, -79.6000), (43.6000, -79.5000))] + TOR_SHORE


def toronto_world(fr):
    """Toronto at night from the LookOut: ground, lake, islands, the skyline, the airport's lights."""
    P = []
    g, lake, isl = -TOR_LOOKOUT, -TOR_LOOKOUT - 4, -TOR_LOOKOUT - 2.5
    def air(e, n):
        d = math.hypot(e, n)
        return round(min(0.55, 0.06 + d / 9000 * 0.5), 3)
    # The ground and the lake, both cut into cells: the city's lights tile at their real size (one
    # tile = 320 m) without an affine map bending across a cell kilometres deep, and the air thickens
    # cell by cell with distance, which is what lets the lake fade into the horizon's haze.
    w_end, e_end = TOR_SHORE[0], TOR_SHORE[-1]
    R = 42000
    land = TOR_SHORE + [(R, e_end[1]), (R, R), (-R, R), (-R, w_end[1])]
    water = TOR_SHORE + [(R, e_end[1]), (R, -R), (-R, -R), (-R, w_end[1])]
    # Rings of cells, each finer ring inside the next. A cell is left out only when it lies wholly
    # inside the ring within, so the rings meet without a seam of sky between them: skipping cells
    # by their centres left the band from 21.6 km to 28 km bare, a line of sky under the horizon.
    cells, inner = [], 0
    for size, reach in ((600, 2400), (1800, 7200), (5400, 21600), (10800, 43200)):
        k = reach // size
        for i in range(-k, k):
            for j in range(-k, k):
                x0, y0 = i * size, j * size
                if -inner <= x0 and x0 + size <= inner and -inner <= y0 and y0 + size <= inner:
                    continue
                cells.append((x0, y0, x0 + size, y0 + size))
        inner = reach
    for (x0, y0, x1, y1) in cells:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        poly = clip_rect(land, x0, y0, x1, y1)
        if len(poly) >= 3:
            P.append(_hprim("x", fr, poly, g, pat="cityn", u=32000, ax="h",
                           c="#151a26", a=air(cx, cy), s=9, n=1))
        poly = clip_rect(water, x0, y0, x1, y1)
        if len(poly) >= 3:
            P.append(_hprim("f", fr, poly, lake, c="#0b1322", a=air(cx, cy), s=9.5, n=1))
    P.append(_hprim("f", fr, TOR_ISLANDS, isl, c="#1a2521", a=0.12, s=8.5, n=1))
    P.append(_hprim("f", fr, TOR_SPIT, isl, c="#10161a", a=0.2, s=8.5, n=1))
    # The airport's runway lights, along the aerodrome's long axis (approximate).
    (re0, rn0), (re1, rn1) = TOR_RUNWAY
    L = math.hypot(re1 - re0, rn1 - rn0)
    px, py = -(rn1 - rn0) / L * 22, (re1 - re0) / L * 22
    pts = []
    for k in range(21):
        t = k / 20
        e, n = re0 + (re1 - re0) * t, rn0 + (rn1 - rn0) * t
        pts += [fr.cm(e + px, n + py, isl + 1), fr.cm(e - px, n - py, isl + 1)]
    P.append({"t": "l", "pts": pts, "r": 90, "c": "#fff1c8", "a": 0.18})
    # The islands are parkland and dark at night; no lights are drawn on them (their docks and homes
    # are not surveyed here).
    # The skyline: each tower a box on the grid's turn, wearing the towers' window tile (`towerwin`:
    # which windows are lit is a seeded draw -- the street's tile lights them on diagonals, and a
    # hundred towers of diagonals read as hatching) at a storey's real height. The tile is eight
    # storeys tall: 4.0 m apiece on an office footprint, 3.2 m on a
    # residential one (typical floor-to-floor heights, not each building's own) -- at 1.6 m, which
    # it was, every tower showed twice its real number of floors.
    gn = (math.sin(math.radians(TOR_GRID)), math.cos(math.radians(TOR_GRID)))    # the grid's north
    ge = (gn[1], -gn[0])                                                         # and its east
    for name, la, lo, h, w, base in TOR_TOWERS:
        e, n = tor(la, lo)
        hw = w / 2
        foot = [(e + sx * hw * ge[0] + sy * hw * gn[0], n + sx * hw * ge[1] + sy * hw * gn[1])
                for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        a = air(e, n)
        for i in range(4):
            p0, p1 = foot[i], foot[(i + 1) % 4]
            P.append(_prim("x", [fr.cm(*p0, g + base), fr.cm(*p1, g + base), fr.cm(*p1, g + base + h),
                                 fr.cm(*p0, g + base + h)], pat="towerwin", u=3200 if w >= 40 else 2560,
                           ax="v", c="#1b2740",
                           a=a, n=1, l=0.5, fn=_fn(fr, *_outward(foot, p0, p1))))
        P.append(_hprim("f", fr, foot, g + base + h, c="#141c2c", a=a, n=1))
    # The City's 2025 massing fills the 100–150 m gap. Use its polygons and AVG_HEIGHT field values
    # as supplied; the field's exact semantics are not independently verified. Round 41 checked the
    # nearest derivation for a field dictionary (schoolofcities/toronto-buildings at the pinned commit
    # 7bb3596): it reads the same field off the same 2025 export, displays it as metres, and documents
    # no definition either — so "approximate extrusion height, not a verified survey height" stands.
    # Facade/window patterns
    # are absent from the source, so these remain plain night massing. The layer is split into parts,
    # hence these are polygon masses, not a count of distinct buildings.
    for feature in TOR_MASSING_2025_FEATURES:
        height = feature["avg_height_m"]
        for foot in feature["polygons_en_m"]:
            e, n = feature["centroid_en_m"]
            P += world_extrude(fr, foot, g, g + height, "#1b2740", "#141c2c", air(e, n), n=1)
    # Rogers Centre below to the west-south-west: the roof, 86 m, its white panels at night.
    rc = [tor(la, lo) for lo, la in ((-79.3908121, 43.6421698), (-79.3902364, 43.6407719),
                                     (-79.389037, 43.6405471), (-79.3882698, 43.6408479),
                                     (-79.3876575, 43.641308), (-79.3882376, 43.6427464),
                                     (-79.3891078, 43.6425763), (-79.3903255, 43.6422566))]
    P += world_extrude(fr, rc, g, g + 86, "#3a4253", "#9aa3ae", 0.08, n=1)
    return P


# ---- Journey Behind the Falls: the tunnel's own furniture, in lane centimetres --------------------
# The tunnel is 56 m from the elevator to the deck (falzguy.com's measured figures); the deck stands
# at its mouth on the Canadian cliff, 38 m under the rim (the elevator's sourced descent).
JOURNEY_FRAME = (-37.0, 4.0, -38.0, 120.0)   # elevator landing (E, N, U) and the tunnel's bearing
JOURNEY_TUNNEL_CM = 5600
JOURNEY_BRANCH_CM = (1533, 1906)             # the branch's mouth on the right wall, walk cm


def journey_world(fr):
    """The falls from the deck, the branch to the portals, the deck and the cliff round its mouth."""
    P = niagara_world(fr, "deck")
    Zf = JOURNEY_TUNNEL_CM
    # The branch to the portals: 16-18 m in, to the south-east; the Cataract Portal's spur 61 m along
    # it, the Great Falls Portal's at its end, 110 m along. Drawn straight (its line is not surveyed),
    # leaving the main tunnel's right wall at 40 degrees: its two walls start at the opening's two
    # jambs, which a 2.4 m bore at that angle sets 3.73 m apart along the wall.
    za, zb = JOURNEY_BRANCH_CM
    dx, dz = math.sin(math.radians(40)), math.cos(math.radians(40))
    Lw = lambda t, y: [round(120 + dx * t), y, round(zb + dz * t)]       # the branch's left wall
    Rw = lambda t, y: [round(120 + dx * t), y, round(za + dz * t)]       # and its right
    Cw = lambda t, y: [round(120 + dx * t), y, round((za + zb) / 2 + dz * t)]
    aof = lambda t: round(min(0.5, 0.05 + t / 12000 * 0.45), 3)
    cuts = [0, 900, 1800, 3000, 4500, 6000, 6240, 8000, 9500, 11000]
    # The same concrete as the main bore (its tile at the lane's own scale, 64 cm a repeat), so the
    # branch reads as the tunnel turning, not as another material.
    con = dict(pat="tunnelc", u=64, n=1)
    for t0, t1 in zip(cuts, cuts[1:]):
        a = aof(t0)
        # the walkway's boards, as in the main tunnel: at the branch's distance their flat colour
        P.append(_prim("f", [Lw(t0, 0), Lw(t1, 0), Rw(t1, 0), Rw(t0, 0)], c="#4a3f34", a=a, n=1))
        if (t0, t1) == (6000, 6240):
            # The Cataract Portal's spur opens off the branch's left wall: daylight through water.
            P.append(_prim("f", [Lw(t0, 0), Lw(t1, 0), Lw(t1, 200), Lw(t0, 200)],
                           c="rgba(226,238,240,0.9)", a=a, n=1, d0=1))
        else:
            P.append(_prim("x", [Lw(t0, 0), Lw(t1, 0), Lw(t1, 200), Lw(t0, 200)], c="#58595a", a=a, ax="v", **con))
        P.append(_prim("x", [Rw(t0, 0), Rw(t1, 0), Rw(t1, 200), Rw(t0, 200)], c="#4f5052", a=a, ax="v", **con))
        P.append(_prim("x", [Lw(t0, 200), Lw(t1, 200), Cw(t1, 260), Cw(t0, 260)], c="#4a4b4a", a=a, ax="v", **con))
        P.append(_prim("x", [Rw(t0, 200), Rw(t1, 200), Cw(t1, 260), Cw(t0, 260)], c="#454645", a=a, ax="v", **con))
    # Round 35: a dark underlay under each face of the branch, its whole run long (sort layer 0.5,
    # painted before the panels). The panels are filled one by one, and the hairline a filled edge
    # leaves let the sky through: the branch read as a white wireframe. Over the underlay a joint
    # reads as a joint. The Cataract spur's opening is left out of it.
    for quad in ([Lw(0, 0), Lw(11000, 0), Rw(11000, 0), Rw(0, 0)],
                 [Lw(0, 0), Lw(6000, 0), Lw(6000, 200), Lw(0, 200)],
                 [Lw(6240, 0), Lw(11000, 0), Lw(11000, 200), Lw(6240, 200)],
                 [Rw(0, 0), Rw(11000, 0), Rw(11000, 200), Rw(0, 200)],
                 [Lw(0, 200), Lw(11000, 200), Cw(11000, 260), Cw(0, 260)],
                 [Rw(0, 200), Rw(11000, 200), Cw(11000, 260), Cw(0, 260)]):
        P.append(_prim("f", quad, c="#2c2d2c", a=0.1, n=1, s=0.5))
    # The Great Falls Portal's light at the branch's end.
    P.append(_prim("f", [Lw(11000, 0), Rw(11000, 0), Rw(11000, 200), Cw(11000, 260), Lw(11000, 200)],
                   c="rgba(220,234,238,0.82)", a=aof(11000), n=1, d0=1))
    P.append({"t": "l", "pts": [[p[0] + 8, 165, p[2] + 6] for p in (Rw(t, 0) for t in range(500, 10600, 800))],
              "r": 7, "c": "#ffd08a", "a": 0.1})
    # The deck at the tunnel's mouth: a slab, side parapets with their pipe rail, the upper deck's
    # roof over its first metres and the pillar that carries it (Reddit photograph, 2025).
    P.append({"t": "f", "h": 0, "q": [-350, Zf, 350, Zf, 350, 6330, -350, 6330], "c": "#706e68",
              "a": 0.04, "dg": 0.7})
    for sx in (-350, 350):
        P.append(_prim("f", [[sx, 0, Zf], [sx, 0, 6330], [sx, 105, 6330], [sx, 105, Zf]], c="#6c6a64",
                       a=0.04, dg=0.7))
        P.append(_prim("f", [[sx, 105, Zf], [sx, 105, 6330], [sx, 111, 6330], [sx, 111, Zf]], c="#a3a9ae",
                       a=0.04, dg=0.6))
    P.append({"t": "f", "h": 262, "q": [-350, Zf, 350, Zf, 350, 5960, -350, 5960], "c": "#4f4e4b", "a": 0.04,
              "d0": 1, "two": 1})
    P.append(_prim("f", [[-350, 262, 5960], [350, 262, 5960], [350, 292, 5960], [-350, 292, 5960]],
                   c="#62615d", a=0.04, dg=0.6))
    for (x0, z0, x1, z1) in ((305, 5925, 335, 5925), (335, 5925, 335, 5955), (335, 5955, 305, 5955),
                             (305, 5955, 305, 5925)):
        P.append(_prim("f", [[x0, 0, z0], [x1, 0, z1], [x1, 262, z1], [x0, 262, z0]], c="#6a6964", a=0.04, dg=0.6))
    # The cliff the tunnel comes out of, round its mouth, up to the rim 38 m overhead.
    for quad in ([[-4000, -2000, Zf], [-125, -2000, Zf], [-125, 3800, Zf], [-4000, 3800, Zf]],
                 [[125, -2000, Zf], [4000, -2000, Zf], [4000, 3800, Zf], [125, 3800, Zf]],
                 [[-125, 262, Zf], [125, 262, Zf], [125, 3800, Zf], [-125, 3800, Zf]]):
        P.append(_prim("f", quad, c="#5e5a51", cn="#1c1f25", a=0.06, s=0.001, dg=0.45))
    return P


# The day sky over the falls, all round: elevation stops, a day colour and a night one.
NIAGARA_SKY = {"stops": [{"e": -2, "c": "#d9e6ee", "n": "#1e2639"}, {"e": 0, "c": "#d4e3ec", "n": "#1d2538"},
                         {"e": 5, "c": "#b3cde0", "n": "#161d30"}, {"e": 18, "c": "#86aed2", "n": "#101728"},
                         {"e": 50, "c": "#6593c4", "n": "#0b101e"}, {"e": 90, "c": "#5784b8", "n": "#080c18"}]}
# Toronto's night over the LookOut: the horizon's glow off the city, the zenith near black.
TORONTO_SKY = {"stops": [{"e": -2, "c": "#3d4260"}, {"e": 0, "c": "#4a4b66"}, {"e": 2, "c": "#363b58"},
                         {"e": 8, "c": "#22283f"}, {"e": 30, "c": "#121829"}, {"e": 90, "c": "#080c18"}]}
# Tokyo's sky over Nakamise: the city's glow sitting on the horizon, gone to navy overhead.
# Round 69h. Until this round the lane authored three *height bands* instead --
# (-260..1600, 1600..7000, 7000..200000) on the 1,200 m far plane. At that distance band 1 ends
# 0.76 deg above the horizon and band 2 at 3.34 deg, so everything above the 4.8 m roofline, which
# is most of the sky a visitor ever sees, was band 3 alone: one flat colour, measured 8.4-12.4 luma
# down a 130 px column, at both hours. The same numbers read as a gradient when they are authored as
# elevations, which is what this table is: `c` is the day the lane now opens, `n` the night it trades
# to (the shape NIAGARA_SKY already uses, so one reading of the sky serves the picture and the
# environment map both).
TOKYO_SKY = {"stops": [{"e": -2, "c": "#c3d6e8", "n": "#2f3a58"}, {"e": 0, "c": "#cfdfee", "n": "#45527a"},
                       {"e": 3, "c": "#bcd3e8", "n": "#38446a"}, {"e": 8, "c": "#a3c1de", "n": "#2b3556"},
                       {"e": 16, "c": "#8db1d5", "n": "#202841"}, {"e": 30, "c": "#7fa6cf", "n": "#171d31"},
                       {"e": 55, "c": "#74a0cd", "n": "#101523"}, {"e": 90, "c": "#6c9ac9", "n": "#0b0f1a"}]}


def niagara_parapet_bands(z_back=-200, z_end=4301, every=300, first=150, half=25):
    """The parapet along the gorge, in record cm: a rough stone post every `every` walk cm, and
    between the posts a low stone wall carrying a band of ornamental iron, open air above both.
    Round 35, after the photographs at the brink: the wall 60 cm, the iron's rings to 90 cm, the
    posts 96 cm and 50 cm square (it had been a 24 cm curb under bars to 108 cm, posts 120 cm)."""
    edges = [z_back]
    for q in range(first, z_end, every):
        edges += [q - half, q + half]
    edges.append(z_end)
    zs = lambda z: round(z / Z_SCALE, 1)
    out = []
    for i in range(len(edges) - 1):
        a, b = zs(edges[i]), zs(edges[i + 1])
        if i % 2 == 1:
            out += [{"side": -1, "z0": a, "z1": b, "y0": 0, "y1": 96, "kind": "stonewall"},
                    {"side": -1, "z0": a, "z1": b, "y0": 96, "y1": 400, "kind": "open"}]
        else:
            out += [{"side": -1, "z0": a, "z1": b, "y0": 0, "y1": 60, "kind": "stonewall"},
                    {"side": -1, "z0": a, "z1": b, "y0": 60, "y1": 90, "kind": "railing", "frame": "#1f2126",
                     "scroll": 1},
                    {"side": -1, "z0": a, "z1": b, "y0": 90, "y1": 400, "kind": "open"}]
    return out
