#!/usr/bin/env python3
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent

ICON_MAIL = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>'
ICON_SCHOLAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.242 13.769L0 9.5L12 0l12 9.5l-5.242 4.269L12 10.731l-6.758 3.038zm0 0L12 18l6.758-4.231L12 22l-6.758-4.231z" /></svg>'
ICON_CASE = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-15a.75.75 0 01-.75-.75v-4.25m16.5 0a2.25 2.25 0 00.75-1.687V8.25A2.25 2.25 0 0018.75 6h-5.379a1.5 1.5 0 01-1.06-.44L11.25 4.5H5.25A2.25 2.25 0 003 6.75v5.713c0 .651.287 1.269.75 1.687m16.5 0H3.75" /></svg>'

def nav(active: str) -> str:
    def a(href, label, key):
        cls = " is-active" if active == key else ""
        return f'<a href="{href}" class="{cls.strip()}">{label}</a>'

    more_on = " is-active" if active in {"service", "links"} else ""
    return f"""<a class="skip" href="#main">Skip to main content</a>
<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="index.html"><strong>Hua-Xu Zhong</strong><small>PhD</small></a>
    <nav class="nav-links" aria-label="Primary">
      {a("index.html", "Home", "home")}
      {a("about.html", "About", "about")}
      {a("research.html", "Research", "research")}
      {a("teaching.html", "Teaching", "teaching")}
      {a("activities.html", "Activities", "activities")}
      <div class="more">
        <button class="more-btn{more_on}" type="button" aria-expanded="false" aria-haspopup="true">More</button>
        <div class="more-menu" role="menu">
          {a("service.html", "Service", "service")}
          {a("links.html", "Resources", "links")}
        </div>
      </div>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded="false">☰</button>
  </div>
  <nav class="mobile" aria-label="Mobile">
    {a("index.html", "Home", "home")}
    {a("about.html", "About", "about")}
    {a("research.html", "Research", "research")}
    {a("teaching.html", "Teaching", "teaching")}
    {a("activities.html", "Activities", "activities")}
    <div class="label">More</div>
    {a("service.html", "Service", "service")}
    {a("links.html", "Resources", "links")}
  </nav>
</header>"""


FOOT = f"""<footer>
  <div class="wrap foot">
    <div>
      <strong style="color:#fff">Hua-Xu Zhong</strong> <span>PhD</span>
      <p>Researcher in Educational Technology &amp; AI</p>
    </div>
    <div class="social" style="justify-content:center">
      <a href="mailto:your.email@example.com" aria-label="Email">{ICON_MAIL}</a>
      <a href="https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&amp;hl=zh-TW" target="_blank" rel="noopener" aria-label="Google Scholar">{ICON_SCHOLAR}</a>
      <a href="research.html">Research</a>
    </div>
    <p>© 2026 Hua-Xu Zhong. All rights reserved.</p>
  </div>
</footer>
<button class="to-top" type="button" aria-label="Scroll to top">↑</button>
<script src="js/site.js"></script>"""


def page(title: str, active: str, body: str, extra: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Hua-Xu Zhong — researcher in educational technology, AI in education, and design thinking." />
  <title>{escape(title)}</title>
  <link rel="stylesheet" href="css/site.css" />
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
    dict(id="pub4", type="Conference", year=2021, authors="H.-X. Zhong, C.-F. Lai, Y.-C. Huang, P.-H. Wu, J.-H. Chang", title="Exploring the impact of artificial intelligence learning platforms on interest in and attitudes toward learning", source="Innovative Technologies and Learning: 4th International Conference, ICITL 2021, pp. 22-29. Springer"),
    dict(id="pub5", type="Journal", year=2023, authors="H.-X. Zhong, C.-F. Lai, J.-H. Chang, P.-S. Chiu", title="Developing creative material in STEM courses using integrated engineering design based on APOS theory", source="International Journal of Technology and Design Education, Vol. 33, No. 4, pp. 1627-1651. Springer"),
    dict(id="pub6", type="Journal", year=2021, authors="C.-F. Lai, H.-X. Zhong, P.-S. Chiu, Y.-H. Pu", title="Development and evaluation of a cloud bookcase system for mobile library", source="Library Hi Tech, Vol. 39, No. 2, pp. 380-395. Emerald"),
    dict(id="pub7", type="Journal", year=2021, authors="J.-H. Chang, H.-H. Chiang, H.-X. Zhong, Y.-K. Chou", title="Travel package recommendation based on reinforcement learning and trip guaranteed prediction", source="Journal of Internet Technology, Vol. 22, No. 6, pp. 1359-1373."),
    dict(id="pub8", type="Journal", year=2020, authors="Y.-L. Jeng, C.-F. Lai, S.-B. Huang, P.-S. Chiu, H.-X. Zhong", title="To cultivate creativity and a maker mindset through an internet-of-things programming course", source="Frontiers in Psychology, Vol. 11, p. 546616. Frontiers"),
    dict(id="pub9", type="Journal", year=2023, authors="J.-H. Chang, C.-J. Wang, H.-X. Zhong, P.-W. Chen, A.-J. Pan, P.-S. Chiu", title="Implementation and evaluation of the school's COVID-19 prevention website", source="Library Hi Tech, Vol. 41, No. 1, pp. 71-90. Emerald"),
    dict(id="pub10", type="Journal", year=2021, authors="H.-X. Zhong, P.-S. Chiu, C.-F. Lai", title="Effects of the use of CDIO engineering design in a flipped programming course on flow experience, cognitive load", source="Sustainability, Vol. 13, No. 3, p. 1381. MDPI"),
    dict(id="pub11", type="Journal", year=2022, authors="C.-F. Lai, H.-X. Zhong, J.-H. Chang, P.-S. Chiu", title="Applying the DT-CDIO engineering design model in a flipped learning programming course", source="Educational technology research and development, Vol. 70, No. 3, pp. 823-847. Springer"),
    dict(id="pub12", type="Journal", year=2022, authors="C.-J. Wang, H.-X. Zhong, P.-S. Chiu, J.-H. Chang, P.-H. Wu", title="Research on the impacts of cognitive style and computational thinking on college students in a visual artificial intelligence course", source="Frontiers in Psychology, Vol. 13, p. 864416. Frontiers"),
    dict(id="pub13", type="Journal", year=2023, authors="P.-S. Chiu, H.-X. Zhong, C.-F. Lai", title="Investigating the effects of a programming course using flipped learning", source="Innovations in Education and Teaching International, Vol. 60, No. 4, pp. 578-590. Taylor & Francis"),
    dict(id="pub14", type="Journal", year=2024, authors="J.-H. Chang, C.-J. Wang, H.-X. Zhong, H.-C. Weng, Y.-K. Zhou, H.-Y. Ong, C.-F. Lai", title="Artificial intelligence learning platform in a visual programming environment: exploring an artificial intelligence learning model", source="Educational technology research and development, Vol. 72, No. 2, pp. 997-1024. Springer"),
    dict(id="pub15", type="Conference", year=2024, authors="H.-X. Zhong, C.-F. Lai, S.-H. Ku, J.-H. Chang", title="Exploring the Relationship Between Collaborative Learning Factors and Perceived Learning", source="International Conference on Innovative Technologies and Learning, pp. 167-174. Springer"),
    dict(id="pub16", type="Journal", year=2025, authors="J. A. C. Castaneda, P.-C. Lin, P. C. K. Hung, H.-X. Zhong, H.-A. Tseng, Y.-F. Huang, R. Ahmad", title="Designing inclusive tech playful educative solutions for visually impaired learners in STEM education", source="Smart Learning Environments, Vol. 12, No. 1, p. 4. Springer"),
    dict(id="pub17", type="Journal", year=2026, authors="T. Gazit, T. Tager-Shafrir, H.-X. Zhong, P. C. K. Hung, V. Cheung", title="The dark side of the interface: examining the influence of different background modes on cognitive performance", source="Ergonomics, Vol. 69, No. 5, pp. 828-841. Taylor & Francis"),
    dict(id="pub19", type="Journal", year=2026, featured=True, corresponding=True, doi="10.1007/s10796-026-10779-3", authors="J.-H. Chang, C.-F. Lai, C.-L. Huang, H.-X. Zhong*", title="A Decade of Technological Advancements in Information Systems Frontiers (2015–2025): Emerging Trends, Dominant Topics, and Future Directions", source="Information Systems Frontiers, pp. 1-44. Springer"),
    dict(id="pub20", type="Journal", year=2026, authors="J.-H. Chang, H.-X. Zhong, C.-F. Lai", title="Enhancing programming learning with the peer-adaptive-clustering learning approach in virtual learning environments", source="Educational technology research and development, Published online. Springer"),
    dict(id="pub21", type="Conference", year=2025, doi="10.1007/978-3-031-98197-5_1", authors="H.-X. Zhong, C.-F. Lai, W.-I. Hua, J.-H. Chang", title="Exploring the Impact of Mind Maps in Information Security Courses", source="Innovative Technologies and Learning. ICITL 2025. LNCS vol 15914, pp. 3-11. Springer"),
    dict(id="pub18", type="Conference", year=2025, doi="10.1007/978-3-031-92826-0_3", authors="C. L. Gittens, M. Gittens, Y. Jiang, P. C. K. Hung, T. Wood, H.-X. Zhong", title="Technological Influence on Digital Banking Adoption: A Framework and Empirical Study of the Influence of Social Robots and IVAs in a Small Island Context", source="HCI in Business, Government and Organizations. HCII 2025. LNCS vol 15805. Springer"),
]

projects = [
    ("Establishing a Digital Learning Platform for K-12 Maker Education Teacher Training and Developing STEAM Curricula and Assessments", "Researcher", "NSTC / MOST", "August 1, 2019 – July 31, 2022", "To establish a digital learning platform for K-12 maker education teacher training and develop related STEAM curricula and assessments.", "Platform and curricula developed."),
    ("Developing a STEAM Education Teacher Digital Learning Platform and Designing STEAM Curricula Based on the CDIO Engineering Education Model", "Researcher", "NSTC / MOST", "August 1, 2022 – July 31, 2024", "To develop a STEAM education teacher digital learning platform and design STEAM curricula using the CDIO model.", "Platform and curricula designed."),
    ("Integrating CDIO Engineering Education Model with STEM Education into Programming Courses", "Researcher", "Ministry of Education", "August 1, 2020 – July 31, 2021", "To integrate the CDIO model with STEM education in programming courses.", "Integration implemented and evaluated."),
    ("Integrating Design Thinking into Reflective Window Programming Courses Using the CDIO Engineering Education Model (Excellence Award Project)", "Researcher", "Ministry of Education", "August 1, 2021 – July 31, 2022", "To integrate design thinking into programming courses using the CDIO model.", "Project received an Excellence Award."),
    ("Implementing Clustering Algorithms for Adaptive Learning and Peer Learning – A Case Study in Virtual Learning Spaces", "Researcher", "Ministry of Education", "August 1, 2022 – July 31, 2023", "To implement clustering algorithms for adaptive and peer learning in virtual spaces.", "Algorithms implemented and case study conducted."),
    ("Impact of Integrating Guided Inquiry Learning with Collaborative Mind Mapping – A Case Study on Information Security Course Content", "Researcher", "Ministry of Education", "August 1, 2023 – July 31, 2024", "To study the impact of guided inquiry learning with collaborative mind mapping on information security course content.", "Impact assessed through case study."),
    ("International Research Experience: NSTC Scholarship for Doctoral Students to Study Abroad", "Visiting Doctoral Student", "NSTC Scholarship", "September 7, 2023 – April 8, 2024", "To conduct doctoral research abroad and gain international research experience.", "Successfully completed study abroad period."),
]


def pub_card(p, n):
    badges = f'<span class="badge">{p["year"]}</span><span class="badge">{p["type"]}</span>'
    if p.get("featured"):
        badges += '<span class="badge gold">★ Featured</span>'
    if p.get("corresponding"):
        badges += '<span class="badge">Corresponding author</span>'
    title = escape(p["title"])
    if p.get("featured"):
        title_html = f'''<button type="button" data-featured data-title="{escape(p["title"])}" data-authors="{escape(p["authors"])}" data-source="{escape(p["source"])}" data-doi="{p.get("doi","")}" data-corresponding="{"true" if p.get("corresponding") else "false"}">{n}. {title}</button>'''
    else:
        title_html = f"{n}. {title}"
    links = ""
    if p.get("featured"):
        links += f'''<button type="button" data-featured data-title="{escape(p["title"])}" data-authors="{escape(p["authors"])}" data-source="{escape(p["source"])}" data-doi="{p.get("doi","")}" data-corresponding="{"true" if p.get("corresponding") else "false"}">View figure</button>'''
    if p.get("doi"):
        links += f' <a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">DOI</a>'
    feat = " is-featured" if p.get("featured") else ""
    return f'''<article class="pub{feat} reveal" data-pub-type="{p["type"]}">
  <div class="badges">{badges}</div>
  <h4>{title_html}</h4>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])} ({p["year"]})</p>
  <div class="meta-links">{links}</div>
</article>'''


# HOME
home = page("Hua-Xu Zhong, PhD", "home", f"""
<section class="hero">
  <div class="wrap">
    <div class="hero-grid">
      <img class="portrait reveal" src="IMG/1.jpg" alt="Hua-Xu Zhong professional portrait" width="288" height="288" />
      <div class="hero-copy reveal" style="--d:80ms">
        <p class="eyebrow">Educational technology · AI · design thinking</p>
        <h1>Hua-Xu Zhong<span>鍾華栩 · PhD</span></h1>
        <p class="role">Researcher in Educational Technology &amp; AI</p>
        <p class="lede">I work at the intersection of technology, education, and practical AI. My recent work focuses on LLM-powered learning systems — from GAI concept-map generation to tools that foster creativity — so students can inquire, not only adapt.</p>
        <div class="actions">
          <a class="btn btn-primary" href="research.html">{ICON_CASE} View research</a>
          <a class="btn btn-ghost" href="about.html">About my work</a>
        </div>
        <div class="social">
          <a href="mailto:your.email@example.com" aria-label="Email">{ICON_MAIL}</a>
          <a href="https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&amp;hl=zh-TW" target="_blank" rel="noopener" aria-label="Google Scholar">{ICON_SCHOLAR}</a>
        </div>
      </div>
    </div>
    <dl class="stats">
      <div class="stat reveal" style="--d:40ms"><dt>Publications</dt><dd>{len(pubs)}</dd></div>
      <div class="stat reveal" style="--d:90ms"><dt>Research projects</dt><dd>{len(projects)}</dd></div>
      <div class="stat reveal" style="--d:140ms"><dt>Latest papers</dt><dd>2026</dd></div>
    </dl>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Focus</p><h2>Research interests</h2><p>Four threads that connect my papers, platforms, and classroom experiments.</p></div>
    <div class="grid-2">
      <article class="card lift reveal"><h3>Educational Technology</h3><p>Leveraging innovative technologies to enhance learning experiences, instructional design, and educational outcomes.</p></article>
      <article class="card lift reveal" style="--d:70ms"><h3>Artificial Intelligence</h3><p>Exploring the frontiers of AI, including machine learning, to solve complex problems.</p></article>
      <article class="card lift reveal" style="--d:120ms"><h3>Creativity and Design Thinking</h3><p>Applying design thinking methodologies and fostering creative problem-solving in education and technology development.</p></article>
      <article class="card lift reveal" style="--d:170ms"><h3>AI in Education</h3><p>Investigating how AI personalizes learning and supports intelligent tutoring and inquiry-based classrooms.</p></article>
    </div>
  </div>
</section>
<section class="section alt">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Path</p><h2>Education</h2></div>
    <ol class="timeline">
      <li class="reveal"><p class="when">2019/9 – 2024/6</p><h3>Ph.D.</h3><p>National Cheng Kung University</p><p class="when">Department of Engineering Science (Computer Science and Its Applications)</p></li>
      <li class="reveal" style="--d:80ms"><p class="when">2018/9 – 2019/1</p><h3>Master's</h3><p>National Chiayi University</p><p class="when">Department of E-learning Design and Management</p></li>
      <li class="reveal" style="--d:140ms"><p class="when">2014/9 – 2018/6</p><h3>Bachelor's</h3><p>National Chiayi University</p><p class="when">Department of E-learning Design and Management</p></li>
    </ol>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Updates</p><h2>Latest news</h2></div>
    <div class="news reveal">
      <article><time datetime="2026-07-08"><span class="mo">JUL</span><span class="dy">08</span><span class="yr">2026</span></time><div><h3>New publication in Information Systems Frontiers</h3><p>Our paper “A Decade of Technological Advancements in Information Systems Frontiers (2015–2025)” has been published. Hua-Xu Zhong is the corresponding author.</p></div></article>
      <article><time datetime="2026-06-01"><span class="mo">JUN</span><span class="dy">01</span><span class="yr">2026</span></time><div><h3>New publication in ETR&amp;D</h3><p>Our paper “Enhancing programming learning with the peer-adaptive-clustering learning approach in virtual learning environments” has been published.</p></div></article>
      <article><time datetime="2025-03-01"><span class="mo">MAR</span><span class="dy">01</span><span class="yr">2025</span></time><div><h3>Paper accepted for HCII 2025</h3><p>“Technological Influence on Digital Banking Adoption…” accepted for HCII 2025.</p></div></article>
      <article><time datetime="2025-02-15"><span class="mo">FEB</span><span class="dy">15</span><span class="yr">2025</span></time><div><h3>Paper accepted in Ergonomics</h3><p>“The dark side of the interface…” accepted in Ergonomics.</p></div></article>
      <article><time datetime="2025-02-01"><span class="mo">FEB</span><span class="dy">01</span><span class="yr">2025</span></time><div><h3>Paper accepted in Smart Learning Environments</h3><p>“Designing inclusive tech playful educative solutions…” accepted in Smart Learning Environments.</p></div></article>
    </div>
  </div>
</section>
""")

# ABOUT
about = page("About · Hua-Xu Zhong", "about", """
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Statement</p><h2>About</h2><p>Academic journey and vision</p></div>
    <div class="about-card reveal">
      <img src="IMG/2.jpg" alt="Hua-Xu Zhong" />
      <div class="about-copy">
        <h3>Personal academic statement</h3>
        <p>Hua-Xu Zhong is passionate about exploring the intersection of technology, education, and the practical application of artificial intelligence. He is deeply engaged in examining the real-world challenges involved in implementing educational technologies and AI-driven systems.</p>
        <p>His academic journey began with an interdisciplinary undergraduate program, where he carried a strong sense of hope and ambition—believing that diverse knowledge and technical integration could address real-world educational issues. While this training broadened his perspective, it did not fully equip him to tackle the practical demands of the field. Even with a solid understanding of instructional theories and media design principles, he found a gap between theoretical knowledge and actual problem-solving. At one point, he turned to programming in hopes of carving out a career path. However, he soon realized that his limitations in technical aptitude made it difficult to go deeper. This experience led to an important realization: knowledge and tools alone are not enough—what truly matters is the ability to grasp the essence of problems and transform theory into actionable practice.</p>
        <p>During his master's studies, Hua-Xu began to re-evaluate a core question: Can education truly solve real problems? Courses on information literacy and media education helped him understand that education is not merely about transmitting knowledge—it is about fostering comprehension and transforming ways of thinking. More importantly, through studies in innovation, change, and management, he encountered design thinking, which opened up new possibilities for applying creativity and technology in educational contexts.</p>
        <blockquote class="quote">“Education is no longer just a tool for meeting needs—it is a systemic force capable of accelerating change.”</blockquote>
        <p>This insight marked a turning point in his academic path and laid the foundation for his ongoing commitment to educational technology and learning design research.</p>
        <p>Outside of academia, Hua-Xu enjoys traveling, writing, listening to music, and playing basketball. His aspiration is to develop educational technology systems rooted in his educational background, and to design inquiry-based learning frameworks that help students shape the future rather than only adapt to it.</p>
      </div>
    </div>
  </div>
</section>
""")

# RESEARCH
j_count = sum(1 for p in pubs if p["type"] == "Journal")
c_count = sum(1 for p in pubs if p["type"] == "Conference")
years = sorted({p["year"] for p in pubs}, reverse=True)
year_html = []
for y in years:
    items = [p for p in pubs if p["year"] == y]
    items.sort(key=lambda p: p["title"])
    cards = "\n".join(pub_card(p, i + 1) for i, p in enumerate(items))
    year_html.append(f'<div class="year-block" data-year="{y}"><h3>{y} <span style="font-weight:400;color:var(--muted);font-size:.9rem">{len(items)} publications</span></h3>{cards}</div>')

featured = [p for p in pubs if p.get("featured")]
feat_html = []
for p in featured:
    feat_html.append(f'''<button class="featured-card reveal" type="button" data-featured data-title="{escape(p["title"])}" data-authors="{escape(p["authors"])}" data-source="{escape(p["source"])}" data-doi="{p.get("doi","")}" data-corresponding="{"true" if p.get("corresponding") else "false"}">
  <div class="badges"><span class="badge gold">★ Featured</span>{"<span class='badge'>Corresponding author</span>" if p.get("corresponding") else ""}</div>
  <h4>{escape(p["title"])}</h4>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])}</p>
  <p class="source" style="color:var(--accent);font-weight:600;margin-top:.7rem">Open figure →</p>
</button>''')

proj_html = "\n".join(
    f'<article class="card reveal"><h3>{escape(n)}</h3><p><strong>Role:</strong> {escape(r)}</p><p><strong>Funding:</strong> {escape(f)}</p><p><strong>Period:</strong> {escape(pe)}</p><p><strong>Goals:</strong> {escape(g)}</p><p><strong>Outcomes:</strong> {escape(o)}</p></article>'
    for n, r, f, pe, g, o in projects
)

research = page("Research · Hua-Xu Zhong", "research", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Output</p><h2>Research</h2><p>Publications and projects in educational technology, AI learning platforms, and design-based instruction.</p></div>
    <h3 class="reveal">Publications</h3>
    <div class="filters reveal" data-filter-group>
      <button class="chip is-on" type="button" data-filter="all">All ({len(pubs)})</button>
      <button class="chip" type="button" data-filter="Journal">Journal ({j_count})</button>
      <button class="chip" type="button" data-filter="Conference">Conference ({c_count})</button>
    </div>
    {''.join(year_html)}
    <h3 class="reveal" style="margin:2.4rem 0 1rem">Featured papers</h3>
    <div class="featured-grid">{''.join(feat_html)}</div>
    <h3 class="reveal" style="margin:2.6rem 0 1rem">Research projects</h3>
    <h4 class="reveal">Completed</h4>
    <div style="display:grid;gap:1rem;margin-top:.8rem">{proj_html}</div>
    <div class="dashed reveal" style="margin-top:1.2rem"><strong>No ongoing projects listed</strong><p class="when">When a new grant starts, it will appear here.</p></div>
  </div>
</section>
""", extra="""
<div class="modal" id="featured-modal" role="dialog" aria-modal="true">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-panel">
    <button class="modal-close" type="button" data-close aria-label="Close">×</button>
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

# TEACHING
teaching = page("Teaching · Hua-Xu Zhong", "teaching", """
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Classroom</p><h2>Teaching &amp; practice</h2><p>Fostering inquiry, creativity, and responsible use of AI.</p></div>
    <article class="card reveal" style="background:var(--gold)">
      <h3>Teaching philosophy</h3>
      <p>I believe that education is not the transfer of information, but the transformation of the learner.</p>
      <p style="margin-top:.8rem">At the heart of my teaching is the belief that students are not empty vessels, but active agents capable of inquiry, creativity, and reflection. My role is to design spaces where students pose meaningful questions, explore real-world problems, and develop the confidence to navigate ambiguity.</p>
      <p style="margin-top:.8rem">I emphasize creative problem-solving over rote solutions, because I see education as preparation for complexity—not certainty. Design thinking, open-ended inquiry, and playful exploration are central to how I help students engage with problems that don’t have clear answers.</p>
      <p style="margin-top:.8rem">When human support reaches its limit, I turn to personalized learning with large language models. For me, LLMs are not a replacement for human teaching, but a responsive support system—a bridge between learners and possibility.</p>
      <p style="margin-top:.8rem">Ultimately, I teach because I believe in education as a form of liberation—one that empowers individuals not just to adapt to the world, but to imagine and build better ones.</p>
    </article>
    <h3 class="reveal" style="margin:2rem 0 1rem">Courses taught</h3>
    <div class="dashed reveal"><strong>Course list in preparation</strong><p class="when">Syllabi and semester offerings will live here when teaching appointments are listed.</p></div>
  </div>
</section>
""")

# ACTIVITIES
activities = page("Activities · Hua-Xu Zhong", "activities", """
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Community</p><h2>Academic activities</h2><p>A photo archive and a running record of talks. Captions and venues will be attached as they are confirmed.</p></div>
    <h3 class="reveal">Gallery</h3>
    <p class="when reveal" style="margin:.3rem 0 1rem">Photographs from conferences and workshops. Click a frame to view it larger.</p>
    <div class="gallery">
      <button class="shot reveal" type="button" data-lightbox data-src="IMG/3.jpg" data-alt="Academic activity" data-caption="Caption forthcoming">
        <img src="IMG/3.jpg" alt="Academic activity" />
        <figcaption><strong>Caption forthcoming</strong><p class="when">Conference / workshop photograph</p></figcaption>
      </button>
    </div>
    <h3 class="reveal" style="margin:2.4rem 0 .4rem">Talks and visits</h3>
    <p class="when reveal">Invited talks, presentations, workshops, and conference attendance — listed as a CV timeline when records are added.</p>
    <div class="dashed reveal" style="margin-top:1rem"><strong>No talks listed yet</strong><p class="when">This page will not invent events. When you add a title, venue, and date, they will appear here as a single timeline.</p></div>
  </div>
</section>
""", extra="""
<div class="modal" id="lightbox">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-panel" style="padding:0;overflow:hidden">
    <button class="modal-close" type="button" data-close aria-label="Close" style="color:#fff;background:rgba(16,27,57,.75);border-radius:999px;width:2rem;height:2rem">×</button>
    <img alt="" />
    <p style="padding:0.8rem 1rem 1rem"></p>
  </div>
</div>
""")

# SERVICE
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
    <div class="section-head reveal"><p class="eyebrow">Community</p><h2>Academic service</h2><p>Reviewing and other contributions to the field.</p></div>
    <h3 class="reveal">Journal &amp; conference reviewing</h3>
    <article class="card reveal"><ul>{''.join(f'<li>{escape(j)}</li>' for j in journals)}</ul></article>
  </div>
</section>
""")

# LINKS
link_groups = [
    ("Text Generation & LLM Assistance", [
        ("", [("ChatGPT (OpenAI)", "https://chat.openai.com"), ("Gemini (Google)", "https://gemini.google.com"), ("Claude (Anthropic)", "https://claude.ai"), ("Perplexity AI", "https://www.perplexity.ai")]),
        ("Academic and professional writing", [("Notion AI (in Notion)", "https://www.notion.so"), ("Gamma.app", "https://gamma.app"), ("Elicit.org", "https://elicit.org"), ("Grammarly", "https://www.grammarly.com")]),
    ]),
    ("AI Multimedia Generation", [
        ("Image generation", [("Midjourney", "https://www.midjourney.com"), ("DALL-E 3 (OpenAI/ChatGPT Plus)", "https://chat.openai.com"), ("Stable Diffusion (model)", "https://stability.ai/stablediffusion"), ("Adobe Firefly", "https://firefly.adobe.com"), ("Canva Magic Media (in Canva)", "https://www.canva.com")]),
        ("Video generation and editing", [("Runway Gen-2", "https://runwayml.com"), ("Pika Labs", "https://pika.art"), ("Sora (OpenAI — preview)", "https://openai.com/sora"), ("HeyGen", "https://www.heygen.com")]),
        ("Music and audio generation", [("Suno AI", "https://suno.ai"), ("Udio AI", "https://www.udio.com"), ("ElevenLabs", "https://elevenlabs.io"), ("AIVA", "https://www.aiva.ai"), ("Soundraw.io", "https://soundraw.io")]),
    ]),
    ("AI in Academic Applications & Research", [
        ("AI research tools", [("Elicit.org", "https://elicit.org"), ("Connected Papers", "https://www.connectedpapers.com"), ("ResearchRabbit", "https://www.researchrabbit.ai"), ("SciSpace", "https://scispace.com"), ("Zotero", "https://www.zotero.org"), ("Mendeley", "https://www.mendeley.com")]),
        ("AI research and data analysis platforms", [("Google Colaboratory (Colab)", "https://colab.research.google.com"), ("Hugging Face Hub", "https://huggingface.co"), ("Kaggle", "https://www.kaggle.com")]),
        ("AI ethics and responsible innovation", [("AI4People", "https://www.eismd.eu/project/ai4people/"), ("IEEE Ethically Aligned Design", "https://ethicsinaction.ieee.org"), ("Partnership on AI", "https://partnershiponai.org"), ("AI Now Institute", "https://ainowinstitute.org"), ("Stanford HAI", "https://hai.stanford.edu")]),
    ]),
    ("GAI/AI-Assisted Learning & Teaching Platforms", [
        ("AI literacy and programming education", [("Code.org", "https://code.org/ai"), ("Machine Learning for Kids", "https://machinelearningforkids.co.uk"), ("AI4K12.org", "https://ai4k12.org"), ("Google AI Education", "https://ai.google/education/"), ("MIT RAISE", "https://raise.mit.edu")]),
        ("Advanced AI learning platforms", [("Coursera", "https://www.coursera.org"), ("edX", "https://www.edx.org"), ("fast.ai", "https://www.fast.ai"), ("NVIDIA Deep Learning Institute", "https://www.nvidia.com/en-us/training/")]),
    ]),
]
blocks = []
for cat, subs in link_groups:
    inner = []
    for sub, items in subs:
        if sub:
            inner.append(f'<h4 class="subhead">{escape(sub)}</h4>')
        cards = "".join(f'<a class="card lift" href="{escape(u)}" target="_blank" rel="noopener"><h3>{escape(n)}</h3></a>' for n, u in items)
        inner.append(f'<div class="link-grid">{cards}</div>')
    blocks.append(f'<h3 class="reveal" style="margin:1.6rem 0 .8rem;border-bottom:2px solid rgba(180,83,9,.55);padding-bottom:.35rem">{escape(cat)}</h3>' + "".join(inner))

links = page("Resources · Hua-Xu Zhong", "links", f"""
<section class="section">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Toolkit</p><h2>Resources</h2><p>Curated GAI and academic tools. This page lives under More so the main research story stays in front.</p></div>
    {''.join(blocks)}
  </div>
</section>
""")

notfound = page("Page not found · Hua-Xu Zhong", "home", """
<section class="section"><div class="wrap" style="text-align:center">
  <p class="eyebrow">404</p><h2>Page not found</h2>
  <p class="when" style="margin:1rem 0 1.4rem">This address does not match a page on the site.</p>
  <a class="btn btn-primary" href="index.html">Back to home</a>
</div></section>
""")

(ROOT / "index.html").write_text(home, encoding="utf-8")
(ROOT / "about.html").write_text(about, encoding="utf-8")
(ROOT / "research.html").write_text(research, encoding="utf-8")
(ROOT / "teaching.html").write_text(teaching, encoding="utf-8")
(ROOT / "activities.html").write_text(activities, encoding="utf-8")
(ROOT / "service.html").write_text(service, encoding="utf-8")
(ROOT / "links.html").write_text(links, encoding="utf-8")
(ROOT / "404.html").write_text(notfound, encoding="utf-8")
print("wrote html pages")
