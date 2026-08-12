# Agent instructions — Hua-Xu Zhong academic site

This is Dr. Hua-Xu Zhong's personal academic portfolio (React 19 + Vite + TypeScript + HashRouter). It deploys to GitHub Pages at `https://kevinchung58.github.io/huaxu` (`base: '/huaxu/'`).

## Design brief (decided with the owner)

- **Role:** Independent researcher / PhD, not a lab director or faculty chair. Do **not** clone a lab-team site (no "Our Team", no "Join Us"). Structure stays a personal academic site.
- **Visual hybrid:** Soft education-tech warmth **plus** an AI / HCI lab's clarity. Approachable color and rounded surfaces, but scholarly type, measured motion, and a research-grade grid. Not a startup landing page, not a government portal.
- **Reference (tone only):** [ASI² Lab / Dr. Sin-Ye Jhong](https://sinyejhong.github.io/) — photo cards, stat chips, publication-first hierarchy, bilingual polish. Adapt the *craft*, not the faculty/lab IA.
- **Language:** English primary. Paper titles, venues, and author names stay in their original language. Chinese name may appear once next to the English name.
- **IA:** Keep the current seven routes (`/`, `/about`, `/research`, `/teaching`, `/activities`, `/service`, `/links`). Primary nav: Home, About, Research, Teaching, Activities. Put **Service** and **Links** under a **More** menu so the bar is not crowded.
- **Empty content:** Awards, courses, and activities are mostly `N/A`. Do not show fake data. Design real empty / coming-soon states (layout, type, illustration space) so the pages still look finished.
- **Links page:** Keep the GAI / academic tool directory, but it is secondary — only reachable from More.

## UI/UX Pro Max suite (required for visual work)

Vendored from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) into `.agents/skills/`.

This is the **full open-source advanced pack** (search engine + design-system generator + brand / tokens / ui-styling / design / slides / banners). The paid Premium on uupm.cc (hosted AI asset pipeline, enterprise support) is not available here. Use Arena image tools when a mockup or photo is needed.

| Skill | Path | Use when |
|-------|------|----------|
| **ui-ux-pro-max** | [`.agents/skills/ui-ux-pro-max/SKILL.md`](.agents/skills/ui-ux-pro-max/SKILL.md) | Any page, style, color, type, UX review |
| **design-system** | [`.agents/skills/design-system/SKILL.md`](.agents/skills/design-system/SKILL.md) | Tokens (primitive → semantic → component), Tailwind theme |
| **ui-styling** | [`.agents/skills/ui-styling/SKILL.md`](.agents/skills/ui-styling/SKILL.md) | Tailwind (proper build, not CDN), shadcn, a11y components |
| **brand** | [`.agents/skills/brand/SKILL.md`](.agents/skills/brand/SKILL.md) | Voice, color rules, identity consistency |
| **design** | [`.agents/skills/design/SKILL.md`](.agents/skills/design/SKILL.md) | Logo / icon / banner routing if those assets are requested |
| **slides** | [`.agents/skills/slides/SKILL.md`](.agents/skills/slides/SKILL.md) | HTML decks (not needed for the site itself) |
| **banner-design** | [`.agents/skills/banner-design/SKILL.md`](.agents/skills/banner-design/SKILL.md) | Social / cover sizes if requested |

Do **not** invent a palette, type pairing, or page pattern from memory. Generate or read the design system first.

### Workflow

1. Read `ui-ux-pro-max/SKILL.md`. Stack is **React + Vite + TypeScript**. Styling target is **Tailwind as a real build** (`--stack react` and `--stack html-tailwind`). Prefer replacing the Tailwind CDN.
2. If `design-system/MASTER.md` exists, **read it** before generating UI. Page overrides in `design-system/pages/<page>.md` win over Master.
3. If Master is missing (or the owner asked for a new look), generate and persist:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "academic researcher portfolio education technology AI HCI soft approachable lab" \
  --design-system --persist \
  -p "Hua-Xu Zhong" \
  --output-dir . \
  -f markdown
```

Tune with `--variance`, `--motion`, `--density` when the owner asks. Default for this site: variance ~5, motion ~4, density ~5 (balanced, not dashboard-dense, not brutalist).

4. Supplement with domain searches (`style`, `color`, `typography`, `ux`, `landing`, `icons`) and stack searches.
5. Map the result into design-system tokens (see `design-system` skill) and implement with semantic CSS variables / Tailwind theme. No one-off hex in components.
6. Before delivery: contrast 4.5:1, visible focus, hover 150–300ms, `prefers-reduced-motion`, 375 / 768 / 1024 / 1440.

### Search path

Always invoke scripts by project-relative path. Python 3 only; do not install packages.

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Hua-Xu Zhong"
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react
```

## Product constraints

- Keep existing real content in `constants.ts` unless the owner asks to rewrite copy.
- Filter out `N/A` records before render; show designed empty states instead.
- Image paths must work under GitHub Pages subpath `/huaxu/` (`import` or `import.meta.env.BASE_URL`).
- Stay static. No backend.
- No emoji as icons. Use SVG (existing `components/icons`, or Phosphor / Heroicons).
- Compress oversized photos in `IMG/` when touching those pages.
