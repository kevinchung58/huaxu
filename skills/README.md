# Installed agent skills

These skills are tracked with the project so future Agent Mode sessions can load the same workflow.

| Skill | Local file | Upstream/provenance | Use |
|---|---|---|---|
| Karpathy guidelines | `karpathy-guidelines/SKILL.md` | [`multica-ai/andrej-karpathy-skills`](https://github.com/multica-ai/andrej-karpathy-skills), commit `2c606141936f1eeef17fa3043a72095b4765b9c2`; the upstream skill declares MIT. | Think before coding, keep changes simple and surgical, define acceptance evidence. |
| PUA workflow | `pua/SKILL.md` | Adapted from [`tanweai/pua`](https://github.com/tanweai/pua), portable `codex/pua/SKILL.md`, commit `e6e6cd237ad17750d179674bff52f8184abea8fd`; the upstream skill front matter declares MIT. | Persistent, evidence-first debugging, proactive regression review, and closed-loop verification. Rhetorical pressure is intentionally not imported. |
| Real-place builder | `real-place-builder/SKILL.md` | Project-authored from Huaxu's `grounded-scene`, `district-author`, Toronto/Niagara/CN Tower work and the visual-review workflow. | Mandatory environment-build and visual acceptance process. |

The source repositories are references, not runtime dependencies. Use the local tracked files; do not add a package-manager install or a network dependency to this static site.
