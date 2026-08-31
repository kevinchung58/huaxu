#!/usr/bin/env python3
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent
CSS = "css/site.css?v=20260830b"

SITE = "https://kevinchung58.github.io/huaxu"
DESC = "Hua-Xu Zhong, researcher in educational technology, AI in education, and design thinking."
PUBLIC_PAGES = ["index.html", "about.html", "research.html", "teaching.html",
                "position.html", "thinking.html", "practice.html",
                "activities.html", "service.html", "links.html"]

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
ICON_CPU = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-16.5 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />')
ICON_PENCIL = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />')
ICON_MONITOR = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />')
ICON_PHOTO = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />')
ICON_X = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />')
ICON_CHAT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />')
ICON_LEFT = svg('<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />')
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
  </nav>
</header>"""


FOOT = f"""<footer>
  <div class="wrap foot">
    <div>
      <strong>Hua-Xu Zhong</strong> <span>PhD</span>
      <p>Researcher in Educational Technology &amp; AI</p>
    </div>
    <div class="social">
      <a href="mailto:your.email@example.com" aria-label="Email">{ICON_MAIL}</a>
      <a href="https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&amp;hl=zh-TW" target="_blank" rel="noopener" aria-label="Google Scholar">{ICON_SCHOLAR}</a>
      <a href="research.html">Research</a>
    </div>
    <p class="copy">© 2026 Hua-Xu Zhong. All rights reserved.</p>
  </div>
</footer>
<button class="to-top" type="button" aria-label="Scroll to top">{ICON_UP}</button>
<script src="js/site.js?v=20260830a"></script>"""


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
          <a href="mailto:your.email@example.com" aria-label="Email">{ICON_MAIL}</a>
          <a href="https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&amp;hl=zh-TW" target="_blank" rel="noopener" aria-label="Google Scholar">{ICON_SCHOLAR}</a>
        </div>
      </div>
    </div>
    <dl class="stats">
      <div class="stat reveal" style="--d:40ms"><dt>{ico(ICON_BOOK)} Publications</dt><dd>{len(pubs)}</dd></div>
      <div class="stat reveal" style="--d:90ms"><dt>{ico(ICON_CASE)} Research projects</dt><dd>{len(projects)}</dd></div>
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
        <p>Outside of academia, I enjoy traveling, writing, listening to music, and playing basketball. I value every meaningful moment and refuse to waste time. I want to build educational technology systems from my background in education, and to work seriously with large language models. I know this era can empower people, and it can also overwhelm them. So my work now focuses on what LLMs and generative AI can do for learning, the direction I describe on my position page, helping students develop their potential not only to survive the future, but to shape it. I am also a scholar who likes learning across disciplines, and I look for ideas from other fields that can spark new work.</p>
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
  <h4>{title_html}</h4>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])}</p>
  {doi_line}
  <p class="meta-links"><button class="text-link" type="button" {featured_attrs(p)}>{ico(ICON_PHOTO)}View figure</button></p>
</article>''')

proj_html = "\n".join(
    f'''<article class="card reveal">
  <h3>{escape(n)}</h3>
  <dl class="meta-dl">
    <div><dt>Role</dt><dd>{escape(r)}</dd></div>
    <div><dt>Funding</dt><dd>{escape(f)}</dd></div>
    <div><dt>Period</dt><dd>{escape(pe)}</dd></div>
    <div><dt>Goals</dt><dd>{escape(g)}</dd></div>
    <div><dt>Outcomes</dt><dd>{escape(o)}</dd></div>
  </dl>
</article>'''
    for n, r, f, pe, g, o in projects
)

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
    <h3 class="subhead reveal">Completed</h3>
    <div class="proj-list">{proj_html}</div>
    <div class="dashed empty reveal" style="margin-top:1.2rem">{chip(ICON_CASE)}<div><strong>No ongoing projects listed</strong><p class="when">When a new grant starts, it will appear here.</p></div></div>
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
  <div class="conv-cell mit"><h4>{escape(r["principle"])} <span class="badge">{escape(r["sec"])}</span></h4><p class="when">{escape(r["note"])}</p></div>
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

position = page("Position · Hua-Xu Zhong", "position", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Position</p><h1>AI in education: where I stand</h1><p>My position on generative AI in education, written in conversation with MIT's August 2026 report on AI use in teaching and learning.</p></div>
    <figure class="pos-hero reveal">
      <img src="IMG/position-hero.jpg" alt="Illustration of a student and an abstract AI figure as partners at a shared desk" loading="lazy" />
      <figcaption>AI as a partner in learning, not a substitute for it.</figcaption>
    </figure>
    <p class="reveal">In August 2026, an MIT ad hoc committee published its report on AI use in teaching, learning, and research training. Its questions are the ones I keep asking: what AI does to students' thinking, when it helps learning, and when it quietly replaces it. This page states my position, shows where the report and I converge, walks through its eight principles one by one, and lists what I want to study next.</p>
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
    {titled("h2", "Beyond the report: what I want to study", ICON_BULB, "block-title reveal spaced")}
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
  <figure><img src="{escape(c["img"])}" alt="{escape(c["alt"])}" loading="lazy" /></figure>
  <div class="cell-body"><div class="badges"><span class="badge">{escape(c["act"])}</span></div>
  <h4>{escape(c["num"])} · {escape(c["name"])}</h4><p>{escape(c["cap"])}</p></div>
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
    <p class="reveal">One small field of dots, three acts. Each panel keeps the same cast of dots and changes only what we choose to do with them.</p>
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
""")

# Practice page — part two of the MIT report read (owner decision 2026-08: the
# recommendations half lives on its own page, eight clusters, each with a
# "transfer" note read from a campus without MIT's budget). Rows render with
# generated scene illustrations (owner approved 2026-08); the CSS plate variant
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
        "take": "The day-one explanation is the part I keep underlining. Students follow rules whose purpose they understand, and \"we work in groups because learning here is social\" is a purpose I can defend: collaboration is the third link of my teaching chain, and here the report gives it the same weight.",
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
        "take": "This row matters even more in Taiwan, where most students write in English as an additional language. A tool whose known failure mode is misreading their prose as machine-made is not a neutral instrument. Process evidence beats pattern-matching, and it costs less than a surveillance license.",
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
        "take": "This is where the report and my research agenda overlap most cleanly. The three registers give structure to the literacy ground layer I argue for on my thinking page, and the quarter who feel prepared is the measurable version of why that layer exists. <a href=\"thinking.html\">My thinking page works this out in full</a>.",
    },
    {
        "sec": "§3.3.7",
        "name": "Fair access, priced",
        "img": "IMG/practice-8-access.jpg",
        "alt": "Illustration of a machine figure operating a tap dispenser and three students queuing with cups as an amber stream fills the first cup",
        "said": "Top commercial AI plans run around $200 per month, so students who can pay literally learn with stronger tools than students who cannot. MIT's answer is Parley, a model-agnostic campus platform giving every member about $30 of monthly credits and API access for coding tools. The committee concedes the amount may fall short and asks for continuing review.",
        "take": "Most campuses cannot fund a Parley. The lens still travels: access is a design variable. An assignment that assumes a $200 subscription measures family income; one that assumes fluent AI habits measures who had guidance.",
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
    if "<a href" not in take:
        take = escape(take)
    else:
        head, rest = take.split('<a href="')
        href, tail = rest.split('">', 1)
        link_text, tail2 = tail.split("</a>", 1)
        take = f'{escape(head)}<a href="{escape(href)}">{escape(link_text)}</a>{escape(tail2)}'
    practice_rows.append(
        f'''<div class="media-row reveal{flip}">
  {visual}
  <div class="media-copy">
    <h3>{escape(r["name"])} <span class="badge">{escape(r["sec"])}</span></h3>
    <p>{said}</p>
    <p class="my-read"><span class="read-tag">Transfer</span>{take}</p>
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
    <p class="reveal">I read the list with one bias declared. MIT's solutions assume MIT's resources: pilot funds, fellow programs, standing committees, and a model-agnostic platform with per-user monthly credits. Most campuses have none of these, and neither does a single instructor planning next semester. So for each group I ask a transfer question: what survives when the budget and the org chart are removed? Usually something does, and it is usually the part that was about pedagogy all along. Eight groups matter most to my context; this page takes them in turn.</p>
    {titled("h2", "The action list, read twice", ICON_CASE, "block-title reveal spaced")}
    <div class="principle-rows">
{practice_rows_html}
    </div>
    <p class="reveal">What I have left off: the report's institutional machinery (standing committees, AI Leads, fellows, pilot funds, metrics programs), its space planning, privacy logging, and environmental audit. Those are things only an institute can do, and I have no institute to offer. What one person can do is the eight rows above.</p>
    <section class="pillar-sec reveal reference-box">
      <h3>Reference</h3>
      <p>MIT Ad Hoc Committee on AI Use in Teaching, Learning, and Research Training. <i>Report</i>. Massachusetts Institute of Technology, August 13, 2026. Recommendations section §3. <a href="{MIT_REPORT_URL}" target="_blank" rel="noopener">Read the full report</a></p>
      <p class="pillar-more"><a class="text-arrow" href="position.html">Part one: my position and the eight principles {ico(ICON_RIGHT)}</a></p>
    </section>
  </div>
</section>
""")

# Add photos here later: (src, alt, caption). Multiple items become a slideshow.
GALLERY = [
    ("IMG/3.jpg", "Academic activity", "Caption forthcoming"),
]
gallery_many = len(GALLERY) > 1
gallery_slides = []
gallery_dots = []
for i, (src, alt, cap) in enumerate(GALLERY):
    on = " is-on" if i == 0 else ""
    gallery_slides.append(
        f'<figure class="deck-slide{on}" data-slide="{i}">'
        f'<button type="button" data-lightbox data-index="{i}" data-src="{escape(src)}" data-alt="{escape(alt)}" data-caption="{escape(cap)}">'
        f'<img src="{escape(src)}" alt="{escape(alt)}" /></button></figure>'
    )
    gallery_dots.append(f'<button type="button" class="deck-dot{on}" data-go="{i}" aria-label="Photo {i + 1}"></button>')
gallery_nav = ""
if gallery_many:
    gallery_nav = f'''<button class="deck-btn prev" type="button" data-deck-prev aria-label="Previous photo">{ICON_LEFT}</button>
    <button class="deck-btn next" type="button" data-deck-next aria-label="Next photo">{ICON_RIGHT}</button>
    <p class="deck-count"><span data-deck-n>1</span> / {len(GALLERY)}</p>'''
gallery_dots_html = f'<div class="deck-dots">{"".join(gallery_dots)}</div>' if gallery_many else ""
gallery_note = (
    "When more photographs are added, they play as a slideshow. Select a photo to view it larger."
    if not gallery_many
    else "Use the arrows or select a photo to view it larger."
)

activities = page("Activities · Hua-Xu Zhong", "activities", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Community</p><h1>Academic activities</h1><p>A photo archive and a running record of talks. Captions and venues will be attached as they are confirmed.</p></div>
    {titled("h2", "Gallery", ICON_CAMERA)}
    <p class="when reveal" style="margin:-0.4rem 0 1rem">{gallery_note}</p>
    <div class="deck reveal" data-deck>
      <div class="deck-stage">
        {''.join(gallery_slides)}
        {gallery_nav}
      </div>
      <p class="deck-cap" data-deck-cap>{escape(GALLERY[0][2])}</p>
      {gallery_dots_html}
    </div>
    {titled("h2", "Talks and visits", ICON_CHAT, "block-title reveal spaced")}
    <p class="when reveal">Invited talks, presentations, workshops, and conference attendance. They will appear as a CV timeline when records are added.</p>
    <div class="dashed empty reveal" style="margin-top:1rem">{chip(ICON_CHAT)}<div><strong>No talks listed yet</strong><p class="when">This page will not invent events. When you add a title, venue, and date, they will appear here as a single timeline.</p></div></div>
  </div>
</section>
""", extra=f"""
<div class="modal" id="lightbox">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-panel lamp">
    <button class="modal-close on-photo" type="button" data-close aria-label="Close">{ICON_X}</button>
    <button class="deck-btn prev on-photo" type="button" data-lamp-prev aria-label="Previous photo">{ICON_LEFT}</button>
    <button class="deck-btn next on-photo" type="button" data-lamp-next aria-label="Next photo">{ICON_RIGHT}</button>
    <img alt="" />
    <div class="lamp-meta">
      <p data-lamp-cap></p>
      <p class="deck-count" data-lamp-count></p>
    </div>
  </div>
</div>
""")

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

(ROOT / "robots.txt").write_text(
    f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{SITE}/{p}</loc><lastmod>2026-08-31</lastmod></url>\n"
              for p in PUBLIC_PAGES)
    + "</urlset>\n", encoding="utf-8")
print("wrote html pages")
