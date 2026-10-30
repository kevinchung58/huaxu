"""`gen/site.py` — the page shell: site metadata, the nav, the footer, the icon set, and `page()`.

Everything here is what a visitor sees on every page, which is why it is one file: the head's
description, the nav's active state, the icons the rest of the generator names, and the two
functions (`page`, `shell_page`) that wrap a body in that frame. Split out of `_gen_html.py` in
round 78 and proven byte-identical on all 19 emitted pages; the entry point is `_gen_html.py`.
"""
from pathlib import Path
from html import escape
import hashlib
import json
# The repo root, two levels up from `gen/site.py` (round 78: the split moved this file
# below the root it measures). Every path in the generator hangs off this one line.
ROOT = Path(__file__).resolve().parent.parent


def _asset_ver() -> str:
    """The cache-buster is the assets' own hash, so it cannot go stale.

    It used to be a hand-bumped string, and it went wrong the first time the renderer changed in a
    commit that forgot the bump: `js/site.js` gained the snow, the bank and the spill flag while the
    pages went on asking for `?v=20260923c`, so a returning visitor would have drawn the two new rooms
    with the old renderer and seen them wrong — the one class of bug that no gate here can see, because
    it only happens in somebody's browser cache. Derived, it is correct by construction: touch either
    asset and every page asks for the new bytes. The walkable-scene module and the pinned Three.js
    runtime are included too: the module has its own script URL, and a stale engine under a current
    page pin is the same browser-cache bug as a stale Canvas fallback.
    """
    h = hashlib.sha1()
    for f in (*ASSET_FILES, *SITE_FILES):
        h.update((ROOT / f).read_bytes())
    return h.hexdigest()[:10]


# The page programme, in load order, read out of `bin/site-sources.json` — the same file every gate
# and every test in this repository reads. `js/site.js` was one 9,501-line script until 2026-10-30;
# it is four now (overlay, chrome, dot-game, the lane), and the generator, the gates and the browsers
# all have to agree on the list and the order, so the list exists once. A part that is in the list
# but not in the pages would be dead code no gate could see; a part in the pages but not the list
# would run in a browser and not in the tests. `.verify/verify-sources.mjs` checks both directions.
SITE_FILES = json.loads((ROOT / "bin/site-sources.json").read_text(encoding="utf-8"))
# The assets a page loads that are not part of the page programme (the stylesheet, the Three.js
# module, the pinned runtime). Read, not restated: `bin/asset-ver.mjs` hashes the same two lists for
# the gates, and `.verify/verify-gen.mjs` compares the pages against that one computation.
ASSET_FILES = json.loads((ROOT / "bin/asset-list.json").read_text(encoding="utf-8"))

VER = _asset_ver()
CSS = f"css/site.css?v={VER}"
# Built after VER, because the tags carry it: an f-string here, not a "{{VER}}" left for whatever
# formats the page next -- the first version did that and shipped four literal "{VER}" tags.
SITE_TAGS = "\n".join(f'<script src="{f}?v={VER}"></script>' for f in SITE_FILES)
SITE = "https://kevinchung58.github.io/huaxu"
DESC = "Hua-Xu Zhong, researcher in educational technology, AI in education, and design thinking."

# Every page used to carry that one line as its description, all fourteen of them. Google treats
# identical descriptions across a site as a single blurred page and ignores them, which is most of
# why searching the name surfaces nothing useful -- the site was telling the crawler the same
# sentence fourteen times and so, in effect, telling it nothing about what is on each page.
# Each line below is drawn from the page's own content. No page is described as something it is not.
DESCS = {
    "index.html":    "Hua-Xu Zhong, PhD. Researcher in educational technology, AI in education, "
                     "and design thinking, working on what happens when learning technologies are "
                     "actually put into use.",
    "about.html":    "The academic path behind the research: an interdisciplinary start, a turn "
                     "through instructional theory and media design, design thinking, and a "
                     "postdoctoral fellowship building a generative-AI tutoring system.",
    "research.html": "Research in educational technology and AI in education: what actually "
                     "happens when educational technologies and AI systems are put into use.",
    "teaching.html": "Teaching and practice in educational technology, learning design, "
                     "information literacy and media education.",
    "position.html": "AI in education: where I stand. What large language models and generative AI "
                     "can do for learning, and where they overwhelm the learner.",
    "thinking.html": "Dots, shapes, and one line: how the work gets framed, from information "
                     "literacy and design thinking to generative AI.",
    "practice.html": "From principles to practice: putting educational technology and design "
                     "thinking to work in real learning environments.",
    "activities.html": "Academic activities: talks, workshops and participation in educational "
                       "technology and AI in education.",
    "service.html":   "Academic service and contribution to the educational technology community.",
    "links.html":     "Resources: reports, reading, and tools for text generation and LLM "
                      "assistance in education.",
}
def desc_for(path: str, room=None) -> str:
    """The description for a page. Rooms carry their own authored purpose, so they use that."""
    if room and room.get("purpose"):
        blurb = (room.get("blurb") or "").strip().rstrip(".")
        return (room["purpose"].strip().rstrip(".") + ". " + blurb).strip() if blurb \
               else room["purpose"].strip().rstrip(".") + "."
    return DESCS.get(path, DESC)
PUBLIC_PAGES = ["index.html", "about.html", "research.html", "teaching.html",
                "position.html", "thinking.html", "practice.html",
                "activities.html", "rooms.html", "service.html", "links.html"]


# ROOMS registers every walkable page, not every album destination. The street is the hub, with
# doors only to the three first-tier places; a real landmark or owned sub-space gets its own row but
# is reached from its parent object, never as another card or street door. The wiring is computed
# from this table and checked by `verify-walk.mjs`, so page geometry and route ownership cannot drift.
# The street row carries no plate prefix: it is the site's own ground, not an album destination.
ROOMS = [
    ("street", "The street", "street.html", [], "open"),
    # The snow walkway became the little city: the owner asked for the Canada room to be the
    # Toronto hall, Little-Canada style, so the row the album and the street both read now says
    # Toronto where it used to say Canada.
    ("toronto", "Toronto", "rooms-toronto.html", ["toronto-"], "open"),
    # The landmark space (landmark-space §2 link contract): the tower prop in the Toronto hall
    # owns this district; the hall stays the hub route in, the space owns the way back.
    ("cntower", "The tower", "rooms-cntower.html", ["toronto-tower-"], "open"),
    # The falls own their space the same way the tower owns its: the hall's model is the prop,
    # the story opens first, the space beside it, and the space unwinds to the hall.
    ("niagara", "The falls", "rooms-niagara.html", ["niagara-"], "open"),
    # The falls own a second space the way the real Table Rock owns it: Journey Behind the
    # Falls descends from the terrace through the bedrock. The door stands at the Table Rock
    # end of the promenade; the space unwinds to the promenade, not the street.
    ("journey", "Behind the falls", "rooms-journey.html", [], "open"),
    # Round 52: the other bank, reached the way visitors cross — on foot over the Rainbow. The
    # island gets a row like the tunnel's page: no album plate, its only doors are the falls'.
    ("goat", "Goat Island", "rooms-goat.html", [], "open"),
    ("tokyo", "Tokyo", "rooms.html", ["tokyo-"], "open"),
    ("fukuoka", "Fukuoka", "rooms-fukuoka.html", ["fukuoka-"], "open"),
]
ROOM_BY_ID = {r[0]: {"label": r[1], "page": r[2], "plates": r[3], "status": r[4]} for r in ROOMS}
ROOM_ROW_BY_ID = {r[0]: r for r in ROOMS}
# Field notes is the three original top-level destinations. Child spaces stay in ROOMS because
# they are real walkable pages, but this fixed allowlist is the only source of album cards.
FIELD_NOTES_PLACE_IDS = ("toronto", "tokyo", "fukuoka")
ROOM_ORDER = {r[0]: i for i, r in enumerate(ROOMS)}
# The nav item says "Rooms", so it opens on the street: a visitor arriving there is standing where
# every room can be walked to from, rather than inside one of them. Follows the ROOMS table, so
# rebuilding the hub renames the door without anyone having to remember that it did.
CHAIN_ENTRY = next((r[2] for r in ROOMS if r[4] == "open" and r[0] == "street"), "activities.html")


def svg(d: str, filled: bool = False) -> str:
    if filled:
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{d}</svg>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">{d}</svg>'
ICON_MAIL = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />')
ICON_SCHOLAR = svg('<path d="M5.242 13.769L0 9.5L12 0l12 9.5l-5.242 4.269L12 10.731l-6.758 3.038zm0 0L12 18l6.758-4.231L12 22l-6.758-4.231z" />', filled=True)
ICON_CASE = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-15a.75.75 0 01-.75-.75v-4.25m16.5 0a2.25 2.25 0 00.75-1.687V8.25A2.25 2.25 0 0018.75 6h-5.379a1.5 1.5 0 01-1.06-.44L11.25 4.5H5.25A2.25 2.25 0 003 6.75v5.713c0 .651.287 1.269.75 1.687m16.5 0H3.75" />')
ICON_MENU = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />')
ICON_UP = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />')
ICON_CARET = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />')
ICON_BOOK = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />')
ICON_USER = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />')
ICON_CAP = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />')
ICON_CAMERA = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />')
ICON_USERS = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />')
ICON_OUT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />')
ICON_SPARK = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />')
ICON_CAL = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />')
ICON_BULB = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />')
ICON_PENCIL = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />')
ICON_PHOTO = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />')
ICON_X = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />')
ICON_CHAT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />')
# The two view controls. Chevrons rather than the minus and plus the reference uses, because this page
# is not allowed a single character on its display: `−` is a glyph, and a glyph is text to a test.
ICON_FOV_OUT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />')
ICON_FOV_IN = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3.75 9.75 9 4.5m6 10.5l5.25-5.25L15 4.5" />')
ICON_LEFT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />')
# An arrow walking out of a frame: heroicons' own leave glyph, from the same 1.5-stroke family as the
# rest of the set. A bare chevron next to the owner's name did not read as an exit to the person who
# built the room, so the shape has to say "leave" on its own — that is the whole affordance budget.
ICON_EXIT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 '
                '13.5 3h-7.5A2.25 2.25 0 0 0 3.75 5.25v13.5A2.25 2.25 0 0 0 6 21h7.5a2.25 2.25 0 0 0 '
                '2.25-2.25V15" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12H3'
                'm0 0 3.75-3.75M3 12l3.75 3.75" />')
ICON_RIGHT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />')
def chip(icon: str) -> str:
    return f'<span class="icon-chip" aria-hidden="true">{icon}</span>'
def ico(icon: str) -> str:
    return f'<span class="ico" aria-hidden="true">{icon}</span>'
def titled(tag: str, text: str, icon: str, cls: str = "block-title reveal") -> str:
    return f'<{tag} class="{cls}">{ico(icon)}{text}</{tag}>'


def nav(active: str) -> str:
    def a(href, label, key):
        cls = "is-active" if active == key else ""
        return f'<a href="{href}" class="{cls}">{label}</a>'

    more_on = " is-active" if active in {"service", "links"} else ""
    pos_on = " is-active" if active in {"position", "thinking", "practice"} else ""
    return f"""<a class="skip" href="#main">Skip to main content</a>
<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="index.html"><img class="brand-mark" src="IMG/mascot-icon.png" alt="" width="40" height="40" /><span class="brand-text"><strong>Hua-Xu Zhong</strong><small>PhD</small></span></a>
    <nav class="nav-links" aria-label="Primary">
      {a("index.html", "Home", "home")}
      {a("about.html", "About", "about")}
      {a("research.html", "Research", "research")}
      {a("teaching.html", "Teaching", "teaching")}
      <div class="more">
        <button class="more-btn{pos_on}" type="button" aria-expanded="false" aria-haspopup="true">Position <span class="caret" aria-hidden="true">{ICON_CARET}</span></button>
        <div class="more-menu" role="menu">
          {a("position.html", "AI in education", "position")}
          {a("thinking.html", "How I think", "thinking")}
          {a("practice.html", "Report in practice", "practice")}
        </div>
      </div>
      {a("activities.html", "Activities", "activities")}
      {a(CHAIN_ENTRY, "Rooms", "rooms")}
      <div class="more">
        <button class="more-btn{more_on}" type="button" aria-expanded="false" aria-haspopup="true">More <span class="caret" aria-hidden="true">{ICON_CARET}</span></button>
        <div class="more-menu" role="menu">
          {a("service.html", "Service", "service")}
          {a("links.html", "Resources", "links")}
        </div>
      </div>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded="false">{ICON_MENU}</button>
  </div>
  <nav class="mobile" aria-label="Mobile">
    {a("index.html", "Home", "home")}
    {a("about.html", "About", "about")}
    {a("research.html", "Research", "research")}
    {a("teaching.html", "Teaching", "teaching")}
    <div class="label">Position</div>
    {a("position.html", "AI in education", "position")}
    {a("thinking.html", "How I think", "thinking")}
    {a("practice.html", "Report in practice", "practice")}
    {a("activities.html", "Activities", "activities")}
    <div class="label">More</div>
    {a("service.html", "Service", "service")}
    {a("links.html", "Resources", "links")}
    {a(CHAIN_ENTRY, "Rooms", "rooms")}
  </nav>
</header>"""


FOOT = f"""<footer>
  <div class="wrap foot">
    <div>
      <strong>Hua-Xu Zhong</strong> <span>PhD</span>
      <p>Researcher in Educational Technology &amp; AI</p>
    </div>
    <div class="social">
      <a href="mailto:k43122003@gmail.com" aria-label="Email">{ICON_MAIL}</a>
      <a href="https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&amp;hl=zh-TW" target="_blank" rel="noopener" aria-label="Google Scholar">{ICON_SCHOLAR}</a>
      <a href="research.html">Research</a>
    </div>
    <p class="copy">© 2026 Hua-Xu Zhong. All rights reserved.</p>
  </div>
</footer>
<button class="to-top" type="button" aria-label="Scroll to top">{ICON_UP}</button>
{SITE_TAGS}"""


# Structured data. Google resolves a person's name largely from schema.org markup, and the site had
# none at all -- so the crawler was left to guess who "Hua-Xu Zhong" is from prose alone.
#
# Everything here is either already on the site or a safe restatement of it. Nothing is invented:
# no employer, no institution, no ORCID, no Scholar. Those need the owner to supply them, because a
# wrong identifier published about a researcher is worse than no identifier at all. The hyphenless
# spelling is here because that is how the name is typed in a search box.
PERSON_LD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Person","name":"Hua-Xu Zhong",
"alternateName":["Huaxu Zhong"],
"url":"https://kevinchung58.github.io/huaxu/index.html",
"jobTitle":"Postdoctoral Research Fellow",
"description":"Researcher in educational technology and AI in education, working on what happens when learning technologies and generative AI are put into use.",
"knowsAbout":["Educational technology","Artificial intelligence in education","Design thinking","Learning design","Generative artificial intelligence","Information literacy","Media education"]}
</script>"""


def ld_for(canonical: str) -> str:
    """A Breadcrumb + WebPage for the page itself, alongside the Person on every page."""
    return (PERSON_LD + "\n" + '<script type="application/ld+json">'
            + '{"@context":"https://schema.org","@type":"WebPage","@id":"' + canonical + '",'
            + '"url":"' + canonical + '","isPartOf":{"@type":"WebSite",'
            + '"name":"Hua-Xu Zhong","url":"https://kevinchung58.github.io/huaxu/index.html"}}'
            + '</script>')


def page(title: str, active: str, body: str, path: str = "", extra: str = "") -> str:
    # path defaults to "<active>.html" ("home" is index.html);
    # 404 passes path="404" to stay unindexed.
    path = path or ("index.html" if active == "home" else f"{active}.html")
    if path == "404":
        meta = '  <meta name="robots" content="noindex" />\n'
    else:
        canonical = f"{SITE}/{path}"
        meta = f'''  <link rel="canonical" href="{canonical}" />
  <meta property="og:site_name" content="Hua-Xu Zhong" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(desc_for(path))}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE}/IMG/1.jpg" />
  <meta property="og:locale" content="en" />
  <meta name="twitter:card" content="summary" />
'''
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{escape(desc_for(path))}" />
{meta}{ld_for(canonical) if path != "404" else ""}
  <title>{escape(title)}</title>
  <link rel="icon" type="image/png" href="IMG/mascot-icon.png" />
  <link rel="apple-touch-icon" href="IMG/mascot-icon.png" />
  <link rel="stylesheet" href="{CSS}" />
</head>
<body>
{nav(active)}
<main id="main">
{body}
</main>
{FOOT}
{extra}
</body>
</html>
"""


def shell_page(title: str, body: str, path: str, cover: str = "IMG/1.jpg",
               desc: str = "", room=None) -> str:
    """A page that is not an article: no masthead, no footer, no prose stacked under the view.

    A walkable space is an application, and the reference proves the point by refusing to be a
    webpage at all — one route, the viewport belongs to the building, and everything else is an
    overlay you can dismiss. Keeping the site's nav and a column of sections around the lane would
    have produced exactly what the owner rejected: a picture of a place inside a page about it.
    The doorway back to the CV is one link in the head-up display, and the content that used to
    be sections now lives in the drawer, where it is still in the document, still printable, and
    still the whole page when scripting is off.
    """
    canonical = f"{SITE}/{path}"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0d1526" />
  <meta name="description" content="{escape(desc or desc_for(path, room))}" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:site_name" content="Hua-Xu Zhong" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(desc or desc_for(path, room))}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE}/{cover}" />
  <meta property="og:locale" content="en" />
  <meta name="twitter:card" content="summary" />
  <title>{escape(title)}</title>
{ld_for(canonical)}
  <link rel="icon" type="image/png" href="IMG/mascot-icon.png" />
  <link rel="apple-touch-icon" href="IMG/mascot-icon.png" />
  <link rel="stylesheet" href="{CSS}" />
</head>
<body class="shell">
{body}
{SITE_TAGS}
<script src="js/games.js?v={VER}" defer></script>
<script type="module" src="js/scene3d.js?v={VER}"></script>
</body>
</html>
"""


def authors_html(s: str) -> str:
    return escape(s).replace("H.-X. Zhong", "<b>H.-X. Zhong</b>")
def link_card(item):
    # item = (name, url) or (name, url, note) — note renders as a small annotation
    n, u = item[0], item[1]
    note = f'<p class="when link-note">{escape(item[2])}</p>' if len(item) > 2 else ""
    return f'<a class="card lift" href="{escape(u)}" target="_blank" rel="noopener"><h3>{escape(n)}</h3>{ico(ICON_OUT)}{note}</a>'
