---
name: real-place-builder
description: End-to-end workflow for authoring, checking, and finishing a walkable scene of a real place in Huaxu. Use for every new environment, district, landmark room, or substantial scene revision.
---

# Real-place environment builder

This is Huaxu's implementation workflow for turning a real place into an explorable scene. It captures the lessons of the Toronto/Little Canada, CN Tower, Niagara and Japan builds so later environments do not repeat the same failure: a complete-looking renderer branch can still produce an incomplete or unrecognisable object. This skill supplements—not replaces—`grounded-scene` (evidence and fidelity), `district-author` (record and gate), `lane-prop` (individual props), `landmark-space` (parent/child landmarks), `japan-place`, and `street-commons` where applicable.

## 1. Start with the real place and repository contract

Before authoring geometry:

- Read `skills/karpathy-guidelines/SKILL.md`, `skills/pua/SKILL.md`, this file, `skills/grounded-scene/SKILL.md`, and `skills/district-author/SKILL.md`; then read the applicable domain skills and `AGENTS.md`/`SKILLS.md`.
- Confirm the exact place, its parent, and the intended experience. Use the highest available primary sources; record URLs, dates/measurements, and uncertainty in the room record or its research note. Do not invent bearings, objects, scale, history, signage, or personal attendance.
- Make a compact measurement/sightline table before drawing: claim, value, facing, source. Preserve spatial sequence, relative scale, distinctive shape, and real sightlines; only incidental detail may be reduced.
- Preserve product-level structure: Field notes stays Toronto, Tokyo, Fukuoka only. A landmark or deeper space is entered through its real parent object and returns there; it is not a new top-level card or hub destination.

## 2. Turn the evidence into a scene plan

- Define the walkable room, axis, scale, eye height, bounds, floor levels, stop depths, and each stop's facing from the repository's existing metric rules. Do not create a second coordinate system in CSS or a second source of truth.
- For every stop, list what must be in view and what the visitor should recognise. Keep neighboring objects in the correct relative position and do not use staging that contradicts the real place.
- For every main prop, write down its identifying silhouette, material/color bands, scale relationship, orientation, visible faces, and any authentic behavior. A generic box or flat card is not a finished ferry, tower, stadium, waterfall, or market hall merely because the ID has that name.
- A simplified miniature still needs the characteristic shape: e.g. the CN Tower's tapered shaft and distinct pods; the Rogers Centre's stadium bowl and opening roof; Niagara's broad curved crest, falling water and plunge mist; the St. Lawrence hall's brick body and cupola; Lake Ontario's low island forms and a ferry with a hull and cabin. Reduce small detail, not the identity. Keep every claim grounded in the sources and project record.

## 3. Implement through the source of truth

- Edit `_gen_html.py` for records and generated page content; edit `js/site.js` for renderer behavior. Never hand-edit generated `*.html`.
- Every record kind must resolve to a real painter branch (or an explicitly intentional plane). When introducing a new shape, update the shape/tint mapping and the record ID/kind together; check aliases, material patterns, bounds, collision classification, and fallback behavior.
- Check the generated object itself, not only its metadata: a missing branch may silently fall back to a plane; a reusable street planter is not automatically a natural island; a boxy silhouette may contradict the record hint.
- Keep surfaces opaque/legible from the authored viewing directions, and keep model details within the table/plinth. Avoid occlusion between signature objects. Motion should express real behavior, use the shared scene clock, and respect reduced-motion behavior.
- Keep interactions, entrances, return anchors, and album scope intact. A visual repair must not silently alter navigation, collision, accessible controls, or the owner's established child-space contract.

## 4. Build once, then inspect the real rendered scene

The code/test gate is necessary but not sufficient. The visitor sees the renderer output. Use `skills/scene-quality-loop/SKILL.md` as the governing capture/inspection/repair loop and PUA for root-cause diagnosis; the steps below are the local scene-specific minimum, not a replacement for that review.

1. Regenerate with `python3 _gen_html.py`; inspect the diff and confirm generated pages include the expected scene and cache-buster.
2. Use `.verify/browser-shot.mjs` against the generated page (the Canvas2D `lane-shot` harness retired with the painter in round 54). A capture is valid only after the walk has actually reached the station depth. Do not treat a fixed-delay or early-arrival frame as an object review.
3. At **every authored stop**, inspect the standard view. For each major exhibit, also inspect the left, right, and/or close object-facing view; use a perpendicular view when a flat side could hide a missing body. Inspect the returned image files themselves, not just the proof-sheet contact sheet or numeric metrics.
4. Ask of each prop: Is the recognizable whole shape present? Does its depth read? Are its defining parts visible? Does the table support it? Is it obscured, clipped, floating, or mistaken for glass/cardboard? Does it remain legible at normal viewing distance and from a second angle?
5. If any answer fails, fix the renderer/record rather than writing a more confident hint. Regenerate, re-walk and re-open the affected frames. Continue until the visual defect is resolved or document a genuine blocker.

For a wide-angle or side view of an object, drive the harness's own view controls and keep its arrival/depth verification. If a batch cannot return to the entrance, record that separately; do not discard valid object frames or pretend the batch completed.

## 5. Regression and acceptance gate

Run the applicable project gates after all scene edits, in one verification batch:

- Syntax/compile checks and `git diff --check`.
- `python3 _gen_html.py`, then idempotency and served-page/cache-buster checks.
- `.verify/verify-shapes.mjs`, `.verify/verify-geometry.mjs`, `.verify/verify-clash.mjs`, `.verify/verify-objects.mjs`.
- `.verify/verify-walk.mjs`, `.verify/verify-rooms-e2e.cjs`, `.verify/verify-chain.mjs`, `.verify/verify-story.mjs` as applicable.
- Re-run actual browser/lane screenshots after generation; inspect all modified exhibit frames.
- Confirm movement and collision: no wall/prop penetration, no blocked essential route, and no camera behavior that induces discomfort. Confirm controls, reduced-motion behavior, parent-child links, and the exact three-card Field notes allowlist.

A shape-count pass proves only that code knows a kind. Geometry/clash proves only measured bounds. A screenshot is a separate gate, and a verified walk is a separate gate. Report each honestly, including anything not inspected or blocked.

## 6. Record the result

Update `TODO.md` with the observed defect, evidence path, root cause, repair, verification outputs, and any remaining limitation. Keep proof images in the existing ignored `.preview/` workflow; do not add generated image sets or large datasets to Git. Final report names the exact changed files, commands/counts, screenshots inspected, and unresolved items. Do not say "all complete" while a station or important object remains visually unchecked.
