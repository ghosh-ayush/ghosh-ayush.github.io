# Ayush Ghosh — Portfolio

Personal portfolio for Ayush Ghosh, AI Product Manager & Software Engineer.
React 18 + Vite, prerendered to static HTML, deployed to GitHub Pages.

Live: <https://ghosh-ayush.github.io>

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173  (hot reload)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload on :5173 |
| `npm run build` | Production bundle into `dist/`, then prerenders the HTML |
| `npm run deploy` | `build`, then copies `dist/` over the repo root (what Pages serves) |
| `npm run preview` | Serves the built `dist/` on :4173 — this is exactly what deploys |
| `npm run optimize:images` | Re-encodes `public/assets/images` (run after adding a logo) |

Always sanity-check with `npm run preview` rather than `npm run dev` before
pushing: only the preview reflects minification and the prerendered markup.

## Project layout

```
app/index.html              SOURCE entry: <head> metadata + #root mount point
index.html                  BUILT output, committed. Do not edit by hand.
portfolio-data.json         All content. Edit this, not the components.
src/
  App.jsx                   The whole application
  main.jsx                  Browser entry (hydrates the prerendered markup)
  entry-server.jsx          Build-time entry used by the prerenderer
  styles.css                Global stylesheet
scripts/
  prerender.mjs             Renders App to static HTML, injects into dist/index.html
  publish-root.mjs          Copies dist/ over the repo root for Pages
  make-og-card.mjs          Regenerates the 1200x630 social preview image
  optimize-images.mjs       Resizes / re-encodes images
public/                     Copied verbatim to the site root
  assets/images/            Logos, headshot, project shots, og-card.png
  documents/resume.pdf      Served by the hero download button
  robots.txt, sitemap.xml, 404.html, favicon.svg
.github/workflows/deploy.yml  Builds and publishes to GitHub Pages on push to master
```

## How it renders

`portfolio-data.json` is imported at build time, not fetched at runtime, so:

- there is no loading spinner and no data round trip;
- the same component tree can be rendered to HTML during the build.

`npm run build` runs Vite, then `scripts/prerender.mjs` renders `PortfolioApp`
with `renderToString` and injects the result into `dist/index.html`. The browser
bundle then calls `hydrateRoot` over that markup. Crawlers and social scrapers
(LinkedIn, Slack, X) see real content without executing JavaScript.

Because of this, **anything used during render must be SSR-safe** — no bare
`window` / `document` / `localStorage` outside `useEffect`. Guard with
`typeof window !== 'undefined'`, or move it into an effect. Responsive layout
should be done in CSS media queries rather than reading `window.innerWidth`
during render, otherwise the server and client markup diverge.

## Editing content

Everything lives in `portfolio-data.json`:

| Key | Notes |
|---|---|
| `personal` | Name, title, `headline` + `summary` (the hero copy), location, email, calendly |
| `social` | Hero and footer icon links |
| `experience` | Timeline entries. `description` accepts inline HTML for `<strong>` labels. |
| `projects` | Omit `image` to get a gradient title tile; omit `link` to hide the CTA. |
| `skills` | `nontechnical` / `technical`, each a list of categories with `items` |
| `education` | `degrees` and `certifications` |
| `testimonials` | LinkedIn recommendations |
| `highlights` | The three cards in the About section |

Changing `personal.name`, `title` or `headline` also changes the OG card — run
`node scripts/make-og-card.mjs` afterwards to regenerate it.

### Adding an image

1. Drop the file in `public/assets/images/`.
2. `npm run optimize:images`.
3. Reference it as `/assets/images/<name>.webp` in `portfolio-data.json`
   (the optimizer prints any renames).

## Deployment

GitHub Pages for this repo is set to **Source = "Deploy from a branch" (master, root)**,
so the repo root *is* the published site. That is why the layout looks unusual:

- `app/index.html` is the source entry Vite builds from
- `index.html` at the root is **build output** and is committed
- `assets/`, `documents/`, `favicon.svg`, `404.html`, `robots.txt`, `sitemap.xml`
  at the root are likewise build output

Pushing to `master` runs `.github/workflows/deploy.yml`, which rebuilds and commits
the refreshed output for you, so editing `portfolio-data.json` and pushing is enough.
To publish by hand instead:

```bash
npm run deploy
git add -A && git commit -m "rebuild" && git push
```

Never hand-edit the root `index.html` — the next build overwrites it. Edit
`app/index.html` (metadata) or `src/App.jsx` (markup).

### Preferred setup, if you ever switch

Committing build output is a workaround for branch-based Pages. If you set
**Settings → Pages → Source = "GitHub Actions"**, you can delete the committed
root output, restore `index.html` as the source entry, drop `app/` and
`publish-root.mjs`, and let the workflow publish `dist/` directly. Cleaner history,
no duplicated assets in git.

## Analytics

Google Analytics 4, ID `G-V4F5XVFQY8`, configured in `app/index.html`. Events
tracked: page view, section views, outbound link clicks, resume download, scroll
depth (25/50/75/90%), and dark-mode toggles.
