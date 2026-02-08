import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'portfolio-data.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const GENERATED_PREFIXES = ['project-', 'case-study-'];

function stripHtml(input = '') {
  return String(input).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(input = '') {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDescription(input = '', limit = 165) {
  const cleaned = stripHtml(input);
  if (!cleaned) return '';
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text = '') {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'your', 'their', 'have', 'has', 'were', 'was', 'are',
    'but', 'not', 'too', 'very', 'more', 'less', 'when', 'than', 'then', 'while', 'over', 'under', 'about', 'across',
    'product', 'case', 'study', 'project', 'analysis', 'model'
  ]);
  return normalize(text)
    .split(' ')
    .filter((token) => token.length > 2 && !stop.has(token));
}

function similarity(aText, bText) {
  const a = new Set(tokenize(aText));
  const b = new Set(tokenize(bText));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  return shared / new Set([...a, ...b]).size;
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function uniqCaseInsensitive(arr) {
  const seen = new Map();
  for (const value of arr) {
    const cleaned = String(value || '').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) seen.set(key, cleaned);
  }
  return Array.from(seen.values());
}

function fullUrl(siteUrl, pagePath) {
  return `${siteUrl}/${pagePath}`.replace(/([^:]\/)\/+/, '$1');
}

function toListHtml(items, emptyLabel) {
  if (!items || items.length === 0) {
    return `<p class=\"empty-inline\">${escapeHtml(emptyLabel)}</p>`;
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function toLinkListHtml(items, emptyLabel) {
  if (!items || items.length === 0) {
    return `<p class=\"empty-inline\">${escapeHtml(emptyLabel)}</p>`;
  }
  return `<ul>${items.map((item) => `<li><a href=\"${escapeHtml(item.href)}\">${escapeHtml(item.label)}</a></li>`).join('')}</ul>`;
}

function findRelatedCaseStudies(item, allCaseStudies, count = 3) {
  const baseText = [item.title, item.summary, item.problem, item.description, item.metric, ...(item.tags || [])].join(' ');
  return allCaseStudies
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({
      candidate,
      score: similarity(baseText, [candidate.title, candidate.summary, candidate.problem, candidate.metric].join(' '))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ candidate }) => ({
      href: `/case-study-${candidate.id}.html`,
      label: candidate.title
    }));
}

function findRelevantSkills(item, allSkillNames, count = 6) {
  const direct = (item.tags || []).map((tag) => stripHtml(tag));
  const poolText = [
    item.title,
    item.summary,
    item.problem,
    item.description,
    item.tradeoffs,
    ...(item.strategy || []),
    ...(item.execution || []),
    ...(item.outcome || [])
  ].join(' ');
  const normalizedPool = normalize(poolText);

  const matched = allSkillNames.filter((skill) => {
    const normalizedSkill = normalize(skill);
    if (!normalizedSkill) return false;
    if (normalizedSkill.length <= 2) {
      const escaped = normalizedSkill.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      return new RegExp(`\\\\b${escaped}\\\\b`, 'i').test(poolText);
    }
    return normalizedPool.includes(normalizedSkill);
  });

  const combined = uniqCaseInsensitive([...direct, ...matched]).slice(0, count);
  return combined;
}

function findRelatedExperience(item, experience, count = 3) {
  const itemText = normalize([
    item.company,
    item.title,
    item.summary,
    item.problem,
    item.description,
    item.timeline
  ].join(' '));

  const matches = experience
    .map((role) => {
      const label = `${role.position || 'Role'} at ${role.company || 'Company'}`;
      const roleText = normalize([role.company, role.position, role.location, ...(role.description || [])].join(' '));
      const score = similarity(itemText, roleText) + (itemText.includes(normalize(role.company || '')) ? 0.3 : 0);
      return { label, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((entry) => ({ href: '/experience.html', label: entry.label }));

  if (matches.length) return matches;
  return [{ href: '/experience.html', label: 'See complete work experience timeline' }];
}

function normalizePathName(pathName = '') {
  return String(pathName).replace(/^\//, '');
}

function toRootedHref(pathName = '') {
  const normalized = normalizePathName(pathName);
  return normalized ? `/${normalized}` : '/';
}

function buildBreadcrumbSchema(siteUrl, pagePath, pageLabel, parentCrumb) {
  const parentName = parentCrumb?.name || 'Portfolio';
  const parentPathName = normalizePathName(parentCrumb?.pathName || '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: parentName,
        item: fullUrl(siteUrl, parentPathName)
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: pageLabel,
        item: fullUrl(siteUrl, pagePath)
      }
    ]
  };
}

function renderDetailPage({
  siteUrl,
  fileName,
  item,
  typeLabel,
  description,
  parentCrumb,
  heroLabel,
  keyMeta,
  sections,
  relatedCaseStudies,
  relevantSkills,
  relatedExperience,
  artifactLink
}) {
  const canonical = fullUrl(siteUrl, fileName);
  const imageUrl = item.image ? fullUrl(siteUrl, item.image.replace(/^\//, '')) : fullUrl(siteUrl, 'assets/images/social-preview.png');
  const breadcrumbSchema = buildBreadcrumbSchema(siteUrl, fileName, item.title, parentCrumb);
  const parentLabel = parentCrumb?.name || 'Portfolio';
  const parentHref = toRootedHref(parentCrumb?.pathName || '');

  const sectionsHtml = sections
    .map((section) => {
      if (section.type === 'list') {
        return `<section class=\"card\"><h2>${escapeHtml(section.title)}</h2>${toListHtml(section.items, section.emptyLabel || 'Not specified')}</section>`;
      }
      return `<section class=\"card\"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text || section.emptyLabel || 'Not specified')}</p></section>`;
    })
    .join('');

  const relevantSkillsLinks = relevantSkills.map((skill) => ({ href: '/skills.html', label: skill }));

  const artifactBlock = artifactLink
    ? `<a class=\"artifact-link\" href=\"${escapeHtml(artifactLink)}\" target=\"_blank\" rel=\"noopener noreferrer\">Open related artifact ↗</a>`
    : '';

  return `<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />

    <title>${escapeHtml(item.title)} | ${escapeHtml(typeLabel)} | Ayush Ghosh</title>
    <meta name=\"description\" content=\"${escapeHtml(description)}\" />
    <meta name=\"robots\" content=\"index, follow\" />
    <meta name=\"theme-color\" content=\"#4a90e2\" />

    <link rel=\"canonical\" href=\"${escapeHtml(canonical)}\" />
    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" />
    <link rel=\"apple-touch-icon\" href=\"/favicon.svg\" />

    <meta property=\"og:type\" content=\"article\" />
    <meta property=\"og:url\" content=\"${escapeHtml(canonical)}\" />
    <meta property=\"og:title\" content=\"${escapeHtml(item.title)} | ${escapeHtml(typeLabel)}\" />
    <meta property=\"og:description\" content=\"${escapeHtml(description)}\" />
    <meta property=\"og:image\" content=\"${escapeHtml(imageUrl)}\" />

    <meta property=\"twitter:card\" content=\"summary_large_image\" />
    <meta property=\"twitter:url\" content=\"${escapeHtml(canonical)}\" />
    <meta property=\"twitter:title\" content=\"${escapeHtml(item.title)} | ${escapeHtml(typeLabel)}\" />
    <meta property=\"twitter:description\" content=\"${escapeHtml(description)}\" />
    <meta property=\"twitter:image\" content=\"${escapeHtml(imageUrl)}\" />

    <script type=\"application/ld+json\">${JSON.stringify(breadcrumbSchema)}</script>

    <style>
      :root {
        --bg: #f6f8fb;
        --card: #ffffff;
        --text: #1a1a1a;
        --muted: #4a5568;
        --accent: #1f4f82;
        --border: #dfe5ee;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.6;
      }
      .wrap {
        max-width: 1040px;
        margin: 0 auto;
        padding: 1.1rem 1rem 3rem;
      }
      .breadcrumbs {
        font-size: 0.9rem;
        color: var(--muted);
        margin-bottom: 1rem;
      }
      .breadcrumbs a {
        color: var(--accent);
        text-decoration: none;
      }
      .hero {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.1rem;
        box-shadow: 0 8px 24px rgba(22, 41, 66, 0.08);
      }
      .kicker {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.78rem;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        margin: 0.35rem 0 0;
        font-size: clamp(1.6rem, 2.8vw, 2.2rem);
        line-height: 1.28;
      }
      .summary {
        margin-top: 0.55rem;
        color: var(--muted);
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.7rem;
      }
      .pill {
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 0.28rem 0.62rem;
        font-size: 0.8rem;
        color: var(--muted);
        background: #f9fbff;
      }
      .hero img {
        margin-top: 0.8rem;
        width: 100%;
        height: clamp(180px, 38vw, 300px);
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid var(--border);
      }
      .artifact-link {
        display: inline-flex;
        margin-top: 0.8rem;
        text-decoration: none;
        color: var(--accent);
        font-weight: 700;
      }
      .grid {
        display: grid;
        gap: 0.85rem;
        margin-top: 1rem;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 0.85rem 0.95rem;
      }
      .card h2 {
        margin: 0;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent);
      }
      .card p {
        margin: 0.5rem 0 0;
        color: var(--muted);
      }
      .card ul {
        margin: 0.45rem 0 0;
        padding-left: 1rem;
        color: var(--muted);
      }
      .links-grid {
        display: grid;
        gap: 0.85rem;
        margin-top: 1rem;
      }
      .links-grid h2 {
        margin-bottom: 0.35rem;
      }
      .links-grid a {
        color: var(--accent);
        text-decoration: none;
      }
      .empty-inline {
        margin: 0.35rem 0 0;
        color: var(--muted);
      }
      @media (min-width: 860px) {
        .links-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    </style>

    <!-- Google tag (gtag.js) -->
    <script async src=\"https://www.googletagmanager.com/gtag/js?id=G-V4F5XVFQY8\"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-V4F5XVFQY8');
    </script>
  </head>
  <body>
    <main class=\"wrap\">
      <nav class=\"breadcrumbs\" aria-label=\"Breadcrumb\">
        <a href=\"/\">Home</a> / <a href=\"${escapeHtml(parentHref)}\">${escapeHtml(parentLabel)}</a> / <span>${escapeHtml(item.title)}</span>
      </nav>

      <article class=\"hero\">
        <p class=\"kicker\">${escapeHtml(heroLabel)}</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p class=\"summary\">${escapeHtml(description)}</p>
        <div class=\"hero-meta\">${keyMeta.map((meta) => `<span class=\"pill\">${escapeHtml(meta)}</span>`).join('')}</div>
        <img src=\"${escapeHtml(item.image || '/assets/images/social-preview.png')}\" alt=\"${escapeHtml(item.title)} visual for ${escapeHtml(typeLabel.toLowerCase())} details\" loading=\"lazy\" />
        ${artifactBlock}
      </article>

      <section class=\"grid\">
        ${sectionsHtml}
      </section>

      <section class=\"links-grid\" aria-label=\"Internal linking\">
        <section class=\"card\">
          <h2>Related case studies</h2>
          ${toLinkListHtml(relatedCaseStudies, 'More case studies will be linked as they are added.')}
        </section>

        <section class=\"card\">
          <h2>Relevant skills</h2>
          ${toLinkListHtml(relevantSkillsLinks, 'See complete skills map for context.')}
        </section>

        <section class=\"card\">
          <h2>Related experience</h2>
          ${toLinkListHtml(relatedExperience, 'See complete work experience timeline.')}
        </section>
      </section>
    </main>
  </body>
</html>
`;
}

function buildCaseStudySections(study) {
  return [
    {
      title: 'Context',
      text: [study.company, study.timeline].filter(Boolean).join(' | '),
      emptyLabel: 'Context not specified.'
    },
    {
      title: 'Problem',
      text: study.problem,
      emptyLabel: 'Problem statement not specified.'
    },
    {
      title: 'Decision options',
      type: 'list',
      items: study.decisionOptions || [],
      emptyLabel: 'Decision options not specified.'
    },
    {
      title: 'Chosen decision',
      text: study.decisionChosen,
      emptyLabel: 'Chosen decision not specified.'
    },
    {
      title: 'Tradeoff',
      text: study.tradeoffs,
      emptyLabel: 'Tradeoff not specified.'
    },
    {
      title: 'Outcome',
      type: 'list',
      items: study.outcome || [],
      emptyLabel: 'Outcome details not specified.'
    },
    {
      title: 'Metric',
      text: study.metric,
      emptyLabel: 'Metric not specified.'
    },
    {
      title: "What I'd do differently",
      text: study.whatIdDoDifferently || study.nextStep,
      emptyLabel: 'Retrospective improvements not specified.'
    }
  ];
}

function buildProjectSections(project) {
  return [
    {
      title: 'Overview',
      text: project.description,
      emptyLabel: 'Overview not specified.'
    },
    {
      title: 'Key stack',
      type: 'list',
      items: project.tags || [],
      emptyLabel: 'Stack details not specified.'
    },
    {
      title: 'Impact signal',
      text: project.description,
      emptyLabel: 'Impact details not specified.'
    }
  ];
}

async function removeOldGeneratedPages() {
  const files = await fs.readdir(ROOT);
  const generated = files.filter((file) => GENERATED_PREFIXES.some((prefix) => file.startsWith(prefix)) && file.endsWith('.html'));
  await Promise.all(generated.map((file) => fs.unlink(path.join(ROOT, file))));
}

async function writeSitemap({ siteUrl, staticPages, detailPages }) {
  const today = new Date().toISOString().slice(0, 10);
  const all = [...staticPages, ...detailPages];

  const urlNodes = all
    .map(({ pathName, changefreq, priority }) => {
      return `  <url>\n    <loc>${escapeHtml(fullUrl(siteUrl, pathName))}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${urlNodes}\n</urlset>\n`;

  await fs.writeFile(SITEMAP_PATH, sitemap, 'utf8');
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const siteUrl = String(data.siteUrl || 'https://ghosh-ayush.github.io').replace(/\/$/, '');

  const projects = Array.isArray(data.projects) ? data.projects : [];
  const caseStudies = Array.isArray(data.caseStudies) ? data.caseStudies : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const skillNames = uniq(
    ['nontechnical', 'technical']
      .flatMap((domain) => Array.isArray(data.skills?.[domain]) ? data.skills[domain] : [])
      .flatMap((category) => Array.isArray(category.items) ? category.items : [])
      .map((item) => (typeof item === 'string' ? item : item?.name))
      .map((item) => stripHtml(item || ''))
      .filter(Boolean)
  );

  await removeOldGeneratedPages();

  const detailPages = [];

  for (const project of projects) {
    if (!project?.id || !project?.title) continue;

    const pageName = `project-${project.id}.html`;
    const typeLabel = project.title === 'Personalised Loyalty Model' ? 'Publication' : 'Project';
    const description = toDescription(project.description || `${typeLabel} by Ayush Ghosh`);

    const pageHtml = renderDetailPage({
      siteUrl,
      fileName: pageName,
      item: project,
      typeLabel,
      description,
      parentCrumb: { name: 'Projects & Publications', pathName: 'index.html' },
      heroLabel: typeLabel,
      keyMeta: uniq([typeLabel, ...(project.tags || []).slice(0, 3)]),
      sections: buildProjectSections(project),
      relatedCaseStudies: findRelatedCaseStudies(project, caseStudies),
      relevantSkills: findRelevantSkills(project, skillNames),
      relatedExperience: findRelatedExperience(project, experience),
      artifactLink: project.link || null
    });

    await fs.writeFile(path.join(ROOT, pageName), pageHtml, 'utf8');

    detailPages.push({ pathName: pageName, changefreq: 'monthly', priority: '0.74' });
  }

  for (const study of caseStudies) {
    if (!study?.id || !study?.title) continue;

    const pageName = `case-study-${study.id}.html`;
    const description = toDescription(study.summary || study.problem || 'Product case study by Ayush Ghosh');

    const pageHtml = renderDetailPage({
      siteUrl,
      fileName: pageName,
      item: study,
      typeLabel: 'Case Study',
      description,
      parentCrumb: { name: 'Case Studies', pathName: 'case-studies.html' },
      heroLabel: 'Case Study',
      keyMeta: uniq(['Case Study', study.company, study.timeline].filter(Boolean)),
      sections: buildCaseStudySections(study),
      relatedCaseStudies: findRelatedCaseStudies(study, caseStudies),
      relevantSkills: findRelevantSkills(study, skillNames),
      relatedExperience: findRelatedExperience(study, experience),
      artifactLink: study.link || null
    });

    await fs.writeFile(path.join(ROOT, pageName), pageHtml, 'utf8');

    detailPages.push({ pathName: pageName, changefreq: 'monthly', priority: '0.78' });
  }

  const staticPages = [
    { pathName: '', changefreq: 'weekly', priority: '1.0' },
    { pathName: 'case-studies.html', changefreq: 'weekly', priority: '0.92' },
    { pathName: 'experience.html', changefreq: 'monthly', priority: '0.86' },
    { pathName: 'credentials.html', changefreq: 'monthly', priority: '0.8' },
    { pathName: 'skills.html', changefreq: 'weekly', priority: '0.84' }
  ];

  await writeSitemap({ siteUrl, staticPages, detailPages });
}

main().catch((error) => {
  console.error('Failed to generate SEO pages:', error);
  process.exitCode = 1;
});
