const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {test} = require('node:test');
const {analyze, statistics, declaredFeature} =
  require('../benchmarks/gateway-api-benchmark/analyze-conformance.cjs');
const sourceDirectory = path.join(__dirname, '../benchmarks/gateway-api-benchmark/results/upstream');

test('partial reports retain skipped tests and never become performance results', () => {
  const output = analyze();
  assert.equal(output.verified_source_files, 10);
  assert.equal(output.profiles_analyzed, 27);
  assert.ok(output.reports.every(report => report.rank_eligible === false && report.performance_measurements === null));
  const aws = output.reports.find(report => report.id === 'aws-lbc');
  assert.equal(aws.cohort, 'supplemental-not-comparable-release');
  assert.equal(aws.profiles[0].core.result, 'partial');
  assert.equal(aws.profiles[0].core.skipped, 10);
  assert.equal(aws.profiles[0].core.skipped_tests.length, 10);
  const cilium = output.reports.find(report => report.id === 'cilium');
  assert.equal(cilium.reported_version, '1.19.0-pre.2');
  assert.deepEqual(cilium.source_metadata_issues, [{
    field: 'apiVersion', problem: 'missing_or_empty', similar_keys: ['<Right>apiVersion'],
  }]);
  assert.ok(output.reports.filter(report => report.id !== 'cilium')
    .every(report => report.source_metadata_issues.length === 0));
  // Matching bytes and valid profile arithmetic do not imply valid source metadata.
  assert.match(fs.readFileSync(path.join(sourceDirectory, 'cilium.yaml'), 'utf8'), /^<Right>apiVersion:/);
});

test('misattributed source URLs and inconsistent cohort catalogs are rejected', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gateway-conformance-catalog-'));
  try {
    fs.cpSync(sourceDirectory, temporary, {recursive: true});
    const manifestPath = path.join(temporary, 'sources.json');
    const baseline = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const mutations = [
      [manifest => { manifest.reports[0].raw_yaml_url = manifest.reports[2].raw_yaml_url; }, /Report URL/],
      [manifest => { manifest.reports[0].raw_yaml_url += '?different-source'; }, /Report URL/],
      [manifest => { manifest.selected_cohort.members.push('aws-lbc'); }, /Cohort membership/],
      [manifest => { manifest.selected_cohort.members.push('envoy-gateway'); }, /Duplicate cohort/],
      [manifest => { manifest.selected_cohort.separate_managed_track.push('envoy-gateway'); }, /Cohort membership/],
      [manifest => { manifest.reports[0].cohort = 'same-release-unknown'; }, /Unknown cohort/],
    ];
    for (const [mutate, message] of mutations) {
      const manifest = JSON.parse(JSON.stringify(baseline));
      mutate(manifest);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      assert.throws(() => analyze(temporary), message);
    }
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
});

test('omitted feature declarations stay unknown and explicit unsupported stays scoped', () => {
  assert.equal(declaredFeature(undefined, 'BackendTLSPolicy'), 'not_reported');
  assert.equal(declaredFeature({supportedFeatures: ['a']}, 'b'), 'not_reported');
  assert.equal(declaredFeature({unsupportedFeatures: ['a']}, 'a'), 'declared_unsupported');
  assert.equal(declaredFeature({supportedFeatures: ['a']}, 'a'), 'declared_supported');
  assert.throws(() => declaredFeature({supportedFeatures: ['a'], unsupportedFeatures: ['a']}, 'a'));
});

test('success with missing, negative, failed, or skipped statistics is rejected', () => {
  for (const statisticsValue of [
    undefined,
    {Passed: -1, Failed: 0, Skipped: 0},
    {Passed: 10, Failed: 1, Skipped: 0},
    {Passed: 10, Failed: 0, Skipped: 1},
    {Passed: 10, Failed: 0},
  ]) assert.throws(() => statistics({result: 'success', statistics: statisticsValue}, 'fixture'));
});

test('modified raw reports and falsely mixed cohorts cannot pass ingestion', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gateway-conformance-'));
  try {
    fs.cpSync(sourceDirectory, temporary, {recursive: true});
    const rawPath = path.join(temporary, 'aws-lbc.yaml');
    const original = fs.readFileSync(rawPath);
    fs.appendFileSync(rawPath, '\n# altered\n');
    assert.throws(() => analyze(temporary), /source hash mismatch/);
    fs.writeFileSync(rawPath, original);
    const manifestPath = path.join(temporary, 'sources.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.reports.find(report => report.id === 'aws-lbc').cohort = 'same-release';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => analyze(temporary), /Mixed API versions/);
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
});
