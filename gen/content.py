"""`gen/content.py` — the records: publications, projects, pillars, courses, and the report's rows.

This is the file the owner edits when a paper is accepted, a talk is given or a principle's reading
changes. It holds data and the two card renderers that belong to that data (`pub_card`, `proj_card`)
— nothing about layout, and nothing about the walk. Split out of `_gen_html.py` in round 78 and
proven byte-identical on all 19 emitted pages; the entry point is `_gen_html.py`.
"""
from html import escape
from gen.site import ICON_BULB, ICON_CASE, ICON_PENCIL, ICON_PHOTO, ICON_SPARK, ICON_USER, ICON_USERS, authors_html, ico
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
        doi_line = f'<p>DOI: <a href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">{escape(p["doi"])}</a></p>'
    else:
        title_html = f"{n}. {title}"
        doi_line = ""
    links = ""
    if p.get("featured"):
        links += f'<button type="button" {featured_attrs(p)}>{ico(ICON_PHOTO)}View figure</button>'
    feat = " is-featured" if p.get("featured") else ""
    return f'''<article class="pub{feat} reveal" data-pub-type="{p["type"]}">
  <div class="badges">{badges}</div>
  <h4>{title_html}</h4>
  <p class="authors">{authors_html(p["authors"])}</p>
  <p class="source">{escape(p["source"])} ({p["year"]})</p>
  {doi_line}
  <div class="meta-links">{links}</div>
</article>'''

# Backlog item 3 (2026-08), done 2026-10-10 under the owner's blanket go-word: surface the
# corresponding-author and international-collaboration facts that already live in `pubs` and
# `projects`, computed from those records — the strip below asserts nothing the list does not
# already say.
HOUSE_NAMES = ["Elsevier", "Springer", "MDPI", "Taylor & Francis", "Frontiers", "Emerald"]
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


# Courses — data-driven, like PILLARS/GALLERY. FUTURE (owner note, 2026-08):
# online courses will be appended here. Each entry:
#   {"name": ..., "level": ..., "period": ..., "desc": ..., "tags": [...], "url": ...}
# "url" is optional — when present the course title links out (hosted online course).
# An empty list renders the "in preparation" note instead.
COURSES = []

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

# Principle-by-principle read of the report (Section 2, eight principles).
# Each row: what the committee says ("said") and where it lands in my work ("read").
# Rows render as alternating media rows. Visual direction (owner decision 2026-08):
# all eight rows use generated illustrations (IMG/principle-2-*.jpg, one flat
# editorial world). The illustration is required: a row without one fails the build.
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

# Practice page — part two of the MIT report read (owner decision 2026-08: the
# recommendations half lives on its own page, eight clusters, each read from a
# campus without MIT's budget. 2026-09 owner review: the per-row notes are
# labeled "My read" and each take was confirmed or rewritten with the owner;
# the "Fair access" row carries no note, and the former closing "What I have
# left off" paragraph was removed). Rows render with generated scene
# illustrations (owner approved 2026-08), and every row needs one: the § plate
# variant is gone (round 77), so a row without an image fails the build.
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
