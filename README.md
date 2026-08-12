# Hua-Xu Zhong — Academic Portfolio

Static HTML site. No build step.

Live: https://kevinchung58.github.io/huaxu

## Open locally

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## GitHub Pages

In the repository settings, set Pages to deploy from the branch root (`/`).  
Do **not** run `npm run build` or `gh-pages`. The HTML files at the repo root are the site.

`.nojekyll` is included so GitHub Pages does not process the files.

## Pages

- `index.html` — Home
- `about.html` — About
- `research.html` — Publications, featured papers, projects
- `teaching.html` — Teaching philosophy
- `activities.html` — Gallery and talks
- `service.html` — Reviewing
- `links.html` — Resources (under More)

Shared assets: `css/site.css`, `js/site.js`, `IMG/`.
