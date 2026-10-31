"""`gen/render.py` — the walk's markup: the lane, its chrome, the drawer, and the story plate.

Turns one district record into the HTML the gate and the browser both read: `walk_html` builds the
layer, `district_drawer` the written-out lane, `rooms_plate_html` the frame plate, and `walk_object`
one prop's markup and press area. Split out of `_gen_html.py` in round 78 and proven byte-identical
on all 19 emitted pages; the entry point is `_gen_html.py`.
"""
from html import escape
import hashlib
import json
import math
from gen.districts import DISTRICTS
from gen.media import INDENT, poster_attrs
from gen.site import ICON_BOOK, ICON_BULB, ICON_CAMERA, ICON_CASE, ICON_CHAT, ICON_EXIT, ICON_FOV_IN, ICON_FOV_OUT, ICON_OUT, ICON_UP, ICON_X, ROOT, titled
from gen.world import EYE, KINDS, LANE_FALLBACK, OBJ_SIZE, WALK_SOLID_KINDS, Z_SCALE
def wall_frames(d):
    """A district's frames are objects before they are anything else: each hangs on a wall
    at a coordinate, so walking the lane and reading the content are the same list, and a
    frame the owner deletes from the data simply stops being on the wall."""
    out = []
    for n, fr in enumerate(d.get("frames", [])):
        # `wall: False` keeps a frame in the reel and the printed list but takes it off the wall,
        # for a district whose walls are built rather than illustrated.
        if fr.get("wall") is False:
            continue
        out.append({
            "id": f'frame-{fr["id"]}',
            "kind": "poster frame",
            "x": fr["x"], "z": fr["z"], "y": fr["y"], "ry": fr["ry"],
            "title": fr["title"], "hint": fr["caption"],
            "img": fr["src"], "alt": fr["alt"], "frame": n,
        })
    return out


def frames_section(districts):
    """The same frames as a plain list, because a rail you can only reach by walking is a
    rail a screen reader and a printed page cannot read."""
    rows = []
    for d in districts:
        for n, fr in enumerate(d.get("frames", [])):
            src = fr["src"]
            rows.append(
                f'<li class="frame-row" id="frame-{escape(d["id"])}-{escape(fr["id"])}" '
                f'data-row-obj="frame-{escape(fr["id"])}">'
                f'<figure class="frame-fig"><img src="{src}" alt="{escape(fr["alt"])}" '
                f'loading="lazy" {poster_attrs(src)} />'
                f'<figcaption>{escape(fr["caption"])}</figcaption></figure>'
                f'<p class="when"><span class="badge">{escape(KINDS[d["kind"]]["label"])}</span>'
                f' Generated frame {n + 1} of {len(d.get("frames", []))}.'
                f' <button type="button" class="frame-play" data-play="{n}">Play from here</button></p></li>')
    if not rows:
        return ""
    head = titled("h2", "Frames in this district", ICON_CAMERA, "block-title spaced")
    note = ('<p class="when">Each is a drawn depiction of a named place, hung on a wall at the '
            'distance printed beside it. None is a photograph, and none records that the owner '
            'stood there.</p>')
    return f'    {head}\n    {note}\n    <ul class="frame-list">\n      {INDENT.join(rows)}\n    </ul>'


def rooms_plate_html(districts):
    figures = []
    for d in districts:
        for n, fr in enumerate(d.get("frames", [])):
            figures.append(
                f'<figure class="story-frame" data-story-frame="{n}">'
                f'<img src="{fr["src"]}" alt="{escape(fr["alt"])}" {poster_attrs(fr["src"])} />'
                f'<figcaption>{escape(fr["title"])} — {escape(fr["caption"])}</figcaption></figure>')
    reel = ""
    if figures:
        joined = "\n      ".join(figures)
        reel = (
            '\n    <div class="story-segs" data-story-segs aria-hidden="true"></div>'
            f'\n    <div class="story-reel" data-story-reel>\n      {joined}\n    </div>'
            f'\n    <p class="story-count" data-story-count role="status">1 of {len(figures)}</p>'
            # Round 75: this line used to say "Tap the right two thirds ... Hold to pause", which is
            # the finger's vocabulary in a device that also has a keyboard -- and the plate has
            # answered `→` and `←` since it was built. A hint that names only the gesture you are not
            # using reads as a broken control.
            '\n    <p class="when">Right two thirds or \u2192 for the next frame, left third or '
            '\u2190 for the previous one. Hold to pause.</p>')
    return f'''<div class="modal" id="room-plate" role="dialog" aria-modal="true" aria-label="Frames in the lane">
  <div class="modal-backdrop" data-room-close></div>
  <div class="modal-panel">
    <button class="modal-close" type="button" data-room-close aria-label="Close">{ICON_X}</button>
    <a class="modal-close story-enter" data-enter-space hidden href="#"
       aria-label="Enter the space this story owns">{ICON_OUT}</a>
    <p class="eyebrow" data-room-where></p>
    <h2 data-room-title></h2>
    <p data-room-hint></p>{reel}
  </div>
</div>
'''


def walk_islands(d, placed):
    """The bulbs and the cables, as data, so the renderer cannot contradict a light nobody chose.

    Two JSON islands sit inside the hit layer: where the lamps are, and where the cables run. They are
    islands rather than drawing code because a scene lit by a guess reads as a flat wall the moment you
    turn towards it. Every bulb here is a depth authored by the district; the one derivation is the
    vending machine's glow, which rides on the prop because that is where that light would come from.

    Depths are record centimetres and go through Z_SCALE like any other record. Heights are real.
    """
    lane = d.get("lane", LANE_FALLBACK)
    ceiling = lane["ceil"] - 34
    lights = []
    for lamp in d.get("lamps", []):
        if isinstance(lamp, (int, float)):
            lights.append({"x": 0, "y": ceiling, "z": round(lamp * Z_SCALE), "r": 30})
        else:                       # authored whole: x, y, r, k, tint; z is still a record depth
            lights.append(dict(lamp, z=round(lamp["z"] * Z_SCALE)))
    wires = [{"a": list(w["a"][:2]) + [round(w["a"][2] * Z_SCALE)],
              "b": list(w["b"][:2]) + [round(w["b"][2] * Z_SCALE)], "sag": w["sag"]}
             for w in d.get("wires", [])]
    # Scene geometry travels as authored numbers only: the lights, the cables, the arcade, the
    # aperture, the far plane. An empty island is omitted rather than emitted as `[]`.
    # Lanterns are lights, so they join the light island rather than becoming a decoration the
    # lighting does not know about. `dy` lets a prop's glow sit where the fitting actually is.
    for o in placed:
        for g in o.get("glow", []):
            w, h, _dep = OBJ_SIZE.get(o["kind"], (120, 160, 12))
            h = o.get("h", h)
            # Two fields a glow inherits from the prop it belongs to, because both are the prop's
            # facts rather than the fitting's: `liton` (the phase at which this prop's windows come
            # up) and `spill` (a front that wears an awning is a shop, and a shop's light lands on
            # the pavement in front of it as a splash, not as a pool under a fitting). A record
            # field the emitter does not stamp never reaches the renderer — the trap `lane-prop` §7
            # records — so the inheritance happens here, in the one place that builds the island.
            lights.append({"x": o["x"], "y": o.get("y", 0) + g.get("dy", h - 18), "z": o["z"],
                           "r": g["r"], "k": g["k"], "bulb": False, "of": o["id"],
                           **({"tint": g["tint"]} if "tint" in g else {}),
                           **({"liton": o["liton"]} if o.get("liton") is not None else {}),
                           **({"spill": g.get("spill", 1)} if o.get("awn") else {}),
                           **({"spill": g["spill"]} if "spill" in g else {})})
    for L in d.get("lanterns", []):
        # The authored radius is the paper; how far the light reaches is a multiple of it. A glow with
        # no body is a smudge, so `size` and `h` travel with it and the renderer draws what it is told.
        # `z` goes through Z_SCALE here because a lantern's depth is a record, exactly like the cable it
        # hangs from and the wall it swings against — the two used to be in different spaces, which put
        # five lanterns in mid-air and their pools at the wrong depths.
        lights.append(dict(L, z=round(L["z"] * Z_SCALE), r=max(96, L["r"] * 3.4), size=L["r"],
                           h=L["y"] + round(L["r"] * 1.15),
                           k=0.72, bulb=False, tint="rgba(255,158,86,0.52)", body="lantern"))
    # Surfaces, marks and beams are depths in a district record, exactly like the objects: every z
    # coordinate goes through Z_SCALE so the cladding, the stripes on the floor, the beams overhead,
    # and the props on the wall all live in one scaled space. The first two rooms after Tokyo authored
    # these in record centimetres while Tokyo had them in scene centimetres, and nothing scaled them:
    # the walls stopped at the record's own d (Canada 400, Fukuoka 380) while the objects ran on to
    # walk_d (1160 / 1102), so the far half of each new room lost its cladding, its ground kit and its
    # beams. Tokyo's record has been rebased to record centimetres with it (the generated islands are
    # unchanged to the centimetre), and the convention is now one space everywhere.
    def _scale_band(s):
        s = dict(s)
        s["z0"] = round(s["z0"] * Z_SCALE)
        s["z1"] = round(s["z1"] * Z_SCALE)
        return s
    def _scale_mark(mk):
        mk = dict(mk)
        for k in ("z0", "z1"):
            if k in mk:
                mk[k] = round(mk[k] * Z_SCALE)
        return mk
    surfaces = [_scale_band(s) for s in d.get("surfaces", [])]
    marks    = [_scale_mark(m) for m in d.get("marks", [])]
    beams    = [round(b * Z_SCALE) for b in d.get("beams", [])]
    # Story frames a prop carries: the rail they open is per prop, not per district.
    stories = {o["id"]: o["story"] for o in placed if "story" in o}
    islands = [("data-walk-lights", lights), ("data-walk-wires", wires),
               ("data-walk-stories", stories),
               ("data-walk-beams", beams),
               ("data-walk-surfaces", surfaces), ("data-walk-marks", marks)]
    if d.get("vista"):
        islands.append(("data-walk-vista", d["vista"]))
    if d.get("backdrop"):
        islands.append(("data-walk-backdrop", d["backdrop"]))
    # P2 (round 69): the world data lives in its own file, not in the page.
    #
    # rooms-cntower.html was 722 KB, and 695 KB of it was one `data-walk-backdrop` island: a page of
    # markup that was 96% geometry. mrdoob/slop-newyork keeps exactly this separation — nyc-geodata.js
    # is data, its modules are behaviour — and it is the one thing in that repository this site can
    # copy. It needs no build step (the generator writes the file), no fetch (a plain <script> before
    # js/site.js, so the island is there synchronously) and no bundler.
    #
    # The island stays in the DOM as a marker carrying `data-place`, so the runtime and the gates ask
    # for the same attribute they always asked for: js/site.js's readAny falls through to
    # window.__HX_PLACES[place][name] when the marker has no text. Small islands stay inline — 2 KB
    # is not worth a request — so only the three big places move.
    place = d.get("id")
    inline, external = [], []
    for name, data in islands:
        if not data:
            continue
        body = json.dumps(data)
        (external if place and len(body) > 60000 else inline).append((name, body))
    tags = [f'<script type="application/json" {name}>{body}</script>' for name, body in inline]
    if external:
        payload = "{" + ",".join(f'"{name}":{body}' for name, body in external) + "}"
        bundle = ("/* Generated by _gen_html.py — do not edit by hand.\n"
                  f"   The world data for \"{place}\", out of the page (P2). Loaded by a plain script\n"
                  "   tag before js/site.js so it is synchronous, and versioned by its own hash. */\n"
                  "window.__HX_PLACES=window.__HX_PLACES||{};\n"
                  f"window.__HX_PLACES[\"{place}\"]={payload};\n")
        out_dir = ROOT / "js" / "places"
        out_dir.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha1(bundle.encode("utf-8")).hexdigest()[:10]
        (out_dir / f"{place}.js").write_text(bundle, encoding="utf-8")
        tags += [f'<script type="application/json" {name} data-place="{place}"></script>'
                 for name, _body in external]
        tags.append(f'<script src="js/places/{place}.js?v={digest}"></script>')
    return "\n      ".join(tags)


# The body a visitor brings into a lane: a cylinder from 25 cm (the ankles, above the floor kit)
# to 180 cm (a head on a 168 cm eye), radius 24 cm where it meets a prop. A prop blocks the walk
# when it *occupies that cylinder* — not, as the first implementation had it, when it happens to
# start on the floor.
#
# That "starts on the floor" test (`y <= 0 < y + h`) was a proxy for "is a thing you can walk into",
# and it was wrong in both directions: it made nothing of a sandwich board authored at y 150 (its
# legs are not modelled, so the board floats at your chest and you walk straight through it), and it
# made nothing of the Moji Port High Mart's base, the basin's edge, Niagara's bluff and the funicular
# car — all `kind: board`, none of them in WALK_SOLID_KINDS. Round 57 walked every room and the
# symptom was reported before it was diagnosed: "好像有物件卡在我身上". Standing inside a box is not a
# near miss; the camera ends up inside the box and the frame fills with its inner face.
BODY_LO, BODY_HI, BODY_MIN = 25, 180, 25
PLAYER_RADIUS = 24


def blocks_body(o, lane_half):
    """Does this prop stand in the walkable band across the height a body occupies?

    Three things are deliberately not blockers: a record's own `solid` (it wins, either way), a
    prop marked `passable` (a portal is an opening's press box — skills/lane-prop), and anything
    whose overlap with the body is thinner than BODY_MIN, which is every drain, painted line and
    glass floor. The band test uses the *reachable* half-width, so a poster hung flush to the wall
    (its face a few centimetres inside the wall line) never becomes an obstacle.
    """
    if o.get("passable"):
        return False
    y = o.get("y", 0)
    h = o.get("h", OBJ_SIZE.get(o["kind"], (120, 160, 12))[1])
    if min(y + h, BODY_HI) - max(y, BODY_LO) < BODY_MIN:
        return False
    # A prop smaller than the body can never contain the body, however close it stands: a 14 cm tree
    # on a tabletop, a 25 cm wheel mast, a 40 cm rail post. The test is a *containment* test, so a
    # prop narrower than the body's diameter is out — as a disc, which is what a body is against a
    # round trunk (measured: three street trees on the Toronto table were being called obstacles).
    w = o.get("w", OBJ_SIZE.get(o["kind"], (120, 160, 12))[0])
    dep = o.get("d", OBJ_SIZE.get(o["kind"], (120, 160, 12))[2])
    ry = math.radians(o.get("ry", 0))
    hx = (w * abs(math.cos(ry)) + dep * abs(math.sin(ry))) / 2
    hz = (w * abs(math.sin(ry)) + dep * abs(math.cos(ry))) / 2
    if hx * hz <= PLAYER_RADIUS ** 2:
        return False
    # A prop clears the walk when the body's *circle* can pass it, so the test is a distance: the
    # straightest body-to-box gap, not "is its centre outside the lane". The latter called a
    # thumbnail on a table 70 cm in from the wall a walk obstacle — it is not in the path at all.
    return gap_to_box(o.get("x", 0), o.get("z", 0), hx, hz) < lane_half - PLAYER_RADIUS


def gap_to_box(bx, bz, hx, hz):
    """The shortest distance from the centre line of the walk to a prop's ground rectangle."""
    return max(0.0, abs(bx) - hx)


# Round 65: what is a target, and what is only scenery.
#
# The owner: "every interactive object should not have too many click targets, and not every
# small object needs to pop an interface or be selectable -- I want to click a waterfall and it
# is very hard". The repo's own rule already answers it (skills/district-author section 8): a
# press target has to be a *verb*, and "if pressing a thing only opens a card that describes it,
# what was interactive was the caption, not the room".
#
# A district's lamps, bins, benches, planters, posts, rails, kerbs and drains are exactly that:
# captions. They are drawn, they are not pressable, they are not announced, and their written
# notes move to the lane's list -- "the lane, written out" -- where the prose already lives. What
# stays a target is a place: a shopfront, a door, a stall, a ride, the model halls, the water, the
# bridges, and anything the record gives states to (it does something when pressed) or a way out.
PLACE_KINDS = {
    "front", "shopbay", "door", "open", "foodstall", "wheel", "carousel", "incline", "pool",
    "island", "falls", "ship", "boat", "drawbridge", "stationfront", "customhouse", "osakashosen",
    "dalianhall", "retrohighmart", "tower", "skyline", "dome", "track", "tram", "massing", "gate",
    "portal", "deckwall", "glassfloor", "plinth", "hall", "hallbase", "hallplaster", "figure",
    "art", "academic", "identity", "poster", "vending",
}


def is_target(o):
    """True when a prop is a thing a visitor presses, and false when it is only scenery.

    Round 73, the owner's second ruling on the same subject: 「全部拿掉多餘的。你只要真的有意義的物件才
    留著，這裡面很多都是真的會導致操作很煩。」 A thing earns a press only by *doing* something that
    takes the visitor out of the thing itself:

        leave          it goes somewhere          (a door, a curtain, the way out)
        story, frame   it shows photographs       (the reel, a picture hung on a wall)
        ride           it carries you             (the Falls Incline)
        game, demo     it plays                   (the goldfish stall, the bridge, the basins)
        landmark       it is what the place is named for, and its record is the content

    Two things are pressed because they are *used* rather than looked at, and their state is what
    standing there is for: a door you open, and the LookOut's glass floor you step onto
    (`states` on kind `door` or `glassfloor`). Everything else that changes only its own paint --
    the seventeen shutters, arcade fronts, plaza fronts, funhouse and ticket kiosk -- is the
    painting: pressing one used to open a paragraph about a shutter, which is precisely the
    interface the owner called superfluous.

    What this replaced: `kind in PLACE_KINDS` (forty kinds, so every shop bay, every plinth, every
    "stand" for a model, every massing block, the model towers, the ferry and the vending machines
    were all buttons) plus `o.get("place")`. Together they made **107 of the site's 245 props**
    pressable, and 53 of those did nothing but show a card. The rule above leaves **40**, and every
    one of them is a verb.

    The 71-round lesson survives in the `game`/`ride`/`demo` line: a prop that *does* something is a
    target whatever it is made of (the goldfish stall is `kind: "board"`, which is scenery, and the
    tap that used to reach it was removed), so behaviour outranks material here and nowhere else.
    """
    if o.get("leave") or o.get("story") or o.get("frame") is not None:
        return True
    if o.get("game") or o.get("ride") or ("demo" in o):
        return True
    if o.get("landmark"):
        return True
    if o.get("states") and o.get("kind") in ("door", "glassfloor"):
        return True
    return False


# Round 74, the owner's refinement of the same subject: 「只留該需要用文字彈出介面介紹的物件。其他就像你說的
# 可以用E去互動看有沒有變化。你如果全部都做出彈出介面 這很傷使用者體驗。」 So a press is not only
# "answered" -- it is answered *in the way the thing deserves*, and text is the last resort:
#
#     leave    you go through it                       no surface
#     photos   it shows you photographs                the reel (pictures, not prose)
#     ride     it carries you                          no surface
#     play     it plays                                the toy
#     try      it demonstrates                         no surface
#     use      it opens / it comes on                  no surface
#     read     **there is nothing to show**            the one text card on the site
#
# Precedence is the whole point: a thing that has something to show never asks to be read. The order
# below is the order of the test, and `read` is only reached by a landmark -- an object whose entire
# content is what is written about it. That is why the card may exist again: `showCard` opens it from
# this one verb and from nowhere else, and `.verify/verify-ux.mjs` fails the build if any other verb
# so much as touches it.
def press_verb(o):
    """What a press on this prop will do, in the one word the visitor is shown beforehand."""
    if o.get("leave"):
        return "leave"
    if o.get("story") or o.get("frame") is not None:
        return "photos"
    if o.get("ride"):
        return "ride"
    if o.get("game"):
        return "play"
    if "demo" in o:
        return "try"
    if o.get("states") and o.get("kind") in ("door", "glassfloor"):
        return "use"
    if o.get("landmark"):
        return "read"
    return ""


# The written lane's phrasing of the same verb. One table, so the row and the bar cannot disagree
# about what pressing the thing does -- the defect that cost round 71 a day was two names for one
# thing.
VERB_PHRASE = {
    "leave": "the way out",
    "photos": "its photographs",
    "ride": "a ride",
    "play": "a game",
    "try": "a demonstration",
    "use": "how it opens",
    "read": "its record",
}


def walk_object(o, lane_half=10 ** 6):
    """One wall thing, expressed as a rectangle in centimetres plus whatever is painted on it.

    The renderer needs geometry, the keyboard needs a stop, and the screen reader needs a name — the
    same three numbers serve all three, so the button *is* the picture's bounding box on screen and
    can never drift away from the thing it stands for.
    """
    w, h, dep = OBJ_SIZE.get(o["kind"], (120, 160, 12))
    # A record may shrink or grow a prop — the miniature tables in the Toronto hall reuse the
    # site's shapes at tabletop scale. The override rides the same data-w/-h/-d attributes the
    # renderer already reads, so the hit box and the picture cannot disagree about the size.
    w, h, dep = o.get("w", w), o.get("h", h), o.get("d", dep)
    tex = o.get("img", "")
    style = (f'--x:{o["x"]}px;--z:{o["z"]}px;--y:{o.get("y", 0)}px;--ry:{o.get("ry", 0)}deg;'
             f'--w:{w}px;--h:{h}px;--d:{dep}px')
    # Only a footprint grounded on the walkable floor blocks the visitor. A plinth's top is solid,
    # but the miniature buildings it carries are not separate room-scale obstacles; steps and floor
    # marks remain walkable. The explicit record field wins when a particular object needs an override.
    y = o.get("y", 0)
    solid = o.get("solid", o["kind"] in WALK_SOLID_KINDS and y <= 0 < y + h or blocks_body(o, lane_half))
    solid_attr = ' data-solid="true"' if solid else ""
    frame = f' data-frame="{o["frame"]}"' if "frame" in o else ""
    # A landmark prop owns a space: the story it opens first, and the district beside the story.
    story_attr = f' data-story="{escape(o["id"])}"' if "story" in o else ""
    # The one prop that is not scenery: the record says where it goes and the renderer obeys, so the
    # curtain leaving the lane is a link in the data, not a special case in the script.
    leave = f' data-leave="{escape(o["leave"])}"' if o.get("leave") else ""
    texture = f' data-tex="{escape(tex)}"' if tex else ""
    # A door may carry its own leaf colour: the street's three doors are three different doors.
    leaf_attr = f' data-leaf="{escape(o["leaf"])}"' if o.get("leaf") else ""
    # A diorama table authors its own ground: the lid carries the terrain tile the record names.
    top_attr = f' data-top="{escape(o["top"])}"' if o.get("top") else ""
    # `liton` is the phase in the room's own day at which this prop's lights come up, so the
    # district can light one building after another instead of switching the whole quay on at once.
    liton_attr = f' data-liton="{o["liton"]}"' if o.get("liton") is not None else ""
    # The retail kit of a shopping-street front: the canvas colour, the noren cloth and the fascia
    # board travel in the document like a door's leaf colour, or the renderer never sees them.
    awn_attr = f' data-awn="{escape(o["awn"])}"' if o.get("awn") else ""
    noren_attr = f' data-noren="{escape(o["noren"])}"' if o.get("noren") else ""
    fascia_attr = f' data-fascia="{escape(o["fascia"])}"' if o.get("fascia") else ""
    # Round 32: what a real place needed that the street's kit never did -- a shop bay's mural ground
    # and posts, a skyline's named towers, a bascule's split, a harbour boat's run. They travel in the
    # document like an awning colour, or the renderer never sees them (lane-prop section 7).
    extra_attr = "".join(
        # an uppercase letter in an authored key becomes a dash on the page: HTML lowercases
        # attributes, and `dataset.rideX` is only ever fed by `data-ride-x`
        f' data-{"".join("-" + c.lower() if c.isupper() else c for c in k)}="{escape(v if isinstance(v, str) else json.dumps(v, separators=(",", ":")))}"'
        for k, v in ((k, o[k]) for k in ("mural", "posts", "towers", "leaves", "run", "lift", "blocks",
                                         "footprint", "floors", "observation", "game", "demo",
                                         "ride", "rideX", "rideTop", "dia", "axle", "turn",
                                         "phase0", "deck", "period",
                                         # Round 58: a brink-built falls, and the tile a slab wears
                                         # Round 63: a block's storeys
                                         "drop", "tile", "win", "wincol") if k in o))
    # `data-states` is the whole interaction contract, in the document rather than in the script: a
    # prop can be done-to only as far as the district said, and the count of stops is the count of
    # presses before it comes round again.
    states = ""
    # Round 73: a thing that only changes its own paint ships no interaction contract at all, so the
    # frontages stop carrying twenty lines of JSON nobody can reach. `states` in the document means
    # "this is a thing you use", and after `is_target` that is a door or the glass floor.
    if o.get("states") and is_target(o):
        # The index ships in the document, not only in memory: what stop a thing is at is part of the
        # page's state, and a reader who never presses anything still gets told where it starts.
        states = (f' data-states="{escape(json.dumps(o["states"], ensure_ascii=False))}"'
                  f' data-state="{o.get("state", 0)}"')
    # A stall's whole body is the CSS of .walk-stall (its comment: awning, counter, basin — every
    # colour borrowed, no geometry surveyed); the class rides the class list, or the dressed button
    # and the painted prop cannot disagree about what the stall looks like.
    stall = " walk-stall" if o.get("game") else ""
    # Round 54: the record's kind rides the button so the site stops deriving it from the id.
    # An id like `luna-island` was an island only if the prefix heuristic happened to agree; the
    # authored field is the truth, and the shape table reads it directly now.
    kind_attr = f' data-kind="{escape(o["kind"])}"' if o.get("kind") else ""
    # Round 65: a prop that is only scenery says so in the document. The renderer draws it, the
    # walk does not stop for it, the pointer does not press it, and the lane's list carries its
    # note instead of a card in the middle of the picture.
    quiet_attr = "" if is_target(o) else ' data-quiet="1" tabindex="-1"'
    # Round 74: and it says what pressing it will do, before the press. The bar and the reach prompt
    # read this one word (js/site.js `VERB_WORD`), so a visitor is never asked to press something and
    # find out afterwards what kind of answer it gives.
    verb_attr = f' data-verb="{press_verb(o)}"' if is_target(o) else ""
    # A landmark stands for something far and large: the falls over the gorge, the bridge across
    # it. It is a target with a long reach and a marker of its own, because the thing it names is
    # not within a hand's reach of anywhere the visitor can stand.
    landmark_attr = ' data-landmark="1"' if o.get("landmark") else ""
    return (f'<button type="button" class="walk-hit{stall}" data-obj="{escape(o["id"])}" '
            f'aria-label="{escape(o["title"])}" data-title="{escape(o["title"])}" '
            f'data-hint="{escape(o["hint"])}" data-ry="{o.get("ry", 0)}" data-w="{w}" data-h="{h}" '
            f'data-d="{dep}"{solid_attr}{kind_attr} style="{style}"{frame}{texture}{leaf_attr}{top_attr}{liton_attr}'
            f'{states}{leave}{awn_attr}{noren_attr}{fascia_attr}{story_attr}{extra_attr}'
            f'{verb_attr}{quiet_attr}{landmark_attr}></button>')


def walk_html(d, drawer):
    """The whole viewport is the space; every control is a head-up display floating on it.

    Where leaving goes is one authored value, used twice: the corner control and the curtain at your
    back are the same door, read from the same field, so the key and the prop cannot point different
    ways. A top-level place returns to the hub street; a landmark or owned sub-space returns to the
    room whose object brought you there. Only the three main places have doors on the street or cards
    on Field notes; the CV is one click further on from the album's own navigation.

    That is the reference's arrangement, read as an architecture rather than as a style: one route,
    the building owns the screen, the picker and the reading live in overlays that appear on
    request. So there is no doorway to click through any more — arriving at this page *is*
    entering, and the CV is a link away in the corner rather than a frame around it.

    Geometry: 1 px = 1 cm, the eye at EYE, and a box closed on six sides so that turning around
    always shows the space instead of its edge. Objects keep their authored coordinates and are
    pushed down the lane by Z_SCALE, which is a rendering constant and not a fact about the record.
    """
    lane = d.get("lane", LANE_FALLBACK)
    walk_d = round(lane["d"] * Z_SCALE)
    objects = list(d["objects"]) + wall_frames(d)
    if d["exit"]:
        # Leaving this room means arriving on the hub street — from every room, without exception.
        # The target is decided by the emitter (back_to), not by the record, so a place does not
        # have to know what exists on the other side of its own curtain. Doors between rooms are
        # objects in the street's own record, not per-room wiring.
        objects.append(dict(d["exit"], leave=d.get("back_to", "activities.html")))
    parts = []
    placed = []
    # The half-width a body can reach at a depth: the lane's own half, widened where the record
    # says the walk opens (Clifton's strip and its square). Round 64: `blocks_body` was reading the
    # lane's *nominal* half, so every prop standing inside the strip's wider band -- the booths, the
    # shopfronts, the kiosks -- was judged clear of a walk it was standing in, and the body walked
    # straight through the canvas. The half a prop is measured against is the half a visitor can
    # reach, which is what that function's own comment says it wants.
    ws_bands = [[round(a * Z_SCALE), round(b * Z_SCALE), c] for a, b, c in lane.get("ws", [])]
    def walk_half_at(z):
        half = lane["w"] / 2
        for a, b, c in ws_bands:
            if a <= z <= b: half = max(half, c)
        return half
    for o in objects:
        o = dict(o)
        o["z"] = round(o["z"] * Z_SCALE)
        placed.append(o)
        parts.append(walk_object(o, walk_half_at(o["z"])))
    chips = []
    for n, st in enumerate(d["stations"]):
        # A tick, not a caption: where the words go is the card, and the accessible name is what a
        # screen reader gets without anything being painted over the space.
        view = "".join(f' data-view-{key}="{st[key]}"' for key in ("yaw", "pitch", "h") if key in st)
        chips.append(
            f'<button type="button" class="walk-stop" data-walk-stop="{n}"{view} '
            f'style="--z:{round(st["z"] * Z_SCALE)}px;--p:{st["z"] * Z_SCALE / walk_d:.3f}'
            f'{f";--x:{st[chr(120)]}px" if "x" in st else ""}" '
            f'aria-label="{escape(st["label"])}, {round(st["z"] * Z_SCALE)} cm in"></button>')
    links = []
    for n, fr in enumerate(d.get("frames", [])):
        side = "left" if fr["x"] < 0 else ("right" if fr["x"] > 0 else "end")
        depth = fr["z"] * Z_SCALE / 100
        links.append(
            f'<li><button type="button" data-walk-to="{round(fr["z"] * Z_SCALE)}">'
            f'{escape(fr["title"])}</button> <span class="when">{side} wall, {depth:.1f} m in · '
            f'frame {n + 1} of {len(d.get("frames", []))}</span></li>')
    for o in placed:
        if "story" in o:
            links.append(
                f'<li><a href="{escape(o["story"]["space"])}">Step into {escape(o["title"])}</a>' 
                f' <span class="when">the space the model owns, one press away in the lane</span></li>')
    label = escape(d["label"])
    did = escape(d["id"])
    # Round 65: the small things are scenery now -- they are drawn, they are not pressed, and they
    # do not stop the walk -- so their written notes move here, into the lane written out. Nothing is
    # lost by quieting them: the prose was always the point, and a card in the middle of the
    # picture was only ever a way of reading it.
    # Round 73: this is now the only place a thing's note is read, so it lists *every* drawn thing, in
    # the order you walk past it, and says which ones answer a press and what the press does. The card
    # that used to carry these paragraphs in the middle of the picture is no longer reachable from a
    # prop at all; a landmark's "record" is the row this list opens on.
    # The lane's phrasing is the same table the button carries (round 74): one word decides both,
    # so a row can never promise a press the bar does not make.
    def verb_of(o):
        return VERB_PHRASE.get(press_verb(o), "")
    small_things = ""
    if placed:
        rows = []
        for o in sorted(placed, key=lambda q: q["z"]):
            verb = verb_of(o)
            does = f' <span class="thing-does">press E — {escape(verb)}</span>' if verb else ""
            cls = ' class="is-pressable"' if verb else ""
            rows.append(f'<li id="thing-{escape(o["id"])}"{cls}>'
                        f'<b>{escape(o["title"])}</b>{does} '
                        f'<span class="when">{escape(o["hint"])}</span></li>')
        small_things = f"""
    <details class="walk-things" data-walk-things>
      <summary>The things here ({len(placed)})</summary>
      <ul>{"".join(rows)}</ul>
    </details>"""
    # What a screen reader is told the space is, in the same breath as the controls. The room's own
    # cladding is what you are walking through and the sightline is only where it ends, so the space is
    # described first and the view second; both halves are conditional on the data, because a district
    # with no aperture must not promise one and a district with no cladding must not claim a material.
    clad = (" The lane is dressed as a street: shutters and glazed tile at hand height, board-formed "
            "concrete and sheets of galvanised steel above them, plaster and plywood hoarding further "
            "down, paper lanterns hung on the wires it is wired with, a tactile guide path along both "
            "kerbs, and against the fronts a convex mirror, a meter box, a standpipe, a ladder, a "
            "telephone box, bicycles, planters, a litter crate and a blank folding board. Nothing on "
            "any of it carries a word." if d.get("surfaces") else "")
    clad = d.get("clad_note", clad)
    sight = (" At its far end the lane opens onto a drawn compound: a crossing below it, a tower, and "
             "a mountain beyond. Nothing out there is a record of anybody standing in it."
             if d.get("vista") else "")
    sight = d.get("sight_note", sight)
    # An open-world far end: the record authors how far the walker may keep going (walk units), and
    # the renderer lets the world continue past the last wall. Absent, the clamp is the wall itself.
    # z is depth (record units, ×2.9); the standing height and the x-band of a floor are the
    # lane's own scene centimetres, the same axes `w` rides — they cross the page unscaled
    floors = [[round(a * Z_SCALE), round(b * Z_SCALE), h, x0, x1] for a, b, h, x0, x1 in lane["floors"]] \
        if lane.get("floors") else []
    widths = [[round(a * Z_SCALE), round(b * Z_SCALE), c] for a, b, c in lane["ws"]] if lane.get("ws") else []
    floors_attr = f' data-lane-floors=\'{json.dumps(floors, separators=(",", ":"))}\'' if floors else ""
    ws_attr = f' data-lane-ws=\'{json.dumps(widths, separators=(",", ":"))}\'' if widths else ""
    # Round 61: the paving's own width, where the street's is wider than the walk. See the note in
    # the renderer's `pavedAt`: a square's front row stands on its paving, not past it.
    paveds = [[round(a * Z_SCALE), round(b * Z_SCALE), c] for a, b, c in lane["wsp"]] if lane.get("wsp") else []
    ws_attr += f' data-lane-wsp=\'{json.dumps(paveds, separators=(",", ":"))}\'' if paveds else ""
    # Round 77: the plan-view strip and the banner comment that outlived it are gone together. Round 72
    # removed the banner (a surface that appeared on every seam crossing) and cut the strip's four CSS
    # rules in the same commit while its message said the strip survived — so for five rounds the page
    # carried spans nothing could see, and a comment claiming they marked the seams. Nothing pops now:
    # the district drawer names the district, and the lane is its own map.
    max_d_attr = f' data-lane-max-d="{lane["max_d"]}"' if lane.get("max_d") else ""
    # A street with nothing over it (Nakamise) says so, and the renderer draws no lid.
    max_d_attr += ' data-lane-open="1"' if lane.get("open") else ""
    # Round 33: the rest of the shell is the place's -- what the ceiling is made of, a vault's rise,
    # no wall behind or ahead, a lane underground (the renderer's `LID`/`VAULT`/`OPEN_*`/`UNDER`).
    max_d_attr += f' data-lane-lid="{escape(lane["lid"])}"' if lane.get("lid") else ""
    max_d_attr += f' data-lane-vault="{lane["vault"]}"' if lane.get("vault") else ""
    max_d_attr += ' data-lane-open-back="1"' if lane.get("open_back") else ""
    max_d_attr += ' data-lane-open-end="1"' if lane.get("open_end") else ""
    max_d_attr += ' data-lane-under="1"' if lane.get("under") else ""
    max_d_attr += f' data-lane-wallmat="{escape(lane["wallmat"])}"' if lane.get("wallmat") else ""
    # A place may own its ground: the pod walks on dark steel, not the street's concrete.
    # A space with `"exit": None` is left the way it was entered — through a door that names
    # where it goes — so the lane gets no exit button of its own (round 51).
    if d.get("exit"):
        exit_html = (f'<a class="walk-icon walk-exit" href="{escape(d.get("back_to", "activities.html"))}"'
                     f' data-walk-exit aria-label="Leave the lane">{ICON_EXIT}</a>')
    else:
        exit_html = ('<span class="walk-icon walk-exit is-entrance" aria-hidden="true"'
                     ' title="This lane is left through its own doors">{ICON_EXIT}</span>')
    floor_attr = f' data-floor="{d["floor"]}"' if d.get("floor") else ""
    # A place whose subject is the day: `"day": True` on the record, or a dict to author the hour it
    # opens at and how strong the sun is (`{"start": 0.45, "gain": 1}`). The renderer reads both off
    # the layer, like the lane box and the eye — the day of a place belongs to the place, and the two
    # rooms whose subject is dusk simply do not say it. (Until round 76 this dict also carried
    # `cycle`, in seconds, for a page clock the site no longer runs: the hour is the visitor's.)
    day = d.get("day")
    day_attr = ""
    # A place held at one hour of the night (`"night": 0.92`, the cycle's phase): the clock stops
    # there, for a room whose window shows a night that does not move.
    if d.get("night"):
        day_attr = f' data-lane-night="{d["night"]}"'
    # The hour is the visitor's (round 49): one button trades the authored day for night, the
    # choice carries across lanes, and a place held at its own fixed night gets no button at all.
    # The stall dialog (round 50): one panel per lane, generated only where the wall actually has
    # a stall, and worded so it says out loud what it is — a toy, not a survey.
    game_html = ""
    if any(o.get("game") for o in d["objects"]):
        game_html = """
  <div class="walk-game" data-walk-game role="dialog" aria-modal="true" hidden>
    <div class="walk-game-head">
      <b class="walk-game-title" data-game-title></b>
      <button type="button" class="walk-game-close" data-game-close aria-label="Close the stall game">close</button>
    </div>
    <canvas class="walk-game-canvas" width="640" height="400"></canvas>
    <p class="walk-game-status" data-game-status role="status"></p>
    <p class="walk-game-note">A toy, not a survey: the stalls of a festival lane stand at no surveyed address, and no button here claims one.</p>
  </div>"""
    # Nothing to draw with. Round 54 deleted the second picture on the owner's ruling, so a visitor
    # whose browser has no WebGL used to get an empty navy grid and one sentence three interactions
    # away inside the info card. The lane now says it in the viewport it cannot fill — and only the
    # sentence is words: the rails, the list and the compiled state keep answering, which is what
    # the panel promises. Round 55 rendered the no-WebGL path for the first time and wrote this.
    offline_html = f"""
  <div class="walk-offline" data-walk-offline hidden role="status">
    <div class="walk-offline-inner">
      <p class="eyebrow">{escape(label)}</p>
      <p class="walk-offline-lead">This browser cannot draw the lane.</p>
      <p class="walk-offline-note">The walk itself needs WebGL, and it is switched off or
        unavailable here. Nothing is hidden that the lane owns: the numbered stops above still
        carry you along it, the keys still turn and walk, and the list writes out this lane's
        frames, its slots and what it may claim. Where you are standing is printed below.</p>
      <p class="walk-offline-where" data-walk-offline-where aria-hidden="true"></p>
    </div>
  </div>"""
    if d.get("night"):
        hour_html = ""
    else:
        hour_html = (
            '<button type="button" class="walk-icon walk-hour" data-walk-hour'
            ' aria-label="Daylight now. Bring on the night.">'
            '<svg class="walk-hour-sun" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"'
            ' stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round"'
            ' stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364'
            'l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636'
            'M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>'
            '<svg class="walk-hour-moon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"'
            ' stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round"'
            ' stroke-linejoin="round" d="M21.752 15.002A9.719 9.719 0 0118 15.75c-5.385 0-9.75-4.365'
            '-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21'
            'a9.753 9.753 0 009.002-5.998z" /></svg></button>')
    if day:
        opts = day if isinstance(day, dict) else {}
        # Round 76: `data-lane-day-cycle` is gone -- the site has no page clock for it to set (the hour
        # is the visitor's), and an attribute nothing reads is a knob that looks adjustable and is not.
        # `start` stays and now means what it says: the phase the page opens at, for a visitor who has
        # not chosen an hour.
        day_attr = (f' data-lane-day="1" data-lane-day-start="{opts.get("start", 0.5)}"'
                    f' data-lane-day-gain="{opts.get("gain", 1)}"')
    return f"""<div class="walk" id="walk-{did}" data-walk="{label}"
       data-lane-w="{lane["w"]}" data-lane-d="{walk_d}" data-lane-ceil="{lane["ceil"]}"
       data-lane-back="{lane["back"]}"{max_d_attr}{day_attr}{floor_attr}{floors_attr}{ws_attr}
       data-eye="{EYE}">
  <div class="walk-view" tabindex="0" data-walk-view role="application"
       aria-label="{label}, a lane you walk in person.{clad}{sight} Drag, arrow keys or A/D to turn,
       W A S D to walk, Shift to run, Space to jump, E while standing still to open what you are
       facing, double-click to let the mouse look, L for the list, I for this note. The first visit is walked through once by a guide strip at the bottom of the screen; it is replayable from this note.
       Nothing is written over the space: every sentence is behind a button.">
    <canvas class="walk-three-canvas" data-walk-three width="16" height="9" aria-hidden="true"></canvas>
    <div class="walk-hits">
      {INDENT.join(parts)}
      {walk_islands(d, placed)}
    </div>
  </div>
{offline_html}{game_html}
  <div class="walk-hud">
    <div class="walk-top">
      <div class="walk-pick">
        {exit_html}
        <div class="walk-stops" role="group" aria-label="Stops in this lane">{"".join(chips)}</div>
      </div>
      <div class="walk-read">
        <p class="sr-only" data-walk-status role="status">Building the lane…</p>
        <p class="sr-only" data-walk-record aria-live="polite"></p>
      </div>
    </div>
    <div class="walk-tutor" data-walk-tutor hidden aria-hidden="false">
      <p class="walk-tutor-step" data-walk-tutor-text aria-live="polite"></p>
      <span class="walk-tutor-n" data-walk-tutor-count></span>
      <button type="button" class="walk-tutor-act" data-walk-tutor-skip aria-label="Skip the guide">skip</button>
      <button type="button" class="walk-tutor-act" data-walk-tutor-done aria-label="Got it, leave me to the lane">done</button>
    </div>
    <div class="walk-bottom">
      <!-- Round 71, the owner's ruling: a tap on the picture presses nothing. The finger's verb is
           this bar, which appears only while something is in front of you and carries that thing's
           own name, so a press is always a press on a control the visitor can see and read. -->
      <button type="button" class="walk-open" data-walk-open hidden
        aria-label="Open what is in front of you"></button>
      <div class="walk-tools">
        <span class="walk-fov"><button type="button" class="walk-icon" data-walk-fov="-1"
          aria-label="Wider view">{ICON_FOV_OUT}</button
        ><button type="button" class="walk-icon" data-walk-fov="1"
          aria-label="Narrower view">{ICON_FOV_IN}</button></span>
        <button type="button" class="walk-icon" data-walk-jump aria-label="Jump">{ICON_UP}</button>
        <button type="button" class="walk-icon walk-tutor-replay" data-walk-tutor-replay
          aria-label="Walk me through the keys again">{ICON_BULB}</button>
        {hour_html}
        <button type="button" class="walk-icon walk-info" data-walk-info aria-expanded="false"
          aria-controls="walk-card-{did}" aria-label="What this lane is, and how to move in it">{ICON_CHAT}</button>
        <button type="button" class="walk-icon" data-walk-list aria-expanded="false"
          aria-controls="walk-list-{did}" aria-label="The lane, written out">{ICON_BOOK}</button>
      </div>
    </div>
  </div>
  <div class="walk-pad" data-walk-pad aria-hidden="true"><span class="walk-knob"></span></div>
  <div class="walk-card" id="walk-card-{did}" data-walk-card data-mode="prop" hidden>
    <p class="eyebrow" data-walk-where></p>
    <h2 data-walk-title></h2>
    <p data-walk-hint></p>
    <p class="when" data-walk-live></p>
    <div data-walk-aside hidden>
      <p class="walk-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk ·
        <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · drag to turn · <kbd>E</kbd> open a thing ·
        <kbd>L</kbd> the list · <kbd>I</kbd> this note · <kbd>Esc</kbd> close, then leave</p>
      <p class="walk-note">With a finger: drag to turn; when something is in front of you, its name
        appears in the bar at the foot of the picture, and tapping that bar opens it. A tap on the
        picture itself only puts down what is open. Three ways out — the arrow in the corner, the
        curtain at the mouth of the lane, and a second <kbd>Esc</kbd> once nothing is open any more.</p>
      <p class="walk-note">{label} is drawn, not surveyed: the distances are the artist's, and a
        frame is a depiction of a place rather than a record of standing in it.</p>
    </div>
    <button type="button" class="modal-close" data-walk-card-close aria-label="Close">{ICON_X}</button>
  </div>
  <aside class="walk-list" id="walk-list-{did}" data-walk-listpanel aria-label="{label}, written out">
    <button type="button" class="walk-drawer-close" data-walk-list-close aria-label="Close the list">
      {ICON_X}</button>
    <p class="eyebrow">The lane, written out</p>
    <ul class="walk-districts">
      {INDENT.join(district_card(x) for x in DISTRICTS)}
    </ul>
{small_things}
{drawer}
    <ul class="walk-links">{"".join(links)}</ul>
  </aside>
</div>
"""


def district_card(d):
    """The card is a record first and a link second: heading and body text stay in the page's
    own colour, and only the arrow is a link, because main a is accented and underlined
    site-wide. The kind is printed here with the gate it implies, and the cover — if there is
    one — carries the kind's cover rule as its caption, so a drawn cover can never be read as
    a photograph the owner took."""
    state = "Not open yet." if d["status"] == "soon" else "You are standing in it."
    kind = d.get("kind")
    meta = KINDS.get(kind, {})
    badge = f'{escape(meta["label"])} · {escape(d["purpose"])}' if meta else escape(d["purpose"])
    gate = f'<p class="rule">{escape(meta["gate"])}</p>' if meta else f'<p class="rule">{escape(d["blurb"])}</p>'
    cover = ""
    src = d.get("cover")
    if src and (ROOT / src).exists():
        caption = d.get("cover_caption", "")
        cover = (f'<figure class="district-cover"><img src="{escape(src)}" alt="" loading="lazy" '
                 f'{poster_attrs(src)} />'
                 f'<figcaption>{escape(caption)} {escape(meta.get("cover", ""))}</figcaption></figure>')
    elif src:
        # a cover named in the data but missing on disk must not draw a broken image, and
        # must not be papered over either: the empty card is the true state
        cover = '<p class="when">No cover image is available for this district.</p>'
    return (f'<li class="district-card is-{d["status"]}" aria-describedby="room-{escape(d["id"])}">'
            f'{cover}'
            f'<span class="badge">{badge}</span>'
            f'<h2>{escape(d["label"])}</h2>'
            f'{gate}'
            f'<p class="when">{state}</p>'
            f'<p class="pillar-more"><span class="when">{escape(state)}</span></p></li>')


def slot_row(d, sl):
    return (f'<li class="slot"><span class="badge">{escape(d["label"])}</span>'
            f'<strong>{escape(sl["label"])}</strong><p>{escape(sl["note"])}</p>'
            f'<p class="when">{escape(sl["state"])}</p></li>')


def source_attribution(d):
    """A room's open-data notice: displayed attribution, metadata note and source links."""
    a = d.get("attribution")
    if not a:
        return ""
    lic_name = escape(a["license_name"])
    lic = (f'<a href="{escape(a["license_url"])}" target="_blank" rel="noopener">'
           f'{lic_name}</a>')
    statement = escape(a["attribution_statement"]).replace(lic_name, lic)
    metadata = (f'<a href="{escape(a["license_metadata_url"])}" target="_blank" rel="noopener">'
                "City CKAN package metadata</a>")
    metadata_note = escape(a["license_metadata_note"])
    src = (f'<a href="{escape(a["source_url"])}" target="_blank" rel="noopener">'
           f'{escape(a["source_name"])}</a>')
    derivative = (f'<a href="{escape(a["derivative_url"])}" target="_blank" rel="noopener">'
                  f'{escape(a["derivative_name"])}</a>')
    return (f'<p class="when">Attribution displayed on the City dataset page: “{statement}” '
            f'{metadata}: {metadata_note} Source: {src}; tile derivative: {derivative}.</p>')


def district_drawer(d):
    """One room's reading material, for that room's drawer.

    Assembled per place rather than per site: the frames section lists this room's sights, the slots
    are this room's slots, and the caveat is the sentence this room's record wrote about what it may
    claim. A drawer that listed every district would print another room's inventory inside this one.
    """
    return "\n    ".join(x for x in [
        frames_section([d]),
        titled("h2", d.get("slots_title", "Slots"), ICON_CASE, "block-title spaced"),
        '<ul class="slot-list">\n      ' + INDENT.join(slot_row(d, sl) for sl in d["slots"])
        + "\n    </ul>",
        f'<p class="when">{escape(d["caveat"])}</p>' if d.get("caveat") else "",
        source_attribution(d),
    ] if x)
