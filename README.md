# Hua-Xu Zhong

Static academic site. No build step.

Live: https://kevinchung58.github.io/huaxu

## Open locally

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## GitHub Pages

Set Pages to deploy from the branch root (`/`).  
Do not run `npm run build`. The HTML files at the repo root are the site.

## Pages

- `index.html` — Home
- `about.html` — About
- `research.html` — Publications, featured papers, projects
- `teaching.html` — Teaching philosophy
- `activities.html` — Gallery and talks
- `service.html` — Editorial roles and reviewing
- `links.html` — Resources (under More)

Shared assets: `css/site.css`, `js/site.js`, `IMG/`.

To add gallery photographs later, append entries to `GALLERY` in `_gen_html.py` and run `python3 _gen_html.py`.
