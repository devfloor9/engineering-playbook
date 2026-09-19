'use strict';

// Small authored-example contracts, not Kubernetes/CRD schema validation.
// Read current sources; never execute shell, cloud, cluster or Helm examples.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const root = path.resolve(process.env.SCHEDULING_DOC_ROOT || process.cwd());
const deps = path.resolve(process.env.SCHEDULING_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(deps, 'package.json'))('js-yaml');
const catalog = require('./scheduling-locators.json');
const clone = value => JSON.parse(JSON.stringify(value));
const locales = ['ko', 'en'];

function fences(text) {
  const blocks = [];
  const counts = new Map();
  let heading = '', active;
  text.split(/\r?\n/).forEach((line, index) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (active) {
      if (marker && marker[1][0] === active.marker[0]
          && marker[1].length >= active.marker.length && !marker[2].trim()) {
        blocks.push({...active, code: active.lines.join('\n')});
        active = undefined;
      } else active.lines.push(line);
    } else if (marker) {
      counts.set(heading, (counts.get(heading) || 0) + 1);
      active = {heading, ordinal: counts.get(heading), language: marker[2].trim(),
        marker: marker[1], line: index + 1, lines: []};
    } else if (/^#{1,6} /.test(line)) heading = line;
  });
  assert.equal(active, undefined, 'Unclosed Markdown fence');
  return blocks;
}

function extract(locale) {
  const relative = catalog.documents[locale];
  const blocks = fences(fs.readFileSync(path.join(root, relative), 'utf8'));
  return Object.fromEntries(catalog.locators.filter(row => row.language === 'yaml').map(row => {
    const matches = blocks.filter(block =>
      block.heading === row.headings[locale] && block.ordinal === row.ordinal);
    assert.equal(matches.length, 1, `${locale}/${row.key}: missing or ambiguous scoped fence`);
    const block = matches[0];
    assert.equal(block.language, 'yaml', `${locale}/${row.key}: expected YAML fence`);
    const objects = yaml.loadAll(block.code, {filename: `${relative}:${block.line}`})
      .filter(value => value !== null && value !== undefined);
    assert.ok(objects.length && objects.every(value => typeof value === 'object'),
      `${locale}/${row.key}: expected YAML objects`);
    return [row.key, objects];
  }));
}

const sources = Object.fromEntries(locales.map(locale => [locale, extract(locale)]));
function one(objects, kind, name) {
  const matches = objects.filter(item => item.kind === kind && (!name || item.metadata?.name === name));
  assert.equal(matches.length, 1, `Expected one ${kind} ${name || ''}`);
  return matches[0];
}
const pools = docs => Object.values(docs).flat().filter(item => item.kind === 'NodePool');
const rules = docs => Object.values(docs).flat().filter(item => item.kind === 'NodeReadinessRule');
const pool = docs => one(docs.gpu_bundle, 'NodePool', 'gpu-pool');
const rule = docs => one(docs.gpu_bundle, 'NodeReadinessRule', 'gpu-readiness-rule');
const podSpec = object => object.kind === 'Pod' ? object.spec : object.spec.template.spec;
const workloads = docs => [one(docs.guarded_pod, 'Pod'), one(docs.gpu_bundle, 'Job')];

function providerRefs(objects) {
  assert.ok(objects.length, 'No NodePools evaluated');
  for (const object of objects) {
    assert.equal(object.apiVersion, 'karpenter.sh/v1', 'Standalone NodePool API');
    const ref = object.spec?.template?.spec?.nodeClassRef;
    for (const key of ['group', 'kind', 'name']) {
      assert.ok(typeof ref?.[key] === 'string' && ref[key].trim(), `nodeClassRef.${key} required`);
    }
    assert.equal(ref.group, 'karpenter.k8s.aws', 'Standalone AWS provider group');
    assert.equal(ref.kind, 'EC2NodeClass', 'Standalone AWS provider kind');
  }
}

function consolidation(objects) {
  for (const object of objects) {
    const disruption = object.spec?.disruption;
    if (disruption?.consolidationPolicy !== undefined) {
      assert.ok(['WhenEmpty', 'WhenEmptyOrUnderutilized'].includes(disruption.consolidationPolicy),
        'Invalid consolidationPolicy');
      assert.ok(typeof disruption.consolidateAfter === 'string' && disruption.consolidateAfter,
        'consolidateAfter required for the authored consolidation example');
    }
  }
}

function expiration(objects) {
  function walk(value, location = []) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'expireAfter') {
        assert.deepEqual([...location, key], ['spec', 'template', 'spec', 'expireAfter'],
          'expireAfter belongs in spec.template.spec');
        assert.ok(typeof child === 'string' && child, 'expireAfter must be a nonempty string');
      }
      walk(child, [...location, key]);
    }
  }
  objects.forEach(object => walk(object));
}

function readinessGuards(docs) {
  assert.equal(rules(docs).length, 3, 'Three reviewed readiness rules');
  for (const object of rules(docs)) {
    assert.equal(object.apiVersion, 'readiness.node.x-k8s.io/v1alpha1');
    const spec = object.spec;
    assert.match(spec.taint.key, /^readiness\.k8s\.io\/.+/, 'Readiness taint prefix');
    assert.equal(spec.taint.effect, 'NoSchedule', 'Readiness guard must block new scheduling');
    assert.ok(['bootstrap-only', 'continuous'].includes(spec.enforcementMode));
    assert.ok(Array.isArray(spec.conditions) && spec.conditions.length);
    for (const condition of spec.conditions) {
      assert.equal(condition.requiredStatus, 'True');
      assert.match(condition.type, /^example\.com\/.+/, 'Authored custom reporter condition');
    }
  }
  const guard = rule(docs).spec.taint;
  const startup = pool(docs).spec.template.spec.startupTaints || [];
  const matches = startup.filter(taint => taint.key === guard.key);
  assert.equal(matches.length, 1, 'Exactly one matching startup readiness guard');
  assert.deepEqual(matches[0], guard, 'Registration taint and rule taint must agree');
}

function guardedSelectors(docs) {
  const name = pool(docs).metadata.name;
  assert.deepEqual(rule(docs).spec.nodeSelector, {'matchLabels': {'karpenter.sh/nodepool': name}},
    'Readiness rule must select the registered pool');
  for (const object of workloads(docs)) {
    assert.equal(podSpec(object).nodeSelector?.['karpenter.sh/nodepool'], name,
      'Guarded workload must select the guarded pool');
  }
}

function tolerates(toleration, taint) {
  const operator = toleration.operator || 'Equal';
  assert.ok(['Equal', 'Exists'].includes(operator), 'Invalid toleration operator');
  assert.ok(toleration.key || operator === 'Exists', 'Empty toleration key requires Exists');
  if (operator === 'Exists') assert.ok(!toleration.value, 'Exists must not carry a value');
  if (toleration.effect && toleration.effect !== taint.effect) return false;
  if (operator === 'Exists') return !toleration.key || toleration.key === taint.key;
  return toleration.key === taint.key && (toleration.value || '') === (taint.value || '');
}

function ordinaryWorkloads(docs) {
  const guard = rule(docs).spec.taint;
  for (const object of workloads(docs)) {
    for (const toleration of podSpec(object).tolerations || []) {
      assert.equal(tolerates(toleration, guard), false, 'Ordinary workload bypasses readiness guard');
    }
  }
  assert.deepEqual(one(docs.guarded_pod, 'Pod').spec.schedulingGates,
    [{name: 'example.com/dataset-ready'}], 'Dataset gate must remain independent of node readiness');
}

function autoscalerProtection(docs) {
  const containers = docs.autoscaler.flat();
  const matches = containers.filter(item => item.name === 'cluster-autoscaler');
  assert.equal(matches.length, 1, 'One existing CA container fragment');
  const command = matches[0].command;
  assert.ok(Array.isArray(command) && command[0] === './cluster-autoscaler');
  const flags = new Map();
  for (const argument of command.slice(1)) {
    assert.equal(typeof argument, 'string');
    const split = argument.indexOf('=');
    const key = split < 0 ? argument : argument.slice(0, split);
    assert.ok(!flags.has(key), `Duplicate CA flag: ${key}`);
    flags.set(key, split < 0 ? true : argument.slice(split + 1));
  }
  assert.equal(flags.get('--cloud-provider'), 'aws');
  for (const key of ['--skip-nodes-with-system-pods', '--skip-nodes-with-local-storage']) {
    assert.equal(flags.get(key), 'true', `CA protection disabled or missing: ${key}`);
  }
  assert.ok(!flags.has('--nodes'), 'Static --nodes must not bypass the authored discovery boundary');
  const discovery = flags.get('--node-group-auto-discovery');
  assert.ok(typeof discovery === 'string' && discovery.startsWith('asg:tag='), 'ASG tag discovery required');
  const tags = discovery.slice('asg:tag='.length).split(',');
  assert.equal(tags.length, 2, 'Enabled and cluster-specific ASG discovery tags required');
  assert.ok(tags.includes('k8s.io/cluster-autoscaler/enabled'), 'Missing enabled discovery tag');
  assert.ok(tags.some(tag => /^k8s\.io\/cluster-autoscaler\/[^,*=\s]+$/.test(tag)
    && tag !== 'k8s.io/cluster-autoscaler/enabled'), 'Missing cluster-specific discovery tag');
}

function eachLocale(callback) {
  for (const locale of locales) callback(sources[locale], locale);
}
function rejected(check, value, message) {
  assert.throws(() => check(value), {code: 'ERR_ASSERTION'}, message);
}

test('01 current KO/EN scoped YAML has the same parsed meaning', () => {
  assert.equal(Object.keys(sources.ko).length, 11);
  for (const key of Object.keys(sources.ko)) assert.deepEqual(sources.ko[key], sources.en[key], key);
});
test('02 every reviewed standalone NodePool has complete AWS provider refs', () => eachLocale(docs => {
  assert.equal(pools(docs).length, 7);
  providerRefs(pools(docs));
}));
test('03 consolidation uses the current enum and explicit delay', () => eachLocale(docs => {
  assert.ok(one(docs.migration_pool, 'NodePool').spec.disruption.consolidationPolicy);
  consolidation(pools(docs));
}));
test('04 expiration is exclusively under the NodePool template spec', () => eachLocale(docs => {
  assert.ok(one(docs.migration_pool, 'NodePool').spec.template.spec.expireAfter);
  expiration(pools(docs));
}));
test('05 startup readiness taint and custom reporter rule agree', () => eachLocale(readinessGuards));
test('06 rule and ordinary workloads target the registered GPU pool', () => eachLocale(guardedSelectors));
test('07 ordinary workloads cannot tolerate the guard; dataset gate remains', () => eachLocale(ordinaryWorkloads));
test('08 CA has bounded tag discovery and explicit scale-down safeguards', () => eachLocale(autoscalerProtection));

test('09 negative controls reject missing ref fields and mixed provider APIs', () => eachLocale(docs => {
  for (const field of ['group', 'kind', 'name']) {
    const bad = clone(pools(docs)[0]); delete bad.spec.template.spec.nodeClassRef[field];
    rejected(providerRefs, [bad], field);
  }
  for (const [key, value] of [['group', 'eks.amazonaws.com'], ['kind', 'NodeClass'], ['name', '']]) {
    const bad = clone(pools(docs)[0]); bad.spec.template.spec.nodeClassRef[key] = value;
    rejected(providerRefs, [bad], `${key}=${value}`);
  }
}));
test('10 negative controls reject old consolidation and misplaced expiration', () => eachLocale(docs => {
  const old = clone(one(docs.migration_pool, 'NodePool'));
  old.spec.disruption.consolidationPolicy = 'WhenUnderutilized';
  rejected(consolidation, [old], 'legacy enum');
  for (const location of ['spec', 'disruption']) {
    const bad = clone(one(docs.migration_pool, 'NodePool'));
    const value = bad.spec.template.spec.expireAfter; delete bad.spec.template.spec.expireAfter;
    (location === 'spec' ? bad.spec : bad.spec.disruption).expireAfter = value;
    rejected(expiration, [bad], location);
  }
}));
test('11 negative controls reject missing, mismatched and invalid readiness guards', () => eachLocale(docs => {
  for (const mutation of [
    bad => { delete pool(bad).spec.template.spec.startupTaints; },
    bad => { pool(bad).spec.template.spec.startupTaints[0].value = 'different'; },
    bad => { rule(bad).spec.taint.effect = 'PreferNoSchedule'; },
    bad => { rule(bad).spec.taint.key = 'example.com/unregistered-guard'; },
  ]) {
    const bad = clone(docs); mutation(bad); rejected(readinessGuards, bad);
  }
}));
test('12 negative controls reject broadened rule and unguarded workload selection', () => eachLocale(docs => {
  for (const mutation of [
    bad => { rule(bad).spec.nodeSelector = {}; },
    bad => { rule(bad).spec.nodeSelector.matchLabels['karpenter.sh/nodepool'] = 'other'; },
    bad => { delete one(bad.guarded_pod, 'Pod').spec.nodeSelector; },
    bad => { podSpec(one(bad.gpu_bundle, 'Job')).nodeSelector['karpenter.sh/nodepool'] = 'other'; },
  ]) {
    const bad = clone(docs); mutation(bad); rejected(guardedSelectors, bad);
  }
}));
test('13 negative controls reject matching, wildcard and invalid guard tolerations', () => eachLocale(docs => {
  const guard = rule(docs).spec.taint;
  for (const toleration of [
    {key: guard.key, operator: 'Exists', effect: 'NoSchedule'},
    {operator: 'Exists'},
    {key: guard.key, value: guard.value}, // Equal is the native default.
    {key: guard.key, operator: 'DoesNotExist'},
    {key: guard.key, operator: 'Exists', value: guard.value},
  ]) {
    const bad = clone(docs); one(bad.guarded_pod, 'Pod').spec.tolerations = [toleration];
    rejected(ordinaryWorkloads, bad);
  }
  const allowed = clone(docs);
  one(allowed.guarded_pod, 'Pod').spec.tolerations = [{key: 'unrelated', operator: 'Exists'}];
  ordinaryWorkloads(allowed); // Do not over-reject unrelated tolerations.
}));
test('14 negative controls reject disabled CA protections and widened discovery', () => eachLocale(docs => {
  for (const flag of ['--skip-nodes-with-system-pods', '--skip-nodes-with-local-storage']) {
    for (const mode of ['false', 'missing', 'duplicate']) {
      const bad = clone(docs), command = bad.autoscaler.flat()[0].command;
      const index = command.indexOf(`${flag}=true`);
      assert.ok(index >= 0, 'Negative-control mutation site');
      if (mode === 'missing') command.splice(index, 1);
      else if (mode === 'false') command[index] = `${flag}=false`;
      else command.push(`${flag}=false`);
      rejected(autoscalerProtection, bad, `${flag}/${mode}`);
    }
  }
  for (const argument of [
    '--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled',
    '--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/*',
    '--nodes=1:10:another-asg',
  ]) {
    const bad = clone(docs), command = bad.autoscaler.flat()[0].command;
    if (argument.startsWith('--node-group-auto-discovery=')) {
      command[command.findIndex(value => value.startsWith('--node-group-auto-discovery='))] = argument;
    } else command.push(argument);
    rejected(autoscalerProtection, bad, argument);
  }
}));
