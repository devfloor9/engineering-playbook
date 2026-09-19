'use strict';

// EKSN-POD-020: 13 supplemental occurrences and the two retained scheduling examples.
// Reads current repository sources. No artifact fixtures, network, source evaluation or writes.
// Selected-field contract only: NOT complete NodePool/admission/CEL/controller validation.
// Standalone v1.14.1 CRD, independently read 2026-09-19:
// https://raw.githubusercontent.com/aws/karpenter-provider-aws/v1.14.1/pkg/apis/crds/karpenter.sh_nodepools.yaml
// SHA256 3bb64a20c80776b77aa19a699ebdaf34480a7b2e7ec4ef890b43225b3517f878
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const GUIDE = 'eks-best-practices/operations-reliability/eks-debugging/karpenter.md';
const PRIOR = 'eks-best-practices/operations-reliability/eks-pod-scheduling-availability.md';
const GPU = 'agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management.md';
const COMPONENT = 'src/components/AgenticSolutionsTables/KarpenterGpuOptimization.js';
function findRoot() {
  for (const start of [__dirname, process.cwd()]) {
    let candidate = path.resolve(start);
    for (;;) {
      if (fs.existsSync(path.join(candidate, 'package.json')) &&
          fs.existsSync(path.join(candidate, 'docs', GUIDE))) return candidate;
      const parent = path.dirname(candidate);
      if (parent === candidate) break;
      candidate = parent;
    }
  }
  throw new Error('Cannot locate repository; run from its cwd or install this test under scripts/tests/document-examples');
}
const root = findRoot();
const dependency = createRequire(path.join(root, 'package.json'));
const yaml = dependency('js-yaml');
const {parse} = dependency('@babel/parser');
const prefixes = {ko: 'docs/', en: 'i18n/en/docusaurus-plugin-content-docs/current/'};
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const locales = ['ko', 'en'];
const NEW = 'WhenEmptyOrUnderutilized', OLD = 'WhenUnderutilized';
// These constants are a bounded extraction of the pinned CRD, not an invented two-value enum.
const VALID_POLICIES = ['WhenEmpty', NEW, 'Balanced'];
const DURATION = /^(([0-9]+(s|m|h))+|Never)$/;
const headings = {
  ko: ['### 인스턴스 타입 가용성 부족', '### Consolidation Policy 설정',
    '### Drift 교체 제어', '### 시간대별 Consolidation'],
  en: ['### Insufficient Instance Type Availability', '### Consolidation Policy Configuration',
    '### Drift Replacement Control', '### Time-of-Day Consolidation'],
};
const checklistHeading = {ko: '### Consolidation이 동작하지 않음', en: '### Consolidation Not Running'};
const priorHeading = {
  ko: '##### 1단계: NodePool 정의 (ASG → NodePool 매핑)',
  en: '##### Step 1: Define a NodePool (ASG → NodePool Mapping)',
};
function scan(text) {
  const sections = [], blocks = [];
  let heading = '', active;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (active) {
      if (marker && marker[1][0] === active.marker[0] &&
          marker[1].length >= active.marker.length && !marker[2].trim()) {
        blocks.push({...active, code: active.lines.join('\n')});
        active = undefined;
      } else active.lines.push(line);
    } else if (marker) {
      active = {heading, marker: marker[1], language: marker[2].trim(), line: index + 1, lines: []};
    } else if (/^#{1,6} /.test(line)) {
      heading = line;
      sections.push({heading, lines: []});
    } else if (sections.length) sections.at(-1).lines.push(line);
  }
  assert.equal(active, undefined, 'Unclosed Markdown code fence');
  return {sections, blocks};
}
function section(text, heading) {
  const parsed = scan(text);
  const matches = parsed.sections.filter(s => s.heading === heading);
  assert.equal(matches.length, 1, `Missing or ambiguous section: ${heading}`);
  return {text: matches[0].lines.join('\n'),
    blocks: parsed.blocks.filter(b => b.heading === heading)};
}
function extractPool(text, heading, name = 'default') {
  // The retained migration section also has one comment-only ASG context fence.
  // Ignore only blank/comment text, never a malformed or unexpected YAML object.
  const candidates = section(text, heading).blocks.filter(b => b.language === 'yaml' &&
    b.code.split('\n').some(line => line.trim() && !line.trim().startsWith('#')));
  assert.equal(candidates.length, 1, `Missing or ambiguous YAML example: ${heading}`);
  const objects = yaml.loadAll(candidates[0].code);
  assert.equal(objects.length, 1, 'Expected exactly one YAML document');
  const node = objects[0];
  assert.equal(node?.apiVersion, 'karpenter.sh/v1');
  assert.equal(node?.kind, 'NodePool');
  assert.equal(node?.metadata?.name, name);
  return node;
}
function fieldContract(node) {
  const disruption = node.spec?.disruption;
  assert.ok(VALID_POLICIES.includes(disruption?.consolidationPolicy), 'Unsupported policy');
  assert.equal(typeof disruption.consolidateAfter, 'string', 'Explicit disruption needs a string wait');
  assert.match(disruption.consolidateAfter, DURATION, 'Invalid wait unit or value');
  for (const parent of [node.spec, disruption, node.spec?.template]) {
    assert.ok(!parent || !Object.hasOwn(parent, 'expireAfter'), 'Misplaced expireAfter');
  }
  const expiry = node.spec?.template?.spec?.expireAfter;
  if (expiry !== undefined) {
    assert.equal(typeof expiry, 'string', 'Expiry must be a string');
    assert.match(expiry, DURATION, 'Invalid expiry unit or value');
  }
}
function authoredContract(node, wait, expiry) {
  fieldContract(node);
  assert.equal(node.spec.disruption.consolidationPolicy, NEW);
  assert.equal(node.spec.disruption.consolidateAfter, wait);
  assert.equal(node.spec.template?.spec?.expireAfter, expiry);
  assert.equal(Object.hasOwn(node.spec, 'replicas'), false,
    'Static replicas would make consolidation settings inactive');
}
function policyRow(text, locale) {
  const body = section(text, headings[locale][1]).text;
  const rows = body.split('\n').filter(line => /^\|\s*\*\*When/.test(line));
  const selected = rows.filter(line => line.split('|')[1].trim() === `**${NEW}**`);
  assert.equal(selected.length, 1, 'Missing or ambiguous updated policy row');
  assert.ok(!body.includes(OLD), 'Deprecated enum in policy explanation');
}
function checklist(text, locale) {
  const body = section(text, checklistHeading[locale]).text;
  const rows = body.split('\n').filter(line => /^- \[[ x]\]/.test(line) && line.includes('`consolidationPolicy`'));
  assert.equal(rows.length, 1, 'Missing or ambiguous consolidation checklist item');
  assert.ok(rows[0].includes(`\`${NEW}\``));
  assert.ok(!rows[0].includes(OLD));
}
const current = Object.fromEntries(locales.map(locale => [locale, read(prefixes[locale] + GUIDE)]));
for (const locale of locales) {
  for (let index = 0; index < 4; index++) {
    test(`EKSN-POD-020 ${locale}: authored NodePool example ${index + 1}`, () => {
      authoredContract(extractPool(current[locale], headings[locale][index]),
        '30s', index < 3 ? '720h' : undefined);
    });
  }
  test(`EKSN-POD-020 ${locale}: policy table occurrence`, () => policyRow(current[locale], locale));
  test(`EKSN-POD-020 ${locale}: checklist occurrence`, () => checklist(current[locale], locale));
  test(`EKSN-POD-020 ${locale}: exactly six supplemental occurrences, no old enum`, () => {
    assert.equal(current[locale].split(NEW).length - 1, 6);
    assert.ok(!current[locale].includes(OLD));
  });
  test(`EKSN-POD-020 ${locale}: prior migration example retains 1m/720h/provider ref`, () => {
    const node = extractPool(read(prefixes[locale] + PRIOR), priorHeading[locale], 'general-purpose');
    authoredContract(node, '1m', '720h');
    assert.deepEqual(node.spec.template.spec.nodeClassRef,
      {group: 'karpenter.k8s.aws', kind: 'EC2NodeClass', name: 'default'});
  });
}
test('EKSN-POD-020: paired selected YAML examples retain identical parsed values', () => {
  for (let i = 0; i < 4; i++)
    assert.deepEqual(extractPool(current.ko, headings.ko[i]), extractPool(current.en, headings.en[i]));
});
function componentData(text) {
  const ast = parse(text, {sourceType: 'module', plugins: ['jsx']});
  const nodes = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type) nodes.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(ast);
  const variable = name => {
    const candidates = nodes.filter(n => n.type === 'VariableDeclarator' && n.id?.name === name);
    assert.equal(candidates.length, 1, `Missing or ambiguous component variable ${name}`);
    return candidates[0].init;
  };
  const locale = variable('isKo');
  assert.equal(locale.type, 'BinaryExpression'); assert.equal(locale.operator, '===');
  assert.equal(locale.left.object.name, 'i18n'); assert.equal(locale.left.property.name, 'currentLocale');
  assert.equal(locale.right.value, 'ko');
  const data = variable('data');
  assert.equal(data.type, 'ConditionalExpression'); assert.equal(data.test.name, 'isKo');
  function literals(node) {
    if (node?.type === 'ArrayExpression') return node.elements.map(literals);
    assert.equal(node?.type, 'StringLiteral', 'Visible cells must remain statically readable');
    return node.value;
  }
  const ko = literals(data.consequent), en = literals(data.alternate);
  assert.equal(ko.length, 4); assert.equal(en.length, 6);
  for (const row of [...ko, ...en]) assert.equal(row.length, 3);
  const selected = en.filter(row => row[0].replace(/\*/g, '') === 'Consolidation');
  assert.equal(selected.length, 1, 'Missing or ambiguous English consolidation row');
  assert.equal(selected[0][2], `\`consolidationPolicy: ${NEW}\``);
  assert.ok(!JSON.stringify(ko).includes('consolidationPolicy:'), 'The corrected enum is EN-only');
  assert.ok(!JSON.stringify([...ko, ...en]).includes(OLD));
  const tables = nodes.filter(n => n.type === 'JSXOpeningElement' && n.name?.name === 'ManualTable');
  assert.equal(tables.length, 1);
  const props = tables[0].attributes.filter(a => a.type === 'JSXAttribute' && a.name.name === 'rows');
  assert.equal(props.length, 1); assert.equal(props[0].value.expression.name, 'data');
  return {ko, en};
}
const component = read(COMPONENT);
test('EKSN-POD-020: EN component occurrence and actual locale/table binding', () => componentData(component));
test('EKSN-POD-020: named component export remains available to hosts', () => {
  assert.match(read('src/components/AgenticSolutionsTables/index.js'),
    /export\s*\{\s*default as KarpenterGpuOptimization\s*\}\s*from\s*['"]\.\/KarpenterGpuOptimization['"]/);
});
for (const locale of locales) test(`EKSN-POD-020 ${locale}: GPU host imports and renders the shared component once`, () => {
  const ast = parse(read(prefixes[locale] + GPU).match(/import\s*\{[^}]*KarpenterGpuOptimization[^}]*\}\s*from\s*['"][^'"]+['"];?/s)?.[0] || '',
    {sourceType: 'module'});
  assert.equal(ast.program.body.length, 1, 'Missing host component import');
  assert.equal(ast.program.body[0].source.value, '@site/src/components/AgenticSolutionsTables');
  assert.equal((read(prefixes[locale] + GPU).match(/<KarpenterGpuOptimization\s*\/>/g) || []).length, 1);
});
const sample = () => extractPool(current.en, headings.en[0]);
test('Pinned field contract accepts Balanced, WhenEmpty and Never without treating them as the authored choice', () => {
  for (const value of VALID_POLICIES) {
    const node = sample(); node.spec.disruption.consolidationPolicy = value; fieldContract(node);
  }
  const node = sample(); node.spec.disruption.consolidateAfter = 'Never'; fieldContract(node);
});
for (const [name, mutate] of [
  ['old enum', n => { n.spec.disruption.consolidationPolicy = OLD; }],
  ['unknown enum', n => { n.spec.disruption.consolidationPolicy = 'Underutilized'; }],
  ['missing wait', n => { delete n.spec.disruption.consolidateAfter; }],
  ['numeric wait', n => { n.spec.disruption.consolidateAfter = 30; }],
  ['wrong wait unit', n => { n.spec.disruption.consolidateAfter = '30days'; }],
  ['expiry in disruption', n => { n.spec.disruption.expireAfter = '720h'; delete n.spec.template.spec.expireAfter; }],
  ['expiry at spec root', n => { n.spec.expireAfter = '720h'; }],
  ['expiry at template root', n => { n.spec.template.expireAfter = '720h'; }],
  ['numeric expiry', n => { n.spec.template.spec.expireAfter = 720; }],
]) test(`Negative control rejects ${name}`, () => {
  const node = sample(); mutate(node); assert.throws(() => fieldContract(node));
});
test('Negative control rejects dropping authored expiry or replacing the retained 1m wait', () => {
  const node = sample(); delete node.spec.template.spec.expireAfter;
  assert.throws(() => authoredContract(node, '30s', '720h'));
  assert.throws(() => authoredContract(sample(), '1m', '720h'));
});
const fixtureHeading = '### Selected example';
const fixture = code => `${fixtureHeading}\n\n\`\`\`yaml\n${code}\n\`\`\`\n`;
const fixtureCode = yaml.dump(sample());
for (const [name, text] of [
  ['missing heading', fixture(fixtureCode).replace(fixtureHeading, '### Other')],
  ['duplicate heading', fixture(fixtureCode) + fixture(fixtureCode)],
  ['missing YAML fence', `${fixtureHeading}\nNo example\n`],
  ['only comment context remains', fixture('# ASG context; selected NodePool was removed')],
  ['duplicate YAML fence', fixture(fixtureCode) + `\n\`\`\`yaml\n${fixtureCode}\n\`\`\`\n`],
  ['unclosed fence', `${fixtureHeading}\n\`\`\`yaml\n${fixtureCode}`],
  ['malformed YAML', fixture('spec: [')],
  ['duplicate YAML key', fixture(fixtureCode + '\nspec: {}\n')],
  ['multiple YAML documents', fixture(fixtureCode + '\n---\n' + fixtureCode)],
  ['wrong kind', fixture(fixtureCode.replace('kind: NodePool', 'kind: NodeClaim'))],
]) test(`Extraction fails closed on ${name}`, () => {
  assert.throws(() => extractPool(text, fixtureHeading));
});
for (const [name, text] of [
  ['old EN enum', component.replace(NEW, OLD)],
  ['swapped locale', component.replace("currentLocale === 'ko'", "currentLocale === 'en'")],
  ['runtime table data', component.replace('const data = isKo ?', 'const data = runtimeData() || isKo ?')],
  ['wrong rendered binding', component.replace('rows={data}', 'rows={otherData}')],
]) test(`Component negative control rejects ${name}`, () => assert.throws(() => componentData(text)));
