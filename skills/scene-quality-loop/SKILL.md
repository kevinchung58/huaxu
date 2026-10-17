---
name: scene-quality-loop
description: Evidence-led visual acceptance for Huaxu's walkable Three.js environments and authored 3D objects. Use after any substantial change to a walkable scene, object, backdrop, stop, camera, or renderer, and before calling the scene visually complete. Pair it with scene-system, real-place-builder, grounded-scene, the relevant domain skill, and PUA.
---

# Scene quality loop

This skill owns the rendered-image review after scene authoring. It complements, rather than replaces:

- `scene-system` for the full place-to-shipped pipeline;
- `real-place-builder` and `grounded-scene` for source fidelity, scale, and the allowed scope;
- the relevant domain skill for records, props, landmarks, streets, or Japanese places;
- `pua` for evidence-led diagnosis, root-cause repair, and honest verification.

The renderer is pinned Three.js 0.186.1 for walkable scenes, with the Canvas2D path retained as the no-WebGL fallback. This workflow does not authorize another dependency, asset service, CDN, renderer migration, or a change to the Activities album's CSS 3D.

## 1. Freeze the authoring pass and identify the claim

Follow `SKILLS.md` §7: finish the planned authoring before the slow visual batch. Regenerate pages with `python3 _gen_html.py`; do not edit generated HTML. Before capture, write down:

- the page and exact scene/object change under review;
- the acceptance claim (for example, “the upper-deck stop shows the curved waterfall crest and basin”);
- the authored stop, expected facing, important object/features, source or record that supports them;
- the active renderer reported by the browser, viewport, and any authored animation state.

Do not create a second coordinate system or an unsupported visual requirement. Unknown dimensions and features stay unknown; see `grounded-scene` and the scene caveat.

## 2. Capture a complete, settled view set

Use the repository's current `.verify/browser-shot.mjs` for actual browser movement and `.verify/lane-shot.mjs` for its renderer-independent route/fallback raster checks. Preserve their arrival checks. A frame is not evidence for a stop until the runtime has reached its authored depth, lateral position, and view. Fixed sleeps, a partially completed glide, or an early timeout are not proof of a movement defect.

For the changed page, capture:

1. the entrance and every authored stop in its intended view;
2. left/right or perpendicular views of each hero prop where a flat face could hide a missing body;
3. a close inspection of every story-critical or compound object, and a look back where the route or return anchor depends on it;
4. special authored views (for example a glass-floor look-down or an upper/lower waterfall deck);
5. the route's far end and its entrance/exit behavior.

If the change affects renderer selection, geometry conversion, materials, or fallback handling, verify both paths: confirm the browser's actual renderer rather than inferring it from a loaded script; run `node bin/verify-three.mjs` for the Three.js geometry contract and the relevant Canvas2D/browser gates for fallback. For motion, observe the actual authored behavior over a meaningful part of its cycle; a sample aligned to its period can falsely look static. Capture mobile only for a changed mobile path or an explicit mobile acceptance claim, and label any untested viewport honestly.

## 3. Read the images, not just the measurements

Open the actual output images. A route/contact sheet helps confirm coverage, but it does not replace full-size inspection of the changed hero object, any suspected defect, and representative frames from the authored stops. Read each required stop frame; do not sign off from luma, colour counts, triangle counts, DOM assertions, or a green shape gate alone.

Inspect at three scales:

- **route/thumbnail:** does the sequence read as one place, with a clear destination and no accidental blank or repeated stop?
- **visitor eye height:** are the route, horizon, major forms, relative scale, depth, and defining silhouette legible without clipping or occlusion?
- **close/object view:** are the object's supported identifying parts, assembly, attachments, contact with its support, and visible sides present rather than a generic box, card, or unsupported mark?

Then check material and lighting hierarchy, accidental flatness, seams, z-fighting, floating/intersecting parts, and whether the HUD or image treatment hides scene content. Compare claims with the cited source; do not treat an illustrative reference as a dimensional survey.

## 4. Record a finding before changing the scene

For each defect, record its page/stop/view and evidence path, what is visibly wrong, severity, the smallest test that distinguishes likely causes, the owning source file, and the re-capture needed. Keep two kinds of proof separate:

- deterministic checks establish navigation, geometry, collision, renderer support, and runtime invariants;
- human visual review establishes recognition, composition, depth, readability, and whether the place matches its evidence.

A test of the first kind cannot certify the second. If a numeric visual threshold exists in this repository, use only its locally calibrated definition and note its limitations. Do not import another project's arbitrary score, minimum, or benchmark as Huaxu's acceptance bar.

## 5. Repair the earliest failed layer and recapture

Choose the highest-impact in-scope finding. Diagnose the cause before editing; follow PUA if two equivalent attempts stop producing new evidence. Repair the earliest failed layer—camera/framing, route and silhouette, scale/structure, material, lighting, then detail. Do not use fog, bloom, glow, darkness, or extra props to conceal an unreadable form or incomplete boundary.

Regenerate and re-capture the affected view plus the sibling angles and stops that share the changed painter, geometry, material, camera, or route. Re-run the relevant deterministic gate after each repair batch. A fixed issue without a fresh image is not a visually verified fix.

## 6. Close out honestly

The visual gate closes only when every required captured stop has been inspected, the scene is recognizable from the views promised by its source-backed contract, the relevant mechanics/fallback gates pass, and no known critical or major in-scope defect is left unexplained. Record exact commands, results, image paths, renderer/backend, approximations, exclusions, and any unverified view in `TODO.md`.

If a view could not be captured or inspected, say so and leave the claim unverified. Keep screenshots and contact sheets under the existing ignored `.preview/` workflow; do not commit generated review images.

For the research behind the selected method and the techniques deliberately not imported, see [references/upstream-practices.md](references/upstream-practices.md).
