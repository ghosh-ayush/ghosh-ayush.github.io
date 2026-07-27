// Copies the built site from dist/ to the repo root.
//
// GitHub Pages for this repo is configured as "Deploy from a branch" serving the
// master root, so the root has to BE the built site. Source lives alongside it:
//   app/, src/, public/, scripts/  -> source (ignored by Pages, harmless)
//   index.html, assets/, 404.html, ... -> build output, committed and served
//
// Stale hashed bundles are removed first so old assets/index-*.js do not pile up.
import { readdir, stat, mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

// Never let a copy clobber source. Guard rail: if the build ever emits one of
// these at the top level, stop rather than overwrite.
const PROTECTED = new Set([
  'app', 'src', 'public', 'scripts', 'node_modules', '.git', '.github',
  'package.json', 'package-lock.json', 'vite.config.js', 'portfolio-data.json',
  'README.md', '.gitignore', 'dist',
]);

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

if (!(await exists(DIST))) {
  throw new Error('dist/ not found - run `vite build` first');
}

// 1. Drop previous hashed bundles at the root so they do not accumulate.
const rootAssets = path.join(ROOT, 'assets');
if (await exists(rootAssets)) {
  for (const f of await readdir(rootAssets)) {
    if (/^index-.*\.(js|css)$/.test(f)) {
      await rm(path.join(rootAssets, f));
    }
  }
}

// 2. Recursively copy dist/ over the root.
let copied = 0;

async function copyDir(from, to, depth = 0) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);

    if (depth === 0 && PROTECTED.has(entry.name)) {
      throw new Error(`refusing to overwrite source path "${entry.name}" from dist/`);
    }

    if (entry.isDirectory()) {
      await copyDir(src, dest, depth + 1);
    } else {
      await copyFile(src, dest);
      copied++;
    }
  }
}

await copyDir(DIST, ROOT);

console.log(`[publish] copied ${copied} files from dist/ to the repo root`);
console.log('[publish] commit the root files to deploy (Pages serves master root)');
