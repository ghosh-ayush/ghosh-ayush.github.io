// Renders the React tree to static HTML at build time and injects it into
// dist/index.html, so crawlers and social-link scrapers (which do not execute
// JS) see the real content. The client then hydrates that markup.
import { build } from 'vite';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SSR_OUT = path.join(ROOT, '.ssr-tmp');
const DIST_HTML = path.join(ROOT, 'dist', 'index.html');

console.log('[prerender] building SSR bundle...');
await build({
  logLevel: 'warn',
  build: {
    ssr: path.join(ROOT, 'src', 'entry-server.jsx'),
    outDir: SSR_OUT,
    emptyOutDir: true,
    minify: false,
  },
});

const entry = pathToFileURL(path.join(SSR_OUT, 'entry-server.js')).href;
const { render } = await import(entry);

console.log('[prerender] rendering...');
const appHtml = render();

let html = await readFile(DIST_HTML, 'utf8');

const marker = '<div id="root"></div>';
if (!html.includes(marker)) {
  throw new Error('[prerender] could not find the #root mount point in dist/index.html');
}
html = html.replace(marker, `<div id="root">${appHtml}</div>`);

await writeFile(DIST_HTML, html);
await rm(SSR_OUT, { recursive: true, force: true });

const kb = (Buffer.byteLength(appHtml) / 1024).toFixed(1);
console.log(`[prerender] injected ${kb} kB of static markup into dist/index.html`);
