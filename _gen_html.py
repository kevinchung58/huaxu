#!/usr/bin/env python3
import hashlib
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
PUBLIC_PAGES = ["index.html", "about.html", "research.html", "teaching.html",
                "position.html", "thinking.html", "practice.html",
                "activities.html", "rooms.html", "service.html", "links.html"]


# The rooms, and the shape of the walk: a street, and the rooms that stand on it. The street is the
# hub — it is the page the nav's "Rooms" opens, it carries a door for every built room, and every
# room's back curtain opens back onto it. A place should not have to know what exists on either side
# of its own door, and it does not: the wiring is computed from this table, and `verify-walk.mjs`
# asserts that each district agrees with its row here, so the two cannot drift apart silently.
# The street row carries no plate prefix, because the street hangs no pictures: it is the site's own
# ground, not one more place in the archive.
ROOMS = [
    ("street", "The street", "street.html", [], "open"),
    ("canada", "Canada", "rooms-canada.html", ["canada-"], "open"),
    ("tokyo", "Tokyo", "rooms.html", ["tokyo-"], "open"),
    ("fukuoka", "Fukuoka", "rooms-fukuoka.html", ["fukuoka-"], "open"),
]
ROOM_BY_ID = {r[0]: {"label": r[1], "page": r[2], "plates": r[3], "status": r[4]} for r in ROOMS}
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
  <meta property="og:description" content="{DESC}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE}/IMG/1.jpg" />
  <meta name="twitter:card" content="summary" />
'''
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{DESC}" />
{meta}  <title>{escape(title)}</title>
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


def shell_page(title: str, body: str, path: str, cover: str = "IMG/1.jpg") -> str:
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
  <meta name="description" content="{DESC}" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:site_name" content="Hua-Xu Zhong" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{DESC}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE}/{cover}" />
  <meta name="twitter:card" content="summary" />
  <title>{escape(title)}</title>
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
    ("canada-", "field-notes", "generated"),
    ("fukuoka-", "field-notes", "generated"),
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
    "IMG/canada-1.jpg": "The walkway at dusk",
    "IMG/canada-2.jpg": "Bare trees over the path",
    "IMG/canada-3.jpg": "The lit door at the end",
    "IMG/canada-cover.jpg": "Canada, the walk in one sheet",
    "IMG/fukuoka-1.jpg": "The stall row",
    "IMG/fukuoka-2.jpg": "Lanterns over the wires",
    "IMG/fukuoka-3.jpg": "The water at the end",
    "IMG/fukuoka-cover.jpg": "Fukuoka, the alley in one sheet",
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
# The album keeps ONE representative plate per place — the place's cover sheet — and nothing else:
# the sub-area plates (the gate, the stall row, the lanterns) hang inside their rooms as the frames
# of the little places they stand in for. A wall of fifteen plates read as a pile; a wall of three
# reads as three places, one door each.
_REPRESENTATIVE = {f"IMG/{r[0]}-cover.jpg" for r in ROOMS if r[4] == "open" and r[0] != "street"}
ALBUM_ITEMS = sorted(
    (it for b in ALBUM_BLOCKS for it in ALBUM[b["id"]]
     if b["id"] != "field-notes" or it["src"] in _REPRESENTATIVE),
    key=lambda it: ROOM_ORDER.get(room_of_plate(it["src"]), len(ROOMS)))
album_tiles, gallery_plate = _plate_for(ALBUM_ITEMS)
_tiles_by_block = {b["id"]: [] for b in ALBUM_BLOCKS}
_tiles_by_room = {}          # field-notes only: room id -> its tiles, still in ALBUM_ITEMS order
for it, tile in zip(ALBUM_ITEMS, album_tiles):
    _tiles_by_block[it["block"]].append(tile)
    if it["block"] == "field-notes":
        _tiles_by_room.setdefault(room_of_plate(it["src"]), []).append(tile)


# A block may open onto the place its plates came from. It belongs to the block rather than to the
# page, because these plates are pictures of that room: the door stands where the pictures are, and
# it says what walking through it does. This one used to sit above the album — and it was written as
# a Python string split across two lines, so the quote and the continuation leaked into the anchor
# text and the page read `Tokyo, " "walked at first person`. A door that is hard to read is a door
# nobody opens, so the copy lives here as one sentence and the generator cannot fold it.
# The Field notes wall is three places, not a pile of plates: one heading per place, one door per
# place, and that place's plates hung under it — each plate standing in for a little area inside the
# place (the gate, the stall row, the lit door) until a photograph of the real one arrives. A plate
# is never an entrance in its own right; the door is the place's. The notes live here rather than in
# the district records because the album is assembled above DISTRICTS; the door targets and the
# group names come from the ROOMS table, which does exist by here, so the wall and the walk pages
# cannot disagree about what a place is called or where its door goes.
PLACE_GROUP_NOTES = {
    "canada": "A campus walkway after snow, walked at dusk toward the one lit door.",
    "tokyo": "A night lane with shutters, lanterns, and a vending machine keeping the far end.",
    "fukuoka": "A stall alley, lanterns low over the counters, water at the end of it.",
}


def _place_group(r, tiles):
    """One place on the Field notes wall: heading, its representative plate, one door."""
    label, page = r[1], r[2]
    head = (f'<div class="block-head reveal" data-place-group="{r[0]}">'
            f'<h3>{escape(label)}</h3>'
            f'<p class="when">{escape(PLACE_GROUP_NOTES[r[0]])} <span class="badge">'
            f'1 plate</span></p></div>')
    door = (f'<p class="pillar-more reveal"><a class="text-arrow" href="{page}" '
            f'aria-label="Walk into {escape(label)}">'
            f'This plate stands in for {escape(label)}; the little places of it hang inside. '
            f'Walk into {escape(label)}.{ico(ICON_RIGHT)}</a></p>')
    grid = (f'<div class="ig-grid" data-ig-grid>{" ".join(tiles)}</div>' if tiles else
            f'<div class="dashed empty">{chip(ICON_CAMERA)}<div><strong>Nothing in this place '
            f'yet</strong></div></div>')
    return (f'    {head}\n{door}'
            f'    <div class="ig-wall" data-ig-wall>\n      {grid}\n    </div>')


# The one instruction the album gives, in the block's own voice: what a door does, how to walk once
# you are inside, how you get back, and that the street's far end is open. It sits above the places,
# because the moment after "walk in" is exactly where a first-time visitor is lost.
HOW_TO_WALK = ("Every door on this wall steps you into its place at eye height: W A S D to walk, "
               "arrow keys or drag to turn, E to open what is in front of you, or the on-screen pad "
               "on a phone. Esc walks you back out - room to street, street back to this wall - and "
               "the street is the road between all three places. Its far end is open: keep walking "
               "and you are outside under the night sky.")


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
            # Three places, one door each. The block's own heading is a line, not an h3: the places
            # are the structure a visitor navigates, so they are the headings. A room row with plates
            # but no built status would hang its plates without a door; today every room is open.
            out.append(f'    <p class="eyebrow reveal">{escape(b["label"])}</p>\n'
                       f'    <p class="when reveal">{escape(b["purpose"])} <span class="badge">'
                       f'{escape(b["kind"])}</span> {escape(state)}</p>\n'
                       f'    <p class="when reveal" data-walk-guide>{escape(HOW_TO_WALK)}</p>\n')
            for r in ROOMS:
                if r[4] != "open" or r[0] == "street":
                    continue
                group = _tiles_by_room.get(r[0], [])
                if group or PLACE_GROUP_NOTES.get(r[0]):
                    out.append(_place_group(r, group))
            orphan = _tiles_by_room.get(None, [])
            if orphan:
                out.append(f'    <p class="when reveal">{len(orphan)} plates belong to no place '
                           f'yet.</p>\n    <div class="ig-wall" data-ig-wall>\n      '
                           f'<div class="ig-grid" data-ig-grid>{" ".join(orphan)}</div>\n    </div>')
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
    <p class="when reveal" style="margin:-0.4rem 0 1rem">Plates hung on a wall, read the way the
      album is read on a phone: pick one and the roll opens at it, sideways, and nothing expires when
      it has been seen. Which block an image belongs to, and what it is allowed to claim, is declared
      in the generator rather than sorted afterwards.</p>
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

EYE = 168                    # the eye is 1.68 m above the floor; 1 px = 1 cm throughout
Z_SCALE = 2.9                # records are authored in the old 4.3 m lane; the space is 12.4 m

# The lane box and the stops belong to the place, not to the site. A Fukuoka alley and a Canadian
# corridor are different rooms; the renderer reads whatever the district authored through
# `data-lane-*`, so those numbers now sit in the record next to the objects that must fit inside them.
# A place that declares no lane gets the Tokyo one, which is what every district written so far
# assumed. `ceil` is a rendering choice rather than a record: the authored 360 is the diagram's lane,
# and the space you stand in needs the extra half metre or the bulbs hang at a walker's eyes.
LANE_FALLBACK = {"w": 640, "d": 430, "ceil": 420, "back": 240}

DISTRICTS = [
    {
        # The hub. The street is the site's own ground — it names no city, carries no lettering, and
        # hangs no pictures: its whole job is to be the place the three rooms stand on, with a door
        # for each and a sky over both. It is outdoors the way Canada's walkway is: the "ceiling" is
        # high enough to read as night sky, the far end opens instead of stopping, and the light
        # comes from doorways, street lamps and the wires strung between the poles.
        "id": "street", "label": "The street",
        "page": ROOM_BY_ID["street"]["page"],
        "plates": ROOM_BY_ID["street"]["plates"],
        "lane": {"w": 700, "d": 560, "ceil": 620, "back": 300, "max_d": 2400},
        "purpose": "The street the three rooms stand on, walked under a night sky",
        "status": "open",
        "kind": "personal",
        "blurb": "One straight street at night. Three lit doors, one per room, and the open end "
                 "of the street for a skyline.",
        "objects": [
            # The three doors. Each names the room it opens onto — that is navigation, not a claim —
            # and each carries a lamp over it, because on a night street a door you can read is a
            # door with light on it. Reachability is a rendering fact the records must respect: the
            # walker's z clamps at MAX_D (1200 in walk units) and the reach ring is 190 cm, so a
            # door authored deeper than record z ~479 (1200+190, over Z_SCALE) could be seen but
            # never opened. The last door sits at 380 with room to spare.
            {"id": "door-canada", "kind": "door", "x": -346, "z": 120, "y": 0, "ry": 90,
             "leaf": "#3e5c66",
             "glow": [{"r": 130, "k": 0.58, "dy": 235}],
             "leave": ROOM_BY_ID["canada"]["page"],
             "title": "The door onto Canada",
             "hint": "It opens onto Canada: a campus walkway after snow, drawn at the same scale "
                     "as this street. Everything between here and there is one step through."},
            {"id": "door-tokyo", "kind": "door", "x": 346, "z": 300, "y": 0, "ry": -90,
             "leaf": "#5c4434",
             "glow": [{"r": 130, "k": 0.62, "dy": 235}],
             "leave": ROOM_BY_ID["tokyo"]["page"],
             "title": "The door onto Tokyo",
             "hint": "It opens onto the lane: shutters, lanterns, a vending machine at its end. "
                     "The curtain inside parts the other way."},
            {"id": "door-fukuoka", "kind": "door", "x": -346, "z": 380, "y": 0, "ry": 90,
             "leaf": "#4b4368",
             "glow": [{"r": 130, "k": 0.58, "dy": 235}],
             "leave": ROOM_BY_ID["fukuoka"]["page"],
             "title": "The door onto Fukuoka",
             "hint": "It opens onto the stall alley: lanterns low over the counters, and water at "
                     "the end of it."},
            # The street's own furniture, and the two poles the wires run from.
            {"id": "pole-west", "kind": "utility", "x": -330, "z": 140, "y": 0, "ry": 90,
             "title": "The pole the wires are strung from",
             "hint": "Every wire overhead starts or ends on one of the two poles: a cable has to "
                     "be anchored somewhere you can point at."},
            {"id": "pole-east", "kind": "utility", "x": 330, "z": 400, "y": 0, "ry": -90,
             "title": "The pole at the far crossing",
             "hint": "The second anchor. Between them the wires carry the street's two bulbs."},
            {"id": "bollard-s", "kind": "bollard", "x": -160, "z": 24, "y": 0, "ry": 0,
             "title": "A bollard at the mouth of the street",
             "hint": "Drawn rather than surveyed: it is here so the entrance has an edge."},
            {"id": "bench-s", "kind": "bench", "x": -300, "z": 250, "y": 0, "ry": 90,
             "title": "A bench under the dark half of the street",
             "hint": "The one seat on the street. It sits in the gap between two doors, where a "
                     "walker is allowed to stop."},
            {"id": "bin-s", "kind": "bin", "x": 322, "z": 210, "y": 0, "ry": -90,
             "title": "A bin by the middle door",
             "hint": "Lid shut, nothing implied about what is in it."},
            {"id": "planter-s1", "kind": "planter", "x": -300, "z": 370, "y": 0, "ry": 90,
             "title": "A planter of dark leaves",
             "hint": "Set dressing: the one green thing on the street, drawn as a silhouette."},
            {"id": "planter-s2", "kind": "planter", "x": 296, "z": 60, "y": 0, "ry": -90,
             "title": "A second planter, by the wall",
             "hint": "The street's edges need a rhythm more than they need symmetry."},
            {"id": "board-s", "kind": "signA", "x": 300, "z": 120, "y": 150, "ry": -90,
             "title": "A folding board, blank",
             "hint": "Both faces blank: the lettering would be a shop's to write, and no shop here "
                     "is real."},
            {"id": "drain-s", "kind": "drain", "x": 60, "z": 300, "y": 0, "ry": 0,
             "title": "A drain in the asphalt",
             "hint": "The street's one piece of water kit, at the crossing point."},
            {"id": "front-s", "kind": "front", "x": 346, "z": 380, "y": 0, "ry": -90,
             "glow": [{"r": 120, "k": 0.45, "dy": 190}],
             "title": "A shut front with a light behind it",
             "hint": "Shutter down, light on in the transom: a building with nobody in it and a "
                     "timer on its lamp. It keeps the far stretch of street from being empty. "
                     "Done, the shutter rises — onto an interior the site does not furnish, so "
                     "all it gives up is more light.",
             "states": [
                 {"say": "Up. The transom lamp plus a room lamp: twice the light, none the wiser "
                         "about who left it on.", "k": 1.15, "shut": 0.9},
                 {"say": "Down again. The street keeps its shuttered half.", "k": 0.45,
                  "shut": 0},
             ]},
            {"id": "front-n", "kind": "front", "x": -346, "z": 300, "y": 0, "ry": 90,
             "glow": [{"r": 120, "k": 0.45, "dy": 190}],
             "title": "Another shut front, across the crossing",
             "hint": "Same story from the other side of the street: shutter down, transom lit. "
                     "Two closed fronts facing is most of what a night street is. Done, this one "
                     "stays as it is — the pair should not match, or the street is a stage set.",
             "states": [
                 {"say": "It does not budge. Some shutters are just shut.", "k": 0.5, "shut": 0},
                 {"say": "Still shut. The lamp behind it stays on regardless.", "k": 0.5,
                  "shut": 0},
             ]},
            {"id": "ac-s", "kind": "ac", "x": -344, "z": 250, "y": 262, "ry": 90,
             "title": "An air conditioner over the first door",
             "hint": "High on the wall, dripping nothing: the street's one horizontal above head "
                     "height."},
        ],
        # The street lights itself the way an open street does: two street lamps on the poles, a
        # broad cool skylight (bulb:false — it is the night sky dome, not a fitting), and the doors'
        # own glows from the objects list. All of it is data; the renderer only multiplies.
        "lamps": [
            {"x": 0, "y": 505, "z": 140, "r": 46, "k": 0.6},
            {"x": 0, "y": 500, "z": 400, "r": 46, "k": 0.6},
            {"x": 0, "y": 502, "z": 268, "r": 44, "k": 0.55},
            # The city's own light, standing in the opening: the far wall of the street faces a lit
            # skyline through it, and without this the last stretch reads as a dead end. Cool, soft,
            # no bulb — it is the glow of somewhere open, not a fitting on the street.
            {"x": 0, "y": 190, "z": 536, "r": 135, "k": 0.5, "tint": "#9fb2d8", "bulb": False},
        ],
        "wires": [
            {"a": [-350, 512, 140], "b": [350, 504, 140], "sag": 42},
            {"a": [-350, 512, 268], "b": [350, 504, 268], "sag": 40},
            {"a": [-350, 508, 400], "b": [350, 512, 400], "sag": 38},
        ],
        "beams": [],
        "surfaces": [
            # Building fronts, band by band, both sides. The materials repeat the rooms' own kit so
            # the whole walk reads as one drawn world.
            {"side": -1, "z0": -1400, "z1": 200, "y0": 0, "y1": 140, "kind": "dado", "tone": 1.16},
            {"side": -1, "z0": -1400, "z1": 200, "y0": 140, "y1": 620, "kind": "plaster", "tone": 1.14},
            {"side": -1, "z0": 200, "z1": 440, "y0": 0, "y1": 300, "kind": "shutter", "tone": 1.26},
            {"side": -1, "z0": 200, "z1": 440, "y0": 300, "y1": 620, "kind": "brick", "tone": 1.22},
            {"side": -1, "z0": 440, "z1": 560, "y0": 0, "y1": 620, "kind": "brick", "tone": 1.3},
            {"side": 1, "z0": -1400, "z1": 80, "y0": 0, "y1": 620, "kind": "brick", "tone": 1.12},
            {"side": 1, "z0": 80, "z1": 320, "y0": 0, "y1": 130, "kind": "dado", "tone": 1.18},
            {"side": 1, "z0": 80, "z1": 320, "y0": 130, "y1": 620, "kind": "plaster", "tone": 1.12},
            {"side": 1, "z0": 320, "z1": 560, "y0": 0, "y1": 300, "kind": "shutter", "tone": 1.32},
            {"side": 1, "z0": 320, "z1": 560, "y0": 300, "y1": 620, "kind": "plaster", "tone": 1.26},
        ],
        "marks": [
            {"kind": "tactile", "x0": -330, "x1": -306, "z0": -1400, "z1": 560},
            {"kind": "tactile", "x0": 306, "x1": 330, "z0": -1400, "z1": 560},
            {"kind": "gutter", "x0": -368, "x1": 368, "z0": -1400, "z1": 14},
            {"kind": "grate", "x0": -80, "x1": 80, "z0": 296, "z1": 304},
            {"kind": "manhole", "x0": -40, "x1": 40, "z0": 210, "z1": 250},
            {"kind": "kerb", "x0": -368, "x1": -306, "z0": -1400, "z1": 560, "y1": 6},
            {"kind": "kerb", "x0": 306, "x1": 368, "z0": -1400, "z1": 560, "y1": 6},
        ],
        # The far end is not a window but the way on: the opening runs nearly wall to wall and floor
        # to sky, and the clamp is authored past it (max_d above) — walk out of the street and the
        # ground continues under the night sky, GTA-style, with the skyline ahead. What is out there
        # is open ground the street does not name. No tower, no crossing, no expressway — those are
        # Tokyo's, and the street is nobody's.
        "vista": {"x": 0, "y0": 6, "y1": 614, "w": 620},
        "backdrop": {
            # glow is the band's own brightness: without it a sky band paints at lit 0, and the
            # horizon band — the one the opening actually frames — reads as a hole in the world.
            # The band heights are projection-aware: the backdrop sits at z=120000 in scene units,
            # so a band has to span thousands of cm of y to be more than a hairline on screen, and
            # the gradient below is the honest "sky is brightest at the horizon" order.
            "sky": [{"y0": -400, "y1": 8000, "c": "#4a5a84", "glow": 1.0},
                    {"y0": 8000, "y1": 30000, "c": "#2c3859", "glow": 0.62},
                    {"y0": 30000, "y1": 40000, "c": "#1e2946", "glow": 0.42}],
            "mountain": [{"x": -900, "y": 380, "w": 2400, "h": 260, "c": "#1b2540"},
                         {"x": 1400, "y": 340, "w": 1800, "h": 220, "c": "#1e2946"}],
            "plaza": {"y": -6, "z0": 1624, "z1": 9000, "half": 4200, "lit": 1.1},
            # Two low-rise, lit rooftops flank the opening — off the centre line, so they give the
            # open ground something human-sized at the edges without a slab over the skyline.
            "roofs": [
                {"x": -1350, "y": 0, "z": 2050, "w": 700, "h": 300, "tone": 1.0},
                {"x": 1350, "y": 0, "z": 2150, "w": 640, "h": 260, "tone": 1.05},
            ],
            "city": [
                {"x": -1500, "z": 5600, "w": 1100, "h": 1400, "win": 0.85, "tone": 1.8},
                {"x": -300, "z": 6800, "w": 900, "h": 1000, "win": 0.75, "tone": 1.55},
                {"x": 700, "z": 5200, "w": 1050, "h": 1600, "win": 0.9, "tone": 1.9},
                {"x": 1800, "z": 7200, "w": 1150, "h": 950, "win": 0.72, "tone": 1.5},
                {"x": 2650, "z": 6200, "w": 850, "h": 1300, "win": 0.8, "tone": 1.7},
            ],
        },
        "slots_title": "Rooms on this street",
        "slots": [
            {"label": "Canada", "note": "A campus walkway after snow, walked at dusk toward the "
                                        "one lit door.",
             "state": "Open — the left-hand door, lit."},
            {"label": "Tokyo", "note": "A night lane with shutters, lanterns, and a vending "
                                       "machine keeping the far end.",
             "state": "Open — the right-hand door."},
            {"label": "Fukuoka", "note": "A stall alley, lanterns low over the counters, water at "
                                         "the end of it.",
             "state": "Open — the last door on the left."},
        ],
        "stations": [
            {"z": 0, "label": "the mouth of the street"},
            {"z": 120, "label": "by the first door"},
            {"z": 300, "label": "at the crossing"},
            {"z": 380, "label": "by the last door"},
            {"z": 540, "label": "the end of the street"},
            {"z": 700, "label": "out in the open"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The door at your back", "hint": "It opens onto the album, where the "
                 "same places are hung as pictures."},
        "caveat": "The street is the site's own ground, drawn: it names no city, carries no "
                  "lettering, and hangs no pictures. The three rooms stand along it, each one opens "
                  "from a door you can walk to, and the far end is no wall — walk out of the street "
                  "and it is open ground under the sky. Nothing here says the owner was anywhere.",
    },
    {
        "id": "tokyo", "label": "Tokyo",
        # The page and the plate prefixes come from the ROOMS table above, so the album and the walk
        # cannot disagree about which room a plate opens onto. The row also carries the street, which
        # is what this room's back curtain and the hub's door on it must agree on.
        "page": ROOM_BY_ID["tokyo"]["page"],
        "plates": ROOM_BY_ID["tokyo"]["plates"],
        # The box the lane stands in. There is no far door: the walk is a hub now, and every room
        # opens back onto the street, which carries the doors onward.
        "lane": LANE_FALLBACK,
        "purpose": "A Tokyo lane, dressed: shutters, lanterns, a crossing at its end",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/tokyo-cover.jpg",
        "cover_caption": "The district in one sheet: a gate lantern, a scramble, a tower, "
                         "a counter, a mountain on the skyline.",
        "blurb": "One lane at night. The light at the end is a vending machine, and the "
                 "lane is walked toward it.",
        # Set dressing, and the rule that governs it: an object is here so the lane has an edge, a
        # rhythm, something to walk round — never so the page can imply a fact. Anything that would
        # speak about Tokyo (a shop name, a sign's lettering) is deliberately left blank instead.
        "objects": [
            {"id": "vending", "kind": "vending", "x": -294, "z": 412, "y": 0, "ry": 90,
             "glow": [{"r": 130, "k": 1.05}],
             "title": "The vending machine",
             "hint": "It keeps the lane's frames. Pressing the lit slot opens the drawer "
                     "the photographs go into; nothing here reviews Tokyo."},
            {"id": "bollard", "kind": "bollard", "x": -150, "z": 12, "y": 0, "ry": 0,
             "title": "A bollard at the mouth of the lane",
             "hint": "Set dressing, drawn rather than surveyed: it is here so the entrance has "
                     "an edge. Nothing to open."},
            {"id": "steps", "kind": "steps", "x": 296, "z": 26, "y": 0, "ry": -90,
             "title": "Two steps up to a door that is not there yet",
             "hint": "Drawn. A district gets its doorway when there is a room on the other side "
                     "of it, and there is not one yet."},
            {"id": "shrine", "kind": "shrine", "x": 296, "z": 36, "y": 42, "ry": -90,
             "title": "A small shrine at knee height",
             "hint": "Draw one slip. The slip picks which slot you look at first; there is "
                     "no score, because a lane is not a game to win."},
            {"id": "mirror", "kind": "mirror", "x": -308, "z": 14, "y": 236, "ry": 90,
             # The only object in the lane that turns. `turn` swings the disc on its bracket, so a press
             # changes the geometry — and what you can see down the lane does not change at all, because
             # there is nothing behind the glass to show.
             "states": [
                 {"say": "Aimed down the lane, the way it was hung.", "turn": 0.0},
                 {"say": "Turned to the wall. A mirror is aimed by whoever put it up, and this one "
                         "has nothing to show either way: it is drawn glass, not silvered.",
                  "turn": 1.0},
             ],
             "title": "A convex mirror on a bracket",
             "hint": "At the mouth of every lane like this, aimed at the corner you cannot see. Drawn, "
                     "not silvered: there is no reflection in it, because a mirror that invented one "
                     "would be the renderer making something up."},
            {"id": "meter", "kind": "meter", "x": 312, "z": 10, "y": 148, "ry": -90,
             "title": "A meter box and its conduit",
             "hint": "Bolted where the supply comes in, with its conduit running up to the wire. It "
                     "reads nothing, because it is drawn: no reading of anybody's is in this lane."},
            {"id": "hydrant", "kind": "hydrant", "x": 288, "z": 44, "y": 0, "ry": -90,
             "title": "A standpipe at the kerb",
             "hint": "Short, red and unmistakable at thirty metres, which is the whole test for "
                     "dressing. Nothing is claimed about water, or about anybody's fire."},
            {"id": "drain", "kind": "drain", "x": -80, "z": 54, "y": 0, "ry": 0,
             "title": "A drain in the asphalt",
             "hint": "It is the one thing on the floor that knows the lane is wet."},
            {"id": "ac-left", "kind": "ac", "x": -302, "z": 66, "y": 250, "ry": 90,
             "title": "An air-conditioning unit, high on the left wall",
             "hint": "Drawn, and humming about as loudly as anything at this hour is allowed to."},
            {"id": "crate", "kind": "crate", "x": -244, "z": 96, "y": 0, "ry": 0,
             "title": "A crate pushed against the wall",
             "hint": "Set dressing. Go round it: it is 62 cm wide and the lane is 6.4 m."},
            {"id": "bin", "kind": "bin", "x": 268, "z": 108, "y": 0, "ry": -90,
             "title": "A bin, lid shut",
             "hint": "Nothing is in it, and nothing will be: a district does not get to imply "
                     "what somebody threw away."},
            # The lane's three poster images were promoted to sub-places: they hang as frames now,
            # in the frames list below, at these same coordinates. A picture the walker can open is
            # a place in the record; a poster pinned over it would be the same picture twice.
            {"id": "pipe", "kind": "pipe", "x": 308, "z": 170, "y": 0, "ry": -90,
             "title": "A drainpipe down the right wall",
             "hint": "The lane's other vertical: the one thing here that runs the whole height."},
            {"id": "ladder", "kind": "ladder", "x": -300, "z": 165, "y": 0, "ry": 90,
             "title": "A ladder left against the wall",
             "hint": "Leaning, not resting: `d` is how far its feet stand out from the wall. It is the "
                     "one prop here that is pure silhouette, which is exactly why it belongs."},
            {"id": "camera", "kind": "camera", "x": 306, "z": 196, "y": 182, "ry": -90,
             "glow": [{"r": 40, "k": 0.22, "tint": "rgba(255,120,110,0.5)", "dy": 6}],
             "title": "A camera under the awning",
             "hint": "The only lens in the lane, and it is drawn: a body, a bracket, and a small light "
                     "that is the whole reason the glow beside it exists. It records nothing, and "
                     "nothing in this lane is watched."},
            {"id": "front-b", "kind": "front", "x": 316, "z": 250, "y": 0, "ry": -90,
             "glow": [{"r": 170, "k": 0.75, "tint": "rgba(255,176,96,0.40)", "dy": 150}],
             # The second front you can do something to, in the half of the lane that used to be only
             # scenery. Same three stops as the first, and the same coupling: the shutter's height and
             # the light the lane gets are one number.
             "states": [
                 {"say": "Down, and warm behind the steel. Somewhere back there a room is still lit.",
                  "shut": 0.0, "k": 0.6},
                 {"say": "Half up: the counter, the shelf behind it, and nobody at either.", "shut": 0.55,
                  "k": 1.1},
                 {"say": "Fully up. An empty room with its light on, which is the most honest thing a "
                         "lane at this hour can show you.", "shut": 1.0, "k": 1.4},
             ],
             "title": "The lit front halfway down",
             "hint": "The far half of the lane answers now: press it and the shutter rolls, and the "
                     "light that reaches the asphalt goes with it. Drawn, empty, and not for sale."},
            {"id": "planter-2", "kind": "planter", "x": -252, "z": 332, "y": 0, "ry": 90,
             "title": "Two planters further down",
             "hint": "The second planting in the lane, put where the wall turns from brick to hoarding: "
                     "an alley with only grey in it is a drawing of an alley."},
            {"id": "awning", "kind": "awning", "x": 292, "z": 200, "y": 214, "ry": -90,
             "title": "An awning over a shuttered front",
             "hint": "Drawn at 12 degrees so it sheds onto the lane. There is no shop behind it; "
                     "the shutter is the wall."},
            {"id": "sign", "kind": "sign", "x": -302, "z": 206, "y": 258, "ry": 90,
             "title": "A sign board with no lettering on it",
             "hint": "Deliberately blank: invented signage would be the one prop in this lane "
                     "that pretends to say something about Tokyo."},
            {"id": "pole", "kind": "utility", "x": 292, "z": 275, "y": 0, "ry": -90,
             "title": "Utility pole",
             "hint": "The lane's notice board: what this district is for, and what it does "
                     "not have yet."},
            {"id": "crates-2", "kind": "crate", "x": 250, "z": 300, "y": 0, "ry": -90,
             "title": "Two crates, one on top",
             "hint": "Set dressing with a shadow under it, which is the whole reason it is here."},
            {"id": "ac-right", "kind": "ac", "x": 302, "z": 336, "y": 262, "ry": -90,
             "title": "A second unit, higher up",
             "hint": "Alleys are mostly this: plant bolted to a wall at a height nobody chose."},
            {"id": "ledge", "kind": "ledge", "x": 0, "z": 426, "y": 96, "ry": 0,
             "title": "The lookout rail at the window",
             "hint": "The crossing, the tower and the mountain beyond are drawn at the size a "
                     "picture of them shows, not surveyed: 1 px is 1 cm in here, and a mountain does "
                     "not fit. Nothing out there is a record of anybody standing in it."},
            {"id": "front-a", "kind": "front", "x": -316, "z": 62, "y": 0, "ry": 90,
             "glow": [{"r": 190, "k": 0.85, "tint": "rgba(255,166,86,0.42)", "dy": 150}],
             # Three stops for a shutter, and the light is coupled to them: the spill into the lane is
             # the same number the interior's brightness is. Pressing it changes what the room looks
             # like, not only what the card says.
             "states": [
                 {"say": "Shutter down. The front is closed and the light stays behind the steel.",
                  "shut": 0.0, "k": 0.55},
                 {"say": "Half up: enough to see the counter, not enough to be served.", "shut": 0.55,
                  "k": 1.0},
                 {"say": "Fully up. The room is open, warm, and empty; nobody is behind it.",
                  "shut": 1.0, "k": 1.35},
             ],
             "title": "A closed front with its light still on",
             "hint": "Shutter down, interior light still running: the one hour of a lane where a room "
                     "is still warm and nobody is in it. Drawn, and nothing is for sale here."},
            {"id": "booth", "kind": "booth", "x": 246, "z": 85, "y": 0, "ry": -90,
             "glow": [{"r": 120, "k": 0.6, "tint": "rgba(214,232,255,0.34)", "dy": 160}],
             "states": [
                 {"say": "Shut. The light inside comes on when the door moves, and goes when it does "
                         "not.", "door": 0.0, "k": 0.5},
                 {"say": "Open. Empty, with the receiver hanging — this is a drawn box, so it holds no "
                         "somebody's call.", "door": 1.0, "k": 1.3},
             ],
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
            {"id": "mailbox", "kind": "mailbox", "x": 314, "z": 218, "y": 0, "ry": -90,
             "states": [
                 {"say": "Shut.", "flap": 0.0},
                 {"say": "The flap is open and the box is empty. It is a shape in a lane, not a way to "
                         "reach anybody.", "flap": 1.0},
             ],
             "title": "A post box at the corner",
             "hint": "Red, boxy, at a corner: the shape that says Tokyo louder than any signage could, "
                     "and it carries no lettering because none is ours to invent."},
            {"id": "board-a", "kind": "signA", "x": -236, "z": 300, "y": 0, "ry": 0,
             "states": [
                 {"say": "Blank. This face would carry a menu.", "flip": 0.0},
                 {"say": "Turned over, and blank again: both faces of a board like this are the shop's "
                         "to write on, and the shop is not real.", "flip": 1.0},
             ],
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
            {"id": "window-a", "kind": "pane", "x": 316, "z": 338, "y": 186, "ry": -90,
             "glow": [{"r": 150, "k": 0.5, "tint": "rgba(255,196,124,0.34)", "dy": 40}],
             "title": "A window on the brick",
             "hint": "Somebody's room, at the height a lane sees it at: the sill, the sash, the curtain "
                     "edge. Nothing behind it is drawn further than the light that comes out.",
             "states": [
                 {"say": "Shut, and lit. The room is a brightness in a frame.", "slide": 0.0, "k": 0.9},
                 {"say": "Opened a hand's width: the air of the room comes into the lane, and the light "
                         "with it.", "slide": 1.0, "k": 1.45},
             ]},
            {"id": "recycle", "kind": "recycle", "x": -294, "z": 398, "y": 0, "ry": 90,
             "states": [
                 {"say": "Lidded.", "flap": 0.0},
                 {"say": "Lid up, and empty. It stands beside the machine because that is where a crate "
                         "like this stands; nothing in this lane gets recycled.", "flap": 1.0},
             ],
             "title": "The crate beside the machine",
             "hint": "Every machine on a street like this has one within arm's reach of it. That is the "
                     "only reason it is here, and nothing is in it."},
            {"id": "bin-2", "kind": "bin", "x": -262, "z": 356, "y": 0, "ry": 90,
             "title": "The far bin",
             "hint": "The last thing before the light at the end of the lane."},
        ],
        # Where the light comes from and what carries it. A row of bulbs down the centre of the lane,
        # plus the machine's own glow, which is derived from the prop rather than placed by the
        # renderer. Depths are record centimetres like every other record; heights are real.
        # A bare number is a bulb on the ceiling line at that record depth; a dict is authored whole.
        # The last one is not a bulb at all: it is the city's own bounce coming in through the window,
        # which is why the end of the lane is the brightest part of it, and why it draws no glass and
        # throws no pool on the asphalt.
        "lamps": [20, 120, 220, 320, 402,
                  {"z": 430, "y": 240, "x": 0, "r": 900, "k": 0.55, "bulb": False,
                   "tint": "rgba(146,178,255,0.26)"}],
        # The arcade's rhythm overhead: where a beam crosses the ceiling, in record centimetres like
        # every other depth in a district record (the emitter scales them with Z_SCALE).
        "beams": [75.86, 179.31, 282.76, 386.21],
        # What the walls are made of. This is the street's own kit, band by band: rolling shutters over
        # closed fronts, glazed tile up to hand height where a shopfront was glazed, painted plaster
        # above, corrugated patching where a wall has been opened and closed again, a plank hoarding
        # where a building is being worked on. Side -1 is the left wall, 1 the right, 0 the end wall;
        # the depths are record centimetres, and the renderer tiles each band into the same 60 cm panels
        # as the wall behind it so an affine map stays exact.
        "surfaces": [
            {"side": -1, "z0": -82.76, "z1": 20.69, "y0": 0, "y1": 420, "kind": "plaster"},
            {"side": -1, "z0": 20.69, "z1": 103.45, "y0": 0, "y1": 300, "kind": "shutter"},
            {"side": -1, "z0": 20.69, "z1": 103.45, "y0": 300, "y1": 420, "kind": "corrugated"},
            {"side": -1, "z0": 103.45, "z1": 162.07, "y0": 0, "y1": 130, "kind": "dado"},
            {"side": -1, "z0": 103.45, "z1": 162.07, "y0": 130, "y1": 420, "kind": "brick"},
            {"side": -1, "z0": 162.07, "z1": 262.07, "y0": 0, "y1": 290, "kind": "shutter"},
            # Board-formed concrete over that shutter: the lane's own structure showing above the
            # shopfronts, which is what the second half of a street like this actually looks like.
            {"side": -1, "z0": 162.07, "z1": 262.07, "y0": 290, "y1": 420, "kind": "concrete", "tone": 1.04},
            {"side": -1, "z0": 262.07, "z1": 348.28, "y0": 0, "y1": 300, "kind": "hoarding", "tone": 0.86},
            # ...with a sheet of galvanised steel over the top of the boarding, because a hoarding in a
            # working lane is patched with whatever was on the truck.
            {"side": -1, "z0": 262.07, "z1": 348.28, "y0": 300, "y1": 420, "kind": "galv", "tone": 0.94},
            {"side": -1, "z0": 348.28, "z1": 430, "y0": 0, "y1": 120, "kind": "dado"},
            {"side": -1, "z0": 348.28, "z1": 430, "y0": 120, "y1": 420, "kind": "brick"},
            {"side": 1, "z0": -82.76, "z1": 13.79, "y0": 0, "y1": 420, "kind": "brick"},
            {"side": 1, "z0": 13.79, "z1": 65.52, "y0": 0, "y1": 300, "kind": "shutter"},
            {"side": 1, "z0": 13.79, "z1": 65.52, "y0": 300, "y1": 420, "kind": "plaster"},
            {"side": 1, "z0": 65.52, "z1": 162.07, "y0": 0, "y1": 140, "kind": "dado"},
            {"side": 1, "z0": 65.52, "z1": 162.07, "y0": 140, "y1": 420, "kind": "concrete", "tone": 0.96},
            {"side": 1, "z0": 162.07, "z1": 227.59, "y0": 0, "y1": 420, "kind": "hoarding", "tone": 0.92},
            {"side": 1, "z0": 227.59, "z1": 310.34, "y0": 0, "y1": 290, "kind": "shutter"},
            {"side": 1, "z0": 227.59, "z1": 310.34, "y0": 290, "y1": 420, "kind": "corrugated"},
            {"side": 1, "z0": 310.34, "z1": 430, "y0": 0, "y1": 130, "kind": "dado", "tone": 1.08},
            {"side": 1, "z0": 310.34, "z1": 430, "y0": 130, "y1": 420, "kind": "brick"},
        ],
        # And on the ground: the tactile guide path that runs beside the walls in a real lane, a painted
        # gutter line, two grates, a manhole, and one wet patch that holds the machine's light.
        "marks": [
            {"kind": "tactile", "x0": -300, "x1": -272, "z0": -82.76, "z1": 430},
            {"kind": "tactile", "x0": 272, "x1": 300, "z0": -82.76, "z1": 430},
            {"kind": "gutter", "x0": -318, "x1": 318, "z0": 424.14, "z1": 428.97},
            # The same painted line at the other end of the lane: a straight bar of paint at a mouth is
            # the one piece of road marking this lane can have without writing a word on the ground.
            {"kind": "gutter", "x0": -318, "x1": 318, "z0": 8.97, "z1": 13.79},
            # A channel drain crossing the lane: the kit is the same grate as the two at the kerb, and
            # crossing the whole width is what a lane does where its own water has to leave it.
            {"kind": "grate", "x0": -150, "x1": 150, "z0": 219.31, "z1": 224.14},
            {"kind": "grate", "x0": -118, "x1": -42, "z0": 51.03, "z1": 57.93},
            {"kind": "grate", "x0": 60, "x1": 136, "z0": 241.38, "z1": 248.28},
            {"kind": "manhole", "x0": -40, "x1": 40, "z0": 148.28, "z1": 175.86},
            {"kind": "manhole", "x0": 120, "x1": 200, "z0": 98.62, "z1": 119.31},
            {"kind": "wet", "x0": -316, "x1": -60, "z0": 337.93, "z1": 427.59},
            # The kerb: a six centimetre riser where the floor meets the wall, on both sides, so the
            # lane has a line at its base that light can fall along. Only the face is drawn — the top
            # of a 46 cm kerb is what you stand on, not what you look at.
            {"kind": "kerb", "x0": -318, "x1": -272, "z0": -82.76, "z1": 430, "y1": 6},
            {"kind": "kerb", "x0": 272, "x1": 318, "z0": -82.76, "z1": 430, "y1": 6},
        ],
        # Paper lanterns, hung where a wire already crosses the lane: each one is a light source with a
        # body, which is the only way the room can be lit by something you can also point at.
        # Each lantern hangs from a wire, so it has a period and an amplitude: the swing is authored
        # here rather than taken from a random number, because a lane that moves differently on every
        # reload is not a drawn place, it is a screensaver. `swing` is centimetres at the foot of the
        # cord; the light moves with the paper, so the walls brighten and dim where the lamp is.
        # Every `z` below is a record depth, the same as the cable it hangs from, and each one is the
        # depth of a crossing in `wires`: a lantern is a light with a cord, and five of the six used to
        # hang on air because these numbers were written in scene centimetres while the cables beside
        # them were written in records. `verify-walk` now asserts the pairing rather than trusting it.
        "lanterns": [
            # The crossings below are spaced so that every published stop has one in view: a lantern
            # hung at the mouth of the lane is over your head and out of frame from the entrance, and a
            # warm light nobody can see is a number, not a room.
            {"x": -120, "y": 268, "z": 60, "r": 27, "swing": 3.2, "period": 3.1, "phase": 0.0},
            {"x": 40, "y": 252, "z": 60, "r": 31, "swing": 2.6, "period": 3.9, "phase": 1.7},
            {"x": 210, "y": 262, "z": 150, "r": 26, "swing": 3.6, "period": 4.4, "phase": 0.9},
            {"x": -170, "y": 272, "z": 240, "r": 29, "swing": 2.2, "period": 3.4, "phase": 2.6},
            {"x": -140, "y": 262, "z": 330, "r": 26, "swing": 3.0, "period": 3.6, "phase": 2.1},
            {"x": 150, "y": 258, "z": 410, "r": 28, "swing": 2.6, "period": 4.1, "phase": 0.6},
        ],
        # The window cut in the end wall, and what you see through it. These are NOT record depths and
        # are not multiplied by Z_SCALE: nothing here is hung from a record, and the far plane is
        # authored so a picture of Tokyo reads at the scale a picture shows it at. Mount Fuji is not
        # 900 m away, and the page does not pretend it is.
        "vista": {"x": 0, "y0": 108, "y1": 336, "w": 470},
        "backdrop": {
            "plaza": {"y": -260, "z0": 1240, "z1": 12000, "half": 3600},
            # A nearer row of rooftops, flanking the crossing rather than standing on it. Through the
            # aperture the first thing seen should be a silhouette at the height a lane sees roofs;
            # eight-storey facades straight out of the window would be a diagram of a city, not a view
            # of one. Each carries its own tone, so the row is not four photocopies of one block.
            "roofs": [
                {"x": -1750, "y": 0, "z": 1900, "w": 780, "h": 470, "tone": 0.5},
                {"x": -2520, "y": 0, "z": 2040, "w": 900, "h": 640, "tone": 0.25},
                {"x": 1850, "y": 0, "z": 1860, "w": 720, "h": 520, "tone": 0.7},
                {"x": 2640, "y": 0, "z": 2100, "w": 940, "h": 760, "tone": 0.35},
            ],
            # A raised road crossing the whole view, above the crossing on the ground: the one piece of
            # infrastructure that says this city is larger than this window. Its lamps are geometry
            # rather than light sources — nothing out there is allowed to light the lane it is seen
            # from, and no source in the room is unnamed.
            "express": {"z": 6300, "y": 1250, "half": 6200, "thick": 170, "depth": 900, "pier": 230,
                        "ground": -260, "piers": [-4200, -1500, 1100, 3700, 5900],
                        "lamps": [-4300, -1700, 900, 3500, 5700]},
            "crossing": {"y": -260, "z0": 2100, "z1": 3600, "x0": -1150, "x1": 1150,
                         "stripes": 9, "width": 96, "diagonals": True},
            # `win` is how much of a block is lit; `tone` is how much of that light the air between here
            # and there has taken out of it. A picture of a city has near and far in it, and without
            # tones every block came back at exactly the same brightness at every distance.
            "city": [
                {"x": -2200, "z": 2900, "w": 900, "h": 900, "win": 0.65, "tone": 0.95},
                {"x": 2300, "z": 3100, "w": 800, "h": 1100, "win": 0.6, "tone": 0.88},
                {"x": -1500, "z": 4200, "w": 1300, "h": 1500, "win": 0.5, "tone": 0.7},
                {"x": -450, "z": 4600, "w": 1500, "h": 2300, "win": 0.42, "tone": 0.62},
                {"x": 900, "z": 4100, "w": 1100, "h": 1200, "win": 0.6, "tone": 0.74},
                {"x": 2100, "z": 4800, "w": 1400, "h": 2900, "win": 0.34, "tone": 0.5},
                {"x": -2900, "z": 5400, "w": 1800, "h": 2600, "win": 0.4, "tone": 0.42},
                {"x": 3400, "z": 5600, "w": 1600, "h": 1800, "win": 0.5, "tone": 0.58},
            ],
            "tower": {"x": 1500, "z": 12000, "half": 520, "top": 4200,
                      "decks": [1500, 2600], "mast": 4700},
            "mountain": {"x": -18000, "z": 90000, "base": -260, "top": 14000,
                         "half": 30000, "crown": 5200, "snow": 0.3},
            "sky": [{"y0": -260, "y1": 1400, "c": "#3a4666", "glow": 0.62},
                    {"y0": 1400, "y1": 4200, "c": "#26314d"},
                    {"y0": 4200, "y1": 40000, "c": "#141e36"}],
        },
        # Cables, in the same units, strung wall to wall and to the pole they are bolted on to.
        # Five crossings spread down the lane at the record depths the lanterns are hung on, plus the
        # two runs that make it a street rather than a set of crossings: one from the left wall to the
        # pole, one from the pole to the end wall. A cable used to be authored at record 700 and to run
        # to record 1180 — both past the record's own end, which is the far wall: those two were drawn
        # beyond the room, over the city in the aperture, anchored to nothing on this side of it.
        "wires": [
            {"a": [-320, 336, 60], "b": [320, 352, 60], "sag": 46},
            {"a": [-320, 330, 150], "b": [320, 344, 150], "sag": 40},
            {"a": [-320, 344, 240], "b": [320, 330, 240], "sag": 52},
            {"a": [-320, 338, 330], "b": [320, 334, 330], "sag": 44},
            {"a": [-320, 352, 410], "b": [320, 340, 410], "sag": 30},
            {"a": [-320, 330, 182], "b": [292, 300, 275], "sag": 38},
            {"a": [292, 300, 275], "b": [300, 322, 426], "sag": 34},
        ],
        "frames": [
            # The sub-places: the small areas inside the place, one drawn plate each, hung where the
            # walk passes them. A plate is planned from a place the owner actually went; a corner
            # nobody stood in gets no plate. The titles are the album's own, via the PLACE_TITLES
            # table above, which this block is checked against at build time.
            {"id": "sensoji", "src": "IMG/tokyo-sensoji.jpg", "x": 314, "z": 120, "y": 96, "ry": -90,
             "title": "The gate at Asakusa",
             "alt": "Illustration of a temple gate with a giant hanging lantern and a row of "
                    "closed shopfronts, empty of people.",
             "caption": "The gate lantern and a closed shopfront row, drawn. Asakusa as the "
                        "subject of a picture, not as proof that anyone stood in it."},
            {"id": "scramble", "src": "IMG/tokyo-scramble.jpg", "x": -314, "z": 290, "y": 96, "ry": 90,
             "title": "The scramble at Shibuya",
             "alt": "Illustration of a wide pedestrian scramble crossing seen from above at "
                    "night, stripes radiating, no people and no cars.",
             "caption": "The crossing from above, drawn. Empty on purpose: a crowd here would "
                        "be an invented record, and this frame is not a record."},
            {"id": "tower", "src": "IMG/tokyo-tower.jpg", "x": 314, "z": 380, "y": 96, "ry": -90,
             "title": "The tower at dusk",
             "alt": "Illustration of a lattice radio tower at dusk seen between low rooftops, "
                    "small lights along its frame.",
             "caption": "The lattice tower between rooftops, drawn, its own lights the only "
                        "amber in the frame."},
            {"id": "poster-lantern", "src": "IMG/tokyo-poster-lantern.jpg", "x": -310, "z": 150, "y": 96, "ry": 90,
             "title": "The paper lantern",
             "alt": "Illustration of a single round paper lantern glowing warm against the dark "
                    "grain of a closed shopfront.",
             "caption": "One lantern, close up, drawn. It is the shape every light in the lane "
                        "repeats, hung here at the height a walker reads it."},
            {"id": "poster-wires", "src": "IMG/tokyo-poster-wires.jpg", "x": 310, "z": 214, "y": 104, "ry": -90,
             "title": "The wires over the lane",
             "alt": "Illustration of a tangle of overhead wires crossing a dark sky, cut into "
                    "short segments by the rooftops.",
             "caption": "The overhead tangle, drawn. The lane's own wires in the wires island are "
                        "the same subject at full scale."},
            {"id": "poster-ticket", "src": "IMG/tokyo-poster-ticket.jpg", "x": -310, "z": 392, "y": 108, "ry": 90,
             "title": "The ticket machine",
             "alt": "Illustration of a small ticket machine glowing on a sidewalk at night, its "
                    "buttons drawn as blank studs.",
             "caption": "The machine's light is the lane's coldest, drawn: one more small light "
                        "sunk into the wall an arm's length from the vending machine."},
        ],
        # The sub-areas. Each Field notes plate belongs to one little place in the lane, and the
        # drawn frame with the same name holds that place until a photograph of it arrives; the
        # album's title for each plate is the place, not the picture. verify-walk asserts the
        # closure: every frame's title is a slot in this list.
        "slots_title": "Places in the lane",
        "slots": [
            {"label": "The lane in one sheet", "note": "The album's cover plate for this room. In "
                                                       "the lane it is the mouth itself: stand at "
                                                       "the first chip and the whole lane is the "
                                                       "sheet.",
             "state": "Held by the lane itself, until a photograph of the mouth takes the slot."},
            {"label": "The gate at Asakusa", "note": "The mouth end of the left wall, where the "
                                                     "curtain is still at your back.",
             "state": "Held by a drawn frame; a photograph of the real gate takes the slot when one "
                      "arrives."},
            {"label": "The scramble at Shibuya", "note": "Mid left wall, opposite the lit window.",
             "state": "Held by a drawn frame; a photograph of the crossing takes the slot when one "
                      "arrives."},
            {"label": "The tower at dusk", "note": "The deep end of the left wall, beside the end "
                                                   "wall the old far door stood in.",
             "state": "Held by a drawn frame; a photograph of the tower takes the slot when one "
                      "arrives."},
            {"label": "The paper lantern", "note": "The poster beside the gate picture, where the "
                                                   "wall is still close enough to read.",
             "state": "Held by a drawn poster frame; a photograph of the lantern takes the slot "
                      "when one arrives."},
            {"label": "The wires over the lane", "note": "The poster on the right wall, under the "
                                                          "crossing of cables the lane is lit by.",
             "state": "Held by a drawn poster frame; a photograph of the wires takes the slot when "
                      "one arrives."},
            {"label": "The ticket machine", "note": "The deep end of the left wall, in front of "
                                                    "the machine that keeps the lane's far end.",
             "state": "Held by a drawn poster frame; a photograph of the machine takes the slot "
                      "when one arrives."},
            {"label": "Clips and the lane at 22:40", "note": "Vertical clips and one sound, when "
                                                             "material exists.",
             "state": "Empty by design. A clip needs its caption before it can play here, and the "
                      "sound only if a visitor asks for it."},
        ],
        # Where the stops are, in record centimetres: the chips the reader walks between. Part of the
        # record because a different room has different places worth standing.
        "stations": [
            {"z": 0, "label": "the entrance"},
            {"z": 150, "label": "under the posters"},
            {"z": 275, "label": "by the pole"},
            {"z": 350, "label": "by the lit window"},
            {"z": 395, "label": "in front of the machine"},
        ],
        # The curtain at your back opens onto the street: the hub the lane stands off, and the page
        # every other room is reached from. The wiring block decides the href.
        "exit": {"id": "noren", "kind": "noren", "x": 0, "z": -44, "y": 178, "ry": 180,
                 "title": "The curtain at your back", "hint": "It parts onto the street."},
        "caveat": "The lane is drawn, not surveyed. The wall holds drawn covers and three drawn "
                  "sights — the temple gate at Asakusa, the crossing at Shibuya, the tower at dusk "
                  "— and the objects are props; no footage sits in any slot yet. Frames and clips "
                  "arrive when the owner supplies them, and nothing here implies a place was "
                  "visited.",
    },
    {
        "id": "canada", "label": "Canada",
        "page": ROOM_BY_ID["canada"]["page"],
        "plates": ROOM_BY_ID["canada"]["plates"],
        # A walkway is wider and lower-shouldered than the Tokyo lane, and it is outdoors: the roof is
        # four and a half metres up so that looking up reads as sky, not as a corridor. No onward
        # door — the hub street carries every door but its own.
        "lane": {"w": 720, "d": 400, "ceil": 470, "back": 300},
        "purpose": "A campus walkway after snow, walked at dusk toward the one lit door",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/canada-cover.jpg",
        "cover_caption": "The walkway in one sheet: banked snow, bare trees, one lit doorway at the end.",
        "blurb": "Dusk after snow. Two buildings, a path between them, and the only warm light is a "
                 "door at the far end.",
        # Everything here is drawn. The reference photographs read a walkway's proportions, the way
        # snow banks against a wall, and which way the one warm light points; nothing in the lane is
        # a photograph, and nothing claims a date, a name or an event.
        "objects": [
            {"id": "bank-left", "kind": "bank", "x": -250, "z": 60, "y": 0, "ry": 0,
             "title": "Snow banked against the left wall",
             "hint": "The first thing snow does: it is pushed to the edges and left there. It is the "
                     "walkway's only soft edge."},
            {"id": "bank-left-2", "kind": "bank", "x": -240, "z": 240, "y": 0, "ry": 0,
             "title": "A second bank further down",
             "hint": "Drawn. The far half of the walk needs the same edge as the near half, or the "
                     "snow reads as paint that stopped."},
            {"id": "bank-right", "kind": "bank", "x": 248, "z": 170, "y": 0, "ry": 0,
             "title": "Snow banked against the right wall",
             "hint": "Drawn, and deliberately not symmetrical with the left: snow is cleared by "
                     "people, and people are not symmetrical."},
            {"id": "bench", "kind": "bench", "x": -262, "z": 78, "y": 0, "ry": 90,
             "title": "A bench under the snow",
             "hint": "A campus has benches and nobody brushes them. Set dressing: nothing to open."},
            {"id": "rack", "kind": "rack", "x": 268, "z": 118, "y": 0, "ry": -90,
             "title": "A bicycle rack, empty",
             "hint": "Empty in the drawing because there is no bicycle in the reference. A rack "
                     "with nothing in it is a fact about winter."},
            {"id": "lamp-post", "kind": "utility", "x": 300, "z": 150, "y": 0, "ry": -90,
             "glow": [{"r": 200, "k": 0.42, "dy": 300}],
             "title": "A lamp post",
             "hint": "The walkway's second light, and the reason the snow has a blue side. The glow "
                     "is authored here; nothing else lights this lane."},
            {"id": "crate", "kind": "crate", "x": -244, "z": 300, "y": 0, "ry": 20,
             "title": "A crate by the wall",
             "hint": "Whatever it held is gone. Drawn for silhouette, not for a story."},
            {"id": "bin", "kind": "bin", "x": 262, "z": 250, "y": 0, "ry": -90,
             "title": "A bin with a lid",
             "hint": "The kind of thing every walkway has at its halfway point. Nothing to open."},
            {"id": "hydrant", "kind": "hydrant", "x": 240, "z": 84, "y": 0, "ry": 0,
             "title": "A hydrant, cleared",
             "hint": "Snow is shovelled off hydrants first: it is the one object on the walk that has "
                     "been dug out, which is why it reads as cared for."},
            {"id": "sign", "kind": "sign", "x": 300, "z": 300, "y": 210, "ry": -90,
             "title": "A sign with nothing written on it",
             "hint": "Blank on purpose. Lettering in the scene would be invented, and this site does "
                     "not invent lettering."},
            {"id": "ac", "kind": "ac", "x": 336, "z": 210, "y": 240, "ry": -90,
             "title": "A vent on the wall",
             "hint": "A wall with nothing on it reads as a diagram; this is the smallest thing that "
                     "makes it a building."},
            {"id": "pipe", "kind": "pipe", "x": 336, "z": 340, "y": 0, "ry": -90,
             "title": "A downpipe",
             "hint": "Drawn to the wall's own height so the eye has a vertical in a lane of "
                     "horizontals."},
            {"id": "door-lit", "kind": "door", "x": -300, "z": 372, "y": 0, "ry": 90,
             "leaf": "#4a3a2c",
             "glow": [{"r": 260, "k": 0.5, "dy": 130}],
             "title": "The lit door",
             "hint": "The one warm light at the end of the walk, and the reason the whole lane is "
                     "walked toward it. It is scenery: the way on is the door on the other side. "
                     "Done, it stands ajar and the light steps down when it is shut again.",
             "states": [
                 {"say": "Ajar, and the light lies down the snow past the step.", "k": 1.0,
                  "door": 0.6},
                 {"say": "Shut again. The light under it stays, whoever is behind it stays.",
                  "k": 0.45, "door": 0},
             ]},
            {"id": "planter", "kind": "planter", "x": -300, "z": 160, "y": 0, "ry": 90,
             "title": "A planter under snow",
             "hint": "Set dressing. What is planted in it is not visible and is not claimed."},
            {"id": "cones", "kind": "cones", "x": -120, "z": 12, "y": 0, "ry": 0,
             "title": "Two cones at the mouth of the walk",
             "hint": "Where the walkway meets the road: something has to mark the edge between them."},
            {"id": "board-a", "kind": "signA", "x": -336, "z": 200, "y": 150, "ry": 90,
             "states": [
                 {"say": "The board turns over. The other face is blank too.", "k": 1.05,
                  "flip": 1},
                 {"say": "Turned back. Still nothing written on it, by the same rule that keeps "
                         "every sign here blank.", "k": 0.8, "flip": 0},
             ],
             "title": "A notice board, pinned empty",
             "hint": "The board is drawn and its paper is not: a notice would be a claim about what "
                     "this campus announced."},
        ],
        # Dusk: a lamp post, the lit door, and a cold bounce off the snow itself. Nothing else glows,
        # and the cool one is authored here rather than invented by the renderer.
        # Three sources and no more: the lamp post, the lit door, and a *weak* bounce off the snow.
        # The bounce was authored at 0.32 over a 24 m radius first, which lit the far plane as hard as
        # the lamp post lit the walk and turned the aperture into a flat white panel — snow reflects,
        # it does not emit, and a room outdoors at dusk is dimmer than it looks in a photograph.
        # Every entry carries `bulb: False`, and that flag is the difference between light and a lamp:
        # a bulb is a fixture the renderer draws a body and a cord for, and these four are *spill* —
        # the lamp post's pool, the open door's warmth, the snow's weak bounce, the wall light over the
        # far end. Authored without the flag, four white bulbs were hung in the middle of the air over
        # a walkway that has one lamp post in it.
        "lamps": [
            {"x": 300, "y": 330, "z": 150, "r": 240, "k": 0.34, "bulb": False,
             "tint": "rgba(190,210,255,0.22)"},
            {"x": -300, "y": 236, "z": 372, "r": 280, "k": 0.4, "bulb": False},
            {"x": 0, "y": 30, "z": 200, "r": 1400, "k": 0.11, "bulb": False,
             "tint": "rgba(206,222,255,0.24)"},
            # A wall light over the far end of the walk, authored in scene centimetres like the rest of
            # this list. Without it the last stop stands in the dark: the lit door is on a side wall
            # and by then it is behind you, which is true of the place and unusable in the room.
            {"x": 140, "y": 318, "z": 1112, "r": 460, "k": 0.62, "bulb": False,
             "tint": "rgba(255,224,186,0.28)"},
            # The last of the spill is the sky's: an outdoor room sees more of it at its far end than
            # anywhere else, and without this the wall the walk runs into was the darkest thing in it.
            {"x": 0, "y": 300, "z": 1150, "r": 520, "k": 0.42, "bulb": False,
             "tint": "rgba(180,204,255,0.26)"},
            # Just past the end wall, where the near roof row stands: the light that makes the view
            # through the opening a lit street rather than a dark hole in a bright wall.
            {"x": -300, "y": 260, "z": 1420, "r": 900, "k": 0.5, "bulb": False,
             "tint": "rgba(255,226,186,0.26)"},
            # And the dusk sky itself, standing in the opening: the end wall faces the last of the
            # light, and the falloff means only a source this close to the opening lights it.
            {"x": 0, "y": 300, "z": 3350, "r": 900, "k": 0.5, "bulb": False,
             "tint": "rgba(190,214,255,0.30)"},
        ],
        "beams": [],
        "surfaces": [
            # Brick below, siding above, and one replacement panel of corrugated steel where the wall
            # was opened and closed again. A campus is patched the same way a lane is.
            {"side": -1, "z0": -300, "z1": 90, "y0": 0, "y1": 470, "kind": "brick", "tone": 0.94},
            {"side": -1, "z0": 90, "z1": 340, "y0": 0, "y1": 200, "kind": "dado", "tone": 1.02},
            {"side": -1, "z0": 90, "z1": 340, "y0": 200, "y1": 470, "kind": "plaster", "tone": 1.1},
            {"side": -1, "z0": 340, "z1": 400, "y0": 0, "y1": 470, "kind": "brick", "tone": 1.05},
            {"side": 1, "z0": -300, "z1": 150, "y0": 0, "y1": 470, "kind": "plaster", "tone": 0.92},
            {"side": 1, "z0": 150, "z1": 330, "y0": 0, "y1": 240, "kind": "corrugated", "tone": 0.96},
            {"side": 1, "z0": 150, "z1": 330, "y0": 240, "y1": 470, "kind": "plaster", "tone": 1.08},
            {"side": 1, "z0": 330, "z1": 400, "y0": 0, "y1": 470, "kind": "brick", "tone": 1.05},
        ],
        # Snow is a ground mark, not a wall: it lies where it was pushed, and the middle of the path
        # is where it is not. One ice patch, glossy, in the low corner where water went.
        "marks": [
            {"kind": "snow", "x0": -360, "x1": -150, "z0": -300, "z1": 400},
            {"kind": "snow", "x0": 150, "x1": 360, "z0": -300, "z1": 400},
            {"kind": "snow", "x0": -150, "x1": 150, "z0": -300, "z1": -120},
            {"kind": "wet", "x0": -150, "x1": -40, "z0": 180, "z1": 260},
            {"kind": "grate", "x0": -60, "x1": 60, "z0": 356, "z1": 376},
            {"kind": "kerb", "x0": -360, "x1": -326, "z0": -300, "z1": 400, "y1": 8},
            {"kind": "kerb", "x0": 326, "x1": 360, "z0": -300, "z1": 400, "y1": 8},
        ],
        "lanterns": [],
        # The aperture at the end of the walk: the lit door and the buildings past it.
        # The aperture: 4 m of a 7.2 m wall, which is what a walkway between buildings actually opens
        # onto. It was 5.6 m first, and the deepest frame came back as a screen of city with a strip of
        # wall under it — the end of the walk read as a window, not as the end of a walk.
        "vista": {"x": 0, "y0": 170, "y1": 320, "w": 340},
        "wires": [
            {"a": [-360, 438, 40], "b": [360, 428, 66], "sag": 88},
            {"a": [-360, 430, 220], "b": [360, 442, 250], "sag": 74},
        ],
        "backdrop": {
            # Dusk, so the bands carry their own glow: the aperture frames the horizon, and an
            # unlit band paints at lit 0 — a hairline of night where the record says the sky was
            # still light.
            "sky": [{"y0": -400, "y1": 8000, "c": "#41507a", "glow": 0.82},
                    {"y0": 8000, "y1": 21000, "c": "#26314d", "glow": 0.4},
                    {"y0": 21000, "y1": 40000, "c": "#141e36", "glow": 0.16}],
            "mountain": [{"x": -900, "y": 520, "w": 2600, "h": 380, "c": "#1b2740"},
                         {"x": 1200, "y": 460, "w": 2000, "h": 300, "c": "#1e2a44"}],
            "plaza": {"y": -160, "z0": 900, "z1": 9000, "half": 4200},
            # The near row is what the aperture actually frames, so it carries the light: a walkway
            # at dusk ends on other buildings' walls, not on a skyline. Tones here are dull greys by
            # design — the city behind them is the thing with lit windows.
            "roofs": [
                {"x": -900, "y": 0, "z": 1360, "w": 1300, "h": 620, "tone": 0.8},
                {"x": 1000, "y": 0, "z": 1420, "w": 1200, "h": 700, "tone": 0.62},
                {"x": 200, "y": 0, "z": 1300, "w": 700, "h": 420, "tone": 0.9},
            ],
            "city": [
                {"x": -2100, "z": 3400, "w": 1500, "h": 1700, "win": 0.62, "tone": 0.9},
                {"x": -400, "z": 3900, "w": 1300, "h": 1400, "win": 0.58, "tone": 0.82},
                {"x": 900, "z": 3600, "w": 1200, "h": 1900, "win": 0.66, "tone": 0.95},
                {"x": 2400, "z": 4200, "w": 1400, "h": 1200, "win": 0.52, "tone": 0.72},
            ],
        },
        "frames": [
            # The walk's sub-places, one drawn plate each: the proportion, the vertical, the end.
            {"id": "walk", "src": "IMG/canada-1.jpg", "x": 354, "z": 96, "y": 150, "ry": -90,
             "title": "The walkway at dusk",
             "alt": "Illustration of a wide snow-covered walkway between two buildings at dusk, "
                    "snow banked at both edges and one lit doorway far down it.",
             "caption": "The proportion the room is built from: how wide the walk is, how the snow "
                        "sits against the walls, and where the warm light is. Drawn, not photographed."},
            {"id": "trees", "src": "IMG/canada-2.jpg", "x": -354, "z": 210, "y": 150, "ry": 90,
             "title": "Bare trees over the path",
             "alt": "Illustration of leafless trees leaning over a snow-covered path, their trunks "
                    "dark against a pale winter sky.",
             "caption": "Leafless, drawn: the shape a winter campus has and the reason the lane has a "
                        "vertical in it."},
            {"id": "door", "src": "IMG/canada-3.jpg", "x": 354, "z": 322, "y": 150, "ry": -90,
             "title": "The lit door at the end",
             "alt": "Illustration of a single glass door with warm light behind it at the end of a "
                    "snow-covered path, seen from a distance.",
             "caption": "The end of the walk, as a picture of a door. The room walks toward it; the "
                        "picture does not claim anyone went through."},
        ],
        # Sub-areas, same rule as the lane: one little place per Field notes plate, a drawn frame
        # holding the place until a photograph arrives.
        "slots_title": "Places on the walk",
        "slots": [
            {"label": "Canada, the walk in one sheet", "note": "The album's cover plate for this "
                                                               "room. On the walk it is the mouth "
                                                               "itself: the whole walkway in one "
                                                               "look.",
             "state": "Held by the walk itself, until a photograph of the mouth takes the slot."},
            {"label": "The walkway at dusk", "note": "The first stretch of path, where the light "
                                                     "is still in the trees.",
             "state": "Held by a drawn frame; a photograph of the walkway takes the slot when one "
                      "arrives."},
            {"label": "Bare trees over the path", "note": "The bend of the snow, where the branches "
                                                          "close overhead.",
             "state": "Held by a drawn frame; a photograph of the trees takes the slot when one "
                      "arrives."},
            {"label": "The lit door at the end", "note": "The far end, where the walk was always "
                                                         "going.",
             "state": "Held by a drawn frame; a photograph of the door takes the slot when one "
                      "arrives."},
            {"label": "Clips and the walk at dusk", "note": "Vertical clips and one sound, when "
                                                            "material exists.",
             "state": "Empty by design. A clip needs its caption before it can play here."},
        ],
        "stations": [
            {"z": 0, "label": "the mouth of the walk"},
            {"z": 110, "label": "by the bench and the rack"},
            {"z": 220, "label": "at the bend of the snow"},
            {"z": 280, "label": "by the sign and the pipe"},
            # Two metres short of the end wall. At 368 the stop was 93 cm from it: the frame was the
            # aperture and nothing else, which is true of standing with your nose to a wall and useless
            # as the last thing a room shows you.
            {"z": 330, "label": "at the far end of the walk"},
        ],
        "exit": {"id": "door-back", "kind": "door", "x": 0, "z": -46, "y": 0, "ry": 0,
                 "title": "The door at your back", "hint": "It opens onto the street."},
        "caveat": "The walkway is drawn, not surveyed: its proportions come from the owner's own "
                  "photographs of a campus winter, and every object in it is a drawn prop. The wall "
                  "holds three drawn sights and no photograph, no venue is named and no date is "
                  "claimed. Nothing here says the owner was anywhere.",
    },
    {
        "id": "fukuoka", "label": "Fukuoka",
        "page": ROOM_BY_ID["fukuoka"]["page"],
        "plates": ROOM_BY_ID["fukuoka"]["plates"],
        # A stall alley: narrower than the Tokyo lane and lower, because the lanterns hang close over
        # the counters, and the far end is water rather than a street.
        "lane": {"w": 520, "d": 380, "ceil": 380, "back": 260},
        "purpose": "A stall alley at night, walked toward the water at its end",
        "status": "open",
        "kind": "personal",
        "cover": "IMG/fukuoka-cover.jpg",
        "cover_caption": "The alley in one sheet: noren, timber, lanterns on wires, and water at the end.",
        "blurb": "Warm and narrow. Stalls on both sides, lanterns the whole way down, and a canal at "
                 "the end of it.",
        # The alley is drawn. Its proportions come from the reference photographs; every object is a
        # prop, every sign is blank, and no stall is named or said to be open.
        "objects": [
            {"id": "stall-a", "kind": "front", "x": -240, "z": 96, "y": 0, "ry": 90,
             "glow": [{"r": 145, "k": 0.68, "dy": 190}],
             "title": "A stall front, shutters half up",
             "hint": "The alley's first lit front. The counter is drawn and nothing on it is named; "
                     "the glow is authored here because a stall is where the light comes from. "
                     "Done, the shutter runs up to serve and down to close.",
             "states": [
                 {"say": "Up. Light on the counter, and the alley gets brighter by one stall.",
                  "k": 1.0, "shut": 1},
                 {"say": "Down for the night. The transom keeps a lamp burning.", "k": 0.45,
                  "shut": 0},
             ]},
            {"id": "stall-b", "kind": "front", "x": 240, "z": 208, "y": 0, "ry": -90,
             "glow": [{"r": 135, "k": 0.62, "dy": 190}],
             "title": "The second stall, further down",
             "states": [
                 {"say": "Up here too — two stalls serving is most of what this alley is.",
                  "k": 1.0, "shut": 1},
                 {"say": "Down. One stall still lit, further up the alley.", "k": 0.45, "shut": 0},
             ],
             "hint": "Drawn so the alley has a middle. Its light is dimmer than the first, which is "
                     "what makes the near one read as nearer."},
            {"id": "noren-a", "kind": "noren", "x": -236, "z": 60, "y": 168, "ry": 90,
             "title": "A curtain over a doorway",
             "hint": "Blank cloth: a name on it would be invented lettering, and this site does not "
                     "invent lettering."},
            {"id": "noren-b", "kind": "noren", "x": 236, "z": 168, "y": 168, "ry": -90,
             "title": "A shorter curtain, hung lower",
             "hint": "Drawn to the alley's own height rather than a standard door's, because a stall "
                     "alley is built to whatever the frame allowed."},
            {"id": "stool", "kind": "crate", "x": -190, "z": 128, "y": 0, "ry": 30,
             "title": "A stool at the counter",
             "hint": "Low, round-ish, empty: the two things a stall has in front of it are a counter "
                     "and somewhere to sit, and neither implies anybody did."},
            {"id": "crate-f", "kind": "crate", "x": 196, "z": 250, "y": 0, "ry": -20,
             "title": "A crate stacked by the second stall",
             "hint": "Set dressing: something has to break the long line where the stalls end."},
            {"id": "bin-f", "kind": "bin", "x": 210, "z": 300, "y": 0, "ry": -90,
             "title": "A bin at the turning",
             "hint": "Drawn where the alley widens toward the water. Done, its lid swings.",
             "states": [
                 {"say": "The lid swings open, and swings back by itself a moment later.",
                  "k": 1.0, "flap": 1},
                 {"say": "Shut. The alley keeps its own counsel.", "k": 1.0, "flap": 0},
             ]},
            {"id": "barrel", "kind": "bin", "x": -206, "z": 268, "y": 0, "ry": 0,
             "title": "A barrel against the wall",
             "hint": "The alley's own furniture. Nothing is claimed about what is in it."},
            {"id": "pole-f", "kind": "utility", "x": 214, "z": 84, "y": 0, "ry": -90,
             "title": "The pole the cables are strung from",
             "hint": "Every wire overhead is anchored here or on the walls: a cable has to start "
                     "somewhere you can point at."},
            {"id": "lamp-post-f", "kind": "utility", "x": -212, "z": 330, "y": 0, "ry": 90,
             "glow": [{"r": 140, "k": 0.4, "dy": 320}],
             "title": "A lamp post near the water",
             "hint": "Cooler than the lanterns, and the reason the water at the end has a colour."},
            {"id": "board-f", "kind": "signA", "x": 226, "z": 42, "y": 150, "ry": -90,
             "title": "A board, pinned empty",
             "hint": "A stall wall always has one. Blank, because its paper would be a claim."},
            {"id": "awning-f", "kind": "awning", "x": -250, "z": 178, "y": 250, "ry": 90,
             "title": "An awning over the second doorway",
             "hint": "Drawn, and deliberately lower than the Tokyo lane's: the alley is smaller."},
            {"id": "pipe-f", "kind": "pipe", "x": 226, "z": 320, "y": 0, "ry": -90,
             "title": "A drainpipe at the water end",
             "hint": "The last vertical before the alley stops being an alley."},
            {"id": "planter-f", "kind": "planter", "x": -222, "z": 226, "y": 0, "ry": 90,
             "title": "A planter of dark leaves",
             "hint": "Set dressing: the one green thing, and it is drawn as a silhouette."},
            {"id": "wheel", "kind": "bikes", "x": 200, "z": 136, "y": 0, "ry": -90,
             "title": "A bicycle left against the wall",
             "hint": "Parked in the drawing because the alley is too narrow to pass one comfortably, "
                     "which is exactly why bicycles are left along it."},
        ],
        # Spill again, not fixtures: the lamp post near the water, and the water's own amber bounce.
        # The alley's lamps are its lanterns, and those travel in the `lanterns` list where they belong.
        "lamps": [
            {"x": -212, "y": 330, "z": 330, "r": 240, "k": 0.36, "bulb": False,
             "tint": "rgba(186,208,255,0.20)"},
            {"x": 0, "y": 12, "z": 380, "r": 500, "k": 0.24, "bulb": False,
             "tint": "rgba(255,206,150,0.20)"},
        ],
        "beams": [90, 240, 340],
        "surfaces": [
            # Timber, tile and plaster, with one patch of corrugated sheet where a stall was rebuilt.
            {"side": -1, "z0": -260, "z1": 80, "y0": 0, "y1": 150, "kind": "dado", "tone": 0.98},
            {"side": -1, "z0": -260, "z1": 80, "y0": 150, "y1": 380, "kind": "hoarding", "tone": 0.94},
            {"side": -1, "z0": 80, "z1": 300, "y0": 0, "y1": 380, "kind": "plaster", "tone": 0.9},
            {"side": -1, "z0": 300, "z1": 380, "y0": 0, "y1": 380, "kind": "brick", "tone": 0.86},
            {"side": 1, "z0": -260, "z1": 60, "y0": 0, "y1": 380, "kind": "hoarding", "tone": 0.92},
            {"side": 1, "z0": 60, "z1": 240, "y0": 0, "y1": 160, "kind": "dado", "tone": 1.0},
            {"side": 1, "z0": 60, "z1": 240, "y0": 160, "y1": 380, "kind": "corrugated", "tone": 0.9},
            {"side": 1, "z0": 240, "z1": 380, "y0": 0, "y1": 380, "kind": "plaster", "tone": 0.88},
        ],
        # Wet stone the whole way down — it is an alley beside water — with a grate, a drain run and
        # the painted line at the mouth.
        "marks": [
            {"kind": "wet", "x0": -260, "x1": 260, "z0": 200, "z1": 380},
            {"kind": "grate", "x0": -60, "x1": 60, "z0": 330, "z1": 348},
            {"kind": "gutter", "x0": -260, "x1": 260, "z0": 24, "z1": 36},
            {"kind": "kerb", "x0": -260, "x1": -230, "z0": -260, "z1": 380, "y1": 7},
            {"kind": "kerb", "x0": 230, "x1": 260, "z0": -260, "z1": 380, "y1": 7},
        ],
        # Six lanterns on three crossings: the alley is lit by paper and nothing else that is warm.
        "lanterns": [
            {"x": -90, "y": 258, "z": 40, "r": 24, "swing": 3.0, "period": 3.3, "phase": 0.2},
            {"x": 70, "y": 252, "z": 40, "r": 26, "swing": 2.6, "period": 3.8, "phase": 1.4},
            {"x": -110, "y": 254, "z": 150, "r": 25, "swing": 3.2, "period": 3.5, "phase": 0.8},
            {"x": 100, "y": 250, "z": 150, "r": 23, "swing": 2.8, "period": 4.0, "phase": 2.2},
            {"x": -60, "y": 254, "z": 280, "r": 26, "swing": 3.4, "period": 3.2, "phase": 1.1},
            {"x": 120, "y": 252, "z": 280, "r": 24, "swing": 2.4, "period": 3.9, "phase": 2.9},
        ],
        "vista": {"x": 0, "y0": 96, "y1": 300, "w": 460},
        "wires": [
            {"a": [-260, 344, 40], "b": [260, 338, 40], "sag": 46},
            {"a": [-260, 340, 150], "b": [260, 334, 150], "sag": 50},
            {"a": [-260, 346, 280], "b": [260, 340, 280], "sag": 44},
            {"a": [214, 300, 84], "b": [220, 316, 330], "sag": 30},
        ],
        "backdrop": {
            # Night over water: the horizon band glows off the surface, the upper bands hold it.
            "sky": [{"y0": -400, "y1": 8000, "c": "#37456a", "glow": 0.62},
                    {"y0": 8000, "y1": 20000, "c": "#243049", "glow": 0.3},
                    {"y0": 20000, "y1": 40000, "c": "#131d33", "glow": 0.14}],
            "mountain": [{"x": 600, "y": 420, "w": 2200, "h": 300, "c": "#1c2740"}],
            "plaza": {"y": -300, "z0": 700, "z1": 7000, "half": 4000},
            "roofs": [
                {"x": -1200, "y": 0, "z": 1300, "w": 700, "h": 420, "tone": 0.55},
                {"x": 1300, "y": 0, "z": 1400, "w": 800, "h": 500, "tone": 0.4},
                {"x": 300, "y": 0, "z": 1250, "w": 620, "h": 360, "tone": 0.68},
            ],
            "city": [
                {"x": -1600, "z": 2800, "w": 1200, "h": 1500, "win": 0.5, "tone": 0.66},
                {"x": -200, "z": 3200, "w": 1000, "h": 1100, "win": 0.45, "tone": 0.58},
                {"x": 800, "z": 2900, "w": 1100, "h": 1700, "win": 0.55, "tone": 0.74},
                {"x": 1900, "z": 3400, "w": 1200, "h": 1000, "win": 0.4, "tone": 0.5},
                {"x": 2600, "z": 3000, "w": 900, "h": 1400, "win": 0.5, "tone": 0.62},
            ],
        },
        "frames": [
            # The alley's sub-places: the counters, the overhead layer, and what it ends in.
            {"id": "stalls", "src": "IMG/fukuoka-1.jpg", "x": -284, "z": 120, "y": 96, "ry": 90,
             "title": "The stall row",
             "alt": "Illustration of a row of small stall fronts along a narrow alley at night, "
                    "counters drawn in outline and nothing written on any of them.",
             "caption": "The alley's proportion and its first light, drawn: how narrow it is, and how "
                        "close the counters come."},
            {"id": "lanterns", "src": "IMG/fukuoka-2.jpg", "x": 284, "z": 240, "y": 150, "ry": -90,
             "title": "Lanterns over the wires",
             "alt": "Illustration of paper lanterns hanging in a row from wires across a narrow "
                    "alley, warm against a dark sky.",
             "caption": "The overhead layer, drawn: where the light comes from and how low it hangs."},
            {"id": "water", "src": "IMG/fukuoka-3.jpg", "x": 284, "z": 350, "y": 96, "ry": -90,
             "title": "The water at the end",
             "alt": "Illustration of dark water at the end of an alley with amber light reflected "
                    "along its surface.",
             "caption": "What the alley ends in. Drawn: the room walks toward it, and the picture "
                        "claims nothing about what is on the far bank."},
        ],
        # Sub-areas, same rule as the other rooms: one little place per Field notes plate, a drawn
        # frame holding the place until a photograph arrives.
        "slots_title": "Places in the alley",
        "slots": [
            {"label": "Fukuoka, the alley in one sheet", "note": "The album's cover plate for this "
                                                                 "room. In the alley it is the "
                                                                 "mouth: the whole stall row in one "
                                                                 "look.",
             "state": "Held by the alley itself, until a photograph of the mouth takes the slot."},
            {"label": "The stall row", "note": "The first stalls, where the counters start and the "
                                               "steam is.",
             "state": "Held by a drawn frame; a photograph of the stalls takes the slot when one "
                      "arrives."},
            {"label": "Lanterns over the wires", "note": "Between the stalls, where the light is "
                                                         "strung lowest.",
             "state": "Held by a drawn frame; a photograph of the lanterns takes the slot when one "
                      "arrives."},
            {"label": "The water at the end", "note": "The end of the alley, where the counters "
                                                      "stop and the surface starts.",
             "state": "Held by a drawn frame; a photograph of the water takes the slot when one "
                      "arrives."},
            {"label": "Clips and the alley at closing", "note": "Vertical clips and one sound, when "
                                                                "material exists.",
             "state": "Empty by design. A clip needs its caption before it can play here."},
        ],
        "stations": [
            {"z": 0, "label": "the mouth of the alley"},
            {"z": 90, "label": "at the first stall"},
            {"z": 190, "label": "between the stalls"},
            {"z": 280, "label": "by the bin and the lamp"},
            {"z": 320, "label": "at the water"},
        ],
        "exit": {"id": "curtain-back", "kind": "noren", "x": 0, "z": -46, "y": 172, "ry": 0,
                 "title": "The curtain at your back", "hint": "It parts onto the street."},
        "caveat": "The alley is drawn, not surveyed: its proportions come from the owner's own "
                  "photographs, no stall is named, no sign carries lettering and no date is claimed. "
                  "Nothing here says the owner was in any of these places.",
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
            lights.append({"x": o["x"], "y": o.get("y", 0) + g.get("dy", h - 18), "z": o["z"],
                           "r": g["r"], "k": g["k"], "bulb": False, "of": o["id"],
                           **({"tint": g["tint"]} if "tint" in g else {})})
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
    islands = [("data-walk-lights", lights), ("data-walk-wires", wires),
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
    tex = o.get("img", "")
    style = (f'--x:{o["x"]}px;--z:{o["z"]}px;--y:{o.get("y", 0)}px;--ry:{o.get("ry", 0)}deg;'
             f'--w:{w}px;--h:{h}px;--d:{dep}px')
    frame = f' data-frame="{o["frame"]}"' if "frame" in o else ""
    # The one prop that is not scenery: the record says where it goes and the renderer obeys, so the
    # curtain leaving the lane is a link in the data, not a special case in the script.
    leave = f' data-leave="{escape(o["leave"])}"' if o.get("leave") else ""
    texture = f' data-tex="{escape(tex)}"' if tex else ""
    # A door may carry its own leaf colour: the street's three doors are three different doors.
    leaf_attr = f' data-leaf="{escape(o["leaf"])}"' if o.get("leaf") else ""
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
            f'data-d="{dep}" style="{style}"{frame}{texture}{leaf_attr}{states}{leave}></button>')


def walk_html(d, drawer):
    """The whole viewport is the space; every control is a head-up display floating on it.

    Where leaving goes is one authored value, used twice: the corner control and the curtain at your
    back are the same door, read from the same field, so the key and the prop cannot point different
    ways. Every room's value is the hub street — walk out of any room and you are on it, with the
    doors to the other rooms along it — and the CV is one click further on, from the album's own
    navigation.

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
    sight = (" At its far end the lane opens onto a drawn compound: a crossing below it, a tower, and "
             "a mountain beyond. Nothing out there is a record of anybody standing in it."
             if d.get("vista") else "")
    # An open-world far end: the record authors how far the walker may keep going (walk units), and
    # the renderer lets the world continue past the last wall. Absent, the clamp is the wall itself.
    max_d_attr = f' data-lane-max-d="{lane["max_d"]}"' if lane.get("max_d") else ""
    return f"""<div class="walk" id="walk-{did}" data-walk="{label}" data-walk-id="{did}"
       data-lane-w="{lane["w"]}" data-lane-d="{walk_d}" data-lane-ceil="{lane["ceil"]}"
       data-lane-back="{lane["back"]}"{max_d_attr} data-eye="{EYE}">
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


# The wiring. The street is the hub: every open room's back door — street, lane, walkway or alley —
# opens onto the street page, which is what makes the three rooms freely reachable from one another
# instead of strung along a chain. Wiring it here rather than in the records means a room never has
# to know what exists on the other side of its own curtain; a room added to ROOMS is on the street
# by the same rule. There is no onward wiring: doors between rooms live in the street's record.
# The street itself is the one exception — its back door opens the album, not itself.
for d in open_districts:
    d["back_to"] = ALBUM_PAGE if d["id"] == "street" else CHAIN_ENTRY

rooms_pages = {}
for d in open_districts:
    body = walk_html(d, district_drawer(d)) + "\n" + rooms_plate_html([d])
    rooms_pages[d["page"]] = shell_page(f'{d["label"]} · Rooms · Hua-Xu Zhong', body, d["page"],
                                         d.get("cover", "IMG/1.jpg"))

for _path, _html in rooms_pages.items():
    (ROOT / _path).write_text(_html, encoding="utf-8")

(ROOT / "robots.txt").write_text(
    f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{SITE}/{p}</loc><lastmod>2026-08-31</lastmod></url>\n"
              for p in PUBLIC_PAGES + [d["page"] for d in open_districts
                                       if d["page"] not in PUBLIC_PAGES])
    + "</urlset>\n", encoding="utf-8")
print("wrote html pages")
