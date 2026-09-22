'use strict';

// Authored shutdown routing contracts; no full schema, proxy or failover simulation.
// Only current source YAML is parsed. No example command or network request runs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const root = path.resolve(process.env.ISTIO_DOC_ROOT || process.cwd());
const deps = path.resolve(process.env.ISTIO_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(deps, 'package.json'))('js-yaml');
const locators = require('./istio-outlier-locators.json').locators.filter(row => row.document === 'shutdown');
const HOST = 'critical-api.production.svc.cluster.local';
const PRIORITY = ['topology.kubernetes.io/region', 'topology.kubernetes.io/zone'];
const clone = value => JSON.parse(JSON.stringify(value));

function extract(locator) {
  const lines = fs.readFileSync(path.join(root, locator.path), 'utf8').split(/\r?\n/);
  let heading = '', active, ordinal = 0, boundary = 0;
  const blocks = [];
  for (const [index, line] of lines.entries()) {
    if (active) {
      if (/^```\s*$/.test(line)) {
        blocks.push({...active, code: active.lines.join('\n')});
        active = undefined;
        boundary = index + 1;
      } else active.lines.push(line);
    } else if (line.startsWith('```')) {
      ordinal += 1;
      active = {heading, ordinal, language: line.slice(3).trim(), lines: [],
        context: lines.slice(boundary, index).join('\n')};
    } else if (/^#{1,6} /.test(line)) {
      heading = line;
      ordinal = 0;
      boundary = index;
    }
  }
  assert.equal(active, undefined, `${locator.path}: unclosed fence`);
  const found = blocks.filter(block => block.heading === locator.heading && block.ordinal === locator.ordinal);
  assert.equal(found.length, 1, `${locator.path}: missing/ambiguous routing fence`);
  assert.equal(found[0].language, 'yaml');
  return {locale: locator.locale, context: found[0].context,
    objects: yaml.loadAll(found[0].code).filter(Boolean)};
}
const sources = locators.map(extract);
const each = callback => sources.forEach(callback);
const dr = sample => sample.objects.find(object => object.kind === 'DestinationRule');
const vs = sample => sample.objects.find(object => object.kind === 'VirtualService');
const locality = sample => dr(sample).spec.trafficPolicy.loadBalancer.localityLbSetting;

function identity(sample) {
  assert.deepEqual(sample.objects.map(object => object.kind), ['DestinationRule', 'VirtualService']);
  assert.equal(dr(sample).metadata.name, 'critical-api-az-routing');
  assert.equal(vs(sample).metadata.name, 'critical-api-failover');
  for (const object of sample.objects) {
    assert.equal(object.apiVersion, 'networking.istio.io/v1beta1');
    assert.equal(object.metadata.namespace, 'production');
  }
  assert.equal(dr(sample).spec.host, HOST);
  assert.deepEqual(vs(sample).spec.hosts, [HOST]);
}
function localityContract(sample) {
  const loadBalancer = dr(sample).spec.trafficPolicy.loadBalancer;
  assert.ok(!Object.hasOwn(loadBalancer, 'simple'),
    'Preserve the pre-existing load-balancing default while correcting locality');
  assert.equal(loadBalancer.zoneAwareLbSetting, undefined, 'This uses the distinct localityLbSetting API');
  const policy = locality(sample);
  assert.equal(policy.enabled, true);
  assert.deepEqual(policy.failoverPriority, PRIORITY);
  assert.equal(policy.distribute, undefined);
  assert.equal(policy.failover, undefined);
  const outlier = dr(sample).spec.trafficPolicy.outlierDetection;
  assert.ok(outlier, 'Locality failover priority requires outlier detection');
  assert.equal(outlier.consecutive5xxErrors, 3);
  assert.equal(outlier.consecutiveErrors, undefined, 'Authored policy avoids the deprecated compatibility field');
  assert.equal(outlier.interval, '10s');
  assert.equal(outlier.baseEjectionTime, '30s');
  assert.equal(outlier.maxEjectionPercent, 50);
}
function routeContract(sample) {
  assert.equal(dr(sample).spec.subsets, undefined);
  const routes = vs(sample).spec.http;
  assert.equal(routes.length, 1);
  assert.equal(routes[0].match, undefined, 'No unsupported source-label assumption');
  assert.equal(routes[0].route.length, 1);
  assert.deepEqual(routes[0].route[0], {destination: {host: HOST}},
    'One direct Service destination; no subset, fixed zone weighting or invented port');
  for (const key of ['redirect', 'rewrite', 'delegate', 'mirror', 'fault']) {
    assert.equal(routes[0][key], undefined, `No added ${key} operation`);
  }
}
function boundaryContract(sample) {
  identity(sample);
  for (const object of sample.objects) assert.deepEqual(object.spec.exportTo, ['.']);
  assert.deepEqual(vs(sample).spec.gateways, ['mesh']);
  assert.equal(dr(sample).spec.trafficPolicy.tls, undefined, 'Do not change the existing TLS contract');
  assert.equal(dr(sample).spec.workloadSelector, undefined);
  assert.ok(sample.context.includes('AuthorizationPolicy') && sample.context.includes('mTLS'),
    'Keep the separate authorization/authentication prerequisite');
}
function priorityDiagnostic(keys, client, endpoint) {
  // A small documentation fixture for ordered label matching, not Envoy behavior.
  if (keys.some(key => !client[key] || !endpoint[key])) return {status: 'unknown'};
  let matched = 0;
  for (const key of keys) {
    if (client[key] !== endpoint[key]) break;
    matched += 1;
  }
  return {status: 'known_metadata', priority: keys.length - matched};
}
const rejects = callback => assert.throws(callback, {code: 'ERR_ASSERTION'});

test('01 actual KO/EN routing objects have the same parsed meaning', () => {
  assert.equal(sources.length, 2);
  assert.deepEqual(sources[0].objects, sources[1].objects);
});
test('02 policies retain production namespace and actual critical-api identities', () => each(identity));
test('03 one explicit region/zone locality strategy has the required outlier policy', () => each(localityContract));
test('04 VirtualService uses one direct Service route without subsets or source labels', () => each(routeContract));
test('05 policy visibility is production-local and mesh-only, with no auth/TLS mutation', () => each(boundaryContract));
test('06 retry values are retained as configuration, not a completion guarantee', () => each(sample => {
  const http = vs(sample).spec.http[0];
  assert.equal(http.timeout, '3s');
  assert.deepEqual(http.retries, {attempts: 3, perTryTimeout: '1s'});
}));
test('07 metadata fixture distinguishes same-zone, same-region and other-region priorities', () => each(sample => {
  const keys = locality(sample).failoverPriority;
  const client = {[keys[0]]: 'ap-northeast-2', [keys[1]]: 'ap-northeast-2a'};
  const same = {...client};
  const otherZone = {...client, [keys[1]]: 'ap-northeast-2b'};
  const otherRegion = {[keys[0]]: 'us-east-1', [keys[1]]: 'us-east-1a'};
  assert.deepEqual([same, otherZone, otherRegion].map(endpoint => priorityDiagnostic(keys, client, endpoint).priority), [0, 1, 2]);
}));
test('08 incomplete locality evidence is unknown, not reported as successful local routing', () => each(sample => {
  const keys = locality(sample).failoverPriority;
  assert.deepEqual(priorityDiagnostic(keys, {[keys[0]]: 'ap-northeast-2'}, {}), {status: 'unknown'});
}));
test('09 negative controls reject mixed locality strategies and reversed priority', () => each(sample => {
  for (const key of ['distribute', 'failover']) {
    const bad = clone(sample);
    locality(bad)[key] = [];
    rejects(() => localityContract(bad));
  }
  const reversed = clone(sample);
  locality(reversed).failoverPriority.reverse();
  rejects(() => localityContract(reversed));
}));
test('10 negative controls reject the distinct zone-aware API or missing outlier policy', () => each(sample => {
  const wrongAPI = clone(sample);
  dr(wrongAPI).spec.trafficPolicy.loadBalancer.zoneAwareLbSetting = {enabled: true};
  rejects(() => localityContract(wrongAPI));
  const absent = clone(sample);
  delete dr(absent).spec.trafficPolicy.outlierDetection;
  rejects(() => localityContract(absent));
}));
test('11 negative controls reject deprecated or disabled authored error thresholds', () => each(sample => {
  const legacy = clone(sample);
  dr(legacy).spec.trafficPolicy.outlierDetection.consecutiveErrors = 3;
  rejects(() => localityContract(legacy));
  const disabled = clone(sample);
  dr(disabled).spec.trafficPolicy.outlierDetection.consecutive5xxErrors = 0;
  rejects(() => localityContract(disabled));
}));
test('12 negative controls reject reintroduced undefined subsets and client-zone selectors', () => each(sample => {
  const subset = clone(sample);
  vs(subset).spec.http[0].route[0].destination.subset = 'az-b';
  rejects(() => routeContract(subset));
  const labels = clone(sample);
  vs(labels).spec.http[0].match = [{sourceLabels: {'topology.kubernetes.io/zone': 'ap-northeast-2a'}}];
  rejects(() => routeContract(labels));
}));
test('13 negative controls reject weighted split routing or a changed destination host', () => each(sample => {
  const split = clone(sample);
  vs(split).spec.http[0].route.push({destination: {host: HOST}, weight: 50});
  rejects(() => routeContract(split));
  const host = clone(sample);
  vs(host).spec.http[0].route[0].destination.host = 'critical-api.default.svc.cluster.local';
  rejects(() => routeContract(host));
}));
test('14 negative controls reject widened visibility, ingress gateways or wrong namespace', () => each(sample => {
  for (const kind of ['DestinationRule', 'VirtualService']) {
    const bad = clone(sample);
    bad.objects.find(object => object.kind === kind).spec.exportTo = ['*'];
    rejects(() => boundaryContract(bad));
  }
  const gateway = clone(sample);
  vs(gateway).spec.gateways = ['public-ingress'];
  rejects(() => boundaryContract(gateway));
  const namespace = clone(sample);
  dr(namespace).metadata.namespace = 'default';
  rejects(() => boundaryContract(namespace));
}));
test('15 negative controls reject added authorization resources or TLS mode changes', () => each(sample => {
  const grant = clone(sample);
  grant.objects.push({kind: 'AuthorizationPolicy', spec: {action: 'ALLOW'}});
  rejects(() => boundaryContract(grant));
  const tls = clone(sample);
  dr(tls).spec.trafficPolicy.tls = {mode: 'DISABLE'};
  rejects(() => boundaryContract(tls));
}));
test('16 negative control keeps authorization separate from routing visibility', () => each(sample => {
  const bad = clone(sample);
  bad.context = bad.context.replaceAll('AuthorizationPolicy', '').replaceAll('mTLS', '');
  rejects(() => boundaryContract(bad));
}));
test('17 locality corrections do not introduce a load-balancing algorithm override', () => each(sample => {
  localityContract(sample);
  const bad = clone(sample);
  dr(bad).spec.trafficPolicy.loadBalancer.simple = 'ROUND_ROBIN';
  assert.throws(() => localityContract(bad), error =>
    error.code === 'ERR_ASSERTION' && error.message.includes('pre-existing load-balancing default'));
}));
