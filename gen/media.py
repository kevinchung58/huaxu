"""`gen/media.py` — the image registry: what an image may claim, and what a photograph is called.

`IMG_RULES` decides a file's block and kind (a `record` needs a venue and a date before it may be
shown; a `generated` plate is labelled as drawn), `CAPTIONS` carries the words, and the album's wall
and place cards are built from those two. A file that is in the folder and not in the registry stops
the build, which is the point. Split out of `_gen_html.py` in round 78 and proven byte-identical on
all 19 emitted pages; the entry point is `_gen_html.py`.
"""
from html import escape
from fnmatch import fnmatch
from gen.site import FIELD_NOTES_PLACE_IDS, ICON_CAMERA, ICON_RIGHT, ROOMS, ROOM_BY_ID, ROOM_ORDER, ROOM_ROW_BY_ID, ROOT, chip, ico
INDENT = "\n        "


def poster_attrs(src):
    """Intrinsic size for a poster, read from the file's own JPEG header.

    This page first called helpers it had only assumed existed (img_dims, then
    featured_attrs, which belongs to publications), and each guess shipped a crashing
    generator, so the parsing is done here and proven by the numbers in the commit
    message rather than by a name. If the site grows a shared sizing helper, this should
    call it -- but only one that returns dimensions, which nothing in this file did.
    Attributes are omitted when a header cannot be parsed: a guessed size is a worse
    layout bug than no size."""
    return _jpeg_attrs(src)


def _jpeg_attrs(src, _path=None):
    import struct

    path = _path or (ROOT / src)
    try:
        d = path.read_bytes()
    except OSError:
        return ""
    if not d.startswith(b"\xff\xd8"):
        return ""
    i = 2
    while i + 9 < len(d):
        if d[i] != 0xFF:
            i += 1
            continue
        marker = d[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            h, w = struct.unpack(">HH", d[i + 5 : i + 9])
            return f'width="{w}" height="{h}"'.format(w=w, h=h)
        i += 2 + struct.unpack(">H", d[i + 2 : i + 4])[0]
    return ""

# ---------------------------------------------------------------------------
# The image registry: which block every raster belongs to, and what it is allowed to claim.
#
# A space may not open without a declared purpose, and a photograph on a site is a claim in exactly
# the same way. So IMG/ is not a folder to pick from. Each file is classified by rule: a file that
# matches no rule stops the build, and a rule that matches nothing is an error too, because a
# partition nobody is using is a partition that has already drifted. The kind decides what is
# allowed to be shown: a `record` needs a venue and a date, a `generated` plate is labelled
# generated wherever it appears, and a `figure` stays inline in the argument that cites it instead of
# being slid into an album.
IMG_RULES = [
    ("1.jpg", "portrait", "identity"), ("2.jpg", "portrait", "identity"),
    ("tokyo-", "field-notes", "generated"),
    # The two rooms built after Tokyo. Same block, same kind: drawn plates, from the walkable
    # districts, never a record that anyone stood anywhere.
    ("fukuoka-", "field-notes", "generated"),
    ("toronto-", "field-notes", "generated"),
    ("cntower-", "field-notes", "generated"),
    ("niagara-", "field-notes", "generated"),
    ("journey-", "field-notes", "generated"),
    ("act-", "classroom", "record"),
    ("practice-", "figures", "figure"), ("principle-", "figures", "figure"),
    ("grid-", "figures", "figure"), ("diverge-", "figures", "figure"),
    ("mascot-", "interface", "art"), ("*-hero.jpg", "interface", "hero"),
    # The position page's own figures. A `figure`, not a `generated` plate: it is an illustration
    # carrying an argument on the page that cites it, and it is not album material, so it never
    # reaches the album wall. Written after the `*-hero.jpg` rule on purpose — the hero is a hero
    # first, and the order of this list is the only thing deciding that.
    ("position-", "figures", "figure"),
]
# Held back by name, with the reason printed instead of the file quietly dropped.
UNFILED = {"3.jpg": "the owner asked that this one stay out until it has a caption"}
BLOCKS = [
    {"id": "portrait", "label": "Portrait", "kind": "identity",
     "purpose": "The face the site is written in, used as the portrait and the share card.",
     "note": "Not album material. A person's portrait is not one more picture to swipe through, so "
             "these two files are never hung on a wall that pretends to be a travel archive."},
    {"id": "field-notes", "label": "Field notes", "kind": "personal",
     "purpose": "Travel, drawn rather than documented.",
     "note": "Generated plates from the walkable districts. None of it is a record of attendance, "
             "and none of it is captioned as one."},
    {"id": "classroom", "label": "Classroom and projects", "kind": "academic",
     "purpose": "Teaching and student work, shown with its venue and date or not at all.",
     "note": "Filed but not open. A frame without a date does not go up on this wall, and nothing "
             "here has been given a date yet."},
    {"id": "figures", "label": "Figures and diagrams", "kind": "figure",
     "purpose": "Argument, not atmosphere.",
     "note": "Deliberately outside the album: they stay inline on the pages that cite them, because "
             "a slideshow of the site's own diagrams would be decoration."},
    {"id": "interface", "label": "Interface art", "kind": "art",
     "purpose": "The mascot, and the drawn covers each page opens with.",
     "note": "Parts of the interface rather than pictures of anywhere, so they are not in the "
             "album either."},
    {"id": "unfiled", "label": "Unfiled", "kind": "unknown",
     "purpose": "Held back until somebody says what it is.",
     "note": "Nothing is shown from here. An image with no block is a claim with no source."},
]
IMG_FILES = sorted(
    f.name for f in (ROOT / "IMG").iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png"))


def _matches(pattern, name):
    """A rule matches a filename prefix, or a glob when it is written with a `*`.

    Prefix matching is the default because most blocks are named that way (`practice-`), and a glob is
    there for the ones that are not: the page heroes are suffixed, and `startswith("-hero.")` would
    have matched nothing while still looking like a rule, which is the failure this registry exists to
    prevent. So the matcher is shared with the stale-rule check below, and a rule cannot quietly stop
    applying.
    """
    if "*" in pattern:
        return fnmatch(name, pattern)
    return name.startswith(pattern)


def _classify(name):
    if name in UNFILED:
        return ("unfiled", "held")
    for prefix, block_id, kind in IMG_RULES:
        if _matches(prefix, name):
            return (block_id, kind)
    raise SystemExit(
        f"_gen_html.py: IMG/{name} is in no block. Add it to IMG_RULES, or to UNFILED with a "
        f"reason — the archive does not get to be unsorted.")


REGISTRY = {name: _classify(name) for name in IMG_FILES}
_stale = [pre for pre, _b, _k in IMG_RULES if not any(_matches(pre, n) for n in IMG_FILES)]

# A `record` image may only be shown with a venue and a date. This is the table that holds them, and
# it is empty until the owner writes it, which is what shuts the classroom block.
CAPTIONS = {}


def block_files(block, shown=True):
    """The files in one block, in name order; for academic material, only those that may be shown."""
    names = [n for n in IMG_FILES if REGISTRY[n][0] == block]
    if not shown:
        return names
    keep = []
    for n in names:
        kind = REGISTRY[n][1]
        if kind == "held":
            continue
        if kind == "record" and n not in CAPTIONS:
            continue
        keep.append(n)
    return keep


def album_item(name, block):
    """One raster, described once, then written on the wall where it hangs.

    The caption is part of the same record as the picture, so it cannot drift from it.
    """
    stem = name.rsplit(".", 1)[0]
    meta = CAPTIONS.get(name, {})
    title = meta.get("title",
                     PLACE_TITLES.get("IMG/" + name,
                                      stem.replace("-", " ").replace("_", " ").capitalize()))
    fallback = ("Filed under " + title.lower() + "; no caption was written for it, so none is "
                "invented here.")
    return {"src": "IMG/" + name, "name": name, "title": title,
            "alt": meta.get("alt", title), "caption": meta.get("caption", fallback),
            "block": block, "kind": REGISTRY[name][1]}


# The album is built here, above the district records, but its plates are the rooms' sub-places — the
# small areas inside each place, one drawn plate each — and those names live in the district records
# further down. So the names travel in one table next to the registry, file to name, and the district
# block asserts the two agree file by file: a plate keeps its name as a tile on the album wall and as
# a frame hung in its room, or the build stops. The three covers are sheets, not sub-places; they are
# named here so the wall does not read "Tokyo cover" at a visitor.
PLACE_TITLES = {
    "IMG/tokyo-sensoji.jpg": "The gate at Asakusa",
    "IMG/tokyo-scramble.jpg": "The scramble at Shibuya",
    "IMG/tokyo-tower.jpg": "The tower at dusk",
    "IMG/tokyo-poster-lantern.jpg": "The paper lantern",
    "IMG/tokyo-poster-wires.jpg": "The wires over the lane",
    "IMG/tokyo-poster-ticket.jpg": "The ticket machine",
    "IMG/tokyo-cover.jpg": "Tokyo, the lane in one sheet",
    "IMG/fukuoka-1.jpg": "Moji Port Station",
    "IMG/fukuoka-2.jpg": "The Blue Wing, open",
    "IMG/fukuoka-3.jpg": "The strait at dusk",
    "IMG/fukuoka-cover.jpg": "Moji Port in one sheet",
    "IMG/toronto-1.jpg": "The skyline, small",
    "IMG/toronto-2.jpg": "The falls, small",
    "IMG/toronto-3.jpg": "The market, small",
    "IMG/toronto-cover.jpg": "Toronto, the little city in one sheet",
    "IMG/toronto-tower-1.jpg": "The tower at dusk",
    "IMG/toronto-tower-2.jpg": "The city from above",
    "IMG/toronto-tower-3.jpg": "342 m of drop",
    "IMG/cntower-cover.jpg": "The tower, the pod in one sheet",
    "IMG/niagara-1.jpg": "The horseshoe from Table Rock",
    "IMG/niagara-2.jpg": "The promenade, mist ahead",
    "IMG/niagara-3.jpg": "The American Falls across",
    "IMG/niagara-cover.jpg": "The falls in one sheet",
    "IMG/journey-cover.jpg": "Behind the falls, the deck in one sheet",
}


ALBUM = {b["id"]: [album_item(n, b["id"]) for n in block_files(b["id"])] for b in BLOCKS}
HELD = {b["id"]: [n for n in block_files(b["id"], shown=False)
                  if n not in [x["name"] for x in ALBUM[b["id"]]]] for b in BLOCKS}
# Which blocks are hung on the album wall. `figures`, `interface` and `portrait` are deliberately not
# here: they belong inline in the arguments that cite them, and a portrait is not one more plate to
# swipe past. A block with nothing to show still gets its heading and its reason, because an
# archive that quietly omits a shelf is indistinguishable from one that never had it.
ALBUM_BLOCKS = [b for b in BLOCKS if b["id"] in ("field-notes", "classroom")]


ALBUM_PAGE = "activities.html"


def room_of_plate(src):
    """Which room a plate belongs to, by the prefixes the rooms declared, or None.

    The album uses this to decide two things it would otherwise guess: whether to print a door under
    a plate, and where in the wall that plate belongs. A plate that belongs to no room is a plate,
    and stays where the registry put it.
    """
    name = src.split("/")[-1]
    for rid, room in ROOM_BY_ID.items():
        if any(name.startswith(pre) for pre in room["plates"]):
            return rid
    return None


def _wall_tiles(items):
    """The photographs on the wall, one figure each, in the album's order.

    Round 77 deleted the roll these used to open: a tile no longer has a larger twin behind a
    modal, because the modal had never been emitted — the wall has held no photograph since it was
    written, and a viewer for nothing is not a feature. A tile is the picture and the line that
    says what it is, read where it hangs.
    """
    tiles = []
    for it in items:
        tag = "generated plate" if it["kind"] == "generated" else it["kind"]
        label = f"{it['title']} \u00b7 {BLOCK_LABEL[it['block']]} \u00b7 {tag}"
        tiles.append(
            f'<figure class="ig-tile">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {poster_attrs(it["src"])} '
            f'loading="lazy" />'
            f'<figcaption>{escape(it["title"])} \u2014 {escape(it["caption"])}'
            f'<span class="when">{escape(label)}</span></figcaption></figure>')
    return tiles
BLOCK_LABEL = {b["id"]: b["label"] for b in BLOCKS}
# The album's order is the ROOMS table's: a room earlier in the table is read earlier on the wall,
# and the plates that belong to no room keep their registry order after them. Decided here rather
# than in the registry, because the registry is about what an image may claim and the table is about
# where a room stands in the walk — and decided *before* the wall is built, because the wall's order
# is the order a visitor reads it in.
# The album wall carries only the blocks read as photographs here (classroom). Field notes is not a
# plate wall any more: it is ONE container of three cards, each card a place, and the card itself is
# the door into that room. The sub-area plates (the gate, the stall row, the lanterns) hang inside
# their rooms, as the frames of the little places they stand in for — never on this wall.
ALBUM_ITEMS = sorted(
    (it for b in ALBUM_BLOCKS for it in ALBUM[b["id"]] if b["id"] != "field-notes"),
    key=lambda it: ROOM_ORDER.get(room_of_plate(it["src"]), len(ROOMS)))
album_tiles = _wall_tiles(ALBUM_ITEMS)
_tiles_by_block = {b["id"]: [] for b in ALBUM_BLOCKS}


# A block may open onto the place its plates came from. It belongs to the block rather than to the
# page, because these plates are pictures of that room: the door stands where the pictures are, and
# it says what walking through it does. This one used to sit above the album — and it was written as
# a Python string split across two lines, so the quote and the continuation leaked into the anchor
# text and the page read `Tokyo, " "walked at first person`. A door that is hard to read is a door
# nobody opens, so the copy lives here as one sentence and the generator cannot fold it.
# Field notes is a picker with exactly three main places. The children in ROOMS are discovered
# inside their owner: the Toronto tower/falls props open their story and enter action, and Table Rock
# owns Journey Behind the Falls. Their titles and notes therefore never become album cards.
PLACE_GROUP_NOTES = {
    "toronto": "A dark hall of lit tables: the city, its falls and its markets, drawn small.",
    "tokyo": "Nakamise-dori at night: shuttered vermilion rows from Kaminarimon to a lit Hozomon.",
    "fukuoka": "Moji Port in a model hall: the station, the customhouse and their neighbours on "
                "stands of their own, then the Blue Wing and the ships on the Kanmon Strait, at dusk.",
}


def _place_card(r):
    """One card in the Field notes container: the place's sheet, its name and note — and the card
    itself is the door. One container, three cards, one press to be inside the place."""
    rid, label, page = r[0], r[1], r[2]
    # The cover is part of the card, not an ornament that may fail to appear: the card is a door and
    # the sheet is its face. Round 77 removed the "No cover yet" state — it was never emitted, and a
    # missing sheet is a build error, not a state to design for.
    src = f"IMG/{rid}-cover.jpg"
    if not (ROOT / src).exists():
        raise SystemExit(f"place card {rid}: missing {src}")
    media = (f'<span class="place-card-media"><img src="{src}" alt="" loading="lazy" '
             f'{poster_attrs(src)} /></span>')
    note = PLACE_GROUP_NOTES[rid]
    return (f'<a class="place-card reveal" data-place-card="{rid}" href="{page}" '
            f'aria-label="Walk into {escape(label)}: {escape(note)}">'
            f'{media}'
            f'<span class="place-card-body"><strong>{escape(label)}</strong>'
            f'<span class="when">{escape(note)}</span>'
            f'<span class="place-card-go">Walk into {escape(label)} {ico(ICON_RIGHT)}</span>'
            f'</span></a>')


# The one instruction the album gives, in the block's own voice: what a door does, how to walk once
# you are inside, how you get back, and that the street's far end is open. It sits above the places,
# because the moment after "walk in" is exactly where a first-time visitor is lost.
HOW_TO_WALK = ("These three doors step into Toronto, Tokyo, or Fukuoka: W A S D to walk, "
               "arrow keys or A/D (or a gentle drag) to turn, E while standing still to use what "
               "is in front of you, double-click to let the mouse look, or the on-screen pad on a "
               "phone. On the first visit a short guide teaches those keys in place, once, and the "
               "info card replays it. The sun-or-moon button in the chrome holds the lane in day or "
               "brings on night, and the choice carries to every lane; a room whose window shows one "
               "fixed night keeps its own hour. A landmark's own object may lead to another real space; "
               "Esc returns to its owner, then to the street, and finally to this wall.")


def gallery_html():
    """The wall, block by block: Field notes as three places, anything else as one grid."""
    out = []
    for b in ALBUM_BLOCKS:
        tiles = _tiles_by_block[b["id"]]
        held = HELD[b["id"]]
        state = f'{len(tiles)} shown'
        if held:
            state += ' · ' + str(len(held)) + ' held for want of a caption'
        if b["id"] == "field-notes":
            # One container and exactly the fixed three main destinations, in the agreed order.
            # Owned landmark spaces remain discoverable from their parent's props, not as cards.
            cards = []
            for rid in FIELD_NOTES_PLACE_IDS:
                room = ROOM_ROW_BY_ID[rid]
                if room[4] != "open" or rid not in PLACE_GROUP_NOTES:
                    raise ValueError(f"Field notes destination {rid!r} has no open main-place record")
                cards.append(_place_card(room))
            out.append(f'    <p class="eyebrow reveal">{escape(b["label"])}</p>\n'
                       f'    <p class="when reveal">{escape(b["purpose"])} <span class="badge">'
                       f'{escape(b["kind"])}</span> {len(cards)} places</p>\n'
                       f'    <p class="when reveal">{escape(HOW_TO_WALK)}</p>\n'
                       f'    <div class="place-cards" data-place-cards>\n      '
                       + "\n      ".join(cards) + '\n    </div>')
            continue
        head = (f'<div class="reveal"><h3>{escape(b["label"])}</h3>'
                f'<p class="when">{escape(b["purpose"])} <span class="badge">{escape(b["kind"])}'
                f'</span> {escape(state)}</p></div>')
        # A block with nothing to show says so in its own words: an archive that quietly omits a
        # shelf is indistinguishable from one that never had it (see ALBUM_BLOCKS).
        inner = (f'<div class="ig-grid">{" ".join(tiles)}</div>' if tiles else
                 f'<div class="dashed empty">{chip(ICON_CAMERA)}<div><strong>Nothing in this block '
                 f'yet</strong><p class="when">{escape(b["note"])}</p></div></div>')
        out.append(f'    {head}\n'
                   f'    <p class="when reveal">{escape(b["note"])}</p>\n'
                   f'    {inner}')
    return "\n".join(out)
