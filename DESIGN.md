# DESIGN.md

Visual world for huaxu.github.io — "the journal cover": editorial scholarly design
for an educational-technology researcher. Deep navy plates, warm paper, amber as a
precise instrument, serif-led typography.

## Tokens (css/site.css `:root`)

| Token | Value | Role |
|---|---|---|
| `--navy` | `#101b39` | Primary plate (hero, nav base, rules) |
| `--navy-deep` | `#0a1128` | Darker plate depth (footer bottom, lightbox) |
| `--navy-soft` | `#1a2b50` | Gradient partner, scrollbar thumb |
| `--accent` | `#b45309` | Amber: buttons, markers, rules. Graphics only on paper |
| `--accent-ink` | `#96470a` | Amber for SMALL TEXT on paper — keeps ≥4.5:1. Never lighten |
| `--accent-bright` | `#e2a45c` | Amber for text/graphics on navy plates |
| `--bg` | `#f6f1e6` | Warm paper page background |
| `--gold` | `#fdf6ec` | Cream: alt sections, quotes, featured pubs |
| `--card` | `#fffdf8` | Card surface |
| `--muted` | `#5b5648` | Secondary text on paper (warm, not gray) |
| `--muted-navy` | `#aeb9d6` | Secondary text on navy (tinted from navy, not gray) |
| `--line` / `--line-strong` | `#e0d7c4` / `#c9bda2` | Warm hairlines |

## Type

- Display/headings: **Newsreader** (`--display`), optical sizes, weight 500–700, italic for `.role`.
- Body: **Source Serif 4** (`--serif`), 17px/1.7. The site reads like a journal.
- UI (nav, buttons, eyebrows, badges, chips, labels, small meta): **Archivo** (`--sans`).
- Do NOT reintroduce Inter, Roboto, Fraunces, Space Grotesk, or other saturated faces.

## Rules of the world

- Navy plates open and close the page (hero, footer); paper and cream alternate between.
- Amber is an instrument, not a wash: the 2px press rule under the hero, timeline dots,
  featured-pub top rule, button fills, `::marker`, focus rings. Never large amber areas.
- On navy, secondary text uses `--muted-navy` and amber text uses `--accent-bright`.
  On paper, small amber text uses `--accent-ink` (contrast floor).
- Browser surfaces are themed: `::selection`, scrollbar, `caret-color`, underline offsets.
- Motion: ONE authored moment — the hero entrance (staggered `rise-in` + portrait +
  amber `rule-draw`), plus quiet scroll reveals and hover micro-lifts.
  Everything respects `prefers-reduced-motion`.
- No dark mode. No gradients as decoration (only navy-to-navy plate depth).
- Flat editorial devices over cards-in-cards; stats render as a ruled colophon line.

## When changing styles

1. Edit `css/site.css` only; bump the `?v=` cache-buster in `_gen_html.py` (line ~6) and rerun `python3 _gen_html.py`.
2. Verify contrast on new text/surface pairs (≥4.5:1 small text, ≥3:1 large).
3. Run the detector: `node .claude/skills/impeccable/scripts/detect.mjs --json css/site.css index.html` — keep it at 0 findings.
