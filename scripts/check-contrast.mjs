const PAIRS = [
  // Light theme base
  { name: 'Light text-primary on bg-primary', fg: '#1a1a1a', bg: '#ffffff', min: 4.5 },
  { name: 'Light text-secondary on bg-primary', fg: '#666666', bg: '#ffffff', min: 4.5 },
  { name: 'Light text-tertiary on bg-primary', fg: '#596273', bg: '#ffffff', min: 4.5 },
  { name: 'Light text-secondary on bg-secondary', fg: '#666666', bg: '#f5f5f5', min: 4.5 },
  { name: 'Light text-tertiary on bg-secondary', fg: '#596273', bg: '#f5f5f5', min: 4.5 },

  // Accent/link colors used for text in light mode
  { name: 'Light accent-accessible on white', fg: '#1f4f82', bg: '#ffffff', min: 4.5 },
  { name: 'Light accentDarkBlue on white', fg: '#2c5282', bg: '#ffffff', min: 4.5 },
  { name: 'Light accentBlue on white', fg: '#2f6ca8', bg: '#ffffff', min: 4.5 },
  { name: 'Light accentMediumBlue on white', fg: '#445db9', bg: '#ffffff', min: 4.5 },

  // Dark theme base
  { name: 'Dark text-primary on bg-primary', fg: '#ffffff', bg: '#1a1a1a', min: 4.5 },
  { name: 'Dark text-secondary on bg-primary', fg: '#cccccc', bg: '#1a1a1a', min: 4.5 },
  { name: 'Dark text-tertiary on bg-primary', fg: '#999999', bg: '#1a1a1a', min: 4.5 },
  { name: 'Dark text-secondary on bg-secondary', fg: '#cccccc', bg: '#2d2d2d', min: 4.5 },

  // Dark accent/link colors
  { name: 'Dark accent-accessible on bg-primary', fg: '#9fd2ff', bg: '#1a1a1a', min: 4.5 },
  { name: 'Dark accent-accessible on bg-secondary', fg: '#9fd2ff', bg: '#2d2d2d', min: 4.5 }
];

function normalizeHex(hex) {
  const cleaned = String(hex || '').trim().replace('#', '').toLowerCase();
  if (cleaned.length === 3) {
    return cleaned.split('').map((ch) => ch + ch).join('');
  }
  return cleaned;
}

function srgbToLinear(channel) {
  const value = channel / 255;
  if (value <= 0.03928) return value / 12.92;
  return ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(fg, bg) {
  const fgLum = luminance(fg);
  const bgLum = luminance(bg);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

const failures = [];

console.log('Contrast audit (WCAG AA, normal text):');
for (const pair of PAIRS) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const pass = ratio >= pair.min;
  console.log(`- ${pair.name}: ${ratio.toFixed(2)} (${pass ? 'PASS' : 'FAIL'})`);

  if (!pass) {
    failures.push({ ...pair, ratio });
  }
}

if (failures.length) {
  console.error(`\nContrast check failed (${failures.length} pair(s)).`);
  for (const failure of failures) {
    console.error(`- ${failure.name}: ${failure.ratio.toFixed(2)} < ${failure.min}`);
  }
  process.exitCode = 1;
} else {
  console.log('\nContrast check passed.');
}
