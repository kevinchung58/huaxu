#!/usr/bin/env python3
import hashlib
import re
import subprocess
import json
import math
from fnmatch import fnmatch
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent


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
    for f in ("css/site.css", "js/site.js", "js/scene3d.js", "js/games.js",
              "js/vendor/three-0.186.1/three.core.js", "js/vendor/three-0.186.1/three.module.js"):
        h.update((ROOT / f).read_bytes())
    return h.hexdigest()[:10]


VER = _asset_ver()
CSS = f"css/site.css?v={VER}"

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
if len(set(FIELD_NOTES_PLACE_IDS)) != 3 or any(
        rid not in ROOM_BY_ID or ROOM_BY_ID[rid]["status"] != "open"
        for rid in FIELD_NOTES_PLACE_IDS):
    raise ValueError("Field notes must name exactly three open main places")
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
<script src="js/site.js?v={VER}"></script>"""


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
<script src="js/site.js?v={VER}"></script>
<script src="js/games.js?v={VER}" defer></script>
<script type="module" src="js/scene3d.js?v={VER}"></script>
</body>
</html>
"""


def authors_html(s: str) -> str:
    return escape(s).replace("H.-X. Zhong", "<b>H.-X. Zhong</b>")


pubs = [
    dict(id="pub1", type="Journal", year=2021, authors="C.-F. Lai, H.-X. Zhong, P.-S. Chiu", title="Investigating the impact of a flipped programming course using the DT-CDIO approach", source="Computers & Education, Vol. 173, p. 104287. Elsevier"),
    dict(id="pub2", type="Journal", year=2020, authors="P.-S. Huang, P.-S. Chiu, Y.-M. Huang, H.-X. Zhong, C.-F. Lai", title="Cooperative mobile learning for the investigation of natural science courses in elementary schools", source="Sustainability, Vol. 12, No. 16, p. 6606. MDPI"),
    dict(id="pub3", type="Journal", year=2024, featured=True, authors="H.-X. Zhong, J.-H. Chang, C.-F. Lai, P.-W. Chen, S.-H. Ku, S.-Y. Chen", title="Information undergraduate and non-information undergraduate on an artificial intelligence learning platform: an artificial intelligence assessment model using PLS-SEM analysis", source="Education and Information Technologies, Vol. 29, No. 4, pp. 4371-4400. Springer"),
    dict(id="pub4", type="Conference", year=2021, authors="H.-X. Zhong, C.-F. Lai, Y.-C. Huang, P.-H. Wu, J.-H. Chang", title="Exploring the impact of artificial intelligence learning platforms on interest in and attitudes toward learning", source="Innovative Technologies and Learning: 4th International Conference, ICITL 2021, Virtual Event, November 29–December 1, 2021, Proceedings 4, pp. 22-29. Springer"),
    dict(id="pub5", type="Journal", year=2023, authors="H.-X. Zhong, C.-F. Lai, J.-H. Chang, P.-S. Chiu", title="Developing creative material in STEM courses using integrated engineering design based on APOS theory", source="International Journal of Technology and Design Education, Vol. 33, No. 4, pp. 1627-1651. Springer"),
    dict(id="pub6", type="Journal", year=2021, authors="C.-F. Lai, H.-X. Zhong, P.-S. Chiu, Y.-H. Pu", title="Development and evaluation of a cloud bookcase system for mobile library", source="Library Hi Tech, Vol. 39, No. 2, pp. 380-395. Emerald Publishing Limited"),
    dict(id="pub7", type="Journal", year=2021, authors="J.-H. Chang, H.-H. Chiang, H.-X. Zhong, Y.-K. Chou", title="Travel package recommendation based on reinforcement learning and trip guaranteed prediction", source="Journal of Internet Technology, Vol. 22, No. 6, pp. 1359-1373."),
    dict(id="pub8", type="Journal", year=2020, authors="Y.-L. Jeng, C.-F. Lai, S.-B. Huang, P.-S. Chiu, H.-X. Zhong", title="To cultivate creativity and a maker mindset through an internet-of-things programming course", source="Frontiers in Psychology, Vol. 11, p. 546616. Frontiers Media SA"),
    dict(id="pub9", type="Journal", year=2023, authors="J.-H. Chang, C.-J. Wang, H.-X. Zhong, P.-W. Chen, A.-J. Pan, P.-S. Chiu", title="Implementation and evaluation of the school's COVID-19 prevention website", source="Library Hi Tech, Vol. 41, No. 1, pp. 71-90. Emerald Publishing Limited"),
    dict(id="pub10", type="Journal", year=2021, authors="H.-X. Zhong, P.-S. Chiu, C.-F. Lai", title="Effects of the use of CDIO engineering design in a flipped programming course on flow experience, cognitive load", source="Sustainability, Vol. 13, No. 3, p. 1381. MDPI"),
    dict(id="pub11", type="Journal", year=2022, authors="C.-F. Lai, H.-X. Zhong, J.-H. Chang, P.-S. Chiu", title="Applying the DT-CDIO engineering design model in a flipped learning programming course", source="Educational technology research and development, Vol. 70, No. 3, pp. 823-847. Springer"),
    dict(id="pub12", type="Journal", year=2022, authors="C.-J. Wang, H.-X. Zhong, P.-S. Chiu, J.-H. Chang, P.-H. Wu", title="Research on the impacts of cognitive style and computational thinking on college students in a visual artificial intelligence course", source="Frontiers in Psychology, Vol. 13, p. 864416. Frontiers Media SA"),
    dict(id="pub13", type="Journal", year=2023, authors="P.-S. Chiu, H.-X. Zhong, C.-F. Lai", title="Investigating the effects of a programming course using flipped learning", source="Innovations in Education and Teaching International, Vol. 60, No. 4, pp. 578-590. Taylor & Francis"),
    dict(id="pub14", type="Journal", year=2024, authors="J.-H. Chang, C.-J. Wang, H.-X. Zhong, H.-C. Weng, Y.-K. Zhou, H.-Y. Ong, C.-F. Lai", title="Artificial intelligence learning platform in a visual programming environment: exploring an artificial intelligence learning model", source="Educational technology research and development, Vol. 72, No. 2, pp. 997-1024. Springer"),
    dict(id="pub15", type="Conference", year=2024, authors="H.-X. Zhong, C.-F. Lai, S.-H. Ku, J.-H. Chang", title="Exploring the Relationship Between Collaborative Learning Factors and Perceived Learning", source="International Conference on Innovative Technologies and Learning, pp. 167-174. Springer Nature Switzerland"),
    dict(id="pub16", type="Journal", year=2025, authors="J. A. C. Castaneda, P.-C. Lin, P. C. K. Hung, H.-X. Zhong, H.-A. Tseng, Y.-F. Huang, R. Ahmad", title="Designing inclusive tech playful educative solutions for visually impaired learners in STEM education", source="Smart Learning Environments, Vol. 12, No. 1, p. 4. Springer"),
    dict(id="pub17", type="Journal", year=2026, authors="T. Gazit, T. Tager-Shafrir, H.-X. Zhong, P. C. K. Hung, V. Cheung", title="The dark side of the interface: examining the influence of different background modes on cognitive performance", source="Ergonomics, Vol. 69, No. 5, pp. 828-841. Taylor & Francis"),
    dict(id="pub19", type="Journal", year=2026, featured=True, corresponding=True, doi="10.1007/s10796-026-10779-3", authors="J.-H. Chang, C.-F. Lai, C.-L. Huang, H.-X. Zhong*", title="A Decade of Technological Advancements in Information Systems Frontiers (2015–2025): Emerging Trends, Dominant Topics, and Future Directions", source="Information Systems Frontiers, pp. 1-44. Springer"),
    dict(id="pub20", type="Journal", year=2026, authors="J.-H. Chang, H.-X. Zhong, C.-F. Lai", title="Enhancing programming learning with the peer-adaptive-clustering learning approach in virtual learning environments", source="Educational technology research and development, Published online. Springer"),
    dict(id="pub21", type="Conference", year=2025, doi="10.1007/978-3-031-98197-5_1", authors="H.-X. Zhong, C.-F. Lai, W.-I. Hua, J.-H. Chang", title="Exploring the Impact of Mind Maps in Information Security Courses", source="Innovative Technologies and Learning. ICITL 2025. Lecture Notes in Computer Science, vol 15914, pp. 3-11. Springer, Cham."),
    dict(id="pub18", type="Conference", year=2025, doi="10.1007/978-3-031-92826-0_3", authors="C. L. Gittens, M. Gittens, Y. Jiang, P. C. K. Hung, T. Wood, H.-X. Zhong", title="Technological Influence on Digital Banking Adoption: A Framework and Empirical Study of the Influence of Social Robots and IVAs in a Small Island Context", source="In: Siau, K.L., Nah, F.FH. (eds) HCI in Business, Government and Organizations. HCII 2025. Lecture Notes in Computer Science, vol 15805. Springer, Cham."),
]

projects = [
    ("Establishing a Digital Learning Platform for K-12 Maker Education Teacher Training and Developing STEAM Curricula and Assessments", "Researcher", "National Science and Technology Council (NSTC) / Ministry of Science and Technology (MOST)", "August 1, 2019 – July 31, 2022", "Establish a digital learning platform for K-12 maker education teacher training, and develop related STEAM curricula and assessments.", "Platform and curricula developed."),
    ("Developing a STEAM Education Teacher Digital Learning Platform and Designing STEAM Curricula Based on the CDIO Engineering Education Model", "Researcher", "National Science and Technology Council (NSTC) / Ministry of Science and Technology (MOST)", "August 1, 2022 – July 31, 2024", "Develop a STEAM education teacher digital learning platform and design STEAM curricula using the CDIO model.", "Platform and curricula designed."),
    ("Integrating CDIO Engineering Education Model with STEM Education into Programming Courses", "Researcher", "Ministry of Education", "August 1, 2020 – July 31, 2021", "Integrate the CDIO model with STEM education in programming courses.", "Integration implemented and evaluated."),
    ("Integrating Design Thinking into Reflective Window Programming Courses Using the CDIO Engineering Education Model (Excellence Award Project)", "Researcher", "Ministry of Education", "August 1, 2021 – July 31, 2022", "Integrate design thinking into programming courses using the CDIO model.", "Project received an Excellence Award."),
    ("Implementing Clustering Algorithms for Adaptive Learning and Peer Learning – A Case Study in Virtual Learning Spaces", "Researcher", "Ministry of Education", "August 1, 2022 – July 31, 2023", "Implement clustering algorithms for adaptive and peer learning in virtual spaces.", "Algorithms implemented and case study conducted."),
    ("Impact of Integrating Guided Inquiry Learning with Collaborative Mind Mapping – A Case Study on Information Security Course Content", "Researcher", "Ministry of Education", "August 1, 2023 – July 31, 2024", "Study the impact of guided inquiry learning with collaborative mind mapping on information security course content.", "Impact assessed through case study."),
    ("International Research Experience: NSTC Scholarship for Doctoral Students to Study Abroad", "Visiting Doctoral Student", "National Science and Technology Council (NSTC) Scholarship", "September 7, 2023 – April 8, 2024", "Conduct doctoral research abroad.", "Completed the study-abroad period."),
]

# Ongoing grant(s) — rendered separately at the top of the Research projects list.
ongoing_projects = [
    ("Development and Application of a Generative-AI-Based Intelligent Tutoring System for Fostering Students' Practical Competence in Engineering Implementation Courses: An Effectiveness Evaluation", "Postdoctoral Research Fellow", "National Science and Technology Council (NSTC), Taiwan — Subsidy for the Recruitment of Visiting Science and Technology Personnel", "August 2025 – August 2028", "Design and evaluate a generative-AI intelligent tutoring system that scaffolds engineering practice and assesses gains in students' hands-on competence.", "In progress — system build and classroom evaluation underway."),
]


# Research interest pillars — single source of truth for the home cards and the
# anchor sections on the research page (cards link to research.html#id).
# Written as broad agenda areas (frontier topics), not as a paper index.
PILLARS = [
    {
        "id": "generative-ai-in-education",
        "name": "Generative AI in Education",
        "icon": ICON_SPARK,
        "thesis": "How to design generative AI as a partner in inquiry, and the literacies such inquiry rests on.",
        "topics": ["LLM-powered learning systems", "AI agents for teaching & learning", "GAI for feedback & scaffolding", "Learner-AI interaction & interfaces", "AI & information literacy", "Computational thinking"],
        "detail": "My interest here is generative AI as a learning partner: LLM-powered learning systems and AI agents that extend access to feedback, ideas, and scaffolding, so students can keep going when human support runs out. This is the direction I am working toward, and the question I keep returning to is how to design these systems so students keep thinking for themselves. I also study the literacies such inquiry rests on: AI literacy, information literacy, and computational thinking, the working grammar of learning with AI.",
    },
    {
        "id": "creativity-design-thinking",
        "name": "Creativity & Design Thinking",
        "icon": ICON_PENCIL,
        "thesis": "How people learn to think creatively, frame ill-defined problems, and design their way forward.",
        "topics": ["Design thinking methods", "Creative problem-solving", "Teaching & learning for creativity", "AI tools for creative work"],
        "detail": "I see creativity and design thinking as practices that can be taught and learned, not as gifts. They are methods for framing ill-defined problems and designing a way forward. I also study what AI tools change in creative work: when they support it, and when the creative part of the work quietly moves from the person to the tool.",
    },
    {
        "id": "information-systems-management",
        "name": "Information Systems & Management Applications",
        "icon": ICON_CASE,
        "thesis": "Why people and organizations accept or resist intelligent systems, and where the field is heading next.",
        "topics": ["Technology acceptance & IS theories", "AI agents & intelligent information systems", "Emerging technologies & IS frontiers", "Quantitative IS research methods"],
        "detail": "My information systems work asks why people and organizations accept or resist intelligent systems. I draw on technology acceptance research and IS theories, follow where emerging technologies take the field, and study these questions with quantitative research methods.",
    },
]

pillar_cards = "\n".join(
    f'''<article class="card lift reveal"{f' style="--d:{i * 70}ms"' if i else ""}><div class="head-row">{chip(p["icon"])}<div><h3>{escape(p["name"])}</h3><p>{escape(p["thesis"])}</p></div></div>
      <ul class="pillar-topics">{"".join(f"<li>{escape(t)}</li>" for t in p["topics"])}</ul>
      <p class="pillar-more"><a class="text-arrow" href="research.html#{p["id"]}">Show more {ico(ICON_RIGHT)}</a></p></article>'''
    for i, p in enumerate(PILLARS)
)

pillar_sections = "\n".join(
    f'''<section class="pillar-sec reveal" id="{p["id"]}">
  <h3>{escape(p["name"])}</h3>
  <p>{escape(p["detail"])}</p>
  <p class="pillar-keys">{" · ".join(escape(t) for t in p["topics"])}</p>
</section>'''
    for p in PILLARS
)


def featured_attrs(p):
    return (
        f'data-featured data-title="{escape(p["title"])}" '
        f'data-authors="{escape(p["authors"])}" '
        f'data-source="{escape(p["source"])}" '
        f'data-doi="{p.get("doi", "")}" '
        f'data-corresponding="{"true" if p.get("corresponding") else "false"}"'
    )


def pub_card(p, n):
    badges = f'<span class="badge">{p["year"]}</span><span class="badge">{p["type"]}</span>'
    if p.get("featured"):
        badges += '<span class="badge gold">Featured</span>'
    if p.get("corresponding"):
        badges += '<span class="badge">Corresponding author</span>'
    title = escape(p["title"])
    if p.get("doi"):
        title_html = f'<a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">{n}. {title}</a>'
        doi_line = f'<p class="doi-line">DOI: <a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">{escape(p["doi"])}</a></p>'
    else:
        title_html = f"{n}. {title}"
        doi_line = ""
    links = ""
    if p.get("featured"):
        links += f'<button class="text-link" type="button" {featured_attrs(p)}>{ico(ICON_PHOTO)}View figure</button>'
    feat = " is-featured" if p.get("featured") else ""
    return f'''<article class="pub{feat} reveal" data-pub-type="{p["type"]}">
  <div class="badges">{badges}</div>
  <h4>{title_html}</h4>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])} ({p["year"]})</p>
  {doi_line}
  <div class="meta-links">{links}</div>
</article>'''


home = page("Hua-Xu Zhong, PhD", "home", f"""
<section class="hero">
  <div class="hero-art" aria-hidden="true"></div>
  <div class="wrap">
    <div class="hero-grid">
      <img class="portrait" src="IMG/1.jpg" alt="Hua-Xu Zhong professional portrait" width="288" height="288" />
      <div class="hero-copy reveal">
        <p class="eyebrow">Educational technology · AI · design thinking</p>
        <h1>Hua-Xu Zhong<span>鍾華栩 · PhD</span></h1>
        <p class="role">Researcher in Educational Technology &amp; AI</p>
        <p class="lede">I work where technology, education, and practical AI meet. My current direction is LLM-powered learning systems and tools that support creativity, so students can inquire rather than only adapt.</p>
        <div class="actions">
          <a class="btn btn-primary" href="research.html">{ICON_CASE} View research</a>
          <a class="btn btn-ghost" href="about.html">{ICON_USER} About my work</a>
        </div>
        <div class="social">
          <a href="mailto:k43122003@gmail.com" aria-label="Email">{ICON_MAIL}</a>
          <a href="https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&amp;hl=zh-TW" target="_blank" rel="noopener" aria-label="Google Scholar">{ICON_SCHOLAR}</a>
        </div>
        <p class="hero-note">Currently an NSTC postdoctoral research fellow working on generative AI for learning · open to research collaboration and international visiting opportunities.</p>
      </div>
    </div>
    <dl class="stats">
      <div class="stat reveal" style="--d:40ms"><dt>{ico(ICON_BOOK)} Publications</dt><dd>{len(pubs)}</dd></div>
      <div class="stat reveal" style="--d:90ms"><dt>{ico(ICON_CASE)} Research projects</dt><dd>{len(projects) + len(ongoing_projects)}</dd></div>
      <div class="stat reveal" style="--d:140ms"><dt>{ico(ICON_CAL)} Latest papers</dt><dd>2026</dd></div>
    </dl>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Focus</p><h2>Research interests</h2><p>Three directions guide my research agenda: learning, creativity, and the systems people work with.</p></div>
    <div class="grid-3">
{pillar_cards}
    </div>
  </div>
</section>
<section class="section alt">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Path</p><h2>Education</h2></div>
    <ol class="timeline">
      <li class="reveal"><p class="when">2019/9 – 2024/6</p><h3>Ph.D.</h3><p class="inst">National Cheng Kung University</p><p class="when">Department of Engineering Science (Computer Science and Its Applications)</p></li>
      <li class="reveal" style="--d:80ms"><p class="when">2018/9 – 2019/1</p><h3>Master's</h3><p class="inst">National Chiayi University</p><p class="when">Department of E-learning Design and Management</p></li>
      <li class="reveal" style="--d:140ms"><p class="when">2014/9 – 2018/6</p><h3>Bachelor's</h3><p class="inst">National Chiayi University</p><p class="when">Department of E-learning Design and Management</p></li>
    </ol>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Updates</p><h2>Latest news</h2></div>
    <div class="news reveal">
      <article><time datetime="2026-07-08"><span class="mo">JUL</span><span class="dy">08</span><span class="yr">2026</span></time><div><h3>New publication in Information Systems Frontiers</h3><p>Our paper “A Decade of Technological Advancements in Information Systems Frontiers (2015–2025): Emerging Trends, Dominant Topics, and Future Directions” has been published. Hua-Xu Zhong is the corresponding author.</p></div></article>
      <article><time datetime="2026-06-01"><span class="mo">JUN</span><span class="dy">01</span><span class="yr">2026</span></time><div><h3>New publication in ETR&amp;D</h3><p>Our paper “Enhancing programming learning with the peer-adaptive-clustering learning approach in virtual learning environments” has been published in Educational Technology Research and Development.</p></div></article>
      <article><time datetime="2025-03-01"><span class="mo">MAR</span><span class="dy">01</span><span class="yr">2025</span></time><div><h3>Paper accepted for HCII 2025</h3><p>Our paper “Technological Influence on Digital Banking Adoption: A Framework and Empirical Study of the Influence of Social Robots and IVAs in a Small Island Context” has been accepted for HCII 2025.</p></div></article>
      <article><time datetime="2025-02-15"><span class="mo">FEB</span><span class="dy">15</span><span class="yr">2025</span></time><div><h3>Paper accepted in Ergonomics</h3><p>Our paper “The dark side of the interface: examining the influence of different background modes on cognitive performance” has been accepted in Ergonomics.</p></div></article>
      <article><time datetime="2025-02-01"><span class="mo">FEB</span><span class="dy">01</span><span class="yr">2025</span></time><div><h3>Paper accepted in Smart Learning Environments</h3><p>Our paper “Designing inclusive tech playful educative solutions for visually impaired learners in STEM education” has been accepted in Smart Learning Environments.</p></div></article>
    </div>
  </div>
</section>
""")

about = page("About · Hua-Xu Zhong", "about", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Statement</p><h1>About</h1><p>Academic journey and vision</p></div>
    <div class="about-card reveal">
      <div class="persona" role="button" tabindex="0" aria-label="Toggle illustrated portrait">
        <span class="persona-frame">
          <img src="IMG/2.jpg" alt="Hua-Xu Zhong" />
          <span class="persona-alt" aria-hidden="true">
            <img src="IMG/mascot-final.png" alt="" loading="lazy" />
            <img class="pf pf-blink" src="IMG/mascot-blink.png" alt="" loading="lazy" />
            <img class="pf pf-laugh" src="IMG/mascot-laugh.png" alt="" loading="lazy" />
          </span>
          <span class="persona-hint" aria-hidden="true">Hover me</span>
        </span>
      </div>
      <div class="about-copy">
        <h2 class="with-ico">{ico(ICON_USER)}Personal academic statement</h2>
        <p>I work at the meeting point of technology, education, and practical artificial intelligence. I study what actually happens when educational technologies and AI systems are put into use.</p>
        <p>My academic path began with an interdisciplinary undergraduate program. I came in hoping that mixed knowledge and technical integration could address real educational problems. The training widened my view, but it did not fully prepare me for the practical demands of the field. Even with a solid grasp of instructional theory and media design, I kept meeting a gap between theory and problem-solving. I tried programming as a career path, then found that my technical limits made it hard to go deeper. What stayed with me was simpler: knowledge and tools are not enough. You have to see the problem clearly, then turn theory into something you can actually do.</p>
        <p>During my master's studies, I returned to a core question: Can education actually solve real problems? Courses on information literacy and media education showed me that education is not only about transmitting knowledge. It is about comprehension and changing how people think. Through work on innovation, change, and management, I encountered design thinking, which gave me a way to put creativity and technology into educational settings. That shift did not come from abstract ideals. It came from what I saw in real learning environments, where technology's accelerating effect was hard to miss. I saw how innovation and digital tools could open new opportunities for learners.</p>
        <blockquote class="quote">“Education is a rainbow: it nurtures talents of every color.”</blockquote>
        <p>That conviction redirected my academic path. It is why I continue to work on educational technology and learning design.</p>
        <p>Outside of academia, I enjoy traveling, writing, listening to music, and playing basketball. I value every meaningful moment and refuse to waste time. I want to build educational technology systems from my background in education, and to work seriously with large language models. I know this era can empower people, and it can also overwhelm them. So my work now focuses on what LLMs and generative AI can do for learning, the direction I describe on my position page, helping students develop their potential not only to survive the future, but to shape it. Since 2025 I have held a postdoctoral research fellowship from Taiwan's National Science and Technology Council, building and evaluating a generative-AI intelligent tutoring system for engineering courses. I am also a scholar who likes learning across disciplines, and I look for ideas from other fields that can spark new work.</p>
      </div>
    </div>
  </div>
</section>
""")

# Backlog item 3 (2026-08), done 2026-10-10 under the owner's blanket go-word: surface the
# corresponding-author and international-collaboration facts that already live in `pubs` and
# `projects`, computed from those records — the strip below asserts nothing the list does not
# already say.
HOUSE_NAMES = ["Elsevier", "Springer", "MDPI", "Taylor & Francis", "Frontiers", "Emerald"]
houses = sorted({h for p in pubs for h in HOUSE_NAMES if h in p["source"]})
corr_pubs = [p for p in pubs if p.get("corresponding")]
intl_proj = next((p for p in projects if "International Research Experience" in p[0]), None)
j_count = sum(1 for p in pubs if p["type"] == "Journal")
c_count = sum(1 for p in pubs if p["type"] == "Conference")
years = sorted({p["year"] for p in pubs}, reverse=True)
year_html = []
for y in years:
    items = [p for p in pubs if p["year"] == y]
    items.sort(key=lambda p: p["title"])
    cards = "\n".join(pub_card(p, i + 1) for i, p in enumerate(items))
    label = "publication" if len(items) == 1 else "publications"
    year_html.append(f'<div class="year-block" data-year="{y}"><h3>{y} <span>{len(items)} {label}</span></h3>{cards}</div>')

# Featured: EIT 2024 first, then ISF 2026
featured = [p for p in pubs if p.get("featured")]
featured.sort(key=lambda p: p["year"])
feat_html = []
for p in featured:
    corr = '<span class="badge">Corresponding author</span>' if p.get("corresponding") else ""
    if p.get("doi"):
        title_html = f'<a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">{escape(p["title"])}</a>'
        doi_line = f'<p class="doi-line">DOI: <a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">{escape(p["doi"])}</a></p>'
    else:
        title_html = escape(p["title"])
        doi_line = ""
    feat_html.append(f'''<article class="featured-card reveal">
  <div class="badges"><span class="badge gold">Featured</span>{corr}</div>
  <h3>{title_html}</h3>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])}</p>
  {doi_line}
  <p class="meta-links"><button class="text-link" type="button" {featured_attrs(p)}>{ico(ICON_PHOTO)}View figure</button></p>
</article>''')

def proj_card(p, status_label="Outcomes"):
    n, r, f, pe, g, o = p
    return f'''<article class="card reveal">
  <h3>{escape(n)}</h3>
  <dl class="meta-dl">
    <div><dt>Role</dt><dd>{escape(r)}</dd></div>
    <div><dt>Funding</dt><dd>{escape(f)}</dd></div>
    <div><dt>Period</dt><dd>{escape(pe)}</dd></div>
    <div><dt>Goals</dt><dd>{escape(g)}</dd></div>
    <div><dt>{status_label}</dt><dd>{escape(o)}</dd></div>
  </dl>
</article>'''

ongoing_proj_html = "\n".join(proj_card(p, "Status") for p in ongoing_projects)
proj_html = "\n".join(proj_card(p) for p in projects)

research = page("Research · Hua-Xu Zhong", "research", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Output</p><h1>Research</h1><p>Publications and projects in educational technology, AI learning platforms, and design-based instruction.</p></div>
    {titled("h2", "Research interests", ICON_BULB)}
    <div class="pillar-sections">
{pillar_sections}
    </div>
    {titled("h2", "Publications", ICON_BOOK, "block-title reveal spaced")}
    <p class="when reveal" data-glance>
      <span class="badge">Corresponding author</span> on {len(corr_pubs)} of the publications below ·
      <span class="badge">International research experience</span> {escape(intl_proj[3]) if intl_proj else ""} abroad, per the project record ·
      <span class="badge">International houses</span> every venue above is peer-reviewed and international: {", ".join(houses)}.
    </p>
    <div class="filters reveal" data-filter-group>
      <button class="chip is-on" type="button" data-filter="all">All ({len(pubs)})</button>
      <button class="chip" type="button" data-filter="Journal">Journal ({j_count})</button>
      <button class="chip" type="button" data-filter="Conference">Conference ({c_count})</button>
    </div>
    {''.join(year_html)}
    {titled("h2", "Featured papers", ICON_SPARK, "block-title reveal spaced")}
    <div class="featured-grid">{''.join(feat_html)}</div>
    {titled("h2", "Research projects", ICON_CASE, "block-title reveal spaced")}
    <h3 class="subhead reveal">Ongoing</h3>
    <div class="proj-list">{ongoing_proj_html}</div>
    <h3 class="subhead reveal" style="margin-top:2rem">Completed</h3>
    <div class="proj-list">{proj_html}</div>
  </div>
</section>
""", extra=f"""
<div class="modal" id="featured-modal" role="dialog" aria-modal="true">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-panel">
    <button class="modal-close" type="button" data-close aria-label="Close">{ICON_X}</button>
    <p class="eyebrow" style="color:var(--accent)">Featured paper</p>
    <h3 data-modal-title></h3>
    <p class="authors" data-modal-authors></p>
    <p class="source" data-modal-source></p>
    <p class="source" data-modal-note style="color:var(--accent);font-weight:600">Corresponding author: Hua-Xu Zhong</p>
    <div class="figure-box"><strong>Figure forthcoming</strong><p class="when">The official paper figure will appear here once it is added.</p></div>
    <p style="margin-top:1rem"><a class="btn btn-primary" data-modal-doi target="_blank" rel="noopener">Open DOI</a></p>
  </div>
</div>
""")

# Teaching principles — one chain: direction -> solution -> connection.
PRINCIPLES = [
    {
        "step": "01 · Direction",
        "name": "Independent Thinking",
        "icon": ICON_USER,
        "text": "For me, independent thinking means staying with a problem before reaching for help: questioning what is given, tolerating ambiguity, and forming my own judgment first. AI can provide answers, but deciding which questions are worth asking remains a human responsibility.",
    },
    {
        "step": "02 · Solution",
        "name": "Creativity",
        "icon": ICON_BULB,
        "text": "I understand creativity as an open mind, as imagination that is not fenced in by habit. Once a direction opens, creativity is what finds the way forward. I believe this matters even more in the GAI era: AI can produce answers quickly, but imagining new possibilities is still a human strength.",
    },
    {
        "step": "03 · Connection",
        "name": "Collaboration",
        "icon": ICON_USERS,
        "text": "Few problems are solved alone. Collaboration connects the people and tools around a problem, including AI, so that a good idea travels further than one person could carry it. I do not see collaboration as seeking agreement. I see it as building a network that can solve problems no single person could.",
    },
]

principle_cards = "\n".join(
    f'''<article class="card lift reveal"{f' style="--d:{i * 70}ms"' if i else ""}><p class="step">{escape(p["step"])}</p><div class="head-row">{chip(p["icon"])}<div><h3>{escape(p["name"])}</h3></div></div>
      <p>{escape(p["text"])}</p></article>'''
    for i, p in enumerate(PRINCIPLES)
)


# Courses — data-driven, like PILLARS/GALLERY. FUTURE (owner note, 2026-08):
# online courses will be appended here. Each entry:
#   {"name": ..., "level": ..., "period": ..., "desc": ..., "tags": [...], "url": ...}
# "url" is optional — when present the course title links out (hosted online course).
# An empty list renders the "in preparation" note instead.
COURSES = []

if COURSES:
    course_cards = []
    for c in COURSES:
        if c.get("url"):
            title = f'<a href="{escape(c["url"])}" target="_blank" rel="noopener">{escape(c["name"])} {ico(ICON_OUT)}</a>'
        else:
            title = escape(c["name"])
        period = f' · {escape(c["period"])}' if c.get("period") else ""
        tags = "".join(f'<span class="badge">{escape(t)}</span>' for t in c["tags"])
        course_cards.append(f'''<article class="card lift reveal"><h3>{title}</h3>
  <p class="when">{escape(c["level"])}{period}</p>
  <p>{escape(c["desc"])}</p>
  <div class="badges">{tags}</div></article>''')
    courses_html = f'<div class="grid-2">{"".join(course_cards)}</div>'
else:
    courses_html = f'<div class="dashed empty reveal">{chip(ICON_CAP)}<div><strong>Course list in preparation</strong><p class="when">Syllabi and semester offerings will live here when teaching appointments are listed.</p></div></div>'

teaching = page("Teaching · Hua-Xu Zhong", "teaching", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Classroom</p><h1>Teaching &amp; practice</h1><p>Inquiry, creativity, and careful use of AI.</p></div>
    <article class="card philosophy reveal">
      <h2 class="with-ico">{ico(ICON_BULB)}Teaching philosophy</h2>
      <p>I believe education is not the transfer of information. It is the transformation of the learner. Three ideas guide my teaching, and they connect in sequence: independent thinking opens a direction, creativity finds a way forward, and collaboration carries it further.</p>
      <p>This chain rests on literacy: AI literacy, information literacy, and computational thinking form the working grammar that inquiry runs on in the GAI era.</p>
    </article>
    <div class="grid-3 principles">
{principle_cards}
    </div>
    <article class="card philosophy spaced reveal">
      <h3 class="with-ico">{ico(ICON_SPARK)}Careful use of AI</h3>
      <p>Students also run into barriers, cognitive, emotional, or situational. When human support is not there at the moment a student needs it, large language models can offer personalized feedback, ideas, and scaffolding so that learning can continue. I do not see LLMs as a replacement for human teaching. I use them as a support system between the learner and their next step.</p>
      <p class="pillar-more"><a class="text-arrow" href="position.html">Read my full position {ico(ICON_RIGHT)}</a></p>
    </article>
    <p class="closing-line reveal">I teach because I believe education can be a form of liberation. It should help people imagine and build better worlds, not only adapt to the one they have.</p>
    {titled("h2", "Courses taught", ICON_CAP, "block-title reveal spaced")}
    {courses_html}
  </div>
</section>
""")

# Position page — my stance on generative AI in education, in conversation with
# the MIT Ad Hoc Committee report (August 13, 2026). The convergence map pairs
# each of my stances with the report principle it lines up with.
MIT_REPORT_URL = "https://aiandeducation.mit.edu/report/"
CONVERGENCE = [
    {
        "stance": "AI should support learners, not replace their thinking.",
        "principle": "Augmentation, not automation",
        "sec": "§2.7",
        "note": "Use AI to augment curiosity, creativity, and learning instead of automating them.",
    },
    {
        "stance": "Human strengths are the learning goals.",
        "principle": "Lean into learning",
        "sec": "§2.4",
        "note": "Protect the productive struggle that builds judgment and metacognition.",
    },
    {
        "stance": "Learning stays a social act.",
        "principle": "Think beyond the classroom and the campus",
        "sec": "§2.8",
        "note": "Education is a cultural practice built on relationships AI cannot replace.",
    },
]

conv_rows = "\n".join(
    f'''<div class="conv-row">
  <div class="conv-cell"><p>{escape(r["stance"])}</p></div>
  <div class="conv-link" aria-hidden="true"></div>
  <div class="conv-cell mit"><h3>{escape(r["principle"])} <span class="badge">{escape(r["sec"])}</span></h3><p class="when">{escape(r["note"])}</p></div>
</div>'''
    for r in CONVERGENCE
)

# Principle-by-principle read of the report (Section 2, eight principles).
# Each row: what the committee says ("said") and where it lands in my work ("read").
# Rows render as alternating media rows. Visual direction (owner decision 2026-08):
# all eight rows use generated illustrations (IMG/principle-2-*.jpg, one flat
# editorial world). A typographic CSS-plate variant (.plate, .plate-navy,
# .plate-paper) is kept in css/site.css as a fallback: drop an entry's "img"
# key to render it as a plate again.
PRINCIPLE_READS = [
    {
        "sec": "§2.1",
        "name": "Be humble",
        "img": "IMG/principle-2-1.jpg",
        "alt": "Illustration of a small student figure standing on a thin amber horizon line before an enormous abstract machine shape whose top dissolves into dotted lines",
        "said": "Generative AI is barely four years old and already past a billion users. The committee states up front that no recommendation can be final on a technology moving this fast, and offers the whole report in a spirit of humility, expecting course corrections as the technology evolves.",
        "read": "Humility belongs in research as much as in teaching. For me, the constant is not only to keep asking questions that outlast any model version. It is to keep independent thinking in charge. When everyone works with the same generative tools, this is the moment for your own thinking to lead the technology, not for the technology to drive your research.",
    },
    {
        "sec": "§2.2",
        "name": "Be bold",
        "img": "IMG/principle-2-2.jpg",
        "alt": "Illustration of a student kneeling on a cliff edge to place planks of an amber bridge across a gap, with a flag and a cheering abstract figure on the far cliff",
        "said": "Uncertainty cannot be an excuse for inaction. The committee calls for a strategic response rather than patches and duct tape, and points to genuinely new possibilities: individualized tutoring at scale, and research work that was out of reach a few years ago. Boldness matters most, the report argues, because today's students will soon shape how society uses this technology.",
        "read": "My agenda is my way of building instead of patching: helping generative AI flow naturally into education, through feedback, scaffolding, assessment, and course design that keep working when human support runs out.",
    },
    {
        "sec": "§2.3",
        "name": "Put humanity front and center",
        "img": "IMG/principle-2-3.jpg",
        "alt": "Illustration of students and a teacher seated in a discussion circle traced by an amber line, while two small abstract machine figures listen from outside the circle",
        "said": "Some MIT instructors were weighing AI agents against hiring undergraduates as research assistants. The committee's answer: research on a campus is also an apprenticeship, and its seeming inefficiencies are a feature rather than a bug. It also warns that policing AI use corrodes trust on both sides, especially while detection tools remain unreliable.",
        "read": "This principle meets my third stance: learning stays a social act. Behind it is a simple priority: cultivating each person's own thinking comes first. Over-reliance on AI, whether it does the thinking for a student or takes away the people a student learns with, only removes the chance for that capacity to develop.",
    },
    {
        "sec": "§2.4",
        "name": "Lean into learning",
        "img": "IMG/principle-2-4.jpg",
        "alt": "Illustration of a student climbing a steep rock wall while an abstract machine figure below belays the amber safety rope without pulling",
        "said": "The committee argues the deepest risk goes beyond cheating: many uses of AI deprive students of the chance to learn at all. It calls for a new social contract in which students understand that the process of education is productive struggle, and that its most important product is themselves, their judgment, imagination, and metacognition.",
        "read": "This principle sits behind my first stance, and I apply it through the goal, not a fixed rule. The first question is what the AI support is for. When the goal is the student's own capability, some of the difficulty is the learning itself, and it has to stay. Much of my design work looks for valuable human-AI interaction that produces creative work, and I am still working toward designs that know which difficulty to protect.",
    },
    {
        "sec": "§2.5",
        "name": "Teach with intentionality",
        "img": "IMG/principle-2-5.jpg",
        "alt": "Illustration of an instructor sketching an amber route on a large drawing sheet, winding backward from a lighthouse-shaped goal through milestone markers to the starting point",
        "said": "Instead of reacting to AI feature by feature, the committee recommends backward design: define what students should know, be able to do, and learn to value, then decide where AI helps and where it does not. When instructors explain why AI is allowed or limited, students are more likely to understand the learning that is being protected.",
        "read": "I think about my teaching chain in the same order: start from the human strengths a course should build, then decide where AI belongs along the way. The goal sets the direction. The tool is chosen after it.",
    },
    {
        "sec": "§2.6",
        "name": "No one size fits all",
        "img": "IMG/principle-2-6.jpg",
        "alt": "Illustration of five different students walking toward five differently shaped doors along a wall, with amber light spilling from one open door",
        "said": "A poetry seminar, a proof course, and a design lab each call for a different relationship with AI, and a first-year student differs from a doctoral candidate. Instead of one campus-wide rule, the report proposes a shared framework: a common policy menu, disclosure expectations, and accountability standards, with departments choosing within it.",
        "read": "I take this principle as a teaching question more than a rule-making one. Students in a single course can arrive with very different levels of AI literacy, and one kind of support cannot fit them all. Cultivating that literacy, and differentiating teaching around it, belongs to the literacy strand of my first research pillar.",
    },
    {
        "sec": "§2.7",
        "name": "Augmentation, not automation",
        "img": "IMG/principle-2-7.jpg",
        "alt": "Illustration of a student at a desk drawing a pencil line that lifts off the page and rises into steps, while an abstract geometric figure steadies the desk lamp",
        "said": "Overreliance on chatbots can erode critical thinking, memory, confidence, and mastery, and a quick answer can trigger what the report calls cognitive surrender: falling back on AI at the first hint of struggle. Borrowing the pro-worker AI argument from economists Acemoglu, Autor, and Johnson, the committee asks for pro-learner AI that expands what students can think about, learn, and solve.",
        "read": "This principle is closest to what I design for: AI that is good for the learner. I hold it as a question, not a rule. In a learning task, does this use of AI leave the student's own thinking stronger when the AI is taken away? If the answer is no, the use is over-reliance, even when the output looks fine.",
    },
    {
        "sec": "§2.8",
        "name": "Think beyond the classroom and the campus",
        "img": "IMG/principle-2-8.jpg",
        "alt": "Illustration of a schoolhouse with its side walls swung open onto a wide landscape, students walking out in pairs along a winding amber path",
        "said": "Drawing on Jerome Bruner's The Culture of Education, the committee frames education as a cultural practice: students learn to interpret the world, form identities, and join communities. The danger it names is a transactional mindset, assignments as outputs, peers as optional, a degree as a commodity, and this mindset will follow students into work and civic life.",
        "read": "My third stance meets this principle without conflict: learning already happens in relationships, and the transactional mindset the report warns about is what those relationships make visible. The situation is complicated and depends on context. Fair access belongs here too, in a specific sense: the gap I worry about most is not who can buy the strongest model. It is who has someone to teach them to use it well. Whether AI narrows or widens that gap depends on how it is brought into teaching.",
    },
]

principle_rows = []
for i, r in enumerate(PRINCIPLE_READS):
    flip = " flip" if i % 2 else ""
    if r.get("img"):
        visual = (
            f'<figure class="media-fig"><img src="{escape(r["img"])}" alt="{escape(r["alt"])}" loading="lazy" /></figure>'
        )
    else:
        tone = " plate-paper" if i % 2 else " plate-navy"
        visual = (
            f'<div class="media-fig plate{tone}" aria-hidden="true">'
            f'<span class="plate-num">{escape(r["sec"])}</span><span class="plate-rule"></span>'
            f'<span class="plate-name">{escape(r["name"])}</span></div>'
        )
    principle_rows.append(
        f'''<div class="media-row reveal{flip}">
  {visual}
  <div class="media-copy">
    <h3>{escape(r["sec"])} {escape(r["name"])}</h3>
    <p>{escape(r["said"])}</p>
    <p class="my-read"><span class="read-tag">My read</span>{escape(r["read"])}</p>
  </div>
</div>'''
    )
principle_rows_html = "\n".join(principle_rows)

# "Four years, from where I was standing" — my own account of using generative AI since the first
# public models, written down from the owner's telling (2026-09-23). Two names are his and only two:
# GPT, where he started, and Gemini 3 Pro, the point at which he says the tools began doing what they
# could not before. No other dates or version numbers are added, because the page would then be
# claiming a timeline it does not keep. The last beat is the newest models and vibe coding, in his
# words again. The claim the section lands on is deliberately the narrower one he chose: producing
# more of what already exists can be replicated, deciding what should exist cannot.
GAI_BEATS = [
    {
        "name": "When the first one arrived",
        "text": "When GPT first appeared, the first thing it amplified was the ordinary work of "
                "research and teaching: searching, writing, and the first draft of almost anything. "
                "It did not know what the CDIO engineering framework was — the framework stayed in my "
                "head, I drove the tool from it and asked again — but the leverage was obvious. At "
                "that point generative AI really was, for me, a small technical breakthrough.",
    },
    {
        "name": "The doubt that arrived with the leverage",
        "text": "The doubt came soon after: I became aware that something was off. At that point I "
                "could not yet say exactly what.",
    },
    {
        "name": "The moment it began doing what it could not",
        "text": "At the point when Gemini 3 Pro arrived, that changed for me. It began doing things I "
                "had not seen done before, writing code among them, and a question in almost any "
                "subject now comes back with something close to a competent explanation — close "
                "enough that a student working alone with it can get near the level of studying with "
                "someone who teaches them. I will not claim that the hallucination problem is gone. I "
                "will claim it clears a certain teaching standard, and that makes it a different kind "
                "of tool from the one I started with.",
    },
    {
        "name": "What I expected, and what did not happen",
        "text": "I expected higher education to reorganize itself around this — teaching, assessment, "
                "and the question of what a course is for. That did not happen, and I may have "
                "imagined the change as more dramatic than it could ever have been — but not this "
                "undramatic either, and meanwhile the tools did not wait: the newest models made vibe "
                "coding real, and one person can now produce a polished application or a playable "
                "game without a team.",
    },
]
gai_beats_html = "\n".join(
    f'      <li><strong>{escape(b["name"])}.</strong> {escape(b["text"])}</li>' for b in GAI_BEATS
)
# What the story is for: the standing argument of this site, said once more in its own words. Kept
# short because the list further down this page is about research directions, and a page that argues
# the same point twice stops being read.
GAI_PREPARE = [
    {
        "name": "The question before the answer",
        "text": "A capable tool shortens the distance to an answer. It does not shorten the distance "
                "to a question worth asking, and that work will not happen by accident.",
    },
    {
        "name": "Judgment about the output",
        "text": "Knowing whether an answer is any good is now the expensive half of using one. This is "
                "where information literacy stops being a general virtue and becomes the operating "
                "skill.",
    },
    {
        "name": "Practice in deciding",
        "text": "What to make, what to leave out, what the thing is for. It is the half of creative "
                "work that stays human, and it stays sharp only if it is practiced.",
    },
]
# The comparison the story needs and one image cannot carry: what I expected the room to become, and
# what it did. Two plates of the same size, each labelled, with the claim underneath. Kept as data for
# the same reason the beats are: the generator decides which two files these are, and the registry
# checks them like every other raster. Both alt texts describe what is drawn and claim nothing about
# the world — they are illustrations of two rooms, not records of two rooms.
GAI_PAIR = [
    {
        "tag": "What I expected",
        "img": "IMG/position-expected.jpg",
        "alt": "Illustration of a lecture hall rebuilt around one long shared table, every student "
               "joined by a thin amber line to a large abstract machine built into the wall",
        "note": "A room reorganized around the tools: one table, the machine in the architecture, "
                "everyone connected to it.",
    },
    {
        "tag": "What happened",
        "img": "IMG/position-happened.jpg",
        "alt": "Illustration of identical rows of desks in a lecture hall while a large abstract "
               "machine stands to one side connected to nothing, and one student in the corner works "
               "alone",
        "note": "The same rows, unchanged. The machine stands to one side, wired to nothing, and one "
                "student in the corner uses it by themselves.",
    },
]
gai_pair_html = "\n".join(
    f'''      <div class="gai-cell">
        <img src="{x["img"]}" alt="{escape(x["alt"])}" loading="lazy" />
        <div class="gai-cap"><p class="gai-tag">{escape(x["tag"])}</p><p>{escape(x["note"])}</p></div>
      </div>''' for x in GAI_PAIR
)

gai_prepare_html = "\n".join(
    f'      <li><strong>{escape(x["name"])}.</strong> {escape(x["text"])}</li>' for x in GAI_PREPARE
)

gai_section = f"""    {titled("h2", "Four years, from where I was standing", ICON_CAL, "block-title reveal spaced")}
    <figure class="pos-hero reveal">
      <img src="IMG/position-gai.jpg" alt="Illustration of an abstract machine stamping identical amber pieces onto a belt while a small student figure draws one different amber line in the air" loading="lazy" />
      <figcaption>Making more of what already exists is the part that got automated. Deciding what
        should exist was always the drawing.</figcaption>
    </figure>
    <ol class="stance-list reveal">
{gai_beats_html}
    </ol>
    <figure class="gai-pair reveal">
      <div class="gai-two">
{gai_pair_html}
      </div>
      <figcaption>Both rooms are drawn, not photographed. The left one is the change I was waiting
        for; the right one is the room I keep walking into.</figcaption>
    </figure>
    <p class="reveal"><strong>What this asks of us.</strong> Creative work has two halves, and only one
      of them is being automated. Producing another version, another draft, another shape in a familiar
      style is now cheap and fast. Deciding what should exist, in what form, and for whom is not — and it
      is the half that becomes scarce exactly as the other half becomes free.</p>
    <ol class="stance-list q-list reveal">
{gai_prepare_html}
    </ol>
    <p class="when reveal">The argument is the one my thinking page already draws: the first row of dots
      is what machines do, and the human premium sits in the second row, where the framing, the new
      shape, and the one necessary line live.</p>
    <p class="pillar-more reveal"><a class="text-arrow" href="thinking.html">The dot page: what machines
      already do, and the human premium {ico(ICON_RIGHT)}</a></p>
    <p class="pillar-more reveal"><a class="text-arrow" href="research.html#creativity-design-thinking">My
      Creativity &amp; Design Thinking pillar {ico(ICON_RIGHT)}</a></p>

"""
position = page("Position · Hua-Xu Zhong", "position", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Position</p><h1>AI in education: where I stand</h1><p>My position on generative AI in education, written in conversation with MIT's August 2026 report on AI use in teaching and learning.</p></div>
    <figure class="pos-hero reveal">
      <img src="IMG/position-hero.jpg" alt="Illustration of a student and an abstract AI figure as partners at a shared desk" loading="lazy" />
      <figcaption>AI as a partner in learning, not a substitute for it.</figcaption>
    </figure>
    <p class="reveal">In August 2026, an MIT ad hoc committee published its report on AI use in teaching, learning, and research training. Its questions are the ones I keep asking: what AI does to students' thinking, when it helps learning, and when it quietly replaces it. This page states my position, shows where the report and I converge, walks through its eight principles one by one, sets down what four years of using these tools changed in my thinking, and lists what I want to study next.</p>
    {titled("h2", "My position", ICON_USER)}
    <ol class="stance-list reveal">
      <li><strong>AI should support learners, not replace their thinking.</strong> The best uses of AI extend feedback, ideas, and scaffolding. The risky ones let students hand off exactly the work that learning depends on.</li>
      <li><strong>Human strengths are the learning goals.</strong> When answers are cheap, creativity, judgment, and the discipline to stay with a problem become the real curriculum.</li>
      <li><strong>Learning stays a social act.</strong> Classmates, teachers, and mentors are part of the mechanism, not the packaging. AI should connect people around problems, not isolate them with answers.</li>
      <li><strong>Literacy makes the rest possible.</strong> AI literacy, information literacy, and computational thinking are the working grammar of learning with AI. I treat that grammar as part of the curriculum, not as an optional extra.</li>
    </ol>
    {titled("h2", "Where the MIT report converges", ICON_SPARK, "block-title reveal spaced")}
    <figure class="conv-map reveal">
      <figcaption>My stances on the left, the report's guiding principles on the right.</figcaption>
{conv_rows}
    </figure>
    <p class="when reveal">Related threads also appear in §2.3 (put humanity front and center), §2.5 (teach with intentionality), and §2.6 (no one size fits all).</p>
    <blockquote class="report-quote reveal">
      <p>“AI should be used to augment and enhance curiosity, creativity, and learning, not automate them.”</p>
      <cite>MIT Ad Hoc Committee on AI Use in Teaching, Learning, and Research Training, Report §2.7 (August 13, 2026)</cite>
    </blockquote>
    <p class="reveal">My teaching page argues the same sentence in other words. I cite the report not as a source to follow, but as evidence that I am not thinking about this alone.</p>
    {titled("h2", "The report, principle by principle", ICON_BOOK, "block-title reveal spaced")}
    <p class="reveal">The report organizes its advice around eight guiding principles. Here is each one, first as the committee states it, then as it lands in my own work.</p>
    <div class="principle-rows">
{principle_rows_html}
    </div>
{gai_section}{titled("h2", "Beyond the report: what I want to study", ICON_BULB, "block-title reveal spaced")}
    <ol class="stance-list q-list reveal">
      <li><strong>Designing for inquiry.</strong> What does an LLM learning system look like when its first job is to protect a student's own thinking? I came to this question from my own view of LLMs, and from the problems I saw them create for feedback in learning. My earlier work on feedback and scaffolding is where I start. I have not built such a system yet; that is the direction.</li>
      <li><strong>Creativity as an outcome.</strong> The report asks AI to augment curiosity and creativity. I am asking how creativity can be taught, practiced, and assessed when AI can imitate its products.</li>
      <li><strong>Fair access to good AI.</strong> Access is uneven in two ways: strong models cost money, and the guidance to use them well costs more. I care about designs that support learning across that uneven ground.</li>
    </ol>
    <section class="pillar-sec reveal reference-box">
      <h3>Reference</h3>
      <p>MIT Ad Hoc Committee on AI Use in Teaching, Learning, and Research Training. <i>Report</i>. Massachusetts Institute of Technology, August 13, 2026.</p>
      <p class="pillar-more"><a class="text-arrow" href="{MIT_REPORT_URL}" target="_blank" rel="noopener">Read the full report {ico(ICON_OUT)}</a></p>
      <p class="pillar-more"><a class="text-arrow" href="practice.html">Part two: the recommendations, transferred to a smaller campus {ico(ICON_RIGHT)}</a></p>
    </section>
  </div>
</section>
""")

# "How I think" — the dot-grid page. A nine-panel academic re-cut of the
# connect-the-dots comic that has circulated online since 2020 (lineage traced
# by Language Log to an Aug 2020 Imgur post inspired by GapingVoid). Owner
# brief (2026-08): the grid states his view on information, creativity, and
# problem solving, and motivates why design thinking matters from here on.
# Three acts: what machines already do (1-3), the human premium (4-6), and
# three ways the dots betray us (7-9). All panels are generated illustrations.
GRID_CELLS = [
    {"num": "1", "act": "Act I", "name": "Information", "img": "IMG/grid-1-information.jpg",
     "alt": "Dot-grid panel of fifteen scattered navy dots with no connections",
     "cap": "Dots now arrive faster than anyone can count them. Gathering them is still a basic skill, just no longer the scarce one."},
    {"num": "2", "act": "Act I", "name": "Grouping", "img": "IMG/grid-2-grouping.jpg",
     "alt": "Dot-grid panel of dots enclosed in three dashed grouping rings, one ring drawn in amber",
     "cap": "Sorting dots into piles is classification. Machines do it instantly."},
    {"num": "3", "act": "Act I", "name": "Familiar paths", "img": "IMG/grid-3-familiar-paths.jpg",
     "alt": "Dot-grid panel of dots joined by neat right-angled connection lines, one route in amber",
     "cap": "Joining dots along known routes is what machines do best."},
    {"num": "4", "act": "Act II", "name": "Framing", "img": "IMG/grid-4-framing.jpg",
     "alt": "Dot-grid panel with a hand-drawn amber magnifier ring around four chosen dots",
     "cap": "Choosing which few dots deserve attention, before any line is drawn."},
    {"num": "5", "act": "Act II", "name": "Creativity", "img": "IMG/grid-5-creativity.jpg",
     "alt": "Dot-grid panel of dots connected by amber lines into the silhouette of a paper plane",
     "cap": "The same dots, connected into a shape nobody had drawn."},
    {"num": "6", "act": "Act II", "name": "Wisdom", "img": "IMG/grid-6-wisdom.jpg",
     "alt": "Dot-grid panel of faint grey dots with only two navy dots joined by one amber line",
     "cap": "Two dots, one line: the discipline of the necessary connection."},
    {"num": "7", "act": "Act III", "name": "Over-connection", "img": "IMG/grid-7-hallucination.jpg",
     "alt": "Dot-grid panel of dots connected into a dense chaotic tangle of lines fraying off the edge",
     "cap": "Connect everything to everything, confidently, and the field tangles into noise."},
    {"num": "8", "act": "Act III", "name": "Imposed pattern", "img": "IMG/grid-8-imposed-pattern.jpg",
     "alt": "Dot-grid panel of amber lines joining five dots into a large star while other dots stay unconnected",
     "cap": "Draw the star first, then welcome whatever dots land on it."},
    {"num": "9", "act": "Act III", "name": "Cherry-picking", "img": "IMG/grid-9-cherry-picking.jpg",
     "alt": "Dot-grid panel with one straight amber line through three aligned dots while the remaining dots are faint hollow outlines",
     "cap": "Three cooperative dots, one clean line, and the rest quietly fade out."},
]

grid_cells_html = "\n".join(
    f'''<article class="dot-cell lift reveal"{f' style="--d:{i * 60}ms"' if i else ""}>
  <figure><button type="button" class="dot-play" data-dot-open data-act="{escape(c["act"])}" data-num="{escape(c["num"])}" data-name="{escape(c["name"])}" data-cap="{escape(c["cap"])}" aria-label="Play the dot-trace game for panel {escape(c["num"])}, {escape(c["name"])}"><img src="{escape(c["img"])}" alt="{escape(c["alt"])}" loading="lazy" /><span class="dot-chip" aria-hidden="true"><span class="dot-chip-dots"><i></i><i></i><i></i></span>Trace</span></button></figure>
  <div class="cell-body"><div class="badges"><span class="badge">{escape(c["act"])}</span></div>
  <h3>{escape(c["num"])} · {escape(c["name"])}</h3><p>{escape(c["cap"])}</p></div>
</article>'''
    for i, c in enumerate(GRID_CELLS)
)

GRID_ACTS = [
    {
        "tag": "Act I",
        "name": "What machines already do",
        "img": "IMG/act-1.jpg",
        "alt": "Illustration of a small abstract machine stamping identical neat dot-network cards from an amber ink pad while a student collects one",
        "paras": [
            "Read the first row as a job description for a machine. Collecting dots is retrieval. Grouping them is classification. Joining them along familiar routes is what computers have always done, and they now do it at a scale no person can match. That is not a complaint. It is the ground we stand on.",
            "It does quietly reprice education, though. A curriculum that spends most of its hours training students to gather, sort, and connect information is training them to compete with a machine on the machine's home field. The MIT report lands in the same place when it asks us to augment curiosity, creativity, and learning instead of automating them.",
        ],
    },
    {
        "tag": "Act II",
        "name": "The human premium",
        "img": "IMG/act-2.jpg",
        "alt": "Illustration of a student on a ladder drawing a large amber paper-plane outline across a dotted wall while an abstract machine figure steadies the ladder",
        "paras": [
            "The second row is where the human strengths are. Framing comes first: problem solving begins before any line is drawn, when someone walks up to the field and decides which few dots deserve attention, and why. Creativity is next: taking the same dots everyone has and connecting them into a shape nobody had drawn. Wisdom is the quiet one: the discipline to draw the single necessary line and leave the rest alone.",
            "All three can be practiced, and none of them comes finished. They are the same strengths my position page defends and my teaching chain rehearses: independent thinking that chooses the dots, creativity that finds new shapes, and judgment that keeps only the necessary lines.",
        ],
    },
    {
        "tag": "Act III",
        "name": "Three ways the dots betray us",
        "img": "IMG/act-3.jpg",
        "alt": "Illustration of a student and an abstract machine figure studying a giant tangled knot of dot connections pinned to a board, an amber caution triangle leaning at its foot",
        "paras": [
            "The last row is why literacy is not decoration. Over-connection is the field connected so densely, so confidently, that nothing means anything; a confident voice that joins everything to everything will sound sure and say nothing, whether the voice is a machine's or a person's. The imposed pattern is the star drawn first, with dots welcomed only when they land on it; it is correlation staged as cause, and it powers both conspiracy thinking and misleading charts. Cherry-picking is the clean line through three friendly dots while the rest fade to outline.",
            "Guarding against these three is a learnable craft: checking sources, verifying before connecting, and asking which dots were left out. These habits sit in the ground layer of my map, because AI literacy and information literacy are what let the second row happen without sliding into the third.",
            "The MIT report gives the craft a useful structure, naming three registers of AI literacy. Effective use: verify outputs, know a model's failure modes, and recognize when not to reach for AI at all. Responsible use: understand the difference between augmenting and automating your own thinking, and disclose AI's contribution honestly. Ethical use: ask the harder questions about training data, bias, and authorship.",
        ],
    },
]

act_rows_html = []
for i, r in enumerate(GRID_ACTS):
    flip = " flip" if i % 2 else ""
    paras = "\n".join(f"    <p>{escape(p)}</p>" for p in r["paras"])
    act_rows_html.append(
        f'''<div class="media-row reveal{flip}">
  <figure class="media-fig"><img src="{escape(r["img"])}" alt="{escape(r["alt"])}" loading="lazy" /></figure>
  <div class="media-copy">
    <p class="read-tag">{escape(r["tag"])}</p>
    <h3>{escape(r["name"])}</h3>
{paras}
  </div>
</div>'''
    )
act_rows_html = "\n".join(act_rows_html)

thinking = page("How I think · Hua-Xu Zhong", "thinking", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Thinking</p><h1>Dots, shapes, and one line</h1><p>How I think about information, creativity, and problem solving in the GAI era, and the case for design thinking from here on.</p></div>
    <figure class="pos-hero reveal">
      <img src="IMG/thinking-hero.jpg" alt="Illustration of a student and an abstract machine figure standing before a large wall covered in scattered dots, both holding pencils" loading="lazy" />
      <figcaption>One field of dots, read in three acts.</figcaption>
    </figure>
    <p class="reveal">A comic has circulated online since 2020: a three by three grid about a handful of dots. Scattered dots are Information. Sorted and connected dots become Knowledge. The same dots, joined into an unexpected shape, are Creativity. Two dots with a single line between them are Wisdom. Later remixes added their own warnings, from a scribble called Madness to a pentagram called Conspiracy Theory. Nobody owns the comic. Language Log traced it to an Imgur post from August 2020, itself inspired by a GapingVoid illustration, and strangers have redrawn it ever since.</p>
    <p class="reveal">I keep returning to it because it compresses, into doodles, how I think about information, creativity, and problem solving. This page is my academic re-cut: the same nine-panel skeleton, read in three acts. The first act describes what machines already do well. The second is the work that gains value because of that. The third is how the dots deceive us, and where literacy guards the door.</p>
    {titled("h2", "The nine-panel grid", ICON_CAMERA, "block-title reveal spaced")}
    <p class="reveal">One small field of dots, three acts. Each panel keeps the same cast of dots and changes only what we choose to do with them. Select any panel to play it: a short path lights up across the dots, and you retrace it from memory — the longer the path, the deeper the act.</p>
    <div class="dot-grid">
{grid_cells_html}
    </div>
    {titled("h2", "Reading the grid", ICON_BOOK, "block-title reveal spaced")}
    <div class="principle-rows">
{act_rows_html}
    </div>
    {titled("h2", "Why design thinking, from here on", ICON_PENCIL, "block-title reveal spaced")}
    <div class="media-row reveal">
      <figure class="media-fig"><img src="IMG/diverge-converge.jpg" alt="Illustration of an abstract machine figure pouring a jar of navy dots into a wide paper funnel held by a student, with a single amber line emerging from the funnel toward one circled target dot" loading="lazy" /></figure>
      <div class="media-copy">
        <p>Both halves of the second row, making new shapes and choosing one line, are exactly the moves design thinking rehearses. The Double Diamond from the British Design Council is divergence then convergence, twice: spread across the field to understand, commit to a framed problem; spread into possible shapes, commit to a solution. Stanford's d.school teaches the same rhythm as five stages, from empathize to test, and treats visual thinking, collaboration, and iteration as working principles.</p>
        <p>That is why I think the GAI era raises the stakes for design thinking rather than retiring it. The tools took over the connecting. What remains to teach is the framing, the shaping, and the choosing, and design thinking is the most practiced method we have for all three. It runs through my research pillar on creativity and design thinking, and it is why my teaching chain starts from independent thinking: the habit of choosing your own dots before anyone connects them for you.</p>
        <p class="pillar-more"><a class="text-arrow" href="research.html#creativity-design-thinking">My Creativity &amp; Design Thinking pillar {ico(ICON_RIGHT)}</a></p>
      </div>
    </div>
    <section class="pillar-sec reveal reference-box">
      <h3>Sources &amp; lineage</h3>
      <p>The dot-grid comic circulates in many redrawn versions. Language Log (2021) traces the lineage to an Imgur post of August 2020, inspired by a GapingVoid illustration. <a href="https://languagelog.ldc.upenn.edu/nll/?p=52581" target="_blank" rel="noopener">Language Log</a></p>
      <p>Ackoff, R. L. (1989). From data to wisdom. <i>Journal of Applied Systems Analysis, 16</i>, 3-9. The data, information, knowledge, wisdom ladder that the grid redraws as dots.</p>
      <p>Mednick, S. (1962). The associative basis of the creative process. <i>Psychological Review, 69</i>(3), 220-232. Creativity as forming new connections between distant elements.</p>
      <p>Design Council (2004). The Double Diamond; and the Stanford d.school design thinking process. Reading: <a href="https://ixdf.org/literature/topics/design-thinking" target="_blank" rel="noopener">Interaction Design Foundation, Design thinking</a>.</p>
      <p class="pillar-more"><a class="text-arrow" href="position.html">Continue to my position on AI in education {ico(ICON_RIGHT)}</a></p>
      <p class="pillar-more"><a class="text-arrow" href="practice.html">Part two: the report in practice {ico(ICON_RIGHT)}</a></p>
    </section>
  </div>
</section>
<div class="dot-game" data-dot-game hidden>
  <div class="dot-game-backdrop" data-dot-close></div>
  <div class="dot-game-panel" role="dialog" aria-modal="true" aria-labelledby="dot-game-title">
    <div class="dot-game-head">
      <div class="dot-game-titles"><p class="eyebrow" id="dot-game-act"></p><h3 id="dot-game-title"></h3></div>
      <button type="button" class="dot-game-close" data-dot-close aria-label="Close the dot game"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <p class="dot-help">Watch the amber path light up across the dots, then tap the dots in the same order to retrace it.</p>
    <div class="dot-board-wrap">
      <svg class="dot-lines" data-dot-lines viewBox="0 0 100 100" aria-hidden="true"></svg>
      <div class="dot-board" data-dot-board></div>
    </div>
    <p class="dot-status" data-dot-status role="status" aria-live="polite"></p>
    <div class="dot-game-actions">
      <button type="button" class="btn btn-ghost" data-dot-watch>Watch again</button>
      <button type="button" class="btn btn-ghost" data-dot-reveal>Show me the path</button>
      <button type="button" class="btn btn-ghost" data-dot-again hidden>New path</button>
      <button type="button" class="btn btn-primary" data-dot-close>Done</button>
    </div>
    <p class="dot-cap" data-dot-cap hidden></p>
  </div>
</div>
""")

# Practice page — part two of the MIT report read (owner decision 2026-08: the
# recommendations half lives on its own page, eight clusters, each read from a
# campus without MIT's budget. 2026-09 owner review: the per-row notes are
# labeled "My read" and each take was confirmed or rewritten with the owner;
# the "Fair access" row carries no note, and the former closing "What I have
# left off" paragraph was removed). Rows render with generated scene
# illustrations (owner approved 2026-08); the CSS plate variant
# (.plate) remains as fallback: drop a row's "img" key to render its § plate.
PRACTICE_ROWS = [
    {
        "sec": "§3.1.1-3.1.2",
        "name": "Rebuild assessment",
        "img": "IMG/practice-1-assessment.jpg",
        "alt": "Illustration of a student and a professor in an oral exam conversation across a small table with an open portfolio between them, a small machine figure taking notes nearby",
        "said": "Start by revisiting what each course is actually for, now that AI can complete most written assignments. The committee warns against simply AI-proofing everything: leaning on timed in-class exams narrows what a credential signals and cuts against the deep, unhurried work students should learn to value. Its alternatives are oral exams, semester portfolios, and out-of-class assignments paired with in-class conversations about them.",
        "take": "None of these needs a grant. Rethinking assessment is where I believe the change has to begin, and any individual instructor can begin it. A portfolio defended in conversation is also the cleanest answer to the question everyone asks first: how do I know the student did the work?",
    },
    {
        "sec": "§3.1.3-3.1.4",
        "name": "Projects and social learning",
        "img": "IMG/practice-2-projects.jpg",
        "alt": "Illustration of four students around a work table assembling a small prototype with an amber glowing component, a machine figure handing over a screw",
        "said": "Match the new assessments with more experiential, project-based learning. Because AI lowers the cost of ambitious work, a capstone class can now expect near production-quality software in one term, and architecture students can visualize and test ideas that once took weeks. And because AI is quietly dissolving study groups and office hours, the committee asks every subject to build structured, graded in-person interaction back in, with its purpose explained to students from day one.",
        "take": "The day-one explanation is worth keeping: students follow rules whose purpose they understand, and \"we work in groups because learning here is social\" is a purpose I can defend. Collaboration is an important part of my teaching.",
    },
    {
        "sec": "§3.1.6",
        "name": "Grades, on trial",
        "img": "IMG/practice-3-grades.jpg",
        "alt": "Illustration of a balance scale with a medal on one pan and an open book sprouting an amber shoot on the other, outweighed, while a student watches and a machine holds the column",
        "said": "Grade maximization is itself an incentive to lean on AI, so the committee refuses grade rationing and questions the currency instead. It points to competency- and mastery-based schemes, to employers who already trust their own exercises over transcripts, and admits a thought experiment: if MIT had no grades, much of the incentive to cheat with AI would disappear.",
        "take": "No individual teacher gets to abolish grades, so what transfers is smaller but real: grade the process as well as the answer, give feedback a transcript cannot compress, and let portfolios carry real weight wherever a course produces visible work.",
    },
    {
        "sec": "§3.1.9",
        "name": "The detector temptation",
        "img": "IMG/practice-4-detector.jpg",
        "alt": "Illustration of a nervous student writing at a desk while a giant mechanical arm lowers an amber-ringed magnifying lens over the page, a small machine shrugging beside the desk",
        "said": "The committee recommends against relying on AI detectors and lockdown browsers. Detection invites an arms race with paraphrasing tools that nobody wins, and its false positives land hardest on non-native English writers and neurodivergent students. MIT's disciplinary committee does not accept detector output alone as evidence. The suggested alternatives are version histories, staged deadlines, and work developed in class.",
        "take": "The report itself notes that detector false positives land hardest on non-native English writers, and most students in my classrooms write in English as an additional language. But the stronger point is simpler: authentic assessment — drafts, version histories, work developed in class — produces evidence you can actually see. When that evidence exists, pattern-matching detectors are not needed.",
    },
    {
        "sec": "§3.2.3",
        "name": "Instructors disclose too",
        "img": "IMG/practice-5-disclosure.jpg",
        "alt": "Illustration of a teacher openly presenting a small machine figure at a lectern to three seated students, an amber projector beam on the wall",
        "said": "Students notice immediately when instructors restrict student AI while quietly generating slides, feedback, and grading comments with it, and they read it as a double standard. The committee asks instructors to disclose their own AI use, and suggests a better channel for machine feedback: hand it to students as a revision tool rather than hiding it as the grader.",
        "take": "How a university writes its disclosure policy is out of any one teacher's hands. What is worth keeping here is the symmetry inside the recommendation: whatever students are asked to declare, the people teaching them should be ready to show first.",
    },
    {
        "sec": "§3.2.6",
        "name": "AI in theses, on the record",
        "img": "IMG/practice-6-thesis.jpg",
        "alt": "Illustration of a graduate in a mortarboard clutching a thick thesis with an amber tag pinned to its cover, while a machine figure verifies a stack of reference books",
        "said": "Every thesis should carry a statement of how AI was used in producing it. AI never appears as co-author, and the human author remains responsible for verifying everything, including citations, which language models are known to fabricate.",
        "take": "This recommendation sits closest to my daily work as a researcher. My line is simple: nothing in the work may invent a fact. References an AI suggests get opened and checked, claims get read against their sources, and it is the one habit I would ask of anyone I work with.",
    },
    {
        "sec": "§3.2.4",
        "name": "AI literacy in three registers",
        "img": "IMG/practice-7-literacy.jpg",
        "alt": "Illustration of three pedestals holding a magnifying glass, two hands shaking, and an amber sprouting leaf, with a student and machine figure studying them",
        "said": "The report splits AI literacy into effective use (verify outputs, know a model's failure modes, recognize when not to reach for AI), responsible use (understand augmentation versus automation and disclose honestly), and ethical use (training data, bias, homogenized voice, environmental cost, authorship). It wants these woven through orientation and the whole curriculum, and cites a campus survey where about two thirds of students saw AI as central to their careers while only about a quarter felt their education was preparing them.",
        "take": "This is where the report and my research agenda overlap. The three registers give structure to the literacy ground layer I argue for on my thinking page, and the quarter who feel prepared is the measurable version of why that layer exists. <a href=\"thinking.html\">My thinking page works this out in full</a>.",
    },
    {
        "sec": "§3.3.7",
        "name": "Fair access, priced",
        "img": "IMG/practice-8-access.jpg",
        "alt": "Illustration of a machine figure operating a tap dispenser and three students queuing with cups as an amber stream fills the first cup",
        "said": "Top commercial AI plans run around $200 per month, so students who can pay literally learn with stronger tools than students who cannot. MIT's answer is Parley, a model-agnostic campus platform giving every member about $30 of monthly credits and API access for coding tools. The committee concedes the amount may fall short and asks for continuing review.",
        "take": "",
    },
]

practice_rows = []
for i, r in enumerate(PRACTICE_ROWS):
    flip = " flip" if i % 2 else ""
    if r.get("img"):
        visual = (
            f'<figure class="media-fig"><img src="{escape(r["img"])}" alt="{escape(r["alt"])}" loading="lazy" /></figure>'
        )
    else:
        tone = " plate-paper" if i % 2 else " plate-navy"
        visual = (
            f'<div class="media-fig plate{tone}" aria-hidden="true">'
            f'<span class="plate-num">{escape(r["sec"])}</span><span class="plate-rule"></span>'
            f'<span class="plate-name">{escape(r["name"])}</span></div>'
        )
    said = escape(r["said"])
    take = r["take"]
    if take:
        if "<a href" not in take:
            take = escape(take)
        else:
            head, rest = take.split('<a href="')
            href, tail = rest.split('">', 1)
            link_text, tail2 = tail.split("</a>", 1)
            take = f'{escape(head)}<a href="{escape(href)}">{escape(link_text)}</a>{escape(tail2)}'
        take_html = f'\n    <p class="my-read"><span class="read-tag">My read</span>{take}</p>'
    else:
        take_html = ""
    practice_rows.append(
        f'''<div class="media-row reveal{flip}">
  {visual}
  <div class="media-copy">
    <h3>{escape(r["name"])} <span class="badge">{escape(r["sec"])}</span></h3>
    <p>{said}</p>{take_html}
  </div>
</div>'''
    )
practice_rows_html = "\n".join(practice_rows)

practice = page("Report in practice · Hua-Xu Zhong", "practice", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Practice</p><h1>From principles to practice</h1><p>Part two of my read of MIT's August 2026 report: its action list, read from a campus that does not have MIT's budget.</p></div>
    <figure class="pos-hero reveal">
      <img src="IMG/practice-hero.jpg" alt="Illustration of a student and an abstract machine figure carrying a long scroll together from a grand columned institute building toward a small plain schoolhouse" loading="lazy" />
      <figcaption>What survives the trip from a well-funded campus to an ordinary one?</figcaption>
    </figure>
    <p class="reveal">My first page on the report stayed at the level of positions: the stances I hold, and the eight principles the committee set out. That was an editorial decision, and it left the longer half of the report on the table. This page covers that half: what the committee actually recommends doing, in its ten recommendation groups running from course assessment to campus infrastructure.</p>
    <p class="reveal">I read the list with one bias declared. MIT's solutions assume MIT's resources: pilot funds, fellow programs, standing committees, and a model-agnostic platform with per-user monthly credits. Most campuses have none of these, and neither does a single instructor planning next semester. So for each group I ask the same question: what survives when the budget and the org chart are removed? Usually something does, and it is usually the part that was about pedagogy all along. Eight groups matter most to my context; this page takes them in turn.</p>
    {titled("h2", "The action list, read twice", ICON_CASE, "block-title reveal spaced")}
    <div class="principle-rows">
{practice_rows_html}
    </div>
    <section class="pillar-sec reveal reference-box">
      <h3>Reference</h3>
      <p>MIT Ad Hoc Committee on AI Use in Teaching, Learning, and Research Training. <i>Report</i>. Massachusetts Institute of Technology, August 13, 2026. Recommendations section §3. <a href="{MIT_REPORT_URL}" target="_blank" rel="noopener">Read the full report</a></p>
      <p class="pillar-more"><a class="text-arrow" href="position.html">Part one: my position and the eight principles {ico(ICON_RIGHT)}</a></p>
    </section>
  </div>
</section>
""")

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
if _stale:
    raise SystemExit(f"_gen_html.py: IMG_RULES match nothing: {', '.join(_stale)}")

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
    """One raster, described once, then used by both the wall and the roll.

    The tile and its plate are the same record, so the caption is written here and appears in both.
    The alternative is two texts that drift.
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


def _plate_for(items):
    """The roll: one plate, containing the same items the wall shows, in the same order.

    The order is the whole contract, because the roll is addressed by index: a tile and a frame that
    disagree about position would send a visitor to the wrong photograph. So both are built in one
    pass here, and `verify-walk.mjs` asserts the two counts agree rather than trusting the loop.
    """
    tiles, frames = [], []
    for it in items:
        n = len(frames)
        attrs = poster_attrs(it["src"])
        ident = f"ig-{it['block']}-{n}"
        tag = "generated plate" if it["kind"] == "generated" else it["kind"]
        label = f"{it['title']} \u00b7 {BLOCK_LABEL[it['block']]} \u00b7 {tag}"
        # The wall is the photographs and nothing else. What a plate may claim — its block, and that it
        # is generated rather than taken — is said inside it, where you have to arrive to read it.
        # A plate carries no door of its own: the wall is grouped by place, and the place's door is
        # the one entrance (gallery_html). Fifteen scattered "walk in" links made the wall read as a
        # pile of invitations instead of three places with their little areas inside.
        tiles.append(
            f'<div class="ig-cell">'
            f'<a class="ig-tile" href="#{ident}" data-ig '
            f'aria-label="{escape(label)}: open in the roll">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {attrs} loading="lazy" /></a>'
            f'</div>')
        frames.append(
            f'<figure class="ig-frame" id="{ident}">'
            f'<img src="{escape(it["src"])}" alt="{escape(it["alt"])}" {attrs} />'
            f'<figcaption>{escape(it["title"])} - {escape(it["caption"])}'
            f'<span class="when">{escape(label)}</span></figcaption></figure>')
    if not frames:
        return tiles, ""
    nav = ""
    if len(frames) > 1:
        nav = (
            '\n    <button class="ig-btn prev" type="button" data-ig-prev aria-label="Previous plate">'
            f'{ICON_LEFT}</button>'
            '\n    <button class="ig-btn next" type="button" data-ig-next aria-label="Next plate">'
            f'{ICON_RIGHT}</button>')
    plate = (
        '<div class="modal" id="ig-plate" role="dialog" aria-modal="true" aria-label="The album, '
        'plate by plate">'
        '\n  <div class="modal-backdrop" data-ig-close></div>'
        '\n  <div class="modal-panel ig-plate">'
        '\n    <button class="modal-close" type="button" data-ig-close aria-label="Close the album">'
        f'{ICON_X}</button>'
        '\n    <div class="ig-reel" data-ig-reel>\n      ' + "\n      ".join(frames) +
        '\n    </div>' + nav +
        f'\n    <p class="ig-count" data-ig-count role="status">1 / {len(frames)}</p>'
        '\n  </div>'
        '\n</div>\n')
    return tiles, plate


BLOCK_LABEL = {b["id"]: b["label"] for b in BLOCKS}
# The album's order is the ROOMS table's: a room earlier in the table is read earlier on the wall,
# and the plates that belong to no room keep their registry order after them. Decided here rather
# than in the registry, because the registry is about what an image may claim and the table is about
# where a room stands in the walk — and decided *before* the wall and the roll are built, because
# the roll is addressed by index and a tile that disagrees with its frame sends a visitor to the
# wrong plate.
# The album wall carries only the blocks read as photographs here (classroom). Field notes is not a
# plate wall any more: it is ONE container of three cards, each card a place, and the card itself is
# the door into that room. The sub-area plates (the gate, the stall row, the lanterns) hang inside
# their rooms, as the frames of the little places they stand in for — never on this wall.
ALBUM_ITEMS = sorted(
    (it for b in ALBUM_BLOCKS for it in ALBUM[b["id"]] if b["id"] != "field-notes"),
    key=lambda it: ROOM_ORDER.get(room_of_plate(it["src"]), len(ROOMS)))
album_tiles, gallery_plate = _plate_for(ALBUM_ITEMS)
_tiles_by_block = {b["id"]: [] for b in ALBUM_BLOCKS}
for it, tile in zip(ALBUM_ITEMS, album_tiles):
    _tiles_by_block[it["block"]].append(tile)


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
    src = f"IMG/{rid}-cover.jpg"
    if (ROOT / src).exists():
        media = (f'<span class="place-card-media"><img src="{src}" alt="" loading="lazy" '
                 f'{poster_attrs(src)} /></span>')
    else:
        media = (f'<span class="place-card-media dashed empty">{chip(ICON_CAMERA)}'
                 f'<span class="when">No cover yet</span></span>')
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
                       f'    <p class="when reveal" data-walk-guide>{escape(HOW_TO_WALK)}</p>\n'
                       f'    <div class="place-cards" data-place-cards>\n      '
                       + "\n      ".join(cards) + '\n    </div>')
            continue
        head = (f'<div class="block-head reveal"><h3>{escape(b["label"])}</h3>'
                f'<p class="when">{escape(b["purpose"])} <span class="badge">{escape(b["kind"])}'
                f'</span> {escape(state)}</p></div>')
        inner = (f'<div class="ig-grid" data-ig-grid>{" ".join(tiles)}</div>' if tiles else
                 f'<div class="dashed empty">{chip(ICON_CAMERA)}<div><strong>Nothing in this block '
                 f'yet</strong><p class="when">{escape(b["note"])}</p></div></div>')
        out.append(f'    {head}\n'
                   f'    <p class="when reveal">{escape(b["note"])}</p>\n'
                   f'    <div class="ig-wall" data-ig-wall>\n      {inner}\n    </div>')
    return "\n".join(out)


gallery_wall = gallery_html()
activities = page("Activities · Hua-Xu Zhong", "activities", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Community</p><h1>Academic activities</h1><p>The archive of what has been shown, and a running record of talks. Captions and venues are attached as they are confirmed, and an image without one is filed but not hung.</p></div>
    {titled("h2", "The album", ICON_CAMERA)}
    <p class="when reveal" style="margin:-0.4rem 0 1rem">Three places, and the cards below are
      their doors: pick a card and you are standing inside the place, at eye height, free to walk.
      The photographs themselves live on the places' own walls; this page only holds the doors.
      Which block an image belongs to, and what it is allowed to claim, is declared in the
      generator rather than sorted afterwards.</p>
{gallery_wall}
    {titled("h2", "Talks and visits", ICON_CHAT, "block-title reveal spaced")}
    <p class="when reveal">Invited talks, presentations, workshops, and conference attendance. They will appear as a CV timeline when records are added.</p>
    <div class="dashed empty reveal" style="margin-top:1rem">{chip(ICON_CHAT)}<div><strong>No talks listed yet</strong><p class="when">This page will not invent events. When you add a title, venue, and date, they will appear here as a single timeline.</p></div></div>
  </div>
</section>
""", extra=f"""
{gallery_plate}""")

journals = [
    "Educational Technology Research and Development (SSCI Q1)",
    "Education and Information Technologies (SSCI Q1)",
    "Journal of Educational Computing Research (SSCI Q1)",
    "BMC Medical Education (SSCI Q1)",
    "Frontiers in Psychology (SSCI Q1)",
    "Scientific Reports (SCI Q2)",
    "Library Hi Tech (SSCI Q2)",
    "Journal of Computer Assisted Learning (SSCI Q1)",
    "International Journal of STEM Education (SSCI Q1)",
    "Journal of Control Automation and Electrical Systems (SCI)",
]
service = page("Service · Hua-Xu Zhong", "service", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Community</p><h1>Academic service</h1><p>Editorial work, reviewing, and other contributions to the field.</p></div>
    {titled("h2", "Editorial roles", ICON_BOOK)}
    <article class="card reveal">
      <h3>Consulting Editor</h3>
      <p>Educational Technology Research and Development (ETR&amp;D)</p>
    </article>
    {titled("h2", "Journal & conference reviewing", ICON_USERS, "block-title reveal spaced")}
    <article class="card reveal"><ul class="review-list">{''.join(f'<li>{escape(j)}</li>' for j in journals)}</ul></article>
  </div>
</section>
""")

link_groups = [
    ("Reports & Reading", [
        ("", [("MIT Report: AI Use in Teaching, Learning, and Research Training", "https://aiandeducation.mit.edu/report/", "MIT Ad Hoc Committee, August 2026. Eight principles and campus-wide recommendations for the AI era. My Position page responds to it.")]),
    ]),
    ("Text Generation & LLM Assistance", [
        ("", [("ChatGPT (OpenAI)", "https://chat.openai.com"), ("Gemini (Google)", "https://gemini.google.com"), ("Claude (Anthropic)", "https://claude.ai"), ("Perplexity AI", "https://www.perplexity.ai")]),
        ("Academic and professional writing", [("Notion AI (in Notion)", "https://www.notion.so"), ("Gamma.app", "https://gamma.app"), ("Elicit.org", "https://elicit.org"), ("Grammarly", "https://www.grammarly.com")]),
    ]),
    ("AI Multimedia Generation", [
        ("Image generation", [("Midjourney", "https://www.midjourney.com"), ("DALL-E 3 (OpenAI/ChatGPT Plus)", "https://chat.openai.com"), ("Stable Diffusion (model)", "https://stability.ai/stablediffusion"), ("Adobe Firefly", "https://firefly.adobe.com"), ("Canva Magic Media (in Canva)", "https://www.canva.com")]),
        ("Video generation and editing", [("Runway Gen-2", "https://runwayml.com"), ("Pika Labs", "https://pika.art"), ("Sora (OpenAI, preview)", "https://openai.com/sora"), ("HeyGen", "https://www.heygen.com")]),
        ("Music and audio generation", [("Suno AI", "https://suno.ai"), ("Udio AI", "https://www.udio.com"), ("ElevenLabs", "https://elevenlabs.io"), ("AIVA", "https://www.aiva.ai"), ("Soundraw.io", "https://soundraw.io")]),
    ]),
    ("AI in Academic Applications & Research", [
        ("AI research tools", [("Elicit.org", "https://elicit.org"), ("Connected Papers", "https://www.connectedpapers.com"), ("ResearchRabbit", "https://www.researchrabbit.ai"), ("SciSpace", "https://scispace.com"), ("Zotero", "https://www.zotero.org"), ("Mendeley", "https://www.mendeley.com")]),
        ("AI research and data analysis platforms", [("Google Colaboratory (Colab)", "https://colab.research.google.com"), ("Hugging Face Hub", "https://huggingface.co"), ("Kaggle", "https://www.kaggle.com")]),
        ("AI ethics and responsible innovation", [("AI4People", "https://www.eismd.eu/project/ai4people/"), ("IEEE Ethically Aligned Design", "https://ethicsinaction.ieee.org"), ("Partnership on AI", "https://partnershiponai.org"), ("AI Now Institute", "https://ainowinstitute.org"), ("Stanford HAI", "https://hai.stanford.edu")]),
    ]),
    ("GAI/AI-Assisted Learning & Teaching Platforms", [
        ("AI literacy and programming education", [("Code.org (AI and Machine Learning courses)", "https://code.org/ai"), ("Machine Learning for Kids", "https://machinelearningforkids.co.uk"), ("AI4K12.org", "https://ai4k12.org"), ("Google AI Education", "https://ai.google/education/"), ("MIT RAISE", "https://raise.mit.edu")]),
        ("Advanced AI learning platforms", [("Coursera", "https://www.coursera.org"), ("edX", "https://www.edx.org"), ("fast.ai", "https://www.fast.ai"), ("NVIDIA Deep Learning Institute (DLI)", "https://www.nvidia.com/en-us/training/")]),
    ]),
]
def link_card(item):
    # item = (name, url) or (name, url, note) — note renders as a small annotation
    n, u = item[0], item[1]
    note = f'<p class="when link-note">{escape(item[2])}</p>' if len(item) > 2 else ""
    return f'<a class="card lift" href="{escape(u)}" target="_blank" rel="noopener"><h3>{escape(n)}</h3>{ico(ICON_OUT)}{note}</a>'

blocks = []
for cat, subs in link_groups:
    inner = []
    for sub, items in subs:
        if sub:
            inner.append(f'<h3 class="subhead">{escape(sub)}</h3>')
        cards = "".join(link_card(i) for i in items)
        inner.append(f'<div class="link-grid">{cards}</div>')
    blocks.append(f'<h2 class="cat-head reveal">{escape(cat)}</h2>' + "".join(inner))

links = page("Resources · Hua-Xu Zhong", "links", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Toolkit</p><h1>Resources</h1><p>Selected GAI and academic tools.</p></div>
    {''.join(blocks)}
  </div>
</section>
""")

notfound = page("Page not found · Hua-Xu Zhong", "home", """
<section class="section"><div class="wrap" style="text-align:center">
  <p class="eyebrow">404</p><h1>Page not found</h1>
  <p class="when" style="margin:1rem 0 1.4rem">This address does not match a page on the site.</p>
  <a class="btn btn-primary" href="index.html">Back to home</a>
</div></section>
""", path="404")

(ROOT / "index.html").write_text(home, encoding="utf-8")
(ROOT / "about.html").write_text(about, encoding="utf-8")
(ROOT / "research.html").write_text(research, encoding="utf-8")
(ROOT / "teaching.html").write_text(teaching, encoding="utf-8")
(ROOT / "position.html").write_text(position, encoding="utf-8")
(ROOT / "thinking.html").write_text(thinking, encoding="utf-8")
(ROOT / "practice.html").write_text(practice, encoding="utf-8")
(ROOT / "activities.html").write_text(activities, encoding="utf-8")
(ROOT / "service.html").write_text(service, encoding="utf-8")
(ROOT / "links.html").write_text(links, encoding="utf-8")
(ROOT / "404.html").write_text(notfound, encoding="utf-8")

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
NIA_TRAIL = [nia(la, lo) for la, lo in (                 # the Recreation Trail, north to south
    (43.0801663, -79.0783193), (43.0798741, -79.0783083), (43.0795756, -79.0782919),
    (43.0791767, -79.0782410), (43.0791448, -79.0782451), (43.0788872, -79.0781453),
    (43.0787518, -79.0783178), (43.0787002, -79.0785253), (43.0786750, -79.0785684))]
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


def _ring_m(points, close=True):
    return points + ([points[0]] if close else [])


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
assert len(TOR_MASSING_2025_FEATURES) == TOR_MASSING_2025["stats"]["distance_bands"][-1]["candidates"]
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
            {"id": "stall-kingyo", "kind": "board", "w": 170, "h": 128, "d": 90,
             "x": 322, "z": 330, "y": 0, "ry": -90, "game": "kingyo",
             "title": "The goldfish stall, under the first lanterns",
             "hint": "A toy, not a survey: paper net, a basin of dark water, and goldfish that are "
                     "the street's own lamp colours. Press it to play; nothing here claims a shop "
                     "stood at this address."},
            {"id": "stall-menya", "kind": "board", "w": 170, "h": 128, "d": 90,
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
            {"x": 300, "y": 252, "z": 330, "r": 34, "k": 0.55, "body": "lantern",
             "size": 18, "h": 252, "swing": 1.3, "period": 5.5, "phase": 2.4, "liton": 0.78,
             "of": "stall-kingyo"},
            {"x": -300, "y": 252, "z": 700, "r": 34, "k": 0.55, "body": "lantern",
             "size": 18, "h": 252, "swing": 1.4, "period": 4.8, "phase": 0.9, "liton": 0.81,
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
        # hints. zones/floors feed the district banner and the overlook's standing height.
        "lane": {"w": 1400, "d": 3600, "ceil": 400, "back": 200, "max_d": 10350, "open": True,
                 "open_back": True, "open_end": True,
                 "zones": [[-10, "Table Rock", "the rail, the mist, the doors of the Centre"],
                           [1483, "The Niagara Parkway", "between the Centre and the fun strip"],
                           [2200, "Clifton Hill", "the Street of Fun — 175 feet of lights at the far end"],
                           [3350, "The Rainbow Approach", "440 m of steel to the state line"]],
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
        "day": {"cycle": 900, "start": 0.5, "gain": 1},
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
            {"z": 2560, "x": 300, "yaw": 90, "pitch": -2, "label": "the fun row"},
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
        "day": {"cycle": 900, "start": 0.5, "gain": 1},
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
                 "open_back": True, "open_end": True,
                 "zones": [[-10, "The Goat Island walk", "timber, then the roar"],
                           [2400, "Luna and the American Falls", "290 m over a ledge onto boulders"]]},
        "floor": "pavers",
        "day": {"cycle": 900, "start": 0.5, "gain": 1},
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
            {"id": "woodline-c1", "kind": "landmark", "x": 8800, "z": 3448, "y": 400, "ry": 0,
             "w": 2000, "h": 900, "d": 20, "landmark": True,
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
             "w": 2400, "h": 800, "d": 20, "landmark": True,
             "title": "The gorge on the eastern side",
             "hint": "The same river after the drop, running north-east to the whirlpool. The "
                     "Canadian bank stands across it."},
            {"id": "pool-lower", "kind": "landmark", "x": 15000, "z": 7414, "y": -3000, "ry": 0,
             "w": 24000, "h": 900, "d": 20, "landmark": True,
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
                f'<figure class="story-frame" data-story-frame="{n}" data-room="{escape(d["id"])}">'
                f'<img src="{fr["src"]}" alt="{escape(fr["alt"])}" {poster_attrs(fr["src"])} />'
                f'<figcaption>{escape(fr["title"])} — {escape(fr["caption"])}</figcaption></figure>')
    reel = ""
    if figures:
        joined = "\n      ".join(figures)
        reel = (
            '\n    <div class="story-segs" data-story-segs aria-hidden="true"></div>'
            f'\n    <div class="story-reel" data-story-reel>\n      {joined}\n    </div>'
            f'\n    <p class="story-count" data-story-count role="status">1 of {len(figures)}</p>'
            '\n    <p class="when">Tap the right two thirds for the next frame, the left third for '
            'the previous one. Hold to pause.</p>')
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

    A prop earns a target by being a place in its own right, by carrying `states` (pressing it
    changes the room), by carrying `leave` (it is the way out), or by the record saying so with
    `"place": true` -- which is how a board that is really a place (the wheel's loading apron,
    the curtain across the Rainbow) is kept in the set without making every board a target.
    """
    if o.get("states") or o.get("leave") or o.get("place") or o.get("landmark"):
        return True
    # A frame is a story: it is one of the reel's pictures, hung on a wall, and the reel is what
    # the lane is for. Quieting it would take the site's own story off the wall and put it in a
    # drawer nobody opens.
    if o.get("frame") is not None:
        return True
    return o.get("kind") in PLACE_KINDS


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
    if o.get("states"):
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
    # A landmark stands for something far and large: the falls over the gorge, the bridge across
    # it. It is a target with a long reach and a marker of its own, because the thing it names is
    # not within a hand's reach of anywhere the visitor can stand.
    landmark_attr = ' data-landmark="1"' if o.get("landmark") else ""
    return (f'<button type="button" class="walk-hit{stall}" data-obj="{escape(o["id"])}" '
            f'aria-label="{escape(o["title"])}" data-title="{escape(o["title"])}" '
            f'data-hint="{escape(o["hint"])}" data-ry="{o.get("ry", 0)}" data-w="{w}" data-h="{h}" '
            f'data-d="{dep}"{solid_attr}{kind_attr} style="{style}"{frame}{texture}{leaf_attr}{top_attr}{liton_attr}'
            f'{states}{leave}{awn_attr}{noren_attr}{fascia_attr}{story_attr}{extra_attr}'
            f'{quiet_attr}{landmark_attr}></button>')


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
    small = [o for o in placed if not is_target(o)]
    small_things = ""
    if small:
        rows = "".join(
            f'<li><b>{escape(o["title"])}</b> <span class="when">{escape(o["hint"])}</span></li>'
            for o in small)
        small_things = f"""
    <details class="walk-small">
      <summary>The small things ({len(small)})</summary>
      <ul>{rows}</ul>
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
    # zone bounds and floors are authored in the record's old units and shipped in the scene's —
    # the same 2.9 every object z crosses on its way into the page
    zones = [[round(z * Z_SCALE), n, *rest] for z, n, *rest in lane["zones"]] if lane.get("zones") else []
    # z is depth (record units, ×2.9); the standing height and the x-band of a floor are the
    # lane's own scene centimetres, the same axes `w` rides — they cross the page unscaled
    floors = [[round(a * Z_SCALE), round(b * Z_SCALE), h, x0, x1] for a, b, h, x0, x1 in lane["floors"]] \
        if lane.get("floors") else []
    widths = [[round(a * Z_SCALE), round(b * Z_SCALE), c] for a, b, c in lane["ws"]] if lane.get("ws") else []
    zones_attr = f' data-lane-zones=\'{json.dumps(zones, separators=(",", ":"))}\'' if zones else ""
    floors_attr = f' data-lane-floors=\'{json.dumps(floors, separators=(",", ":"))}\'' if floors else ""
    ws_attr = f' data-lane-ws=\'{json.dumps(widths, separators=(",", ":"))}\'' if widths else ""
    # Round 61: the paving's own width, where the street's is wider than the walk. See the note in
    # the renderer's `pavedAt`: a square's front row stands on its paving, not past it.
    paveds = [[round(a * Z_SCALE), round(b * Z_SCALE), c] for a, b, c in lane["wsp"]] if lane.get("wsp") else []
    ws_attr += f' data-lane-wsp=\'{json.dumps(paveds, separators=(",", ":"))}\'' if paveds else ""
    banner_html = """
    <div class="walk-banner" data-walk-banner aria-hidden="true">
      <b class="walk-banner-name"></b><span class="walk-banner-note"></span>
    </div>""" if lane.get("zones") else ""
    strip_html = ""
    if lane.get("zones"):
        ticks = "".join(
            f'<span class="walk-strip-tick" style="left:{round(z / lane["d"] * 100, 2)}%"'
            f' title="{escape(name)}"></span>' for z, name, *_ in lane["zones"] if z >= 0)
        strip_html = f"""
      <div class="walk-strip" data-walk-strip aria-hidden="true">
        <span class="walk-strip-fill"></span>{ticks}<span class="walk-strip-you"></span>
      </div>"""
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
    # A place whose subject is the day: `"day": True` on the record, or a dict to author the cycle,
    # where it opens in that cycle, and how strong the sun is (`{"cycle": 900, "start": 0.45,
    # "gain": 1}`). The renderer reads all four off the layer, like the lane box and the eye — the
    # day of a place belongs to the place, and the two rooms whose subject is dusk simply do not say
    # it. `cycle` is seconds: four minutes hands a visitor dusk before they have looked around once,
    # so a day page runs the hall's own fifteen.
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
        day_attr = (f' data-lane-day="1" data-lane-day-cycle="{opts.get("cycle", 900)}"'
                    f' data-lane-day-start="{opts.get("start", 0.45)}"'
                    f' data-lane-day-gain="{opts.get("gain", 1)}"')
    return f"""<div class="walk" id="walk-{did}" data-walk="{label}" data-walk-id="{did}"
       data-lane-w="{lane["w"]}" data-lane-d="{walk_d}" data-lane-ceil="{lane["ceil"]}"
       data-lane-back="{lane["back"]}"{max_d_attr}{day_attr}{floor_attr}{zones_attr}{floors_attr}{ws_attr}
       data-eye="{EYE}">{banner_html}
  <div class="walk-view" tabindex="0" data-walk-view role="application"
       aria-label="{label}, a lane you walk in person.{clad}{sight} Drag, arrow keys or A/D to turn,
       W A S D to walk, Shift to run, Space to jump, E while standing still to open what you are
       facing, double-click to let the mouse look, L for the list, I for this note. The first visit is walked through once by a guide strip at the bottom of the screen; it is replayable from this note.
       Nothing is written over the space: every sentence is behind a button.">
    <canvas class="walk-three-canvas" data-walk-three width="16" height="9" aria-hidden="true"></canvas>
    <div class="walk-hits" data-walk-hits>
      {INDENT.join(parts)}
      {walk_islands(d, placed)}
    </div>
  </div>
{offline_html}{game_html}
  <div class="walk-tutor" data-walk-tutor hidden aria-hidden="false">
    <p class="walk-tutor-step" data-walk-tutor-text></p>
    <span class="walk-tutor-n" data-walk-tutor-count></span>
    <button type="button" class="walk-tutor-act" data-walk-tutor-skip aria-label="Skip the guide">skip</button>
    <button type="button" class="walk-tutor-act" data-walk-tutor-done aria-label="Got it, leave me to the lane">done</button>
  </div>
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
    <div class="walk-bottom">
      <div class="walk-tools">
        <span class="walk-fov"><button type="button" class="walk-icon" data-walk-fov="-1"
          aria-label="Wider view">{ICON_FOV_OUT}</button
        ><button type="button" class="walk-icon" data-walk-fov="1"
          aria-label="Narrower view">{ICON_FOV_IN}</button></span>
        <button type="button" class="walk-icon walk-jump" data-walk-jump aria-label="Jump">{ICON_UP}</button>
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
    <div class="walk-aside" data-walk-aside hidden>
      <p class="walk-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk ·
        <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · drag to turn · <kbd>E</kbd> open a thing ·
        <kbd>L</kbd> the list · <kbd>I</kbd> this note · <kbd>Esc</kbd> close, then leave</p>
      <p class="walk-note">With a finger: drag to turn, tap the wall in front of you to open it, tap
        again to put it down. Three ways out — the arrow in the corner, the curtain at the mouth of the
        lane, and a second <kbd>Esc</kbd> once nothing is open any more.</p>
      <p class="walk-note">{label} is drawn, not surveyed: the distances are the artist's, and a
        frame is a depiction of a place rather than a record of standing in it.</p>
    </div>
    <button type="button" class="modal-close" data-walk-card-close aria-label="Close">{ICON_X}</button>
  </div>
  {strip_html}
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


# PLACE_TITLES and the records must name the same set of frames. The album is built before DISTRICTS
# exists (ALBUM sits above it in the file), which is why the titles live in the side table at all;
# this assert is the seam between the two orderings, and it fails the build the moment a frame is
# renamed in a record but not in the table, or a table entry is left pointing at a retired IMG.
_assert_frames = {fr["src"] for d in DISTRICTS for fr in d.get("frames", [])}
assert _assert_frames <= set(PLACE_TITLES), (
    "frames missing from PLACE_TITLES: " + ", ".join(sorted(_assert_frames - set(PLACE_TITLES))))
del _assert_frames


# The walk's order is the ROOMS table's order — earliest first — not the order the records happen to
# appear in the file. Getting this backwards is invisible until someone walks it: the first room's
# curtain would open onto the second room while its far door opened onto the third, and the harness
# asserts the two agree because that is exactly the mistake this line exists to prevent.
open_districts = sorted((d for d in DISTRICTS if d["status"] == "open"),
                        key=lambda d: ROOM_ORDER[d["id"]])


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


# The wiring. The street is the hub for the three main places; a landmark or owned sub-space may
# leave to the room that owns its entrance, following the real walk out one step at a time. Wiring
# defaults here rather than in every record, while an explicit `back_to` preserves that parent link.
# No child space gets a street door; the street itself is the one exception whose back curtain opens
# the album, not itself.
for d in open_districts:
    # A top-level room returns to the street at its own door. Owned spaces author their parent in
    # `back_to`, so Esc unwinds to the object that revealed them before it reaches the street.
    if not d.get("back_to"):
        d["back_to"] = ALBUM_PAGE if d["id"] == "street" else f"{CHAIN_ENTRY}#at-{d['id']}"

rooms_pages = {}
for d in open_districts:
    body = walk_html(d, district_drawer(d)) + "\n" + rooms_plate_html([d])
    rooms_pages[d["page"]] = shell_page(f'{d["label"]} · Rooms · Hua-Xu Zhong', body, d["page"],
                                         d.get("cover", "IMG/1.jpg"), room=d)

# A duplicate key in a dict literal is legal Python and silently keeps the last one, so a row of
# lanterns can sit in this file looking authored while another list, further down the same record,
# is the one that reaches the page. This record had exactly that: two `"lanterns"` keys, and the
# edits were going into the dead one. It costs one parse of this file to catch the whole class.
def _assert_no_duplicate_keys():
    import ast as _ast
    _tree = _ast.parse((ROOT / "_gen_html.py").read_text(encoding="utf-8"))
    _bad = []
    for _node in _ast.walk(_tree):
        if not isinstance(_node, _ast.Dict):
            continue
        _seen, _dupes = set(), set()
        for _k in _node.keys:
            if isinstance(_k, _ast.Constant) and isinstance(_k.value, str):
                if _k.value in _seen:
                    _dupes.add(_k.value)
                _seen.add(_k.value)
        if _dupes:
            _bad.append((getattr(_node, "lineno", 0), sorted(_dupes)))
    if _bad:
        raise SystemExit(
            "duplicate dict keys in _gen_html.py (later ones win, silently):\n" +
            "\n".join(f"  line {ln}: {', '.join(repr(k) for k in ks)}" for ln, ks in _bad))


_assert_no_duplicate_keys()

for _path, _html in rooms_pages.items():
    (ROOT / _path).write_text(_html, encoding="utf-8")

(ROOT / "robots.txt").write_text(
    f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
# The lastmod was pinned to 2026-08-31 by hand, so the sitemap had been telling crawlers the site
# had not changed in five weeks while the branch moved on underneath it. It now comes from the HEAD
# commit's date, which is both true and stable: the same content produces the same file, so the
# build stays idempotent instead of stamping itself with today and churning on every run.
try:
    LASTMOD = subprocess.run(["git", "log", "-1", "--format=%cs"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
except Exception:
    LASTMOD = "2026-08-31"
if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", LASTMOD or ""):
    LASTMOD = "2026-08-31"
# The homepage is the one a name search should land on; the rooms come after it.
PRIORITY = {"index.html": "1.0", "about.html": "0.9", "research.html": "0.9",
            "position.html": "0.8", "publications": "0.8"}
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{SITE}/{p}</loc><lastmod>{LASTMOD}</lastmod>"
              + (f"<priority>{PRIORITY[p]}</priority>" if p in PRIORITY else "")
              + "</url>\n"
              for p in PUBLIC_PAGES + [d["page"] for d in open_districts
                                       if d["page"] not in PUBLIC_PAGES])
    + "</urlset>\n", encoding="utf-8")
print("wrote html pages")
