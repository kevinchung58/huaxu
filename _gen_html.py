#!/usr/bin/env python3
import hashlib
import re
import subprocess
import json
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
    asset and every page asks for the new bytes.
    """
    h = hashlib.sha1()
    for f in ("css/site.css", "js/site.js"):
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
    "fukuoka": "Moji Port on a table: the station, the customhouse, the Blue Wing drawbridge "
                "and the ships on the Kanmon Strait, at dusk.",
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
               "arrow keys or a gentle drag to turn, E to use what is in front of you, or the "
               "on-screen pad on a phone. A landmark's own object may lead to another real space; "
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
    "glassfloor": (220, 4, 180),
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
}

# Props whose ground footprint is physically occupied. The generator stamps these as collision
# boxes for the walker; floor graphics (drains, tracks, glass floor) and traversable steps are
# deliberately absent. A record may override `solid` per prop when its place calls for an exception.
WALK_SOLID_KINDS = frozenset({
    "bank", "bench", "bikes", "bin", "bollard", "booth", "cones", "crate",
    "hydrant", "ladder", "mailbox", "meter", "pipe", "planter", "plinth", "pole",
    "rack", "recycle", "shrine", "sign", "signA", "stall", "tree", "utility", "vending", "shopbay",
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
         "alt": "Illustration of the Niagara promenade: iron railing right, hedges and lamp posts "
                "left, a great column of white mist rising ahead.",
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
                "skyline, one amber ring at the pod, a pale band of lake behind.",
         "caption": "The one silhouette the city is known by, drawn at dusk."},
        {"src": "IMG/toronto-tower-2.jpg", "title": "The city from above",
         "alt": "Illustration of the night city seen from above through floor-to-ceiling pod "
                "windows: an aerial grid of navy blocks with amber windows, a dark lake at the shore.",
         "caption": "The LookOut glass at 346 m: the city below reads as a grid with a lake for an edge."},
        {"src": "IMG/toronto-tower-3.jpg", "title": "342 m of drop",
         "alt": "Illustration looking straight down through a glass floor panel to miniature "
                "streets far below, the tower's shadow across them, shoe tips at the near edge.",
         "caption": "The Glass Floor: the whole height of the tower read as the drop under your feet."},
    ],
}
# Nakamise's rows, generated from the sourced figures (round 32; TODO section 0n), because every
# number here is the street's: three runs of shops in the street's own order and share of its length,
# the two crossings at a street's width, and every bay a real shop's width -- the average of its row
# (about 250 m of shops, 35 on the west and 54 on the east, so 7.3 m and 4.7 m). Walk centimetres
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
    for tag, x, ry, width, row, side in (("w", -380, 90, 730, 35, "west"), ("e", 380, -90, 470, 54, "east")):
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
                # the strip light under this bay's eave: the bay's own light, so it is pointable
                lamps.append({"x": x, "y": 300, "z": round(zc / Z_SCALE, 2), "of": o["id"],
                              "r": 260, "k": 0.5, "bulb": False, "tint": "rgba(255,236,206,0.22)"})
    # the white globes standing on the fascias, at the ends of each run, alternating rows
    for j, (z0, z1) in enumerate(NAKAMISE_RUNS):
        for k2, zz in enumerate((z0 + 40, z1 - 40)):
            lamps.append({"x": -305 if (j + k2) % 2 == 0 else 305, "y": 430, "z": round(zz / Z_SCALE, 2),
                          "r": 200, "k": 0.32, "tint": "rgba(255,246,230,0.20)"})
    surfaces = []
    for side in (-1, 1):
        surfaces.append({"side": side, "z0": -103.45, "z1": 1040, "y0": 0, "y1": 500,
                         "kind": "concrete", "tone": 0.8})
        for g0, g1 in NAKAMISE_GAPS:
            surfaces.append({"side": side, "z0": round(g0 / Z_SCALE, 2), "z1": round(g1 / Z_SCALE, 2),
                             "y0": 0, "y1": 500, "kind": "concrete", "tone": 0.7})
    return bays, lamps, surfaces


NAKAMISE_BAYS, NAKAMISE_LAMPS, NAKAMISE_SURFACES = _nakamise()

# Moji Port's layout (round 32; TODO section 0n). OpenStreetMap coordinates, turned into metres from
# Mojiko Station and then into the table's frame: the table is read from the head of the No. 1 basin
# looking north-west, so its right is north-east, at 1.5 cm to the metre for every model and for the
# strait beyond the far wall. Walk centimetres out; record depths are these / Z_SCALE.
MOJI_ORIGIN = (33.9451155, 130.9614754)            # Mojiko Station, OSM relation 2532442


def moji_xy(lat, lon):
    e = (lon - MOJI_ORIGIN[1]) * 92436.0            # metres east, at this latitude
    n = (lat - MOJI_ORIGIN[0]) * 110922.0           # metres north
    r, f = (e + n) * 0.70711, (n - e) * 0.70711     # right (north-east), forward (north-west)
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

DISTRICTS = [
    {
        # The hub. The street is the site's own ground — it names no city, carries no lettering, and
        # hangs no pictures: its whole job is to be the place the three rooms stand on, with a door
        # for each and a sky over both. It is outdoors the way Canada's walkway is: the "ceiling" is
        # high enough to read as open sky, the far end opens onto the harbour instead of stopping, and
        # the sun and street fixtures share the light across the walk.
        "id": "street", "label": "The street",
        "page": ROOM_BY_ID["street"]["page"],
        "plates": ROOM_BY_ID["street"]["plates"],
        # Longer than it used to be on purpose: the rooms now stand a walk apart, so stepping out
        # of one and into the next is a journey with the other doors ahead of you, not three doors
        # in a row. max_d stops a stride short of the quay rail: the street ends at the water's
        # edge on purpose, and the walk is allowed to stand at the rail, not past it.
        # The lane runs past its last door into the quay: 3400 walk units past record depth 1040,
        # ending at a walkable rail rather than a wall.
        "lane": {"w": 700, "d": 1040, "ceil": 620, "back": 300, "max_d": 4150},
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
             "hint": "It opens onto Moji Port: a harbour on a table, at dusk, with a drawbridge "
                     "that stands open for a ship."},
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
            {"label": "Fukuoka", "note": "Moji Port on a table: the station, the customhouse, the "
                                         "Blue Wing and the ships, at dusk.",
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
        "purpose": "Nakamise-dori at night: the approach from Kaminarimon to Hozomon, the shutters "
                   "down and the gates lit",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/tokyo-cover.jpg",
        "cover_caption": "The album's Tokyo sheet, drawn before the room was rebuilt as Nakamise: a "
                         "gate lantern, a scramble, a tower, a counter, a mountain on the skyline.",
        "blurb": "The approach to Senso-ji after the shops have shut. Every shutter is down and "
                 "painted, the eaves are lit, and Hozomon's lantern burns at the far end.",
        "clad_note": (" The lane is Nakamise-dori after closing: two shallow rows of vermilion "
                      "shopfronts nine metres apart, every shutter down and painted, a lit eave over a "
                      "raised walk, a square vermilion post at each bay, granite paving laid square, "
                      "and two cross streets breaking the rows. Nothing on any fascia carries a word."),
        "sight_note": (" At its far end the street opens onto the plaza under Hozomon, its great lantern "
                       "lit, with the five-storey pagoda over the west row; behind you is Kaminarimon "
                       "and its lantern."),
        "objects": NAKAMISE_BAYS,
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
        ],
        "lanterns": [],
        "wires": [],
        "vista": {"x": 0, "y0": 2, "y1": 498, "w": 900},
        "backdrop": {
            # A Tokyo night: the sky holds the city's glow low and goes dark overhead, high enough to
            # cover the frame now that the street has no lid.
            "sky": [{"y0": -260, "y1": 1600, "c": "#3a4868", "glow": 0.9},
                    {"y0": 1600, "y1": 7000, "c": "#26314c"},
                    {"y0": 7000, "y1": 200000, "c": "#161e32"}],
            # The plaza under Hozomon continues the street's own paving: 28 m from the last shops to
            # the gate in life, 30 m here, kept nearly whole because the gate's size is the moment.
            "plaza": {"y": 0, "z0": 3016, "z1": 7600, "half": 2600, "lit": 0.8},
            "temple": {"x": 0, "z": 6000, "gate": {"w": 2100, "h": 2270},
                       "pagoda": {"x": -5600, "z": 7900, "h": 5332}},
        },
        # The sub-places: the album's own plates, stood at the post line in front of the shops at eye
        # height, where the walk passes them and a visitor can reach them -- on the shutters behind
        # the posts they were always farther than the shop itself, and nearest-first reach could never
        # offer them. Each is a drawn plate, captioned as one, and none stands in a cross street.
        "frames": [
            {"id": "sensoji", "src": "IMG/tokyo-sensoji.jpg", "x": -299, "z": 103, "y": 96, "ry": 90,
             "title": "The gate at Asakusa",
             "alt": "Illustration of a temple gate at night with a great red paper lantern hanging "
                    "in its passage.",
             "caption": "The gate the street begins at, drawn: the lantern in its passage, the red "
                        "of the posts. It stands by the west row, a few steps from the real one."},
            {"id": "scramble", "src": "IMG/tokyo-scramble.jpg", "x": -299, "z": 495, "y": 96, "ry": 90,
             "title": "The scramble at Shibuya",
             "alt": "Illustration of a wide pedestrian scramble crossing at night, its stripes "
                    "running every way under tall lit buildings.",
             "caption": "Shibuya's crossing, drawn: another Tokyo, hung as a plate. It is not on "
                        "this street and the street does not pretend it is."},
            {"id": "tower", "src": "IMG/tokyo-tower.jpg", "x": -299, "z": 897, "y": 96, "ry": 90,
             "title": "The tower at dusk",
             "alt": "Illustration of a red and white lattice tower against a dusk sky over low "
                    "rooftops.",
             "caption": "The tower at dusk, drawn. It stands in Shiba, kilometres south of here, "
                        "and no window on this street looks at it."},
            {"id": "poster-lantern", "src": "IMG/tokyo-poster-lantern.jpg", "x": 299, "z": 145, "y": 96,
             "ry": -90,
             "title": "The paper lantern",
             "alt": "Illustration of a single round paper lantern glowing warm against the dark "
                    "grain of a closed shopfront.",
             "caption": "One lantern, close up, drawn. The street's own lanterns are the two great "
                        "ones in its gates."},
            {"id": "poster-wires", "src": "IMG/tokyo-poster-wires.jpg", "x": 299, "z": 862, "y": 104,
             "ry": -90,
             "title": "The wires over the lane",
             "alt": "Illustration of a tangle of overhead wires crossing a dark sky, cut into "
                    "short segments by the rooftops.",
             "caption": "Tokyo's overhead wires, drawn. Nakamise itself is strung with none; the "
                        "plate hangs here as a picture of the city around it."},
            {"id": "poster-ticket", "src": "IMG/tokyo-poster-ticket.jpg", "x": 299, "z": 985, "y": 108,
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
            {"z": 1480, "label": "in the plaza under Hozomon"},
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
                  "owner was in this place.",
    },
    {
        # Moji Port on a table (round 32: laid out from the map; the sources, the measurement table
        # and the inventory are in TODO section 0n). The owner's brief stands -- the station, the
        # customhouse, the Blue Wing and the ships on the Kanmon Strait, a table model, dusk into
        # night, one yatai -- and what changed is that every model now stands where OpenStreetMap
        # puts it, at one scale (1.5 cm to the metre), read from the head of the No. 1 basin looking
        # north-west: the basin in front, the Blue Wing across its mouth, the strait beyond, the
        # Shimonoseki shore on the far left and the Kanmon Bridge far right (NAVITIME: from the
        # bridge, "the Kanmon Bridge on the right"). The first table stood all four buildings in one
        # row at the far edge, two of them on the wrong side of the basin, in a hall still dressed as
        # the alley it had been. `moji_xy` turns each OSM coordinate into the table's frame.
        "id": "fukuoka", "label": "Fukuoka",
        "page": ROOM_BY_ID["fukuoka"]["page"],
        "plates": ROOM_BY_ID["fukuoka"]["plates"],
        # A model hall, as the brief asked ("a table, like Toronto's, like Little Canada"): dark walls,
        # the table lit, and the far wall open onto the strait at the table's own scale. 8.8 m wide so
        # a walker can still go round the true-scale table by the right-hand aisle.
        "lane": {"w": 880, "d": 900, "ceil": 620, "back": 300},
        "purpose": "Moji Port on a table, laid out from the map: the station, the customhouse, the "
                   "Blue Wing and the ships on the Kanmon Strait, from dusk into night",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/fukuoka-cover.jpg",
        "cover_caption": "Moji Port in one sheet: the wooden station, the brick customhouse, the "
                        "Blue Wing standing open, and the strait beyond it.",
        "blurb": "The port at model scale, from the head of the basin. The Blue Wing makes its last "
                 "opening of the day at four, the strait keeps moving, and after dusk the buildings "
                 "come alight one after another.",
        "clad_note": (" The room is a dark model hall: plain walls, a lit table, and on it Moji Port "
                      "laid out from the map at one scale -- the station, the former Osaka Shosen "
                      "building, the basin with the Blue Wing across its mouth, the old customhouse, "
                      "the Dalian memorial building and the tall Retro tower behind them. Nothing on "
                      "any of it carries a word."),
        "sight_note": (" Past the table the far wall opens onto the Kanmon Strait at the same scale: "
                       "ships crossing, the Shimonoseki shore with the Kaikyo Yume Tower to the left, "
                       "and the Kanmon Bridge to the right."),
        "objects": [
            {"id": "plinth-moji", "kind": "plinth", "x": 0, "z": round(2418 / Z_SCALE, 2), "y": 0, "ry": 0,
             "w": 720, "h": 80, "d": 376, "top": "cityg",
             "glow": [{"r": 170, "k": 0.42, "dy": 96, "tint": "rgba(255,214,170,0.36)"}],
             "title": "The table the port stands on",
             "hint": "A lit table at 1.5 cm to the metre. Every model on it stands where the map "
                     "puts it, and the strait beyond the far wall is the same scale."},
            # The No. 1 basin between the hotel quay and the customhouse, from its head to the Blue
            # Wing; and the strait, which the table's far edge hands to the backdrop.
            {"id": "pool-moji", "kind": "pool", "x": 115, "z": round(2378 / Z_SCALE, 2), "y": 80, "ry": 0,
             "w": 93, "h": 2, "d": 276,
             "title": "The No. 1 basin",
             "hint": "The boat basin the Blue Wing crosses, about 60 m wide, opening north-west onto "
                     "the strait. Nothing is claimed about the tide."},
            {"id": "pool-strait", "kind": "pool", "x": 0, "z": round(2560 / Z_SCALE, 2), "y": 80, "ry": 0,
             "w": 720, "h": 2, "d": 90,
             "title": "The Kanmon Strait",
             "hint": "A little over 700 m wide at its narrowest and carrying some 500 ships a day; "
                     "here it starts at the table's edge and runs on past the far wall."},
            {"id": "drawbridge-mj", "kind": "drawbridge", "x": 120, "z": round(2498 / Z_SCALE, 2), "y": 80,
             "ry": 0, "w": 157, "h": 6, "d": 7, "leaves": 0.47,
             "glow": [{"r": 90, "k": 0.3, "dy": 14}],
             "title": "The Blue Wing",
             "hint": "Blue Wing Moji: 108.1 m of pedestrian drawbridge across the basin's mouth, "
                     "completed 1993. Its 24.1 m south leaf is lifted by a wire rope over its pylon, "
                     "its 14 m north leaf by a hydraulic ram, both to about 60 degrees, six times a "
                     "day from 10:00 to 16:00, about twenty minutes each time. Lit after dark; it "
                     "does not open then."},
            {"id": "ship-mj", "kind": "ship", "x": 114, "z": round(2500 / Z_SCALE, 2), "y": 81, "ry": 90,
             "w": 30, "h": 6, "d": 7.5, "run": 140,
             "title": "A harbour boat",
             "hint": "A boat of the basin's own size, using the openings: out under the raised "
                     "leaves on one, back in on the next. The big ships keep to the strait."},
            {"id": "stationfront-mj", "kind": "stationfront", "x": -300, "z": round(2305 / Z_SCALE, 2),
             "y": 80, "ry": 0, "liton": 0.76, "w": 68, "h": 20, "d": 30,
             "title": "Moji Port Station",
             "hint": "Opened in 1914 and still the station it was: a wooden two-storey in the "
                     "neo-Renaissance manner, symmetric, its centre shaped like the character "
                     "\u9580 -- a gate, the first half of the port's own name. In 1988 the first "
                     "station building in Japan designated an Important Cultural Property; restored "
                     "2012 to 2019. It stands south-west of the basin, the far left of the table."},
            {"id": "osakashosen-mj", "kind": "osakashosen", "x": -127, "z": round(2350 / Z_SCALE, 2),
             "y": 80, "ry": 0, "liton": 0.84, "w": 58, "h": 27, "d": 40,
             "title": "The former Osaka Shosen building",
             "hint": "Known by two things, and both are drawn: the tall round-headed arches across "
                     "its face and the octagonal tower on its corner. It stands between the station "
                     "and the basin."},
            {"id": "customhouse-mj", "kind": "customhouse", "x": 193, "z": round(2406 / Z_SCALE, 2), "y": 80,
             "ry": 0, "liton": 0.80, "w": 57, "h": 21, "d": 44,
             "title": "The former Moji Customhouse",
             "hint": "1912, red brick over a timber frame, in the Renaissance manner; Tsumaki "
                     "Yorinaka had a hand in it. It stands at the basin's mouth, at the north end "
                     "of the Blue Wing."},
            {"id": "dalianhall-mj", "kind": "dalianhall", "x": 247, "z": round(2392 / Z_SCALE, 2), "y": 80,
             "ry": 0, "liton": 0.88, "w": 37, "h": 30, "d": 30,
             "title": "The Dalian Friendship Memorial building",
             "hint": "Built in 1995 as a copy of the Russian-era steamship office in Dalian, red "
                     "brick and white stone, with its composite steeple. It stands beside the old "
                     "customhouse on the basin's north side."},
            {"id": "skyline-retro", "kind": "skyline", "x": 331, "z": round(2434 / Z_SCALE, 2), "y": 80,
             "ry": 0, "liton": 0.82, "w": 34, "h": 190, "d": 30,
             "towers": [{"dx": 0, "dz": 0, "w": 34, "d": 30, "h": 190, "c": "#d9d5cb"}],
             "title": "The Retro High-Mart tower",
             "hint": "Kurokawa Kisho's 31-storey tower of 1999, 126.95 m, made slender so the hill "
                     "behind the port could still be seen from the basin; its top floor is the "
                     "Retro Observation Room at 103 m. At this scale it is the tallest thing on "
                     "the table, as it is on the waterfront."},
            {"id": "front-mj", "kind": "front", "x": 40, "z": round(2252 / Z_SCALE, 2), "y": 80, "ry": 0,
             "liton": 0.74, "w": 5, "h": 4, "d": 4,
             "glow": [{"r": 36, "k": 0.5, "dy": 4, "tint": "rgba(255,180,110,0.5)"}],
             "title": "One yatai, on the quay",
             "hint": "Kept because the owner asked for one, at the table's scale: about three metres "
                     "of stall. Nothing is claimed about what it sells."},
        ],
        # The hall's light: one warm spot over the table and a dim one over the walk.
        "lamps": [
            {"x": 0, "y": 560, "z": round(2418 / Z_SCALE, 2), "r": 520, "k": 0.5, "bulb": False,
             "tint": "rgba(255,226,186,0.20)", "of": "plinth-moji"},
            {"x": 0, "y": 560, "z": 160, "r": 300, "k": 0.22,
             "tint": "rgba(206,218,240,0.16)"},
        ],
        "beams": [90, 240, 340],
        # A model hall's walls: the gallery base and plaster the Toronto hall wears, dark.
        "surfaces": [
            {"side": -1, "z0": -103.45, "z1": 900, "y0": 0, "y1": 110, "kind": "hallbase", "tone": 0.8},
            {"side": -1, "z0": -103.45, "z1": 900, "y0": 110, "y1": 620, "kind": "hallplaster", "tone": 0.62},
            {"side": 1, "z0": -103.45, "z1": 900, "y0": 0, "y1": 110, "kind": "hallbase", "tone": 0.8},
            {"side": 1, "z0": -103.45, "z1": 900, "y0": 110, "y1": 620, "kind": "hallplaster", "tone": 0.62},
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
            {"id": "station", "src": "IMG/fukuoka-1.jpg", "x": -436, "z": 330, "y": 120, "ry": 90,
             "title": "Moji Port Station",
             "alt": "Illustration of a small wooden two-storey railway station at dusk, symmetric, "
                    "its centre shaped like a gate and a few windows lit.",
             "caption": "The building the district is named after, drawn: two storeys of painted "
                        "timber, dead symmetric, and a centre that reads as a gate."},
            {"id": "bridge", "src": "IMG/fukuoka-2.jpg", "x": 436, "z": 470, "y": 150, "ry": -90,
             "title": "The Blue Wing, open",
             "alt": "Illustration of a blue pedestrian drawbridge over a harbour basin at dusk, its "
                    "two leaves raised like wings and lit from below.",
             "caption": "The bridge, drawn at the moment it is worth looking at: both leaves up. "
                        "Its last opening is at four; after dark it is lit, and shut."},
            {"id": "water", "src": "IMG/fukuoka-3.jpg", "x": 436, "z": 600, "y": 120, "ry": -90,
             "title": "The strait at dusk",
             "alt": "Illustration of a wide strait at dusk seen from a quay, two low cargo ships "
                    "crossing it and lights along the far shore.",
             "caption": "What the basin opens onto, drawn: the room's far wall opens onto the same "
                        "water at the table's scale."},
        ],
        "slots_title": "Places in the port",
        "slots": [
            {"label": "Fukuoka, the port in one sheet", "note": "The album's cover plate for this "
                                                                "room. In the hall it is the table "
                                                                "itself: the station, the basin and "
                                                                "the strait in one look.",
             "state": "Held by the port itself, until a photograph of the quay takes the slot."},
            {"label": "Moji Port Station", "note": "The table's far left, south-west of the basin, "
                                                   "where the map puts it.",
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
        # The walk comes up the hall to the table's near edge -- the head of the basin -- and the
        # last stops stand close enough that the far wall's opening takes in both far landmarks.
        "stations": [
            {"z": 60,  "label": "the door of the hall"},
            {"z": 330, "label": "coming up to the table"},
            {"z": 560, "label": "at the table's edge, the head of the basin"},
            {"z": 690, "label": "over the basin, toward the strait"},
            {"z": 735, "label": "close, beside the station"},
        ],
        "exit": {"id": "curtain-back", "kind": "noren", "x": 0, "z": -46, "y": 172, "ry": 0,
                 "title": "The curtain at your back", "hint": "It parts onto the street."},
        "caveat": "Moji Port as a table model, laid out from OpenStreetMap at 1.5 cm to the metre "
                  "and read from the head of the No. 1 basin looking north-west; the strait beyond "
                  "the far wall is the same scale. The buildings' heights are their storeys' (the "
                  "Retro tower's is sourced); the Mitsui Club, the hotel and Kaikyo Plaza are not "
                  "modelled. The Blue Wing keeps its real timetable, so it is shut after dark. No "
                  "sign carries lettering and the yatai sells nothing named. Nothing here says the "
                  "owner was in any of these places.",
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
        # Niagara, the Canadian edge (grounded-scene §6's second worked example). The lane is the
        # promenade's last stretch, walked in the day, ending at the Table Rock rail; beyond it the
        # niagara painter carries the whole fact: the horseshoe crest (670 m of brink, a 57 m drop,
        # sources in TODO §0c) spilling into its mist, the American Falls on its talus across to the
        # left, the islands between, the gorge river below, a rainbow when the sun stands right.
        # What shrinks is detail; what must not: the crest's breadth-to-drop ratio, Table Rock at
        # the lip, the river running north behind you, the mist as weather.
        "id": "niagara", "label": "The falls",
        "page": ROOM_BY_ID["niagara"]["page"],
        "plates": ROOM_BY_ID["niagara"]["plates"],
        # A promenade is narrower than a street and open to the sky: the ceiling is only there so
        # the box closes overhead, and the day is authored the way the street's is.
        "lane": {"w": 560, "d": 460, "ceil": 380, "back": 220, "max_d": 1500},
        "day": {"cycle": 900, "start": 0.55, "gain": 1},
        "purpose": "The promenade at Niagara Falls: Table Rock at the lip, the horseshoe's mist, the American Falls across, the gorge for an end",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/niagara-cover.jpg",
        "cover_caption": "The horseshoe from Table Rock, drawn with its rainbow.",
        "blurb": "One promenade walked in the day. Hedges and lamps on the park side, a parapet and "
                 "the mist on the gorge side, and at the rail the whole falls: the crest, the drop, "
                 "the mist, the rainbow, the American Falls across.",
        "clad_note": " The lane is the promenade: a hedge and lamp posts on the park side, a stone "
                     "parapet at hand height on the gorge side and the falls' own mist above it. "
                     "Nothing on any of it carries a word.",
        "sight_note": " At its far end the walk stops at the Table Rock rail, and beyond is the "
                      "whole fact of the falls: the horseshoe crest spilling into mist, the "
                      "American Falls across on its boulders, the gorge river below, a rainbow in "
                      "the spray, and downstream in the haze the Rainbow Bridge's wings and the "
                      "Skylon's dish. After dark the curtain holds the illumination's colour "
                      "and, in season, fireworks swell over the crest. The cruise boat stays out "
                      "of the frame: its landing is downstream, and from the lip the basin it "
                      "works is hidden by the lip itself. Nothing out there is a record of "
                      "anybody standing in it.",
        "objects": [
            # The park side keeps one bench and the hedge keeps it company: a promenade is walked
            # slowly, and a bench facing the mist is the one furniture the view asks for.
            {"id": "bench-ng", "kind": "bench", "x": -250, "z": 240, "y": 0, "ry": 90,
             "title": "A bench at the hedge",
             "hint": "It faces the gorge side. The mist is the view; the bench is the pause."},
            # The falls themselves, stood at real scale in the site's own falls shape: the sheet,
            # the ledge, the mist — the same draw that reads on the hall's table, at the crest's
            # own breadth-to-drop ratio. The horseshoe wraps the view; the American Falls stands
            # to the left on its talus, the islands between.
            {"id": "falls-ng", "kind": "falls", "x": 300, "z": 2400, "y": -150, "ry": 0,
             "w": 4200, "h": 900, "d": 120,
             "title": "The horseshoe, at the rail",
             "hint": "Six hundred and seventy metres of brink at model breadth, drawn at the "
                     "rail's own distance: the water goes over the lip a few metres away."},
            {"id": "falls-am", "kind": "falls", "x": -2600, "z": 3400, "y": -150, "ry": 20,
             "w": 2600, "h": 600, "d": 90,
             "title": "The American Falls across",
             "hint": "A straight sheet onto its talus of boulders, east of the horseshoe, the "
                     "islands between."},
            {"id": "planter-go", "kind": "planter", "x": -1400, "z": 2600, "y": -150, "ry": 0,
             "w": 900, "h": 140, "d": 500,
             "title": "Goat Island at the crest",
             "hint": "The green wedge that parts the horseshoe from the bridal veil, at the "
                     "crest line."},
            {"id": "planter-lu", "kind": "planter", "x": -1900, "z": 2900, "y": -150, "ry": 0,
             "w": 460, "h": 100, "d": 300,
             "title": "Luna Island, small",
             "hint": "The smaller island, between the American and the bridal veil."},
            # The real Table Rock Centre is the entrance to Journey Behind the Falls; here the
            # door stands at the rail end of the promenade, where the terraces stack down.
            {"id": "door-journey", "kind": "door", "x": 262, "z": 430, "y": 0, "ry": -90,
             "leaf": "#2b3852",
             "glow": [{"r": 120, "k": 0.5, "dy": 200, "tint": "rgba(160,210,230,0.4)"}],
             "title": "The Journey door",
             "hint": "Journey Behind the Falls: the elevator drops through the bedrock to the "
                     "tunnels, the portals, the deck at the foot of the curtain.",
             "leave": ROOM_BY_ID["journey"]["page"]},
        ],
        "surfaces": [
            # Park side: a hedge at hand height and park greenery above it to the ceiling line.
            {"side": -1, "z0": 30, "z1": 470, "y0": 0, "y1": 150, "kind": "hedge", "tone": 1},
            {"side": -1, "z0": 30, "z1": 470, "y0": 150, "y1": 340, "kind": "hedge", "tone": 0.7},
            # Gorge side: the stone parapet at hand height, and above it the falls' mist worn as
            # cladding — the side view is weather, the way the pod's side view was the city.
            {"side": 1, "z0": 30, "z1": 470, "y0": 0, "y1": 100, "kind": "dado", "tone": 0.9},
            {"side": 1, "z0": 30, "z1": 470, "y0": 100, "y1": 340, "kind": "mistview", "tone": 1},
        ],
        "lamps": [
            # The promenade's lamp posts, authored whole: they keep the hedge side honest at dusk
            # and do almost nothing at noon, because the sun owns the day page.
            {"x": -252, "y": 210, "z": 120, "r": 90, "k": 0.5},
            {"x": -252, "y": 210, "z": 340, "r": 90, "k": 0.5},
        ],
        # The end wall is a frame, not a stop: one wide aperture over the stone sill, and the
        # niagara painter carries everything past it from every stop on the promenade.
        "vista": {"x": 0, "y0": 20, "y1": 340, "w": 520},
        "backdrop": {
            # The day sky, in the street's own idiom: bands from below the horizon up, glow near
            # one at the light-bearing band, because the lighting model multiplies what glow gives.
            "sky": [{"y0": -400, "y1": 3000, "c": "#7fa8cc", "glow": 1.0},
                    {"y0": 3000, "y1": 30000, "c": "#5d82ac", "glow": 0.7},
                    {"y0": 30000, "y1": 90000, "c": "#48688f", "glow": 0.5}],
            "niagara": {"y": -60, "z0": 600, "z1": 20000, "half": 12000,
                        "crest": {"x": 1000, "w": 14000, "drop": 1100},
                        "american": {"x": -9000, "w": 6000, "drop": 1600},
                        "islands": [{"x": -5200, "w": 2600}, {"x": -11000, "w": 3000}],
                        "rail": 1450},
        },
        "slots_title": "Places at the falls",
        "slots": [
            {"label": "The horseshoe from Table Rock",
             "note": "The story the hall's model opens first: the crest, the mist, the "
                      "American Falls across.",
             "state": "Held by three drawn story frames; a photograph takes the slot when one arrives."},
            {"label": "The Table Rock rail",
             "note": "The lip at the rail, where the water goes over a few metres away.",
             "state": "Held by the rail itself; no plate can stand in for the drop."},
        ],
        "stations": [
            {"z": 10, "label": "the mouth of the promenade"},
            {"z": 140, "label": "the hedge and the rail"},
            {"z": 300, "label": "the mist ahead"},
            {"z": 480, "label": "the Table Rock rail"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The gate at your back", "hint": "It opens onto the hall, at the falls' "
                                                           "own table."},
        "back_to": "rooms-toronto.html#at-falls-n",
        "caveat": "The falls are drawn from public facts — the crest's breadth, the drop, the "
                  "talus, the islands, the rainbow's habit, the nightly illumination and the "
                  "seasonal fireworks — and simplified at the detail level only: no crowds, no "
                  "lettering, the downstream skyline a silhouette, the cruise boat off-frame at "
                  "its downstream landing, no claim that the owner stood at the rail. The mist "
                  "is the weather the sources describe. The Parks line north of the gorge "
                  "bend — White Water Walk, the 1916 Aero Car, the Floral Clock, the Glen — "
                  "stays in the drawer, beyond the promenade's sight.",
    },
    {
        # Journey Behind the Falls, compressed not deleted (round-20 fidelity directive): the
        # elevator is the door on the promenade, the lane is the bedrock tunnel at its real
        # section — the tunnels run about 2.4 m wide and 2.1 m high — and the far end opens onto
        # the lower observation deck at the foot of the horseshoe, the curtain thirteen storeys
        # overhead. Record facts, sources in TODO §0f: descent 125-150 ft through bedrock,
        # tunnels bored 1889, the Cataract and Great Falls portals behind the sheet, ponchos at
        # the door, and after dark the floodlit curtain from the deck.
        "id": "journey", "label": "Behind the falls",
        "page": ROOM_BY_ID["journey"]["page"],
        "plates": ROOM_BY_ID["journey"]["plates"],
        "lane": {"w": 240, "d": 470, "ceil": 213, "back": 160, "max_d": 1500},
        "day": {"cycle": 900, "start": 0.55, "gain": 1},
        "purpose": "Journey Behind the Falls: down through the bedrock, behind the horseshoe's curtain, to the deck at its foot",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/niagara-cover.jpg",
        "cover_caption": "The horseshoe from its foot, floodlit after dark.",
        "blurb": "One tunnel walked in the bedrock: strata on the walls, soft light, the roar "
                 "rising; at the portal a window of falling water, and at the open end the deck "
                 "at the foot of the curtain, thirteen storeys overhead.",
        "clad_note": " The tunnel walls wear the bedrock's own strata in flat bands — limestone "
                     "and dolostone pale, shale dark — the geology the descent exposes. Nothing "
                     "on any of it carries a word.",
        "sight_note": " At the portal the rock opens onto the back of the sheet; at the deck the "
                      "whole curtain stands overhead into mist. After dark the floodlights hold "
                      "their colour on the water, the way the real deck sees them.",
        "objects": [
            # The curtain from below: stood at real scale with its top above the frame, so the
            # deck reads as the foot of a thirteen-storey wall of water, not a table model.
            {"id": "falls-jb", "kind": "falls", "x": 0, "z": 2300, "y": -200, "ry": 0,
             "w": 5200, "h": 3000, "d": 140,
             "title": "The curtain, from the deck",
             "hint": "Thirteen storeys of water overhead: the sheet's top stands above the "
                     "frame, the mist at its foot is the deck's weather."},
        ],
        "surfaces": [
            # The strata, pale over dark, both walls, for the tunnel's length only; the deck
            # beyond stands open to the sky.
            {"side": -1, "z0": 20, "z1": 300, "y0": 0, "y1": 70, "kind": "rock", "tone": 0.55},
            {"side": -1, "z0": 20, "z1": 300, "y0": 70, "y1": 140, "kind": "rock", "tone": 0.8},
            {"side": -1, "z0": 20, "z1": 300, "y0": 140, "y1": 213, "kind": "rock", "tone": 1},
            {"side": 1, "z0": 20, "z1": 300, "y0": 0, "y1": 70, "kind": "rock", "tone": 0.55},
            {"side": 1, "z0": 20, "z1": 300, "y0": 70, "y1": 140, "kind": "rock", "tone": 0.8},
            {"side": 1, "z0": 20, "z1": 300, "y0": 140, "y1": 213, "kind": "rock", "tone": 1},
        ],
        "lamps": [
            # The tunnels are lit soft and diffused: two low glows, no sun underground.
            {"x": 0, "y": 200, "z": 90, "r": 70, "k": 0.55},
            {"x": 0, "y": 200, "z": 230, "r": 70, "k": 0.55},
        ],
        # The tunnel mouth opens full-height onto the deck: the end wall is a frame with nothing
        # left in it, and the painter carries the gorge and the rail past it.
        "vista": {"x": 0, "y0": 0, "y1": 213, "w": 240},
        "backdrop": {
            "sky": [{"y0": -400, "y1": 3000, "c": "#7fa8cc", "glow": 1.0},
                    {"y0": 3000, "y1": 30000, "c": "#5d82ac", "glow": 0.7},
                    {"y0": 30000, "y1": 90000, "c": "#48688f", "glow": 0.5}],
            "journey": {"y": -60, "foot": -700, "z0": 1200, "z1": 9000, "half": 6000,
                        "wall": 120, "rail": 1450},
        },
        "slots_title": "Places behind the falls",
        "slots": [
            {"label": "The Cataract Portal",
             "note": "The rock opens behind the sheet: water for a window, the roar for a wall.",
             "state": "Held by the portal glow in the tunnel wall; a photograph takes the slot when one arrives."},
            {"label": "The lower deck",
             "note": "The foot of the curtain, thirteen storeys overhead, mist for weather.",
             "state": "Held by the deck and the curtain; after dark the floodlights hold it."},
        ],
        "stations": [
            {"z": 10, "label": "the elevator landing"},
            {"z": 120, "label": "the storied tunnel"},
            {"z": 230, "label": "the Cataract Portal"},
            {"z": 460, "label": "the lower deck"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The tunnel back", "hint": "It climbs to the promenade at Table Rock."},
        "back_to": "rooms-niagara.html#at-door-journey",
        "caveat": "Journey Behind the Falls is drawn from public facts — the 125-150 ft descent, "
                  "the 1889 tunnels at their real section, the two portals, the deck at the foot, "
                  "the nightly illumination — and simplified at the detail level only: no crowds, "
                  "no lettering, no ponchos on rails, no claim that the owner stood at the deck.",
    },
    {
        # The whole CN Tower as one walkable space (landmark-space §7, grounded-scene §6): one lane
        # read as an ascent. The cab doors at the mouth, the LookOut's floor-to-ceiling glass carrying
        # the city from above, the Glass Floor as the drop underfoot, the SkyPod's higher sky at the
        # far window. Record facts, sources in TODO §0a/§0b: 553.3 m, opened 1976; LookOut 346 m;
        # Glass Floor 342 m (the world's first, 1994); SkyPod 446.5 m; the ride, 58 seconds.
        # Bearings are the real ones (grounded-scene §1 rung 3-4): Lake Ontario due south of the pod,
        # Rogers Centre and the rail corridor at its base, the downtown grid north and east — the
        # aerial tile is the city read from above, not a composed backdrop.
        "id": "cntower", "label": "The tower",
        "page": ROOM_BY_ID["cntower"]["page"],
        "plates": ROOM_BY_ID["cntower"]["plates"],
        # A pod is narrower than a street and lower than a hall: the ceiling is the pod's own, and
        # the mouth holds the cab doors instead of a curtain.
        "lane": {"w": 560, "d": 640, "ceil": 330, "back": 220},
        "floor": "pod",
        "purpose": "The whole CN Tower as one space: the cab doors, the LookOut, the glass underfoot, the higher band",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/cntower-cover.jpg",
        "cover_caption": "The pod's own sheet: the city from above through the LookOut glass, drawn.",
        "blurb": "One lane read as an ascent. The cab doors at the mouth, floor-to-ceiling glass "
                 "carrying the city from above, a glass floor that is 342 m of drop, and the "
                 "SkyPod's higher sky at the far window.",
        "clad_note": " The lane is the pod at 346 m: floor-to-ceiling glass on both hands, the city "
                     "from above worn as the wall's own material, a steel floor underfoot, and one "
                     "square of it that is glass. Nothing on any of it carries a word.",
        "sight_note": " At its far end a window holds a higher band of sky and the city three "
                      "hundred and more metres below, running to a lake horizon. Nothing out there "
                      "is a record of anybody standing in it.",
        "objects": [
            # The elevator is the door and the moment (landmark-space §7 beat 1): the ride is 58
            # authored seconds in the real tower, here a press. The shaft's light runs past while
            # the doors stand open. The id says lift, the kind says door: site.js aliases `lift`
            # to the door painter's centre-parting variant (the `shop`/`front` precedent), so the
            # leaves part on `door` instead of a street door's panels, handle and fanlight.
            {"id": "lift-cn", "kind": "door", "x": -278, "z": 60, "y": 0, "ry": 90,
             "leaf": "#2b3852",
             "glow": [{"r": 130, "k": 0.6, "dy": 210, "tint": "rgba(255,214,170,0.45)"}],
             "states": [{"say": "The cab doors, shut. The real ride is 58 seconds; here it is a press."},
                        {"door": 1, "say": "The doors stand open: the shaft's light runs past, and "
                                          "the pod is the next room."}],
             "title": "The cab doors",
             "hint": "Six glass-fronted capsules run this shaft. Press to ride: the doors opening "
                     "is the transition, not a cutscene."},
            # The Glass Floor (beat 3): the part of the floor that is 342 m of drop. `on` is the
            # step-on state; the deep aerial tile carries the city below. Its size is the sourced
            # one, not a token: 24 m² of 64 mm units (Wikipedia, WikiArquitectura; TODO round 31),
            # so 480 × 500 — the record's 220 × 180 was a sixth of it. The stop stands on its
            # middle; the two stops before it see it ahead on the floor.
            {"id": "glassfloor-cn", "kind": "glassfloor", "x": 0, "z": 430, "y": 0, "ry": 0,
             "w": 480, "h": 4, "d": 500,
             "states": [{"say": "The Glass Floor at the rail: 342 m of drop under 64 mm of glass."},
                        {"on": 1, "say": "On the glass. The plaza is 342 m below — the whole tower "
                                         "is the drop under your feet."}],
             "title": "The glass floor",
             "hint": "The world's first, 1994: a square of floor that is a window straight down the "
                     "length of the tower. Press to step on, press to step back."},
            # The SkyPod as a band, not a room (beat 4): the far window's stop. Its real
            # differentiator is the height — the horizon a shade further, the sky a band higher.
            {"id": "ledge-cn", "kind": "ledge", "x": 0, "z": 610, "y": 0, "ry": 0,
             "w": 460, "h": 12, "d": 60,
             "title": "The window at the higher band",
             "hint": "Where the pod's glass ends and the SkyPod's sky begins: 446 m is mostly a "
                     "further horizon and a higher band of dark."},
        ],
        # Floor-to-ceiling glass is a material band: the city from above rides the cladding the way
        # every wall here wears its material. Both hands, from the cab to the far stop.
        "surfaces": [
            # Darker than the pod itself: the city below is night outside the glass, and a window
            # as bright as the room it looks out of is a mirror, not a view.
            {"side": -1, "z0": 150, "z1": 600, "y0": 12, "y1": 260, "kind": "aerial", "tone": 0.55},
            {"side": 1, "z0": 150, "z1": 600, "y0": 12, "y1": 260, "kind": "aerial", "tone": 0.55},
        ],
        # The restaurant that rings the real pod is one warm light band at its own hour, never
        # modelled — a room with people eating is a room with people.
        "lamps": [
            # The pod's own dim spots over the walk, the way the hall's tables outshine the room:
            # the city below is the light this place is about, the fittings only keep the floor.
            {"x": 0, "y": 296, "z": 100, "r": 240, "k": 0.8},
            {"x": 0, "y": 296, "z": 260, "r": 240, "k": 0.8},
            {"x": 0, "y": 296, "z": 420, "r": 240, "k": 0.8},
            {"x": 0, "y": 296, "z": 580, "r": 240, "k": 0.8},
            {"x": -250, "y": 252, "z": 300, "r": 140, "k": 0.6, "tint": "rgba(255,178,102,0.4)", "liton": 0.6},
            {"x": 250, "y": 252, "z": 300, "r": 140, "k": 0.6, "tint": "rgba(255,178,102,0.4)", "liton": 0.6},
        ],
        "vista": {"x": 0, "y0": 30, "y1": 300, "w": 460},
        "backdrop": {
            # The higher band and the pale horizon the SkyPod stop faces; below the horizon the
            # citybelow painter carries the city three hundred metres down.
            "sky": [{"y0": 300, "y1": 4000, "c": "#0b1424", "glow": 0.10},
                    {"y0": 236, "y1": 300, "c": "#22375a", "glow": 0.20},
                    {"y0": 186, "y1": 236, "c": "#31486e", "glow": 0.30}],
            "citybelow": {"y": -900, "z0": 6000, "z1": 120000, "half": 60000,
                          "lake": {"d0": 90000}},
        },
        "slots_title": "Places in the tower",
        "slots": [
            {"label": "The tower at dusk",
             "note": "The story the hall's model opens first: the silhouette, the pod's city "
                      "from above, the drop under the glass.",
             "state": "Held by three drawn story frames; a photograph takes the slot when one arrives."},
            {"label": "The glass floor",
             "note": "The one square of floor that is a window straight down.",
             "state": "Held by the panel itself; no plate can stand in for 342 m."},
        ],
        "stations": [
            {"z": 20, "label": "the cab doors"},
            {"z": 180, "label": "the LookOut's glass"},
            {"z": 340, "label": "the LookOut, mid"},
            {"z": 430, "label": "on the glass floor"},
            {"z": 560, "label": "the higher band"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The cab doors at your back", "hint": "They open onto the hall, at the "
                                                                "tower's own table."},
        # The landmark space owns its way back (the wiring loop respects an authored back_to): it
        # returns to the prop that owns it, not to the street — the hall is the hub route in.
        "back_to": "rooms-toronto.html#at-tower-cn",
        "caveat": "The tower is drawn at the eye's own scale from public facts — heights, levels, "
                  "bearings — and the city below is drawn from above, not surveyed. The ride is "
                  "compressed, the detail is simplified, the experience is the real one's shape. "
                  "Nothing here carries a name or a claim that the owner stood at 346 m.",
    },
    {
        "id": "undeclared", "label": "Next district", "purpose": "Purpose not declared",
        "status": "soon",
        "blurb": "This one stays shut until its purpose is declared — travel, a conference, "
                 "or something else. That question is the first thing any new space answers, "
                 "and the answer is printed on the card above it.",
        "objects": [], "slots": [], "exit": None,
    },
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
    return "\n      ".join(
        f'<script type="application/json" {name}>{json.dumps(data)}</script>'
        for name, data in islands if data)


def walk_object(o):
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
    solid = o.get("solid", o["kind"] in WALK_SOLID_KINDS and y <= 0 < y + h)
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
        f' data-{k}="{escape(v if isinstance(v, str) else json.dumps(v, separators=(",", ":")))}"'
        for k, v in ((k, o[k]) for k in ("mural", "posts", "towers", "leaves", "run") if k in o))
    # `data-states` is the whole interaction contract, in the document rather than in the script: a
    # prop can be done-to only as far as the district said, and the count of stops is the count of
    # presses before it comes round again.
    states = ""
    if o.get("states"):
        # The index ships in the document, not only in memory: what stop a thing is at is part of the
        # page's state, and a reader who never presses anything still gets told where it starts.
        states = (f' data-states="{escape(json.dumps(o["states"], ensure_ascii=False))}"'
                  f' data-state="{o.get("state", 0)}"')
    return (f'<button type="button" class="walk-hit" data-obj="{escape(o["id"])}" '
            f'aria-label="{escape(o["title"])}" data-title="{escape(o["title"])}" '
            f'data-hint="{escape(o["hint"])}" data-ry="{o.get("ry", 0)}" data-w="{w}" data-h="{h}" '
            f'data-d="{dep}"{solid_attr} style="{style}"{frame}{texture}{leaf_attr}{top_attr}{liton_attr}'
            f'{states}{leave}{awn_attr}{noren_attr}{fascia_attr}{story_attr}{extra_attr}></button>')


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
    for o in objects:
        o = dict(o)
        o["z"] = round(o["z"] * Z_SCALE)
        placed.append(o)
        parts.append(walk_object(o))
    chips = []
    for n, st in enumerate(d["stations"]):
        # A tick, not a caption: where the words go is the card, and the accessible name is what a
        # screen reader gets without anything being painted over the space.
        chips.append(
            f'<button type="button" class="walk-stop" data-walk-stop="{n}" '
            f'style="--z:{round(st["z"] * Z_SCALE)}px;--p:{st["z"] * Z_SCALE / walk_d:.3f}" '
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
    max_d_attr = f' data-lane-max-d="{lane["max_d"]}"' if lane.get("max_d") else ""
    # A street with nothing over it (Nakamise) says so, and the renderer draws no lid.
    max_d_attr += ' data-lane-open="1"' if lane.get("open") else ""
    # A place may own its ground: the pod walks on dark steel, not the street's concrete.
    floor_attr = f' data-floor="{d["floor"]}"' if d.get("floor") else ""
    # A place whose subject is the day: `"day": True` on the record, or a dict to author the cycle,
    # where it opens in that cycle, and how strong the sun is (`{"cycle": 900, "start": 0.45,
    # "gain": 1}`). The renderer reads all four off the layer, like the lane box and the eye — the
    # day of a place belongs to the place, and the two rooms whose subject is dusk simply do not say
    # it. `cycle` is seconds: four minutes hands a visitor dusk before they have looked around once,
    # so a day page runs the hall's own fifteen.
    day = d.get("day")
    day_attr = ""
    if day:
        opts = day if isinstance(day, dict) else {}
        day_attr = (f' data-lane-day="1" data-lane-day-cycle="{opts.get("cycle", 900)}"'
                    f' data-lane-day-start="{opts.get("start", 0.45)}"'
                    f' data-lane-day-gain="{opts.get("gain", 1)}"')
    return f"""<div class="walk" id="walk-{did}" data-walk="{label}" data-walk-id="{did}"
       data-lane-w="{lane["w"]}" data-lane-d="{walk_d}" data-lane-ceil="{lane["ceil"]}"
       data-lane-back="{lane["back"]}"{max_d_attr}{day_attr}{floor_attr} data-eye="{EYE}">
  <div class="walk-view" tabindex="0" data-walk-view role="application"
       aria-label="{label}, a lane you walk in person.{clad}{sight} Drag to turn, W A S D to walk, Shift to run,
       Space to jump, E to open what you are standing in front of, L for the list, I for this note.
       Nothing is written over the space: every sentence is behind a button.">
    <canvas class="walk-canvas" data-walk-canvas width="16" height="9" aria-hidden="true"></canvas>
    <div class="walk-hits" data-walk-hits>
      {INDENT.join(parts)}
      {walk_islands(d, placed)}
    </div>
  </div>
  <div class="walk-hud">
    <div class="walk-top">
      <div class="walk-pick">
        <a class="walk-icon walk-exit" href="{d.get("back_to", "activities.html")}" data-walk-exit aria-label="Leave the lane">{ICON_EXIT}</a>
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
      <p class="walk-note" data-walk-fallback hidden>Rendering the lane is unavailable in this
        browser. {label} still reads in the list: every frame, its caption and its kind are written
        there, and the ticks above stand for those frames' depths.</p>
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
