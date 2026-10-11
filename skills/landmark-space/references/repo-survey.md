# Repo survey: how other builds make a walkable space beautiful

The round-18 research for `skills/landmark-space`. Five sources, read for the question *what makes
an explorable 3D space read as beautiful*, and sorted the way `sakura-crossing.md` sorts them: what
to take, what to refuse, and where the thing lives. Every source is a reference, not a dependency —
the dependency rule in `AGENTS.md` is unchanged, and nothing here argues for changing it.

## 1. Kenton-GMI/sakura-crossing (re-read for landmarks)

The existing note (`skills/japan-place/references/sakura-crossing.md`) covers the object vocabulary
and the refusals. Re-read for this round, the parts that apply to a *hero object* rather than a
street:

- **Outline pass on hero props only.** Their inverted-hull outline is applied to the train, the
  crossing gear, the vending machines — the objects the eye must catch — and to nothing else. The
  transferable rule: *silhouette hierarchy is authored, not emergent*. In our raster the equivalent
  is the contrast budget: the landmark gets the saturated accent (their `PAL` reserves four
  saturated colours for focal objects and keeps everything else desaturated), the furniture stays
  mid-tone.
- **Toon ramp + violet shadow shift.** The thing that separates "anime cel" from "low-poly 3D" in
  their frames is quantised light with shadows shifted toward violet rather than grey. Ours has the
  navy murk (`rgba(22,34,60,…)`) playing the same role — the shadow hue is part of the palette, and
  a landmark space must commit to it on every surface, not per prop.
- **The moment scales with the subject.** Their crossing sequence (bells → booms → train) is the
  local version of Little Canada's roof. For a tower the moment is the elevator running up the
  shaft and the light pattern at night — motion *on the body of the object* (`SKILLS.md` §3), not a
  blinking beacon.

## 2. Nice-Wolf-Studio/claude-skills-threejs-ecs-ts — the engineering principles

A three.js skill pack (ECS + renderer topics). Its value here is not code — it is WebGL and we ship
none — but the *checklists* state, in one line each, the things our raster re-derived the hard way,
which is evidence they are medium-wide rules:

| their line | our equivalent, already committed |
|---|---|
| layered lighting; limit active lights; realistic colour temperatures | one `lamps` list, one `lightAt()`, tints authored per source (`lane-prop` §3) |
| fog is cheap, use it; match fog colour to background | `FOG_MAX` murk, navy on purpose (`district-author` §3) |
| selective shadows; contact shadows; static baking | round-16/17 shadow system; pools are night's, shadows are day's |
| clamp pitch; smoothing; constraints on the camera | yaw ±35°, pitch ±10°, drag not Pointer Lock |
| post-processing budget: each pass costs; cheapest-to-most-expensive ordering | one composite pass; `lighter` for glows/pools, `source-over` for shadows |
| no ambient light = pure black shadows (pitfall) | `AMBIENT 0.42`, "an eye never adapts to 6% of a material" |

Two lines from it are new to us and belong in the landmark skill:

- **"Wrong colour temperatures: unrealistic look"** — their lighting pitfalls list names mixed
  colour temperature as the first way a scene reads fake. Our street already discovered this as
  "the vending machine is fluorescent, not sodium" (round 17). Generalised: *a space commits to one
  temperature family per hour; a second temperature is an event, not a default.*
- **"Environment too bright / too dark"** (env-map pitfalls) — the whole-frame exposure is a single
  authored value; per-object brightness fights it. Ours: `_lumacheck`'s three numbers are exactly
  this check, and a landmark space gets its own row in that probe from its first build.

## 3. Owl-Listener/designer-skills — the critique vocabulary

The design pack AGENTS.md already leans on. For a 3D space the two skills that apply to a
*rendered frame* (our lane-shot sheet is exactly "a rendered screen") are:

- **critique-composition** — balance, whitespace, rhythm, gestalt (proximity, similarity,
  figure/ground, continuity). Its failure patterns translate directly: "orphaned elements that
  float without proximity to their related group" is a prop off the station rhythm; "overcrowded
  sections adjacent to empty ones, creating unintentional visual cliffs" is a dressed stop next to
  a bare stretch of lane.
- **critique-color** — contrast, palette coherence, semantic use. Its "one-off hex values outside
  the token system" failure is our rule that every colour is a tile in `PATS`/`FLATOF` or a record
  tint, never a literal in a painter.

The method to take: **Observation → Problem → Fix, rated pass/minor/major, per dimension.** The
landmark skill's beauty gate is this loop run over the lane-shot sheet, dimensions renamed for a
space rather than a screen: *silhouette, light hierarchy, depth (air), rhythm, palette coherence*.
What it replaces is nothing — it sits beside the luma gates, because a frame can pass every number
and still tip top-heavy; the numbers catch collapse, the critique catches ugliness.

## 4. mpetroff/pannellum — the tour vocabulary

4.9k stars, the reference panorama tour engine. Its config is the cleanest public statement of what
a *graph of viewpoints* needs, and every item has a twin in this repo:

| pannellum | ours |
|---|---|
| `scenes` + `firstScene`, per-scene override of `default` | `DISTRICTS` + `ROOMS`, street first |
| `hotSpots` of type `scene`, with target `yaw`/`pitch`/`sameAzimuth` | door props with `leave`, `#at-<room>` spawn *facing the others* |
| `sceneFadeDuration` | the plate's view transition; a room change is a walk, not a fade (`AGENTS.md`) |
| `preview` image before load | the album plate is the preview of a room — the round-18 link contract makes that literal |
| `autoRotate` after inactivity | we refuse it: nothing moves on a clock of its own except authored motion; idle shows the *idle pump*, not a camera spin |
| CSS-3D `fallbackPath` when WebGL is absent | our whole renderer *is* the fallback, and the list/drawer is the fallback of the renderer |

The one pannellum idea with no twin here, and the one the link contract takes: **the hotspot that
is a door carries the pose you arrive in** (`targetYaw`/`targetPitch`/`sameAzimuth`). Our `#at-`
spawn sets depth and facing on the street; the landmark space must arrive you *looking at the thing
the door named*, from the stop that names it — which is `place-intake`'s stop rule applied to a
doorway between rooms.

## 5. yoshifujidesign/3d-html-slide-skill — the small CSS-3D witness

A single-file skill for Three.js-backed presentation slides. Low relevance, two transferable
habits: theme colour as a *set of CSS variables switched as one* (our `VER`-free palette should get
the same discipline if a landmark space adds a second palette), and `data-parallax` depth tags —
the cheap admission that parallax on a photograph is a different product from a room (`SPEC` §9(e)),
which the owner has twice refused for us. Cited so the next session does not re-fetch it.

## Refusals, collected

- three.js/Vite/npm from any of the above — the dependency rule, unchanged, its own PR if ever.
- pannellum's auto-rotate and fade-between-scenes — a room change is a walk; idle is not a spin.
- The slide skill's CDN libraries and glassmorphism panels — the site's world is the journal cover
  (`DESIGN.md`), not glass.
- Invented lettering, people, brands — from all five sources, restated because four of the five
  arrived at it independently; convergence is the evidence it is the medium's rule.
