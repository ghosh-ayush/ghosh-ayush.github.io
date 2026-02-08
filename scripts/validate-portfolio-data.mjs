import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'portfolio-data.json');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addIssue(bucket, level, message) {
  bucket[level].push(message);
}

function validateString(issues, value, label, { required = true } = {}) {
  if (required && !isNonEmptyString(value)) {
    addIssue(issues, 'errors', `${label} must be a non-empty string.`);
  }
}

function validateUrlLike(issues, value, label, { required = true } = {}) {
  if (!required && !value) return;
  if (!isNonEmptyString(value)) {
    addIssue(issues, 'errors', `${label} must be a non-empty string URL/path.`);
    return;
  }
  const valid = /^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../') || value.startsWith('mailto:') || value.startsWith('tel:');
  if (!valid) {
    addIssue(issues, 'warnings', `${label} does not look like a URL/path: ${value}`);
  }
}

function validateSkillsDomain(issues, domainName, domainValue) {
  if (!Array.isArray(domainValue)) {
    addIssue(issues, 'errors', `skills.${domainName} must be an array.`);
    return;
  }

  domainValue.forEach((category, categoryIndex) => {
    const prefix = `skills.${domainName}[${categoryIndex}]`;
    if (!isObject(category)) {
      addIssue(issues, 'errors', `${prefix} must be an object.`);
      return;
    }

    validateString(issues, category.category, `${prefix}.category`);

    if (!Array.isArray(category.items)) {
      addIssue(issues, 'errors', `${prefix}.items must be an array.`);
      return;
    }

    category.items.forEach((item, itemIndex) => {
      const itemPrefix = `${prefix}.items[${itemIndex}]`;

      if (typeof item === 'string') {
        if (!isNonEmptyString(item)) {
          addIssue(issues, 'errors', `${itemPrefix} string skill must be non-empty.`);
        }
        return;
      }

      if (!isObject(item)) {
        addIssue(issues, 'errors', `${itemPrefix} must be a string or object.`);
        return;
      }

      validateString(issues, item.name, `${itemPrefix}.name`);

      if (item.level !== undefined && item.level !== null) {
        if (typeof item.level !== 'number' || Number.isNaN(item.level)) {
          addIssue(issues, 'errors', `${itemPrefix}.level must be a number between 1 and 10.`);
        } else if (item.level < 1 || item.level > 10) {
          addIssue(issues, 'errors', `${itemPrefix}.level must be between 1 and 10.`);
        }
      }
    });
  });
}

function validateIdCollection(issues, items, label) {
  const seen = new Set();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const id = item?.id;
    if (!isNonEmptyString(id)) {
      addIssue(issues, 'errors', `${label}[${index}].id must be a non-empty string.`);
      continue;
    }
    if (seen.has(id)) {
      addIssue(issues, 'errors', `Duplicate ${label} id detected: "${id}".`);
      continue;
    }
    seen.add(id);
  }
  return seen;
}

function validateImagePath(issues, value, label) {
  if (!value) return;
  if (!isNonEmptyString(value)) {
    addIssue(issues, 'errors', `${label} must be a string path if provided.`);
    return;
  }
  if (!value.startsWith('/assets/images/')) {
    addIssue(issues, 'warnings', `${label} should usually use /assets/images/* (current: ${value}).`);
  }
}

async function main() {
  const issues = { errors: [], warnings: [] };

  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  if (!isObject(data)) {
    throw new Error('portfolio-data.json must contain a JSON object at the root.');
  }

  if (!isObject(data.personal)) {
    addIssue(issues, 'errors', 'personal must be an object.');
  } else {
    validateString(issues, data.personal.name, 'personal.name');
    validateString(issues, data.personal.title, 'personal.title');
    validateString(issues, data.personal.description, 'personal.description');
    validateString(issues, data.personal.subtitle, 'personal.subtitle', { required: false });
    validateString(issues, data.personal.email, 'personal.email', { required: false });
    validateString(issues, data.personal.phone, 'personal.phone', { required: false });
    validateImagePath(issues, data.personal.image, 'personal.image');
  }

  validateString(issues, data.siteUrl, 'siteUrl');

  if (!Array.isArray(data.social)) {
    addIssue(issues, 'errors', 'social must be an array.');
  } else {
    data.social.forEach((item, index) => {
      const prefix = `social[${index}]`;
      if (!isObject(item)) {
        addIssue(issues, 'errors', `${prefix} must be an object.`);
        return;
      }
      validateString(issues, item.name, `${prefix}.name`);
      validateUrlLike(issues, item.url, `${prefix}.url`);
    });
  }

  const projects = Array.isArray(data.projects) ? data.projects : [];
  if (!Array.isArray(data.projects)) {
    addIssue(issues, 'errors', 'projects must be an array.');
  } else {
    data.projects.forEach((project, index) => {
      const prefix = `projects[${index}]`;
      if (!isObject(project)) {
        addIssue(issues, 'errors', `${prefix} must be an object.`);
        return;
      }
      validateString(issues, project.id, `${prefix}.id`);
      validateString(issues, project.title, `${prefix}.title`);
      validateString(issues, project.description, `${prefix}.description`);
      if (!Array.isArray(project.tags)) {
        addIssue(issues, 'warnings', `${prefix}.tags should be an array.`);
      }
      validateUrlLike(issues, project.link, `${prefix}.link`, { required: false });
      validateImagePath(issues, project.image, `${prefix}.image`);
    });
  }

  const caseStudies = Array.isArray(data.caseStudies) ? data.caseStudies : [];
  if (!Array.isArray(data.caseStudies)) {
    addIssue(issues, 'errors', 'caseStudies must be an array.');
  } else {
    data.caseStudies.forEach((study, index) => {
      const prefix = `caseStudies[${index}]`;
      if (!isObject(study)) {
        addIssue(issues, 'errors', `${prefix} must be an object.`);
        return;
      }
      validateString(issues, study.id, `${prefix}.id`);
      validateString(issues, study.title, `${prefix}.title`);
      if (!isNonEmptyString(study.summary) && !isNonEmptyString(study.problem) && !isNonEmptyString(study.description)) {
        addIssue(issues, 'errors', `${prefix} must include at least one of summary/problem/description.`);
      }
      validateImagePath(issues, study.image, `${prefix}.image`);
      if (study.tags !== undefined && !Array.isArray(study.tags)) {
        addIssue(issues, 'warnings', `${prefix}.tags should be an array when present.`);
      }
      if (study.link !== undefined) {
        validateUrlLike(issues, study.link, `${prefix}.link`, { required: false });
      }
    });
  }

  const projectIds = validateIdCollection(issues, projects, 'projects');
  const caseStudyIds = validateIdCollection(issues, caseStudies, 'caseStudies');
  for (const id of caseStudyIds) {
    if (projectIds.has(id)) {
      addIssue(issues, 'errors', `ID collision across projects and caseStudies: "${id}".`);
    }
  }

  if (!Array.isArray(data.experience)) {
    addIssue(issues, 'errors', 'experience must be an array.');
  } else {
    data.experience.forEach((role, index) => {
      const prefix = `experience[${index}]`;
      if (!isObject(role)) {
        addIssue(issues, 'errors', `${prefix} must be an object.`);
        return;
      }
      validateString(issues, role.company, `${prefix}.company`);
      validateString(issues, role.position, `${prefix}.position`);
      validateString(issues, role.startDate, `${prefix}.startDate`, { required: false });
      validateString(issues, role.endDate, `${prefix}.endDate`, { required: false });
      validateImagePath(issues, role.logo, `${prefix}.logo`);
    });
  }

  if (!isObject(data.education)) {
    addIssue(issues, 'errors', 'education must be an object.');
  } else {
    if (!Array.isArray(data.education.degrees)) {
      addIssue(issues, 'errors', 'education.degrees must be an array.');
    } else {
      data.education.degrees.forEach((degree, index) => {
        const prefix = `education.degrees[${index}]`;
        if (!isObject(degree)) {
          addIssue(issues, 'errors', `${prefix} must be an object.`);
          return;
        }
        validateString(issues, degree.degree, `${prefix}.degree`);
        validateString(issues, degree.institution, `${prefix}.institution`);
        validateString(issues, degree.year, `${prefix}.year`, { required: false });
        validateImagePath(issues, degree.logo, `${prefix}.logo`);
      });
    }

    if (data.education.certifications !== undefined && !Array.isArray(data.education.certifications)) {
      addIssue(issues, 'errors', 'education.certifications must be an array when present.');
    }
  }

  if (!isObject(data.skills)) {
    addIssue(issues, 'errors', 'skills must be an object.');
  } else {
    validateSkillsDomain(issues, 'nontechnical', data.skills.nontechnical);
    validateSkillsDomain(issues, 'technical', data.skills.technical);
  }

  if (issues.warnings.length) {
    console.log(`\nValidation warnings (${issues.warnings.length}):`);
    for (const warning of issues.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (issues.errors.length) {
    console.error(`\nValidation errors (${issues.errors.length}):`);
    for (const error of issues.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Portfolio data validation passed with ${issues.warnings.length} warning(s).`);
}

main().catch((error) => {
  console.error('Failed to validate portfolio-data.json:', error);
  process.exitCode = 1;
});
