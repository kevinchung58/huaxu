# Installed agent skills

These skills are tracked with the project so future Agent Mode sessions can load the same workflow.

| Skill | Local file | Upstream/provenance | Use |
|---|---|---|---|
| Karpathy guidelines | `karpathy-guidelines/SKILL.md` | [`multica-ai/andrej-karpathy-skills`](https://github.com/multica-ai/andrej-karpathy-skills), commit `2c606141936f1eeef17fa3043a72095b4765b9c2`; the upstream skill declares MIT. | Think before coding, keep changes simple and surgical, define acceptance evidence. |
| PUA workflow | `pua/SKILL.md` | Adapted from [`tanweai/pua`](https://github.com/tanweai/pua), portable `codex/pua/SKILL.md`, commit `e6e6cd237ad17750d179674bff52f8184abea8fd`; the upstream skill front matter declares MIT. | Persistent, evidence-first debugging, proactive regression review, and closed-loop verification. Rhetorical pressure is intentionally not imported. |
| Real-place builder | `real-place-builder/SKILL.md` | Project-authored from Huaxu's `grounded-scene`, `district-author`, Toronto/Niagara/CN Tower work and the visual-review workflow. | Mandatory environment-build and visual acceptance process. |
| Frame evidence | `frame-evidence/SKILL.md` (with `evals/evals.json`) | Project-authored, round 69k, from three instruments that could not report a miss (`verify-look`, `_view.mjs` v1-v2, `_ray.mjs` units) and the `.verify/_aim.mjs` implementation that replaced them. Built with the Agent Skills creator workflow (intent → draft → evals → baseline vs with-skill). | Arrival, aim, units, refusal: makes a frame and every number taken from it able to be wrong out loud. |
| Scene system | `scene-system/SKILL.md` | Project-authored: the place-to-shipped pipeline as one system (owner's go-word → record → scene → gates). | Route a real-place build start to finish; owns the order the other skills run in. |
| Scene quality loop | `scene-quality-loop/SKILL.md` | Project-authored from the rendered-frame acceptance rounds (54-69). | Evidence-led visual acceptance after any scene, object, stop or camera change. |
| District author | `district-author/SKILL.md` | Project-authored from the Clifton Hill, Nakamise and Moji rounds. | Author a themed walkable district: intake questions, record shape, build rules, its own gate. |
| Grounded scene | `grounded-scene/SKILL.md` | Project-authored from the source-fidelity rounds. | Source-based spatial fidelity: real centimetres, what may and may not be compressed. |
| Lane prop | `lane-prop/SKILL.md` | Project-authored from the prop and light rounds (58-64). | Add or change one object, light, state or stop inside a district record (`SHAPE`/`OBJ_SIGN`). |
| Landmark space | `landmark-space/SKILL.md` | Project-authored from the CN Tower, drawbridge and station rounds. | Make one landmark object into its own walkable space with a real parent prop. |
| Japan place | `japan-place/SKILL.md` | Project-authored from the Tokyo (Nakamise, Hozomon, pagoda) and Moji rounds. | Japanese place vocabulary, real centimetres, night, prohibitions, the sakura-crossing study. |
| Street commons | `street-commons/SKILL.md` | Project-authored from the hub street rounds. | The hub street's layout system, regions, promenades and daylight. |
| Place intake | `place-intake/SKILL.md` | Project-authored from the owner's photograph-led rounds. | Turn supplied photographs into the record of a walkable room. |
| Walk input | `walk-input/SKILL.md` (with `evals/evals.json`) | Project-authored, round 71, from the 25/25 tap audit, the stall that lost its only route, and a turn paid in frames instead of the visitor's own milliseconds; extended in round 72 with the back gesture that left the room and the release that had no frame to land in. | How a press works in a walk room, how the head turns, and how a surface is left again: the bar, `detail === 0`, quiet-versus-dead, the 85 deg/s / 3 deg / 0.065 deg-per-px constants, the `overlayEntered`/`overlayLeft`/`popstate` exit contract, and the probes (`_popup-audit`, `_turnprobe`, `_backprobe`) and gates (`verify-overlay`, `verify-exit`) that measure them. |
| PR handoff | `pr-handoff/SKILL.md` | Project-authored, mandatory before every PR operation. | The PR/TODO contract: `TODO.md` refreshed before every creation or update. |
| Skill authoring | `skill-authoring/SKILL.md` | Project-authored, round 69l, from `skills/` holding fifteen skills while `skills/README.md` registered four. | When a lesson becomes a skill, how to write one, and keeping this register honest. |

The source repositories are references, not runtime dependencies. Use the local tracked files; do not add a package-manager install or a network dependency to this static site.
