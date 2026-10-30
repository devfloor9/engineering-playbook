'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const {validateResiduals, readAuditFiles} = require('../check-audit-residuals.cjs');

const ROOT = path.resolve(__dirname, '../..');
const BASELINE = 'a5bc624';
const clone = value => structuredClone(value);
const source = readAuditFiles();
const run = data => validateResiduals(data.tracking, data.corrections, data.register);

function fixture() {
  return {
    tracking: {
      baseline_commit: 'frozen',
      grouped_review_items: 3,
      source_correction_status_counts: {source_correction_accepted: 1, open: 1, withdrawn: 1},
      items: [
        {id: 'open-1', issue: 95, source_correction_status: 'open', correction_records: ['old-1']},
        {id: 'done-1', issue: 95, source_correction_status: 'source_correction_accepted'},
        {id: 'withdrawn-1', issue: 95, source_correction_status: 'withdrawn'},
      ],
    },
    corrections: {
      audit_baseline: 'frozen',
      records: [{record_id: 'old-1', id: 'open-1', issue: 95, disposition: 'partial', remaining: 'Missing measured data.'}],
    },
    register: {
      schema_version: 1,
      audit_baseline: 'frozen',
      umbrella_issue: 83,
      limits: 'Coverage only; acceptance is not established.',
      items: [{
        id: 'open-1', issue: 95, status: 'unresolved', kind: 'measured_cost',
        correction_record: 'old-1', required_evidence: ['Billed hours and matched workload.'],
      }],
    },
  };
}

test('committed residual register exactly covers unresolved tracking, without acceptance', () => {
  const report = run(source);
  assert.equal(report.grouped_review_items, 2191);
  assert.equal(report.unresolved_items, 11);
  assert.deepEqual(report.counts, {source_correction_accepted: 1896, open: 11, withdrawn: 284});
  assert.equal(report.runtime_acceptance_claimed, false);
});

test('count summaries and duplicated tracking identities cannot hide a residual', () => {
  const wrongCount = fixture();
  wrongCount.tracking.source_correction_status_counts.open = 0;
  assert.throws(() => run(wrongCount), /count mismatch/);
  const duplicate = fixture();
  duplicate.tracking.items[1].id = 'open-1';
  duplicate.tracking.items[1].source_correction_status = 'open';
  assert.throws(() => run(duplicate), /Duplicate tracking ID/);
  const wrongTotal = fixture();
  wrongTotal.tracking.grouped_review_items = 2;
  assert.throws(() => run(wrongTotal), /Grouped review count/);
});

test('missing, extra and duplicate residuals fail instead of claiming complete coverage', () => {
  const missing = fixture();
  missing.register.items = [];
  assert.throws(() => run(missing), /coverage mismatch/);
  const extra = fixture();
  extra.register.items.push({...extra.register.items[0], id: 'invented'});
  assert.throws(() => run(extra), /state or issue mismatch/);
  const duplicate = fixture();
  duplicate.register.items.push(clone(duplicate.register.items[0]));
  assert.throws(() => run(duplicate), /present and unique/);
});

test('accepted states, wrong issue associations and unsupported evidence kinds fail', () => {
  for (const change of [
    entry => { entry.status = 'accepted'; },
    entry => { entry.issue = 83; },
    entry => { entry.kind = 'offline_tests_prove_runtime'; },
  ]) {
    const data = fixture();
    change(data.register.items[0]);
    assert.throws(() => run(data), /state or issue mismatch/);
  }
});

test('empty, repeated and non-text requirements cannot replace concrete missing evidence', () => {
  for (const requirements of [[], [''], ['hours', 'hours'], [null]]) {
    const data = fixture();
    data.register.items[0].required_evidence = requirements;
    assert.throws(() => run(data), /explicit and unique/);
  }
});

test('wrong baseline, umbrella and absent evidence limit fail', () => {
  for (const change of [
    data => { data.register.audit_baseline = 'different'; },
    data => { data.register.umbrella_issue = 95; },
    data => { data.register.limits = ''; },
    data => { data.corrections.audit_baseline = 'different'; },
  ]) {
    const data = fixture();
    change(data);
    assert.throws(() => run(data), /baseline|umbrella/);
  }
});

test('residuals must link the preserved partial record, not an invented acceptance', () => {
  for (const change of [
    data => { data.register.items[0].correction_record = 'missing'; },
    data => { data.corrections.records[0].id = 'other'; },
    data => { data.corrections.records[0].issue = 83; },
    data => { data.corrections.records[0].disposition = 'addressed'; },
    data => { data.corrections.records[0].remaining = ''; },
    data => { data.tracking.items[0].correction_records = []; },
  ]) {
    const data = fixture();
    change(data);
    assert.throws(() => run(data), /preserved partial record/);
  }
  const duplicateRecord = fixture();
  duplicateRecord.corrections.records.push(clone(duplicateRecord.corrections.records[0]));
  assert.throws(() => run(duplicateRecord), /record IDs/);
});

test('historical correction records and every frozen audit artifact remain unchanged', () => {
  const previous = JSON.parse(execFileSync('git', [
    'show', `${BASELINE}:audits/2026-09-19/corrections.json`,
  ], {cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));
  assert.deepEqual(source.corrections.records.slice(0, previous.records.length), previous.records);
  const frozen = execFileSync('git', [
    'ls-tree', '-r', '--name-only', BASELINE, 'audits/2026-09-19',
  ], {cwd: ROOT, encoding: 'utf8'}).trim().split('\n')
    .filter(filename => ![
      'audits/2026-09-19/README.md',
      'audits/2026-09-19/tracking.json',
      'audits/2026-09-19/corrections.json',
    ].includes(filename));
  assert.ok(frozen.length > 20);
  for (const filename of frozen) {
    assert.deepEqual(fs.readFileSync(path.join(ROOT, filename)),
      execFileSync('git', ['show', `${BASELINE}:${filename}`], {
        cwd: ROOT, maxBuffer: 8 * 1024 * 1024,
      }), filename);
  }
});

test('all original tracking identities and assignments survive the follow-up', () => {
  const previous = JSON.parse(execFileSync('git', [
    'show', `${BASELINE}:audits/2026-09-19/tracking.json`,
  ], {cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));
  const identities = tracking => tracking.items.map(item => ({
    id: item.id, package: item.package, catalog: item.catalog,
    issue: item.issue, issue_url: item.issue_url, proposed_issue_key: item.proposed_issue_key,
  }));
  assert.deepEqual(identities(source.tracking), identities(previous));
  assert.deepEqual(source.tracking.assignment_counts, previous.assignment_counts);
});

test('four source corrections have explicit new records and preserve the earlier partials', () => {
  for (const id of ['HR-OBS-04', 'HYP-OPS-196', 'EO-AV-STOR-13', 'ADS-ROUTE014']) {
    const item = source.tracking.items.find(entry => entry.id === id);
    const records = item.correction_records.map(recordId =>
      source.corrections.records.find(record => record.record_id === recordId));
    assert.equal(item.source_correction_status, 'source_correction_accepted', id);
    assert.ok(records.slice(0, -1).some(record => record.disposition === 'partial'), id);
    const current = records.at(-1);
    assert.equal(current.disposition, 'addressed', id);
    assert.equal(current.recorded_on, '2026-10-30', id);
    assert.equal(current.id, id);
    assert.ok(current.source_commits.includes(item.commit), id);
    assert.ok(records.some(record => record.record_id === current.followup_of), id);
    assert.ok(current.primary_urls.length > 0, id);
    assert.ok(current.evidence_limit.length > 0, id);
    for (const filename of current.source_files) assert.ok(fs.existsSync(path.join(ROOT, filename)), filename);
  }
});

test('offline CLI reports unresolved evidence and does not mutate its inputs', () => {
  const directory = path.join(ROOT, 'audits/2026-09-19');
  const filenames = ['tracking.json', 'corrections.json', 'residuals-2026-10-30.json'];
  const before = filenames.map(filename => fs.readFileSync(path.join(directory, filename)));
  const result = spawnSync(process.execPath, ['scripts/check-audit-residuals.cjs', '--json'], {
    cwd: ROOT, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).unresolved_items, 11);
  assert.equal(JSON.parse(result.stdout).runtime_acceptance_claimed, false);
  filenames.forEach((filename, index) => assert.deepEqual(
    fs.readFileSync(path.join(directory, filename)), before[index]));
  const invalid = spawnSync(process.execPath, ['scripts/check-audit-residuals.cjs', '--apply'], {
    cwd: ROOT, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Usage:/);
});
