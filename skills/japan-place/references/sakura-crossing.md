# The sakura-crossing reference pack

A study note on `https://github.com/Kenton-GMI/sakura-crossing`, read for the Japan rooms. Read at
`de01898` ("initial public release", 2026-07-29), MIT-licensed, 56 096 lines of JavaScript in 49
modules, one shipped music track, no image assets.

It is a **reference, not a dependency** — the same rule as every other pack in `AGENTS.md`. It is
three.js + Vite, and this site ships no library and no build step, so nothing from it can be
vendored even if the licence allowed it. Fetch it to read:

```bash
git clone --depth 1 https://github.com/Kenton-GMI/sakura-crossing.git /tmp/sakura-crossing
```

## What it is

An explorable Japanese suburban neighbourhood — a level crossing, a shopping street, a shrine, a
high school, a lake district, hills with two railway tunnels — built as an actual 3D scene and
rendered to look like a hand-painted animation background. 26 districts, 859 k triangles,
453 colliders, no people anywhere in it, and not one image file in `src/`: every texture, every
sign, every price strip is drawn at runtime with Canvas2D.

That last fact is why it is worth reading at all. This site's lane renderer is also a thing that
paints its own materials in code (128 px tiles, `PATS` in `js/site.js`), so the reference's texture
file — 4 397 lines of JavaScript calling `fillRect` — is a working model of the same discipline at
ten times the resolution.

## What to take

**1. The object vocabulary and its measurements.** `references/japan-vocabulary.md` is built from
it: vending machines at 112 × 195 × 72, a paper lantern at r 16, a torii at 340 × 330, steps at
rise 19 / run 46, a kerb at 13.5, a footway at 155, a carriageway at 630, an alley at 240 and a back
alley at 210, a shopping street 6 m wide. These are a generator's numbers for real objects — better
than a recollection, and they agree with what the site's own records already committed to.

**2. The one-moment rule, applied to Japan.** Its README's own framing: *"a model railway exhibit
has a moment"*. Its crossing is the local one — bells and lamps first, then the booms, then the
train every 35–45 seconds — and its 電動バイク exists because the far corners of the world needed a
reason to be reachable. The transferable part is the structure: a sequence with a beginning
(bells), a middle (booms down) and a payoff (the train), rather than a blinking light at low alpha.

**3. Behavioural motion.** Their ferry berths, stands and gets under way; it does not bounce off
the quay. Their wind lanes and ripple rings on the lake are hubs with inner pivots because
`mesh.position.x` on a baked mesh moves a thing sideways *and down through the surface* after the
planet bake. Ours has the same class of problem and the same answer: sample one frame clock (`T`),
read it everywhere, give an object a state rather than an animation of its own.

**4. Detail that rewards looking, and the check that proves it is there.** Interiors you can see
into; a clock that keeps the hall's own time; a 取出口 that is a hole. And on the verification side,
this is the part most worth stealing: their *flood fill* over the world's colliders, run from the
spawn with the player's own radius, probing a named waypoint list per district, and reporting the
**distance to the nearest reached cell** rather than a boolean — because a boolean says
"unreachable" for anything one grid step off, and half of their first run was that rather than a
blockage. Every earlier bug in that project was local; the ones the fill found were not, and none of
them were visible in a frame. Ours has `.verify/verify-rooms-e2e.cjs` for the same job at our size.

**5. The refusal list, which is nearly identical to ours.** No people anywhere — not as geometry,
not as silhouettes, not on a poster, an ema, a noren or a shop sign — and they breached it twice by
accident (painted passengers in the train windows, a photo studio's window). No brand, no marque,
no badge on any vehicle. No cyberpunk, no neon, no realistic materials. Every one of those is also
this site's rule, which is worth knowing: two independent builds of a Japanese place converged on
the same prohibitions, so they are the medium's rules rather than one project's taste.

## What not to take

**1. Its signage system.** This is the big one, and it is easy to take by accident because the
signage is the most visible craft in the repository: `shopFascia`, `vendHeader`, `vendPrice`,
`crossingSign`, `stationSign`, `shrineName`, `emaTex`, `omikujiTex`, `sanpaiNotice`, `alleyPlate`,
`noParking`, `roadPaint`, `warningPlate` are all Canvas2D text, and its Japanese strings are
**invented on purpose** (青空商店, さくら坂商店街, 桜守神社, ひばり台図書館, ひばり電鉄, …) with the
rule stated explicitly: *"Every Japanese string is invented. No real brands, no real place names."*
That is legitimate art direction for a fictional town. On this site lettering in a scene is
forbidden outright, and a board that could have held a name ships blank with the reason in its
card. Take the *cadence* — the fascia band at a constant height, the vertical strip, the plate at
eye level, the noren's proportions — and never the words. See `japan-place` §5.

**2. Its declared structure.** It is npm, Vite, three.js, ES modules, a `public/` folder, 859 k
triangles at 1.2 M submitted per frame, a half-float render target at 1.5–2×, FXAA, a depth-texture
ink pass, an inverted-hull outline pass. Our lane is one canvas raster with no library, ~16 KB of
JS total, and `AGENTS.md`'s dependency rule is explicit: renegotiating it is its own PR and its own
conversation with the owner. Nothing in this pack justifies that conversation.

**3. The planet.** Its whole world is authored flat and bent onto a 160 m sphere by one projection
layer that runs once, with the railway on the equator so the loop closes exactly, and content far
along the street squeezed by `cos(z/R)` — 0.37 at z = −190, where a 4.4 m car is 1.6 m long. It is
a beautiful piece of engineering and it is *not* our problem: our rooms are boxes, our far ends are
walls or vistas, and we have no horizon to bend. The one transferable idea is the shape of the
solution — one seam, one file, everything else works flat — but we already have that in
`data-lane-*`.

## Where things are, if you go back

| Path | What it holds |
|---|---|
| `src/core/textures.js` (4 397) | every drawn texture: shop fronts, signs, road paint, tactile paving, windows, tile patterns |
| `src/core/palette.js` (422) | `PAL` — the whole colour world: warm off-whites, gray-purple road, teal-leaning greens, pale pinks, four saturated accents reserved for focal objects, ink `0x39324f` |
| `src/core/toon.js` | the quantised ramp and the shadow hue-shift toward violet — the thing that separates "anime cel" from "low-poly 3D" |
| `src/core/post.js` | the screen-space ink: second difference of linearised depth, so it fires on silhouettes and creases but stays flat across a grazing road |
| `src/core/outline.js` | inverted-hull outlines for hero props only (train, crossing gear, vending machines, kei truck) |
| `src/world/vending.js` | the vending machine, its variants, the dispense animation and the 取出口 bug |
| `src/world/shotengai.js` | the shopping street: corridor extents, unit rhythm, lanterns strung overhead |
| `src/world/shrine.js` | alley approach, 11 steps to a 2.09 m terrace, torii, precinct |
| `src/world/railway.js` | gauge, ballast, crossing hardware, catenary, level-crossing gate |
| `src/world/streetprops.js`, `props.js` (1 240 + 2 113) | the eleven residential-lane props and the general kit; the place to look for how a small object is built from joints |
| `src/world/hills.js` (3 285) | the largest module: terrain relief as a *third* surface, and `hillSafety` — 13 263 sample points asserting the range never cuts a road |
| `src/world/lake.js`, `lakeform.js` | water above the datum, depth as a function, `lakeLeakCheck` |
| `NEXT.md` | the handover document: per-round findings, the rules that must not be broken, and its own measurement protocol. Closest thing in that repo to this one's `TODO.md` |
| `CLAUDE.md` / `README.md` | conventions and traps; the README's second half is the 3D-to-2D look explained |

## Why this belongs in the repo's memory

The user pointed at it as *"有關於我們日本的建構"* — it is the same problem, built at scale by someone
else: how to make a Japanese place read as itself when nobody is in it and no sign says anything.
Two rooms here are Japan and more are coming, and the material is otherwise unreachable the moment
the sandbox is wiped. Record what was taken from it next to what it produced, the way the Moji
research sits above the Moji props — and if a fact in it disagrees with a fact in
`references/japan-vocabulary.md`, the one with a number measured on the artefact wins, and the other
gets corrected in place.
