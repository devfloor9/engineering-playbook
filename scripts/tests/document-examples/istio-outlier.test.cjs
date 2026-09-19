'use strict';

// Four authored source contracts, not a generic Istio CRD validator.
// In particular, Istio 1.27 CRDs still accept the deprecated consecutiveErrors.
// Existing js-yaml only; examples are parsed as data and never executed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const root = path.resolve(process.env.ISTIO_DOC_ROOT || process.cwd());
const deps = path.resolve(process.env.ISTIO_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(deps, 'package.json'))('js-yaml');
const locators = require('./istio-outlier-locators.json').locators;
const clone = value => JSON.parse(JSON.stringify(value));

function extract(locator) {
  const text = fs.readFileSync(path.join(root, locator.path), 'utf8');
  const lines = text.split(/\r?\n/), blocks = [], counts = new Map();
  let heading = '', active, boundary = 0;
  for (const [index, line] of lines.entries()) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (active) {
      if (marker && marker[1][0] === active.marker[0] && marker[1].length >= active.marker.length && !marker[2].trim()) {
        blocks.push({...active, code: active.lines.join('\n')});
        active = undefined;
        boundary = index + 1;
      } else active.lines.push(line);
    } else if (marker) {
      counts.set(heading, (counts.get(heading) || 0) + 1);
      active = {heading, ordinal: counts.get(heading), language: marker[2].trim(),
        marker: marker[1], lines: [], context: lines.slice(boundary, index).join('\n')};
    } else if (/^#{1,6} /.test(line)) {
      heading = line;
      boundary = index;
    }
  }
  assert.equal(active, undefined, `${locator.path}: unclosed fence`);
  const found = blocks.filter(block => block.heading === locator.heading && block.ordinal === locator.ordinal);
  assert.equal(found.length, 1, `${locator.path}: missing/ambiguous outlier fence`);
  assert.equal(found[0].language, locator.language);
  const objects = yaml.loadAll(found[0].code).filter(value => value != null);
  const rule = objects.filter(object => object.kind === 'DestinationRule' && object.metadata?.name === locator.name);
  assert.equal(rule.length, 1, `${locator.path}: DestinationRule identity changed`);
  return {...locator, ...found[0], objects};
}
const sources = locators.map(extract);
const each = callback => sources.forEach(callback);
const rule = sample => sample.objects.find(object => object.kind === 'DestinationRule');
const outlier = sample => rule(sample).spec.trafficPolicy.outlierDetection;

function policyContract(sample) {
  assert.equal(rule(sample).apiVersion, 'networking.istio.io/v1beta1',
    'This bounded change preserves the declared API version');
  const policy = outlier(sample);
  assert.ok(!Object.hasOwn(policy, 'consecutiveErrors'),
    'The authored policy uses the documented setting, not the deprecated compatibility field');
  assert.ok(!Object.hasOwn(policy, 'consecutive_5xx_errors'), 'Use the Kubernetes JSON field spelling');
  assert.ok(Number.isInteger(policy.consecutive5xxErrors) && policy.consecutive5xxErrors > 0,
    'This example selects an enabled positive threshold; zero would disable it');
  assert.equal(policy.consecutive5xxErrors, sample.threshold, 'Preserve the reviewed threshold');
}

function routingGaps(objects) {
  // This is a reference check for these fragments, not a general locality/schema validator.
  const destinationRule = objects.find(object => object.kind === 'DestinationRule');
  const virtualService = objects.find(object => object.kind === 'VirtualService');
  const defined = new Set((destinationRule.spec.subsets || []).map(subset => subset.name));
  const routes = (virtualService?.spec.http || []).flatMap(http => http.route || []);
  const missingSubsets = [...new Set(routes.map(route => route.destination.subset)
    .filter(name => name && !defined.has(name)))];
  const distribution = destinationRule.spec.trafficPolicy.loadBalancer?.localityLbSetting?.distribute || [];
  const localities = distribution.flatMap(item => [item.from, ...Object.keys(item.to || {})]);
  const azInRegionPosition = localities.filter(value => /^ap-northeast-2[abc]\//.test(value));
  const unverifiedClientLabels = (virtualService?.spec.http || []).flatMap(http => http.match || [])
    .some(match => match.sourceLabels?.['topology.kubernetes.io/zone']);
  return {missingSubsets, azInRegionPosition, unverifiedClientLabels};
}

function applicabilityContract(sample) {
  assert.ok(sample.context.includes(sample.qualification_marker), 'Keep the explicit applicability paragraph');
  assert.ok(sample.context.includes('1.27.0') && sample.context.includes('CRD'),
    'State the inspected version/API reference without asserting an installation');
  if (sample.document === 'ddd') {
    for (const term of ['ServiceEntry', 'TLS', 'HTTPS']) assert.ok(sample.context.includes(term), `Missing ${term} prerequisite`);
    const incomplete = /not a standalone runnable|독립 실행용 배포 예제가 아닙니다/.test(sample.context);
    const separateSetup = /부분 예시|only the outlier-detection portion/.test(sample.context) &&
      /별도로 준비|prepare[\s\S]*separately/i.test(sample.context);
    assert.ok(incomplete || separateSetup,
      'Disclose that host registration and TLS setup are outside the supplied snippet');
  } else {
    const gaps = routingGaps(sample.objects);
    if (gaps.missingSubsets.length || gaps.azInRegionPosition.length || gaps.unverifiedClientLabels) {
      assert.match(sample.context, /not runnable|그대로 적용할 수 없습니다/,
        'Unresolved routing fragments must not be presented as deployable');
    }
    if (gaps.azInRegionPosition.length) assert.ok(sample.context.includes('region/zone/subzone'));
    if (gaps.missingSubsets.length) gaps.missingSubsets.forEach(name => assert.ok(sample.context.includes(name)));
    if (gaps.unverifiedClientLabels) assert.ok(sample.context.includes('sourceLabels'));
  }
}
const rejects = callback => assert.throws(callback, {code: 'ERR_ASSERTION'});

test('01 paired DDD and shutdown examples have identical parsed KO/EN meaning', () => {
  for (const document of ['ddd', 'shutdown']) {
    const pair = sources.filter(sample => sample.document === document);
    assert.equal(pair.length, 2);
    assert.deepEqual(pair[0].objects, pair[1].objects);
  }
});
test('02 each intended DestinationRule and host is extracted from its actual source fence', () => each(sample => {
  const expected = sample.document === 'ddd' ? 'external-payment-gateway.com' : 'critical-api.production.svc.cluster.local';
  assert.equal(rule(sample).spec.host, expected);
  assert.equal(sample.objects.length, sample.document === 'ddd' ? 1 : 2);
}));
test('03 preserve v1beta1 while selecting the documented enabled outlier setting', () => each(policyContract));
test('04 retain the distinct five-error and three-error authored thresholds', () => each(sample => {
  assert.equal(outlier(sample).consecutive5xxErrors, sample.document === 'ddd' ? 5 : 3);
}));
test('05 retain configured sweep, minimum-ejection duration and explicit ejection cap', () => each(sample => {
  const policy = outlier(sample);
  assert.equal(policy.interval, sample.document === 'ddd' ? '30s' : '10s');
  assert.equal(policy.baseEjectionTime, sample.document === 'ddd' ? '60s' : '30s');
  assert.equal(policy.maxEjectionPercent, sample.document === 'ddd' ? undefined : 50);
}));
test('06 external-host policies retain registry and protocol/TLS applicability boundaries', () => {
  sources.filter(sample => sample.document === 'ddd').forEach(applicabilityContract);
});
test('07 unresolved locality/subset/client-label gaps require a not-runnable qualification', () => {
  sources.filter(sample => sample.document === 'shutdown').forEach(applicabilityContract);
});
test('08 bounded reference checker distinguishes missing subsets from defined subsets', () => {
  const sample = sources.find(item => item.document === 'shutdown');
  const fixture = clone(sample.objects);
  const dr = fixture.find(object => object.kind === 'DestinationRule');
  const vs = fixture.find(object => object.kind === 'VirtualService');
  vs.spec.http[0].route[0].destination.subset = 'fixture-missing-subset';
  dr.spec.subsets = [];
  assert.ok(routingGaps(fixture).missingSubsets.includes('fixture-missing-subset'));
  dr.spec.subsets = routingGaps(fixture).missingSubsets.map(name => ({name}));
  assert.deepEqual(routingGaps(fixture).missingSubsets, []);
  // This fixture only checks name references; it does not establish real workload labels or routing.
});
test('09 negative controls reject deprecated, misspelled or absent authored settings', () => each(sample => {
  for (const key of ['consecutiveErrors', 'consecutive_5xx_errors', undefined]) {
    const bad = clone(sample), policy = outlier(bad);
    delete policy.consecutive5xxErrors;
    if (key) policy[key] = sample.threshold;
    rejects(() => policyContract(bad));
  }
}));
test('10 negative controls reject disabled or changed authored threshold values', () => each(sample => {
  for (const value of [0, -1, 2.5, '5', true, 4294967296]) {
    const bad = clone(sample);
    outlier(bad).consecutive5xxErrors = value;
    rejects(() => policyContract(bad));
  }
}));
test('11 negative controls reject removed applicability and external TLS prerequisites', () => each(sample => {
  const missing = clone(sample);
  missing.context = '';
  rejects(() => applicabilityContract(missing));
  if (sample.document === 'ddd') {
    const tls = clone(sample);
    tls.context = tls.context.replaceAll('TLS', '');
    rejects(() => applicabilityContract(tls));
  }
}));
test('12 negative controls reject deployable framing for known unresolved routing fragments', () => {
  sources.filter(sample => sample.document === 'shutdown').forEach(sample => {
    const bad = clone(sample);
    // Inject an unresolved reference; the actual document may now be corrected.
    rule(bad).spec.subsets = [];
    bad.objects.find(object => object.kind === 'VirtualService')
      .spec.http[0].route[0].destination.subset = 'fixture-missing-subset';
    bad.context = bad.context.replace('not runnable', 'deployable').replace('그대로 적용할 수 없습니다', '적용할 수 있습니다');
    rejects(() => applicabilityContract(bad));
  });
});
test('13 external policy disclosure accepts separate-setup wording and rejects its omission', () => {
  sources.filter(sample => sample.document === 'ddd').forEach(sample => {
    applicabilityContract(sample);
    const missing = clone(sample);
    missing.context = sample.qualification_marker + ' Istio 1.27.0 CRD ServiceEntry TLS HTTPS.';
    assert.throws(() => applicabilityContract(missing), error =>
      error.code === 'ERR_ASSERTION' && error.message.includes('outside the supplied snippet'));
  });
});
