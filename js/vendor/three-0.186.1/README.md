# Three.js runtime (vendored)

- Package: `three@0.186.1` from <https://registry.npmjs.org/three/-/three-0.186.1.tgz>
- Upstream package license: `LICENSE` (MIT; copyright 2010–2026 Three.js Authors)
- Runtime files: `three.module.js` and its relative import, `three.core.js`, copied from the package's `build/` directory.
- Scope: loaded only by walkable pages whose sourced backdrop record contains `world.prims`. The activity album and its CSS 3D treatment do not load or use this runtime.

The project has no npm runtime install, package manifest, CDN dependency, or build step. Keep the exact upstream version in this directory name and in `js/scene3d.js`; when upgrading, recheck the license, copy the two required upstream build files, update `_asset_ver()` in `_gen_html.py`, regenerate the HTML, and run the walk and Three-specific verification gates.
