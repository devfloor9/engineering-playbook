'use strict';

// EO-AV-KARP-02/03/05: bounded current-document contracts, not resource/runtime validation.
// No writes or network. Only Node built-ins and the repository's existing js-yaml.
// Public contract: provider v1.14.1 CRD and its pinned core 6e7eab7a0f485d7225eb98995fad9b66c79b322b.
// https://raw.githubusercontent.com/aws/karpenter-provider-aws/v1.14.1/pkg/apis/crds/karpenter.sh_nodepools.yaml
// https://github.com/kubernetes-sigs/karpenter/blob/6e7eab7a0f485d7225eb98995fad9b66c79b322b/pkg/apis/v1/nodepool.go
// https://github.com/kubernetes-sigs/karpenter/blob/6e7eab7a0f485d7225eb98995fad9b66c79b322b/pkg/controllers/disruption/helpers.go
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const REL = 'eks-best-practices/operations-reliability/eks-debugging/karpenter.md';
function findRoot() {
  for (const start of [__dirname, process.cwd()]) {
    for (let dir = path.resolve(start);;) {
      if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'docs', REL)))
        return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  throw new Error('Run from the repository or place this test under scripts/tests/document-examples');
}
const root = findRoot();
const sourceRoot = path.resolve(process.env.KARPENTER_BUDGET_DOC_ROOT || root);
const yaml = createRequire(path.join(root, 'package.json'))('js-yaml');
const locales = ['ko', 'en'];
const prefixes = {ko: 'docs/', en: 'i18n/en/docusaurus-plugin-content-docs/current/'};
const headings = {
  ko: {early: '### Consolidation Policy 설정', window: '### 시간대별 Consolidation',
    life: '## NodeClaim 라이프사이클', flow: '### Consolidation 동작 흐름',
    checklist: '### Drift 교체가 너무 빠름/느림'},
  en: {early: '### Consolidation Policy Configuration', window: '### Time-of-Day Consolidation',
    life: '## NodeClaim Lifecycle', flow: '### Consolidation Flow',
    checklist: '### Drift Replacement Too Fast/Slow'},
};
const sources = Object.fromEntries(locales.map(l =>
  [l, fs.readFileSync(path.join(sourceRoot, prefixes[l] + REL), 'utf8')]));
function sections(text) {
  const result = [];
  let current, fence;
  for (const line of text.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence.marker[0] &&
          marker[1].length >= fence.marker.length && !marker[2].trim()) {
        current?.blocks.push({...fence, code: fence.lines.join('\n')}); fence = undefined;
      } else fence.lines.push(line);
    } else if (marker) {
      fence = {marker: marker[1], language: marker[2].trim(), lines: []};
    } else if (/^#{1,6} /.test(line)) {
      current = {heading: line, text: [], blocks: []}; result.push(current);
    } else current?.text.push(line);
  }
  assert.equal(fence, undefined, 'Unclosed Markdown fence');
  return result;
}
function section(text, heading) {
  const found = sections(text).filter(s => s.heading === heading);
  assert.equal(found.length, 1, `Missing or ambiguous section: ${heading}`);
  return found[0];
}
function oneBlock(text, heading, language) {
  const found = section(text, heading).blocks.filter(b => b.language === language);
  assert.equal(found.length, 1, `Missing or ambiguous ${language} block: ${heading}`);
  return found[0].code;
}
function pool(text, heading) {
  const objects = yaml.loadAll(oneBlock(text, heading, 'yaml'));
  assert.equal(objects.length, 1, 'Expected one YAML document');
  const node = objects[0];
  assert.equal(node?.apiVersion, 'karpenter.sh/v1'); assert.equal(node?.kind, 'NodePool');
  assert.equal(node?.metadata?.name, 'default');
  return node;
}
function durationMs(value) {
  // Selected positive h/m windows only; not all metav1.Duration syntax.
  assert.equal(typeof value, 'string');
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:0s)?$/);
  assert.ok(match && (match[1] || match[2]), 'Expected a positive hour/minute window');
  const minutes = Number(match[1] || 0) * 60 + Number(match[2] || 0);
  assert.ok(Number.isSafeInteger(minutes) && minutes > 0);
  return minutes * 60000;
}
function parseSchedule(value) {
  // Deliberately bounded: numeric minute/hour, wildcard day/month, numeric weekday/range.
  // Reject unsupported forms rather than pretending to be the production cron parser.
  assert.equal(typeof value, 'string');
  const fields = value.trim().split(/\s+/);
  assert.equal(fields.length, 5, 'Expected five UTC cron fields without timezone prefix');
  const [minute, hour, day, month, weekday] = fields;
  assert.match(minute, /^\d+$/); assert.match(hour, /^\d+$/);
  assert.ok(Number(minute) <= 59 && Number(hour) <= 23);
  assert.equal(day, '*'); assert.equal(month, '*');
  let days;
  if (weekday === '*') days = [0, 1, 2, 3, 4, 5, 6];
  else {
    const match = weekday.match(/^([0-6])(?:-([0-6]))?$/);
    assert.ok(match, 'Unsupported weekday expression');
    const first = Number(match[1]), last = Number(match[2] || match[1]);
    assert.ok(first <= last, 'Descending range is not an overnight window');
    days = Array.from({length: last - first + 1}, (_, i) => first + i);
  }
  return {minute: Number(minute), hour: Number(hour), days};
}
function validateBudget(budget) {
  assert.ok(budget && typeof budget === 'object' && !Array.isArray(budget));
  assert.equal(typeof budget.nodes, 'string');
  assert.match(budget.nodes, /^((100|[0-9]{1,2})%|[0-9]+)$/);
  const scheduled = Object.hasOwn(budget, 'schedule');
  assert.equal(scheduled, Object.hasOwn(budget, 'duration'), 'schedule and duration must occur together');
  if (scheduled) { parseSchedule(budget.schedule); durationMs(budget.duration); }
  if (Object.hasOwn(budget, 'reasons')) {
    assert.ok(Array.isArray(budget.reasons));
    assert.ok(budget.reasons.every(r => ['Drifted', 'Empty', 'Underutilized'].includes(r)));
  }
}
function active(budget, timestamp) {
  validateBudget(budget);
  const now = new Date(timestamp); assert.ok(Number.isFinite(now.getTime()), 'Invalid test timestamp');
  if (!Object.hasOwn(budget, 'schedule')) return true;
  const schedule = parseSchedule(budget.schedule), duration = durationMs(budget.duration);
  // Equivalent for the selected forms to Next(now-duration) <= now, with Next strictly later.
  for (let offset = 0; offset <= Math.ceil(duration / 86400000); offset++) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),
      now.getUTCDate() - offset, schedule.hour, schedule.minute));
    if (schedule.days.includes(start.getUTCDay()) &&
        start <= now && now.getTime() < start.getTime() + duration) return true;
  }
  return false;
}
function allowance(budgets, timestamp, nodes, reason = 'Underutilized') {
  assert.ok(Array.isArray(nodes));
  assert.equal(new Set(nodes.map(n => n.id)).size, nodes.length, 'Duplicate fixture node identity');
  const eligible = nodes.filter(n => n.managed && n.initialized && !n.instanceTerminating);
  const consuming = eligible.filter(n => !n.ready || n.deleting).length;
  const configured = budgets === undefined ? [{nodes: '10%'}] : budgets;
  assert.ok(Array.isArray(configured));
  let cap = Infinity;
  for (const budget of configured) {
    validateBudget(budget);
    if ((!Object.hasOwn(budget, 'reasons') || budget.reasons.includes(reason)) && active(budget, timestamp)) {
      const ceiling = budget.nodes.endsWith('%')
        ? Math.ceil(eligible.length * Number(budget.nodes.slice(0, -1)) / 100)
        : Number(budget.nodes);
      cap = Math.min(cap, ceiling);
    }
  }
  return Math.max(0, cap - consuming);
}
const nodes = count => Array.from({length: count}, (_, i) =>
  ({id: `n${i}`, managed: true, initialized: true, instanceTerminating: false, ready: true, deleting: false}));
function authoredBudgets(locale, kind) {
  return pool(sources[locale], headings[locale][kind]).spec.disruption.budgets;
}
for (const locale of locales) {
  test(`${locale}: explicit daily 09:00–10:00 UTC budget`, () => {
    assert.deepEqual(authoredBudgets(locale, 'early'), [{nodes: '10%', schedule: '0 9 * * *', duration: '1h'}]);
    authoredBudgets(locale, 'early').forEach(validateBudget);
  });
  test(`${locale}: continuous 50% baseline plus weekday 09:00–18:00 UTC zero budget`, () => {
    assert.deepEqual(authoredBudgets(locale, 'window'),
      [{nodes: '50%'}, {nodes: '0%', schedule: '0 9 * * 1-5', duration: '9h'}]);
    authoredBudgets(locale, 'window').forEach(validateBudget);
  });
  test(`${locale}: POD020 fields remain unchanged in both edited YAML examples`, () => {
    for (const kind of ['early', 'window']) {
      const node = pool(sources[locale], headings[locale][kind]);
      assert.equal(node.spec.disruption.consolidationPolicy, 'WhenEmptyOrUnderutilized');
      assert.equal(node.spec.disruption.consolidateAfter, '30s');
      assert.equal(node.spec.template?.spec?.expireAfter, kind === 'early' ? '720h' : undefined);
      assert.ok(!Object.hasOwn(node.spec.disruption, 'expireAfter'));
    }
  });
  test(`${locale}: lifecycle uses NodeClaim age and retains distinct drain protections`, () => {
    const life = section(sources[locale], headings[locale].life);
    const code = oneBlock(sources[locale], headings[locale].life, 'mermaid');
    assert.ok(!code.includes('ttlSecondsAfterEmpty') && !code.includes('Taints/Labels'));
    assert.match(code, /Ready --> Expired:.*spec\.expireAfter/);
    assert.match(code, /Registered --> Initialized:/);
    const text = life.text.join('\n');
    for (const term of ['status.conditions', 'PDB', 'terminationGracePeriod', 'do-not-disrupt'])
      assert.ok(text.includes(term), `Missing explanatory term ${term}`);
    // Presence checks are regression guards, not proof of prose semantics.
  });
  test(`${locale}: consolidation has a delete-only route and a replacement route`, () => {
    const code = oneBlock(sources[locale], headings[locale].flow, 'mermaid');
    assert.ok(!code.includes('ttlSecondsAfterEmpty')); assert.ok(code.includes('consolidateAfter'));
    for (const edge of ['D -->|Yes| E', 'E --> H', 'F -->|Yes| G', 'G --> H'])
      assert.ok(code.includes(edge), `Missing decision edge ${edge}`);
  });
  test(`${locale}: default and explicit-empty budget distinctions remain documented`, () => {
    const text = section(sources[locale], headings[locale].checklist).text.join('\n');
    assert.ok(text.includes('budgets: []') && text.includes('nodes: "10%"'));
    assert.ok(!text.includes('no default = unlimited') && !text.includes('기본값 없음 = 무제한'));
  });
}
test('Paired selected budget objects are identical', () => {
  for (const kind of ['early', 'window']) assert.deepEqual(authoredBudgets('ko', kind), authoredBudgets('en', kind));
});
for (const locale of locales) {
  const budgets = authoredBudgets(locale, 'window');
  for (const [timestamp, expected] of [
    ['2026-09-21T08:59:59.999Z', 5], ['2026-09-21T09:00:00.000Z', 0],
    ['2026-09-21T17:59:59.999Z', 0], ['2026-09-21T18:00:00.000Z', 5],
    ['2026-09-21T23:59:59.999Z', 5], ['2026-09-22T00:00:00.000Z', 5],
    ['2026-09-25T18:00:00.000Z', 5], ['2026-09-26T12:00:00.000Z', 5],
    ['2026-09-27T12:00:00.000Z', 5],
    ['2026-09-21T18:00:00+09:00', 0], // same instant as 09:00 UTC; not 09:00 local
  ]) test(`${locale}: UTC business-window boundary ${timestamp}`, () => {
    for (const reason of ['Empty', 'Underutilized', 'Drifted'])
      assert.equal(allowance(budgets, timestamp, nodes(10), reason), expected);
  });
  test(`${locale}: explicit daily budget has no implicit default outside its window`, () => {
    const daily = authoredBudgets(locale, 'early');
    assert.equal(allowance(daily, '2026-09-21T08:59:59Z', nodes(10)), Infinity);
    assert.equal(allowance(daily, '2026-09-21T09:00:00Z', nodes(10)), 1);
    assert.equal(allowance(daily, '2026-09-21T10:00:00Z', nodes(10)), Infinity);
  });
}
test('Omitted budgets default to 10%; explicit empty list is unbounded at this layer', () => {
  assert.equal(allowance(undefined, '2026-09-21T12:00Z', nodes(11)), 2);
  assert.equal(allowance([], '2026-09-21T12:00Z', nodes(11)), Infinity);
});
test('Percentage ceilings round up; count only eligible initialized managed nodes', () => {
  const list = nodes(10);
  list.push({...nodes(1)[0], id: 'uninitialized', initialized: false});
  list.push({...nodes(1)[0], id: 'unmanaged', managed: false});
  list.push({...nodes(1)[0], id: 'terminating', instanceTerminating: true});
  assert.equal(allowance([{nodes: '10%'}], '2026-09-21T12:00Z', list), 1);
  assert.equal(allowance([{nodes: '10%'}], '2026-09-21T12:00Z', nodes(11)), 2);
});
test('NotReady plus deletion on one node consumes one slot, not two', () => {
  const list = nodes(10); list[0].ready = false; list[0].deleting = true;
  assert.equal(allowance([{nodes: '50%'}], '2026-09-21T12:00Z', list), 4);
});
test('Apply the tightest active applicable cap, subtract consuming nodes, clamp at zero', () => {
  const list = nodes(10); list[0].deleting = true; list[1].ready = false;
  assert.equal(allowance([{nodes: '50%'}, {nodes: '3'}], '2026-09-21T12:00Z', list), 1);
  assert.equal(allowance([{nodes: '1'}], '2026-09-21T12:00Z', list), 0);
  assert.equal(allowance([{nodes: '0', reasons: ['Drifted']}], '2026-09-21T12:00Z', list, 'Empty'), Infinity);
});
for (const [name, bad] of [
  ['missing duration', {nodes: '0%', schedule: '0 9 * * 1-5'}],
  ['orphan duration', {nodes: '0%', duration: '9h'}],
  ['descending overnight hour range', {nodes: '50%', schedule: '0 19-8 * * *', duration: '14h'}],
  ['timezone prefix', {nodes: '0%', schedule: 'TZ=Asia/Seoul 0 9 * * 1-5', duration: '9h'}],
  ['out-of-range hour', {nodes: '0%', schedule: '0 24 * * *', duration: '9h'}],
  ['numeric duration', {nodes: '0%', schedule: '0 9 * * *', duration: 9}],
  ['seconds-only duration', {nodes: '0%', schedule: '0 9 * * *', duration: '30s'}],
  ['percentage outside bounds', {nodes: '101%'}],
  ['unknown reason', {nodes: '0%', reasons: ['Expired']}],
]) test(`Negative budget control: ${name}`, () => assert.throws(() => validateBudget(bad)));
test('A valid overnight start/duration works without a descending range', () => {
  const budget = {nodes: '50%', schedule: '0 19 * * *', duration: '14h'};
  assert.equal(active(budget, '2026-09-21T18:59:59Z'), false);
  assert.equal(active(budget, '2026-09-21T19:00:00Z'), true);
  assert.equal(active(budget, '2026-09-22T08:59:59Z'), true);
  assert.equal(active(budget, '2026-09-22T09:00:00Z'), false);
});
const fixtureHeading = '### Scoped';
const valid = 'apiVersion: karpenter.sh/v1\nkind: NodePool\nmetadata:\n  name: default\nspec: {}\n';
const fixture = code => `${fixtureHeading}\n\n\`\`\`yaml\n${code}\`\`\`\n`;
for (const [name, text] of [
  ['missing section', fixture(valid).replace(fixtureHeading, '### Other')],
  ['duplicate section', fixture(valid) + fixture(valid)],
  ['missing block', `${fixtureHeading}\n`],
  ['duplicate block', fixture(valid) + `\n\`\`\`yaml\n${valid}\`\`\`\n`],
  ['unclosed block', `${fixtureHeading}\n\`\`\`yaml\n${valid}`],
  ['malformed YAML', fixture('spec: [\n')],
  ['duplicate YAML key', fixture(valid + 'spec: {}\n')],
  ['multiple YAML documents', fixture(valid + '---\n' + valid)],
]) test(`Extraction fails closed: ${name}`, () => assert.throws(() => pool(text, fixtureHeading)));
