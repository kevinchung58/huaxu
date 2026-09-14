# SPEC: the Activities space — a walkable, lightweight 3D archive

> status: **proposal. Nothing in this file is built.** Written 2026-09-14 from a
> first-hand read of `https://jalangmbb.tanwanjern.com/` (the reference the owner
> pointed at). Engine selection is deliberately **not** decided here — the owner's
> order is: read the reference, write the spec, *then* research the tech. Section 6
> is the decision procedure the research must run through.
>
> Three of my own earlier claims about this site are corrected in §1.3; read that
> before trusting anything said in a previous session about "WebGL needs Pointer Lock
> so mobile is impossible".

## 1. What the reference actually is

### 1.1 Observed, quoted verbatim

Rendered text of the reference, taken in two separate passes (its UI is inside a
**shadow root**, so what a crawler sees is what a screen reader gets, and it differs
between passes — the scene builds asynchronously):

| String on the page | What it proves about the design |
|---|---|
| `WebGL is unavailable. The spaces list still works.` | A semantic **list of spaces is the product**; the 3D scene is a camera bolted onto it. The fallback sentence is addressed to the *reader*, not to a repo README. |
| `Building your view…` → `Level 1 ready.` (and `Loading.` before that) | Geometry is **assembled on demand, per level**, with a live status line. Not a downloaded scene file. |
| Level chips `9 8 7 6 5 3A 3 2 1 G` | A **level registry with human labels**, non-contiguous, including a mezzanine (`3A`) and a ground (`G`). Not `for i in 0..9`. |
| `↓ Level G · Coming soon` | Per-level **availability state**, published in the UI. Unbuilt parts are announced, not faked. |
| `↑ Level 2` / `YOU` | The camera's position is expressed relative to a **stack**, and the user has a named marker in the world. |
| `Men's and women's toilets · Level 1 · Unit 1 corner` | A space is **data**: `thing · level · spot`. It reads as a sentence because it *is* a record, not a picked pixel. |
| `−` `+` | Zoom is a **map affordance** sitting beside a 3D camera → plan view and scene view share one model. |
| `` `W` `A` `S` `D` walk · `Space` jump · Drag to turn · `E` open `` | The control legend is **in the interface**, rendered as `<kbd>`, and **turning is drag, not Pointer Lock**. |
| a separate `Jump` button | **Every keyboard verb has a touch twin.** That is why a walk-through can work on a phone. |
| `Settings` | Reader-selectable options exist (quality/motion-class, presumably). |
| `Jalan GMBB is still experimental. Map details and information might be inaccurate.` | **Epistemic disclaimer about the data**, not about the code. |
| a bare `0` next to the wordmark | A live counter (spaces in view / nearby / selected). Cheap, honest telemetry of the model. |

### 1.2 Inferred (labelled as inference, because I could not read his source)

- `?level=2` **returns the same Level 1** — no URL state. Combined with the 404 responses
  coming back with `<title>Jalan</title>` and a `# 404 / This page could not be found.`
  body, this reads as a **Next.js app on Vercel** with one client component; `robots`,
  `manifest.webmanifest`, `spaces.json`, `levels.json`, `data/levels.json`,
  `building.json` are all 404 → the building description is **inlined in the bundle and
  generated procedurally**, never fetched as data.
- His public GitHub (`14` repos: React/Next, TypeScript, `playground-gsap`,
  `playground-framer`, `playground-remotion`, `kaboom-lab` "experimental projects exploring
  different technologies", Paper.js) plus no public `jalan`/`gmbb` repo → the source is
  private; the stack is his usual motion-toolkit playground, with a game-engine flavour
  from Kaboom. **Do not cite this as fact about the site's internals.**

### 1.3 Corrections to what I said earlier in this session

1. I claimed a walk needs **Pointer Lock** and therefore fails on iOS. **Wrong**: the
   reference turns by **drag** and gives `Space` a button. Pointer Lock is one way to do
   FPS input, not a requirement. Mobile is in scope.
2. I described it as "a 3D walk-through of a building". More precisely it is a
   **space index with a camera attached** — the list is what survives without WebGL.
3. I said its data was fetched; it is **procedurally built at runtime** (no data file is
   reachable). That changes what "we can't afford the assets" means: the cost is in the
   *record set*, not in model files.

### 1.4 Three things to steal, two to refuse

Steal: **(a)** the flat list is the interface and the 3D is a lens on it; **(b)**
capability and honesty statements ("unavailable… still works", "might be inaccurate",
"Coming soon") live **in the UI**; **(c)** one visible twin for every keyboard verb.

Refuse: **(a)** no URL state — on this site a photograph must be citable
(`activities.html#fig-3`), which is the whole point of an academic page; **(b)** no
shadow-DOM UI — a scholar's site stays inspectable, selectable and indexable.

## 2. The owner's request, restated as constraints

Requested: 跟他差不多，但**輕量的 3D 環境**; a space you **can move inside**; with
**IG 限動** (Stories) in it.

Repo rules that bound any answer (`AGENTS.md`): no framework, no build step, one
`css/site.css` + one `js/site.js` with `?v=` pins, GitHub Pages served from the repo
root, no `node_modules`, nothing fetched at runtime, content only from the owner.

## 3. The model: records, not pixels

One record per *place*, one or more *items* per place:

```
ROOM   = { id, label, blurb, status: "open" | "soon", items[] }
ITEM   = { id, src, alt, caption, venue, year, faces: bool, at: {x, z}, facing }
```

- `GALLERY` today is `(src, alt, caption)` tuples; this superset keeps that shape's
  spirit and `img_dims()` keeps the sizes coming from the file.
- `status: "soon"` is required by §1.1(b): an unbuilt room is *shown* as unbuilt.
- `faces` is required by §7: consent, not decoration.
- **Rooms are not floors.** Our archive holds 4–12 items, not 200 spaces, so a floor
  stack would be an empty building. Proposed room set for an academic year, owner
  decides and may reject the whole idea: `Workbench` (prototypes, kits), `Field`
  (sites, visits), `Classroom` (teaching, co-build sessions), `Stage` (talks, demos),
  `Campus` (shared rooms, corridors, the department). Five rooms × ~2 items each reads
  as a place; nine floors × 1 photo reads as a mistake.

## 4. Interaction spec

Each row is testable; the last column is how it will be checked.

| Verb | Input | Behaviour | Degradation | Acceptance |
|---|---|---|---|---|
| orient | drag anywhere; `←` `→` | yaw ±35°, pitch ±10°, clamped; the room does not spin 360° | no-JS: static elevation view | dragging ≤ 1 layout read per frame (rect cached, as the tilt does now) |
| move | `W` `A` `S` `D`; **tap a wall/floor to walk there** (primary on touch); on-screen thumb pad | move in the floor plane at a fixed eye height, no fall, no stairs | reduced-motion: move becomes instant, no easing | a tap on `Room/Stage` leaves you facing the item in that direction |
| select | click/tap a framed item; `Enter` on a focused item | the frame **flies to the plate** — the existing named view transition is reused, not replaced | no `startViewTransition`: plate opens plainly | focus returns to the item that opened it |
| stories | inside the plate: 5 s/item auto-advance; segmented progress bars; tap right 2⁄3 = next, left 1⁄3 = prev; **hold = pause**; `Space` = pause; `←` `→` = step | `prefers-reduced-motion`: **auto-advance is off by default**, all bars visible, manual stepping | `aria-live` announces `3 of 7`; `Esc` exits | an unattended story cannot advance while focus is inside the caption |
| share | every item and room has a fragment: `activities.html#room-stage`, `#fig-3` | opening a fragment scrolls the list **and** seats the camera | fragments are inert in the list view (still readable) | a fresh load of `#fig-3` shows that photo enlarged, with or without 3D |
| index | the always-present list under the canvas | one `<li>` per item: thumb, caption, venue, link | this is the no-JS page | list alone is a complete, printable archive |

Hard invariant, non-negotiable: **the 3D is a second lens, never the only one.** The
list, the `<figure>`s, the alts and the captions must remain a complete document —
which is exactly what the reference's own fallback sentence promises.

## 5. Budgets (numbers, so "lightweight" means something)

- **Code ceiling: ≤ 25 KB added, minified, in total** (CSS + JS together), **0
  runtime fetches, 0 vendored library files**. If a candidate breaks this, it is not
  the candidate — see §6(3).
- Site today for scale: `css/site.css` 47.1 KB raw / 10.2 KB gzip, `js/site.js` 20.5 KB
  / 6.2 KB. Reference point: three.js is ~149 KB gzipped whole ([bundlephobia via
  Gatsby's perf writeup](https://www.gatsbyjs.com/blog/performance-optimization-for-three-js-web-animations/)),
  [OGL](https://github.com/oframe/ogl) is ~29 KB minzipped.
- **Perf:** the list must paint without waiting for the scene (scene mounts after);
  60 fps on a 2020 mid-range Android; ≤ 1 composited transform update per input event;
  no per-frame `getBoundingClientRect`; total page weight after the feature stays under
  1 MB including photos (the `IMG/` directory is 5.6 MB today, so **downscaled web
  variants are part of the feature**, not a later chore).
- **A11y:** every verb reachable by keyboard; plate keeps `role=dialog` + `aria-modal`
  + ancestor `inert` + focus return (already the site standard); auto-advancing content
  is pausable by a single control (WCAG 2.2.2); no information conveyed by depth alone.
- **Contrast:** the room is a navy plate — `--navy-deep` with `--muted-navy`/
  `--accent-bright` text, per `DESIGN.md`. Amber stays an instrument, never a wash.

## 6. Engine question: deferred, with the test the research must pass

Do not pick by taste. Walk this ladder and stop at the first rung that covers §4:

1. **Can the room be a handful of axis-aligned planes with images on them?** Then CSS 3D
   (`perspective` + `preserve-3d`, camera = one wrapper transform, in the spirit of Keith
   Clark's CSS-3D rooms) wins outright: 0 KB, DOM images stay crisp and selectable, the
   list underneath is *already* the fallback, and it cannot fail on a device.
2. **Need real depth sorting, fog, a floor that receives light, or more than ~40 planes?**
   Then a minimal WebGL library in OGL's class (~29 KB, zero deps, MIT, no build step if
   used as ES modules from a vendored file) — and the owner must explicitly loosen the
   no-vendored-files rule, because that is a repo-contract change, not a technical one.
3. **Need glTF, characters, shadows, particles, or physics?** Then three.js — and the
   spec should stop pretending: at that point the "dependency-free academic site" rule is
   renegotiated in the open, and `AGENTS.md` changes first.

Research deliverable for the next round (what I will bring back):
**(a)** bytes actually reachable by *fragmented* imports of each candidate for a
"framed-photos-in-a-room" scene, not whole-library headline sizes;
**(b)** three to five **comparable GitHub projects that put photographs (not buildings) in
a walkable 2–3D space**, with their input scheme, fallback, and how they load images;
**(c)** zero-dependency implementations of **Stories mechanics** (segmented progress,
auto-advance with pause-on-hold, tap zones) to see whether ~120 lines is honest;
**(d)** what iOS Safari does with each candidate's `preserve-3d` layer nesting (mobile
Safari has long had a reported ceiling on how many nested 3D layers survive before
elements vanish — the number must be **measured, not quoted**, and it directly caps
§4's "walls + floor + frames" count);
**(e)** a costed note on the offline depth-map route (2.5D per photograph) as the middle
option the owner may prefer over a room.

## 7. Non-goals (written so nobody adds them later)

No jump, no avatar, no third-person character, no multiplayer, no chat, no audio, no
analytics, no purchased or generated 3D assets, no GLB scan of the campus, no infinite
scroll, no scroll-jacking, no text parallax. **No identifiable faces of students in the
3D scene until the owner releases them** — a walkable room makes a background face far
more discoverable than a cropped thumbnail, which is a new exposure and needs his call.
Not invented either: venues, dates, room names, or a building that does not exist here.

## 8. Migration from what exists today

`activities.html` today: contact sheet → named-view-transition morph → navy plate with a
depth-angled snap reel (53 checks in the scratch harness, `0` detector findings). That
becomes **the fallback view and the default when the 3D layer is off**, not a throwaway:
the plate is what `#fig-3` opens, what keyboard and screen-reader users get, and what a
device that fails the §5 perf budget keeps. The 3D room is added *on top* as a switchable
lens with its own `Settings`-style toggle, and `AGENTS.md`'s invariants (links-not-buttons,
one `view-transition-name`, omit-when-empty, sizes-from-file, no WebGL unless the owner
renegotiates) carry over unchanged.

## 9. What the owner must supply before any of this is buildable

1. **≥ 8 photographs** per §3 with venue/date captions, plus the **rights** statement for
   any that show students.
2. A yes/no on the **room set** in §3 (or his own labels). The engine question is cheaper
   than this one; an empty building is unbuildable at any byte count.
3. A yes/no on the **dependency ceiling** in §6 — if he wants rung 2 or 3, `AGENTS.md`
   changes first and the PR that changes it should be its own, not smuggled into this one.
4. Downscaled `IMG/*-web.jpg` variants or permission to add them (5.6 MB cannot enter a
   walkable scene as-is).

## 10. Open questions I am *not* asking in a round of questions

`IG 限動` is specified in §4 as a **viewer mechanic inside the plate** (segments,
auto-advance, tap zones, hold-pause), because Stories-as-a-format would put a 24-hour
ephemeral promise on a site whose whole ethic is a durable record — if he meant the
ephemeral part too, that is a content-policy decision, not an interaction one, and it
contradicts `DESIGN.md`; say so and I will write the expiring variant instead.
