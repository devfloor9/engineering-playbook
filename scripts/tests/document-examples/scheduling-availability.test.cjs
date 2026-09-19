'use strict';

// Authored contracts and prequalified topology fixtures, not a scheduler or API server.
// Existing js-yaml only. Source snippets are parsed as data and never executed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const root = path.resolve(process.env.SCHEDULING_DOC_ROOT || process.cwd());
const deps = path.resolve(process.env.SCHEDULING_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(deps, 'package.json'))('js-yaml');
const catalog = require('./scheduling-availability-locators.json');
const copy = value => JSON.parse(JSON.stringify(value));

function extract(locale) {
  const text = fs.readFileSync(path.join(root, catalog.documents[locale]), 'utf8');
  const blocks = [], counts = new Map();
  let heading = '', active;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (active) {
      if (marker && marker[1][0] === active.marker[0] && marker[1].length >= active.marker.length && !marker[2].trim()) {
        blocks.push({...active, code: active.lines.join('\n')});
        active = undefined;
      } else active.lines.push(line);
    } else if (marker) {
      counts.set(heading, (counts.get(heading) || 0) + 1);
      active = {heading, ordinal: counts.get(heading), language: marker[2].trim(),
        marker: marker[1], line: index + 1, lines: []};
    } else if (/^#{1,6} /.test(line)) heading = line;
  }
  assert.equal(active, undefined, 'Unclosed source fence');
  const result = {text};
  for (const locator of catalog.locators) {
    const headings = locator.headings[locale];
    const anchor = headings.map(value => value.match(/\{#([^}]+)\}$/)?.[1]).find(Boolean);
    const found = blocks.filter(block => block.ordinal === locator.ordinal
      && (headings.includes(block.heading) || (anchor && block.heading.endsWith(`{#${anchor}}`))));
    assert.equal(found.length, 1, `${locale}/${locator.key}: missing or ambiguous fence`);
    assert.equal(found[0].language, locator.language, `${locale}/${locator.key}: language changed`);
    result[locator.key] = locator.language === 'yaml'
      ? yaml.loadAll(found[0].code).filter(value => value != null) : found[0].code;
  }
  return result;
}
const sources = {ko: extract('ko'), en: extract('en')};
const each = callback => Object.entries(sources).forEach(([locale, docs]) => callback(docs, locale));
function one(values, kind, name) {
  const found = values.filter(value => value.kind === kind && (!name || value.metadata?.name === name));
  assert.equal(found.length, 1, `Expected one ${kind}/${name || ''}`);
  return found[0];
}
const deployment = (docs, key) => one(docs[key], 'Deployment');
const spreads = object => object.spec.template.spec.topologySpreadConstraints || [];
const matchLabels = (labels, selector) => Object.entries(selector.matchLabels || {})
  .every(([key, value]) => labels[key] === value);

function nativeContracts(docs) {
  for (const locator of catalog.locators.filter(row => row.language === 'yaml')) {
    assert.ok(docs[locator.key].length);
    for (const value of docs[locator.key]) {
      if (value.kind === 'Deployment') {
        assert.equal(value.apiVersion, 'apps/v1');
        assert.ok(Object.keys(value.spec.selector?.matchLabels || {}).length, 'Deployment selector required');
        assert.ok(matchLabels(value.spec.template.metadata.labels, value.spec.selector), 'Deployment labels must match');
        assert.ok(value.spec.template.spec.containers.length);
        value.spec.template.spec.containers.forEach(container => assert.ok(container.name && container.image));
      }
    }
  }
}
function topologyContract(constraint, labels) {
  assert.ok(Number.isInteger(constraint.maxSkew) && constraint.maxSkew > 0);
  assert.ok(['DoNotSchedule', 'ScheduleAnyway'].includes(constraint.whenUnsatisfiable));
  assert.ok(Object.keys(constraint.labelSelector?.matchLabels || {}).length, 'Explicit selected-Pod set required');
  assert.ok(matchLabels(labels, constraint.labelSelector), 'Incoming Pod must match this authored selector');
  if (constraint.minDomains !== undefined) {
    assert.ok(Number.isInteger(constraint.minDomains) && constraint.minDomains > 0);
    assert.equal(constraint.whenUnsatisfiable, 'DoNotSchedule', 'minDomains is only valid with Hard spread');
  }
}
function selectedCount(pods, namespace, selector) {
  return pods.filter(pod => (pod.metadata.namespace || 'default') === namespace
    && matchLabels(pod.metadata.labels || {}, selector)).length;
}
function skewAllows(constraint, eligibleCounts, candidate) {
  // Counts already reflect eligibility and same-namespace selector matching.
  // Other filters, health, taint inclusion and resource capacity are not simulated.
  assert.ok(Object.hasOwn(eligibleCounts, candidate));
  if (constraint.whenUnsatisfiable === 'ScheduleAnyway') return true;
  const counts = Object.values(eligibleCounts);
  const minimum = counts.length < (constraint.minDomains || 1) ? 0 : Math.min(...counts);
  return eligibleCounts[candidate] + 1 - minimum <= constraint.maxSkew;
}
function dbPreference(docs) {
  const spec = deployment(docs, 'db_client').spec.template.spec;
  assert.equal(spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution, undefined,
    'Do not hard-pin every database client to the initially observed writer AZ');
  const preferences = spec.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution;
  assert.ok(preferences.length);
  assert.ok(preferences[0].weight > 0 && preferences[0].weight <= 100);
  assert.equal(preferences[0].preference.matchExpressions[0].key, 'topology.kubernetes.io/zone');
  const endpoint = spec.containers[0].env.find(item => item.name === 'DB_ENDPOINT').value;
  assert.ok(endpoint && !endpoint.includes('.us-east-1a.rds.amazonaws.com'), 'Use an explicit real-endpoint input');
}
function arcContract(docs) {
  const pool = one(docs.arc_workload, 'NodePool');
  assert.equal(pool.apiVersion, 'karpenter.sh/v1');
  const ref = pool.spec.template.spec.nodeClassRef;
  assert.equal(ref?.group, 'karpenter.k8s.aws');
  assert.equal(ref?.kind, 'EC2NodeClass');
  assert.ok(ref?.name);
  const app = one(docs.arc_workload, 'Deployment');
  const zone = spreads(app).find(item => item.topologyKey === 'topology.kubernetes.io/zone');
  assert.equal(zone.whenUnsatisfiable, 'ScheduleAnyway', 'Authored recovery example must avoid Hard AZ skew rejection');
  assert.equal(zone.minDomains, undefined);
  const pdb = one(docs.arc_workload, 'PodDisruptionBudget');
  assert.equal(pdb.apiVersion, 'policy/v1');
  assert.ok(matchLabels(app.spec.template.metadata.labels, pdb.spec.selector));
}
function meshContract(docs) {
  const rule = one(docs.mesh, 'DestinationRule');
  const policy = rule.spec.trafficPolicy;
  assert.deepEqual(policy.loadBalancer.localityLbSetting.failoverPriority,
    ['topology.kubernetes.io/region', 'topology.kubernetes.io/zone']);
  for (const alternative of ['failover', 'distribute']) {
    assert.equal(policy.loadBalancer.localityLbSetting[alternative], undefined, 'One locality strategy only');
  }
  assert.equal(policy.outlierDetection.consecutiveErrors, undefined, 'Removed outlier field');
  assert.ok(policy.outlierDetection.consecutive5xxErrors > 0);
  assert.equal(rule.spec.subsets, undefined, 'This example does not supply Pod AZ subset labels');
  const routes = one(docs.mesh, 'VirtualService').spec.http[0].route;
  assert.equal(routes.length, 1, 'Do not statically exclude AZ 1a with two weighted subsets');
  assert.equal(routes[0].destination.host, rule.spec.host);
  assert.equal(routes[0].destination.subset, undefined);
}
function alarmContract(docs) {
  const alarm = JSON.parse(one(docs.alarm, 'ConfigMap').data['alarm.json']);
  assert.equal(alarm.Namespace, 'AWS/ApplicationELB');
  assert.equal(alarm.MetricName, 'TargetResponseTime');
  assert.equal(alarm.Unit, 'Seconds');
  const dimensions = Object.fromEntries(alarm.Dimensions.map(item => [item.Name, item.Value]));
  assert.equal(alarm.Dimensions.length, 2);
  assert.deepEqual(Object.keys(dimensions).sort(), ['AvailabilityZone', 'LoadBalancer']);
  assert.match(dimensions.LoadBalancer, /^app\/[^/*]+\/[0-9a-f]{16}$/, 'Use the published ALB metric suffix');
  assert.ok(dimensions.AvailabilityZone && !dimensions.AvailabilityZone.includes('*'));
  assert.equal(alarm.ActionsEnabled, false, 'The illustrative definition does not attach automated actions');
  assert.ok(!alarm.AlarmActions?.length);
  assert.equal(alarm.TreatMissingData, 'missing');
  return alarm;
}
const reject = (check, docs) => assert.throws(() => check(docs), {code: 'ERR_ASSERTION'});

test('01 actual KO/EN YAML examples have matching parsed meanings', () => {
  for (const row of catalog.locators.filter(row => row.language === 'yaml')) {
    assert.deepEqual(sources.ko[row.key], sources.en[row.key], row.key);
  }
});
test('02 database clients express a static preference, not hard writer-AZ pinning', () => each(dbPreference));
test('03 native Deployments retain matching selectors and application containers', () => each(nativeContracts));
test('04 topology fields and incoming-Pod selector matching are valid', () => each(docs => {
  for (const row of catalog.locators.filter(row => row.language === 'yaml')) {
    for (const object of docs[row.key].filter(value => value.kind === 'Deployment')) {
      spreads(object).forEach(c => topologyContract(c, object.spec.template.metadata.labels));
    }
  }
}));
test('05 topology counts exclude other namespaces and unrelated applications', () => each(docs => {
  const app = deployment(docs, 'minimum_domains'), selector = spreads(app)[0].labelSelector;
  const pod = (namespace, labels) => ({metadata: {namespace, labels}});
  assert.equal(selectedCount([pod('production', app.spec.template.metadata.labels),
    pod('another-namespace', app.spec.template.metadata.labels),
    pod('production', {app: 'unrelated'})], 'production', selector), 1);
}));
test('06 fewer than minDomains does not prevent every first placement', () => each(docs => {
  const c = spreads(deployment(docs, 'minimum_domains'))[0];
  assert.equal(skewAllows(c, {a: 0, b: 0}, 'a'), true);
  assert.equal(skewAllows(c, {a: 1, b: 0}, 'b'), true);
}));
test('07 two populated domains use a zero minimum with minDomains 3', () => each(docs => {
  const c = spreads(deployment(docs, 'minimum_domains'))[0];
  assert.equal(c.minDomains, 3);
  assert.equal(skewAllows(c, {a: 2, b: 2}, 'a'), false);
  assert.equal(skewAllows(c, {a: 2, b: 2}, 'b'), false);
}));
test('08 three eligible domains use their smallest selected-Pod count', () => each(docs => {
  const c = spreads(deployment(docs, 'minimum_domains'))[0];
  assert.equal(skewAllows(c, {a: 2, b: 2, c: 1}, 'c'), true);
  assert.equal(skewAllows(c, {a: 2, b: 2, c: 1}, 'a'), false);
}));
test('09 Soft hostname maxSkew does not become a hard per-AZ cap', () => each(docs => {
  const c = spreads(deployment(docs, 'multiple_spread')).find(x => x.topologyKey === 'kubernetes.io/hostname');
  assert.equal(c.whenUnsatisfiable, 'ScheduleAnyway');
  assert.equal(skewAllows(c, {n1: 9, n2: 0}, 'n1'), true);
}));
test('10 a Soft hostname preference cannot override a Hard AZ rejection', () => each(docs => {
  const constraints = spreads(deployment(docs, 'multiple_spread'));
  assert.equal(skewAllows(constraints[0], {a: 8, b: 3, c: 3}, 'a'), false);
  assert.equal(skewAllows(constraints[1], {n1: 0, n2: 9}, 'n1'), true);
}));
test('11 ARC companion objects use complete refs and Soft AZ spread', () => each(docs => {
  arcContract(docs);
  const c = spreads(one(docs.arc_workload, 'Deployment'))[0];
  assert.equal(skewAllows(c, {a: 3, b: 3}, 'a'), true);
}));
test('12 hostname anti-affinity supplies an upper bound, not availability', () => each(docs => {
  const app = deployment(docs, 'combined');
  const rule = app.spec.template.spec.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[0];
  assert.equal(rule.topologyKey, 'kubernetes.io/hostname');
  assert.ok(app.spec.replicas > new Set(['n1', 'n2', 'n3']).size,
    'Three otherwise-eligible hostnames cannot host all twelve selected replicas');
}));
test('13 Istio uses a supported locality strategy and outlier field', () => each(meshContract));
test('14 mesh routes retain the Service host instead of permanently excluding an AZ', () => each(docs => {
  const routes = one(docs.mesh, 'VirtualService').spec.http[0].route;
  assert.equal(routes.length, 1);
  assert.equal(routes[0].destination.subset, undefined);
}));
test('15 stored alarm definitions identify the ALB and AZ without automated actions', () => each(alarmContract));
test('16 diagrams distinguish ARC traffic changes from eviction and custom automation', () => each(docs => {
  assert.ok(docs.arc_diagram.includes('Karpenter->>ARC'));
  assert.ok(docs.arc_diagram.includes('EKS->>Endpoints'));
  assert.doesNotMatch(docs.arc_diagram, /Karpenter->>AZ|Allow safe Eviction|CloudWatch|2-3/);
  assert.ok(docs.network_diagram.includes('ALERT --> REVIEW'));
}));
test('17 renamed misleading headings retain their original route anchors', () => each((docs, locale) => {
  const anchors = locale === 'ko'
    ? ['패턴-2-mindomains-활용-최소-az-보장', '103-arc--karpenter-통합-az-대피']
    : ['pattern-2-using-mindomains-minimum-az-guarantee', '103-az-evacuation-with-arc--karpenter-integration'];
  anchors.forEach(anchor => assert.equal(docs.text.split(`{#${anchor}}`).length - 1, 1));
}));
test('18 negative control rejects reintroduced database hard pinning', () => each(docs => {
  const bad = copy(docs);
  deployment(bad, 'db_client').spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution = {};
  reject(dbPreference, bad);
}));
test('19 negative controls reject Soft minDomains and the old ARC hard-domain policy', () => each(docs => {
  const app = one(docs.arc_workload, 'Deployment');
  const invalid = {...spreads(app)[0], minDomains: 3};
  assert.throws(() => topologyContract(invalid, app.spec.template.metadata.labels), {code: 'ERR_ASSERTION'});
  const bad = copy(docs), c = spreads(one(bad.arc_workload, 'Deployment'))[0];
  c.whenUnsatisfiable = 'DoNotSchedule'; c.minDomains = 3;
  assert.equal(skewAllows(c, {a: 3, b: 3}, 'a'), false);
  reject(arcContract, bad);
}));
test('20 negative controls reject old Istio fields and static AZ subsets', () => each(docs => {
  for (const mutation of [
    bad => { one(bad.mesh, 'DestinationRule').spec.trafficPolicy.loadBalancer.localityLbSetting.failover = [{from: 'us-east-1a', to: 'us-east-1b'}]; },
    bad => { const outlier = one(bad.mesh, 'DestinationRule').spec.trafficPolicy.outlierDetection; outlier.consecutiveErrors = 5; delete outlier.consecutive5xxErrors; },
    bad => { one(bad.mesh, 'VirtualService').spec.http[0].route[0].destination.subset = 'az-1b'; },
  ]) {
    const bad = copy(docs); mutation(bad); reject(meshContract, bad);
  }
}));
test('21 negative controls reject missing metric identity and silently enabled actions', () => each(docs => {
  for (const mutation of [
    alarm => { alarm.Dimensions = alarm.Dimensions.filter(d => d.Name !== 'LoadBalancer'); },
    alarm => { alarm.Dimensions.find(d => d.Name === 'LoadBalancer').Value = '*'; },
    alarm => { delete alarm.ActionsEnabled; },
    alarm => { alarm.TreatMissingData = 'notBreaching'; },
  ]) {
    const bad = copy(docs), map = one(bad.alarm, 'ConfigMap'), alarm = JSON.parse(map.data['alarm.json']);
    mutation(alarm); map.data['alarm.json'] = JSON.stringify(alarm); reject(alarmContract, bad);
  }
}));
test('22 negative controls reject selector mismatch and incomplete provider references', () => each(docs => {
  const bad = copy(docs);
  deployment(bad, 'db_client').spec.template.metadata.labels.app = 'unmatched';
  reject(nativeContracts, bad);
  const badPool = copy(docs);
  delete one(badPool.arc_workload, 'NodePool').spec.template.spec.nodeClassRef.group;
  reject(arcContract, badPool);
}));
