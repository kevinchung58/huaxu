"""The ownership spec for this repository's generator — round 78, 2026-10.

Run it against the pre-split baseline and the emitted pages must be byte-identical:

    cp /tmp/gen_baseline.py /tmp/b.py
    (cd /tmp && python3 <this dir>/split_by_ownership.py <this file>)
    md5sum -c /tmp/base_html.md5

The names below are the split's whole definition. If a future round renames a top-level name
in the generator, it must rename it here too or the statement lands in the entry point.
"""

SRC = "/tmp/gen_baseline.py"
ENTRY = "_gen_html.py"

DSTDLIB = {
    "hashlib": "import hashlib",
    "re": "import re",
    "subprocess": "import subprocess",
    "json": "import json",
    "math": "import math",
    "fnmatch": "from fnmatch import fnmatch",
    "Path": "from pathlib import Path",
    "escape": "from html import escape",
}
STDLIB = DSTDLIB
DROP = ["__file__"]

SHIM = {
    "ROOT = Path(__file__).resolve().parent":
        "# The repo root, two levels up from `gen/site.py` (round 78: the split moved this file\n"
        "# below the root it measures). Every path in the generator hangs off this one line.\n"
        "ROOT = Path(__file__).resolve().parent.parent",
    # The duplicate-key scan parsed one file; after the split it must parse all of them, or it goes
    # quiet over 90% of the records. (Proved by planting a duplicate "id" in gen/content.py.)
    "def _assert_no_duplicate_keys():\n    import ast as _ast\n"
    "    _tree = _ast.parse((ROOT / \"_gen_html.py\").read_text(encoding=\"utf-8\"))\n    _bad = []\n":
        "def _gen_files():\n"
        "    \"\"\"Every file of this generator, entry point included. Round 78 split it into `gen/`, and a\n"
        "    duplicate-key scan that only parsed the entry would have gone quiet over 90 % of the records.\"\"\"\n"
        "    return [ROOT / \"_gen_html.py\"] + sorted((ROOT / \"gen\").glob(\"*.py\"))\n\n\n"
        "def _assert_no_duplicate_keys():\n    import ast as _ast\n"
        "    _nodes = []\n"
        "    for _f in _gen_files():\n"
        "        _nodes += list(_ast.walk(_ast.parse(_f.read_text(encoding=\"utf-8\"))))\n"
        "    _bad = []\n",
    "    for _node in _ast.walk(_tree):\n": "    for _node in _nodes:\n",
    "duplicate dict keys in _gen_html.py (later ones win, silently):":
        "duplicate dict keys in the generator (later ones win, silently):",
}

ENTRY_HEAD = """#!/usr/bin/env python3
\"\"\"The site generator's entry point: it assembles the page bodies and writes every file.

The chrome, the content, the image registry, the world builders, the district records and the
renderers live in `gen/` (round 78). Run this file: `python3 _gen_html.py`.
\"\"\""""

PACKAGE_DOC = "The site generator, split by responsibility (round 78)."

MODULES = [
    {
        "path": "gen/site.py",
        "doc": "`gen/site.py` — the page shell: site metadata, the nav, the footer, the icon set, and `page()`.\n\nEverything here is what a visitor sees on every page, which is why it is one file: the head's\ndescription, the nav's active state, the icons the rest of the generator names, and the two\nfunctions (`page`, `shell_page`) that wrap a body in that frame. Split out of `_gen_html.py` in\nround 78 and proven byte-identical on all 19 emitted pages; the entry point is `_gen_html.py`.",
        "names": [
            "ROOT", "_asset_ver", "VER", "CSS", "SITE", "DESC", "DESCS", "desc_for", "PUBLIC_PAGES", "ROOMS", "ROOM_BY_ID",
            "ROOM_ROW_BY_ID", "FIELD_NOTES_PLACE_IDS", "ROOM_ORDER", "CHAIN_ENTRY", "svg", "chip", "ico", "titled", "nav",
            "FOOT", "PERSON_LD", "ld_for", "page", "shell_page", "authors_html", "link_card",
            "ICON_MAIL",
            "ICON_SCHOLAR",
            "ICON_CASE",
            "ICON_MENU",
            "ICON_UP",
            "ICON_CARET",
            "ICON_BOOK",
            "ICON_USER",
            "ICON_CAP",
            "ICON_CAMERA",
            "ICON_USERS",
            "ICON_OUT",
            "ICON_SPARK",
            "ICON_CAL",
            "ICON_BULB",
            "ICON_PENCIL",
            "ICON_PHOTO",
            "ICON_X",
            "ICON_CHAT",
            "ICON_FOV_OUT",
            "ICON_FOV_IN",
            "ICON_LEFT",
            "ICON_EXIT",
            "ICON_RIGHT",
        ],
    },
    {
        "path": "gen/content.py",
        "doc": "`gen/content.py` — the records: publications, projects, pillars, courses, and the report's rows.\n\nThis is the file the owner edits when a paper is accepted, a talk is given or a principle's reading\nchanges. It holds data and the two card renderers that belong to that data (`pub_card`, `proj_card`)\n— nothing about layout, and nothing about the walk. Split out of `_gen_html.py` in round 78 and\nproven byte-identical on all 19 emitted pages; the entry point is `_gen_html.py`.",
        "names": [
            "pubs", "projects", "ongoing_projects", "PILLARS", "featured_attrs", "pub_card", "HOUSE_NAMES", "proj_card",
            "PRINCIPLES", "COURSES", "MIT_REPORT_URL", "CONVERGENCE", "PRINCIPLE_READS", "GAI_BEATS", "GAI_PREPARE",
            "GAI_PAIR", "GRID_CELLS", "GRID_ACTS", "PRACTICE_ROWS",
        ],
    },
    {
        "path": "gen/media.py",
        "doc": "`gen/media.py` — the image registry: what an image may claim, and what a photograph is called.\n\n`IMG_RULES` decides a file's block and kind (a `record` needs a venue and a date before it may be\nshown; a `generated` plate is labelled as drawn), `CAPTIONS` carries the words, and the album's wall\nand place cards are built from those two. A file that is in the folder and not in the registry stops\nthe build, which is the point. Split out of `_gen_html.py` in round 78 and proven byte-identical on\nall 19 emitted pages; the entry point is `_gen_html.py`.",
        "names": [
            "INDENT", "poster_attrs", "_jpeg_attrs", "IMG_RULES", "UNFILED", "BLOCKS", "IMG_FILES", "_matches", "_classify",
            "REGISTRY", "_stale", "CAPTIONS", "block_files", "album_item", "PLACE_TITLES", "ALBUM", "HELD", "ALBUM_BLOCKS",
            "ALBUM_PAGE", "room_of_plate", "_wall_tiles", "BLOCK_LABEL", "ALBUM_ITEMS", "album_tiles", "_tiles_by_block",
            "PLACE_GROUP_NOTES", "_place_card", "HOW_TO_WALK", "gallery_html",
        ],
    },
    {
        "path": "gen/world.py",
        "doc": "`gen/world.py` — the surveyed worlds: Niagara's falls and gorge, Goat Island, Toronto, the tunnel.\n\nEach builder turns open data (OpenStreetMap relations, sourced heights) into the quads and primitives\nthe renderer draws, in the lane's own centimetres. It knows nothing about HTML: it takes a frame and\nreturns primitives. Split out of `_gen_html.py` in round 78 and proven byte-identical on all 19\nemitted pages; the entry point is `_gen_html.py`.",
        "ranges": [['KINDS', 'DISTRICTS']],
    },
    {
        "path": "gen/districts.py",
        "doc": '`gen/districts.py` — the district records: what each place is, where everything in it stands.\n\nThis is the largest authored object in the repository and the one a scene round edits: the street,\nToronto, Tokyo, Fukuoka, and the three spaces they own, each with its lane box, its objects, its\nstops and its frames. Split out of `_gen_html.py` in round 78 and proven byte-identical on all 19\nemitted pages; the entry point is `_gen_html.py`.',
        "names": [
            "DISTRICTS",
        ],
    },
    {
        "path": "gen/render.py",
        "doc": "`gen/render.py` — the walk's markup: the lane, its chrome, the drawer, and the story plate.\n\nTurns one district record into the HTML the gate and the browser both read: `walk_html` builds the\nlayer, `district_drawer` the written-out lane, `rooms_plate_html` the frame plate, and `walk_object`\none prop's markup and press area. Split out of `_gen_html.py` in round 78 and proven byte-identical\non all 19 emitted pages; the entry point is `_gen_html.py`.",
        "names": [
            "BODY_LO", "BODY_HI", "BODY_MIN", "wall_frames", "frames_section", "rooms_plate_html", "walk_islands",
            "PLAYER_RADIUS", "blocks_body", "gap_to_box", "PLACE_KINDS", "is_target", "press_verb", "VERB_PHRASE",
            "walk_object", "walk_html", "district_card", "slot_row", "source_attribution", "district_drawer",
        ],
    },
]
