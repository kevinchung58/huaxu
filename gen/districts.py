"""`gen/districts.py` — the district records: what each place is, where everything in it stands.

This is the largest authored object in the repository and the one a scene round edits: the street,
Toronto, Tokyo, Fukuoka, and the three spaces they own, each with its lane box, its objects, its
stops and its frames. Split out of `_gen_html.py` in round 78 and proven byte-identical on all 19
emitted pages; the entry point is `_gen_html.py`.
"""
from gen.site import ROOM_BY_ID
from gen.world import JOURNEY_FRAME, LaneFrame, MOJI_BLOCKS, MOJI_STRAIT, MOJI_TOWER_DEPTH_M, MOJI_TOWER_FLOORS, MOJI_TOWER_FOOTPRINT, MOJI_TOWER_HEIGHT_M, MOJI_TOWER_OBSERVATION_M, MOJI_TOWER_SCALE, MOJI_TOWER_WIDTH_M, NAKAMISE_BAYS, NAKAMISE_DRESSING, NAKAMISE_LAMPS, NAKAMISE_SURFACES, NIAGARA_SKY, NIAGARA_STORY, TOKYO_SKY, TORONTO_SKY, TOWER_STORY, Z_SCALE, _moji_massing, goat_world, journey_world, niagara_parapet_bands, niagara_world, toronto_world
DISTRICTS = [
    {
        # The hub. The street is the site's own ground — it names no city, carries no lettering, and
        # hangs no pictures: its whole job is to be the place the three rooms stand on, with a door
        # for each and an open sky above the walls. It is outdoors the way Canada's walkway is: the
        # far end opens onto the harbour instead of stopping, and the sun and street fixtures share
        # the light across the walk.
        "id": "street", "label": "The street",
        "page": ROOM_BY_ID["street"]["page"],
        "plates": ROOM_BY_ID["street"]["plates"],
        # Longer than it used to be on purpose: the rooms now stand a walk apart, so stepping out
        # of one and into the next is a journey with the other doors ahead of you, not three doors
        # in a row. max_d stops a stride short of the quay rail: the street ends at the water's
        # edge on purpose, and the walk is allowed to stand at the rail, not past it.
        # The lane runs past its last door into the quay: 3400 walk units past record depth 1040,
        # ending at a walkable rail rather than a wall.
        "lane": {"w": 700, "d": 1040, "ceil": 620, "back": 300, "max_d": 4150, "open": True},
        # Its own spoken description (round 32): it had been inheriting the old Tokyo lane's, which
        # listed a mirror, a meter box and a standpipe this street never had, and a far end of a
        # crossing, a tower and a mountain where the street's far end is a harbour.
        "clad_note": (" The street is dressed by region: plaster and brick fronts, shops with their "
                      "canvases, noren and blank fascias, planters, bins, bicycles, a vending machine "
                      "and a folding board along the kerbs, and three doors -- Toronto, Tokyo and "
                      "Fukuoka. Nothing on any of it carries a word."),
        "sight_note": (" At its far end the street walks out onto a quay over a harbour: moving water, "
                       "a ferry, a crane, a breakwater and the far shore."),
        # The street is walked in the day. Its record says so, and the renderer answers by giving the
        # page its own clock (fifteen minutes rather than four, opening just before noon) and by
        # adding the sun to every surface rather than washing the night tiles brighter — see the
        # `DAY()`/`emit()` note in `js/site.js`. Four minutes handed a visitor dusk before they had
        # walked to the first door, and the brief is a street you look around in.
        "day": True,
        "purpose": "The street the rooms stand on, walked in the afternoon sun",
        "status": "open",
        "kind": "personal",
        "blurb": "One straight street in the afternoon. Three lit doorways, one per room, a walk "
                 "apart, a Japanese half under a lantern string at the far end, and a sunlit quay "
                 "with water and a low far shore beyond the last wall.",
        "objects": [
            # The three doors. Each names the room it opens onto — that is navigation, not a claim —
            # and each carries a lamp over it, because on a night street a door you can read is a
            # door with light on it. Reachability is a rendering fact the records must respect: the
            # walker's z clamps at MAX_D (3400 in walk units) and the reach ring is 190 cm, so a
            # door authored deeper than record z ~1238 (3400+190, over Z_SCALE) could be seen but
            # never opened. The last door sits at 780 with room to spare.
            {"id": "door-toronto", "kind": "door", "x": -346, "z": 160, "y": 0, "ry": 90,
             "leaf": "#274b66",
             "glow": [{"r": 150, "k": 0.75, "dy": 235, "tint": "rgba(255,178,102,0.6)"}],
             "leave": ROOM_BY_ID["toronto"]["page"],
             "title": "The door onto Toronto",
             "hint": "It opens onto the little city: a dark hall of lit tables where Toronto, its "
                     "falls and its markets stand small enough to walk around."},
            {"id": "door-tokyo", "kind": "door", "x": 346, "z": 470, "y": 0, "ry": -90,
             "leaf": "#5c4434",
             "glow": [{"r": 150, "k": 0.72, "dy": 235}],
             "leave": ROOM_BY_ID["tokyo"]["page"],
             "title": "The door onto Tokyo",
             "hint": "It opens onto Nakamise-dori at night: Kaminarimon behind you, the shops "
                     "shuttered, Hozomon lit at the far end. Kaminarimon brings you back."},
            {"id": "door-fukuoka", "kind": "door", "x": -346, "z": 780, "y": 0, "ry": 90,
             "leaf": "#4b4368",
             "glow": [{"r": 150, "k": 0.7, "dy": 235}],
             "leave": ROOM_BY_ID["fukuoka"]["page"],
             "title": "The door onto Fukuoka",
             "hint": "It opens onto Moji Port: a hall of models at dusk -- the port's old buildings "
                     "on stands of their own, and the harbour on a table, with a drawbridge that "
                     "stands open for a ship."},
            # The street's own furniture, and the two poles the wires run from.
            {"id": "pole-west", "kind": "utility", "x": -330, "z": 180, "y": 0, "ry": 90,
             "title": "The pole the wires are strung from",
             "hint": "Every wire overhead starts or ends on one of the two poles: a cable has to "
                     "be anchored somewhere you can point at."},
            {"id": "pole-east", "kind": "utility", "x": 330, "z": 800, "y": 0, "ry": -90,
             "title": "The pole at the far crossing",
             "hint": "The second anchor. Between them the wires carry the street's two bulbs."},
            {"id": "bollard-s", "kind": "bollard", "x": -160, "z": 24, "y": 0, "ry": 0,
             "title": "A bollard at the mouth of the street",
             "hint": "Drawn rather than surveyed: it is here so the entrance has an edge."},
            {"id": "bench-s", "kind": "bench", "x": -300, "z": -250, "y": 0, "ry": 90,
             "title": "A bench under the dark half of the street",
             "hint": "The one seat on the street. It sits in the gap before the first door, where "
                     "a walker is allowed to stop — the far half's wall is shops now, and a bench "
                     "in front of a shopfront is a bench in the way."},
            {"id": "bin-s", "kind": "bin", "x": 322, "z": 540, "y": 0, "ry": -90,
             "title": "A bin by the middle door",
             "hint": "Lid shut, nothing implied about what is in it."},
            {"id": "planter-s1", "kind": "planter", "x": -300, "z": 880, "y": 0, "ry": 90,
             "title": "A planter of dark leaves",
             "hint": "Set dressing: the one green thing on the street, drawn as a silhouette."},
            {"id": "planter-s2", "kind": "planter", "x": 296, "z": 60, "y": 0, "ry": -90,
             "title": "A second planter, by the wall",
             "hint": "The street's edges need a rhythm more than they need symmetry."},
            {"id": "signA-s", "kind": "signA", "x": 300, "z": 90, "y": 150, "ry": -90,
             "title": "A folding board, blank",
             "hint": "Both faces blank: the lettering would be a shop's to write, and no shop here "
                     "is real."},
            {"id": "drain-s", "kind": "drain", "x": 60, "z": 620, "y": 0, "ry": 0,
             "title": "A drain in the asphalt",
             "hint": "The street's one piece of water kit, at the crossing point."},
            # The festival stalls (round 50, at the owner's request: an English phrase — 「做一些有趣的
            # 日本攤販遊戲在那環境裡面可以直接玩」). They are deliberately NOT surveyed geometry: a
            # stall that played games at a real address would be an invented fact, while a stall the
            # page names as a toy is honest furniture. Their whole body is the CSS of .walk-stall,
            # their lights join the authored lamp field so night lights them like everything else,
            # and `game` rides to the script as data-game — press it and the toy opens over the lane.
            # Round 79: sized from the reference the project already cites (SKILLS.md section 2:
            # "a yatai is ~3 m by 2.5 m by 2.5 m"). At 170 x 128 the card measured 47 x 117 px at
            # 10 m -- a mustard-and-navy rectangle the size of a door handle, which the owner's toy
            # had been standing behind for twenty-nine rounds. The record's `d` is the footprint a
            # plaza check needs, not the booth's depth: a card is a fascia, and the 2.5 m behind the
            # counter is not modelled (`.walk-stall` dresses the button).
            {"id": "stall-kingyo", "kind": "board", "w": 300, "h": 250, "d": 40,
             "x": 322, "z": 330, "y": 0, "ry": -90, "game": "kingyo",
             "title": "The goldfish stall, under the first lanterns",
             "hint": "A toy, not a survey: paper net, a basin of dark water, and goldfish that are "
                     "the street's own lamp colours. Press it to play; nothing here claims a shop "
                     "stood at this address."},
            {"id": "stall-menya", "kind": "board", "w": 300, "h": 250, "d": 40,
             "x": -322, "z": 700, "y": 0, "ry": 90, "game": "menya",
             "title": "The mask targets, along the lantern string",
             "hint": "A toy, not a survey: blank wooden masks on a beaded curtain, a pellet gun of "
                     "twelve shots. The masks carry no faces for the same reason the shopfronts "
                     "carry no lettering."},
            # `liton` is the phase at which a front's own light comes up, and on this street it is
            # authored per front rather than once for the row: eight fronts that all rise at the same
            # instant are a switch, and the same field already staggers Moji's skyline (`0.74`–`0.88`
            # there). The values below alternate down the walk — 0.72, 0.74, 0.80, 0.86, 0.78, 0.90 —
            # so the evening arrives as a wave rather than a click, and the two shut fronts are not
            # in step with the four open ones. What `liton` governs is the light and the light the
            # front throws on the pavement, because the emitter hands the prop's `liton` to its glow:
            # a window and its spill are one light seen twice. The night's own level is untouched —
            # measured at 65.0 luma and left there on purpose.
            {"id": "front-s", "kind": "front", "x": 346, "z": 700, "y": 0, "ry": -90,
             "awn": "#6a3226", "noren": "#2e4a7a", "liton": 0.72,
             "glow": [{"r": 120, "k": 0.38, "dy": 190}],
             "title": "A shut front with a light behind it",
             "hint": "Shutter down, light on in the transom: a building with nobody in it and a "
                     "timer on its lamp. It keeps the far stretch of street from being empty. "
                     "Done, the shutter rises — onto an interior the site does not furnish, so "
                     "all it gives up is more light.",
             "states": [
                 {"say": "Up. The transom lamp plus a room lamp: twice the light, none the wiser "
                         "about who left it on.", "k": 1.35, "shut": 0.9},
                 {"say": "Down again. The street keeps its shuttered half.", "k": 0.7,
                  "shut": 0},
             ]},
            {"id": "front-n", "kind": "front", "x": -346, "z": 620, "y": 0, "ry": 90,
             "awn": "#2e4a52", "liton": 0.90,
             "glow": [{"r": 120, "k": 0.3, "dy": 190}],
             "title": "Another shut front, across the crossing",
             "hint": "Same story from the other side of the street: shutter down, transom lit. "
                     "Two closed fronts facing is most of what a night street is. Done, this one "
                     "stays as it is — the pair should not match, or the street is a stage set.",
             "states": [
                 {"say": "It does not budge. Some shutters are just shut.", "k": 0.5, "shut": 0},
                 {"say": "Still shut. The lamp behind it stays on regardless.", "k": 0.5,
                  "shut": 0},
             ]},
            {"id": "ac-s", "kind": "ac", "x": -344, "z": 300, "y": 262, "ry": 90,
             "title": "An air conditioner over the first door",
             "hint": "High on the wall, dripping nothing: the street's one horizontal above head "
                     "height."},
            # The far half is the Japanese quarter, and these five props are what says so without a
            # word: the machine every Japanese street has at its corner, the folding board and the
            # bike against the shutters, a second bin, and the recycle crate. Their materials and
            # proportions are the ones the Tokyo and Moji records already committed to
            # (`skills/japan-place/references/japan-vocabulary.md`), so the three rooms cannot drift
            # apart about how wide a vending machine is.
            {"id": "vending-s", "kind": "vending", "x": 322, "z": 720, "y": 0, "ry": -90,
             # No `liton` on purpose: the hint below is the claim, and a machine that runs all day
             # is the one light on this street that does not wait for the evening. The tint is the
             # machine's own — a fluorescent shelf is not a sodium lamp — and the pavement in front
             # of it takes a cool splash rather than a warm one, which is how you can tell the two
             # kinds of light apart with your back to them.
             "glow": [{"r": 130, "k": 0.95, "dy": 150, "tint": "rgba(196,226,255,0.5)"}],
             "title": "The vending machine on the Japanese half",
             "hint": "It is the one light that runs all day on this street: a machine with a lit "
                     "shelf of cans is what tells you the far half is Japan, and it says it without "
                     "a single character. Nothing is claimed about what it sells."},
            {"id": "bikes-s", "kind": "bikes", "x": 320, "z": 660, "y": 0, "ry": -90,
             "title": "Bicycles left against the shutters",
             "hint": "Drawn. Two machines at a standstill are most of what a working street has to "
                     "say about the people who are not in it."},
            {"id": "signA-s2", "kind": "signA", "x": 318, "z": 620, "y": 150, "ry": -90,
             "title": "A second folding board, blank",
             "hint": "Both faces blank, like the first one: the lettering would belong to a shop, "
                     "and there is no shop here to own it."},
            # The shopping street: four more open fronts, two a side, in the gaps the doors and the
            # older pair leave. Same unit, different canvas and cloth — the variety on a shopping
            # street is the awnings and the clutter, never the frame. Shutters stand up (states[0])
            # so the quarter is open at whatever hour the page opens.
            {"id": "shop-r1", "kind": "front", "x": 346, "z": 320, "y": 0, "ry": -90,
             "w": 160, "awn": "#3f4d7a", "noren": "#6a2e2e", "liton": 0.74,
             "glow": [{"r": 110, "k": 0.55, "dy": 180}],
             "title": "An open shop under an indigo awning",
             "hint": "The first shop on the right: canvas out, noren in the recess head, and the "
                     "shutter standing up. Nothing on the fascia, because the lettering would be "
                     "a shop's to write.",
             "states": [{"say": "The shutter stays up. An open shop is the street's own light.",
                         "k": 0.8, "shut": 0.9}]},
            {"id": "shop-r2", "kind": "front", "x": 346, "z": 900, "y": 0, "ry": -90,
             "w": 240, "awn": "#7a4a26", "liton": 0.86,
             "glow": [{"r": 100, "k": 0.34, "dy": 180}],
             "title": "A wider shop near the water end",
             "hint": "A tan canvas over a wider recess. The last shop before the street gives "
                     "up to the quay.",
             "states": [{"say": "Open, like the rest of the quarter.", "k": 0.8, "shut": 0.9}]},
            {"id": "shop-l1", "kind": "front", "x": -346, "z": 400, "y": 0, "ry": 90,
             "w": 210, "awn": "#4a5a3a", "noren": "#2e4a7a", "liton": 0.80,
             "glow": [{"r": 120, "k": 0.46, "dy": 180}],
             "title": "An open shop under a moss awning",
             "hint": "The left side's first shop, across from the indigo one: two awnings "
                     "facing is what makes the stretch a shopping street rather than a wall with "
                     "a door in it.",
             "states": [{"say": "Open.", "k": 0.8, "shut": 0.9}]},
            {"id": "shop-l2", "kind": "front", "x": -346, "z": 950, "y": 0, "ry": 90,
             "w": 170, "awn": "#7a3434", "liton": 0.78,
             "glow": [{"r": 110, "k": 0.38, "dy": 180}],
             "title": "The last shop on the left",
             "hint": "A rust canvas at the water end of the left wall. Past it the wall runs "
                     "out and the rail begins.",
             "states": [{"say": "Open.", "k": 0.8, "shut": 0.9}]},
            {"id": "recycle-s", "kind": "recycle", "x": -318, "z": 560, "y": 0, "ry": 90,
             "title": "A recycling crate by the wall",
             "hint": "Lid down. The street's kit repeats the rooms' kit on purpose — one drawn "
                     "world, whichever quarter you are standing in."},
            {"id": "bin-s2", "kind": "bin", "x": -318, "z": 840, "y": 0, "ry": 90,
             "title": "A bin past the last door",
             "hint": "Where the far quarter runs out, so the walk to the open end has something "
                     "at its edge."},
        ],
        # The street's light comes from its daytime sky and sun as well as fixtures: these poles
        # and the doors' own glows are recorded here, while bulb:false marks the distant ambient
        # fill as open-air light rather than another fitting.
        "lamps": [
            {"x": 0, "y": 505, "z": 180, "r": 46, "k": 0.6},
            {"x": 0, "y": 502, "z": 470, "r": 44, "k": 0.58},
            {"x": 0, "y": 500, "z": 780, "r": 46, "k": 0.6},
            {"x": 0, "y": 503, "z": 980, "r": 44, "k": 0.58},
            # the two stalls' own lanterns (round 50): the wall lights the games stand under, low
            # enough that the awnings catch them — 0.55, between the row's 0.58s and the amber floor
            {"x": -250, "y": 430, "z": 340, "r": 90, "k": 0.55},
            {"x": -250, "y": 430, "z": 470, "r": 90, "k": 0.55},
            # A cool, soft point of ambient light in the opening: it gives the last stretch a
            # distant destination without pretending the street belongs to a named city. No bulb —
            # it is open-air fill, not another fitting on the street.
            {"x": 0, "y": 190, "z": 1016, "r": 135, "k": 0.5, "tint": "#9fb2d8", "bulb": False},
            # Lanterns on the two far wires, four to a wire and at slightly different heights: a
            # string of lanterns reads as a street because they are a row, not a pair, and the drop
            # varies the way a hand-tied one does. 22 cm across and 2.9-3.2 m up is a festival-size
            # paper lantern hanging over a 7 m lane; two big ones read as signs. This is the Japanese
            # half's own light: a lantern is a
            # body that hangs on a cable (the local rule is that nothing may be lit by a source the
            # data does not name, so each of these hangs from the wire at its own z — 470 and 780 —
            # and the wire above it is authored a few lines down). They are warm and they swing,
            # which is what makes the last stretch of the street a place rather than a corridor, and
            # they cost one light each: `size` and `h` are the lantern's own centimetres.
            # Each also carries `liton`, so the string lights along itself — 0.66 to 0.75 on the
            # near wire left to right, 0.71 to 0.80 on the far one — instead of snapping on as one
            # row. That is the same field the shopfronts carry, and it governs the lantern's halo,
            # its cone and the pool it puts on the asphalt, because all three are one light.
            {"x": -279, "y": 318, "z": 470, "r": 30, "k": 0.5, "body": "lantern",
             "size": 22, "h": 318, "swing": 1.6, "period": 5.2, "phase": 0.4, "liton": 0.66},
            {"x": -99, "y": 306, "z": 470, "r": 30, "k": 0.5, "body": "lantern",
             "size": 22, "h": 306, "swing": 1.7, "period": 4.6, "phase": 2.1, "liton": 0.69},
            {"x": 99, "y": 312, "z": 470, "r": 30, "k": 0.48, "body": "lantern",
             "size": 22, "h": 312, "swing": 1.5, "period": 4.9, "phase": 1.1, "liton": 0.72},
            {"x": 279, "y": 300, "z": 470, "r": 30, "k": 0.48, "body": "lantern",
             "size": 22, "h": 300, "swing": 1.6, "period": 5.4, "phase": 3.0, "liton": 0.75},
            # One lantern each, hung at the stall: `of` ties the light to the prop (the vending
            # machine's trick) so the pool belongs to the stand and the hour button finds them lit
            # or dark with the rest of the string.
            {"x": 300, "y": 300, "z": 330, "r": 34, "k": 0.55, "body": "lantern",
             "size": 18, "h": 300, "swing": 1.3, "period": 5.5, "phase": 2.4, "liton": 0.78,
             "of": "stall-kingyo"},
            {"x": -300, "y": 300, "z": 700, "r": 34, "k": 0.55, "body": "lantern",
             "size": 18, "h": 300, "swing": 1.4, "period": 4.8, "phase": 0.9, "liton": 0.81,
             "of": "stall-menya"},
            {"x": -279, "y": 316, "z": 780, "r": 30, "k": 0.5, "body": "lantern",
             "size": 22, "h": 316, "swing": 1.4, "period": 5.8, "phase": 1.2, "liton": 0.71},
            {"x": -99, "y": 302, "z": 780, "r": 30, "k": 0.5, "body": "lantern",
             "size": 22, "h": 302, "swing": 1.5, "period": 5.1, "phase": 2.6, "liton": 0.74},
            {"x": 99, "y": 310, "z": 780, "r": 30, "k": 0.48, "body": "lantern",
             "size": 22, "h": 310, "swing": 1.6, "period": 4.4, "phase": 0.7, "liton": 0.77},
            {"x": 279, "y": 298, "z": 780, "r": 30, "k": 0.48, "body": "lantern",
             "size": 22, "h": 298, "swing": 1.4, "period": 5.6, "phase": 3.9, "liton": 0.8},
        ],
        "wires": [
            {"a": [-350, 512, 180], "b": [350, 504, 180], "sag": 42},
            {"a": [-350, 512, 470], "b": [350, 504, 470], "sag": 40},
            {"a": [-350, 508, 780], "b": [350, 512, 780], "sag": 38},
            {"a": [-350, 510, 980], "b": [350, 506, 980], "sag": 38},
        ],
        "beams": [],
        "surfaces": [
            # Building fronts, band by band, both sides. The materials repeat the rooms' own kit so
            # the whole walk reads as one drawn world.
            {"side": -1, "z0": -1400, "z1": 240, "y0": 0, "y1": 140, "kind": "dado", "tone": 1.16},
            {"side": -1, "z0": -1400, "z1": 240, "y0": 140, "y1": 620, "kind": "plaster", "tone": 1.14},
            {"side": -1, "z0": 240, "z1": 700, "y0": 0, "y1": 300, "kind": "plaster", "tone": 1.24},
            {"side": -1, "z0": 240, "z1": 700, "y0": 300, "y1": 620, "kind": "brick", "tone": 1.22},
            {"side": -1, "z0": 700, "z1": 860, "y0": 0, "y1": 620, "kind": "brick", "tone": 1.3},
            {"side": -1, "z0": 860, "z1": 1040, "y0": 0, "y1": 140, "kind": "dado", "tone": 1.16},
            {"side": -1, "z0": 860, "z1": 1040, "y0": 140, "y1": 620, "kind": "plaster", "tone": 1.18},
            {"side": 1, "z0": -1400, "z1": 80, "y0": 0, "y1": 620, "kind": "brick", "tone": 1.12},
            {"side": 1, "z0": 80, "z1": 390, "y0": 0, "y1": 130, "kind": "dado", "tone": 1.18},
            {"side": 1, "z0": 80, "z1": 390, "y0": 130, "y1": 620, "kind": "plaster", "tone": 1.12},
            {"side": 1, "z0": 390, "z1": 550, "y0": 0, "y1": 300, "kind": "plaster", "tone": 1.28},
            {"side": 1, "z0": 390, "z1": 550, "y0": 300, "y1": 620, "kind": "plaster", "tone": 1.26},
            {"side": 1, "z0": 550, "z1": 900, "y0": 0, "y1": 620, "kind": "plaster", "tone": 1.2},
            {"side": 1, "z0": 900, "z1": 1040, "y0": 0, "y1": 620, "kind": "brick", "tone": 1.28},
        ],
        "marks": [
            {"kind": "tactile", "x0": -330, "x1": -306, "z0": -1400, "z1": 1040},
            {"kind": "tactile", "x0": 306, "x1": 330, "z0": -1400, "z1": 1040},
            {"kind": "gutter", "x0": -368, "x1": 368, "z0": -1400, "z1": 14},
            {"kind": "grate", "x0": -80, "x1": 80, "z0": 616, "z1": 624},
            {"kind": "manhole", "x0": -40, "x1": 40, "z0": 540, "z1": 580},
            {"kind": "kerb", "x0": -368, "x1": -306, "z0": -1400, "z1": 1040, "y1": 6},
            {"kind": "kerb", "x0": 306, "x1": 368, "z0": -1400, "z1": 1040, "y1": 6},
        ],
        # The far end is not a window but the way on: the opening runs nearly wall to wall and floor
        # to sky, and the clamp is authored past it (max_d above). Walking out of the street reaches
        # a sunlit quay, water, a low far shore, one ferry and working harbour equipment — the world
        # continues, but it does not pretend this anonymous street is Tokyo or any named city.
        "vista": {"x": 0, "y0": 6, "y1": 614, "w": 620},
        "backdrop": {
            # `glow` tunes each sample's daylight response. The renderer projects these authored
            # heights onto one continuous gradient at z=120000; the last sample reaches above the
            # portrait frustum as well as the landscape one, so neither view opens onto canvas void.
            "skyGradient": True,
            "sky": [
                # Closely spaced palette samples grade from a pale horizon to a deeper zenith; they
                # are not painted as hard-edged bands.
                {"y0": -400, "y1": 5000, "c": "#4a5a84", "glow": 1.0},
                {"y0": 5000, "y1": 10000, "c": "#46577f", "glow": 0.94},
                {"y0": 10000, "y1": 16000, "c": "#405178", "glow": 0.88},
                {"y0": 16000, "y1": 23000, "c": "#3a4b70", "glow": 0.82},
                {"y0": 23000, "y1": 31500, "c": "#344568", "glow": 0.76},
                {"y0": 31500, "y1": 42000, "c": "#2f3f60", "glow": 0.70},
                {"y0": 42000, "y1": 55000, "c": "#293959", "glow": 0.64},
                {"y0": 55000, "y1": 72000, "c": "#243451", "glow": 0.58},
                {"y0": 72000, "y1": 94000, "c": "#202f4b", "glow": 0.52},
                {"y0": 94000, "y1": 125000, "c": "#1d2b47", "glow": 0.46},
                {"y0": 125000, "y1": 170000, "c": "#1b2844", "glow": 0.40},
                {"y0": 170000, "y1": 230000, "c": "#192641", "glow": 0.36},
                {"y0": 230000, "y1": 320000, "c": "#17243e", "glow": 0.32},
            ],
            # The far shore of the strait: one long low hill, not a peak — a harbour street faces
            # water and the land past it, and the hill is low enough that the sky, which is the
            # point of the view, keeps most of the opening.
            "mountain": {"x": 300, "z": 13500, "base": -120, "top": 260, "half": 6200, "crown": 2400, "snow": 0.06, "c": "#3f5a66"},
            "plaza": {"y": -6, "z0": 3000, "z1": 4300, "half": 4200, "lit": 1.1},
            # Two low-rise, lit rooftops flank the opening — off the centre line, so they give the
            # quay approach a human scale without blocking the far shore or harbour view.
            "roofs": [
                {"x": -1350, "y": 0, "z": 2050, "w": 700, "h": 300, "tone": 1.0},
                {"x": 1350, "y": 0, "z": 2150, "w": 640, "h": 260, "tone": 1.05},
            ],
            # Past the rail: water to the far shore, a ferry at moor and the crane a working quay
            # keeps. The painter (`bd.harbor` in js/site.js) draws all of it; the record only places
            # it, the way every other backdrop here is placed.
            "harbor": {
                "y": -100, "z0": 4360, "z1": 12000, "half": 4200, "rail": 4300,
                # Walk-space numbers: six-metre mooring spacing, a four-tread slipway through
                # the rail, and a ladder down the quay face. The walk clamps before the first tread.
                "bollards": {"z": 4250, "x0": -2100, "x1": 2100, "spacing": 600},
                "slipway": {"x": 0, "z0": 4185, "z1": 4360, "width": 200,
                            "y0": -6, "y1": -100, "steps": 4},
                "ladder": {"x": -320, "z": 4357, "width": 56,
                           "y0": -100, "y1": -6, "rungs": 6},
                # A low, broken row beyond the ferry: the edge of the far water is a breakwater,
                # not another straight line where the hill happens to meet the sea.
                "breakwater": [
                    {"x": -1850, "z": 10150, "w": 340, "h": 116},
                    {"x": -1370, "z": 10020, "w": 420, "h": 148},
                    {"x": -820, "z": 10110, "w": 360, "h": 122},
                    {"x": -280, "z": 9950, "w": 460, "h": 156},
                    {"x": 330, "z": 10090, "w": 360, "h": 124},
                    {"x": 870, "z": 9900, "w": 440, "h": 151},
                    {"x": 1430, "z": 10070, "w": 380, "h": 130},
                    {"x": 1900, "z": 9950, "w": 340, "h": 118},
                ],
                # Three broken wind lanes travel along the harbour; six rings expand and fade from
                # authored points. The renderer parks them when reduced motion is requested.
                "motion": {
                    "lanes": [
                        {"x": -1250, "spread": 760, "length": 430, "spacing": 880,
                         "speed": 38, "offset": 260},
                        {"x": 0, "spread": 1120, "length": 560, "spacing": 1040,
                         "speed": -31, "offset": 1880},
                        {"x": 1260, "spread": 680, "length": 390, "spacing": 820,
                         "speed": 53, "offset": 3680},
                    ],
                    "ripples": [
                        {"x": -1650, "z": 4900, "period": 5.8, "phase": 0.2, "max": 260},
                        {"x": -1020, "z": 5780, "period": 6.4, "phase": 2.0, "max": 310},
                        {"x": -340, "z": 6900, "period": 5.5, "phase": 4.4, "max": 240},
                        {"x": 390, "z": 7900, "period": 6.2, "phase": 1.3, "max": 300},
                        {"x": 1080, "z": 9000, "period": 5.9, "phase": 3.5, "max": 280},
                        {"x": 1770, "z": 10300, "period": 6.6, "phase": 0.8, "max": 320},
                    ],
                },
                "ships": [{"x": 260, "z": 6800, "l": 900, "windows": 6}],
                "cranes": [{"x": -380, "z": 5200}],
            },
        },
        "slots_title": "Rooms on this street",
        "slots": [
            {"label": "Toronto", "note": "A dark hall of lit tables: the city, its falls and its "
                                         "markets, drawn small.",
             "state": "Open — the first door on the left."},
            {"label": "Tokyo", "note": "Nakamise-dori after closing: the shuttered rows, Kaminarimon "
                                       "behind, Hozomon lit at the far end.",
             "state": "Open — the middle door, on the right."},
            {"label": "Fukuoka", "note": "Moji Port in a model hall: the station and the customhouse "
                                         "on their own stands, the Blue Wing and the ships, at dusk.",
             "state": "Open — the last door on the left."},
        ],
        # The stations are the places the street is worth standing in, and the last four are the
        # Japanese half: the lantern pair over the middle, the machine and the bicycles against the
        # shutters, and the last door on the left. Six became eight because the far half is now a
        # quarter with furniture in it rather than a stretch of wall, and a place worth dressing is
        # worth a stop. The walk is the same length; nothing moved.
        "stations": [
            {"z": 0, "label": "the mouth of the street"},
            {"z": 160, "label": "by the Toronto door"},
            {"z": 300, "label": "the middle of the street, under the wires"},
            {"z": 470, "label": "by the Tokyo door, under the lanterns"},
            {"z": 620, "label": "the boards and the bicycles"},
            {"z": 780, "label": "by the Fukuoka door"},
            {"z": 880, "label": "the last shops before the water"},
            {"z": 1040, "label": "the end of the street"},
            {"z": 1240, "label": "out on the quay"},
            {"z": 1420, "label": "the rail at the water's edge"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The door at your back", "hint": "It opens onto the album, where the "
                 "same places are hung as pictures."},
        "caveat": "The street is the site's own ground, drawn: it names no city, carries no "
                  "lettering, and hangs no pictures. The three rooms stand along it, each one opens "
                  "from a door you can walk to, and the far end is no wall — the street walks out "
                  "onto a quay and ends at a rail, with water, a ferry and the far shore beyond. "
                  "Nothing here says the owner was anywhere.",
    },
    {
        # Tokyo is Nakamise-dori at night (round 32; the owner chose it from the places on his own
        # plates, and the sources, the measurement table and the inventory are in TODO section 0n).
        # The approach to Senso-ji from Kaminarimon to Hozomon: about 250 m of shops in two rows that
        # were rebuilt in 1925 in reinforced concrete and painted vermilion (Senso-ji's own guide),
        # 54 shops on the east side and 35 on the west (tokyo-trip.org; tour.ne.jp), granite paving
        # laid square, open to the sky. OpenStreetMap puts the rows 9.1 m apart face to face, each
        # about 4 m deep, the street running 4.7 degrees east of north, the Shin-Nakamise arcade
        # crossing 71 m in and Denboin-dori 181 m in, the plaza under Hozomon 28 m deep and the
        # pagoda 56 m west of the gate. The hour is after closing: the shops shut around 19:00, the
        # shutters come down on the Asakusa Emaki (1989), and the gates and the pagoda stay floodlit
        # until 23:00 -- the street empties, which is also why there is nobody in it.
        "id": "tokyo", "label": "Tokyo",
        "page": ROOM_BY_ID["tokyo"]["page"],
        "plates": ROOM_BY_ID["tokyo"]["plates"],
        # The box is the street: 9.1 m from shopfront to shopfront, the roofline at 4.8 m, nothing
        # overhead (`open`), and the far end open onto the plaza (`max_d`, walk units) the way the
        # hub street walks out onto its quay. 250 m of shops walk in 30 m; the order, the width,
        # every shop's width and both gates' sizes are kept, and it is the count that shrinks.
        "lane": {"w": 910, "d": 1040, "ceil": 500, "back": 300, "max_d": 4500, "open": True},
        "floor": "paving",
        # Held at its own night (round 69h). The lane offered the hour button and lit the street
        # with the sun -- the paving measured 73.8 -> 107.1 luma between the two hours -- while the
        # sky could not follow, because the day a lane may show is declared on the lane and this one
        # declared none: the same shut street under the same night sky at noon. Two ways to stop
        # that being a lie; this is the smaller one. The place's subject is "the shops are shut and
        # the gates are lit", its own text says so, and the site already has the idiom for a room
        # whose clock is a fact rather than an option (`data-lane-night`, no button): the sun is
        # not traded for a morning this street never shows. If a day is ever authored here it needs
        # the shutters up, the stalls out and the crowds, and none of that is in the record.
        "night": 0.92,
        "purpose": "Nakamise-dori at night: the approach from Kaminarimon to Hozomon, the shutters "
                   "down, the eave lanterns lit and the gates lit",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/tokyo-cover.jpg",
        "cover_caption": "Nakamise's shuttered vermilion rows, drawn from the lane toward Hozomon.",
        "blurb": "The approach to Senso-ji after the shops have shut. Every shutter is down and "
                 "painted, the eaves are lit, and Hozomon's lantern burns at the far end.",
        "clad_note": (" The lane is Nakamise-dori after closing: two shallow rows of vermilion "
                      "shopfronts nine metres apart, every shutter down and painted, a lit eave over a "
                      "raised walk, a square vermilion post at each bay, granite paving laid square, "
                      "and two cross streets breaking the rows. Nothing on any fascia carries a word. "
                      "What a working street still has out at this hour is drawn beside them, at the "
                      "sizes the object table gives: a lit white vending machine under the arcade's "
                      "mouth with delivery crates stacked next to it, a bin and two bicycles at the "
                      "other pier, a bench, a blank folding board, a ladder and two planters along the "
                      "shutters, and at Denboin-dori a postbox, a convex mirror on its bracket, a "
                      "downpipe on each side, an air-conditioning unit and an empty rack, with the last "
                      "shops ending at a red standpipe and a second bench."),
        "sight_note": (" At its far end the street opens onto the plaza under Hozomon, its great lantern "
                       "lit, with the five-storey pagoda over the west row; behind you is Kaminarimon "
                       "and its lantern."),
        "objects": NAKAMISE_BAYS + NAKAMISE_DRESSING,
        # Light: a strip light under every bay's eave, and the white globes that stand on the fascias
        # (the night photographs), at the ends of each run. Depths are record centimetres.
        "lamps": NAKAMISE_LAMPS,
        "beams": [],
        # Behind the bays the wall is the rows' own structure; where a street crosses, the wall is
        # that street's own band, dark because no shop light stands in it -- the Shin-Nakamise
        # arcade on both sides, then Denboin-dori.
        "surfaces": NAKAMISE_SURFACES,
        # The gutters along the edge of each raised walk; the paving itself is the floor tile.
        "marks": [
            {"kind": "grate", "x0": -306, "x1": -297, "z0": -103.45, "z1": 1040},
            {"kind": "grate", "x0": 297, "x1": 306, "z0": -103.45, "z1": 1040},
            # Round 56: the channel turns across the mouth of each side street instead of
            # running past it, and one cast manhole sits in the paving where the arcade crosses.
            # Both are paint under the props, at the record's depths like every other mark.
            {"kind": "grate", "x0": -455, "x1": 455, "z0": 189.66, "z1": 203.45},
            {"kind": "grate", "x0": -455, "x1": 455, "z0": 637.93, "z1": 651.72},
            {"kind": "manhole", "x0": -34, "x1": 34, "z0": 258.97, "z1": 282.41},
        ],
        "lanterns": [],
        "wires": [],
        "vista": {"x": 0, "y0": 2, "y1": 498, "w": 900},
        "backdrop": {
            # The sky above the street, authored as elevations rather than as far-plane heights:
            # TOKYO_SKY's own comment carries the measurement that moved it here. At night this
            # sky is a dim source and the street's strip lights are the light, so it is worth a
            # fifth of itself then; at day it is the light, and worth all of it.
            "skyAround": TOKYO_SKY,
            "skyEnv": {"day": 1, "night": 0.22},
            # The plaza under Hozomon continues the street's own paving: 28 m from the last shops to
            # the gate in life, 30 m here, kept nearly whole because the gate's size is the moment.
            # The precinct, not just the apron in front of the gate. Round 69i: this stopped at
            # z 7600, and the pagoda stands at 7900 -- so from the plaza the pagoda floated on the
            # sky, its stone base sitting on nothing, with the haze showing under the horizon behind
            # it. The courtyard now runs past the pagoda to its own far wall, 90 m from the gate.
            "plaza": {"y": 0, "z0": 3016, "z1": 9000, "half": 3400, "lit": 0.8},
            "temple": {"x": 0, "z": 6000, "gate": {"w": 2100, "h": 2270},
                       "pagoda": {"x": -5600, "z": 7900, "h": 5332}},
        },
        # The sub-places: the album's own plates, stood at the post line in front of the shops at eye
        # height, where the walk passes them and a visitor can reach them -- on the shutters behind
        # the posts they were always farther than the shop itself, and nearest-first reach could never
        # offer them. Each is a drawn plate, captioned as one, and none stands in a cross street.
        "frames": [
            {"id": "sensoji", "src": "IMG/tokyo-sensoji.jpg", "x": -295, "z": 103, "y": 96, "ry": 90,
             "title": "The gate at Asakusa",
             "alt": "Illustration of a temple gate at night with a great red paper lantern hanging "
                    "in its passage.",
             "caption": "The gate the street begins at, drawn: the lantern in its passage, the red "
                        "of the posts. It stands by the west row, a few steps from the real one."},
            {"id": "scramble", "src": "IMG/tokyo-scramble.jpg", "x": -295, "z": 495, "y": 96, "ry": 90,
             "title": "The scramble at Shibuya",
             "alt": "Illustration of a wide pedestrian scramble crossing at night, its stripes "
                    "running every way under tall lit buildings.",
             "caption": "Shibuya's crossing, drawn: another Tokyo, hung as a plate. It is not on "
                        "this street and the street does not pretend it is."},
            {"id": "tower", "src": "IMG/tokyo-tower.jpg", "x": -295, "z": 897, "y": 96, "ry": 90,
             "title": "The tower at dusk",
             "alt": "Illustration of a red and white lattice tower against a dusk sky over low "
                    "rooftops.",
             "caption": "The tower at dusk, drawn. It stands in Shiba, kilometres south of here, "
                        "and no window on this street looks at it."},
            {"id": "poster-lantern", "src": "IMG/tokyo-poster-lantern.jpg", "x": 295, "z": 145, "y": 96,
             "ry": -90,
             "title": "The paper lantern",
             "alt": "Illustration of a single round paper lantern glowing warm against the dark "
                    "grain of a closed shopfront.",
             "caption": "One lantern, close up, drawn. The street's own lanterns are the two great "
                        "ones in its gates."},
            {"id": "poster-wires", "src": "IMG/tokyo-poster-wires.jpg", "x": 295, "z": 862, "y": 104,
             "ry": -90,
             "title": "The wires over the lane",
             "alt": "Illustration of a tangle of overhead wires crossing a dark sky, cut into "
                    "short segments by the rooftops.",
             "caption": "Tokyo's overhead wires, drawn. Nakamise itself is strung with none; the "
                        "plate hangs here as a picture of the city around it."},
            {"id": "poster-ticket", "src": "IMG/tokyo-poster-ticket.jpg", "x": 295, "z": 985, "y": 108,
             "ry": -90,
             "title": "The ticket machine",
             "alt": "Illustration of a small ticket machine glowing on a sidewalk at night, its "
                    "buttons drawn as blank studs.",
             "caption": "A ticket machine, drawn: the cold light of a station a few minutes' walk "
                        "away, hung here as a plate rather than stood in the street."},
        ],
        "slots_title": "Places on the street",
        "slots": [
            {"label": "The lane in one sheet", "note": "The album's cover plate for this room. In "
                                                       "the street it is Kaminarimon's end itself: "
                                                       "stand at the first chip and the whole "
                                                       "approach is the sheet.",
             "state": "Held by the street itself, until a photograph of the approach takes the slot."},
            {"label": "The gate at Asakusa", "note": "By the west row's first posts, with "
                                                     "Kaminarimon itself at your back.",
             "state": "Held by a drawn frame; a photograph of the real gate takes the slot when one "
                      "arrives."},
            {"label": "The scramble at Shibuya", "note": "By the west row past the Shin-Nakamise "
                                                         "arcade.",
             "state": "Held by a drawn frame; a photograph of the crossing takes the slot when one "
                      "arrives."},
            {"label": "The tower at dusk", "note": "By the west row's last posts, before the "
                                                   "plaza.",
             "state": "Held by a drawn frame; a photograph of the tower takes the slot when one "
                      "arrives."},
            {"label": "The paper lantern", "note": "By the east row's first posts, across from "
                                                   "the gate picture.",
             "state": "Held by a drawn poster frame; a photograph of the lantern takes the slot "
                      "when one arrives."},
            {"label": "The wires over the lane", "note": "By the east row past Denboin-dori, "
                                                          "across from the tower picture.",
             "state": "Held by a drawn poster frame; a photograph of the wires takes the slot when "
                      "one arrives."},
            {"label": "The ticket machine", "note": "By the east row's last posts, before the "
                                                    "plaza.",
             "state": "Held by a drawn poster frame; a photograph of the machine takes the slot "
                      "when one arrives."},
            {"label": "Clips and the lane at 22:40", "note": "Vertical clips and one sound, when "
                                                             "material exists.",
             "state": "Empty by design. A clip needs its caption before it can play here, and the "
                      "sound only if a visitor asks for it."},
        ],
        "stations": [
            # 1.2 m in from the first shops and 3.8 m from the gate, so turning round frames Kaminarimon
            # -- its pillars and its lantern -- instead of a wall of passage at arm's length.
            {"z": 40, "label": "inside Kaminarimon, its lantern at your back"},
            {"z": 255, "label": "where the Shin-Nakamise arcade crosses"},
            {"z": 480, "label": "between the shuttered rows"},
            {"z": 724, "label": "where Denboin-dori crosses"},
            {"z": 1000, "label": "the last shops before the plaza"},
            # Round 69i: the final stop stood 17 m from a 22.7 m gate. A 45-degree lens holds 2*17*
            # tan(22.5) = 14.1 m at that distance, so 22.7 m could not fit whatever the heading --
            # the frame was the gate's lower storey over forty per cent empty paving, and the pagoda
            # sits at a bearing of -57 deg where no 45-degree frame reaches it. The stop now stands
            # the record's own 28 m out (the plaza runs z0 = 3016 to the gate at 6000) and looks up
            # 16 deg: the gate's ridge is at atan((2270-168)/2800) = 36.9 deg, inside the 38.5 deg
            # top edge, with paving still under it. `pitch` is POSITIVE DOWN in this codebase
            # (scene3d lookAt subtracts sin(pitch) from the eye height), so looking up is negative.
            # The stop's view is authored data (`data-view-pitch`, applied by site.js); no field of
            # view was widened and no geometry was moved to suit the camera.
            {"z": 1103, "label": "the plaza before Hozomon, the gate at its full height", "pitch": -16},
        ],
        # Kaminarimon at your back: the gate the street is entered through and left by. The wiring
        # block decides the href; the street outside is the hub.
        "exit": {"id": "gate-kaminari", "kind": "gate", "x": 0, "z": -90, "y": 0, "ry": 0,
                 "w": 910, "h": 700, "d": 60,
                 "title": "Kaminarimon, at your back",
                 "hint": "The outer gate of Senso-ji, 11.7 m tall. Its lantern -- 3.9 m tall, red "
                         "with black bands over a metal base -- hangs in the passage, and here it "
                         "carries none of its characters. Walk through it to the street."},
        "caveat": "Nakamise-dori as it stands after closing, built from public sources -- Senso-ji's "
                  "own guide, OpenStreetMap's footprints and the street's published measurements -- "
                  "with night photographs read for light and material. The 250 m of shops walk in "
                  "30 m: the street's order, its width, each shop's width and both gates' sizes are "
                  "kept, and the count of shops is what shrinks. The shutters keep only the ground "
                  "colours of the Asakusa Emaki, whose scenes show people; no fascia, lantern or sign "
                  "carries lettering. The plates on the shutters are drawn. Nothing here says the "
                  "owner was in this place. The stalls are in the wall too: a goldfish basin and a "
                  "mask line, added because the owner asked for games to play in the street — the "
                  "markup and the note cards both say they are toys, and neither stands at a real "
                  "address. The street's furniture — the machine, the crates, the postbox, the mirror, "
                  "the benches and the rest — is dressing drawn at the sizes the object table "
                  "commits: it says what a Tokyo shopping street is made of, and nothing about a "
                  "particular shop, a maker or a price.",
    },
    {
        # Moji Port in a model hall (round 32: laid out from the map; round 36: the models taken
        # apart -- sources in TODO sections 0n and 0r). The owner's brief stands -- the station, the
        # customhouse, the Blue Wing and the ships on the Kanmon Strait, models, dusk into night, one
        # yatai. Round 32 stood every model where OpenStreetMap puts it on one table at 1.5 cm to the
        # metre; at that scale each building was a block a few centimetres high, and the owner asked
        # for them apart ("門司港那邊模型要拆開", "要分開模型 感覺看不出漂亮"). So the four historic
        # buildings stand down the hall on their own stands at 1:25, joined by the tower at that scale
        # on a lower base; the table at the end keeps the port's layout at 1.5 cm to the metre: the
        # basin, the Blue Wing across its mouth, all five buildings' footprints, and the
        # strait beyond the far wall with the Shimonoseki shore far left and the Kanmon Bridge far right
        # (NAVITIME: from the bridge, "the Kanmon Bridge on the right"). `moji_xy` turns each OSM
        # coordinate into the table's frame.
        "id": "fukuoka", "label": "Fukuoka",
        "page": ROOM_BY_ID["fukuoka"]["page"],
        "plates": ROOM_BY_ID["fukuoka"]["plates"],
        # A model hall, as the brief asked ("a table, like Toronto's, like Little Canada"): dark walls,
        # the table lit, and the far wall open onto the strait at the table's own scale.
        # Round 57: the hall was 8.8 m wide "so a walker can still go round the true-scale table by
        # the right-hand aisle". The table is 7.4 m wide, so that aisle was 440 - 370 - 24 = 46 cm of
        # free centre — 22 cm of clearance for a 48 cm body. Measured with the walker: the room stops
        # dead at the table's near face (z 2206), and the only way on is to scrape a 22 cm sliver
        # along the wall. The aisle the record's own station list describes ("the right aisle, beside
        # the table's flank", x 405) needed the hall it was written for, so the hall is 11.8 m and the
        # three wall frames moved out to the new walls with it.
        # Round 51: the hall had stopped a stride past its last stand, with the strait and the
        # Blue Wing hanging at the far wall unvisit-able. The lane runs on to the table's quay —
        # 100 m of Moji waterfront in a hall that is 110 deep — so the walk arrives at the water
        # the drawings put there, and the drawbridge's door can open onto the walk itself.
        "lane": {"w": 1180, "d": 1100, "ceil": 620, "back": 300},
        "purpose": "Moji Port in a model hall: the station, the customhouse, their neighbours and the "
                   "Retro High Mart on stands of their own, with the port laid out from the map and "
                   "the Blue Wing and ships on the Kanmon Strait beyond, from dusk into night",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/fukuoka-cover.jpg",
        "cover_caption": "Mojiko Retro High Mart in its hall model after dark: the gray 1:25 tower "
                        "on its low stand, with the port table and Kanmon Strait beyond, drawn by the "
                        "renderer.",
        "blurb": "A hall of models: the station, the old customhouse, the Osaka Shosen building, the "
                 "Dalian hall and the Retro High Mart tower on stands of their own, then the port itself, "
                 "where the Blue Wing makes its last opening at four and the strait keeps moving. After "
                 "dusk the buildings come alight one after another.",
        "clad_note": (" The room is a model hall: plain walls and lit stands. Down the left, Moji Port "
                      "Station -- a long cream front with copper-and-slate pavilions and a clock -- and "
                      "the orange brick Osaka Shosen building with its octagonal tower; down the right, "
                      "the red brick customhouse with its three arched doors and the striped Dalian "
                      "hall with its tall dark spire; at the far end, the gray Retro High Mart with its "
                      "small-window grid, open crown frame and curved rooftop cap. CVU/CTBUH lists a "
                      "rooftop helipad in its total height. The historic models are at 1:25; the tower "
                      "keeps that scale on a lower stand. The table lays the port "
                      "out from the map: the basin with the Blue Wing across its mouth, and all five "
                      "building footprints. Nothing on any of it carries a word. The hall itself "
                      "is dressed the way such a hall is used: two planters and a blank folding board "
                      "at the door, a bin and a coat rack beside it, a bench under the pictures on each "
                      "wall, the crates the models were unpacked from and the ladder for the lamps by "
                      "the High Mart's stand, and two cones where the floor by the station had just "
                      "been done."),
        "sight_note": (" Past the table the far wall opens onto the Kanmon Strait at the same scale: "
                       "ships crossing, the Shimonoseki shore with the Kaikyo Yume Tower to the left, "
                       "and the Kanmon Bridge to the right."),
        "objects": [
            {"id": "plinth-moji", "kind": "plinth", "x": 0, "z": round(2418 / Z_SCALE, 2), "y": 0, "ry": 0,
             "w": 740, "h": 80, "d": 376, "top": "#8d8a82",
             "glow": [{"r": 170, "k": 0.42, "dy": 96, "tint": "rgba(255,214,170,0.36)"}],
             "title": "The table the port stands on",
             "hint": "A lit table at 1.5 cm to the metre, laid out from the map: the basin, the Blue "
                     "Wing, the five buildings' outlines, and the strait beyond the far wall at the "
                     "same scale."},
            *[_moji_massing(n, b, t) for n, b, t in zip(
                ("station", "osakashosen", "customhouse", "dalianhall", "retrohighmart"), MOJI_BLOCKS,
                ("Where the station stands", "Where the Osaka Shosen building stands",
                 "Where the customhouse stands", "Where the Dalian hall stands",
                 "Where the Retro High Mart stands"))],
            # The No. 1 basin between the hotel quay and the customhouse, from its head to the Blue
            # Wing; and the strait, which the table's far edge hands to the backdrop.
            {"id": "pool-moji", "kind": "pool", "x": 115, "z": round(2378 / Z_SCALE, 2), "y": 80, "ry": 0,
             "w": 93, "h": 2, "d": 276, "demo": "ripple",
             "title": "The No. 1 basin",
             "hint": "The boat basin the Blue Wing crosses, about 60 m wide, opening north-west onto "
                     "the strait. Nothing is claimed about the tide. Press the water and a toy stone "
                     "skips a ring across the model — the strait's water is the same invitation."},
            {"id": "pool-strait", "kind": "pool", "x": 0, "z": round(2560 / Z_SCALE, 2), "y": 80, "ry": 0,
             "w": 720, "h": 2, "d": 90, "demo": "ripple",
             "title": "The Kanmon Strait",
             "hint": "A little over 700 m wide at its narrowest and carrying some 500 ships a day; "
                     "here it starts at the table's edge and runs on past the far wall."},
            {"id": "drawbridge-mj", "kind": "drawbridge", "x": 120, "z": round(2498 / Z_SCALE, 2), "y": 80,
             "ry": 0, "w": 157, "h": 6, "d": 7, "leaves": 0.47, "demo": "open",
             "glow": [{"r": 90, "k": 0.3, "dy": 14}],
             "title": "The Blue Wing",
             "hint": "Blue Wing Moji: 108.1 m of pedestrian drawbridge across the basin's mouth, "
                     "completed 1993. Its 24.1 m south leaf is lifted by a wire rope over its pylon, "
                     "its 14 m north leaf by a hydraulic ram, both to about 60 degrees, six times a "
                     "day from 10:00 to 16:00, about twenty minutes each time. Lit after dark; it "
                     "does not open then. Press the model and it plays the opening back as a "
                     "demonstration — a pressed model demonstrating itself, the way the hall's "
                     "buttons do; the real bridge keeps its own timetable through all of it."},
            {"id": "ship-mj", "kind": "ship", "x": 114, "z": round(2500 / Z_SCALE, 2), "y": 81, "ry": 90,
             "w": 30, "h": 6, "d": 7.5, "run": 140,
             "title": "A harbour boat",
             "hint": "A boat of the basin's own size, using the openings: out under the raised "
                     "leaves on one, back in on the next. The big ships keep to the strait."},
            # Round 51: the bridge gets a door of its own to show its opening — the walk ends at a
            # service door on the quay and pressing it plays the whole lift, leaves up and down on
            # the timetable's own 20-minute crossing, narrated (site.js's demo protocol; the model
            # keeps the table's motion, not a real-traffic claim). The stand's two lamps follow it
            # down to the quay, and the High Mart's base gets the twin blocks a model's plinth is.
            {"id": "slot-wing", "kind": "board", "x": -340, "z": round(2870 / Z_SCALE, 2),
             "y": 0, "ry": 90, "w": 170, "h": 156, "d": 240, "top": "#5a6572", "leaf": "#4a4238",
             "title": "The basin's edge",
             "hint": "The quay the table's strait keeps along the water: the Blue Wing's pylons stand "
                     "on it, and the ripple the demo leaves runs out from here."},
            {"id": "slot-wing-post", "kind": "board", "x": -340, "z": round(2950 / Z_SCALE, 2),
             "y": 0, "ry": 90, "w": 20, "h": 352, "d": 60, "top": "#4c6d7e", "leaf": "#3c4a58",
             "title": "The south pylon",
             "hint": "The pylon the lift wire runs over: 35.2 m of painted steel at the bridge's "
                     "south end, kept at the table's scale here on the quay's edge."},
            {"id": "mart-base", "kind": "board", "x": 330, "z": round(3030 / Z_SCALE, 2),
             "y": 0, "ry": 0, "w": 200, "h": 360, "d": 420, "top": "#7f7a72", "leaf": "#6a655e",
             "title": "The High Mart's base",
             "hint": "The podium the tower stands on — retail floors, a lobby, the grey plinth every "
                     "Kurokawa photograph crops out at the bottom."},
            {"id": "mart-crown", "kind": "board", "x": 330, "z": round(3040 / Z_SCALE, 2),
             "y": 360, "ry": 0, "w": 200, "h": 120, "d": 300,
             "top": "#8b857c", "leaf": "#746f68",
             "title": "The open crown",
             "hint": "The tower's steel crown frame and curved cap at the top of the 1:25 model — "
                     "the part the observation deck photographs show from below."},
            # Round 36/39: the owner asked for the models to come apart ("門司港那邊模型要拆開") --
            # on the one table every building was a block a few centimetres high. The four historic
            # buildings have stands of their own down the hall at 1:25; the Retro High Mart joins them
            # at that scale on a lower base to fit the ceiling. The historic models remain south-west
            # of the basin on the left (station, then Osaka Shosen nearer the water), north-east on the
            # right (customhouse at the basin's mouth, Dalian hall beside it). Each turns to show its
            # front to the walk. Outlines from OpenStreetMap; floor areas/storeys from Wikipedia and
            # the Agency for Cultural Affairs; the rest read from sourced photographs (TODO §§0r/0u).
            # The port table keeps the basin, Blue Wing, five footprints and strait at 1.5 cm/m.
            {"id": "plinth-station", "kind": "plinth", "x": -305, "z": round(830 / Z_SCALE, 2), "y": 0, "ry": 0,
             "w": 245, "h": 100, "d": 225, "top": "#8d8a82",
             "glow": [{"r": 160, "k": 0.36, "dy": 116, "tint": "rgba(255,214,170,0.34)"}],
             "title": "The station's stand",
             "hint": "Moji Port Station at 1:25, on a lit stand of its own. The other four port models "
                     "stand down this hall at the same scale, so their sizes compare as they do on the "
                     "quay."},
            {"id": "stationfront-mj", "kind": "stationfront", "x": -305, "z": round(830 / Z_SCALE, 2),
             "y": 100, "ry": 40, "liton": 0.76, "w": 240, "h": 72, "d": 62.4,
             "title": "Moji Port Station",
             "hint": "Opened in 1914 and still the station it was: timber rendered to look like stone, "
                     "neo-Renaissance and dead symmetric, its two-storey centre made to read as the "
                     "character \\u9580 -- a gate, the first half of the port's own name -- with a single "
                     "storey either side. The gate's posts are the corner pavilions, with copper friezes "
                     "and slate caps; the clock sits over the pediment. In 1988 the first station building "
                     "in Japan named an Important Cultural Property; restored 2012 to 2019, when the front "
                     "canopy it never had was taken off. At 1:25, about 60 m long; the parts' sizes are "
                     "read from photographs and approximate."},
            {"id": "plinth-customhouse", "kind": "plinth", "x": 339, "z": round(1180 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 178, "h": 100, "d": 172, "top": "#8d8a82",
             "glow": [{"r": 140, "k": 0.36, "dy": 116, "tint": "rgba(255,214,170,0.34)"}],
             "title": "The customhouse's stand",
             "hint": "The former Moji Customs house at 1:25, on a lit stand of its own."},
            {"id": "customhouse-mj", "kind": "customhouse", "x": 339, "z": round(1180 / Z_SCALE, 2), "y": 100,
             "ry": -40, "liton": 0.80, "w": 135.2, "h": 56.4, "d": 86,
             "title": "The former Moji Customhouse",
             "hint": "Built in 1912 after the first customs house burned, red brick in the Renaissance "
                     "manner; restored by the city and reopened in 1994. Two storeys -- the observation "
                     "room is upstairs, behind ordinary windows -- three arched doors between corner "
                     "pavilions, white stone courses, a hipped slate roof. It stands at the basin's "
                     "mouth, at the north end of the Blue Wing. At 1:25, 33.8 m long as the map draws it; "
                     "its heights are approximate."},
            {"id": "plinth-osakashosen", "kind": "plinth", "x": -340, "z": round(1480 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 176, "h": 100, "d": 172, "top": "#8d8a82",
             "glow": [{"r": 140, "k": 0.36, "dy": 116, "tint": "rgba(255,214,170,0.34)"}],
             "title": "The Osaka Shosen building's stand",
             "hint": "The former Osaka Shosen building at 1:25, on a lit stand of its own."},
            {"id": "osakashosen-mj", "kind": "osakashosen", "x": -340, "z": round(1480 / Z_SCALE, 2),
             "y": 100, "ry": 40, "liton": 0.84, "w": 128.4, "h": 87.6, "d": 89.6,
             "title": "The former Osaka Shosen building",
             "hint": "The shipping line's Moji branch, 1917: two storeys of orange facing brick banded "
                     "with grey stone, and on its cut corner a window under a great arch with an "
                     "octagonal tower over it -- a balcony, a lantern of windows, a green dome. When it was "
                     "built its north side met the sea and passengers boarded from its own pier. It "
                     "stands between the station and the basin. At 1:25, 32.1 m long as the map draws "
                     "it; its heights are approximate."},
            {"id": "plinth-dalianhall", "kind": "plinth", "x": 344, "z": round(1780 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 168, "h": 100, "d": 164, "top": "#8d8a82",
             "glow": [{"r": 140, "k": 0.36, "dy": 116, "tint": "rgba(255,214,170,0.34)"}],
             "title": "The Dalian hall's stand",
             "hint": "The Dalian Friendship Memorial Hall at 1:25, on a lit stand of its own."},
            {"id": "dalianhall-mj", "kind": "dalianhall", "x": 344, "z": round(1780 / Z_SCALE, 2), "y": 100,
             "ry": -40, "liton": 0.88, "w": 123.6, "h": 98, "d": 81.4,
             "title": "The Dalian Friendship Memorial Hall",
             "hint": "Built in 1995, for fifteen years of Kitakyushu's friendship with Dalian, as a copy "
                     "of the steamship office the Russian Empire put up there in 1902: red brick striped "
                     "with white stone, a half-timbered gable, and a polygonal tower under a tall dark "
                     "spire. It stands beside the old customhouse on the basin's north side. At 1:25, "
                     "30.9 m long as the map draws it; its heights are approximate."},
            # A separate 1:25 tower model. Its mapped six-node footprint is reused from the table
            # plate; height 127 m is CTBUH's total including the helipad, while 103 m is the public
            # observation viewpoint in City/MLIT material. The low display stand is intentional: the
            # full-scale model would otherwise leave only 12 cm below this 6.2 m hall's ceiling.
            # Its stand position and 21-degree turn are exhibit framing, not a surveyed building site
            # or compass bearing; the table's low footprint plate retains the mapped orientation.
            {"id": "plinth-retrohighmart", "kind": "plinth", "x": -300, "z": round(2050 / Z_SCALE, 2),
             "y": 0, "ry": 0, "w": 190, "h": 30, "d": 190, "top": "#8d8a82",
             "glow": [{"r": 170, "k": 0.42, "dy": 38, "tint": "rgba(255,214,170,0.36)"}],
             "title": "The Retro High-Mart tower's low stand",
             "hint": "A 30 cm presentation stand, lower than the other models so the full-height 1:25 "
                     "tower model has 82 cm of headroom below the hall ceiling."},
            {"id": "retrohighmart-mj", "kind": "retrohighmart", "x": -300, "z": round(2050 / Z_SCALE, 2),
             "y": 30, "ry": 21, "liton": 0.82,
             "w": round(MOJI_TOWER_WIDTH_M * MOJI_TOWER_SCALE, 1),
             "h": round(MOJI_TOWER_HEIGHT_M * MOJI_TOWER_SCALE),
             "d": round(MOJI_TOWER_DEPTH_M * MOJI_TOWER_SCALE, 1),
             "footprint": MOJI_TOWER_FOOTPRINT, "floors": MOJI_TOWER_FLOORS,
             "observation": MOJI_TOWER_OBSERVATION_M,
             "title": "Mojiko Retro High Mart",
             "hint": "Kisho Kurokawa's tower, completed in 1999. The six-node OpenStreetMap outline is "
                     f"about {MOJI_TOWER_WIDTH_M:.2f} × {MOJI_TOWER_DEPTH_M:.2f} m in this table frame "
                     f"({MOJI_TOWER_WIDTH_M * MOJI_TOWER_DEPTH_M:.0f} m² bounding box; mapped polygon "
                     "area about 647 m²). Its 127 m total height, including the rooftop helipad, is "
                     "listed by CVU/CTBUH; the City and MLIT place the public observation view at "
                     "103 m, not at the building top. The City floor-area figures (755.45 m² exclusive "
                     "area; 498.38 m² observation room) are not footprint measurements. The gray "
                     "window grid, dark X-braced façade band, open crown frame and curved cap follow a sourced "
                     "photograph; floor spacing and roof details remain approximate. At 1:25, the tower "
                     "itself is 508 cm tall; on its 30 cm stand it reaches 538 cm beneath the 620 cm "
                     "ceiling. Its night window lights are representative, not surveyed."},
            {"id": "front-mj", "kind": "front", "x": 40, "z": round(2252 / Z_SCALE, 2), "y": 80, "ry": 0,
             "liton": 0.74, "w": 5, "h": 4, "d": 4,
             "glow": [{"r": 36, "k": 0.5, "dy": 4, "tint": "rgba(255,180,110,0.5)"}],
             "title": "One yatai, on the quay",
             "hint": "Kept because the owner asked for one, at the table's scale: about three metres "
                     "of stall. Nothing is claimed about what it sells."},
            # Round 56: the hall's own furniture. A model hall is a room people walk through, and
            # every surface here had a stand on it and nothing else -- so the entrance, the walls
            # between the stands and the corners by the High Mart get what such a hall actually
            # has: two planters and a blank A-frame at the door, a bin and a coat rack beside it,
            # a bench under the two pictures big enough to sit at, the crates the models were
            # unpacked from, a ladder for the lamps, and a pair of wet-floor cones at the station's
            # stand. Every size is the object table's (japan-vocabulary §1: the ⚑ figures the site
            # has committed), and nothing carries a word. Scene centimetres, divided into record
            # depth like every other object in this record.
            {"id": "planter-moji-w", "kind": "planter", "x": -404, "z": round(300 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 104, "h": 50, "d": 46,
             "title": "A planter inside the door",
             "hint": "A 104 x 50 x 46 tub just inside the hall's door, west side: one of the first "
                     "things a visitor passes, and the only living shape in a room of models."},
            {"id": "planter-moji-e", "kind": "planter", "x": 404, "z": round(300 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 104, "h": 50, "d": 46,
             "title": "The other planter",
             "hint": "Its pair on the east side of the door, at the same size, so the entrance "
                     "reads as an entrance and not as one more wall."},
            {"id": "signa-moji", "kind": "signA", "x": -250, "z": round(420 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 70, "h": 86, "d": 52,
             "title": "A folding board by the door",
             "hint": "An A-frame a model hall always has somewhere near its entrance, 70 x 86 x 52 "
                     "and blank on both faces. What such a board says in life -- an exhibition, a "
                     "closing time -- is not something this site can put on it."},
            {"id": "bin-moji", "kind": "bin", "x": 398, "z": round(520 / Z_SCALE, 2), "y": 0,
             "ry": -90, "w": 68, "h": 86, "d": 68,
             "title": "The hall's bin",
             "hint": "A 68 cm bin beside the door, screwed down the way a hall's is. Empty, and "
                     "with no notice above it: the words a real one carries are not here to read."},
            {"id": "rack-moji", "kind": "rack", "x": 394, "z": round(640 / Z_SCALE, 2), "y": 0,
             "ry": -90, "w": 140, "h": 76, "d": 90,
             "title": "A coat rack by the entrance",
             "hint": "What a hall with two doors and a cold harbour outside keeps by them: 140 "
                     "wide, 76 high, 90 deep, and empty because the visitors are not drawn."},
            {"id": "bench-moji-w", "kind": "bench", "x": -400, "z": round(1150 / Z_SCALE, 2), "y": 0,
             "ry": 90, "w": 150, "h": 84, "d": 48,
             "title": "A bench between the stands",
             "hint": "A bench on the west wall between the station's stand and the Osaka Shosen "
                     "building's, 150 x 84 x 48: a seat facing the models on the other side of the "
                     "hall. The two benches are placed for that and for nothing else."},
            {"id": "bench-moji-e", "kind": "bench", "x": 400, "z": round(1600 / Z_SCALE, 2), "y": 0,
             "ry": -90, "w": 150, "h": 84, "d": 48,
             "title": "A bench opposite the tower picture",
             "hint": "Its pair on the east wall, between the Dalian hall's stand and the bridge "
                     "picture: the same 150 x 84 x 48, so the two walls hold the room the same way."},
            {"id": "crate-moji-1", "kind": "crate", "x": -410, "z": round(2240 / Z_SCALE, 2), "y": 0,
             "ry": 90, "w": 62, "h": 46, "d": 52,
             "title": "A crate the models came in",
             "hint": "A packing crate by the High Mart's low stand: 62 x 46 x 52, slatted, "
                     "squared against the wall. A hall that receives models has boxes, and this "
                     "is where one would stand."},
            {"id": "crate-moji-2", "kind": "crate", "x": -410, "z": round(2240 / Z_SCALE, 2), "y": 46,
             "ry": 90, "w": 62, "h": 46, "d": 52,
             "title": "The crate stacked on it",
             "hint": "The second of the pair, resting square on the first. Two is a stack; three "
                     "is furniture, and this room already has furniture."},
            {"id": "crate-moji-3", "kind": "crate", "x": -410, "z": round(2320 / Z_SCALE, 2), "y": 0,
             "ry": 90, "w": 62, "h": 46, "d": 52,
             "title": "A third crate, open",
             "hint": "Set down beside the stack at the same size, its lid left off. Nothing in "
                     "it, and nothing written on it."},
            {"id": "ladder-moji", "kind": "ladder", "x": -410, "z": round(2400 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 36, "h": 268, "d": 48,
             "title": "The ladder for the lamps",
             "hint": "A hall whose light comes from 5.6 m up has a ladder: 36 wide, 268 tall, "
                     "48 deep at the feet, leaning on the wall rather than standing free."},
            {"id": "cones-moji", "kind": "cones", "x": -240, "z": round(1010 / Z_SCALE, 2), "y": 0,
             "ry": 0, "w": 74, "h": 70, "d": 34,
             "title": "Two cones at the station's stand",
             "hint": "A pair of cones and the bar through them, 74 x 70 x 34: where the floor by "
                     "the station's stand had just been done. Dressing, not a queue -- nobody is "
                     "standing behind them."},
        ],
        # The hall's light: a warm spot over each stand and over the table, and a dim one over the walk.
        "lamps": [
            {"x": 0, "y": 560, "z": round(2418 / Z_SCALE, 2), "r": 520, "k": 0.5, "bulb": False,
             "tint": "rgba(255,226,186,0.20)", "of": "plinth-moji"},
            {"x": 0, "y": 560, "z": 160, "r": 300, "k": 0.22,
             "tint": "rgba(206,218,240,0.16)"},
        ] + [{"x": x, "y": 430, "z": round(z / Z_SCALE, 2), "r": 230, "k": 0.34, "bulb": False,
              "tint": "rgba(255,226,186,0.18)", "of": of}
             for x, z, of in ((-290, 830, "plinth-station"), (325, 1180, "plinth-customhouse"),
                              (-325, 1480, "plinth-osakashosen"), (330, 1780, "plinth-dalianhall"))] + [
            {"x": -300, "y": 590, "z": round(2050 / Z_SCALE, 2), "r": 350, "k": 0.34, "bulb": False,
             "tint": "rgba(255,226,186,0.18)", "of": "plinth-retrohighmart"},
            # the quay the walk now ends at keeps two of the hall's downlights, one each side
            {"x": 620, "y": 420, "z": round(2870 / Z_SCALE, 2), "r": 110, "k": 0.62},
            {"x": -620, "y": 420, "z": round(2870 / Z_SCALE, 2), "r": 110, "k": 0.6},
            # Round 56: the two benches sit under a downlight each. The hall's furniture is lit by
            # the hall's own data -- a bench glowing for no reason would be a source nobody chose.
            {"x": -400, "y": 560, "z": round(1150 / Z_SCALE, 2), "r": 210, "k": 0.26, "bulb": False,
             "tint": "rgba(232,224,206,0.16)", "of": "bench-moji-w"},
            {"x": 400, "y": 560, "z": round(1600 / Z_SCALE, 2), "r": 210, "k": 0.26, "bulb": False,
             "tint": "rgba(232,224,206,0.16)", "of": "bench-moji-e"}],
        "beams": [90, 240, 340],
        # A model hall's walls: the gallery base and plaster the Toronto hall wears, dark.
        # Round 56: the bands ran out at 900 (26 m) while the hall walks on to its quay at 1100
        # (31.9 m) -- so the last six metres of both walls were the shell's bare tile. They now run
        # the hall's whole depth, to the same seams the lane declares.
        "surfaces": [
            {"side": -1, "z0": -103.45, "z1": 1100, "y0": 0, "y1": 110, "kind": "hallbase", "tone": 0.8},
            {"side": -1, "z0": -103.45, "z1": 1100, "y0": 110, "y1": 620, "kind": "hallplaster", "tone": 0.62},
            {"side": 1, "z0": -103.45, "z1": 1100, "y0": 0, "y1": 110, "kind": "hallbase", "tone": 0.8},
            {"side": 1, "z0": -103.45, "z1": 1100, "y0": 110, "y1": 620, "kind": "hallplaster", "tone": 0.62},
        ],
        "marks": [],
        # The far wall opens as a diorama's backdrop does: a band at the table's own horizon -- the
        # strait, both shores and the bridge -- with the hall's wall above it, not six metres of sky.
        "vista": {"x": 0, "y0": 82, "y1": 360, "w": 860},
        "wires": [],
        "backdrop": {
            # Dusk over the strait: the horizon band holds the light off the water.
            "sky": [{"y0": -400, "y1": 8000, "c": "#37456a", "glow": 0.62},
                    {"y0": 8000, "y1": 20000, "c": "#243049", "glow": 0.3},
                    {"y0": 20000, "y1": 60000, "c": "#131d33", "glow": 0.14}],
            "strait": MOJI_STRAIT,
        },
        "frames": [
            # The port's sub-places: the building it is named for, the bridge it is known for, and
            # the water it stands on, hung on the hall's walls as drawn plates.
            {"id": "station", "src": "IMG/fukuoka-1.jpg", "x": -586, "z": round(830 / Z_SCALE, 2), "y": 185, "ry": 90,
             "title": "Moji Port Station",
             "alt": "Illustration of a long symmetric station at dusk: a cream two-storey centre "
                    "between two pavilions with green copper friezes and slate caps, a clock over the "
                    "pediment, single-storey wings either side, the windows lit.",
             "caption": "The building the district is named after, drawn: a cream front banded in "
                        "brick red, the gate's two pavilions in copper and slate, the clock over the "
                        "doors."},
            {"id": "bridge", "src": "IMG/fukuoka-2.jpg", "x": 586, "z": round(1480 / Z_SCALE, 2), "y": 150, "ry": -90,
             "title": "The Blue Wing, open",
             "alt": "Illustration of a blue pedestrian drawbridge over a harbour basin at dusk, "
                    "with its longer southern parent leaf raised beside the shorter northern child leaf.",
             "caption": "The bridge, drawn at an opening: its 24.1 m southern parent leaf and "
                        "14 m northern child leaf are both raised. Its last opening is at four; "
                        "after dark it is lit, and shut."},
            {"id": "water", "src": "IMG/fukuoka-3.jpg", "x": 586, "z": round(2090 / Z_SCALE, 2), "y": 130, "ry": -90,
             "title": "The strait at dusk",
             "alt": "Illustration of a wide strait at dusk seen from a quay, two low cargo ships "
                    "crossing it and lights along the far shore.",
             "caption": "What the basin opens onto, drawn: the room's far wall opens onto the same "
                        "water at the table's scale."},
        ],
        "slots_title": "Places in the port",
        "slots": [
            {"label": "Fukuoka, the port in one sheet", "note": "The album's cover for this room, a "
                                                                "frame of the hall itself after dusk: "
                                                                "the station on its stand, the hall "
                                                                "and the strait beyond.",
             "state": "Held by the hall itself, until a photograph of the quay takes the slot."},
            {"label": "Moji Port Station", "note": "The first stand on the left, at 1:25; on the "
                                                   "port table, the far-left block.",
             "state": "Held by a drawn frame; a photograph of the station takes the slot when one "
                      "arrives."},
            {"label": "The Blue Wing, open", "note": "Across the basin's mouth; it opens on the "
                                                     "hour from ten to four.",
             "state": "Held by a drawn frame; a photograph of the bridge takes the slot when one "
                      "arrives."},
            {"label": "The strait at dusk", "note": "Beyond the basin, past the far wall, where the "
                                                    "ships cross.",
             "state": "Held by a drawn frame; a photograph of the strait takes the slot when one "
                      "arrives."},
            {"label": "Clips and the port after dark", "note": "Vertical clips and one sound, when "
                                                               "material exists.",
             "state": "Empty by design. A clip needs its caption before it can play here."},
        ],
        "lanterns": [],
        # The walk passes the four historic stands in turn, then views the much taller Retro High
        # Mart from across the lane, pitched up to keep both its low stand and crown in frame. It then
        # comes up to the port table at the head of the basin, where one stop takes in both far landmarks.
        # Round 54 review: the quay stops the rebuild authored down the left of the table could never
        # be arrived at — its flank is at ±370 and a body needs 394 to pass, so x=−350 sat INSIDE the
        # plinth's collision box, and every straight glide the rail makes crossed it. The record's own
        # aisle (R52: "a walker can still go round the true-scale table by the right-hand aisle", the
        # 22 cm the e2e gate measures) is what the rail now rides: out to the aisle mouth before the
        # table's near face, up past the flank at 405, round the far corner, and in onto the quay
        # behind the table, where every hop is a straight line no stand crosses.
        "stations": [
            {"z": 60, "x": 0, "label": "the door of the hall"},
            {"z": round(640 / Z_SCALE, 2), "x": -100, "label": "the station, on your left"},
            {"z": round(990 / Z_SCALE, 2), "x": 110, "label": "the old customhouse, on your right"},
            {"z": round(1290 / Z_SCALE, 2), "x": -110, "label": "the Osaka Shosen building, on your left"},
            {"z": round(1590 / Z_SCALE, 2), "x": 115, "label": "the Dalian hall, on your right"},
            {"z": round(1660 / Z_SCALE, 2), "x": 200, "yaw": -52, "pitch": -9,
             "label": "the Retro High Mart, on its stand to your left"},
            {"z": round(2100 / Z_SCALE, 2), "x": 0, "label": "at the port table, over the basin toward the strait"},
            {"z": round(2200 / Z_SCALE, 2), "x": 405, "label": "the right aisle, beside the table's flank"},
            {"z": round(2450 / Z_SCALE, 2), "x": 405,
             "label": "the Blue Wing on its berth"},
            {"z": round(2700 / Z_SCALE, 2), "x": 405, "label": "the quay's turn, past the table's corner"},
            {"z": round(2660 / Z_SCALE, 2), "x": 0, "label": "the canal's stone"},
            {"z": round(2800 / Z_SCALE, 2), "x": 140, "label": "the harbour mouth"},
            {"z": round(2950 / Z_SCALE, 2), "x": 0, "label": "ship lights across the strait"},
            {"z": round(3080 / Z_SCALE, 2), "x": 0, "label": "the High Mart's doors"},
        ],
        "exit": {"id": "curtain-back", "kind": "noren", "x": 0, "z": -46, "y": 172, "ry": 0,
                 "title": "The curtain at your back", "hint": "It parts onto the street."},
        "caveat": "Moji Port in a model hall. The four historic buildings stand on their own stands "
                  "at 1:25, south-west of the basin on the left and north-east on the right; their mapped "
                  "lengths follow OpenStreetMap, while heights and parts read from photographs are "
                  "approximate. The Retro High Mart is a separate 1:25 model on a lower 30 cm display "
                  "stand so its 127 m source-listed top fits below the hall ceiling. Its six-node OSM "
                  "outline (way 292429354) measures about 32.17 × 31.37 m by the table projection, "
                  "with a mapped polygon area of about 647 m². CVU/CTBUH lists 127 m including the "
                  "helipad; OSM's height=115 tag conflicts. Kitakyushu City and MLIT describe the "
                  "public observation view at 103 m, not the total building height. The City's 755.45 "
                  "m² exclusive area and 498.38 m² observation-room area are floor areas, not footprint; "
                  "a secondary 830 m² building-area figure does not reconcile with the mapped polygon, "
                  "and no primary footprint plan was found. The tower's gray window grid, dark X-braced façade band, "
                  "open crown frame and curved cap follow the sourced Nippon.com photograph; exact "
                  "floor spacing and roof geometry remain approximate. The port table is laid out from "
                  "OpenStreetMap at 1.5 cm to the metre, read from the head of the No. 1 basin looking "
                  "north-west, with all five outlines as footprints; the strait beyond the far wall is "
                  "the same scale. The Mitsui Club, the hotel and Kaikyo Plaza are not modelled because "
                  "reliable shape and height data remain insufficient. The Blue Wing keeps its real "
                  "timetable, so it is shut after dark. No sign carries lettering and the yatai sells "
                  "nothing named. The walk's new half — the quay, the door, the bridge's demo — "
                  "is exhibit framing like the stands themselves: the door shows the lift the "
                  "timetable records, not a ship that came in, and the demo's twenty minutes are the "
                  "crossing the sources give at model speed. The hall's furniture -- the benches, "
                  "the crates, the ladder, the cones, the planters -- is drawn dressing at the sizes "
                  "the object table commits, not a survey of what this or any hall actually owns. "
                  "Nothing here says the owner was in any of these places.",
    },
    {
        # Toronto, small. The owner's brief was Little Canada — the Toronto attraction where the
        # province stands on lit tables at model scale — so that is exactly the room: a dark hall,
        # a walk between plinths, and the city's landmarks drawn small enough to look down on. The
        # shapes are the site's own (boxes, fronts, plates) shrunk by per-record sizes, plus a few
        # new silhouettes the city is known by: the tower, the falls, a skyline, a dome. Nothing is
        # named in the scene; the landmarks read by silhouette, the way a model does.
        "id": "toronto", "label": "Toronto",
        "page": ROOM_BY_ID["toronto"]["page"],
        "plates": ROOM_BY_ID["toronto"]["plates"],
        # Indoors and low-ceilinged on purpose: this is a hall, not a street. The light is the
        # tables' own; the ceiling fittings are dim spots over the walk, so the dioramas outshine
        # the room they stand in — the same trick Little Canada's dark hall uses.
        "lane": {"w": 760, "d": 740, "ceil": 400, "back": 260},
        "purpose": "Toronto as a tabletop: the city, its falls and its markets drawn small, the "
                   "way Little Canada keeps Ontario on lit tables",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/toronto-cover.jpg",
        "cover_caption": "The little city in one sheet: a lit table, a small tower, a smaller falls.",
        "blurb": "A dark hall of lit tables. Toronto stands small enough to walk around: the "
                 "tower and the skyline, the falls, the market, the lake.",
        "objects": [
            # Table one — the city. A plinth with the skyline on it: the tower reads first because
            # it is the one silhouette nobody mistakes, then the blocks, then the dome.
            {"id": "plinth-sky", "kind": "plinth", "x": 0, "z": 630, "y": 0, "ry": 0,
             "w": 400, "h": 80, "d": 190, "top": "cityg",
             "glow": [{"r": 160, "k": 0.68, "dy": 96, "tint": "rgba(255,214,170,0.54)"}],
             "title": "The table the city stands on",
             "hint": "A lit table laid out as the city lies, north away from you: the tower, Rogers "
                     "Centre to its west, the financial district to its north-east, and the "
                     "streetcar along the waterfront in front."},
            {"id": "tower-cn", "kind": "tower", "x": -10, "z": 636.9, "y": 80, "ry": 0,
             "w": 58, "h": 300, "d": 58,
             "story": TOWER_STORY,
             "title": "The tower, small",
             "hint": "A flared, tapering round shaft, broad LookOut deck, smaller SkyPod and long "
                     "antenna: the tower's silhouette at table scale (553.3 m to 300 cm, the scale "
                     "every height on this table keeps), with no lettering."},
            # The downtown, as real towers (round 32; TODO section 0n): First Canadian Place (298.1 m,
            # white), Scotia Plaza (275 m, red granite, its notched crown) and Royal Bank Plaza's two
            # gold towers (180 m and 114 m), at the tower's scale (1:184), standing north-east of it in
            # their real order -- Royal Bank Plaza nearest the lake, Scotia Plaza farthest. Their
            # footprints are approximate and the ground between them is drawn at about a third, the
            # way a model city brings its downtown in; heights and order are not compressed.
            {"id": "skyline-cn", "kind": "skyline", "x": 70, "z": 643.79, "y": 80, "ry": 0,
             "w": 100, "h": 162, "d": 90,
             "towers": [{"dx": -30, "dz": 22, "w": 28, "d": 28, "h": 162, "c": "#e7e9e6"},
                        {"dx": 8, "dz": -32, "w": 22, "d": 20, "h": 98, "c": "#c9a24a"},
                        {"dx": 32, "dz": -14, "w": 18, "d": 16, "h": 62, "c": "#c9a24a"},
                        {"dx": 22, "dz": 30, "w": 24, "d": 24, "h": 149, "c": "#8f3b32", "crown": "v"}],
             "title": "The financial district, small",
             "hint": "First Canadian Place, the tallest, in white; Scotia Plaza in red granite with its "
                     "notched crown; Royal Bank Plaza's two gold towers nearest the lake. Heights at "
                     "the tower's scale; after dusk their floors light up."},
            {"id": "dome-rc", "kind": "dome", "x": -102, "z": 621.72, "y": 80, "ry": 0,
             "w": 111, "h": 47, "d": 111,
             "title": "Rogers Centre, small",
             "hint": "West of the tower and a little south, as it stands: the stadium bowl under a roof "
                     "86 m high in four panels. The north panel is fixed; the two middle panels slide "
                     "north onto it and the south panel turns round to nest inside, so it opens toward "
                     "the lake."},
            # A track along the table's front edge and the streetcar that works it: the city's
            # table is the one table where something drives, the way the real one never stops.
            # Queens Quay's streetcar line runs along the waterfront south of the tower: the table's
            # front edge, and the one table where something drives.
            {"id": "track-c", "kind": "track", "x": 0, "z": 599.31, "y": 80, "ry": 0,
             "w": 380, "h": 2, "d": 12,
             "title": "The track, small",
             "hint": "Ballast and two rails along the front edge: the waterfront line south of the "
                     "tower."},
            {"id": "tram-t", "kind": "tram", "x": 0, "z": 599.31, "y": 80, "ry": 0,
             "w": 380, "h": 12, "d": 12,
             "title": "The streetcar, small",
             "hint": "A red streetcar shuttling the waterfront track, lit from within."},
            # Table two — the falls. The water is the one thing in the hall that moves.
            {"id": "plinth-falls", "kind": "plinth", "x": 290, "z": 200, "y": 0, "ry": 0,
             "w": 160, "h": 80, "d": 240, "top": "rock",
             "glow": [{"r": 160, "k": 0.4, "dy": 96, "tint": "rgba(190,220,245,0.36)"}],
             "title": "The table the falls stand on",
             "hint": "The same lit plinth, cooler light: the water gets a cold pool on the floor, "
                     "the way real spray cools the air at the rail."},
            # 228 x 52, not 130 x 100. The Horseshoe Falls run some 670 m of crest to a 57 m drop,
            # so breadth is the thing that identifies them, and at 1.3:1 the model read as a narrow
            # ribbon down a slot gorge -- a different waterfall. This is 4.4:1, as wide as the table
            # it stands on allows without overhanging the plinth.
            {"id": "falls-n", "kind": "falls", "x": 290, "z": 200, "y": 80, "ry": -90,
             "w": 228, "h": 52, "d": 62,
             "story": NIAGARA_STORY,
             "title": "The falls, small",
             "hint": "A sheet of water over a ledge into mist, small enough to step over and loud "
                     "enough to imagine. The one moving thing in the hall; it moves because you "
                     "are here, not because a clock says so."},
            # Table three — the market. Three spaced stalls sit in the forecourt, clear of the hall.
            # Table three -- the market, east of the city as St. Lawrence Market stands 1.25 km east and
            # 0.69 km north of the tower (OpenStreetMap), so it is on your right, beside the city.
            {"id": "plinth-market", "kind": "plinth", "x": 290, "z": 586.21, "y": 0, "ry": 0,
             "w": 160, "h": 80, "d": 200, "top": "cityg",
             "glow": [{"r": 160, "k": 0.4, "dy": 96, "tint": "rgba(255,214,170,0.36)"}],
             "title": "The table the market stands on",
             "hint": "St. Lawrence Market South at 1:100, its long axis north to south as it lies "
                     "on Front Street. The vendors are inside it, as they are."},
            {"id": "hall-sl", "kind": "hall", "x": 290, "z": 586.21, "y": 80, "ry": 90,
             "w": 115, "h": 18, "d": 50,
             "title": "St. Lawrence Market, the South Market",
             "hint": "John Wilson Siddall's 1902 market hall, red brick under one high arched roof "
                     "with a clerestory, built round the centre of the 1845 City Hall: at the north "
                     "end on Front Street, three stone archways and the old council chamber over "
                     "them. The 1845 hall's wings, pediment and clock cupola came down in that "
                     "rebuild, so none of them is here. Its height is approximate."},
            # Table four — the lake. The city's front door: water, islands, one small ferry.
            {"id": "plinth-lake", "kind": "plinth", "x": -290, "z": 140, "y": 0, "ry": 0,
             "w": 160, "h": 80, "d": 240, "top": "sand",
             "glow": [{"r": 160, "k": 0.38, "dy": 96, "tint": "rgba(190,220,245,0.34)"}],
             "title": "The table the lake lies on",
             "hint": "A lake sheet with low island forms and a small Toronto ferry: the water "
                     "the skyline faces."},
            {"id": "pool-lake", "kind": "pool", "x": -290, "z": 140, "y": 80, "ry": 0,
             "w": 130, "h": 4, "d": 200,
             "title": "The lake, small",
             "hint": "Still water on a table. It reflects the hall's spots the way the real one "
                     "reflects the city."},
            # `island-i1` and `island-i2` resolve to a low, irregular landform painter, not to a
            # reusable street planter; `boat-lake` has a hull, wheelhouse, windows, rails and wake.
            {"id": "island-i1", "kind": "island", "x": -325, "z": 107.93, "y": 82, "ry": 0,
             "w": 44, "h": 16, "d": 30,
             "title": "An island, small",
             "hint": "The Toronto Islands lie south of downtown across the harbour: the near end of "
                     "this table, with a wooded crown."},
            {"id": "island-i2", "kind": "island", "x": -255, "z": 113.79, "y": 82, "ry": 0,
             "w": 38, "h": 14, "d": 26,
             "title": "A second island, small",
             "hint": "A second low island in the chain, beside the first."},
            {"id": "boat-lake", "kind": "boat", "x": -290, "z": 140, "y": 83, "ry": 90,
             "w": 36, "h": 12, "d": 12,
             "title": "The ferry, small",
             "hint": "A white double-ended Island ferry with an open passenger deck, crossing north "
                     "and south between the city's shore (the far end of the table) and the islands "
                     "(the near end), the way the real ones cross from the foot of Bay Street."},
            # The far wall used to carry the hall's cover plate. It carries the city itself now:
            # a lit case holding the tower, a row of blocks and the dome, built by the same shapes
            # that build the tables, so the deepest stop in the room ends on the model at a glance
            # instead of on a picture of it.
            # Where the walls carried drawn plates of the three areas, they carry small built
            # cases now: a lit shelf, and on it the thing itself at a sixth of the size. A picture
            # of the falls beside the falls was always the weaker of the two things on that wall.
            # A shelf model has to be a model. At 96 x 72 it stood three quarters the size of the
            # falls on the table below it, so the two read as a duplicated waterfall rather than as a
            # diorama and the case it is displayed in.
            # The hall's own furniture: a bench between tables and the rope line of a model room.
            # Trees, the one thing a miniature plants by the thousand: two on the islands,
            # a shore pair, corners of the city and the falls, one by the market.
            {"id": "tree-i1", "kind": "tree", "x": -325, "z": 107.93, "y": 96, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A tree on the island",
             "hint": "The island keeps a tree; at this scale a tree is a pinch of flock."},
            {"id": "tree-i2", "kind": "tree", "x": -255, "z": 113.79, "y": 94, "ry": 0,
             "w": 12, "h": 20, "d": 12,
             "title": "A tree on the second island",
             "hint": "The second island's tree, smaller, further out."},
            {"id": "tree-s1", "kind": "tree", "x": -217, "z": 108, "y": 80, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A shore tree",
             "hint": "The lake's near shore keeps a tree, the way the real one keeps a park."},
            {"id": "tree-s2", "kind": "tree", "x": -217, "z": 175, "y": 80, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A second shore tree",
             "hint": "The far corner of the lake table, a tree at the water's edge."},
            {"id": "tree-c1", "kind": "tree", "x": -178, "z": 609.66, "y": 80, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A street tree by the city",
             "hint": "The city table keeps street trees; downtown reads by them."},
            {"id": "tree-c2", "kind": "tree", "x": 150, "z": 656.9, "y": 80, "ry": 0,
             "w": 12, "h": 20, "d": 12,
             "title": "A second street tree",
             "hint": "The row continues round the table's left edge."},
            {"id": "tree-c3", "kind": "tree", "x": 178, "z": 609.66, "y": 80, "ry": 0,
             "w": 12, "h": 20, "d": 12,
             "title": "A park tree at the city's corner",
             "hint": "The city's right corner keeps a park's worth of one tree."},
            {"id": "tree-f1", "kind": "tree", "x": 218, "z": 165, "y": 80, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A tree above the falls",
             "hint": "The gorge's rim keeps trees; the real one does."},
            {"id": "tree-f2", "kind": "tree", "x": 350, "z": 235, "y": 80, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A second tree above the falls",
             "hint": "The rim's other side, a tree at the rail."},
            {"id": "tree-m1", "kind": "tree", "x": 226, "z": 614.48, "y": 80, "ry": 0,
             "w": 14, "h": 24, "d": 14,
             "title": "A tree by the market",
             "hint": "The market's corner keeps the one tree a market square allows."},
        ],
        # Dim spots over the walk; the tables carry their own glows from the objects list, so the
        # dioramas are the brightest things in the room and the walk stays a dark hall around them.
        "lamps": [
            {"x": 0, "y": 366, "z": 90, "r": 30, "k": 0.3},
            {"x": 0, "y": 366, "z": 240, "r": 30, "k": 0.3},
            # One spot per table, close and narrow: the diorama outshines the hall it stands in.
            {"x": -230, "y": 300, "z": 120, "r": 46, "k": 0.5, "spot": True},
            {"x": 230, "y": 300, "z": 170, "r": 46, "k": 0.5, "spot": True},
            {"x": 260, "y": 300, "z": 565.52, "r": 46, "k": 0.5, "spot": True},
            {"x": 0, "y": 300, "z": 606.9, "r": 52, "k": 0.55, "spot": True},
        ],
        "wires": [],
        "beams": [120, 260, 400],
        "surfaces": [
            # A model hall: the gallery base at hand height and dark plaster above, both sides the whole
            # length, so the walls recede and the lit tables do the talking.
            {"side": -1, "z0": -260, "z1": 480, "y0": 0, "y1": 120, "kind": "hallbase", "tone": 0.62},
            {"side": -1, "z0": -260, "z1": 480, "y0": 120, "y1": 400, "kind": "hallplaster", "tone": 0.5,
             "grad": True},
            {"side": 1, "z0": -260, "z1": 480, "y0": 0, "y1": 120, "kind": "hallbase", "tone": 0.62},
            {"side": 1, "z0": -260, "z1": 480, "y0": 120, "y1": 400, "kind": "hallplaster", "tone": 0.5,
             "grad": True},
        ],
        "marks": [
            {"kind": "gutter", "x0": -380, "x1": 380, "z0": -260, "z1": -246},
        ],
        "lanterns": [],
        "frames": [
            {"id": "skyline", "wall": False, "src": "IMG/toronto-1.jpg", "x": 374, "z": 396, "y": 150, "ry": -90,
             "title": "The skyline, small",
             "alt": "Illustration of a miniature Toronto skyline on a lit table: a small CN Tower "
                    "with a round pod among blocky navy towers with a few amber windows.",
             "caption": "The city as a model: the tower first, the blocks behind it. Drawn, not "
                        "photographed; nothing on it is named."},
            {"id": "falls", "wall": False, "src": "IMG/toronto-2.jpg", "x": 374, "z": 170, "y": 150, "ry": -90,
             "title": "The falls, small",
             "alt": "Illustration of a miniature waterfall spilling over a navy ledge into white "
                    "mist on a lit table, a tiny railing along the top.",
             "caption": "The falls at table scale: a sheet of water, a ledge, and mist. The model "
                        "moves; the picture holds still."},
            {"id": "market", "wall": False, "src": "IMG/toronto-3.jpg", "x": 374, "z": 586.21, "y": 150, "ry": -90,
             "title": "St. Lawrence Market, small",
             "alt": "Illustration of a miniature market street on a lit table: small stalls with "
                    "striped awnings, stacked crates, and warm hanging lamps.",
             "caption": "The South Market hall, which was Toronto's first City Hall before it was a "
                        "market, with a stall row under it. No vendor is named and nothing is "
                        "lettered: a market reads by its awnings, its crates and its warm light."},
        ],
        "slots_title": "Places in the hall",
        "slots": [
            {"label": "Toronto, the little city in one sheet",
             "note": "The album's cover plate for this room: the whole hall in one look.",
             "state": "Held by the hall itself, until a photograph of the mouth takes the slot."},
            {"label": "The skyline, small",
             "note": "The first table, where the tower stands.",
             "state": "Held by a drawn frame; a photograph of the model takes the slot when one "
                      "arrives."},
            {"label": "The falls, small",
             "note": "The second table, where the water moves.",
             "state": "Held by a drawn frame; a photograph of the model takes the slot when one "
                      "arrives."},
            {"label": "St. Lawrence Market, small",
             "note": "The third table: the South Market hall and the stall row under it.",
             "state": "Held by a drawn frame; a photograph of the model takes the slot when one "
                      "arrives."},
        ],
        "stations": [
            {"z": 0, "label": "the mouth of the hall"},
            {"z": 140, "label": "by the lake table"},
            {"z": 200, "label": "by the falls table"},
            {"z": 500, "label": "by the market table, on your right"},
            {"z": 560, "label": "by the city table"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The door at your back", "hint": "It opens onto the street, at this "
                 "room's own door."},
        "caveat": "A model hall in the manner of Little Canada, its tables laid out by the real "
                  "bearings: the city at the far end with the lake in front of it, the market to "
                  "its east, the falls across the lake to the south-east. On the city table every "
                  "height keeps the tower's scale (1:184) and the ground between the towers is "
                  "brought in; the market is 1:100 and its roof height approximate; only towers "
                  "with sourced heights stand on the skyline. Nothing on any table carries a name, "
                  "a date or a claim that the owner stood in Toronto.",
        "clad_note": (" The room is a dark model hall with lit tables: the city at the far end -- the "
                      "tower, Rogers Centre to its west, the financial district to its north-east, a "
                      "streetcar along the front -- the lake with its islands and ferry on your left, "
                      "the falls on your right, and St. Lawrence Market on your right beside the city. "
                      "Nothing on any table carries a word."),
    },
    {
        # Niagara at Table Rock, as it stands (round 33; sources in TODO §0o). The lane is the last
        # 43 m of the Niagara Recreation Trail (OSM way 1319958255: lit, paving stones) walked south
        # to the brink, on its real line (bearing 180) and at its real scale: the gorge on the left
        # behind the parapet, Table Rock Centre's terrace on the right, the Horseshoe's Canadian end at
        # the far left corner, where the trail comes nearest the falls (OSM node 291955852). Nothing
        # walls it in: the world round it is surveyed (`niagara_world`) -- the Horseshoe's brink as
        # OSM maps it, the American and Bridal Veil falls, Goat and Luna Islands, the gorge and both
        # rivers, the Rainbow Bridge and the Skylon at their bearings -- and it is drawn as geometry,
        # not as the hall's table model stood large. Round 22-30's promenade had the gorge on the
        # wrong hand, a hedge nobody surveyed, and three downstream "silhouettes" two of which stand
        # upstream or up the hill; all three are gone.
        "id": "niagara", "label": "The falls",
        "page": ROOM_BY_ID["niagara"]["page"],
        "plates": ROOM_BY_ID["niagara"]["plates"],
        # Round 52: the lane runs on past the Centre to the fun strip the place really has next
        # door — the Parkway, Clifton Hill, the SkyWheel — and every compression this measure makes
        # (500 m of street to 155 of lane, thirty of bluff to sixteen) is said in the pieces' own
        # hints. floors feed the overlook's standing height; the seams that used to be listed here as
        # `zones` named the plan-view strip, and went with it in round 77 (the strip had no CSS since
        # round 72, so nothing had read them for five rounds).
        "lane": {"w": 1400, "d": 3600, "ceil": 400, "back": 200, "max_d": 10350, "open": True,
                 "open_back": True, "open_end": True,
                 # half 15 m scene = the strip's plaza width, unscaled like every x in this lane
                 # Round 58: the SkyWheel's plaza. The strip proper is 15 m half wide; in front of
                 # the wheel it opens to 32 m so a visitor can walk to the ride's own apron. The
                 # rim crosses the strip at 27.5 m (a 50.5 m rim on a 27.5 m axle), which is the
                 # view Clifton Hill's postcards are made of; the rim's own foot at 2.25 m stands
                 # past the walk's edge, where the queue is.
                 # Round 58: the plaza opened to 32 m half-width so the wheel's apron could be
                 # reached, and the result was a 64 m field of concrete with a ride in the middle of
                 # it — a car park, not a funfair. 24 m keeps the apron reachable and lets the front
                 # rows stand at the square's edge instead of floating in it.
                 # Round 62: the strip's walk answers to its own shopfronts. The fronts are
                 # authored at 10 m (arcade-a…c, the funhouse, the midway line); the walk was left
                 # at 15 m from round 52, so a visitor could walk *behind* the shops and the strip
                 # read as a plaza with crates standing in it. 10.2 m puts the walk where the glass
                 # is, and the square still opens to 17.5 m in front of the wheel.
                 # Round 64: the wide walk begins at the strip's gate, not at the Parkway. The
                 # segment used to start at record 1460 -- the rail's own depth -- so the parkway's
                 # walk was 9.96 m wide while its parapet stood at 6.98 m: the body could step
                 # three metres past the rail onto paving that hangs over the gorge, and the rail's
                 # own stop (x -1290) was outside the lane altogether and could never be reached.
                 # The parkway keeps the lane's own width; the rail is its edge again.
                 "ws": [[2200, 2860, 1020], [2860, 3240, 1750], [3240, 3660, 1020]],
                 # Round 61: what is *paved*, as against where a body may walk. The square's own
                 # front row stands at 16.4 m (the fronts), 16.8 (the rails) and 19.3 (the wheel's
                 # apron); a 17.5 m walk left all of it past the last paver, over the void. The
                 # paving runs out to 33 m across the square only — the strip's own 15 m is the
                 # tight corridor it always was, and 33 m of it is still 19 m less than the 64 m
                 # field round 58 pulled back from.
                 "wsp": [[2600, 3300, 3300]],
                 "floors": [[1500, 2200, 553, 340, 660]]},
        "floor": "pavers",
        "day": {"start": 0.5, "gain": 1},
        "purpose": "Table Rock at Niagara Falls: the trail's last stretch to the brink, the gorge, both falls and the islands where they stand",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/niagara-cover.jpg",
        "cover_caption": "The Horseshoe from the parapet at Table Rock, drawn by the renderer.",
        "blurb": "The last 43 m of the Recreation Trail walked to Table Rock's brink, in the day. "
                 "The parapet and the gorge on the left, the centre's terrace on the right, and "
                 "round it the falls where they are: the Horseshoe's brink at the far corner, the "
                 "American Falls behind you across the gorge, Goat Island between.",
        "clad_note": " The lane is the trail at Table Rock: paving stones underfoot, along the gorge "
                     "on the left a low wall of rough grey stone with black ironwork of rings on it "
                     "between rough stone posts, black lantern lamps, and on the right the open terrace "
                     "to Table Rock Centre. Nothing walls it in and nothing on it carries a word.",
        "sight_note": " The world round the trail is drawn from the map: ahead and to the left the "
                      "Horseshoe's brink curving away to Goat Island with its spray over the basin, "
                      "a rainbow in it on a sunny afternoon; across the gorge Goat Island's woods "
                      "and cliff; behind you, north-east, the American Falls on its boulders with "
                      "the Bridal Veil and Luna Island beside it, the Rainbow Bridge further down, "
                      "and the Skylon on the hill to the north-north-west; to the west, over the "
                      "Centre's roofs, the wooded Fallsview bluff with its hotel towers on top. After "
                      "dark both falls hold the illumination's colour, the hotels' windows light, and, "
                      "in season, fireworks open over the basin.",
        "objects": [
            # Table Rock Centre's wing reaches the trail at E -6.8 m (OSM way 420548287): the doors
            # stand in its face. Journey Behind the Falls starts inside this building (Niagara
            # Parks), so its door is here, beside the door back to the hall.
            {"id": "door-journey", "kind": "door", "x": 678, "z": 469, "y": 0, "ry": -90,
             "leaf": "#33414e",
             "glow": [{"r": 110, "k": 0.45, "dy": 200, "tint": "rgba(160,210,230,0.4)"}],
             "title": "Journey Behind the Falls",
             "hint": "Inside Table Rock Centre: an elevator drops 38 m through the rock to the 1944 "
                     "tunnel, its two portals behind the sheet and the deck at the foot of the falls.",
             "leave": ROOM_BY_ID["journey"]["page"]},
            # Round 51, at the owner's request (「瀑布也應該有互動的東西或是可以玩的遊戲」): the
            # rapids bell. A toy shed on the promenade wall, dressed by the stall CSS like the
            # street's pair; the water it plays on is the pool's own teal, the bell hangs on a wire
            # the way the street's bulbs do. Pressing it opens the shared dialog with the machine —
            # and it says, in its own hint, that none of this is the cataract's record.
            {"id": "shed-rapids", "kind": "board", "w": 170, "h": 128, "d": 90,
             "x": 640, "z": 820, "y": 0, "ry": -90, "game": "rapids",
             "title": "The rapids shed, under the lamps",
             "hint": "A toy, not a survey: a canvas raft, the current's two swells, and a bell on a "
                     "wire over the water. Ring it three times before the mist hour is up; three "
                     "scrapes on the rocks ends the morning. Nothing here claims the falls were ever "
                     "ridden for sport."},
            # The trail is lit (OSM: lit=yes). Two posts stand for its lamps; their spacing is
            # drawn, not surveyed.
            {"id": "lamp-ng1", "kind": "lamp", "x": 640, "z": 120, "y": 0, "ry": 0, "w": 14, "h": 420, "d": 14,
             "title": "A trail lamp", "hint": "The Recreation Trail is lit along the gorge; the post's "
                                             "place here is drawn, not surveyed."},
            {"id": "lamp-ng2", "kind": "lamp", "x": 640, "z": 1150, "y": 0, "ry": 0, "w": 14, "h": 420, "d": 14,
             "title": "A trail lamp", "hint": "The Recreation Trail is lit along the gorge; the post's "
                                             "place here is drawn, not surveyed."},
            # The parapet's last stone post, at the brink corner: the closest the trail comes to
            # the water, the press that answers what the falls are.
            # Round 65: the falls, as a thing a visitor can open. The Horseshoe's brink is 370 m
            # west of the Table Rock rail as this lane draws it -- measured off the record's own
            # crest line (NIA_HS_CREST, put through the lane's own frame, at the middle of the
            # curve) -- and the water drops 57 m from there to the lower river. There was nothing to
            # click: the water is a world prim, not a prop, so the visitor who wanted the falls had
            # to find a 44-pixel box on a picture of them. This is a landmark: it draws nothing
            # (the world already draws the water), it marks the falls where they are, and pressing
            # it says what they are. The mark is the whole affordance, and it is the one mark in the
            # lane that is not on a surface.
            {"id": "falls-horseshoe", "kind": "landmark", "x": -34875, "z": 6429, "y": -2950, "ry": 0,
             "w": 600, "h": 200, "d": 20, "landmark": True,
             "title": "The Horseshoe Falls",
             "hint": "57 metres of fall over a curve that runs 670 round, the Canadian bank's own "
                     "water. From the rail above it the brink is three hundred metres off and "
                     "the river goes over the edge and does not come back; the mist that stands over "
                     "it is the spray off the lip, and it is the reason the promenade is wet."},
            {"id": "parapet-ng", "kind": "parapet", "x": -670, "z": 1462, "y": 0, "ry": 0,
             "w": 50, "h": 96, "d": 50,
             "title": "The Table Rock rail",
             "hint": "The Horseshoe's brink starts a few metres past this post and runs about 670 m "
                     "round to Goat Island; the water drops 57 m into the basin. Table Rock itself, "
                     "the ledge the place is named for, fell into the gorge in 1850."},
            # ---- Round 52, the open strip east of the Centre (sources and measures in TODO §R52).
            # Round 58: this stood as a 3.2 x 5.5 m flat card at x 520 — inside the walk — and from
            # the strip's own station it filled half the frame with featureless grey. A bluff is a
            # face along the street, not a billboard across it: it now runs down the plaza's eastern
            # edge wearing the gorge's strata tile, the way the gorge walls in the world do.
            {"id": "bluff-face", "kind": "board", "x": 1490, "z": 1795, "y": 0, "ry": 90,
             "w": 900, "h": 546, "d": 40, "leaf": "#5d6068", "tile": "strata",
             "title": "The bluff under the deck",
             "hint": "The rock the incline is cut into, and the falls' mist ends here. Thirty metres "
                     "of gorge lip stand five and a half up in this lane, the way every other distance "
                     "between the Centre and Clifton is kept."},
            {"id": "fallsview-deck", "kind": "board", "x": 1450, "z": 1795, "y": 546, "ry": 90,
             "w": 900, "h": 7, "d": 120, "leaf": "#797570", "tile": "pavers",
             "title": "The Fallsview deck",
             "hint": "The upper station's apron, level with the bluff's lip: the parking lot and the "
                     "hotels' street begin past it. You reach it the way visitors do since 1966 — "
                     "in the car, not up the rock."},
            {"id": "falls-incline", "kind": "incline", "x": -66, "z": 1690, "y": 0, "ry": 0,
             "w": 241, "h": 117, "d": 90,
             "run": 1106, "deck": 553, "period": 62, "phase0": 0.5,
             "ride": "1", "rideX": 500, "rideTop": 553,
             "title": "The Falls Incline Railway",
             "hint": "59.8 m of double track at 30 degrees, two 40-passenger cars counterbalanced "
                     "over the head pulley, electric since 8 October 1966; the enclosed cars are "
                     "2013. Of the eight inclines the two cities ran, this is the only one still "
                     "running. A crossing is 62 real seconds — the cars here keep that clock, and "
                     "the one you board makes it three on the model's account."},
            # Round 58: the upper station's door stood on nothing — a grey leaf in mid-air over the
            # grass, which is what a door hung on no wall looks like from the deck. The station is a
            # block, so the block is drawn: stone behind the door, a slab under it, a roof over it.
            {"id": "incline-station", "kind": "box", "x": 760, "z": 1620, "y": 553, "ry": -90,
             "w": 460, "h": 330, "d": 120, "leaf": "#5b6472", "tile": "concrete", "solid": True,
             "title": "The upper station's block",
             "hint": "The head house the cars pull into: a stone block at the top of the bluff, its "
                     "door on the deck's side. The door needs a wall before it can be a door."},
            {"id": "incline-station-roof", "kind": "box", "x": 760, "z": 1620, "y": 883, "ry": -90,
             "w": 500, "h": 26, "d": 190, "leaf": "#3c4652",
             "title": "Its roof", "hint": "A slab over the head house, one course proud of its walls."},
            {"id": "incline-station-slab", "kind": "box", "x": 460, "z": 1620, "y": 553, "ry": -90,
             "w": 300, "h": 22, "d": 220, "leaf": "#6c7076", "tile": "concrete", "solid": False,
             "title": "The landing slab", "hint": "The apron the cars come down to, 22 cm off the "
                     "deck — the same slab the wheel's gondolas step onto, at the other ride."},
            # Round 58: the door had no w/h/d in the record, so its leaf drew at zero height and all
            # that survived was the reveal's shadow — a dark smear on the deck. Found by querying the
            # drawn quads inside the station's own box: four quads there, two of them the station's
            # face, two the door's threshold, and no leaf at all.
            {"id": "incline-upper-door", "kind": "door", "x": 528, "z": 1620, "y": 553, "ry": -90,
             "w": 128, "h": 236, "d": 26,
             "leaf": "#33414e", "ride": "1", "rideX": 500, "rideTop": 553,
             "title": "The upper station's door",
             "hint": "It keeps the weather off the car. Press it and the incline brings you back "
                     "down to the rail, the way it does every minute of the day."},
            {"id": "skywheel", "kind": "wheel", "x": 2376, "z": 3050, "y": 0, "ry": 0, "solid": False,
             "w": 25, "h": 1845, "d": 96, "dia": 5050, "axle": 2750, "turn": 40,
             "demo": "wheel",
             "title": "The Niagara SkyWheel",
             "hint": "The largest observation wheel in Canada, up since 17 June 2006: a Bussink R60 "
                     "— 53.3 m to the crown, a 50.5 m rim, 42 enclosed Swiss gondolas on 21 spoke "
                     "stations, driven either way at up to 1.5 rpm, open all year, three slow turns "
                     "a ride. The model keeps the real rate: forty seconds a revolution, drifting, "
                     "never hurried. Press the platform and the rim lamps answer — the ride is not "
                     "for sale in a drawing."},
            {"id": "wheel-booth", "kind": "board", "x": 2088, "z": 2950, "y": 0, "ry": -90, "tile": "galv", "solid": False,
             "w": 42, "h": 33, "d": 28, "leaf": "#8b9ab0",
             "title": "The ticket box",
             "hint": "A booth at the wheel's loading apron. In the drawing it sells nothing; in "
                     "Clifton it sells the queue."},
            {"id": "arcade-a", "kind": "front", "x": 1001, "z": 2320, "y": 0, "ry": -90,
             "w": 340, "h": 250, "d": 26, "awn": "#3f4d7a", "awnout": 150,
             "fascia": "#b9ac8e", "liton": 0.62,
             "glow": [{"r": 90, "k": 0.6, "dy": 210, "tint": "rgba(255,180,110,0.5)"}],
             "states": [{"say": "Open. The glass is lit and the shutter stands up.", "k": 0.9, "shut": 0.92}],
             "title": "An arcade, mid-block",
             "hint": "Clifton Hill is a street of games, wax, and water parks, and a drawing may "
                     "keep an arcade's glow but not its lease: the fronts here are unnamed on "
                     "purpose, so none of them claims a business that need not stand here."},
            {"id": "arcade-b", "kind": "front", "x": 1001, "z": 2560, "y": 0, "ry": -90,
             "w": 300, "h": 260, "d": 26, "awn": "#7a3f3a", "awnout": 150,
             "fascia": "#b9ac8e", "liton": 0.66,
             "glow": [{"r": 90, "k": 0.55, "dy": 218, "tint": "rgba(255,180,110,0.5)"}],
             "states": [{"say": "Open. A wall of lamps over a glass front.", "k": 0.9, "shut": 0.94}],
             "title": "Another front, another marquee",
             "hint": "Two storeys of funhouse and a wall of lamps: the strip's measure again, not "
                     "the survey's."},
            {"id": "arcade-c", "kind": "front", "x": 1001, "z": 2800, "y": 0, "ry": -90,
             "w": 320, "h": 240, "d": 26, "awn": "#3f6a4a", "awnout": 150,
             "fascia": "#b9ac8e", "liton": 0.7,
             "glow": [{"r": 90, "k": 0.6, "dy": 200, "tint": "rgba(255,180,110,0.5)"}],
             "states": [{"say": "Open. The wheel fills the end of the street from this door.", "k": 0.9, "shut": 0.96}],
             "title": "The arcade nearest the wheel",
             "hint": "From its door the SkyWheel fills the end of the street — the one view the "
                     "strip's own postcards use, and the reason the wheel stands exactly behind it."},
            {"id": "midway-stall", "kind": "foodstall", "x": -1001, "z": 2440, "y": 0, "ry": 90,
             "w": 110, "h": 58, "d": 70, "awn": "#8a3f3a", "leaf": "#6e4f38",
             "title": "A midway stall under an awning",
             "hint": "The strip keeps one food stall because a strip without one is not a strip. "
                     "Nothing here claims its menu."},
            # ---- Round 58, the district's own kit. A fun strip is not three fronts: it is the
            # clutter between them — benches, bins, planters, bollards, the queue, and the lamps that
            # are on after everything else has shut. Every piece stands within a visitor's reach of
            # the plaza's floor, which is the rule the whole lane is held to.
            {"id": "sign-a", "kind": "sign", "x": 999, "z": 2320, "y": 268, "ry": -90,
             "w": 300, "h": 54, "d": 10, "leaf": "#b98a4a", "liton": 0.55,
             "glow": [{"r": 120, "k": 0.5, "dy": 60, "tint": "rgba(255,196,120,0.45)"}],
             "title": "The first marquee, blank",
             "hint": "A lit board over a front. It carries no word: the lettering would belong to a "
                     "business that need not stand on this street, and a drawn street does not "
                     "pretend to have one."},
            {"id": "sign-b", "kind": "sign", "x": 999, "z": 2800, "y": 262, "ry": -90,
             "w": 312, "h": 50, "d": 10, "leaf": "#8b5a4a", "liton": 0.68,
             "glow": [{"r": 120, "k": 0.5, "dy": 60, "tint": "rgba(255,180,120,0.45)"}],
             "title": "The marquee by the wheel",
             "hint": "Blank, like its pair. What a marquee says is a lease; what it does is throw "
                     "light on the pavement, and that is the part a drawing can keep."},
            {"id": "stall-games", "kind": "foodstall", "x": 1001, "z": 3120, "y": 0, "ry": -90,
             "w": 104, "h": 56, "d": 66, "awn": "#3f5a7a", "leaf": "#5c4632",
             "title": "A game booth by the wheel",
             "hint": "A counter under a canvas, the way the strip's booths stand: a lit box, a prize "
                     "shelf, and nothing to win here. Drawn, not surveyed."},
            {"id": "bench-strip-1", "kind": "bench", "x": 958, "z": 2260, "y": 0, "ry": -90,
             "w": 176, "h": 44, "d": 46,
             "title": "A bench facing the strip",
             "hint": "Where the queue waits and the people who are not walking sit. Slats, a back, "
                     "two iron ends — the same bench the quays have."},
            {"id": "bench-strip-2", "kind": "bench", "x": -958, "z": 2620, "y": 0, "ry": 90,
             "w": 176, "h": 44, "d": 46,
             "title": "A bench on the other side",
             "hint": "A strip seats both sides. This one looks back down the hill at the falls' mist."},
            {"id": "bin-strip", "kind": "bin", "x": 972, "z": 2870, "y": 0, "ry": -90,
             "w": 44, "h": 92, "d": 44,
             "title": "A bin at the edge of the plaza",
             "hint": "Every strip has one every few doors. Drawn, and empty."},
            {"id": "planter-strip-1", "kind": "planter", "x": -972, "z": 2800, "y": 0, "ry": 90,
             "w": 92, "h": 80, "d": 92,
             "title": "A planter by the far fronts",
             "hint": "A square tub of grass at the plaza's edge: the strip's only green, apart from "
                     "the gorge."},
            {"id": "planter-strip-2", "kind": "planter", "x": 972, "z": 2420, "y": 0, "ry": -90,
             "w": 92, "h": 80, "d": 92,
             "title": "Its pair across the way",
             "hint": "Two tubs, one at each end of the lit stretch."},
            {"id": "lamp-strip-1", "kind": "lamp", "x": -1008, "z": 2280, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "title": "A lamp on the strip",
             "hint": "A post with a head on it, brighter and later than the promenade's lamps: this "
                     "is the street that stays on."},
            {"id": "lamp-strip-2", "kind": "lamp", "x": 1008, "z": 2640, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "title": "Its pair down the stretch",
             "hint": "The strip is lit end to end; two posts stand for the row."},
            {"id": "queue-rail-a", "kind": "parapet", "x": 1627, "z": 2860, "y": 0, "ry": 0,
             "w": 900, "h": 96, "d": 12,
             "title": "The queue rail at the wheel",
             "hint": "The line that holds the ride's visitors: a steel tube on two feet, 900 cm of "
                     "it. It keeps the platform's edge honest, the way the parapet keeps the gorge's."},
            {"id": "queue-rail-b", "kind": "parapet", "x": 1627, "z": 3240, "y": 0, "ry": 0,
             "w": 900, "h": 96, "d": 12,
             "title": "The rail's other side",
             "hint": "Two rails make a queue; the apron between them is the ride's own floor."},
            # ---- Round 64: the plaza's east side, the side the wheel stands on. It was an apron
            # with two rails on it and nothing else — a queue with no queue in it, no shade, and a
            # ride whose platform had nothing standing in front of it. What a fun row puts at the
            # foot of its wheel is a ticket kiosk, a rail that holds the line along the deck's
            # edge, and shade over the line, so that is what stands here now. None of it names a
            # business, and none of it sells anything this drawing has not drawn.
            {"id": "plaza-ticket", "kind": "front", "x": 2120, "z": 3050, "y": 0, "ry": -90,
             "w": 170, "h": 240, "d": 20, "awn": "#3f5a7a", "fascia": "#b9ac8e",
             "leaf": "#8a7f6d", "liton": 0.58, "solid": True,
             "states": [{"say": "The kiosk is open; the light inside is on.", "k": 0.9, "shut": 0.9}],
             "title": "The ticket kiosk at the wheel",
             "hint": "A little booth of painted wood under a canvas, where a ticket would be sold. "
                     "It sells nothing here: the drawing keeps the wheel's glow, not its prices, "
                     "and a booth with no name on it is the honest one."},
            {"id": "queue-rail-c", "kind": "parapet", "x": 1790, "z": 3050, "y": 0, "ry": 90,
             "w": 620, "h": 96, "d": 12,
             "title": "The rail along the platform",
             "hint": "The line where the queue hands the visitor over to the wheel: the same steel "
                     "tube on two feet, run along the deck's west edge."},
            # The cloth hangs at 204 cm — just over a head — and its apex at 244 cm is the top of
            # the mast beside it, so the canopy is on its post instead of floating over it.
            {"id": "plaza-shade-1", "kind": "parasol", "x": 1650, "z": 2950, "y": 204, "ry": 0,
             "w": 420, "h": 74, "d": 420, "leaf": "#9c8460",
             "title": "Shade over the queue",
             "hint": "A canvas on a mast, in the strip's own cloth. It is here because a queue in "
                     "the sun is a queue nobody stands in."},
            {"id": "plaza-shade-mast-1", "kind": "post", "x": 1650, "z": 2950, "y": 0, "ry": 0,
             "w": 18, "h": 244, "d": 18, "leaf": "#8b93a2", "solid": True,
             "title": "The mast", "hint": "The canopy's own post, and the only part of it you can walk into."},
            {"id": "plaza-shade-2", "kind": "parasol", "x": 1650, "z": 3150, "y": 204, "ry": 0,
             "w": 420, "h": 74, "d": 420, "leaf": "#9c8460",
             "title": "Its pair, down the line",
             "hint": "Two shades along the queue: one over the front of the line and one over the back of it."},
            {"id": "plaza-shade-mast-2", "kind": "post", "x": 1650, "z": 3150, "y": 0, "ry": 0,
             "w": 18, "h": 244, "d": 18, "leaf": "#8b93a2", "solid": True,
             "title": "Its mast", "hint": "The other post."},
            {"id": "queue-bench", "kind": "bench", "x": 2150, "z": 2900, "y": 0, "ry": 90,
             "w": 176, "h": 44, "d": 46,
             "title": "A bench by the kiosk",
             "hint": "Somebody waits for somebody else. The apron keeps the strip's rhythm: a "
                     "lamp, a seat, a bin, again and again."},
            {"id": "queue-bin", "kind": "bin", "x": 2200, "z": 3200, "y": 0, "ry": 0,
             "w": 44, "h": 92, "d": 44,
             "title": "A bin by the rail", "hint": "Drawn, and empty."},
            # ---- Round 58, the rest of the district. Round 52 built Clifton Hill's faces and its
            # wheel and called the strip done; a fun row with one ride, three fronts and a stall is a
            # postcard of a fun row. What stands here now is the district a visitor can actually
            # walk: the second ride turning at the far end, the towers behind it, the midway's
            # booths down both sides, the gate that says you have arrived, the lights strung over
            # the street, and the furniture that makes forty metres of paving a street rather than a
            # corridor. Every piece is unnamed: a drawn street does not invent leases.
            {"id": "carousel", "kind": "carousel", "x": -1080, "z": 3060, "y": 0, "ry": 90,
             # Round 58: the deck is a solid — a visitor walks up to the carousel, never through it.
             "w": 900, "h": 460, "d": 900, "dia": 900, "turn": 26, "solid": True,
             "demo": "carousel",
             "title": "The carousel at the end of the strip",
             "hint": "A merry-go-round is the oldest ride on a fun row and the one that still runs: a "
                     "round deck, twenty-four sectors of painted floor, sixteen canopy stripes, and "
                     "twelve horses rising on their own poles as it turns. Twenty-six seconds a "
                     "revolution here — a carousel is a slow ride, and the drawing keeps it slow."},
            {"id": "tower-mast", "kind": "post", "x": -1094, "z": 2480, "y": 0, "ry": 0,
             "w": 90, "h": 1960, "d": 90, "leaf": "#8b93a2", "solid": True,
             "title": "The drop tower's mast",
             "hint": "The strip's tall ride: a steel mast with a ring of seats that climbs it and "
                     "lets go. Drawn at the strip's measure, twenty metres — a tower you can see "
                     "over the fronts from the Parkway."},
            {"id": "tower-ring", "kind": "board", "x": -1094, "z": 2480, "y": 1420, "ry": 0,
             "w": 320, "h": 96, "d": 320, "leaf": "#c0533f", "solid": False,
             "title": "The ring of seats",
             "hint": "Twelve seats round a collar. It sits at its top station in the drawing: a ride "
                     "caught mid-fall in a still frame would be a lie about the ride."},
            {"id": "funhouse", "kind": "front", "x": -1001, "z": 2320, "y": 0, "ry": 90,
             "w": 330, "h": 330, "d": 26, "awn": "#6a4a86", "awnout": 170,
             "fascia": "#c9b98e", "liton": 0.6,
             "glow": [{"r": 100, "k": 0.55, "dy": 300, "tint": "rgba(196,150,255,0.42)"}],
             "states": [{"say": "Open. The mirrors inside are nobody's business here.", "k": 0.9, "shut": 0.95}],
             "title": "The funhouse front",
             "hint": "Three storeys of painted front, an awning, and a lit board over the door with "
                     "nothing written on it. A funhouse is the one building on the strip whose whole "
                     "job is its face."},
            {"id": "midway-a", "kind": "foodstall", "x": -1001, "z": 2560, "y": 0, "ry": 90,
             "w": 108, "h": 56, "d": 68, "awn": "#3f6a8a", "leaf": "#6a5138",
             "title": "A midway booth", "hint": "A canvas roof, a counter, a shelf of prizes. The "
                     "strip's booths stand shoulder to shoulder; this is the first of the row."},
            {"id": "midway-b", "kind": "foodstall", "x": -1001, "z": 2660, "y": 0, "ry": 90,
             "w": 108, "h": 56, "d": 68, "awn": "#8a5a3f", "leaf": "#5c4632",
             "title": "The booth next door", "hint": "Same counter, different canvas. Nothing here "
                     "says what is for sale, because nothing here is for sale."},
            {"id": "midway-c", "kind": "foodstall", "x": 1001, "z": 2340, "y": 0, "ry": -90,
             "w": 108, "h": 56, "d": 68, "awn": "#3f8a6a", "leaf": "#584636",
             "title": "A booth on the east side", "hint": "The row runs both sides of the street: a "
                     "visitor walking up sees canvas on the left and canvas on the right."},
            {"id": "midway-d", "kind": "foodstall", "x": 1001, "z": 2660, "y": 0, "ry": -90,
             "w": 108, "h": 56, "d": 68, "awn": "#8a3f5a", "leaf": "#6a5138",
             "title": "The last booth before the plaza", "hint": "Past it the street opens to the "
                     "wheel's apron, which is where the strip stops being a corridor."},
            {"id": "sweets-kiosk", "kind": "foodstall", "x": -1001, "z": 2870, "y": 0, "ry": 90,
             "w": 92, "h": 60, "d": 60, "awn": "#c05a86", "leaf": "#7a5a40",
             "title": "A sweet kiosk by the plaza", "hint": "A small counter with a striped awning, "
                     "the way every fun row has one: the smell is the only part of it a drawing "
                     "cannot carry."},
            {"id": "strip-gate-l", "kind": "post", "x": -576, "z": 2200, "y": 0, "ry": 0,
             "w": 30, "h": 360, "d": 30, "leaf": "#3a2f28", "solid": True,
             "title": "The gate post at the strip's mouth", "hint": "Two posts and a beam mark where "
                     "the Parkway ends and the fun row starts. They carry no word, and they do not "
                     "stop anybody."},
            {"id": "strip-gate-r", "kind": "post", "x": 576, "z": 2200, "y": 0, "ry": 0,
             "w": 30, "h": 360, "d": 30, "leaf": "#3a2f28", "solid": True,
             "title": "Its pair across the street", "hint": "The gate is a frame, not a barrier."},
            {"id": "strip-gate-beam", "kind": "box", "x": 0, "z": 2200, "y": 356, "ry": 0,
             "w": 1630, "h": 30, "d": 34, "leaf": "#43362b", "solid": False,
             "title": "The beam over the street", "hint": "At 3.56 m: above a hat, below the signs. "
                     "The strip's own arch, in timber."},
            # Round 63: a festoon wire hangs from something. These three spans were authored
            # 15–24 m wide with nothing at either end, so from the plaza they read as coloured bars
            # floating across the sky. Each span now has its own pole at the kerb line, at the wire's
            # own height, and stops at it.
            {"id": "lights-post-a1", "kind": "post", "x": -860, "z": 2420, "y": 0, "ry": 0,
             "w": 16, "h": 470, "d": 16, "leaf": "#2f3a44", "solid": True,
             "title": "The pole that carries the first span",
             "hint": "Iron, at the kerb, with the wire's eye at its head."},
            {"id": "lights-post-a2", "kind": "post", "x": 860, "z": 2420, "y": 0, "ry": 0,
             "w": 16, "h": 470, "d": 16, "leaf": "#2f3a44", "solid": True,
             "title": "Its pair across the street", "hint": "The two hold the first span true."},
            {"id": "lights-post-b1", "kind": "post", "x": -860, "z": 2760, "y": 0, "ry": 0,
             "w": 16, "h": 470, "d": 16, "leaf": "#2f3a44", "solid": True,
             "title": "The second span's pole", "hint": "Same iron, same eye."},
            {"id": "lights-post-b2", "kind": "post", "x": 860, "z": 2760, "y": 0, "ry": 0,
             "w": 16, "h": 470, "d": 16, "leaf": "#2f3a44", "solid": True,
             "title": "Its pair", "hint": "Lit from below after dark."},
            {"id": "lights-post-c1", "kind": "post", "x": -860, "z": 3120, "y": 0, "ry": 0,
             "w": 16, "h": 470, "d": 16, "leaf": "#2f3a44", "solid": True,
             "title": "The span over the square's mouth", "hint": "The last wire before the wheel."},
            {"id": "lights-post-c2", "kind": "post", "x": 860, "z": 3120, "y": 0, "ry": 0,
             "w": 16, "h": 470, "d": 16, "leaf": "#2f3a44", "solid": True,
             "title": "Its pair", "hint": "The street is framed twice over."},
            {"id": "lights-a", "kind": "noren", "x": 0, "z": 2420, "y": 470, "ry": 0,
             "w": 1720, "h": 26, "solid": False,
             "title": "Lights strung across the street", "hint": "A cable of bulbs, post to post, "
                     "the way a fun row is lit after dark. The strip is the one place in this "
                     "drawing that stays bright late."},
            {"id": "lights-b", "kind": "noren", "x": 0, "z": 2760, "y": 470, "ry": 0,
             "w": 1720, "h": 26, "solid": False,
             "title": "The second span", "hint": "Four spans reach the plaza; this is the second."},
            {"id": "lights-c", "kind": "noren", "x": 0, "z": 3120, "y": 470, "ry": 0,
             "w": 1720, "h": 26, "solid": False,
             "title": "The span over the plaza", "hint": "Wider than the others: the street has "
                     "opened out by the time the cable reaches it."},
            {"id": "plaza-bench-1", "kind": "bench", "x": 864, "z": 3120, "y": 0, "ry": 0,
             "w": 176, "h": 44, "d": 46,
             "title": "A bench on the plaza", "hint": "Facing the wheel. The apron's only seat."},
            {"id": "plaza-bench-2", "kind": "bench", "x": 864, "z": 3320, "y": 0, "ry": 0,
             "w": 176, "h": 44, "d": 46,
             "title": "Its pair, a step down the plaza", "hint": "Two benches is what a plaza needs; "
                     "the rest is standing room."},
            {"id": "plaza-bin", "kind": "bin", "x": 648, "z": 3180, "y": 0, "ry": 0,
             "w": 44, "h": 92, "d": 44,
             "title": "A bin by the bench", "hint": "Drawn, and empty."},
            {"id": "plaza-planter-1", "kind": "planter", "x": -864, "z": 3140, "y": 0, "ry": 0,
             "w": 92, "h": 80, "d": 92,
             "title": "A planter at the plaza's edge", "hint": "The strip's green, in a square tub."},
            {"id": "plaza-planter-2", "kind": "planter", "x": -864, "z": 3280, "y": 0, "ry": 0,
             "w": 92, "h": 80, "d": 92,
             "title": "Its pair", "hint": "Two tubs mark the edge of the paving."},
            {"id": "plaza-lamp-1", "kind": "lamp", "x": 1500, "z": 3020, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "solid": True, "title": "A lamp on the plaza", "hint": "The strip's lamps are taller and later than "
                     "the promenade's: this is the street that stays on."},
            {"id": "plaza-lamp-2", "kind": "lamp", "x": -1500, "z": 3020, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "solid": True, "title": "The lamp opposite", "hint": "A pair, one to each side of the apron."},
            {"id": "fountain", "kind": "pool", "x": 1512, "z": 3300, "y": 0, "ry": 0,
             "w": 340, "h": 16, "d": 340, "solid": False,
             "title": "The fountain in the plaza",
             "hint": "A shallow round basin: water in a fun district is the one thing nobody has to "
                     "queue for. Drawn at the strip's measure, three and a half metres across."},
            {"id": "fountain-rim", "kind": "board", "x": 1512, "z": 3300, "y": 0, "ry": 0,
             "w": 380, "h": 46, "d": 380, "leaf": "#8c8578", "tile": "concrete", "solid": False,
             "title": "The fountain's rim", "hint": "A stone lip, knee high, and the water inside it."},
            # Round 58: the strip's paving ran thirty metres wide with four benches in it, which is a
            # car park, not a street. A fun row is furniture all the way down — a lamp, a tub, a
            # seat, a bin, again and again — and it is that repetition, not the fronts, that makes a
            # street feel walked. These are placed at the strip's own rhythm, 20 m apart.
            {"id": "strip-lamp-1", "kind": "lamp", "x": 860, "z": 2260, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "solid": True, "title": "A lamp at the strip's mouth", "hint": "The row starts where the gate does."},
            {"id": "strip-lamp-2", "kind": "lamp", "x": -860, "z": 2460, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "solid": True, "title": "A lamp on the west kerb", "hint": "The row alternates sides; a street lit from "
                     "one kerb only has a dark side."},
            {"id": "strip-lamp-3", "kind": "lamp", "x": 860, "z": 2660, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "solid": True, "title": "A lamp by the midway", "hint": "Lit in the drawing whether or not it is dark."},
            {"id": "strip-lamp-4", "kind": "lamp", "x": -860, "z": 2860, "y": 0, "ry": 0,
             "w": 14, "h": 470, "d": 14,
             "solid": True, "title": "A lamp at the plaza's edge", "hint": "The last of the row before the apron."},
            {"id": "strip-plant-1", "kind": "planter", "x": 518, "z": 2380, "y": 0, "ry": 0,
             "w": 92, "h": 80, "d": 92,
             "title": "A tub on the east kerb", "hint": "Grass in a square tub, between the lamps."},
            {"id": "strip-plant-2", "kind": "planter", "x": -518, "z": 2720, "y": 0, "ry": 0,
             "w": 92, "h": 80, "d": 92,
             "title": "Its pair", "hint": "The strip's planting is all in tubs: nothing grows in "
                     "paving that is swept every night."},
            {"id": "strip-bench-3", "kind": "bench", "x": -547, "z": 2580, "y": 0, "ry": 90,
             "w": 176, "h": 44, "d": 46,
             "title": "A bench under the lights", "hint": "Facing the street: the queue sits, the "
                     "queue watches."},
            {"id": "strip-bin-2", "kind": "bin", "x": 547, "z": 2520, "y": 0, "ry": 0,
             "w": 44, "h": 92, "d": 44,
             "title": "A bin by the booth", "hint": "Drawn, and empty."},
            # ---- The square's edge. A plaza with rides in it and nothing at its rim is a field:
            # these are the fronts that close the two sides the wheel does not, so a visitor standing
            # under the SkyWheel has a street around them and not a plain.
            # ---- The buildings the fronts are the faces of. Round 62: they stand *behind* their
            # fronts. They were authored at 11.8 m — inside a 15 m walk — so from the street the row
            # read as six packing crates with the shopfronts hidden behind them. Each block now sits
            # one room back from the glass it backs (12.8 m on the strip, 19 m where the square's
            # fronts are at 16.4), and the strip's walk was narrowed to 10.2 m to meet its own
            # shopfronts instead of running 5 m past them. Opening the strip's side walls (see the
            # surfaces below) let the street see round its own facades, and a facade with nothing
            # behind it is a card. These are the blocks: one behind each front, one storey deeper and
            # a course higher, so the strip reads as a row of buildings rather than a row of faces.
            {"id": "block-a", "kind": "box", "x": 1280, "z": 2320, "y": 0, "ry": -90,
             "w": 360, "h": 380, "d": 500, "leaf": "#7b7266", "tile": "brick", "solid": True,
             "win": 2, "wincol": 4, "title": "The building behind the first front", "hint": "A fun row's fronts are one room "
                     "deep and one room tall; what stands behind them is a block, and the block is "
                     "what you see over the awning."},
            {"id": "block-b", "kind": "box", "x": 1280, "z": 2560, "y": 0, "ry": -90,
             "w": 300, "h": 400, "d": 500, "leaf": "#6f6a62", "tile": "brick", "solid": True,
             "win": 3, "wincol": 3, "title": "The second block", "hint": "Slightly taller than its neighbour: a street of "
                     "identical heights is a barracks."},
            {"id": "block-c", "kind": "box", "x": 1280, "z": 2800, "y": 0, "ry": -90,
             "w": 320, "h": 360, "d": 500, "leaf": "#7f7466", "tile": "brick", "solid": True,
             "win": 2, "wincol": 4, "title": "The block by the wheel", "hint": "The last of the row before the square."},
            {"id": "block-d", "kind": "box", "x": -1280, "z": 2320, "y": 0, "ry": 90,
             "w": 330, "h": 420, "d": 500, "leaf": "#746c62", "tile": "brick", "solid": True,
             "win": 3, "wincol": 3, "title": "The west block behind the funhouse", "hint": "The funhouse's own building: "
                     "the face is three storeys, so the block is three storeys."},
            {"id": "block-e", "kind": "box", "x": -1280, "z": 2600, "y": 0, "ry": 90,
             "w": 340, "h": 320, "d": 500, "leaf": "#7b7266", "tile": "brick", "solid": True,
             "win": 2, "wincol": 3, "title": "Its neighbour", "hint": "Lower, and set a step back from the funhouse's face."},
            {"id": "block-f", "kind": "box", "x": -1900, "z": 2880, "y": 0, "ry": 90,
             "w": 320, "h": 340, "d": 500, "leaf": "#6f6a62", "tile": "brick", "solid": True,
             "win": 3, "wincol": 4, "title": "The last block on the west side", "hint": "The row turns the corner at the "
                     "carousel and carries on round the square."},
            {"id": "plaza-front-w1", "kind": "front", "x": -1642, "z": 2900, "y": 0, "ry": 90,
             "w": 300, "h": 300, "d": 26, "awn": "#7a4a3a", "awnout": 160,
             "fascia": "#c2b494", "liton": 0.62,
             "glow": [{"r": 100, "k": 0.5, "dy": 250, "tint": "rgba(255,196,130,0.42)"}],
             "states": [{"say": "Open. The glass is lit and the shutter stands up.", "k": 0.9, "shut": 0.94}],
             "title": "A front on the square's west side",
             "hint": "The strip turns the corner here: the fronts stop running down the street and "
                     "start running round the square, the way a fun row does when it meets its ride."},
            {"id": "plaza-front-w2", "kind": "front", "x": -1642, "z": 3180, "y": 0, "ry": 90,
             "w": 300, "h": 320, "d": 26, "awn": "#3f5a6a", "awnout": 160,
             "fascia": "#b9ac8e", "liton": 0.68,
             "glow": [{"r": 100, "k": 0.52, "dy": 260, "tint": "rgba(255,186,120,0.42)"}],
             "states": [{"say": "Open. A wall of lamps over a glass front.", "k": 0.9, "shut": 0.94}],
             "title": "Its neighbour, round the corner",
             "hint": "Two fronts and a rail are enough to make an edge; the rest of the square is "
                     "paving, a fountain and the wheel."},
            {"id": "plaza-front-n1", "kind": "front", "x": 1649, "z": 3060, "y": 0, "ry": -90,
             "w": 280, "h": 270, "d": 26, "awn": "#6a4a3a", "awnout": 150,
             "fascia": "#c2b494", "liton": 0.6,
             "glow": [{"r": 90, "k": 0.5, "dy": 230, "tint": "rgba(255,196,130,0.4)"}],
             "states": [{"say": "Open. The queue for the wheel stands outside it.", "k": 0.9, "shut": 0.94}],
             "title": "The front facing the wheel",
             "hint": "A ticket hall and a counter: the business the ride lives on, drawn as a face "
                     "with a blank marquee above it."},
            {"id": "plaza-flag-1", "kind": "post", "x": -936, "z": 3320, "y": 0, "ry": 0,
             "w": 18, "h": 620, "d": 18, "leaf": "#9aa2ae", "solid": True,
             "title": "A flag mast at the square's mouth", "hint": "Bare, in the drawing: the strip "
                     "is a place where something is always being advertised, and a mast with nothing "
                     "on it says that without inventing a word."},
            {"id": "plaza-flag-2", "kind": "post", "x": 936, "z": 3320, "y": 0, "ry": 0,
             "w": 18, "h": 620, "d": 18, "leaf": "#9aa2ae", "solid": True,
             "title": "Its pair", "hint": "Two masts frame the way into the square."},
            {"id": "river-rail", "kind": "parapet", "x": -1678, "z": 3060, "y": 0, "ry": 0,
             "w": 1200, "h": 96, "d": 12,
             "title": "The rail along the river edge", "hint": "The strip ends at the bluff. Iron on "
                     "stone, the same kit the promenade uses — beyond it the ground drops to the "
                     "gorge and the water is the river's own."},
            {"id": "river-edge-bench", "kind": "bench", "x": -1584, "z": 3180, "y": 0, "ry": 0,
             "w": 176, "h": 44, "d": 46,
             "title": "A bench at the river edge", "hint": "The strip's quiet end: the lights behind "
                     "you, the gorge in front."},
            # Round 58: opening the west edge to the gorge means the walker can now step off the
            # point where the strip's paving ends. The rail is what makes an edge an edge.
            {"id": "point-rail-w", "kind": "parapet", "x": -1627, "z": 2600, "y": 0, "ry": 0,
             "w": 900, "h": 96, "d": 12,
             "title": "The rail at the point's west edge", "hint": "Iron on stone, a hand's height "
                     "above the paving: past it the bluff falls to the gorge and there is no way down."},
            # Round 64: the square's south rail stood *across* the walk -- six metres of iron on the
            # centre line, a metre and a half short of the gate it was meant to lead to. The body
            # stopped dead against it, and the "bridge approach" stop could never be reached: the
            # rail was the wall between the square and the bridge. The edge is railed in two runs
            # with the gate's width open between them, which is what the place does -- the square
            # ends at the point, and the way on to the bridge is the gap.
            {"id": "point-rail-sw", "kind": "parapet", "x": -648, "z": 3420, "y": 0, "ry": 0,
             "w": 600, "h": 96, "d": 12,
             "title": "The rail at the square's south edge", "hint": "The square ends where the "
                     "point does; the bridge approach runs past beyond it, through the gate."},
            {"id": "point-rail-se", "kind": "parapet", "x": 648, "z": 3420, "y": 0, "ry": 0,
             "w": 600, "h": 96, "d": 12,
             "title": "Its pair across the way", "hint": "Two runs of iron close the square's south "
                     "side and leave the gate's width open between them."},
            {"id": "plaza-rail", "kind": "parapet", "x": 1692, "z": 3320, "y": 0, "ry": 0,
             "w": 700, "h": 96, "d": 12,
             "title": "The rail at the plaza's edge", "hint": "Beyond it the ground falls away to "
                     "the gorge: the strip stands on the same bluff as the falls."},
            {"id": "wheel-platform", "kind": "board", "x": 1930, "z": 3050, "y": 0, "ry": 0,
             "w": 300, "h": 24, "d": 460, "leaf": "#6c7076", "tile": "concrete", "solid": False,
             "title": "The wheel's loading apron",
             "hint": "The platform the gondolas come down to: a slab 24 cm off the paving, so the "
                     "ride's floor and the street's are not the same floor. The ride is not for "
                     "sale in a drawing — press the wheel and its lamps answer."},
            # Round 58: the noren hung in mid-air at 1.72 m across the middle of the lane, and from
            # the Fallsview deck it read as a striped cloth floating in the sky. A noren leaves from a
            # frame: two posts and a lintel, which is also what makes the way across the bridge look
            # like a way rather than a laundry line. Nothing on the frame is lettered.
            {"id": "gate-post-l", "kind": "post", "x": -170, "z": 3560, "y": 0, "ry": 0,
             "w": 22, "h": 286, "d": 22, "leaf": "#3a2f28", "solid": True,
             "title": "The gate's west post",
             "hint": "A timber post, drawn: the frame the bridge's curtain hangs in."},
            {"id": "gate-post-r", "kind": "post", "x": 170, "z": 3560, "y": 0, "ry": 0,
             "w": 22, "h": 286, "d": 22, "leaf": "#3a2f28", "solid": True,
             "title": "The gate's east post",
             "hint": "Its pair, astride the walk. The lintel keeps the two true."},
            {"id": "gate-lintel", "kind": "box", "x": 0, "z": 3560, "y": 286, "ry": 0,
             "w": 362, "h": 24, "d": 26, "leaf": "#40342b",
             "title": "The lintel",
             "hint": "The beam the curtain is strung from, at 2.86 m: head height plus a hat."},
            {"id": "curtain-rainbow", "kind": "noren", "x": 0, "z": 3560, "y": 238, "ry": 0,
             "leave": "rooms-goat.html",
             "title": "The way across the Rainbow",
             "hint": "Beyond the curtain: the bridge — 440 m of steel over the gorge, its arch 290 "
                     "m, open since 1 November 1941, and the walkway onto Goat Island and the state "
                     "line. The American bank is drawn in its own page; step through to arrive."},
        ],
        # The gorge side: an iron railing on a stone curb between stone posts, open air above
        # (the Getty photographs at the wall, May 2026); the terrace side is open to the centre.
        # Round 58: past the Centre the lane had no surfaces of its own, so it fell back to the
        # default corridor wall — a blank banded face at ±1500 that stood *in front of* Clifton's
        # fronts and turned the fun strip into a beige tunnel. The strip is an open street: its edge
        # is the fronts and the rails, not a wall, so the wall is opened from the Parkway to the
        # bridge and the streetscape does the enclosing.
        # Round 59: the parapet runs to the Parkway (z 1483, the figure `niagara_parapet_bands`
        # takes in record units) and the rail station is at 1440 — so the last band pair stopped a
        # metre short of the station and the whole run from 1483 was opened as the strip's edge. The
        # Table Rock rail is the one place the visitor stands over the gorge; it is behind a full
        # parapet here, not standing free at the brink.
        "surfaces": niagara_parapet_bands(z_end=1540) + [
            # the Centre's terrace, then the strip's own open edges
            {"side": 1, "z0": -69, "z1": 10350, "y0": 0, "y1": 400, "kind": "open"},
            # Round 59: the units, again. `niagara_parapet_bands` returns record/Z_SCALE and the
            # emitter multiplies a band by Z_SCALE, so a literal here is *pre-scale*: writing 1483
            # opened the gorge side from 4301 onwards and left 1483-4301 — the Parkway and the whole
            # fun strip, including the Table Rock rail and the Falls Incline station — with no
            # surfaces at all. A lane with no surfaces paints its default plaster wall, and that
            # blank cream face is what stood between the rail and the gorge in every frame from the
            # brink: the same failure as round 58's beige tunnel, one unit mistake further on.
            {"side": -1, "z0": round(1483 / Z_SCALE, 1), "z1": 10350, "y0": 0, "y1": 400, "kind": "open"}],
        "lamps": [
            {"x": 640, "y": 410, "z": 120, "r": 90, "k": 0.45},
            {"x": 640, "y": 410, "z": 1150, "r": 90, "k": 0.45},
            # the strip burns brighter than the promenade, and its row starts at the Parkway
            {"x": 640, "y": 430, "z": 2320, "r": 120, "k": 0.55},
            {"x": 640, "y": 430, "z": 2700, "r": 120, "k": 0.55},
            {"x": 640, "y": 430, "z": 3080, "r": 120, "k": 0.5},
            {"x": 640, "y": 430, "z": 3420, "r": 110, "k": 0.45},
        ],
        "backdrop": {
            "skyAround": NIAGARA_SKY,
            "world": {"prims": niagara_world(LaneFrame(0.0, 14.0, 0.0, 180.0))},
        },
        "slots_title": "Places at the falls",
        "slots": [
            {"label": "The horseshoe from Table Rock",
             "note": "The story the hall's model opens first: the crest, the mist, the "
                      "American Falls across.",
             "state": "Held by three drawn story frames; a photograph takes the slot when one arrives."},
            {"label": "The Table Rock rail",
             "note": "The brink a few metres past the last post, where the trail comes nearest the water.",
             "state": "Held by the rail itself; no plate can stand in for the drop."},
        ],
        "stations": [
            {"z": 21, "x": 0, "label": "the trail at Table Rock Centre"},
            {"z": 469, "x": 470, "label": "the centre's doors"},
            {"z": 980, "x": -520, "label": "the parapet over the gorge"},
            # Round 59: the station's own view, measured. `yaw -15` faces up the walk with the rail
            # on the left and the gorge's edge behind it; -90 is straight over the parapet at the
            # water, which is what a visitor who has stopped at the rail is looking at. Pitch 10 is
            # the authored down-angle (the walk already looks down from the bluff).
            # Round 64: the stop stood at x -1290, six metres outside the lane (the parkway's walk
            # ends at 6.76 m), so the glide clamped the body to the rail and the stop never
            # arrived -- the rail was the one place a visitor could not be taken to. It stands at
            # the parapet now, 98 cm off its face, and `yaw -82` looks west over the rail at the
            # Horseshoe's brink, which is what the view was measured for in round 59.
            # Round 69e: the aim was 27 degrees short of the falls. Measured with the page's own
            # camera (`__cam`), stop 3 at `yaw -82` puts the mist's alpha-weighted centre at screen
            # x 220 of 1024 -- the plume is cut by the left edge and the horseshoe's middle is out of
            # frame, which is why two rounds of tuning the plume changed nothing anyone could see.
            # At `yaw -109` the same centroid lands at x 508, the curtain fills the frame and the
            # brink runs corner to corner. The number is derived from the crest, not chosen: the
            # point of the brink farthest from the end-to-end chord is 356 m out at -109.4 degrees.
            {"z": 1510, "x": -600, "yaw": -109, "pitch": 2, "label": "the Table Rock rail"},
            {"z": 1660, "x": -140, "yaw": -18, "label": "the incline's lower station"},
            {"z": 2130, "x": 500, "h": 553, "yaw": 38, "pitch": 14, "label": "on the Fallsview deck"},
            # Round 65: the fun row had no stop at all. The lane walked past six fronts, three
            # booths, a funhouse and a carousel, and every one of them was a thing the visitor
            # passed rather than a thing the visitor could be taken to -- the district's subject
            # was the one part of the walk with no view of its own.
            #
            # It stands at x 300, not in the middle of the walk, and the reason is measured: the
            # Falls Incline Railway's lower station house and its rails stand across the promenade
            # at x -186..54, and a chip's glide is a straight line. A stop on the centre line
            # (x 0) put that line straight through the station house, the glide stopped at the
            # house's face nine hundred centimetres short of the strip, and the chip promised a
            # view it could not deliver. At x 300 the line from the lane's mouth passes a clear
            # 120 cm east of the house. It looks due east at the arcade's middle unit, seven
            # metres off, which is the distance at which a shopfront is read as joinery rather
            # than as a picture.
                        # Round 69m: the hotel towers on the Fallsview bluff were in this view all along and in
            # no frame of it -- at the authored -2 degrees the frame's top edge cut them at the roof
            # line (`.preview/nia69mq/stop6-yaw90-p6`, and the same at 0). `_map` puts `hotelw` at
            # 324-333 m in this direction; at -8 the near tower stands 110x220 px clear above the
            # shopfronts (mean 113.5, sd 41.9, 82 colours) and the shopfront is untouched at 7 m.
            {"z": 2560, "x": 300, "yaw": 90, "pitch": -8, "label": "the fun row, with the bluff's towers"},
            # Round 64: this stop was authored inside the carousel's own deck -- the carousel is a
            # solid 9 m round at x -1080 -- so the body could not stand there, the chip's glide
            # stalled three metres short of it, and the plaza's one stop was a promise the lane
            # could not keep. It stands on the open floor now, west of the wheel's axle and under
            # the western arc of its rim, with the queue rails and the ticket kiosk to the right
            # and the fun row behind. `yaw 4` looks up the street under the wheel's underside.
            # Round 64, second measurement: x 1300 was reachable on foot but not on the rail's
            # own terms -- the glide walks the straight line to the stop, and that line ran
            # through the strip's built edge (the arcade's back wall and the block behind it sit
            # at x 988..1440 across z 7870..8370), so the body stopped against a shopfront and
            # the chip's promise went unkept. The stop stands at x 830: the strip's kerb furniture
            # (its lamps, the iron posts that carry the light strings, the booths and the arcade)
            # all stand from x 853 eastward, and a walk from the lane's mouth to the plaza's own
            # floor has to pass west of them -- so the straight line to this stop is clear of the
            # kerb from either end, and the wheel's foot is 15.5 m east.
            # Round 64, third measurement: the view. `yaw 4` looked up the street under the
            # wheel's underside and framed a lamp post and 40 m of lane; the rim itself sits 71
            # degrees up, so from the plaza's floor it is never in the picture and the wheel is
            # read by its own legs and the queue it stands over. `yaw 78` frames that: the
            # A-frame leg dead ahead, the ticket kiosk and the two shades along the queue, the
            # fun row's roofline behind, and the plaza's paving running out to the horizon.
            {"z": 2960, "x": 830, "yaw": 78, "pitch": 8, "label": "under the SkyWheel"},
            {"z": 3480, "x": 0, "label": "the bridge approach"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 678, "z": 340, "y": 0, "ry": -90, "leaf": "#33414e",
                 "title": "Back through the centre", "hint": "It opens onto the hall, at the falls' "
                                                           "own table."},
        "back_to": "rooms-toronto.html#at-falls-n",
        "caveat": "The place is drawn from the map and the sources: the trail, the terrace and "
                  "Table Rock Centre's footprint and two storeys, the Horseshoe's brink, the American "
                  "and Bridal Veil falls, Goat and Luna Islands and the gorge's edges are "
                  "OpenStreetMap's; the 57 m drop, the American Falls' 21-30 m onto its boulders, the "
                  "bridge's 290 m arch, the Skylon's 160 m from a street 76 m over the lower river, "
                  "the bluff's 30 m rise (the Falls Incline Railway's 59.8 m of track at 30 degrees) "
                  "and the ten Fallsview hotels' places, heights and floors (Wikipedia's list of the "
                  "city's tallest buildings) are the sources'. Approximate and said so: the rim of the "
                  "gorge north of the terrace (drawn 30-40 m inland of the mapped water) and its 38 m "
                  "of sheer rock above the talus, the falling water's 24 m throw and the spray's "
                  "height, the woods' height on the islands and the bluff, the bluff's line away from "
                  "the railway, Table Rock Centre's 9.5 m eaves, its roofs and its cupola's place "
                  "(read from photographs), the hotels' footprints (30 m; the Tower Hotel's shaft "
                  "16 m) and their cladding, the parapet's measures (wall 60 cm, ironwork to 90 cm, "
                  "posts 96 cm every 3 m) and its iron's pattern, read from photographs at the brink, "
                  "the lamp posts' places. Left out and said so: the Sky "
                  "Screamer (a ride 2 km south), the Casino and Rainbow towers and the Sheraton on the "
                  "Falls down by the river (forms unsourced), and the far shores past two kilometres "
                  "(under two pixels tall from the rail). No crowds, no boats on the water, no "
                  "lettering, and no claim that the owner stood at the rail. The Parks line "
                  "downstream -- White Water Walk, the Aero Car, the Floral Clock, the Glen -- stays "
                  "in the drawer. Under the shed at the journey door's hand the lane keeps a game: "
                  "a raft and a bell, the mist's own noise answered in a toy — the shed is drawn, the "
                  "bell is not surveyed. Round 52 added the east end: the Parkway, Clifton's fun row, "
                  "the SkyWheel at its far end, and the Falls Incline. The wheel's measures are the "
                  "manufacturer's sheet; the strip's 500 m of street are the lane's 155, the bluff's "
                  "30 m are kept as 5.5, and the incline's 62-second crossing three when you ride it — each "
                  "compression stated by the thing compressed. The arcade fronts carry no shop: a "
                  "drawing may keep an arcade's glow, not its lease.",
    },
    {
        # Journey Behind the Falls (round 33; sources in TODO §0o). Not the bedrock strata and the
        # daylight sky the round-22 tunnel wore: the 1944 tunnel is concrete-lined and electrically
        # lit (niagarafrontier.com), a barrel vault over wet walls with lamps along one side (Niagara
        # Parks' own photograph), 2.4 m wide and about 2 m high. The lane is the main tunnel at its
        # measured 56 m, elevator to deck (falzguy.com); the branch to the portals leaves it on the
        # right 17 m in and is drawn running off to its two portals, 61 m and 110 m along; the far end
        # opens onto the upper deck on the cliff, 38 m under the rim, with the falls drawn from the
        # same surveyed model the promenade uses, seen from where the deck stands.
        "id": "journey", "label": "Behind the falls",
        "page": ROOM_BY_ID["journey"]["page"],
        "plates": ROOM_BY_ID["journey"]["plates"],
        "lane": {"w": 240, "d": 1931, "ceil": 260, "back": 160, "max_d": 6200, "vault": 60,
                 "lid": "tunnelc", "under": True, "open_end": True, "wallmat": "tunnelc"},
        "floor": "tunnel",
        "day": {"start": 0.5, "gain": 1},
        "purpose": "Journey Behind the Falls: the elevator's 38 m, the 1944 tunnel, the branch to the portals, the deck on the cliff",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/journey-cover.jpg",
        "cover_caption": "The curtain from the deck at the tunnel's mouth, drawn by the renderer.",
        "blurb": "The main tunnel walked from the elevator to the deck, 56 m of wet concrete "
                 "vault under Table Rock. The branch to the two portals opens on the right, and "
                 "at the far end the deck stands on the cliff with the Horseshoe's curtain beside it.",
        "clad_note": " The tunnel is concrete-lined, 2.4 m wide under a low barrel vault, wet, with "
                     "wet wooden boards underfoot, a galvanised service pipe and caged lamps along its "
                     "right wall. Nothing on any of it carries a word.",
        "sight_note": " Seventeen metres in, the branch to the portals runs off to the right, its "
                      "lamps receding to the Cataract Portal's daylight 61 m along and the Great "
                      "Falls Portal's at its end. At the deck the curtain stands on your right, "
                      "the basin and its spray ahead, Goat Island's cliff across the gorge and the "
                      "American Falls far down it on the left. After dark the curtain holds the "
                      "illumination's colour.",
        "objects": [
            # The branch's mouth in the right wall: its concrete reveal, the press that tells what
            # lies along it.
            {"id": "portal-jb", "kind": "portal", "x": 118, "z": 593, "y": 0, "ry": -90,
             "w": 373, "h": 200, "d": 2,
             "title": "The way to the portals",
             "hint": "A second tunnel, to the south-east: the Cataract Portal opens off it 61 m "
                     "along, the Great Falls Portal 49 m further, each at the end of a 16 m spur "
                     "where you stand about 7 m behind the falling water."},
            # The deck's front parapet: concrete with a pipe rail, the edge of the walk.
            {"id": "deckwall-jb", "kind": "deckwall", "x": 0, "z": 2172, "y": 0, "ry": 0,
             "w": 700, "h": 105, "d": 30,
             "title": "The upper deck",
             "hint": "The deck is 38 m under the rim at the foot of the cliff; the brink is 36 m over "
                     "your head and the basin 20 m below. The lower deck, 18 steps down, is shut in "
                     "deep winter for the ice."},
        ],
        "surfaces": [
            {"side": -1, "z0": -55, "z1": 1931, "y0": 0, "y1": 200, "kind": "tunnelc"},
            {"side": 1, "z0": -55, "z1": 528.6, "y0": 0, "y1": 200, "kind": "tunnelc"},
            {"side": 1, "z0": 528.6, "z1": 657.2, "y0": 0, "y1": 200, "kind": "open"},
            {"side": 1, "z0": 657.2, "z1": 1931, "y0": 0, "y1": 200, "kind": "tunnelc"},
            # Round 35: the service pipe the photographs of the tunnels show along the right wall,
            # galvanised, a coupling every 3 m, under the springing; it stops at the branch's jambs.
            {"side": 1, "z0": -55, "z1": 528.6, "y0": 182, "y1": 191, "kind": "pipe"},
            {"side": 1, "z0": 657.2, "z1": 1931, "y0": 182, "y1": 191, "kind": "pipe"},
        ],
        "lamps": [
            # Caged lamps on the right wall, the photograph's amber, every eight metres.
            {"x": 104, "y": 160, "z": z, "r": 60, "k": 0.55, "tint": "rgba(255,190,110,0.45)", "bulb": False}
            for z in (30, 300, 760, 1040, 1320, 1600, 1880)
        ],
        "backdrop": {
            "skyAround": NIAGARA_SKY,
            "world": {"prims": journey_world(LaneFrame(*JOURNEY_FRAME))},
        },
        "slots_title": "Places behind the falls",
        "slots": [
            {"label": "The Cataract Portal",
             "note": "Down the branch: the first of the two openings behind the sheet.",
             "state": "Held by the branch and its light; a photograph takes the slot when one arrives."},
            {"label": "The upper deck",
             "note": "On the cliff at the curtain's side, the brink 36 m overhead.",
             "state": "Held by the deck and the curtain; after dark the floodlights hold it."},
        ],
        "stations": [
            {"z": 20, "x": 0, "label": "the elevator landing"},
            {"z": 560, "x": 40, "label": "the branch to the portals"},
            {"z": 1880, "x": 0, "label": "the tunnel's mouth"},
            {"z": 2120, "x": 0, "label": "the upper deck"},
        ],
        "exit": {"id": "door-back", "kind": "door", "lift": True, "x": 0, "z": -46, "y": 0, "ry": 0,
                 "leaf": "#4a4e52",
                 "title": "The elevator up", "hint": "It climbs the 38 m to Table Rock Centre."},
        "back_to": "rooms-niagara.html#at-door-journey",
        "caveat": "Journey Behind the Falls is drawn from public facts: the 38 m descent, the 1944 "
                  "concrete-lined tunnel at its 2.4 m section, the main tunnel's 56 m to the deck, the "
                  "portal branch at 17 m with its portals at 61 m and 110 m (falzguy.com's measured "
                  "figures), the deck on the cliff, the nightly illumination. Approximate and said "
                  "so: the tunnel's bearing and the deck's exact place are read from the deck's "
                  "photographs and the tunnel's length, not surveyed; the section's 2.6 m crown, the "
                  "boards underfoot and the pipe along the wall are read from visitors' photographs "
                  "of the tunnels (Niagara Tours, mylifeisajourney.com); the branch is drawn straight; "
                  "the spray over the basin and the foam's reach are drawn to the photographs, not "
                  "measured. No crowds, no ponchos, no lettering, and no claim that the owner stood "
                  "on the deck.",
    },
    {
        # The CN Tower's LookOut, as it stands (round 33; sources in TODO §0o). The LookOut is a ring
        # of floor-to-ceiling window walls round the tower's core: 12 column bays of seven panes, each
        # 1.61 m wide and 2.62 m high (Daily Commercial News, 2017), so a ring about 43 m across.
        # The lane is one 18.6 m chord of it on the south-east side, walked north-east: the core on
        # the left, the glass on the right looking south-east over the harbour and the islands, the
        # far glass looking north-east at the financial district. The city out there is sourced
        # (`toronto_world`): shore/island geometry, all 117 towers of 150 m and over on Wikipedia's
        # list at their coordinates and heights, plus anonymous 100–150 m context polygons from the
        # City's 2025 massing data. It replaces a generic aerial tile worn on both hands, which no
        # bearing could be read off.
        "id": "cntower", "label": "The tower",
        "page": ROOM_BY_ID["cntower"]["page"],
        "plates": ROOM_BY_ID["cntower"]["plates"],
        "lane": {"w": 560, "d": 640, "ceil": 330, "back": 220, "lid": "acoustic", "wallmat": "core"},
        "floor": "carpet",
        # The city beyond the glass is held at night, so the room inside is too: without this the
        # LookOut's lamps followed the hall's four-minute day and brightened to noon under a night
        # sky (round 33: the tour's stops measured 134 falling to 94 for no reason in the place).
        "night": 0.92,
        "purpose": "The CN Tower's LookOut at 346 m: one stretch of its window ring, the city where it stands below",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/cntower-cover.jpg",
        "cover_caption": "The pod's own sheet: the city from above through the LookOut glass, drawn.",
        "blurb": "One stretch of the LookOut's ring at night: the core and its lifts on the left, "
                 "floor-to-ceiling glass on the right over the harbour and the islands, the glass "
                 "floor underfoot, and at the far end the financial district's towers.",
        "clad_note": " The lane is the LookOut at 346 m: carpet underfoot, an acoustic-tile ceiling, the "
                     "core's panelled wall on the left, and on the right the window wall's panes, "
                     "1.61 m each, floor to ceiling. Nothing on any of it carries a word.",
        # Only what the tour's frames show (round 34): the core, the towers north to Bloor (left
        # at the far glass), St. Clair and Eglinton as slivers on its horizon, SkyTower (right).
        # Humber Bay and Etobicoke are drawn too, but west, behind the core from this chord.
        "sight_note": " Out of the glass Toronto is where it is: the harbour's north shore "
                      "below, the Toronto Islands and Billy Bishop's runway lights to the south, "
                      "the Leslie Street Spit to the south-east, and through the far glass the "
                      "financial district -- First Canadian Place, Scotia Plaza, the St. Regis, "
                      "TD and Commerce Court -- and the towers going on north up Yonge and Bay "
                      "to Bloor, those at St. Clair and Eglinton thin on the horizon beyond; "
                      "towers line the harbour, and SkyTower at Pinnacle One Yonge stands to the "
                      "east, its roof about at your eye. The lower skyline between them uses anonymous "
                      "2025 massing polygons; city lights remain an aggregate density, not surveyed "
                      "street by street.",
        "objects": [
            # The lift landing in the core (landmark-space §7 beat 1): six glass-fronted cars, 58 s.
            {"id": "lift-cn", "kind": "door", "x": -278, "z": 60, "y": 0, "ry": 90,
             "leaf": "#2b3852",
             "glow": [{"r": 130, "k": 0.6, "dy": 210, "tint": "rgba(255,214,170,0.45)"}],
             "states": [{"say": "The lift doors, shut. The ride up is 58 seconds; here it is a press."},
                        {"door": 1, "say": "The doors stand open on the lit car."}],
             "title": "The lift doors",
             "hint": "Six glass-fronted lifts run the tower's shaft to the LookOut in 58 seconds."},
            # The LookOut's own glass floor (June 2017), set directly above the 1994 original on the
            # SkyTerrace level below (seesight-tours; CNN fast facts). Its size is not published:
            # it is drawn at the original's 24 m2. The floor under it is open to the city.
            {"id": "glassfloor-cn", "kind": "glassfloor", "x": 0, "z": 430, "y": 0, "ry": 0,
             "w": 480, "h": 4, "d": 500,
             "states": [{"say": "The LookOut's glass floor, above the 1994 original one level down."},
                        {"on": 1, "say": "On the glass: 346 m of air under it. Look down."}],
             "title": "The glass floor",
             "hint": "Added to the LookOut in 2017, directly above the world's first glass floor "
                     "(1994) on the SkyTerrace level 4 m below. Press to step on, press to step back."},
            # The SkyPod is 100 m higher by its own lift from this level, not a window at the end
            # of this one: its door is in the core.
            {"id": "lift-skypod", "kind": "door", "x": -278, "z": 560, "y": 0, "ry": 90,
             "leaf": "#3a4458",
             "states": [{"say": "The SkyPod lift, shut. Its deck is 446.5 m up, 33 storeys over this one."},
                        {"door": 1, "say": "Open: the SkyPod's own car, a separate ride from this level."}],
             "title": "The SkyPod lift",
             "hint": "The SkyPod, 446.5 m, is reached by its own lift from the LookOut level."},
        ],
        "surfaces": [
            {"side": -1, "z0": -76, "z1": 640, "y0": 0, "y1": 330, "kind": "core"},
            # The window wall: panes 1.61 m by 2.62 m, a dark soffit over them to the ceiling.
            {"side": 1, "z0": -76, "z1": 640, "y0": 0, "y1": 262, "kind": "glazing", "pitch": 161},
            {"side": 1, "z0": -76, "z1": 640, "y0": 262, "y1": 330, "kind": "soffit"},
        ],
        "lamps": [
            # Recessed downlights, low at night so the glass is a view and not a mirror.
            {"x": 0, "y": 320, "z": z, "r": 200, "k": 0.42} for z in (40, 200, 360, 520)
        ],
        # The far end is glass too, looking north-east; the core continues on its left.
        "vista": {"x": 40, "y0": 0, "y1": 262, "w": 480, "pitch": 161},
        "backdrop": {
            "skyAround": TORONTO_SKY,
            "world": {"prims": toronto_world(LaneFrame(5.18, -18.30, 0.0, 45.0))},
        },
        "slots_title": "Places in the tower",
        "slots": [
            {"label": "The tower at dusk",
             "note": "The story the hall's model opens first: the silhouette, the pod's city "
                      "from above, the drop under the glass.",
             "state": "Held by three drawn story frames; a photograph takes the slot when one arrives."},
            {"label": "The glass floor",
             "note": "The square of floor that is a window down to the city.",
             "state": "Held by the panel itself; no plate can stand in for 346 m."},
        ],
        "stations": [
            {"z": 20, "x": -60, "label": "the lift doors"},
            {"z": 200, "x": 160, "label": "the window wall, south-east"},
            {"z": 430, "x": 40, "label": "on the glass floor"},
            {"z": 500, "x": -40, "label": "the SkyPod lift"},
            {"z": 615, "x": 120, "label": "the north-east glass"},
        ],
        "exit": {"id": "door-back", "kind": "door", "lift": True, "x": 0, "z": -46, "y": 0, "ry": 0,
                 "leaf": "#2b3852",
                 "title": "The lift down", "hint": "It opens onto the hall, at the tower's own table."},
        # The landmark space owns its way back (the wiring loop respects an authored back_to): it
        # returns to the prop that owns it, not to the street -- the hall is the hub route in.
        "back_to": "rooms-toronto.html#at-tower-cn",
        "attribution": {
            "license_name": "Open Government Licence – Toronto",
            "license_url": "https://open.toronto.ca/open-data-licence/",
            "attribution_statement": "Contains information licensed under the Open Government Licence – Toronto.",
            "license_metadata_url": "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=387b2e3b-2a76-4199-8b3b-0b7d22e2ec10",
            "license_metadata_note": "Package notes also say ‘Further to the Open Government Licence’, while structured fields report license_id=notspecified and isopen=false; this metadata mismatch has not been clarified.",
            "source_name": "City of Toronto 3D Massing (2025)",
            "source_url": "https://open.toronto.ca/dataset/3d-massing/",
            "derivative_name": "School of Cities Toronto Building Heights (2025) map",
            "derivative_url": "https://schoolofcities.github.io/toronto-buildings/heights-2025",
        },
        "caveat": "The LookOut is drawn from public facts: 346 m, the window wall's 12 bays of 1.61 m "
                  "by 2.62 m panes, the glass floor of 2017 above the 1994 original, the SkyPod's own "
                  "lift. The city below uses OpenStreetMap shore and island geometry, all 117 listed "
                  "150 m+ towers at their published coordinates and heights, and 390 anonymous City "
                  "massing polygons with AVG_HEIGHT from 100 to under 150 m within 15 km. The latter "
                  "are source polygons, not 390 distinct buildings: parts near a listed tower are "
                  "left out to avoid doubling its proxy; footprints under 100 m² are omitted; remaining "
                  "outlines are simplified by 1.5 m and extruded to the field named AVG_HEIGHT (displayed by the "
                  "source map in metres); its definition is not independently verified, so it is an "
                  "approximate extrusion height here, not a surveyed roof maximum. The City supplies the model "
                  "for illustrative use and disclaims completeness, accuracy and fitness for precision "
                  "work. Other approximations remain: the LookOut ring is one straight chord, tower "
                  "footprints are typical squares, the Glass Floor's outline is approximate, the ground "
                  "is level, and lights between buildings are a city's density rather than surveyed "
                  "streets or windows. Nothing here names an unverified building or claims that the "
                  "owner stood at 346 m.",
    },
    {
        "id": "undeclared", "label": "Next district", "purpose": "Purpose not declared",
        "status": "soon",
        "blurb": "This one stays shut until its purpose is declared — travel, a conference, "
                 "or something else. That question is the first thing any new space answers, "
                 "and the answer is printed on the card above it.",
        "objects": [], "slots": [], "exit": None,
    },
    {
        # Round 52 (open Niagara, sources and the frame in TODO §R52): the American bank, seen
        # from its own island. The Canadian page opens its far curtain onto the Rainbow walkway;
        # this is what that walkway arrives at — no model table, no miniatures: the falls drawn
        # at their record size, standing across a lane that keeps their distances in the strip's
        # own measure, and saying so.
        "id": "goat", "label": "Goat Island",
        "page": ROOM_BY_ID["goat"]["page"],
        "plates": ROOM_BY_ID["goat"]["plates"],
        "purpose": "The American bank at its own measure: the Goat Island walk, Luna's bridge, the "
                   "boulder field the river got back in 1972, and Terrapin Point where the Horseshoe "
                   "is a wall of noise on the right",
        "status": "open",
        "kind": "personal",
        "blurb": "New York State, at the strip's measure: the foot of the Rainbow's walkway, the "
                 "timber deck out to Luna Island, the American Falls at its full 290 m of crest, and "
                 "Terrapin Point where the Canadian side of the same water stands closest.",
        "clad_note": (" The walk is a reservation, not a promenade: weathered timber decking and "
                      "dolostone coping where the rock comes out, low rails at the banks, the woods "
                      "closing over the path between points. Nothing on it carries a word."),
        "sight_note": (" Both drawings stand in one water: to the right the Horseshoe's curve and "
                       "the Canadian hotels behind it, straight ahead the American Falls over its "
                       "boulders with the Bridal Veil past Luna, and down-river the gorge the two "
                       "banks share. The Canadian page stands at these falls from the other side; "
                       "this page is where that page's far curtain opens."),
        # Round 69m: `d` is the lane's own floor and `max_d` is how far the visitor may walk. They
        # were 16240 and 15900 -- 3.4 m of paving beyond the last step -- and standing at the rail
        # (z 155.99) with the floor's far edge 6.4 m ahead, the paving filled the lower frame and
        # the brink beyond it was a 20 px band. A floor ends where the walk ends.
        "lane": {"w": 1500, "d": 5483, "ceil": 420, "back": 220, "max_d": 15900, "open": True,
                 "open_back": True, "open_end": True},
        "floor": "pavers",
        "day": {"start": 0.5, "gain": 1},
        # Round 58: the island had no world at all -- the lane and its props hung over the void, so
        # beyond the walk there was fog where 670 metres of falling water should be. The falls this
        # page is named for are the *same* surveyed curtains the Canadian page stands at (one
        # `niagara_world`, one geography, two viewpoints), so this page borrows that world instead
        # of drawing a second, differently-wrong one out of props. What the props can never do --
        # a crest line, water running at the brink, mist over the basin, the gorge's own walls --
        # that world already does.
        # Round 58: the island's walk is open air on both banks, and until now it was drawn as a
        # walled corridor — walls at ±750 stood between the visitor and the falls the page is named
        # for, which is why the brink was never in the frame. `open` strips the cladding: the west
        # side looks over the American bank, the east over the gorge.
        # Round 69m: `open` covered z 2150-3700 and 3900-4750 only, and the lane runs to 15900 --
        # so from 47.5 m on, every stop on this page stood in a sealed plaster corridor. Measured at
        # stop 2 (Terrapin Point, z 12180): the first thing in front of the eye was
        # `walk lane: pattern/plaster` at 13.3-15.7 m, 83% of the frame was empty sky, and the falls
        # the page is named for were not in any direction. A walk on an island is open air; the
        # backdrop draws what the walls were hiding. Both sides, the whole length, is the record of
        # the place, not a shortcut.
        "surfaces": [
            {"side": -1, "z0": 0, "z1": 15900, "y0": 0, "y1": 420, "kind": "open"},
            {"side": 1, "z0": 0, "z1": 15900, "y0": 0, "y1": 420, "kind": "open"},
        ],
        "objects": [
            # Round 57 put the sheet beside the lane; round 58 found that a sheet standing on the
            # ground is still a wall, however far off it stands — from the brink a falls is water at
            # your feet and then the drop. So this is a `drop` falls: its crest lies on the lane's
            # western edge at the walk's own height, the curtain hangs *below* it into the gorge, and
            # the walk looks over the lip. The crest's 5.6 km of scale-length is the American bank's
            # 290 m kept at the strip's measure; the drop is the sourced 21-30 m, kept at 10.34.
            # Round 69m: the crest and its sheet are the world's now (see `goat_world`), drawn by
            # the same shader as the Horseshoe's. The prop is the mark on the water.
            {"id": "falls-american", "kind": "landmark", "x": -3000, "z": 2450, "y": -900, "ry": 0,
             "w": 2000, "h": 900, "d": 20, "landmark": True,
             "title": "The American Falls",
             "hint": "290 metres of crest, a 21-to-30-metre drop onto the boulders below it — the "
                     "ledge they left there on purpose in 1969, when the river was dammed above "
                     "and the face cleaned for the first time in living memory. Three years of "
                     "silence, then the water came back over."},
            # Round 69m: this was a `falls` prop -- a 120 m sheet standing at x 3200 with its crest
            # 12 m *below* the walk and its end at z 103 m, so from Terrapin Point (z 121.8) the
            # falls the page is named for were behind the eye. The crest is the world's now: the
            # survey's own last 148 m, at the walk's own level, curving round the point. What is
            # left for the prop is the mark -- the same trade the Canadian page made in round 65.
            {"id": "falls-horseshoe", "kind": "landmark", "x": 2600, "z": 3448, "y": -1500, "ry": 0,
             "w": 2000, "h": 900, "d": 20, "landmark": True,
             "title": "The Horseshoe, from the American side",
             "hint": "57 metres over a curve that runs 670 round, the Canadian bank's own water. "
                     "From Terrapin Point it is not a fall in front of you; it is a wall of noise "
                     "to the right, nearer than the buildings behind it. Drawn from the record of "
                     "the place, at the record's size."},
            {"id": "luna-island", "kind": "island", "x": -690, "z": 1400, "y": 0, "ry": 0,
             "w": 300, "h": 46, "d": 200, "solid": False,
             "title": "Luna Island",
             "hint": "350 feet of dolostone between the American Falls and the Bridal Veil, named "
                     "for the moonbows the full moon used to throw into its mist — until the "
                     "banks started lighting the falls every night and no moon could compete. "
                     "Closed to visitors 1954-1972 while the rock beneath it was made safe."},
            {"id": "luna-bridge", "kind": "board", "x": -700, "z": 1760, "y": 0, "ry": 0,
             "w": 240, "h": 56, "d": 60, "leaf": "#33414e", "tile": "wood", "solid": True,
             "title": "The footbridge to Luna",
             "hint": "The pedestrian span Goat Island throws to its little sister. Walkable here; "
                     "in person it is a short crossing with water on both sides of it."},
            # Round 58: the talus stood at the walk's own height, 20 m above where the water lands,
            # so two grey cards hung in front of the sheet at the bottom of every frame. Rock under a
            # fall is at the foot of the fall.
            {"id": "boulders-e1", "kind": "box", "x": -4200, "z": 2120, "y": -1926, "ry": 90,
             "w": 900, "h": 320, "d": 700, "leaf": "#5d6068", "tile": "strata", "solid": False,
             "title": "The rock pile below the ledge",
             "hint": "Boulders the falls tore off its own lip, and the ones the engineers left "
                     "when they cleared the face in 1969. A falls into a rock pile is a shallower "
                     "fall; this one measures its drop to the boulders, not to the river."},
            {"id": "boulders-e2", "kind": "box", "x": -4300, "z": 2560, "y": -1926, "ry": 90,
             "w": 1100, "h": 260, "d": 800, "leaf": "#4c5560", "tile": "strata", "solid": False,
             "title": "More of the pile",
             "hint": "The talus runs the length of the pool below the American side."},
            {"id": "terrapin", "kind": "board", "x": 620, "z": 4200, "y": 0, "ry": 0,
             "w": 300, "h": 42, "d": 260, "leaf": "#5f5c55", "tile": "pavers", "solid": False,
             "title": "Terrapin Point",
             "hint": "The stone shelf at Goat Island's north end — the closest the United States "
                     "comes to the Horseshoe. The point has been rebuilt twice after rockfalls and "
                     "one ice storm; what you stand on is as much engineering as geology."},
            {"id": "rail-tp1", "kind": "parapet", "x": 660, "z": 4330, "y": 0, "ry": 90,
             "w": 40, "h": 96, "d": 40,
             "title": "The rail at Terrapin",
             "hint": "Iron on stone, the same kit the Canadian parapet uses; the two banks "
                     "standardised on keeping people back from the brink long ago."},
            # Round 69m: the far bank is drawn now (the Canadian shore at x 320 m, the American one
            # at -240), so these three are marks on water that exists instead of models of it. A
            # 4 m by 2 m "island" standing in for a bank 300 m off was a card with a card's copy on
            # it -- the copy is right, the body was the wrong shape for it.
            # Round 75: these three were marked `landmark`, which made them pressable -- and they are
            # 88 to 150 metres off the lane at the water's own level, so the reach that a landmark
            # gets (600 m) let one of them *win* against the falls and answer a press aimed at the
            # Horseshoe with a note about the trees on the far bank (`.verify/_reach.mjs`). They are
            # the far bank drawn as geometry, not places on this island: scenery now, with their
            # paragraphs in the written lane where every drawn thing's paragraph already lives.
            {"id": "woodline-c1", "kind": "landmark", "x": 8800, "z": 3448, "y": 400, "ry": 0,
             "w": 2000, "h": 900, "d": 20,
             "title": "The Canadian bank's trees, across the river",
             "hint": "The Table Rock promenade hides behind its own woodline from here; the "
                     "buildings rise above it and belong to the other drawing."},
            # Round 58: the water between the walk and the falls. Without it the drop hung over
            # nothing and the brink read as the edge of the drawing.
            # The far side of the water: on the American bank the falls face the Canadian gorge, and
            # without a far wall the brink hung over sky. Drawn at the strip's measure, like the rest.
            # Round 58: with the falls built as a brink, the water's own horizon is the sky — a
            # standing far-bank wall at the rail's own height filled the frame with a beige slab,
            # which is what it was: a 13 m wall 47 m away. What stands on the far side is the gorge
            # wall, and the gorge wall is *below* the crest.
            {"id": "channel-w", "kind": "pool", "x": -1500, "z": 2400, "y": -1900, "ry": 90,
             "w": 2700, "h": 14, "d": 10000, "solid": False,
             "title": "The channel between the island and the American bank",
             "hint": "The water the island splits: it runs past the walk before it goes over. Drawn "
                     "at the strip's measure, like every other distance on this page."},
            # Round 58: the plunge pool, west of the sheet and far below the crest — the water the
            # American Falls lands in. Without it the drop hung into nothing and the white at the
            # foot had no surface to sit on.
            {"id": "plunge-w", "kind": "pool", "x": -4000, "z": 2400, "y": -1900, "ry": 90,
             "w": 1800, "h": 14, "d": 10000, "solid": False,
             "title": "The pool under the American Falls",
             "hint": "The water lands in a basin of its own boulders rather than in the river, which "
                     "is why the American side is read as a fall onto rock and the Horseshoe as a "
                     "fall into water."},
            {"id": "channel-e", "kind": "landmark", "x": 12000, "z": 4138, "y": -2500, "ry": 0,
             "w": 2400, "h": 800, "d": 20,
             "title": "The gorge on the eastern side",
             "hint": "The same river after the drop, running north-east to the whirlpool. The "
                     "Canadian bank stands across it."},
            {"id": "pool-lower", "kind": "landmark", "x": 15000, "z": 7414, "y": -3000, "ry": 0,
             "w": 24000, "h": 900, "d": 20,
             "title": "The lower river, above the whirlpool",
             "hint": "Everything that goes over either falls ends here, running north-east toward "
                     "the whirlpool and the gorge. The water's colour is the gorge's own: a hard "
                     "green from the rock flour two falls grind out of the shelf."},
        ],
        "lamps": [
            {"x": -420, "y": 360, "z": 700, "r": 80, "k": 0.4},
            {"x": 420, "y": 360, "z": 2100, "r": 80, "k": 0.4},
            {"x": 2450, "y": 360, "z": 3700, "r": 85, "k": 0.42},
        ],
        # Round 69m: the world this page has been claiming since round 58, finally emitted.
        "backdrop": {"skyAround": NIAGARA_SKY, "world": {"prims": goat_world()}},
        "slots_title": "Places on the island",
        "slots": [
            {"label": "The American Falls at full height",
             "note": "The face 1969 drained, cleaned, and refilled; the boulders that stayed.",
             "state": "Held by the falls themselves; no plate takes the ledge's place."},
            {"label": "Terrapin Point",
             "note": "Where the United States meets the Horseshoe's noise.",
             "state": "Held by the point and its rail."},
        ],
        "stations": [
            {"z": 40, "x": 0, "label": "the foot of the Goat Island walk"},
            # Round 58: the stop's own pitch stays at 9 — it already looked *down* at the brink and
            # the flat frame the owner saw came from the painter, not from where the camera pointed.
            # (The drag in the harness aims by the opposite sign, which is how a round was spent
            # Round 69m: the rail is 3 m from this stop and 92 cm tall, so at the authored pitch of
            # 9 it hid everything below 14.6 degrees -- the American's sheet is 19.5 m deep and only
            # its top 6.7 m stood above the coping (`.preview/goat69mn/stop1-yaw-60-p6`). The stop
            # moved to the rail itself (x -700, 1.2 m from the coping at x -8.2) and turned to yaw
            # 285. Distance from a parapet is the whole composition: the sight line through a 96 cm
            # coping descends at atan(0.72 / d), so 3 m away it cuts the falls at 14 degrees while
            # 1.2 m away it cuts at 31 -- at the rail the coping is at the bottom of the frame and
            # the sheet is the frame.
            # turning this stop the wrong way before the frames were compared.)
            {"z": 2450, "x": -700, "yaw": 285, "pitch": 12, "label": "the rail at the American Falls"},
            # Round 69m: from the middle of the walk the falls cannot be in frame, and that is a
            # measurement now, not an opinion. The crest runs 6-17 m off the walk's right edge and
            # the sheet falls *away* from it, so mid-walk the frame is paving, rail, a 6 m channel
            # and sky: the authored geometry projected from (7.0, 121.8) put the curtain at 0-1 %
            # of the frame at every heading tried (62, 66, 75 -- three rounds of re-aiming, none of
            # which could have worked). What the middle of the walk does hold, level and looking
            # down the rail, is the water and the gorge past it.
            {"z": 4200, "x": 250, "yaw": 70, "pitch": 6, "label": "the rail above the upper river"},
            # Round 69m: the point itself, 3 m short of the floor's end. Projected at (7.0, 156.0)
            # yaw 6 pitch 12: 38 % sheet, 22 % lower river, 26 % sky, 6 % rail. The drop reads as a
            # drop. Both stops then moved in from the lane's edge (x 700 -> 250): the parapet stands
            # at x 7.85-8.35, so a station at 700 stood 0.7 m from a 92 cm wall, and the frame was a
            # stone diagonal with the falls behind it (`.preview/goat69mk`).
            {"z": 5379, "x": 250, "yaw": 88, "pitch": 14, "label": "Terrapin Point"},
        ],
        "exit": {"id": "curtain-home", "kind": "noren", "x": 0, "z": -46, "y": 172, "ry": 0,
                 "title": "The way back across the Rainbow",
                 "hint": "440 metres of steel opened 1 November 1941, and twenty minutes of "
                         "walkway back to Clifton Hill and the Canadian drawing of the same water."},
        "back_to": "rooms-niagara.html#at-curtain-rainbow",
        "caveat": "The American bank seen from its own island, at the strip's measure: the "
                  "American Falls' 290 m crest and 21-30 m drop onto the 1969 boulders, Luna "
                  "Island's 350 ft of dolostone and its 1954-72 closure, the Horseshoe's 57 m and "
                  "670 m read from the Canadian record, the Rainbow's dates — sources. The "
                  "island's walk line, the banks' woodlines, every height not named, and the "
                  "gap-bridges between 290-metre faces and a 160-metre lane: drawn, and said so. "
                  "The falls here are not miniatures: they are the same two curtains the Canadian "
                  "page stands at, seen from the other bank's side of the water.",    },
]
