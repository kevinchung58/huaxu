---
name: scene-system
description: The site's scene-building pipeline as one system — from the owner's go-word to a shipped, verified walkable place. Use when starting any new place (room, landmark space, sub-space, open district), when the existing scene skills disagree about order, or when re-learning the proven renderer idioms and the gate battery in one read. It conducts the other skills; it does not replace them.
---

# The scene pipeline

One place, from go-word to shipped, is eight phases in order. Each phase names the skill that
governs it, the artefact it must leave behind, and the check that closes it. Skip a phase and
a later phase rediscovers the skip as a rewrite: every entry in §7 and §8 was paid for by a
skip.

| Phase | Governing skill | Artefact | Closes when |
|---|---|---|---|
| 0 go-word | — | the owner's ask, verbatim, in TODO | the ask is written down |
| 1 evidence | `grounded-scene` §1, `place-intake` | the ladder: what the sources say, ranked | every number has a source or is refused |
| 2 measure | `grounded-scene` §2 | the measurement table in TODO + record comment | the table survives a reader who trusts nothing |
| 3 form | this skill §2, `landmark-space` §2-3, `district-author` §0 | one decision: hub room / landmark space / owned sub-space / open district | the decision is stated with its doctrine |
| 4 author | `district-author` §2-3, `lane-prop`, `street-commons`, `japan-place` | the record in `_gen_html.py`, painters in `js/site.js` | `python3 _gen_html.py` exits 0 |
| 5 critique | this skill §3-4 | frames read twice, fixes listed in TODO | two consecutive reads find nothing new |
| 6 wire | this skill §5 | ROOMS row, back_to, place card + cover, IMG rule | the wiring gates pass |
| 7 verify | this skill §6 | the full gate battery, green | every harness exits 0 and says so |

The hub street doctrine stands over all of it: one street with regions, a door per room on the
spine, never two open districts stacked on one page, no room→room chain — except the one owned
form (§2), because the real Table Rock owns Journey and the site must be allowed to say so.

## 1. The renderer contract

The vocabulary every record spends. These are the numbers the gates and the critique both
assume; change one and re-run the whole battery.

- The eye is at 168 cm; a lane segment is 60 cm of paint; depths on the record are multiplied
  by `Z_SCALE` 2.9 when walked, so a station at z 480 stands at 1392.
- `Z_FAR` is 1334: the end wall is drawn there unconditionally unless a `vista` opens it, and
  a last station past it needs `max_d` > `Z_FAR` (the proven pair: `max_d` 1500).
- Day and night are one clock per page (`day: {cycle, start, gain}`); `DAY()` and `NIGHT()`
  gate everything weather- and light-borne. Night is below `DAY() < 0.25`.
- Surfaces name a cladding kind; a kind with no `PATS` entry falls back to its flat tone.
  `dado` is brickwork, `rock` is bedrock — the material is the kind, the strata are the tones.
- Painters (`bd.<id>` in `js/site.js`, config inline in the page) draw in absolute coordinates
  and only what no prop can carry: rivers, rainbows, rails, skylines, glow.
- WebKit rules: `preserve-3d` only on `.room-world`/`.ig-grid`; never `overflow`/`filter` on a
  preserve-3d ancestor. No frameworks, no npm build, no committed package.json — canvas and
  CSS transforms are the whole renderer.

## 2. Choosing the form

Four forms, one question each:

- **Hub room** — a themed interior hanging off the street's spine. It leaves only to the
  street, at its own door (`#at-<id>`), and the street record carries its door.
- **Open district / day page** — the hub street itself and anything that walks out of its own
  end (the quay, the promenade). `street-commons` owns the daylight and the open side.
- **Landmark space** — one tall or huge object owns a page; entered from its prop's room by
  the link contract (press prop → story plates first → enter verb beside them), unwinds to
  that room (`back_to`), and the street carries no door to it. `landmark-space` governs.
- **Owned sub-space** — a space inside a space whose real entrance stands inside the owner
  (Journey Behind the Falls inside Table Rock). A door object with `leave` at the real spot;
  the sub-space's `back_to` is its owner; the gates follow each page's walk-exit chain to the
  street, so the hub is still the one unwind every place reaches.

The decision is written in the record's opening comment with the doctrine it invokes. A form
chosen by convenience rather than by the real place's geometry is the first entry in §7's
failure table.

## 3. The proven idioms

Recipes that survived the critique pass, with their numbers. Reach for these before inventing.

- **Day sky** — the street's idiom: bands from `y0 -400` with glow near 1.0 at the
  light-bearing band, top band `y1` ≈ 90000. At backdrop depths the vertical angles are tiny;
  a short top band leaves a dark lid on the frame.
- **Open end** — `vista` aperture plus `max_d` 1500; the last stop walks past the wall and the
  painter owns the world beyond it. A rail at the edge of the walkable world is the stop's
  whole punctuation — and the rail's z must be past the last walked depth, or it stands
  behind the walker and vanishes.
- **Weather as cladding** — a side wall can wear the place's weather (`mistview`): soft
  horizontal streaks over a cool grey. Crossed or vertical mist planes at alpha ≥ 0.3 wash
  the whole view pale; mist is one horizontal band (α ≈ 0.4 / 0.22) or nothing.
- **Prop at real scale** — when a bespoke panorama washes out under the affine-plus-flat-colour
  math, reuse the site's proven small-scale shape stood at real size (the falls: the
  sheet-over-ledge-into-mist, breadth-to-drop ratio kept). Fidelity lives in the bearings and
  the ratios, not in the drawing technique.
- **City as cladding** — a city from above rides a wall tile (`aerial`); the pod's side view
  is the city, the bearings are the fact.
- **Night rhythm and illumination** — lamps read three ways after dark and carry staggered
  `liton`; a floodlit landmark switches its sheet to the held illumination colour when
  `DAY() < 0.25`, five colours cycling slow, the gorge spilling the same light. The page's day
  cycle is the clock; never add a page for a time of day.
- **Sub-space door** — §2's owned form; the door's glow and hint carry the descent's facts in
  words, the scene carries the space.
- **Fill ceiling** — the walk gate's fill budget is calibrated by an honest A/B (measure HEAD
  at the parent commit, measure with the change, set the ceiling above the sum with margin;
  a second full pass would read near double). Recalibrate when a lane's cladding grows.

## 4. The critique pass

Regenerate, shoot the lane (`.verify/lane-shot.mjs`, `ROOMS=<page>`), and **read the frames as
a visitor, twice**. The harness proves paint; only a read proves place. Known failure shapes:

| Symptom in the frame | Cause | Lever |
|---|---|---|
| everything pale grey | crossed mist planes, alpha too high | one horizontal band, α ≤ 0.4 |
| dark lid over the sky | sky top band `y1` too low | 90000, glow idiom |
| falls as flat ribbons | crest depth ≥ 4000 | bring the crest near, prop at real scale |
| rail invisible | rail z < last walked depth | rail past `max_d` stop |
| alley where a tunnel should be | brick kind on bedrock | `rock`, tones as strata |
| silhouette floating | monochrome quad without a dark anchor | anchor against gorge/sky |
| nothing painted | quad `add()`ed after the emit pass | painters run in the draw list |

Write what each read caught into TODO with the round; a critique pass that reports no catches
is a pass that was not read.

## 5. Wiring, album, registry

- A row in `ROOMS` is the single source: page, plates prefix, status. The wiring loop reads it;
  an authored `back_to` is respected, the default is the street at the room's own door.
- The album (Field notes) gets one place card per open room, in ROOMS order; the card is the
  door and carries `IMG/<id>-cover.jpg`. A cover is a generated frame re-saved as JPEG
  (`.verify/make-cover.mjs`), captioned drawn, never a photograph of the real place.
- Every raster matches a rule in `IMG_RULES` before the generator will run; add the rule with
  the work that adds the file.
- The landmark link contract (prop → plates → enter verb → space → unwind) is wired by the
  hall's record and asserted end-to-end; a new landmark extends `verify-story`, it does not
  hope.

## 6. The gate battery

What each harness proves, so a green run can be named:

- `verify-walk` — the walk itself: boots, stations, door graph (rooms leave to the street or
  unwind by chain), fill ceiling, frame/slot closure.
- `verify-chain` — every page boots clean in a real browser, back props and HUD exits navigate,
  the album's cards are doors with their own covers.
- `verify-shapes` / `verify-geometry` / `verify-clash` — the prop registers: sizes, overlaps,
  the thresholds (≥70/12, deepest ≥70/15, behind ≥55).
- `verify-objects` — every object the page names exists and answers.
- `verify-rooms-e2e` — the rooms end-to-end in a served browser.
- `verify-story` — the link contract pressed end-to-end, both directions, every space.
- `lane-shot` + a human read — §4. `impeccable` — the stylesheet and pages at zero findings.

Run cheap statics after each edit; run the whole battery before a commit that touched a
scene. Verification is the artefact the browser asks for: regenerate, curl the served page,
grep the markup and the `?v=` pin.

## 7. Refusals and honesty

- No lettering in scenes, no people, no invented venue, date or caption; no claim the owner
  stood anywhere. The drawer may carry the sources' figures in words; the scene carries none.
- A caveat is a contract: it must say exactly what the screen shows. When the screen gains a
  silhouette, the caveat loses "no towers on the skyline" in the same commit.
- Drawn covers and plates are captioned generated; a drawn image is never dressed as a
  photograph the owner took.
- Details may shrink; sequence, scale, sightlines and distinctive geometry may not
  (`grounded-scene` §3). Compressed, never deleted.

## 8. Worked examples, shipped

- `street.html` — the hub, the day page, the night rhythm, the harbour open end.
- `rooms.html` / `rooms-fukuoka.html` — night lanes and the table port.
- `rooms-toronto.html` — the hall of lit tables; props owning spaces.
- `rooms-cntower.html` — the whole tower as one ascent; bearings as fact (§6 there).
- `rooms-niagara.html` — the day promenade to the Table Rock rail; prop at real scale;
  skyline silhouette; illumination.
- `rooms-journey.html` — the owned sub-space; bedrock at its real section; the portal; the
  deck at the curtain's foot.

Each example's round notes live in TODO; the measurement tables in §0a-§0f are the artefacts
phase 2 leaves behind.
