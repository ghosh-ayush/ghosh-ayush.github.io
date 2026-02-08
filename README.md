# Ayush Ghosh - AI Product Leader Portfolio

React + Vite portfolio focused on AI product leadership, measurable outcomes, and case-study-driven storytelling.

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

`npm run build` creates `dist/` and copies static runtime assets (`assets/images/`, `documents/`, `portfolio-data.json`, `robots.txt`, `sitemap.xml`) into the build output.

## Project Structure

```text
.
├── index.html              # Vite HTML entry with SEO metadata and GA
├── src/
│   ├── main.jsx            # React app and sections
│   └── styles.css          # Global styles
├── portfolio-data.json     # Content source (experience, projects, case studies, etc.)
├── assets/images/          # Logos and project visuals
├── documents/              # Downloadable files (resume + case studies PDF)
├── robots.txt
├── sitemap.xml
└── site.webmanifest
```

## Content Updates

- Edit `portfolio-data.json` for profile, experience, projects, case studies, and testimonials.
- Update downloadable files in `documents/`.
- Update social preview in `assets/images/social-preview.png`.

## Notable Improvements Implemented

- Migrated from runtime Babel-in-browser setup to Vite source architecture.
- Added PM case-study section with problem/strategy/execution/outcome/tradeoff framing.
- Improved UX for touch + keyboard users by removing hover-only hidden content.
- Added skip-link, focus-visible styles, and semantic `main` landmark.
- Added SEO/technical hygiene (`robots.txt`, `sitemap.xml`, `site.webmanifest`, richer social preview image).
- Reduced one oversized image payload (`hindalco-logo-optimized.png`).
