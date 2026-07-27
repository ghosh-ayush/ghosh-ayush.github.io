// Generates the 1200x630 Open Graph card used for link previews on LinkedIn,
// Slack, X, iMessage etc. Social scrapers do not render SVG, so this must be a
// raster image. Re-run with `node scripts/make-og-card.mjs` after editing copy.
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const W = 1200;
const H = 630;

const data = JSON.parse(await readFile('portfolio-data.json', 'utf8'));
const { name, title, headline } = data.personal;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Circular avatar, composited over the gradient below.
const AVATAR = 240;
const avatarMask = Buffer.from(
  `<svg width="${AVATAR}" height="${AVATAR}"><circle cx="${AVATAR / 2}" cy="${AVATAR / 2}" r="${AVATAR / 2}" fill="#fff"/></svg>`
);
const avatar = await sharp('public/assets/images/headshot.webp')
  .resize(AVATAR, AVATAR, { fit: 'cover' })
  .composite([{ input: avatarMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0f2027"/>
      <stop offset="45%"  stop-color="#203a43"/>
      <stop offset="100%" stop-color="#1a2a6c"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#4a90e2"/>
      <stop offset="55%"  stop-color="#9b59b6"/>
      <stop offset="100%" stop-color="#e94b8f"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1120" cy="70"  r="260" fill="#4a90e2" opacity="0.10"/>
  <circle cx="90"   cy="580" r="220" fill="#9b59b6" opacity="0.10"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="url(#accent)"/>

  <text x="440" y="250"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="72" font-weight="700" fill="#ffffff">${esc(name)}</text>

  <text x="440" y="310"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="34" font-weight="600" fill="#6db3ff">${esc(title)}</text>

  <text x="440" y="386"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="28" font-weight="400" fill="rgba(255,255,255,0.78)">${esc(headline)}</text>

  <text x="440" y="452"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="24" font-weight="400" fill="rgba(255,255,255,0.5)">ghosh-ayush.github.io</text>
</svg>
`);

const out = 'public/assets/images/og-card.png';
const png = await sharp(background)
  .composite([{ input: avatar, left: 130, top: 195 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(out, png);
console.log(`wrote ${out} (${W}x${H}, ${(png.length / 1024).toFixed(1)} kB)`);
