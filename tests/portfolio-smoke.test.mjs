import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

async function readText(relPath) {
  return fs.readFile(path.join(ROOT, relPath), 'utf8');
}

test('portfolio data includes core collections', async () => {
  const raw = await readText('portfolio-data.json');
  const data = JSON.parse(raw);

  assert.ok(data.personal?.name, 'Expected personal.name');
  assert.ok(Array.isArray(data.projects), 'Expected projects array');
  assert.ok(Array.isArray(data.caseStudies), 'Expected caseStudies array');
  assert.ok(Array.isArray(data.experience), 'Expected experience array');
  assert.ok(Array.isArray(data.skills?.technical), 'Expected technical skills array');
  assert.ok(Array.isArray(data.skills?.nontechnical), 'Expected nontechnical skills array');

  assert.ok(data.projects.length >= 4, 'Expected at least 4 projects/publications');
  assert.ok(data.caseStudies.length >= 3, 'Expected at least 3 case studies');
});

test('main page source keeps key sections and navigation anchors', async () => {
  const source = await readText('src/main.jsx');
  const requiredSectionIds = ['projects', 'experience', 'education', 'skills', 'contact'];

  for (const id of requiredSectionIds) {
    assert.match(source, new RegExp(`id=["']${id}["']`), `Expected section id="${id}"`);
  }

  const navItems = ['experience', 'projects', 'education', 'skills', 'contact'];
  for (const navId of navItems) {
    assert.match(source, new RegExp(`id: ['"]${navId}['"]`), `Expected nav item "${navId}"`);
  }
});

test('subpage entry HTML files include root mounting node', async () => {
  const entries = ['index.html', 'case-studies.html', 'experience.html', 'credentials.html', 'skills.html'];

  for (const entry of entries) {
    const html = await readText(entry);
    assert.match(html, /<div id="root"><\/div>/, `Expected root mount node in ${entry}`);
    assert.match(html, /<title>/, `Expected title tag in ${entry}`);
  }
});
