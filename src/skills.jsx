import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const DOMAIN_META = {
  nontechnical: {
    label: 'Product Leadership & Strategy',
    short: 'Leadership'
  },
  technical: {
    label: 'Technical Foundation',
    short: 'Technical'
  }
};

const THEME_RULES = [
  {
    id: 'strategy',
    label: 'Strategy',
    color: '#2c5282',
    patterns: [/roadmap/i, /priorit/i, /\bokr/i, /market/i, /product/i, /stakeholder/i, /vision/i]
  },
  {
    id: 'execution',
    label: 'Execution',
    color: '#4a90e2',
    patterns: [/agile/i, /planning/i, /team/i, /documentation/i, /reporting/i, /critical/i, /continuous learning/i, /presentation/i]
  },
  {
    id: 'ai_ml',
    label: 'AI / ML',
    color: '#6f58c9',
    patterns: [/llm/i, /\brag\b/i, /tensorflow/i, /pytorch/i, /keras/i, /scikit/i, /xgboost/i, /langchain/i, /hugging/i, /mlflow/i, /model/i]
  },
  {
    id: 'data',
    label: 'Data Systems',
    color: '#14919b',
    patterns: [/data/i, /\bsql\b/i, /mongodb/i, /analytics/i, /bigquery/i, /spark/i, /hadoop/i, /tableau/i, /powerbi/i, /plotly/i, /matplotlib/i, /seaborn/i, /excel/i]
  },
  {
    id: 'engineering',
    label: 'Engineering',
    color: '#257179',
    patterns: [/python/i, /\bbash\b/i, /\bc#\b/i, /\bjava\b/i, /c\+\+/i, /fastapi/i, /flask/i, /pytest/i, /selenium/i, /docker/i, /kubernetes/i, /ci\/cd/i, /git/i, /postman/i, /html/i, /css/i, /xaml/i, /matlab/i, /\.net/i]
  },
  {
    id: 'cloud',
    label: 'Cloud & Platform',
    color: '#ef5675',
    patterns: [/\baws\b/i, /\bgcp\b/i, /cloud/i, /databricks/i, /ec2/i, /lambda/i, /redshift/i, /s3/i, /dynamodb/i]
  },
  {
    id: 'governance',
    label: 'Governance',
    color: '#ffa600',
    patterns: [/ethic/i, /regulatory/i, /fda/i, /iso/i, /medical/i, /healthcare/i]
  },
  {
    id: 'experimentation',
    label: 'Experimentation',
    color: '#bc5090',
    patterns: [/a\/b/i, /evaluation/i, /user research/i, /root cause/i, /\bkpi/i]
  }
];

const THEME_BY_ID = Object.fromEntries(THEME_RULES.map((theme) => [theme.id, theme]));

function normalizeItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    return items
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSkill(item) {
  if (typeof item === 'string') return { name: item, level: null };
  return {
    name: item?.name || '',
    level: Number.isFinite(item?.level) ? item.level : null
  };
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashNumber(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function unique(array) {
  return Array.from(new Set(array));
}

function intersection(a, b) {
  const bSet = new Set(b);
  return a.filter((item) => bSet.has(item));
}

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function inferThemes(skillName, categories) {
  const text = `${skillName} ${categories.join(' ')}`.toLowerCase();
  const matched = THEME_RULES.filter((theme) => theme.patterns.some((pattern) => pattern.test(text))).map((theme) => theme.id);
  return matched.length ? unique(matched) : ['execution'];
}

function collectSkillNodes(skillsData) {
  const accumulator = new Map();
  const domainKeys = ['nontechnical', 'technical'];

  domainKeys.forEach((domainKey) => {
    const categories = Array.isArray(skillsData?.[domainKey]) ? skillsData[domainKey] : [];

    categories.forEach((category, categoryIndex) => {
      const categoryLabel = category?.category || `${DOMAIN_META[domainKey].label} ${categoryIndex + 1}`;
      const items = normalizeItems(category?.items)
        .map(normalizeSkill)
        .filter((entry) => entry.name);

      items.forEach((skillItem) => {
        const key = normalizeKey(skillItem.name);
        if (!key) return;

        if (!accumulator.has(key)) {
          accumulator.set(key, {
            id: `skill-${key.replace(/\s+/g, '-')}`,
            key,
            label: skillItem.name.trim(),
            domains: new Set(),
            categories: new Set(),
            levels: []
          });
        }

        const current = accumulator.get(key);
        current.domains.add(domainKey);
        current.categories.add(categoryLabel);
        if (skillItem.level !== null) current.levels.push(skillItem.level);
      });
    });
  });

  return Array.from(accumulator.values()).map((entry) => {
    const domains = Array.from(entry.domains);
    const categories = Array.from(entry.categories);
    const themes = inferThemes(entry.label, categories);
    const avgLevel = entry.levels.length
      ? Math.round((entry.levels.reduce((sum, level) => sum + level, 0) / entry.levels.length) * 10) / 10
      : null;
    const primaryTheme = themes[0];

    return {
      id: entry.id,
      label: entry.label,
      key: entry.key,
      domains,
      categories,
      themes,
      primaryTheme,
      level: avgLevel
    };
  });
}

function tokenSimilarity(a, b) {
  const aTokens = new Set(normalizeKey(a).split(' ').filter((token) => token.length > 2));
  const bTokens = new Set(normalizeKey(b).split(' ').filter((token) => token.length > 2));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  const shared = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return shared / union;
}

function edgeScore(nodeA, nodeB) {
  const sharedCategories = intersection(nodeA.categories, nodeB.categories);
  const sharedThemes = intersection(nodeA.themes, nodeB.themes);
  const sharedDomains = intersection(nodeA.domains, nodeB.domains);
  const lexical = tokenSimilarity(nodeA.label, nodeB.label);

  let score = 0;
  if (sharedCategories.length > 0) score += 2.7 + (sharedCategories.length - 1) * 0.7;
  if (sharedThemes.length > 0) score += sharedThemes.length * 1.25;
  if (sharedDomains.length > 0) score += 0.3;
  if (sharedDomains.length === 0 && sharedThemes.length > 0) score += 0.55;
  if (lexical > 0.33) score += 0.55;
  else if (lexical > 0.17) score += 0.25;

  if (nodeA.level !== null && nodeB.level !== null) {
    const diff = Math.abs(nodeA.level - nodeB.level);
    if (diff <= 1.5) score += 0.35;
    if (diff >= 4.5) score -= 0.2;
  }

  if (sharedCategories.length === 0 && sharedThemes.length === 0) score -= 0.4;

  return {
    score,
    sharedCategories,
    sharedThemes,
    sharedDomains
  };
}

function edgePairKey(nodeAId, nodeBId) {
  return nodeAId < nodeBId ? `${nodeAId}|${nodeBId}` : `${nodeBId}|${nodeAId}`;
}

function findConnectedComponents(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  });

  const visited = new Set();
  const components = [];

  nodes.forEach((node) => {
    if (visited.has(node.id)) return;

    const stack = [node.id];
    const component = [];
    visited.add(node.id);

    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      (adjacency.get(current) || []).forEach((neighborId) => {
        if (visited.has(neighborId)) return;
        visited.add(neighborId);
        stack.push(neighborId);
      });
    }

    components.push(component);
  });

  return components;
}

function buildEdges(nodes) {
  const candidates = [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const candidateThreshold = 0.55;

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const sourceNode = nodes[i];
      const targetNode = nodes[j];
      const result = edgeScore(sourceNode, targetNode);
      if (result.score < candidateThreshold) continue;

      const edgeId = `edge-${sourceNode.id}-${targetNode.id}`;
      candidates.push({
        id: edgeId,
        source: sourceNode.id,
        target: targetNode.id,
        weight: Math.round(result.score * 100) / 100,
        sharedCategories: result.sharedCategories,
        sharedThemes: result.sharedThemes,
        crossDomain: result.sharedDomains.length === 0
      });
    }
  }

  const perNode = new Map(nodes.map((node) => [node.id, []]));
  candidates.forEach((edge) => {
    perNode.get(edge.source).push(edge);
    perNode.get(edge.target).push(edge);
  });

  const keep = new Set();
  const maxEdgesPerNode = 10;
  perNode.forEach((edgesForNode) => {
    edgesForNode
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxEdgesPerNode)
      .forEach((edge) => keep.add(edge.id));
  });

  let edges = candidates.filter((edge) => keep.has(edge.id));
  const edgeTouchesNode = (edge, nodeId) => edge.source === nodeId || edge.target === nodeId;
  const existingPairs = new Set(edges.map((edge) => edgePairKey(edge.source, edge.target)));

  const addEdgeIfMissing = (edge) => {
    const pairKey = edgePairKey(edge.source, edge.target);
    if (existingPairs.has(pairKey)) return false;
    existingPairs.add(pairKey);
    edges.push(edge);
    return true;
  };

  const minDegree = 5;
  nodes.forEach((node) => {
    let degree = edges.filter((edge) => edgeTouchesNode(edge, node.id)).length;
    if (degree >= minDegree) return;

    const candidatesForNode = (perNode.get(node.id) || []).slice().sort((a, b) => b.weight - a.weight);
    for (let i = 0; i < candidatesForNode.length && degree < minDegree; i += 1) {
      if (addEdgeIfMissing(candidatesForNode[i])) degree += 1;
    }
  });

  const minCrossThemeLinks = 2;
  nodes.forEach((node) => {
    let crossThemeCount = edges.filter(
      (edge) => edgeTouchesNode(edge, node.id) && (edge.sharedThemes.length === 0 || edge.crossDomain)
    ).length;

    if (crossThemeCount >= minCrossThemeLinks) return;

    const crossThemeCandidates = (perNode.get(node.id) || [])
      .filter((edge) => edge.sharedThemes.length === 0 || edge.crossDomain)
      .sort((a, b) => b.weight - a.weight);

    for (let i = 0; i < crossThemeCandidates.length && crossThemeCount < minCrossThemeLinks; i += 1) {
      if (addEdgeIfMissing(crossThemeCandidates[i])) crossThemeCount += 1;
    }
  });

  const connectedNodeIds = new Set();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    if (connectedNodeIds.has(node.id)) return;
    const fallback = candidates
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .sort((a, b) => b.weight - a.weight)[0];
    if (fallback && addEdgeIfMissing(fallback)) {
      connectedNodeIds.add(fallback.source);
      connectedNodeIds.add(fallback.target);
    }
  });

  let components = findConnectedComponents(nodes, edges);
  const minimumBridgeScore = 0.3;

  while (components.length > 1) {
    let bestBridge = null;

    for (let componentIndex = 0; componentIndex < components.length; componentIndex += 1) {
      const component = components[componentIndex];

      for (let otherIndex = componentIndex + 1; otherIndex < components.length; otherIndex += 1) {
        const otherComponent = components[otherIndex];

        component.forEach((sourceId) => {
          otherComponent.forEach((targetId) => {
            const pairKey = edgePairKey(sourceId, targetId);
            if (existingPairs.has(pairKey)) return;

            const sourceNode = nodeById.get(sourceId);
            const targetNode = nodeById.get(targetId);
            if (!sourceNode || !targetNode) return;

            const result = edgeScore(sourceNode, targetNode);
            if (result.score < minimumBridgeScore) return;

            if (!bestBridge || result.score > bestBridge.score) {
              bestBridge = {
                pairKey,
                sourceId,
                targetId,
                score: result.score,
                sharedCategories: result.sharedCategories,
                sharedThemes: result.sharedThemes,
                crossDomain: result.sharedDomains.length === 0
              };
            }
          });
        });
      }
    }

    if (!bestBridge) {
      const [baseComponent, ...remainingComponents] = components;
      if (!baseComponent || remainingComponents.length === 0) break;

      remainingComponents.forEach((otherComponent) => {
        let fallbackBridge = null;

        baseComponent.forEach((sourceId) => {
          otherComponent.forEach((targetId) => {
            const pairKey = edgePairKey(sourceId, targetId);
            if (existingPairs.has(pairKey)) return;

            const sourceNode = nodeById.get(sourceId);
            const targetNode = nodeById.get(targetId);
            if (!sourceNode || !targetNode) return;

            const result = edgeScore(sourceNode, targetNode);
            if (!fallbackBridge || result.score > fallbackBridge.score) {
              fallbackBridge = {
                pairKey,
                sourceId,
                targetId,
                score: result.score,
                sharedCategories: result.sharedCategories,
                sharedThemes: result.sharedThemes,
                crossDomain: result.sharedDomains.length === 0
              };
            }
          });
        });

        if (fallbackBridge) {
          edges.push({
            id: `bridge-${fallbackBridge.pairKey.replace('|', '-')}`,
            source: fallbackBridge.sourceId,
            target: fallbackBridge.targetId,
            weight: Math.round(Math.max(0.15, fallbackBridge.score) * 100) / 100,
            sharedCategories: fallbackBridge.sharedCategories,
            sharedThemes: fallbackBridge.sharedThemes,
            crossDomain: fallbackBridge.crossDomain,
            bridge: true
          });
          existingPairs.add(fallbackBridge.pairKey);
        }
      });

      components = findConnectedComponents(nodes, edges);
      continue;
    }

    edges.push({
      id: `bridge-${bestBridge.pairKey.replace('|', '-')}`,
      source: bestBridge.sourceId,
      target: bestBridge.targetId,
      weight: Math.round(Math.max(0.15, bestBridge.score) * 100) / 100,
      sharedCategories: bestBridge.sharedCategories,
      sharedThemes: bestBridge.sharedThemes,
      crossDomain: bestBridge.crossDomain,
      bridge: true
    });
    existingPairs.add(bestBridge.pairKey);
    components = findConnectedComponents(nodes, edges);
  }

  return edges;
}

function buildFloatMeta(nodes) {
  const floatMetaById = new Map();

  nodes.forEach((node, index) => {
    const seed = hashNumber(`${node.id}-${index}-float`);
    const phaseA = ((seed % 360) * Math.PI) / 180;
    const phaseB = (((seed >> 3) % 360) * Math.PI) / 180;
    const phaseC = (((seed >> 7) % 360) * Math.PI) / 180;

    floatMetaById.set(node.id, {
      speed: 0.0001 + ((seed % 18) / 18) * 0.00007,
      driftX: 4 + (seed % 6),
      driftY: 3 + ((seed >> 4) % 7),
      depthAmplitude: 0.17 + ((seed >> 8) % 12) / 100,
      phaseA,
      phaseB,
      phaseC
    });
  });

  return floatMetaById;
}

function buildOrbSlots(nodes) {
  const total = nodes.length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const byId = new Map();

  if (total === 0) return byId;
  if (total === 1) {
    byId.set(nodes[0].id, { x: 0, y: 0, z: 1 });
    return byId;
  }

  nodes.forEach((node, index) => {
    const t = (index + 0.5) / total;
    const y = 1 - 2 * t;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * goldenAngle;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    byId.set(node.id, { x, y, z });
  });

  return byId;
}

function buildThemeAnchors(width, height) {
  const anchors = {};
  const visibleThemes = THEME_RULES.map((theme) => theme.id);
  const cx = width / 2;
  const cy = height / 2;
  const orbRadius = Math.min(width, height) * 0.23;

  visibleThemes.forEach((themeId, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / visibleThemes.length;
    anchors[themeId] = {
      x: cx + Math.cos(angle) * orbRadius,
      y: cy + Math.sin(angle) * orbRadius
    };
  });

  return anchors;
}

function initialPosition(node, anchors, width, height, nodeIndex, totalNodes) {
  const thematicAnchors = node.themes.map((themeId) => anchors[themeId]).filter(Boolean);
  const fallbackAngle = (nodeIndex * Math.PI * 2) / Math.max(totalNodes, 1);

  const anchorX = thematicAnchors.length
    ? thematicAnchors.reduce((sum, point) => sum + point.x, 0) / thematicAnchors.length
    : width / 2 + Math.cos(fallbackAngle) * 220;
  const anchorY = thematicAnchors.length
    ? thematicAnchors.reduce((sum, point) => sum + point.y, 0) / thematicAnchors.length
    : height / 2 + Math.sin(fallbackAngle) * 180;

  const jitterSeed = hashNumber(node.id);
  const jitterAngle = ((jitterSeed % 360) * Math.PI) / 180;
  const jitterRadius = 26 + (jitterSeed % 40);

  return {
    x: anchorX + Math.cos(jitterAngle) * jitterRadius,
    y: anchorY + Math.sin(jitterAngle) * jitterRadius,
    vx: 0,
    vy: 0
  };
}

function runLayout(baseNodes, edges, width, height) {
  const anchors = buildThemeAnchors(width, height);
  const nodes = baseNodes.map((node, index) => ({
    ...node,
    ...initialPosition(node, anchors, width, height, index, baseNodes.length)
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeMeta = edges
    .map((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) return null;
      return {
        ...edge,
        sourceNode: source,
        targetNode: target,
        targetLength: Math.max(62, 170 - edge.weight * 20),
        stiffness: 0.013 + Math.min(edge.weight, 5) * 0.0018
      };
    })
    .filter(Boolean);

  const iterations = 330;
  const charge = 7200;
  const widthPadding = 90;
  const heightPadding = 90;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.38;

  for (let step = 0; step < iterations; step += 1) {
    const alpha = 1 - step / iterations;

    for (let i = 0; i < nodes.length; i += 1) {
      const nodeA = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const nodeB = nodes[j];
        let dx = nodeA.x - nodeB.x;
        let dy = nodeA.y - nodeB.y;
        let distSq = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(distSq);
        const force = (charge * alpha) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeB.vx -= fx;
        nodeB.vy -= fy;

        const minDistance = 18;
        if (dist < minDistance) {
          const push = (minDistance - dist) * 0.12;
          const pushX = (dx / dist) * push;
          const pushY = (dy / dist) * push;
          nodeA.vx += pushX;
          nodeA.vy += pushY;
          nodeB.vx -= pushX;
          nodeB.vy -= pushY;
        }
      }
    }

    edgeMeta.forEach((edge) => {
      const dx = edge.targetNode.x - edge.sourceNode.x;
      const dy = edge.targetNode.y - edge.sourceNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const delta = dist - edge.targetLength;
      const spring = delta * edge.stiffness * alpha;
      const fx = (dx / dist) * spring;
      const fy = (dy / dist) * spring;
      edge.sourceNode.vx += fx;
      edge.sourceNode.vy += fy;
      edge.targetNode.vx -= fx;
      edge.targetNode.vy -= fy;
    });

    nodes.forEach((node) => {
      const nodeAnchors = node.themes.map((themeId) => anchors[themeId]).filter(Boolean);
      const anchorX = nodeAnchors.length
        ? nodeAnchors.reduce((sum, point) => sum + point.x, 0) / nodeAnchors.length
        : width / 2;
      const anchorY = nodeAnchors.length
        ? nodeAnchors.reduce((sum, point) => sum + point.y, 0) / nodeAnchors.length
        : height / 2;

      node.vx += (anchorX - node.x) * 0.0034 * alpha;
      node.vy += (anchorY - node.y) * 0.0034 * alpha;

      node.vx += (width / 2 - node.x) * 0.0006 * alpha;
      node.vy += (height / 2 - node.y) * 0.0006 * alpha;

      const dxToCenter = node.x - centerX;
      const dyToCenter = node.y - centerY;
      const distToCenter = Math.sqrt(dxToCenter * dxToCenter + dyToCenter * dyToCenter) + 0.01;
      if (distToCenter > maxRadius) {
        const pullBack = (distToCenter - maxRadius) * 0.021 * alpha;
        node.vx -= (dxToCenter / distToCenter) * pullBack;
        node.vy -= (dyToCenter / distToCenter) * pullBack;
      }

      node.vx *= 0.84;
      node.vy *= 0.84;

      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.min(width - widthPadding, Math.max(widthPadding, node.x));
      node.y = Math.min(height - heightPadding, Math.max(heightPadding, node.y));
    });
  }

  return nodes.map(({ vx, vy, ...rest }) => rest);
}

function buildCorrelationGraph(skillsData) {
  const baseNodes = collectSkillNodes(skillsData);
  const edges = buildEdges(baseNodes);
  const width = 1024;
  const height = 1024;
  const orbSeedNodes = baseNodes.slice().sort((a, b) => hashNumber(a.id) - hashNumber(b.id));
  const orbSlotsById = buildOrbSlots(orbSeedNodes);
  const laidOutNodes = baseNodes.map((node) => {
    const slot = orbSlotsById.get(node.id) || { x: 0, y: 0, z: 1 };
    return {
      ...node,
      x: width / 2 + slot.x * width * 0.31,
      y: height / 2 + slot.y * height * 0.31
    };
  });
  const nodeById = new Map(laidOutNodes.map((node) => [node.id, node]));

  const degreeById = new Map(laidOutNodes.map((node) => [node.id, 0]));
  edges.forEach((edge) => {
    degreeById.set(edge.source, (degreeById.get(edge.source) || 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) || 0) + 1);
  });

  const nodes = laidOutNodes.map((node) => ({
    ...node,
    degree: degreeById.get(node.id) || 0,
    radius: 5 + (clampValue(node.level ?? 6, 0, 10) / 10) * 8
  }));

  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    adjacency.get(edge.source).push(edge);
    adjacency.get(edge.target).push(edge);
  });

  const componentCount = findConnectedComponents(nodes, edges).length;
  const floatMetaById = buildFloatMeta(nodes);

  return {
    width,
    height,
    nodes,
    edges,
    nodeById,
    adjacency,
    componentCount,
    floatMetaById,
    orbSlotsById
  };
}

function correlationReason(edge) {
  if (edge.sharedCategories.length > 0) return `Shared category: ${edge.sharedCategories[0]}`;
  if (edge.sharedThemes.length > 0) {
    return edge.sharedThemes
      .slice(0, 2)
      .map((themeId) => THEME_BY_ID[themeId]?.label || themeId)
      .join(' + ');
  }
  return 'Related through graph proximity';
}

function StatsPanel({ graph, activeNodeId, onReset }) {
  const activeNode = graph.nodeById.get(activeNodeId) || null;

  if (!activeNode) {
    return (
      <aside className="skills-panel">
        <div className="skills-metric-row">
          <span>{graph.nodes.length} skills</span>
          <span>{graph.edges.length} correlations</span>
        </div>
        <div className="skills-legend">
          {THEME_RULES.map((theme) => (
            <div className="skills-legend-item" key={theme.id}>
              <span className="skills-legend-swatch" style={{ background: theme.color }} />
              <span>{theme.label}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const linkedEdges = (graph.adjacency.get(activeNode.id) || [])
    .slice()
    .sort((a, b) => b.weight - a.weight);
  const topMatches = linkedEdges.slice(0, 8).map((edge) => {
    const neighborId = edge.source === activeNode.id ? edge.target : edge.source;
    const neighbor = graph.nodeById.get(neighborId);
    return {
      id: edge.id,
      edge,
      neighbor
    };
  });

  return (
    <aside className="skills-panel">
      <p className="skills-panel-kicker">Selected Skill</p>
      <h2>{activeNode.label}</h2>
      <div className="skills-domain-row">
        {activeNode.domains.map((domainKey) => (
          <span key={domainKey} className="skills-domain-badge">
            {DOMAIN_META[domainKey]?.short || domainKey}
          </span>
        ))}
      </div>
      {activeNode.level !== null && (
        <p className="skills-level">Proficiency score: {activeNode.level}/10</p>
      )}

      <p className="skills-panel-subtitle">Themes</p>
      <div className="skills-chip-wrap">
        {activeNode.themes.map((themeId) => (
          <span
            key={themeId}
            className="skills-chip"
            style={{
              borderColor: `${THEME_BY_ID[themeId]?.color || '#4a90e2'}66`,
              background: `${THEME_BY_ID[themeId]?.color || '#4a90e2'}22`
            }}
          >
            {THEME_BY_ID[themeId]?.label || themeId}
          </span>
        ))}
      </div>

      <p className="skills-panel-subtitle">Correlated Skills</p>
      <div className="skills-correlation-list">
        {topMatches.map((match) => (
          <div className="skills-correlation-item" key={match.id}>
            <div>
              <p>{match.neighbor?.label || 'Unknown skill'}</p>
              <small>{correlationReason(match.edge)}</small>
            </div>
            <span className="skills-correlation-score">{match.edge.weight.toFixed(1)}</span>
          </div>
        ))}
      </div>

      <button type="button" className="skills-reset-btn" onClick={onReset}>
        Clear focus
      </button>
    </aside>
  );
}

function SkillsPage() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [lockedNodeId, setLockedNodeId] = useState(null);
  const [manualNodePositions, setManualNodePositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewport, setViewport] = useState({ scale: 1, tx: 0, ty: 0 });
  const [animationClock, setAnimationClock] = useState(0);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetch('./portfolio-data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let frameId = null;
    let lastUpdate = 0;

    const animate = (timestamp) => {
      if (timestamp - lastUpdate > 40) {
        setAnimationClock(timestamp);
        lastUpdate = timestamp;
      }
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (lockedNodeId) setPanelOpen(true);
  }, [lockedNodeId]);

  const graph = useMemo(() => buildCorrelationGraph(data?.skills || {}), [data]);
  const nodeBoundsPaddingX = 90;
  const nodeBoundsPaddingY = 90;
  const minZoom = 0.75;
  const maxZoom = 2.6;
  const orbCenterX = graph.width / 2;
  const orbCenterY = graph.height / 2;
  const orbRadius = Math.min(graph.width, graph.height) * 0.37;

  const clampViewport = useCallback(
    (next) => {
      const scale = clampValue(next.scale, minZoom, maxZoom);

      if (scale <= 1) {
        const tx = (graph.width - graph.width * scale) / 2;
        const ty = (graph.height - graph.height * scale) / 2;
        return { scale, tx, ty };
      }

      const minTx = graph.width - graph.width * scale;
      const minTy = graph.height - graph.height * scale;
      const tx = clampValue(next.tx, minTx, 0);
      const ty = clampValue(next.ty, minTy, 0);
      return { scale, tx, ty };
    },
    [graph.width, graph.height]
  );

  useEffect(() => {
    setViewport(clampViewport({ scale: 1, tx: 0, ty: 0 }));
  }, [clampViewport]);

  useEffect(() => {
    setManualNodePositions((previousPositions) => {
      const nextPositions = {};
      graph.nodes.forEach((node) => {
        const saved = previousPositions[node.id];
        if (!saved) return;
        nextPositions[node.id] = {
          x: clampValue(saved.x, nodeBoundsPaddingX, graph.width - nodeBoundsPaddingX),
          y: clampValue(saved.y, nodeBoundsPaddingY, graph.height - nodeBoundsPaddingY)
        };
      });
      return nextPositions;
    });
  }, [graph, nodeBoundsPaddingX, nodeBoundsPaddingY]);

  const renderedNodes = useMemo(
    () =>
      graph.nodes.map((node) => {
        const override = manualNodePositions[node.id];
        if (!override) return node;
        return {
          ...node,
          x: override.x,
          y: override.y
        };
      }),
    [graph.nodes, manualNodePositions]
  );

  const animatedNodes = useMemo(
    () =>
      renderedNodes.map((node) => {
        const floatMeta = graph.floatMetaById.get(node.id);
        const slot = graph.orbSlotsById.get(node.id);
        const hasManualOverride = Boolean(manualNodePositions[node.id]);
        let sphereX = 0;
        let sphereY = 0;
        let sphereZ = 1;

        if (!hasManualOverride && slot) {
          sphereX = slot.x;
          sphereY = slot.y;
          sphereZ = slot.z;
        } else {
          const normalizedX = (node.x - orbCenterX) / orbRadius;
          const normalizedY = (node.y - orbCenterY) / orbRadius;
          const planarLength = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY) || 1;
          const planarScale = planarLength > 0.92 ? 0.92 / planarLength : 1;
          sphereX = normalizedX * planarScale;
          sphereY = normalizedY * planarScale;
          const hemisphere = slot ? (slot.z >= 0 ? 1 : -1) : hashNumber(`${node.id}-hemisphere`) % 2 === 0 ? 1 : -1;
          sphereZ = hemisphere * Math.sqrt(Math.max(0, 1 - sphereX * sphereX - sphereY * sphereY));
        }

        const floatDriftX = floatMeta
          ? Math.cos(animationClock * floatMeta.speed + floatMeta.phaseA) * 0.014
          : 0;
        const floatDriftY = floatMeta
          ? Math.sin(animationClock * floatMeta.speed * 0.92 + floatMeta.phaseB) * 0.014
          : 0;

        const yaw = animationClock * 0.000065;
        const pitch = 0.36 + Math.sin(animationClock * 0.00002) * 0.05;
        const cosineYaw = Math.cos(yaw);
        const sineYaw = Math.sin(yaw);
        const cosinePitch = Math.cos(pitch);
        const sinePitch = Math.sin(pitch);

        const xAfterYaw = sphereX * cosineYaw + sphereZ * sineYaw;
        const zAfterYaw = -sphereX * sineYaw + sphereZ * cosineYaw;
        const yAfterPitch = sphereY * cosinePitch - zAfterYaw * sinePitch;
        const zAfterPitch = sphereY * sinePitch + zAfterYaw * cosinePitch;

        const depthX = xAfterYaw + floatDriftX;
        const depthY = yAfterPitch + floatDriftY;
        const depthZ = zAfterPitch;

        const cameraDistance = 2.75;
        const perspective = cameraDistance / (cameraDistance - depthZ);
        const baseScale = 0.9 + (depthZ + 1) * 0.18;
        const isDragging = draggingNodeId === node.id;
        const renderScale = isDragging ? 1 : perspective * baseScale;
        const renderRadius = Math.max(4.3, node.radius * renderScale);

        return {
          ...node,
          renderX: clampValue(orbCenterX + depthX * orbRadius * perspective, nodeBoundsPaddingX, graph.width - nodeBoundsPaddingX),
          renderY: clampValue(orbCenterY + depthY * orbRadius * perspective, nodeBoundsPaddingY, graph.height - nodeBoundsPaddingY),
          depth: depthZ,
          renderScale,
          renderRadius
        };
      }),
    [
      renderedNodes,
      graph.floatMetaById,
      graph.orbSlotsById,
      manualNodePositions,
      draggingNodeId,
      animationClock,
      graph.width,
      graph.height,
      nodeBoundsPaddingX,
      nodeBoundsPaddingY,
      orbCenterX,
      orbCenterY,
      orbRadius
    ]
  );

  const animatedNodeById = useMemo(
    () => new Map(animatedNodes.map((node) => [node.id, node])),
    [animatedNodes]
  );

  const layeredNodes = useMemo(
    () => animatedNodes.slice().sort((a, b) => a.depth - b.depth),
    [animatedNodes]
  );

  const activeNodeId = lockedNodeId || hoveredNodeId;
  const activeNode = graph.nodeById.get(activeNodeId) || null;

  const neighborNodeIds = useMemo(() => {
    if (!activeNode) return new Set();
    const ids = new Set([activeNode.id]);
    (graph.adjacency.get(activeNode.id) || []).forEach((edge) => {
      ids.add(edge.source === activeNode.id ? edge.target : edge.source);
    });
    return ids;
  }, [graph, activeNode]);

  const activeEdgeIds = useMemo(() => {
    if (!activeNode) return new Set();
    return new Set((graph.adjacency.get(activeNode.id) || []).map((edge) => edge.id));
  }, [graph, activeNode]);

  const getSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(ctm.inverse());

    return {
      x: transformed.x,
      y: transformed.y
    };
  }, []);

  const graphPointFromSvg = useCallback(
    (svgPoint) => ({
      x: (svgPoint.x - viewport.tx) / viewport.scale,
      y: (svgPoint.y - viewport.ty) / viewport.scale
    }),
    [viewport]
  );

  const zoomByFactor = useCallback(
    (factor, anchorSvgPoint = null) => {
      setViewport((previous) => {
        const nextScale = clampValue(previous.scale * factor, minZoom, maxZoom);
        if (Math.abs(nextScale - previous.scale) < 0.0001) return previous;

        const anchor = anchorSvgPoint || { x: graph.width / 2, y: graph.height / 2 };
        const worldX = (anchor.x - previous.tx) / previous.scale;
        const worldY = (anchor.y - previous.ty) / previous.scale;
        const nextTx = anchor.x - worldX * nextScale;
        const nextTy = anchor.y - worldY * nextScale;

        return clampViewport({
          scale: nextScale,
          tx: nextTx,
          ty: nextTy
        });
      });
    },
    [clampViewport, graph.width, graph.height, minZoom, maxZoom]
  );

  const handleNodePointerDown = useCallback(
    (event, nodeId) => {
      if (!event.isPrimary) return;

      const svgPointer = getSvgPoint(event.clientX, event.clientY);
      if (!svgPointer) return;
      const pointer = graphPointFromSvg(svgPointer);
      const node = animatedNodeById.get(nodeId);
      if (!pointer || !node) return;

      event.preventDefault();
      event.stopPropagation();

      dragRef.current = {
        mode: 'node',
        nodeId,
        pointerId: event.pointerId,
        startPointerX: pointer.x,
        startPointerY: pointer.y,
        startNodeX: node.x,
        startNodeY: node.y
      };
      dragMovedRef.current = false;
      setIsPanning(false);
      setDraggingNodeId(nodeId);
      setHoveredNodeId(nodeId);
    },
    [getSvgPoint, graphPointFromSvg, animatedNodeById]
  );

  const handleViewportPointerDown = useCallback(
    (event) => {
      if (!event.isPrimary) return;
      const target = event.target;
      const isBackground =
        event.target === event.currentTarget ||
        (target && target.classList && target.classList.contains('skills-network-bg'));
      if (!isBackground) return;

      const pointer = getSvgPoint(event.clientX, event.clientY);
      if (!pointer) return;

      dragRef.current = {
        mode: 'pan',
        pointerId: event.pointerId,
        startPointerX: pointer.x,
        startPointerY: pointer.y,
        startTx: viewport.tx,
        startTy: viewport.ty
      };
      dragMovedRef.current = false;
      setIsPanning(true);
      setDraggingNodeId(null);
      setHoveredNodeId(null);
    },
    [getSvgPoint, viewport.tx, viewport.ty]
  );

  const handleSvgPointerMove = useCallback(
    (event) => {
      const dragState = dragRef.current;
      if (!dragState) return;
      if (dragState.pointerId !== event.pointerId) return;

      const pointer = getSvgPoint(event.clientX, event.clientY);
      if (!pointer) return;

      if (
        !dragMovedRef.current &&
        (Math.abs(pointer.x - dragState.startPointerX) > 1 || Math.abs(pointer.y - dragState.startPointerY) > 1)
      ) {
        dragMovedRef.current = true;
      }

      if (dragState.mode === 'pan') {
        setViewport(
          clampViewport({
            scale: viewport.scale,
            tx: dragState.startTx + (pointer.x - dragState.startPointerX),
            ty: dragState.startTy + (pointer.y - dragState.startPointerY)
          })
        );
        return;
      }

      const worldPoint = graphPointFromSvg(pointer);
      const deltaX = worldPoint.x - dragState.startPointerX;
      const deltaY = worldPoint.y - dragState.startPointerY;
      const nextX = clampValue(dragState.startNodeX + deltaX, nodeBoundsPaddingX, graph.width - nodeBoundsPaddingX);
      const nextY = clampValue(dragState.startNodeY + deltaY, nodeBoundsPaddingY, graph.height - nodeBoundsPaddingY);

      setManualNodePositions((prev) => {
        const current = prev[dragState.nodeId];
        if (current && Math.abs(current.x - nextX) < 0.2 && Math.abs(current.y - nextY) < 0.2) {
          return prev;
        }
        return {
          ...prev,
          [dragState.nodeId]: {
            x: nextX,
            y: nextY
          }
        };
      });
    },
    [
      getSvgPoint,
      graphPointFromSvg,
      clampViewport,
      viewport.scale,
      graph.height,
      graph.width,
      nodeBoundsPaddingX,
      nodeBoundsPaddingY
    ]
  );

  const endDragging = useCallback((pointerId = null) => {
    const dragState = dragRef.current;
    if (!dragState) return;
    if (pointerId !== null && dragState.pointerId !== pointerId) return;

    dragRef.current = null;
    setIsPanning(false);
    setDraggingNodeId(null);

    if (dragMovedRef.current) {
      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    }
  }, []);

  useEffect(() => {
    const stopDragging = () => endDragging();
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [endDragging]);

  if (loading) {
    return <div className="skills-loading-state">Loading skills map...</div>;
  }

  if (error) {
    return (
      <div className="skills-error-state">
        <div className="skills-error-panel">
          <h1>Could not load skills</h1>
          <p>{error}</p>
          <a href="/">Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-page-shell">
      <header className="sticky-nav skills-nav-border">
        <div className="skills-nav-inner">
          <a href="/" className="skills-back-link">Back to Home</a>
          <button type="button" onClick={() => setDarkMode((prev) => !prev)} className="skills-mode-toggle">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <main className="skills-main">
        <h1>
          My <span className="text-gradient">Skills</span>
        </h1>
        <p className="skills-intro">
          Unified map across product and technical skills.
        </p>

        <div className="skills-layout skills-layout-immersive">
          <section className="skills-network-shell">
            <button
              type="button"
              className="skills-panel-toggle-btn"
              onClick={() => setPanelOpen((prev) => !prev)}
              aria-expanded={panelOpen}
            >
              {panelOpen ? 'Hide Insights' : 'Show Insights'}
            </button>

            <div className={`skills-panel-overlay ${panelOpen ? 'open' : ''}`}>
              <StatsPanel graph={graph} activeNodeId={activeNodeId} onReset={() => setLockedNodeId(null)} />
            </div>

            <div className="skills-network-scroll">
              <svg
                ref={svgRef}
                className={`skills-network-svg ${draggingNodeId ? 'dragging' : ''} ${isPanning ? 'panning' : ''}`}
                viewBox={`0 0 ${graph.width} ${graph.height}`}
                role="img"
                aria-label="Correlated skills network"
                onMouseLeave={() => {
                  if (!dragRef.current) setHoveredNodeId(null);
                }}
                onPointerDown={handleViewportPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={(event) => endDragging(event.pointerId)}
                onPointerCancel={(event) => endDragging(event.pointerId)}
                onWheel={(event) => {
                  event.preventDefault();
                  const pointer = getSvgPoint(event.clientX, event.clientY);
                  zoomByFactor(event.deltaY < 0 ? 1.1 : 0.9, pointer);
                }}
                onClick={(event) => {
                  if (dragMovedRef.current) {
                    dragMovedRef.current = false;
                    return;
                  }
                  const target = event.target;
                  const isBackground =
                    event.target === event.currentTarget ||
                    (target && target.classList && target.classList.contains('skills-network-bg'));
                  if (isBackground) setLockedNodeId(null);
                }}
              >
                <rect className="skills-network-bg" x="0" y="0" width={graph.width} height={graph.height} fill="transparent" />

                <g transform={`translate(${viewport.tx} ${viewport.ty}) scale(${viewport.scale})`}>
                {graph.edges.map((edge) => {
                  const source = animatedNodeById.get(edge.source);
                  const target = animatedNodeById.get(edge.target);
                  if (!source || !target) return null;

                  const curveSeed = hashNumber(edge.id) % 19;
                  const curveAmount = (curveSeed - 9) * 1.4;
                  const midX = (source.renderX + target.renderX) / 2 + curveAmount;
                  const midY = (source.renderY + target.renderY) / 2 - curveAmount * 0.7;
                  const edgeIsActive = activeNode ? activeEdgeIds.has(edge.id) : false;
                  const edgeColor = edge.sharedThemes.length
                    ? THEME_BY_ID[edge.sharedThemes[0]]?.color || '#4a90e2'
                    : '#4a90e2';
                  const depthMix = (source.depth + target.depth) / 2;
                  const depthOpacity = 0.62 + (depthMix + 1) * 0.2;
                  const depthVisibility = depthMix < -0.08 ? 0.72 : 1;
                  const baseOpacity = !activeNode ? (edge.bridge ? 0.2 : 0.28) : edgeIsActive ? 0.88 : 0.06;

                  return (
                    <path
                      key={edge.id}
                      d={`M ${source.renderX} ${source.renderY} Q ${midX} ${midY} ${target.renderX} ${target.renderY}`}
                      fill="none"
                      stroke={edgeColor}
                      strokeDasharray={edge.bridge ? '4 7' : undefined}
                      strokeWidth={edgeIsActive ? 2.2 : edge.bridge ? 1.6 : 1.3}
                      opacity={clampValue(baseOpacity * depthOpacity * depthVisibility, 0.04, 0.95)}
                    />
                  );
                })}

                {layeredNodes.map((node) => {
                  const nodeIsActive = activeNode?.id === node.id;
                  const nodeIsNeighbor = neighborNodeIds.has(node.id);
                  const dimmed = activeNode && !nodeIsNeighbor;
                  const color = THEME_BY_ID[node.primaryTheme]?.color || '#4a90e2';
                  const zoomReveal = viewport.scale >= 1.16;
                  const showLabel = nodeIsActive || nodeIsNeighbor || zoomReveal || (!activeNode && node.degree >= 10 && viewport.scale >= 1.02);
                  const nearRightEdge = node.renderX > graph.width - 168;
                  const nearLeftEdge = node.renderX < 168;
                  const nearTopEdge = node.renderY < nodeBoundsPaddingY + 6;
                  const labelX = nearRightEdge ? -(node.renderRadius + 8) : nearLeftEdge ? node.renderRadius + 8 : 0;
                  const labelY = nearTopEdge ? node.renderRadius + 9 : -(node.renderRadius + 9);
                  const labelAnchor = nearRightEdge ? 'end' : nearLeftEdge ? 'start' : 'middle';
                  const labelBaseline = nearTopEdge ? 'hanging' : 'baseline';
                  const depthOpacity = clampValue(0.76 + (node.depth + 1) * 0.17, 0.45, 1);

                  return (
                    <g key={node.id} transform={`translate(${node.renderX} ${node.renderY})`} className="skills-node-group">
                      <circle
                        className={`skills-node-hit ${draggingNodeId === node.id ? 'dragging' : ''}`}
                        r={node.renderRadius + (nodeIsActive ? 2.6 : 0)}
                        fill={node.domains.length > 1 ? '#ffffff' : `${color}dd`}
                        stroke={color}
                        strokeWidth={nodeIsActive ? 2.6 : 1.5}
                        opacity={dimmed ? 0.14 : depthOpacity}
                        style={{ transition: 'all 0.2s ease' }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onFocus={() => setHoveredNodeId(node.id)}
                        onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (dragMovedRef.current) return;
                          setLockedNodeId((prev) => (prev === node.id ? null : node.id));
                        }}
                      >
                        <title>{node.label}</title>
                      </circle>
                      {showLabel && (
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor={labelAnchor}
                          dominantBaseline={labelBaseline}
                          className={`skills-node-label ${nodeIsActive ? 'active' : ''}`}
                          style={{ opacity: dimmed ? 0.24 : clampValue(depthOpacity + 0.05, 0.45, 0.98) }}
                        >
                          {node.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                </g>
              </svg>
            </div>
            <div className="skills-network-actions">
              <div className="skills-network-buttons">
                <button type="button" onClick={() => setLockedNodeId(null)}>Reset Focus</button>
                <button type="button" onClick={() => setManualNodePositions({})}>Reset Layout</button>
                <button type="button" onClick={() => zoomByFactor(0.88)}>-</button>
                <button type="button" onClick={() => setViewport(clampViewport({ scale: 1, tx: 0, ty: 0 }))}>Reset View</button>
                <button type="button" onClick={() => zoomByFactor(1.12)}>+</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<SkillsPage />);
