#!/usr/bin/env python3
"""The site generator's entry point: it assembles the page bodies and writes every file.

The chrome, the content, the image registry, the world builders, the district records and the
renderers live in `gen/` (round 78). Run this file: `python3 _gen_html.py`.
"""
from gen.content import CONVERGENCE, COURSES, GAI_BEATS, GAI_PAIR, GAI_PREPARE, GRID_ACTS, GRID_CELLS, HOUSE_NAMES, MIT_REPORT_URL, PILLARS, PRACTICE_ROWS, PRINCIPLES, PRINCIPLE_READS, featured_attrs, ongoing_projects, proj_card, projects, pub_card, pubs
from gen.districts import DISTRICTS
from gen.media import ALBUM_ITEMS, ALBUM_PAGE, PLACE_TITLES, _stale, _tiles_by_block, album_tiles, gallery_html
from gen.render import district_drawer, rooms_plate_html, walk_html
from gen.site import CHAIN_ENTRY, FIELD_NOTES_PLACE_IDS, ICON_BOOK, ICON_BULB, ICON_CAL, ICON_CAMERA, ICON_CAP, ICON_CASE, ICON_CHAT, ICON_MAIL, ICON_OUT, ICON_PENCIL, ICON_PHOTO, ICON_RIGHT, ICON_SCHOLAR, ICON_SPARK, ICON_USER, ICON_USERS, ICON_X, PUBLIC_PAGES, ROOM_BY_ID, ROOM_ORDER, ROOT, SITE, authors_html, chip, ico, link_card, page, shell_page, titled
from gen.world import TOR_MASSING_2025, TOR_MASSING_2025_FEATURES

import hashlib
import re
import subprocess
import json
import math
from fnmatch import fnmatch
from pathlib import Path
from html import escape
if len(set(FIELD_NOTES_PLACE_IDS)) != 3 or any(
        rid not in ROOM_BY_ID or ROOM_BY_ID[rid]["status"] != "open"
        for rid in FIELD_NOTES_PLACE_IDS):
    raise ValueError("Field notes must name exactly three open main places")
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
        doi_line = f'<p>DOI: <a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">{escape(p["doi"])}</a></p>'
    else:
        title_html = escape(p["title"])
        doi_line = ""
    feat_html.append(f'''<article class="featured-card reveal">
  <div class="badges"><span class="badge gold">Featured</span>{corr}</div>
  <h3>{title_html}</h3>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])}</p>
  {doi_line}
  <p class="meta-links"><button type="button" {featured_attrs(p)}>{ico(ICON_PHOTO)}View figure</button></p>
</article>''')
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
    <p class="when reveal">
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
principle_cards = "\n".join(
    f'''<article class="card lift reveal"{f' style="--d:{i * 70}ms"' if i else ""}><p class="step">{escape(p["step"])}</p><div class="head-row">{chip(p["icon"])}<div><h3>{escape(p["name"])}</h3></div></div>
      <p>{escape(p["text"])}</p></article>'''
    for i, p in enumerate(PRINCIPLES)
)
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
    <div class="grid-3">
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
conv_rows = "\n".join(
    f'''<div class="conv-row">
  <div class="conv-cell"><p>{escape(r["stance"])}</p></div>
  <div class="conv-link" aria-hidden="true"></div>
  <div class="conv-cell mit"><h3>{escape(r["principle"])} <span class="badge">{escape(r["sec"])}</span></h3><p class="when">{escape(r["note"])}</p></div>
</div>'''
    for r in CONVERGENCE
)
principle_rows = []
for i, r in enumerate(PRINCIPLE_READS):
    flip = " flip" if i % 2 else ""
    # The illustration is required, not optional: the row is two columns and the picture is the
    # other half of the argument. A record without one fails the build here rather than drawing a
    # typographic substitute panel (round 77: that panel was never emitted, and no page has an
    # `.media-fig` without an image in it).
    visual = (
        f'<figure class="media-fig"><img src="{escape(r["img"])}" alt="{escape(r["alt"])}" loading="lazy" /></figure>'
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
gai_beats_html = "\n".join(
    f'      <li><strong>{escape(b["name"])}.</strong> {escape(b["text"])}</li>' for b in GAI_BEATS
)
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
    <ol class="stance-list reveal">
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
    <ol class="stance-list reveal">
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
grid_cells_html = "\n".join(
    f'''<article class="dot-cell lift reveal"{f' style="--d:{i * 60}ms"' if i else ""}>
  <figure><button type="button" class="dot-play" data-dot-open data-act="{escape(c["act"])}" data-num="{escape(c["num"])}" data-name="{escape(c["name"])}" data-cap="{escape(c["cap"])}" aria-label="Play the dot-trace game for panel {escape(c["num"])}, {escape(c["name"])}"><img src="{escape(c["img"])}" alt="{escape(c["alt"])}" loading="lazy" /><span class="dot-chip" aria-hidden="true"><span class="dot-chip-dots"><i></i><i></i><i></i></span>Trace</span></button></figure>
  <div class="cell-body"><div class="badges"><span class="badge">{escape(c["act"])}</span></div>
  <h3>{escape(c["num"])} · {escape(c["name"])}</h3><p>{escape(c["cap"])}</p></div>
</article>'''
    for i, c in enumerate(GRID_CELLS)
)
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
practice_rows = []
for i, r in enumerate(PRACTICE_ROWS):
    flip = " flip" if i % 2 else ""
    # The illustration is required, not optional: the row is two columns and the picture is the
    # other half of the argument. A record without one fails the build here rather than drawing a
    # typographic substitute panel (round 77: that panel was never emitted, and no page has an
    # `.media-fig` without an image in it).
    visual = (
        f'<figure class="media-fig"><img src="{escape(r["img"])}" alt="{escape(r["alt"])}" loading="lazy" /></figure>'
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
if _stale:
    raise SystemExit(f"_gen_html.py: IMG_RULES match nothing: {', '.join(_stale)}")
for it, tile in zip(ALBUM_ITEMS, album_tiles):
    _tiles_by_block[it["block"]].append(tile)


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
""", extra="")
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
assert len(TOR_MASSING_2025_FEATURES) == TOR_MASSING_2025["stats"]["distance_bands"][-1]["candidates"]


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
def _gen_files():
    """Every file of this generator, entry point included. Round 78 split it into `gen/`, and a
    duplicate-key scan that only parsed the entry would have gone quiet over 90 % of the records."""
    return [ROOT / "_gen_html.py"] + sorted((ROOT / "gen").glob("*.py"))


def _assert_no_duplicate_keys():
    import ast as _ast
    _nodes = []
    for _f in _gen_files():
        _nodes += list(_ast.walk(_ast.parse(_f.read_text(encoding="utf-8"))))
    _bad = []
    for _node in _nodes:
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
            "duplicate dict keys in the generator (later ones win, silently):\n" +
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
