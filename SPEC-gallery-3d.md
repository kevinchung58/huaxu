# SPEC: the Activities space — one room, a list of places, a camera

> status: **proposal, nothing built.** v2, 2026-09-14. Rewritten after reading the
> reference (`https://jalangmbb.tanwanjern.com/`) as an interface in three separate
> render passes plus six probe URLs, instead of trusting one screenshot-sized text dump.
> The owner's order stands: look → spec → only then research engines (§9 is the test
> the research must pass; no library is picked here).
>
> v1 of this file was wrong in an important way. It described the reference as a
> *building*. It is not. See §2.

## 1. Method: what I actually read, and what I could not

Observed directly (fetches of the live page, three passes, two of them with query
strings, one through a headless reader that reports shadow DOM):

- `https://jalangmbb.tanwanjern.com/` — full UI text, twice.
- `?level=2` and `?level=9` — **both return Level 1 unchanged**. Three passes agree.
- `robots.txt`, `manifest.webmanifest`, `spaces.json`, `levels.json`,
  `data/levels.json`, `building.json` — **all `# 404 / This page could not be found.`**
  with the app's own `<title>Jalan</title>`.
- A reader pass reported: `This page contains shadow DOM that are currently hidden`.

Not obtainable, and I will not pretend otherwise: the source. Wayback's CDX and
`save` endpoints returned errors through the only egress route available to me
(`fetch_page`; direct `curl` from the sandbox is blocked at TLS), and three
raw-proxy relays (`api.allorigins.win`, `api.codetabs.com/v1/proxy`,
`r.jina.ai?x-respond-with=html`) all failed or ignored the format request. So **no
JS bundle, no shader, no asset manifest was read.** Everything below §2 is derived
from what the interface itself states — which is a lot, because this site narrates
its own state — and from the absence of files (§1).

## 2. The decisive observation

Rendered, verbatim, on every pass:

```
WebGL is unavailable. The spaces list still works.
Level picker
↑ Level 2
↓ Level G · Coming soon
YOU
Men's and women's toilets · Level 1 · Unit 1 corner
Level  9 8 7 6 5 3A 3 2 1 G
Level 1        − +
Jalan GMBB is still experimental. Map details and information might be inaccurate.
`W` `A` `S` `D` walk · `Space` jump · Drag to turn · `E` open
Jump
Level 1 ready.
```

Ten level chips are offered. **Exactly one level is described as ready** (`Level 1
ready.`), one is `Coming soon` (`G`), and the *whole* list of spaces contains
**one record**: `Men's and women's toilets · Level 1 · Unit 1 corner`.

So this is not a walk-through of a building. It is:

> **one furnished room, one labelled place in it, a camera you can drag, and a
> list that never breaks — with the unbuilt parts declared as unbuilt.**

That is the finding v1 missed, and it is what makes the idea *cheap*: the effect
comes from the **state machine and the narration**, not from scene size. A
three.js hero scene is what people assume is required; the reference proves one
room with honest labels already reads as a place.

## 3. What each element is doing (and why it is in the spec)

| Element | Function | Why the owner's site needs it |
|---|---|---|
| `WebGL is unavailable. The spaces list still works.` | capability notice addressed to the *reader*, naming the working alternative | our version: `The archive list below works without 3D.` Same sentence class as our empty-state copy |
| `Building your view…` → `Level 1 ready.` (also seen: `Loading.`) | async per-level assembly with a **status line the reader can see** | our rooms are built on first entry; the status line is the a11y announce hook, not a spinner |
| `9 8 7 6 5 3A 3 2 1 G` | **registry with human labels**, non-contiguous, mezzanine `3A`, ground `G` | our "levels" are not floors: `Workbench / Field / Classroom / Stage / Campus` (§5) |
| `↓ Level G · Coming soon` | availability per item, **stated** | the honest answer to "I have 1 photo": declared-empty rooms beat an empty grid |
| `↑ Level 2` / `YOU` | adjacency relative to the camera; the reader has a marker in the world | `YOU` becomes "viewing: Workbench" — free orientation, no compass |
| `Men's and women's toilets · Level 1 · Unit 1 corner` | a **space is `thing · level · spot`**, phrased as a sentence | our item sentence: `photo · room · event, year` — the caption *is* the index entry |
| `−` `+` | a **map affordance** beside a 3D camera → plan and scene share one model | one data model, two lenses (list / room); zoom is the cheap second lens |
| `` `W` `A` `S` `D` walk · `Space` jump · Drag to turn · `E` open `` | legend inside the UI, as `<kbd>`, and **turning is drag, not Pointer Lock** | kills my earlier objection: no pointer lock → **iOS is in scope** |
| separate `Jump` button | **every keyboard verb has a visible touch twin** | our touch twins: `◀ ▶` frame, `⏸` hold, `⤢` enlarge |
| `Settings` | reader-selectable options | our settings = `3D on / off`, remembered; default off if reduced-motion |
| `still experimental. Map details … might be inaccurate.` | **epistemic disclaimer about the data** | ours: `Rooms and captions are being added as records are confirmed.` |
| a bare `0` next to the wordmark (present in one pass, absent in another) | live counter of something in the model | our `n items` per room; state-dependent, so it must be `aria-live` not decorative |

## 4. Steal three, refuse two

**Steal.** (a) The list is the interface; the 3D is a lens bolted on top, and the
reader is *told* that in one sentence. (b) Capability, availability and accuracy
statements live in the UI, not in a README. (c) One visible twin for every
keyboard verb, so a phone is not a degraded desktop.

**Refuse.** (a) **No URL state** — `?level=9` is ignored, so a floor cannot be
shared. On a scholar's site a photograph must be citable: `activities.html#fig-3`,
`#room-classroom` must seat the camera. (b) **No shadow-DOM UI** — a reader
literally cannot see his controls without a rendering pass; our scene stays
selectable, inspectable and indexable, and the caption text stays in the DOM.

## 5. Model: records, not pixels

```
ROOM = { id, label, blurb, status: "open" | "soon", items[] }
ITEM = { id, src, alt, caption, venue, year, faces, at: {x, z}, facing }
```

- `GALLERY` today is `(src, alt, caption)` tuples in `_gen_html.py`; this is that
  tuple grown up, not a new pipeline. `img_dims()` keeps sizes read from the file.
- `status: "soon"` is load-bearing (it is what his `Level G · Coming soon` does):
  **an empty room is shown as an empty room.** That is how the site can ship the
  3D layer while the owner has one photograph — the reference itself ships with
  one record.
- `faces` exists because of §10: a walkable scene makes a background face far more
  discoverable than a cropped thumbnail.
- Room set proposed for an academic year (owner may rename or reject): `Workbench`
  (prototypes, kits) · `Field` (sites, visits) · `Classroom` (teaching, co-build)
  · `Stage` (talks, demos) · `Campus` (shared rooms, corridors). Five rooms ×
  ~2 items reads as a place; nine floors × 1 photo reads as a mistake.

## 6. Interaction spec (every row is testable)

| Verb | Input | Behaviour | Degradation | Acceptance |
|---|---|---|---|---|
| orient | drag anywhere; `←` `→` | yaw ±35°, pitch ±10°, clamped; **no 360° spin, no free-fly** | reduced-motion: angles still follow drag but with no easing; no-JS: static elevation view | ≤ 1 layout read per pointermove (rect cached, as the tilt already does) |
| move | `W` `A` `S` `D`; **tap a wall or floor to walk there** (primary on touch); on-screen pad | fixed eye height in the floor plane; no stairs, no falling | "soon" rooms are not enterable — the tap does nothing and the list entry stays | a tap on `Stage` leaves the camera facing that room's item |
| look-at | `Tab` through items | each item is focusable in DOM order = walking order around the room | focus rings on `--accent` | keyboard-only user can reach every item without dragging |
| select | click/tap a framed item, or `Enter` | the frame **flies to the plate** — reuses the existing named view transition | no `startViewTransition`: plate opens plainly | focus returns to the item that opened it |
| stories | in the plate: 5 s/item auto-advance; segmented bars; tap right ⅔ = next, left ⅓ = prev; **hold = pause**; `Space` = pause; `←` `→` = step | `prefers-reduced-motion`: **auto-advance off by default**, all segments visible, manual only | `aria-live` announces `3 of 7`; `Esc` exits | an open caption never advances while focused; the timer is pausable by exactly one control (WCAG 2.2.2) |
| share | `#fig-3`, `#room-stage`, `?room=classroom` | fragment seats the camera **and** scrolls the list | list view ignores fragments safely | a cold load of `#fig-3` shows that photo enlarged, with or without 3D |
| index | always-present list under the scene | one `<li>` per item: thumb, caption sentence, venue, link | this *is* the no-JS page | the list alone is a complete, printable archive |

**Hard invariant:** the 3D is a second lens, never the only one — the reference's
own fallback sentence is the standard being copied.

## 7. Budgets ("lightweight" as numbers)

- **≤ 25 KB added**, minified, CSS + JS together; **0 runtime fetches**; **0 vendored
  library files**. A candidate that breaks this fails §9 by definition.
- Scale of the site today: `css/site.css` 47.1 KB raw / 10.2 KB gzip; `js/site.js`
  20.5 KB / 6.2 KB. Known references: three.js ~149 KB gzipped whole; OGL ~29 KB
  minzipped, zero deps, MIT.
- The **list paints without waiting for the scene**; the scene mounts after
  (progressive, like `Building your view…` → `Level 1 ready.`).
- 60 fps target on a 2020 mid-range Android; ≤ 1 composited transform write per input
  event; no per-frame `getBoundingClientRect`; page weight incl. photos < 1 MB, so
  **downscaled web variants are part of this feature** (`IMG/` is 5.6 MB now).
- Contrast and colour follow `DESIGN.md`: navy plate, `--muted-navy` /
  `--accent-bright` text, amber as an instrument, never a wash.

## 8. What we keep from what exists

`activities.html` today is contact sheet → morph → navy plate with a depth-angled
snap reel (53 scratch harness checks, detector at 0 findings). That becomes the
**fallback view and the default with the 3D lens off** — it is what `#fig-3` opens,
what keyboard and screen-reader users use, and what a device failing §7 keeps. The
`AGENTS.md` invariants carry over unchanged (links-not-buttons, one
`view-transition-name`, omit-when-empty, sizes-from-file, no WebGL unless the owner
renegotiates the dependency rule).

## 9. Engine question: deferred, with the test it must pass

Walk this ladder, stop at the first rung that covers §6:

1. **Room as a handful of axis-aligned planes with images** → CSS 3D
   (`perspective` + `preserve-3d`, camera = one wrapper transform, the Keith Clark
   trick) wins outright: 0 KB, DOM images stay crisp and selectable, the list is
   already the fallback, nothing to fail on a phone. **Default expectation.**
2. **Need real depth sorting, fog, a lit floor, > ~40 planes** → a minimal WebGL
   library in OGL's class, used as ES modules from one vendored file — which
   requires the owner to **explicitly loosen the no-vendored-files rule first**.
3. **Need glTF, characters, shadows, particles, physics** → three.js, and the
   dependency-free rule is renegotiated in its own PR that edits `AGENTS.md`, not
   smuggled into a gallery PR.

Research to bring back next (deliverables, in this order):
**(a)** bytes *reachable by fragmented imports* per candidate for "framed photos in a
room", not headline sizes; **(b)** 3–5 comparable GitHub projects that put
**photographs** (not buildings) in a walkable space — their input scheme, their
fallback, how images load; **(c)** zero-dependency Stories mechanics (segments,
auto-advance, pause-on-hold, tap zones) to test whether ~120 lines is honest;
**(d)** measured iOS Safari limits on nested `preserve-3d` layers — **measured, not
quoted**, it caps how many walls + floor + frames §6 can have; **(e)** a costed note
on the offline depth-map (2.5D) middle route for owners who want parallax on a
photograph rather than a room.

## 10. Non-goals (so nobody adds them later)

No jump, no avatar, no third-person character, no multiplayer, no chat, no audio, no
analytics, no bought or generated 3D assets, no GLB scan of a campus, no infinite
scroll, no scroll-jacking, no text parallax. **No identifiable student faces in the
3D scene until the owner releases them.** Nothing invented: no venues, no dates, no
room names, no building that our campus does not have.

## 11. Blockers, owned by the owner

1. **≥ 8 photographs** with venue/date captions (§2 shows one record is *viable*,
   not that it is worth building for) + a rights statement for any with students.
2. Yes/no on the room set in §5, or his own labels.
3. Yes/no on the dependency ceiling in §9 — this is the only one that gates the
   engine, and it is a contract change to `AGENTS.md`, not a technical choice.
4. `IMG/*-web.jpg` downscaled variants, or permission to generate them.

## 12. Open point I am not turning into a questionnaire

"IG 限動" is specified in §6 as a **viewer mechanic inside the plate** (segments,
auto-advance, tap zones, hold-pause). If the owner also means the *ephemeral* half of
Stories, that is a content-policy decision that contradicts `DESIGN.md`'s durable
record — say so and I will write the expiring variant as its own spec.

---

# R1 outcomes (owner answered 2026-09-14) and what they change

## 13. Answers, and the branches they close or open

| Owner's answer | Consequence for the spec |
|---|---|
| "這是其中一個空間" + "我就是要各個區塊不同地區" | The unit is **not a room inside Activities** — it is a **district**. `DISTRICT` becomes the first-class record (superseding `ROOM` in §5), and there is a **picker above it**. Each district is entered and walked. `huaxu` therefore gains a second surface class: document pages *and* districts. |
| "cv 站你可以調整或刪掉" | Recorded as: **restructuring the site's shape is pre-approved**; **deletion is not** — publications, the CV-derived copy and the report pages are factual records, so any removal is proposed item by item and confirmed. (Standing rule from `AGENTS.md`: do not invent or discard owner facts.) |
| "所以每個空間可以使用者走路去看嗎?" | Yes — that is §15/§16: walking is the primary verb inside a district; the picker is 2D. |
| "現在東京這邊我建議你可以先 ai 生成封面圖片或是做成裡面可交互的海報" | Authorized. **Generated art is allowed for a district's covers and posters**, labelled honestly as illustration in `alt` (the site already words generated art that way). It stays **art direction, not evidence**: no generated image may assert a fact (no fake venue signage, no fake dates). |
| Q2: "先做占位、真片之後進" + Q5: "還沒有素材" | Build the mechanism on placeholders. Nothing in the site's public copy may imply a Tokyo trip exists until he supplies records. |
| Q4: "我建議是有交互的動畫物品" | Every object gets an **idle animation** and a **click reaction**; the "小游戏" branch is narrowed to *animated objects whose reward is content*, and **no scoring** anywhere. |

## 14. Media policy — the Google Drive question, answered with facts

Short answer: **Drive is the wrong place for a player we control.** Long answer, from the
failure modes people keep hitting:

| Attempt | What actually happens |
|---|---|
| `<video src="https://drive.google.com/uc?export=download&id=…">` | Files over the virus-scan threshold (~25 MB) return an **HTML interstitial instead of bytes**, so the element fails to play; the `confirm=` token changes and is unreliable. |
| `https://drive.google.com/file/d/ID/preview` in an iframe | Plays only in limited contexts; **no `Range` support → seeking is broken**, and access is **quota-limited after a number of views**. |
| `googledrive.com/host/ID` | Dead (Google disabled public host-folder serving). |
| Drive API `?alt=media` | Requires an API key or OAuth, and Google blocks bot-like requests; not a static-site solution. |
| GitHub Pages + Git LFS | **Pages does not serve LFS media**; LFS files are download-only, no inline playback. |
| YouTube / Vimeo embed | Works, but hands the visitor to a third-party player, its consent wall and its tracking — and it contradicts the stance this site already argues about hosted platforms (§ "no third-party custodians" in the owner's own position page). |

Decisions:

1. **Images → the repo, directly.** `IMG/districts/<id>/*`, downscaled web variants,
   `img_dims()` reads the size from the file. No external host, no problem: an `<img>`
   needs no range requests.
2. **Video → the repo while it is small, and the repo's Releases when it is not.**
   Target **10–20 s vertical, 720×1280, ≈1–3 MB per clip**, which is inside every GitHub
   ceiling (25 MB per web upload, 100 MB per CLI push, <1 GB repo recommended, Pages soft
   ceilings 1 GB site / 100 GB per month). Encode:
   `ffmpeg -i in.mov -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 30 -preset veryfast -c:a aac -b:a 64k -movflags +faststart out.mp4`
   — `+faststart` is what makes progressive playback work.
3. If clips exceed that, publish them as **Release assets of the same repo** (served by
   GitHub's CDN, keeps the working tree and clone light, no third party) and reference the
   release URL from the generator.
4. Player attributes, non-negotiable: `muted playsinline loop preload="none" poster="…"`,
   one clip playing at a time, `controls` never removed for keyboard users, and a text
   caption for every clip (a story without a caption is unusable to a screen reader and to
   a muted autoplaying phone).

## 15. District: Tokyo — the layout I am proposing

A lane, not a plaza: narrow, ~14 m long, one axis of travel, so depth reads with few
planes and nothing needs a skybox. `+Z` is "deeper in". Coordinates are `ITEM.at = {x, z}`
in metres, `facing` in degrees, camera at eye height 1.6 m.

```
                       x = -2.4        x = 0 (centre path)      x = +2.4
 z = 14  ┌────────────────────────────────────────────────────────────┐  ← noren (exit → picker)
 z = 11  │  自動販売機 ▓▓ (only amber light)      電柱 + 自転車置場      │
 z = 8   │  掲示板 (3 posters: cover art)         自販機反射 pool       │
 z = 5   │  暖簾 under eave                        地蔵 / 鳥居 小祠      │
 z = 2   │  入口階 / 自動販売機光在牆上的暈          海報牆(真照片掛這)   │
 z = 0   └──────────────────────── 入口 ──────────────────────────────┘
```

Placement reasoning, stated so it can be argued with:

- **One light source, and it is amber.** The vending machine is the district's key light;
  everything else is a navy plate. That is `DESIGN.md`'s "amber is an instrument, never a
  wash", and it is also the wayfinding: walk toward the light.
- **The real photographs go on the wall at z≈2** (the entrance wall, facing the visitor on
  the way in) — not scattered down the lane — so the archive has one honest place, and the
  rest of the lane is *objects* the owner asked me to build.
- **Posters at z≈8** carry the AI-generated covers (§13): three, one per sub-topic, and
  each is an interactive surface, not a texture.
- **The shrine/torii at z≈5 on the right** is the draw-an-omikuji object; its reward is a
  media item, never points.
- **The noren at z≈14 is the exit.** Parting it is the *only* way out, so leaving a
  district is a physical act — the same idea as the reference's `E open`.
- Sightline test used as the layout's acceptance criterion: from the entrance, the visitor
  should be able to name all four interactive objects without moving; if they can't, the
  lane is too deep or too cluttered.

## 16. Object spec (animated, per the owner's Q4)

| Object | Idle | Hover / focus | Click | Reduced motion | No JS | Acceptance |
|---|---|---|---|---|---|---|
| 自動販売機 vending | LED strip flickers 0.2 Hz, compressor hum via a 1 px vertical shimmer | lifts 4 mm, `--accent` outline | coil turns once, a polaroid drops into the tray, the **Stories rail opens** on that item's media | static LED, no shimmer; click opens instantly | it is a link to `#fig-n`, so the media is still reachable | after clicking, `opened` state persists in the URL fragment |
| 掲示板 posters (×3) | paper corners lift 2° in a slow loop | the lifted corner straightens toward the pointer | uncurls to a full panel with its caption card, then the plate | no loop; scale only | the poster is an `<img>` with its caption in the list | panel never covers the walk path |
| 暖簾 noren | cloth sways ±3° | parts slightly | **exits to the district picker** | no sway | a plain link "Leave Tokyo" | exit works from any camera angle |
| 地蔵/小祠 shrine | incense wisp drifts | bell rope highlights | draws an omikuji → reveals **one locked media item** | wisp static; reveal immediate | link to `#locked` list section | the reward is content, verified by the caption text changing |
| 電柱/自転車 utility pole | none | slight tilt | info card: district notes, "no people, no faces in these frames" | same | text card in the list | card never wider than the lane |
| 反射 pool on the floor | subtle gradient shift | — | — | static | — | purely decorative: `aria-hidden`, no tab stop |

Global rules for all objects: **no scoring, no sound unless the visitor turns it on, no
auto-play of video on hover**; the camera never leaves the lane (`x ∈ [-2.4, 2.4]`,
`z ∈ [0, 14]`); every object is reachable by keyboard in walk order (z ascending), because
DOM order *is* walking order.

## 17. What this does to the engine question

The lane is ~6 planes (2 walls, floor, entrance, exit, sky omitted) plus ≤ 8 objects —
well inside what `perspective` + `preserve-3d` handles, and the objects are DOM (so a poster
can hold a real `<img>`, a caption, and a link, which WebGL would have to fake with a texture
and a separate DOM overlay). **§9's rung 1 (CSS 3D) therefore covers the whole district as
laid out above**; the research round is now about whether that stays true on iOS Safari and
at what object count it stops being true — not about whether to import a library today.

# R2 — the owner's third correction (2026-09-15): the page *is* the space, and it is rasterised

> *做出來不如直接3D整個畫面的…我要一堆分裂的3D加上網頁幹嘛?*

Two rejections earlier had me answer with a better webpage. This one is about the model, so the
model changed and three sections above are now superseded:

- **§3's doorway is gone.** `rooms.html` is generated by `shell_page()`: no masthead, no footer, no
  article body, no Enter button. Arriving *is* entering; the CV is one link in the HUD and the noren
  behind you. A space you must be granted entry to is still a webpage with a picture of a place.
- **§9/§17's engine answer moved off `perspective` + `preserve-3d`.** Six gradient planes with DOM
  children looked like a dark rectangle with chips on it, which is the "分裂的3D" being complained
  about. The lane is now one `<canvas>` painted by a hand-written projection: 60 cm wall panels,
  tiled patterns mapped affinely per panel, quads depth-sorted far-to-near, fog, a light pool and
  bulbs as distance functions, a ground shadow under the eye. ~200 lines, no library, no WebGL — so
  §9's rung 2 ("go to WebGL") is *partly* taken without breaking the zero-dependency contract, and
  the remaining gap to that rung is mesh and shader quality, not structure.
- **§16's objects are hit targets now, not painted DOM.** Geometry is authored once (`OBJ_SIZE`,
  `EYE`, `LANE_*`) and handed to the renderer through `data-lane-*`; each object is a `<button>` the
  renderer pins to its projected bounding box, hidden and untabbable when it is behind you. Names
  live in `aria-label` and in the HUD — nothing writes prose into the scene.
- **The list survives as the drawer, not as the controller.** That reversal of `a3dfa9a` stands: the
  district's reading material slides over the space on the site's own paper, ships open in the HTML
  so a visitor without scripting gets a complete written district, and prints as the article.
- **What is still not built, unchanged from §11:** ≥8 frames and ≥1 real clip before lane richness
  (audio, more props, level transitions). `Level G · Coming soon` has its twin in the second district
  card, which says it is not open and does not pretend otherwise.

Measured, not assumed: 75 jsdom assertions pass, including the raster's own invariants (finite
numbers only on the context, clip state balanced, textures drawn, `−`/`+` changing focal length
without resizing the canvas, controls leaving the tab order when unoccludable). Nothing here has been
*seen*: this sandbox has no browser, so how the alley reads — and whether it holds 60 fps on a phone
— remains the owner's to judge. The first build of the raster reached him as too dark to make out, which is
what the asserted material luminances and the murk ceiling above now hold in place.

## §18 — The partition, the album, and what "the environment" meant

Three things were settled here, all of them by decision rather than by preference.

**`IMG/` became a registry.** A space may not open without a declared purpose, and a photograph on a
site is a claim in the same sense, so every raster is assigned to a block by rule in `_gen_html.py`
(`IMG_RULES`) and each block carries a kind: `field-notes` (personal; generated plates, labelled as
generated wherever they appear), `classroom` (academic; shown only with a venue and a date, which is
why it hangs nothing today — three files are filed and held, and the count is printed), `figures`
(argument, which stays inline where it is cited), `interface` (mascot and page covers), `portrait`
(the face the site is written in, which is never album material), and `unfiled` (`IMG/3.jpg`, held by
name because the owner asked, with the reason printed instead of the file quietly dropped). A file
that matches no rule and a rule that matches no file both stop the build with a non-zero exit, so the
partition cannot rot as the folder grows. Nine files matched nothing on the first run — that is the
gate working, not a regression.

**The album is emitted on the reading surface.** `.ig-*` was already styled and `#ig-plate` was
already written, but nothing produced the markup: what shipped in its place was a `data-deck` gallery
with **no CSS and no JS at all**, so the arrows, the dots and the lightbox were inert and the design
the owner had approved was invisible. The deck is deleted and the registry feeds the album: one
`[data-ig-wall]` per block, one roll for the page, tiles addressed by index into frames built in the
same pass. `#room-plate` stays the in-space viewer — it has to be operable with your body in the scene
and it carries the segment timeline — so there are two viewers for two surfaces and never two for one.
Per the owner's ruling, this is an album and not a story: nothing expires, nothing is marked seen.

**The lane is furnished, and the furniture is data.** 22 objects, each authored as a solid (width,
height, depth in `OBJ_SIZE`), so props occlude, you can walk behind them, and the hit box wraps the
volume the picture shows. Lighting is data too — `data-walk-lights` and `data-walk-wires` — and the
renderer may not invent a lamp: five bulbs down the ceiling axis, one glow derived from the vending
machine's own position because that is where that light comes from. The `.walk-canvas::after` "film
grain" was deleted: `::after` does not apply to a replaced element, so it had never painted, and the
detector waiver that justified it was removed in the same commit rather than left behind as a rumour.

Honest ledger: the generator half of this round was momentarily lost when the sandbox moved `HEAD`
and a `git checkout -- _gen_html.py` pulled an older copy; it was rebuilt from the shipped page and
proved by regenerating to a byte-identical `rooms.html`. Still unmeasured, as ever, is how any of it
*looks* — there is no browser in this sandbox, and the alley's readability on a phone remains the
owner's call.

## §19 — Tokyo as a compound: the end of the lane is a window

The owner's ask was to furnish the *place*, not the camera: 「這房間你能佈置像是東京的綜合體嗎?像是十
字路口、東京鐵塔、富士山」. The answer is an aperture, not more decals.

**The composition.** The end wall is cut with a 4.70 m × 2.28 m opening at sill height 108 cm. Through
it, from a plaza two and a half metres below the lane's floor: a scramble crossing (nine bands across,
nine along, so the ground reads as somewhere people converge rather than a single zebra), eight block
fronts with lit windows, the tower in three banded sections with two decks and a mast, and Mount Fuji
behind all of it under three bands of sky whose only glow is the horizon — light pollution, which is
what a night sky over a city actually looks like. Overhead inside the lane, four arcade beams give the
ceiling a rhythm, so the alley reads as the side of a building rather than an empty box.

**Why the compound is seen and not entered.** `MAX_D` is 1200 and the wall is at 1247: the window is a
view, not a hole out of the world. One route, and you cannot walk off the edge of it — which is also
what keeps the reach test, the tab order and the focus return working unchanged. Widening the walkable
volume would need a collider that is not a box, and everything in §R2's accessibility story would have
to be re-proven for a sightline.

**Two coordinate systems, and the rule that keeps them apart.** Objects hung from records keep record
centimetres and are multiplied by `Z_SCALE`. The space itself — aperture, beams, and everything past
the wall — is authored in scene centimetres and is *never* scaled, because it is not a record of
anything. They are emitted as three more islands (`data-walk-vista`, `-beams`, `-backdrop`) beside the
lights and the cables, and the renderer's rule stands: it may not invent a position. The far plane is
authored at the scale a *picture* of Tokyo shows rather than 1:1 — a mountain does not fit in a space
12 m long — and the page says so where you would lean on it: the lookout rail's card carries the
sentence, and no invented lettering appears anywhere in the view.

**The bounce is a light source.** The seventh lamp is the city's own light coming in through the window
(`k: 0.55`, `bulb: false`, tint `rgba(146,178,255,0.26)`, r 900): it makes the end of the lane the
brightest part of it, which is what a sightline is for. `bulb: false` also means no glass is drawn and
no pool is thrown on the asphalt, because there is no bulb there.

**Two renderer invariants this taught.** A far plane must be culled by its bounds, not by its corners —
the sky covers the view precisely by being larger than it, so every corner lands off-screen and a corner
test erases the whole backdrop. And depth-sorted painting does the masking for free: the wall pieces
are nearer, so they are painted after, and no clip path, second canvas, or library is involved.

**Found on the way, by the harness rather than by eye:** `fold()` — the pause-the-walk helper — was
defined and never called, and the `on` flag it set was write-free, so the walk carried dead state for
several rounds. Both are gone, with the reason written where `fold()` was: the loop is already driven by
motion, so an open plate costs nothing to animate, and the key guards in the handler cover the overlays.

Still unmeasured, and it is the owner's to judge: whether the alley-plus-compound reads as one place at
a glance, and whether the far plane survives a phone at 60 fps. The numbers say the scene paints (1277
fills, 132 oversized far quads, 21 textures, balanced save/restore, no non-finite value, murk capped at
0.187); nothing here says what it looks like.

## 20. The room itself, dressed (2026-09-16)

The correction that produced this round was not a request for more scenery in the frame: 「我說的是空間
裡面可以幫我佈置類似東京的氣氛嗎?我指的是空間」. A window onto a crossing is a *view* of Tokyo; he had
asked for the space to be dressed as one. So the atmosphere moved from the far plane into the walls, the
ground and the air overhead, and the aperture stayed only as what the room looks out onto.

**What is in the space now.** Twenty wall bands, side by side and stacked to the ceiling: rolling
shutters over closed fronts, glazed tile up to hand height where a front was glazed, painted plaster
above, corrugated patching where a wall has been opened and shut again, a plank hoarding where a
building is being worked on, brick where none of that happened. Seven ground marks: a tactile guide path
along both walls for the lane's whole length, a painted gutter line at the threshold, two grates, one
manhole, one wet patch at the vending end. Four paper lanterns on the wire runs that were already there.
Nine props against those walls — a lit-but-closed front, a telephone box, two bicycles, two planters, a
pair of cones, a post box, a blank folding board, two cloth banners. The room's purpose line says what it
is: *A Tokyo lane, dressed: shutters, lanterns, a crossing at its end.*

**The two coordinate systems bit once already.** A prop's depth is a record centimetre and goes through
`Z_SCALE`; a band, a mark and a lantern hang in the space and are scene centimetres. The first pass
authored the street kit in scene centimetres and put the post box at world 2204 — nearly a kilometre past
the end wall, invisible from anywhere in the lane and unreachable from every station. Every new prop
placed against a band has to convert; the harness asserts the bounds on both kinds so the mistake cannot
come back quietly.

**Cladding is the wall's surface, not a second layer.** Each band is tiled into the same 60 cm panels the
lane already uses, because an affine texture fit is only exact across a patch that narrow, and emitted at
`WALL − 2` so the depth sort always paints it after the base wall instead of leaving the decision to a
tie between two coplanar quads. Where a side's bands tile a panel's whole height, `cladCovers` skips that
panel's own tiling: the wall is not painted under a shutter that already covers it. Any panel left short
of `CEIL` keeps its base tiling, so a half-dressed wall shows plaster behind the shutters rather than the
void — the fallback is deliberate, and it is what makes the coverage assertion worth keeping.

**A textured quad is now one fill, not two.** Every tile in this lane is painted opaque, so the flat
colour that used to go down first was invisible work, and the pattern itself used to be filled over
4096² units and clipped back. A quad's own uv extent covers it exactly. Measured per repaint with the
recorder: 1 560 fills before this round, 3 391 with the dressing naively overlaid, 2 639 after both
fixes — while the number of oversized clipped fills went from 1 554 to 0. That last figure is the one
that matters on a phone, and it is a draw-call count, not a frame time.

**One harness assertion was measuring the wrong thing.** `ctx.huge > 0`, sold as "the far plane is drawn,
and only a bounds test keeps it", had been passing for several rounds because `huge` counted every
pattern overlay's oversized `fillRect` — every textured quad in the lane, not the far plane. It is
replaced by two claims that can actually fail: nothing is projected off the ends of the earth
(`ptsMax < 60000`, which is what the bounds test buys), and no texture covers more than its own quad.
The rule this leaves behind is that a proxy which cannot fail is not an assertion, even when it is green.

**What the honesty cost.** The shutters carry no shop names, the banners carry no text, the folding board
is blank with its reason in the card, and the post box says so too: a name or a menu would be a claim
about a shop that does not exist. The renderer never calls `fillText` at any depth, and the harness
asserts both halves of that — no lettering drawn, no material image loaded. The dressing is drawn from
code, so the lane can be re-clad by editing data and nothing about it depends on a photograph of
somebody's actual street.

Still the owner's to judge, and unmeasured here: whether a lane clad like this reads as Tokyo at a glance
once you are inside it, and what the extra thousand fills per repaint do to a phone. 101 assertions in
`.verify/verify-walk.mjs`, all green, say only what the room is made of. One last thing the data has to
pay for: the wet patch at the vending end is not a texture, it is a *surface* — the renderer looks for
sources inside its extent that are not bulbs and throws them back, so the machine's light is seen in the
ground the way it is seen on the wall. A puddle that reflects nothing is a grey rectangle, and that is
the exact thing this round is not allowed to become.

## 21. The display wears no words (2026-09-16)

「介面上不應該有任何文字,應該要摺疊進按鈕,可以點擊進去看說明」 — nothing on the interface may be text;
whatever has words folds into a button you click to read. Applied to the in-space chrome, and to the
album wall, which was wearing a caption and an index chip on every tile.

**What the head-up display is now.** An icon back to the CV, a ruler of ticks for the stations, four
icon buttons (jump, note, list, and the two view chevrons), and a dot. Every sentence that used to sit
there — the eyebrow line, the status readout, the record line, the key legend, the disclaimer, the
fallback note — is emitted *inside* the card, which is closed until you open it. The card has two modes:
`prop` for what you are standing in front of, `space` for the lane's own note, and the note button's `I`
key is what makes the fold reachable without a mouse.

**Announced is not the same as painted, and dropping the first would be the wrong lesson.** The status
and record lines survive as `.sr-only` live regions (`role="status"`, `aria-live="polite"`): a visitor
who cannot see the lane still hears it. The harness asserts the difference rather than trusting the
class name — it walks every element in `.walk-hud` and fails if any node's *own* text is non-empty, so
a wrapper above a live region does not count and a label painted on a button does.

**The ticks are the lane, not a control strip.** Each one's height is `calc(0.42rem + var(--p, 0) *
0.86rem)` with `--p` emitted from that station's authored depth, so the row reads as the distance you are
walking and the one you are at is simply the bright one. No words, no numbers, and nothing decorative:
the profile is the geography, which is the test a chrome element has to pass on this page.

**Glyphs count.** `−` and `+` for the view controls were replaced by two chevrons from the site's own
icon set, because "no text" that makes an exception for a typographic minus is a rule the next change
will lose. The assertion that fails on a `−` is the reason the rule can be kept.

**What the fold exposed, twice.** `labels` had been scraped out of the station buttons' text content;
with the text folded away, the announced status would have gone quiet, so it reads `aria-label` now.
And a texture's `onload` still reached for `on` — the flag deleted with `fold()` two rounds ago — which
no test had caught because the harness's stub `Image` fired its load handler synchronously during
construction, before `boot()` ever attached one. A load that lands late is the only case that matters,
so the stub now defers by a macrotask and records the error: reintroducing `on` turns the suite red
(114/115), which is the check that the fix is real.

Still the owner's to judge: whether four icons and a dot are discoverable enough without a legend on
screen. What is measured here is that the display contains no text — 115 assertions, all green,
including that every tile on the album wall is a bare photograph whose claims are read inside the plate.

## 22. Things that answer (2026-09-16)

*Asked: 「你這個3D空間可以在做好看一點嗎?我說的交互物品呢?」 The lane had surfaces to look at and nothing that
answered. Reading a wall is not interaction, and a caption that appears over it is not either.*

**A state is geometry.** Five props carry `states` in the record — the shutter on `front-a` (three stops:
open, half, shut), the telephone box door, the post box's flap, the notice board turned over, and the
window pane that was added so the right-hand wall had something to pull. Each stop is one authored word:
`shut`, `door`, `flap`, `slide`, `flip` — and the painter reads that number every frame, so the same quad
list that draws the wall draws the difference. `verify-walk.mjs` asserts it from the recorder rather than
from a screenshot: opening the box paints a face colour that no frame in that run had painted before, which
is the only proof available that the state reached the geometry and did not stop in the card.

**The light belongs to the thing.** A stop carries `k` as well, and the prop's own lamp is found by
`of: "<prop id>"`, so pulling a shutter down dims the light that shutter is made of (`L.k = L.k0 * g.k`).
This is the rule that keeps a lit window from becoming decoration: no glow exists in the record that is not
some object's bulb, and the harness fails if a prop glow names a record that has no object.

**Everything that hangs, hangs.** The lanterns carry `swing`, `period`, `phase`; one clock `T`, sampled in
`draw()`, moves the paper, the cord, the glow and its wet reflection together. Four call sites reading one
number is why the reflection stays under the lamp it belongs to — the previous round animated the paper and
left the cord behind, which is what a scene of separately-ticking parts looks like.

**The lane keeps breathing.** An idle pump at 90 ms runs the *tick*, not a bare repaint, and `loop()`
cancels it so exactly one pump is ever live. It was written for the swing, and it caught two things on the
way in: a station clicked while the lane was resting used to glide partway and stop there, and the station
highlight is now asked on every frame instead of only when the reach changes — a prop standing in front of
you used to freeze the rail on a lie. Both are silent bugs of exactly the kind no screenshot shows.

**Tone is authored too.** Four surfaces carry `tone`, folded into `q.lit` where the shading is computed, and
`kerb` is a new pattern — a riser tiled at 2× the wall's 60 cm `SEG`, because a kerb that small would be
more joints than stone. The room costs 2 926 fills in one depth pass against a budget of 3 200.

**Nothing says so in words.** A prop with stops gets a dashed ring while it is in reach; the `say` line for
each stop lives in the card, which is where sentences are allowed. The initial stop is emitted as
`data-state="0"` so what a thing is at is part of the document, not only of memory. 130 assertions, the cost
probe at `{"bad":0,"huge":0}`, the detector `[]`. Still the owner's eyes to judge: whether the swing reads as
wind or as a clock, and whether a dashed ring is discoverable enough to press without being told.

## 23. The room had no door, and the floor was glass (2026-09-16)

*Asked: 「這裡面3D環境交互有點問題。然後我要跳出去也出不去 沒有明顯的出去點」 — and 「你想清楚要不要去調研相關 skills…然後你自己全面都做好」. So the three packs were installed and read, the lane was
evaluated against them, and every finding that could be fixed in code was fixed in code.*

**The installed references, and what each one changed.** `Owl-Listener/designer-skills` (111 SKILL.md
across nine plugins), `julianoczkowski/designer-skills` (the design-process flow: requirements → brief →
IA → tokens → tasks → generation → review), and `anthropics/skills › webapp-testing`. Three of their files
moved this page: `interaction-design/fitts-law` ("target size is the interactive area, not the visual
icon"; 44 px for touch), `visual-critique/critique-affordance` ("elements that are interactive but look
static", "focus rings suppressed with no replacement", and *a control that describes an exit instead of
being one*), and `prototyping-testing/heuristic-evaluation` (severity 4 = "catastrophe, must fix before
release"). `webapp-testing` is the reason the harness grew a sibling: its whole argument is that a page
must be opened, clicked and read for console errors, not only parsed.

**The four findings, in severity order.** (1) *Catastrophe*: pressing the noren — the prop the record
calls `exit`, whose own hint reads "Part it to leave the lane" — opened a card and went nowhere. The
navigation was gated on `classList.contains("room-noren")`, a class deleted with the CSS-3D room two
rounds ago, so the only in-world door was a description of a door. The record now carries `data-leave` and
the renderer obeys the record. (2) *Catastrophe, and invisible to every test ever written here*: the head-up
display is `inset: 0` with `.walk-hud > * { pointer-events: auto }`, and its children are *full-width flex
rows* — so two horizontal bands of glass covered the top and bottom of the viewport, and the lanterns are
high, the shutters and the post box are low. Rows are layout, not targets: they take `pointer-events: none`
and the controls opt back in. (3) *Major*: `E` was the only verb for opening a thing, so on a phone the lane
was inert; a `pointerup` that travelled under 8 px is now a press on whatever the reach has found, and the
same tap puts the plate down again. (4) *Minor*: a prop 30 m down the lane projected to a box of a few
pixels — press boxes now have a 44 px floor, with `--padx/--pady` pulling the *ring* back onto the
silhouette so the drawing is untouched, and `zIndex` follows depth so the nearer object wins where boxes
overlap; the chrome's icon and tick controls got the same treatment through padding, not a bigger glyph.
The exit itself is now the loudest thing in the HUD — an arrow leaving a frame, `min-width: 2.7rem`, warm
edge — and `Esc` unwinds one level (card, then list) before it becomes the door.

**Why the suite could not see any of this, and what was done about it.** jsdom has no layout, no paint
order and no hit-testing; it dispatches a click on the element you name, so a click that a browser would
hand to the overlay above it still opened a card in the test. That is a ceiling on the *kind* of claim a
jsdom harness can make, and it was not closed by writing more assertions — it was closed by admitting a
second tool: `.verify/browser-check.py` (Playwright, written from scratch here rather than as a wrapper
around somebody else's helper, so every claim in it is readable) asserts `elementFromPoint` at each press
box's centre, that no box is under 44 px, that clicking lands, that the corner arrow navigates, and that
the console stays clean. It cannot run in this sandbox: the Chromium CDN resets TLS and `apt` has no
browser (both are recorded failures, not guesses), so **look, hit-testing and frame rate stay the owner's
to verify** — with the command to do it now in the file's docstring. 147 jsdom assertions, cost
`2 926 fills / bad 0 / huge 0`, detector `[]`.

## 24. A story fills the screen, and only one button is a gesture (2026-09-16)

*Asked: 「你現實動態應該要真實全版型 你在看那網頁怎麼做的。還有你可能要注意右鍵左鍵會不會觸發既有的滑鼠? 這會影響手感?」 Both halves were real: the rail was a card that the screen was holding, and every
mouse button was being read as a gesture.*

**The format, copied and not improvised.** Instagram's story canvas is 9:16 (1080×1920) and only that
ratio fills the screen; a square or landscape upload keeps its own proportions and the remainder is filled
with a **blurred copy of the same file**, while the platform's own chrome lives in roughly the top and
bottom 250 px of that canvas. So `#room-plate.is-rail` is now: the panel is the viewport (`100dvh`,
no radius, no shadow, no `pop` — a screen does not scale in), a centred `9/16` column sized
`min(100%, calc((100dvh - 7.5rem) * 9 / 16))`, the photograph `object-fit: contain` inside it (never
cropped to pretend a 1089×1365 file is portrait), the ground `::before` painted from that frame's own
`url()` with `filter: blur(2.6rem) brightness(0.5)` — a leaf, so the WebKit flattening rules that guard
`.room-world` and `.ig-grid` are untouched — and the caption as a scrim band at the bottom of the column.
The panel's own `h2` and hint go visually hidden rather than being deleted: they are the dialog's name
and description, and a second copy of the caption over the photograph is what a card does, not a story.
No new file entered `IMG/`, because the fill is the same bytes the frame already loaded.

**The bar is the clock, so the clock is one number.** `.story-seg i` fills by `transform: scaleX` inside
`@keyframes segfill` whose duration is `var(--rail-hold, 5s)` — the same property the advance timer reads
through `getComputedStyle`, so a bar cannot finish before its frame does — and holding the frame adds
`is-held`, which sets `animation-play-state: paused`: a progress bar that keeps filling while the story is
held is a lie about what is happening. `prefers-reduced-motion` refuses the timer at the source, and the
current bar is simply full. `width` is never animated, because that is a layout transition and the
detector names it.

**Which mouse buttons mean what.** `pointerdown` fires for every button, so a right-drag turned the head
and a middle-drag started the browser's autoscroll widget inside a scene that had just captured the
pointer; worse, a context menu arriving mid-turn left `is-dragging` on the layer, so the cursor kept
grabbing after the button was released. Now the primary button is the only gesture — in the lane's turn,
the thumb-stick, the rail's hold, and the album's pan alike — and `contextmenu` is refused *only while a
turn is in progress*, so "Save image as" still works over a photograph. `auxclick` is blocked for the
middle button alone: blocking the left one would break the tiles, which are links on purpose.

**What stayed a card, and why.** The album's own viewer (`#ig-plate`) is deliberately not full-bleed: it
is a roll — one photograph per screen with a perspective tilt, whose argument is that it reads as an
object you pull sideways rather than a dialog with two buttons on it. A story and a roll are two formats;
the lane's rail is the story. If the album was the one meant, the same shell applies and the reel keeps
its snap. 159 assertions, `[]` from the detector, cost `2 926 fills / bad 0 / huge 0`. Hit-testing,
`dvh` on an iPhone in a real hand, and the look of the blurred ground are still the owner's to judge —
and `.verify/browser-check.py` is where a browser can check them.

