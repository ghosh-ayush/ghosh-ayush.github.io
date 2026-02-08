import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const BUDGET_PATH = path.join(ROOT, 'performance-budgets.json');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif']);

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
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

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

async function main() {
  if (!(await fileExists(DIST_DIR))) {
    throw new Error('dist directory not found. Run "npm run build" before budget checks.');
  }
  if (!(await fileExists(BUDGET_PATH))) {
    throw new Error('performance-budgets.json not found.');
  }

  const budgets = JSON.parse(await fs.readFile(BUDGET_PATH, 'utf8'));
  const files = await walk(DIST_DIR);

  const jsFiles = files.filter((file) => file.endsWith('.js'));
  const cssFiles = files.filter((file) => file.endsWith('.css'));
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const imageFiles = files.filter((file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()));

  const fileSizes = new Map();
  for (const file of files) {
    const stat = await fs.stat(file);
    fileSizes.set(file, stat.size);
  }

  const totalJsBytes = sum(jsFiles.map((file) => fileSizes.get(file) || 0));
  const totalCssBytes = sum(cssFiles.map((file) => fileSizes.get(file) || 0));
  const totalHtmlBytes = sum(htmlFiles.map((file) => fileSizes.get(file) || 0));
  const totalImageBytes = sum(imageFiles.map((file) => fileSizes.get(file) || 0));

  const largestJsBytes = Math.max(0, ...jsFiles.map((file) => fileSizes.get(file) || 0));
  const largestImageBytes = Math.max(0, ...imageFiles.map((file) => fileSizes.get(file) || 0));

  const checks = [
    ['Total JS', totalJsBytes, budgets.maxTotalJsBytes],
    ['Largest JS asset', largestJsBytes, budgets.maxLargestJsBytes],
    ['Total CSS', totalCssBytes, budgets.maxTotalCssBytes],
    ['Total HTML', totalHtmlBytes, budgets.maxHtmlBytes],
    ['Largest image', largestImageBytes, budgets.maxLargestImageBytes],
    ['Total images', totalImageBytes, budgets.maxTotalImageBytes]
  ];

  console.log('Performance budget snapshot:');
  for (const [name, measured, budget] of checks) {
    console.log(`- ${name}: ${formatKb(measured)} (budget ${formatKb(budget)})`);
  }

  const failures = checks.filter(([, measured, budget]) => typeof budget === 'number' && measured > budget);
  if (failures.length) {
    console.error('\nPerformance budget failures:');
    for (const [name, measured, budget] of failures) {
      console.error(`- ${name} exceeded budget by ${formatKb(measured - budget)}.`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Performance budgets passed.');
}

main().catch((error) => {
  console.error('Failed to run performance budget checks:', error);
  process.exitCode = 1;
});
