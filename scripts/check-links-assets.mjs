import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const DATA_PATH = path.join(ROOT, 'portfolio-data.json');

function isSkippableUrl(url) {
  return (
    !url ||
    url.startsWith('#') ||
    /^https?:\/\//i.test(url) ||
    /^mailto:/i.test(url) ||
    /^tel:/i.test(url) ||
    /^data:/i.test(url) ||
    /^javascript:/i.test(url) ||
    url.startsWith('blob:') ||
    url.startsWith('//')
  );
}

function normalizeUrl(url) {
  return decodeURIComponent(String(url || '').split('#')[0].split('?')[0].trim());
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function resolveWithFallbacks(basePath) {
  if (await fileExists(basePath)) return basePath;

  if (await isDirectory(basePath)) {
    const indexPath = path.join(basePath, 'index.html');
    if (await fileExists(indexPath)) return indexPath;
  }

  if (!path.extname(basePath)) {
    const htmlPath = `${basePath}.html`;
    if (await fileExists(htmlPath)) return htmlPath;
  }

  return null;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function collectAssetPathsFromObject(value, collector) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectAssetPathsFromObject(item, collector));
    return;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectAssetPathsFromObject(item, collector));
    return;
  }

  if (typeof value === 'string' && /^\/assets\//.test(value)) {
    collector.add(value);
  }
}

async function main() {
  const distExists = await fileExists(DIST_DIR);
  if (!distExists) {
    throw new Error('dist directory not found. Run "npm run build" before link checks.');
  }

  const allDistFiles = await walk(DIST_DIR);
  const htmlFiles = allDistFiles.filter((filePath) => filePath.endsWith('.html'));

  const broken = [];
  let checkedLinks = 0;

  for (const htmlFile of htmlFiles) {
    const html = await fs.readFile(htmlFile, 'utf8');
    const matches = [...html.matchAll(/\b(?:href|src)=['"]([^'\"]+)['"]/g)];

    for (const match of matches) {
      const raw = match[1];
      if (isSkippableUrl(raw)) continue;

      const cleaned = normalizeUrl(raw);
      if (!cleaned) continue;

      let candidate;
      if (cleaned.startsWith('/')) {
        candidate = path.join(DIST_DIR, cleaned.slice(1));
      } else {
        candidate = path.resolve(path.dirname(htmlFile), cleaned);
      }

      checkedLinks += 1;
      const resolved = await resolveWithFallbacks(candidate);
      if (!resolved) {
        broken.push({ htmlFile, reference: raw });
      }
    }
  }

  const rawData = await fs.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(rawData);
  const assetPaths = new Set();
  collectAssetPathsFromObject(data, assetPaths);

  const missingAssets = [];

  for (const assetPath of assetPaths) {
    const sourceFile = path.join(ROOT, assetPath.slice(1));
    const distFile = path.join(DIST_DIR, assetPath.slice(1));

    const sourceExists = await fileExists(sourceFile);
    const builtExists = await fileExists(distFile);

    if (!sourceExists || !builtExists) {
      missingAssets.push({
        assetPath,
        sourceExists,
        builtExists
      });
    }
  }

  if (broken.length || missingAssets.length) {
    if (broken.length) {
      console.error(`\nBroken local links/assets detected (${broken.length}):`);
      for (const entry of broken.slice(0, 80)) {
        console.error(`- ${path.relative(ROOT, entry.htmlFile)} -> ${entry.reference}`);
      }
      if (broken.length > 80) {
        console.error(`- ...and ${broken.length - 80} more`);
      }
    }

    if (missingAssets.length) {
      console.error(`\nMissing assets referenced by portfolio-data.json (${missingAssets.length}):`);
      for (const entry of missingAssets) {
        console.error(`- ${entry.assetPath} (source: ${entry.sourceExists ? 'ok' : 'missing'}, dist: ${entry.builtExists ? 'ok' : 'missing'})`);
      }
    }

    process.exitCode = 1;
    return;
  }

  console.log(`Link and asset check passed. Checked ${checkedLinks} local HTML references across ${htmlFiles.length} page(s) and ${assetPaths.size} portfolio assets.`);
}

main().catch((error) => {
  console.error('Failed to run link/asset checks:', error);
  process.exitCode = 1;
});
