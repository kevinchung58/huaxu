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
