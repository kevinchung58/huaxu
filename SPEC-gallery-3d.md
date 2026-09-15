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

Measured, not assumed: 90 jsdom assertions pass, including the raster's own invariants (finite
numbers only on the context, clip state balanced, textures drawn, `−`/`+` changing focal length
without resizing the canvas, controls leaving the tab order when unoccludable). Nothing here has been
*seen*: this sandbox has no browser, so how the alley reads — and whether it holds 60 fps on a phone
— remains the owner's to judge. The first build of the raster reached him as too dark to make out, which is
what the asserted material luminances and the murk ceiling above now hold in place.
