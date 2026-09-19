#!/usr/bin/env node
// Analyze a frozen upstream cohort; never treat it as a local measurement.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const directory = path.join(__dirname, 'results/upstream');
const focusFeatures = [
  'HTTPRoutePathRewrite',
  'HTTPRouteResponseHeaderModification',
  'HTTPRouteRequestMirror',
  'HTTPRouteRequestTimeout',
  'HTTPRouteBackendProtocolH2C',
  'HTTPRouteBackendProtocolWebSocket',
  'GatewayHTTPListenerIsolation',
  'GatewayInfrastructurePropagation',
];

function statistics(section, label) {
  if (!section) return null;
  assert.ok(['success', 'partial', 'failure'].includes(section.result), `${label}: unknown result`);
  const counts = section.statistics;
  assert.ok(counts && typeof counts === 'object', `${label}: missing statistics`);
  for (const key of ['Passed', 'Failed', 'Skipped']) {
    assert.ok(Number.isSafeInteger(counts[key]) && counts[key] >= 0, `${label}: invalid ${key}`);
  }
  if (section.result === 'success') {
    assert.equal(counts.Failed, 0, `${label}: success includes failures`);
    assert.equal(counts.Skipped, 0, `${label}: success includes skips`);
  }
  return {
    result: section.result,
    passed: counts.Passed,
    failed: counts.Failed,
    skipped: counts.Skipped,
    skipped_tests: section.skippedTests || [],
    failed_tests: section.failedTests || [],
  };
}

function declaredFeature(section, feature) {
  const supported = section?.supportedFeatures || [];
  const unsupported = section?.unsupportedFeatures || [];
  assert.ok(Array.isArray(supported) && Array.isArray(unsupported), 'Feature declarations must be arrays');
  assert.ok(!supported.some(value => unsupported.includes(value)), 'Contradictory feature declarations');
  if (supported.includes(feature)) return 'declared_supported';
  if (unsupported.includes(feature)) return 'declared_unsupported';
  return 'not_reported';
}

function readReport(source, snapshot, cohort, baseDirectory) {
  assert.match(source.id, /^[a-z0-9-]+$/);
  assert.equal(source.local_file, `${source.id}.yaml`, 'Unexpected local report filename');
  assert.match(source.raw_yaml_sha256, /^[a-f0-9]{64}$/);
  const url = new URL(source.raw_yaml_url);
  assert.equal(url.origin, 'https://raw.githubusercontent.com');
  assert.ok(url.pathname.startsWith(`/kubernetes-sigs/gateway-api/${snapshot.commit}/conformance/reports/`));
  assert.match(source.report_path, /^conformance\/reports\/[A-Za-z0-9._/-]+\.yaml$/);
  assert.ok(!source.report_path.split('/').includes('..'), 'Unexpected report path traversal');
  assert.equal(source.raw_yaml_url,
    `https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/${snapshot.commit}/${source.report_path}`,
    'Report URL does not match the pinned report path');
  assert.equal(source.report_repository_commit, snapshot.commit);
  assert.ok(['same-release', 'same-release-separate-managed-track', 'supplemental-not-comparable-release']
    .includes(source.cohort), 'Unknown cohort classification');
  const bytes = fs.readFileSync(path.join(baseDirectory, source.local_file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.raw_yaml_sha256,
    `${source.id}: source hash mismatch`);
  const report = yaml.load(bytes.toString('utf8'));
  assert.equal(report.kind, 'ConformanceReport');
  assert.equal(report.implementation.project, source.implementation.project);
  assert.equal(report.implementation.version, source.implementation.reported_version);
  assert.equal(report.gatewayAPIVersion, source.gateway_api_version);
  assert.equal(report.gatewayAPIChannel, source.gateway_api_channel);
  assert.equal(report.mode, source.mode);
  assert.ok(Number.isFinite(Date.parse(report.date)) && Date.parse(report.date) <= Date.parse(snapshot.cutoff_utc),
    `${source.id}: invalid or future report date`);
  if (source.cohort.startsWith('same-release')) {
    assert.equal(report.gatewayAPIVersion, cohort.gateway_api_version, 'Mixed API versions in cohort');
    assert.equal(report.gatewayAPIChannel, cohort.gateway_api_channel, 'Mixed channels in cohort');
    assert.equal(report.mode, cohort.mode, 'Mixed modes in cohort');
  }
  assert.ok(Array.isArray(report.profiles) && report.profiles.length > 0, 'Missing profiles');
  assert.equal(new Set(report.profiles.map(profile => profile.name)).size, report.profiles.length,
    'Duplicate profiles');
  const profiles = report.profiles.map(profile => {
    const core = statistics(profile.core, `${source.id}/${profile.name}/core`);
    assert.ok(core && core.passed + core.failed + core.skipped > 0, 'Empty core test population');
    const extended = statistics(profile.extended, `${source.id}/${profile.name}/extended`);
    return {
      name: profile.name,
      core,
      extended,
      declared_supported_features: profile.extended?.supportedFeatures || [],
      declared_unsupported_features: profile.extended?.unsupportedFeatures || [],
      selected_feature_declarations: Object.fromEntries(
        focusFeatures.map(feature => [feature, declaredFeature(profile.extended, feature)])),
    };
  });
  return {
    id: source.id,
    evidence_class: 'external_conformance',
    cohort: source.cohort,
    implementation: report.implementation.project,
    reported_version: report.implementation.version,
    gateway_api_version: report.gatewayAPIVersion,
    channel: report.gatewayAPIChannel,
    mode: report.mode,
    report_date: report.date,
    source_url: source.raw_yaml_url,
    source_sha256: source.raw_yaml_sha256,
    profiles,
    notes: source.notes,
    performance_measurements: null,
    rank_eligible: false,
  };
}

function analyze(baseDirectory = directory) {
  const sources = JSON.parse(fs.readFileSync(path.join(baseDirectory, 'sources.json'), 'utf8'));
  assert.equal(sources.schema_version, 1);
  assert.match(sources.snapshot.commit, /^[a-f0-9]{40}$/);
  assert.ok(Date.parse(sources.snapshot.committer_date) <= Date.parse(sources.snapshot.cutoff_utc));
  assert.ok(Array.isArray(sources.reports) && sources.reports.length > 0);
  assert.equal(new Set(sources.reports.map(report => report.id)).size, sources.reports.length);
  const reports = sources.reports.map(source =>
    readReport(source, sources.snapshot, sources.selected_cohort, baseDirectory));
  for (const [field, classification] of [
    ['members', 'same-release'],
    ['separate_managed_track', 'same-release-separate-managed-track'],
  ]) {
    const members = sources.selected_cohort[field];
    assert.ok(Array.isArray(members) && members.every(member => typeof member === 'string'));
    assert.equal(new Set(members).size, members.length, 'Duplicate cohort member');
    assert.deepEqual([...members].sort(),
      reports.filter(report => report.cohort === classification).map(report => report.id).sort(),
      'Cohort membership does not match report classifications');
  }
  return {
    schema_version: 1,
    evidence_class: 'external_conformance',
    snapshot: sources.snapshot,
    cohort: sources.selected_cohort,
    interpretation: sources.interpretation,
    missing_same_release: sources.missing_same_release,
    verified_source_files: reports.length,
    profiles_analyzed: reports.reduce((sum, report) => sum + report.profiles.length, 0),
    reports,
  };
}

if (require.main === module) {
  try {
    assert.ok(process.argv.length === 2 || process.argv.length === 3 && process.argv[2] === '--check',
      'Usage: node analyze-conformance.cjs [--check]');
    const output = `${JSON.stringify(analyze(), null, 2)}\n`;
    const destination = path.join(directory, 'analysis.json');
    if (process.argv[2] === '--check') {
      assert.equal(fs.readFileSync(destination, 'utf8'), output, 'Derived analysis is stale');
      console.log('Pinned upstream conformance hashes, identities, cohorts and derived output verified.');
    } else {
      fs.writeFileSync(destination, output);
      console.log('Wrote upstream-reported conformance analysis; no local performance results were inferred.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {analyze, readReport, statistics, declaredFeature};
