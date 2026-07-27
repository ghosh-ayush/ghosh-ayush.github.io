// Resizes and re-encodes everything in public/assets/images, keeping whichever
// of WebP / the original encoding is smaller (flat-colour logos often stay
// smaller as PNG). Run after dropping a new logo or screenshot in.
//
//   npm run optimize:images
//
// Images are capped at ~2x their largest on-screen size:
//   logo belt 140x48 | timeline logo 80x80 | project card ~373x220 | headshot 180x180
import sharp from 'sharp';
import { readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = 'public/assets/images';

const PROFILES = {
  logo: { width: 320, height: 320, fit: 'inside', quality: 88 },
  project: { width: 800, height: 480, fit: 'inside', quality: 88 },
  headshot: { width: 400, height: 400, fit: 'cover', quality: 82 },
};

// Anything not listed is treated as a logo.
const KIND = {
  'headshot.webp': 'headshot',
  'awd.webp': 'project',
  'loyalty.webp': 'project',
};

// Generated separately by scripts/make-og-card.mjs at its exact required size.
const SKIP = new Set(['og-card.png']);

const files = (await readdir(DIR)).filter(
  (f) => /\.(png|jpe?g|webp)$/i.test(f) && !SKIP.has(f)
);

let before = 0;
let after = 0;

for (const file of files) {
  const src = path.join(DIR, file);
  const origSize = (await stat(src)).size;
  before += origSize;

  const profile = PROFILES[KIND[file] ?? 'logo'];
  const meta = await sharp(src).metadata();

  const webp = await sharp(src)
    .resize({
      width: Math.min(profile.width, meta.width),
      height: Math.min(profile.height, meta.height),
      fit: profile.fit,
      withoutEnlargement: true,
    })
    .webp({ quality: profile.quality, effort: 6 })
    .toBuffer();

  const isWebp = /\.webp$/i.test(file);

  if (webp.length < origSize) {
    const out = file.replace(/\.(png|jpe?g|webp)$/i, '.webp');
    await writeFile(path.join(DIR, out), webp);
    if (!isWebp) await unlink(src);
    after += webp.length;
    const arrow = isWebp ? '' : ` -> ${out}`;
    console.log(`  ${file}${arrow}: ${origSize} -> ${webp.length}`);
  } else {
    after += origSize;
    console.log(`  ${file}: kept original (${origSize} < ${webp.length} as webp)`);
  }
}

console.log(
  `\n${(before / 1e6).toFixed(3)} MB -> ${(after / 1e6).toFixed(3)} MB ` +
    `(${(100 * (1 - after / before)).toFixed(1)}% smaller)`
);
console.log('Remember to update any renamed paths in portfolio-data.json.');
