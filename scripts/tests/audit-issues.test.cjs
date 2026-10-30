'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {buildReport, exitCode, githubStatus, groupOpenItems, parseArgs, render} = require('../check-audit-issues.cjs');

const tracking = {items: [
  {id: 'B', issue: 88, source_correction_status: 'open'},
  {id: 'A', issue: 88, source_correction_status: 'open'},
  {id: 'A', issue: 88, source_correction_status: 'open'},
  {id: 'C', issue: 95, source_correction_status: 'open'},
  {id: 'D', issue: null, source_correction_status: 'open'},
  {id: 'DONE', issue: 88, source_correction_status: 'source_correction_accepted'},
]};
const snapshot = {
  repository: 'devfloor9/engineering-playbook',
  checked_at: '2026-10-30T10:00:00Z',
  issues: {'88': {state: 'closed'}},
};
const now = Date.parse('2026-10-30T12:00:00Z');

test('open items are grouped by issue and repeated IDs count once', () => {
  assert.deepEqual(groupOpenItems(tracking), {
    open_records: 5,
    open_items: 4,
    duplicate_ids: ['A'],
    groups: [{number: 88, ids: ['A', 'B']}, {number: 95, ids: ['C']}, {number: null, ids: ['D']}],
  });
});

test('one ID assigned to different issues is rejected', () => {
  assert.throws(() => groupOpenItems({items: [
    {id: 'A', issue: 88, source_correction_status: 'open'},
    {id: 'A', issue: 95, source_correction_status: 'open'},
  ]}), /conflicting issue numbers/);
});

test('malformed records, unknown states and conflicting states are rejected', () => {
  for (const item of [null, [], {}, {id: 'A', source_correction_status: 'opne'},
    {source_correction_status: 'withdrawn'}]) {
    assert.throws(() => groupOpenItems({items: [item]}), /Tracking item/);
  }
  assert.throws(() => groupOpenItems({items: [
    {id: 'A', issue: 88, source_correction_status: 'open'},
    {id: 'A', issue: 88, source_correction_status: 'withdrawn'},
  ]}), /conflicting statuses/);
});

test('recorded issue URLs must match the requested repository and issue', () => {
  const item = {id: 'A', issue: 88, source_correction_status: 'open',
    issue_url: 'https://github.com/devfloor9/engineering-playbook/issues/88'};
  assert.equal(groupOpenItems({items: [item]}).open_items, 1);
  assert.throws(() => groupOpenItems({items: [item]}, 'other/project'), /does not match/);
  assert.throws(() => groupOpenItems({items: [{...item, issue: 95}]}), /does not match/);
  for (const issue_url of [
    'http://github.com/devfloor9/engineering-playbook/issues/88',
    'https://github.com.example.com/devfloor9/engineering-playbook/issues/88',
    'https://user@github.com/devfloor9/engineering-playbook/issues/88',
  ]) assert.throws(() => groupOpenItems({items: [{...item, issue_url}]}), /does not match/);
});

test('dot-only repository path segments are rejected', () => {
  for (const repository of ['../..', 'foo/..', './x', 'x/.']) {
    assert.throws(() => buildReport(tracking, {repository}), /dot-only/);
  }
});

test('snapshot distinguishes closed issues from unknown and missing issues', () => {
  const report = buildReport(tracking, {mode: 'snapshot', snapshot, now});
  assert.equal(report.source, 'snapshot');
  assert.equal(report.checked_at, snapshot.checked_at);
  assert.equal(report.reference_at, '2026-10-30T12:00:00.000Z');
  assert.equal(report.snapshot_stale, false);
  assert.equal(report.open_items_on_closed_issues, 2);
  assert.equal(report.closed_issues, 1);
  assert.equal(report.unknown_items, 2);
  assert.equal(report.unknown_issues, 2);
  assert.equal(exitCode(report), 2);
  assert.match(render(report), /#88: CLOSED — A, B/);
  assert.match(render(report), /Not present or invalid in snapshot/);
  assert.match(render(report), /No valid issue number/);
});

test('a closed issue is a mismatch and an open issue is consistent', () => {
  const item = {items: [{id: 'A', issue: 88, source_correction_status: 'open'}]};
  const closed = buildReport(item, {mode: 'snapshot', snapshot, now});
  assert.equal(exitCode(closed), 1);
  const open = buildReport(item, {mode: 'snapshot', snapshot: {...snapshot, issues: {'88': 'OPEN'}}, now});
  assert.equal(exitCode(open), 0);
  assert.equal(open.open_items_on_closed_issues, 0);
});

test('default mode does not contact GitHub and does not assume status', () => {
  let calls = 0;
  const report = buildReport(tracking, {githubStatus: () => { calls += 1; }});
  assert.equal(calls, 0);
  assert.equal(report.unknown_items, 4);
  assert.equal(exitCode(report), 2);
  const empty = buildReport({items: []}, {now});
  assert.equal(exitCode(empty), 2);
  assert.match(render(empty), /GitHub issue states were not checked/);
});

test('snapshot for another repository is rejected', () => {
  assert.throws(() => buildReport(tracking, {mode: 'snapshot', snapshot: {...snapshot, repository: 'wrong/repo'}, now}), /requested repository/);
});

test('snapshot timestamps must exist, be valid, and not be in the future', () => {
  for (const checked_at of [undefined, '2026-10-30', '2026-02-30T10:00:00Z', '2026-10-30T10:00:00']) {
    assert.throws(() => buildReport(tracking, {mode: 'snapshot', snapshot: {...snapshot, checked_at}, now}), /checked_at/);
  }
  assert.throws(() => buildReport(tracking, {
    mode: 'snapshot', snapshot: {...snapshot, checked_at: '2026-10-30T12:00:01Z'}, now,
  }), /future/);
});

test('snapshots older than 24 hours are unknown, while the exact boundary is valid', () => {
  const item = {items: [{id: 'A', issue: 88, source_correction_status: 'open'}]};
  const boundary = Date.parse(snapshot.checked_at) + 24 * 60 * 60 * 1000;
  const fresh = buildReport(item, {mode: 'snapshot', snapshot, now: boundary});
  assert.equal(fresh.snapshot_stale, false);
  assert.equal(fresh.groups[0].state, 'CLOSED');
  const stale = buildReport(item, {mode: 'snapshot', snapshot, now: boundary + 1});
  assert.equal(stale.snapshot_stale, true);
  assert.equal(stale.groups[0].state, 'UNKNOWN');
  assert.equal(stale.open_items_on_closed_issues, 0);
  assert.equal(stale.unknown_items, 1);
  assert.equal(exitCode(stale), 2);
  assert.match(render(stale), /Reference time: 2026-10-31T10:00:00.001Z; snapshot limit: 24 hours/);
  assert.match(render(stale), /older than 24 hours/);
  const noItems = buildReport({items: []}, {mode: 'snapshot', snapshot, now: boundary + 1});
  assert.equal(exitCode(noItems), 2);
});

test('live auth, missing executable and invalid responses remain unknown', () => {
  assert.deepEqual(githubStatus('owner/repo', 1, () => ({status: 1, stderr: 'HTTP 401 unauthorized'})),
    {state: 'UNKNOWN', reason: 'GitHub authentication or permission failure'});
  assert.deepEqual(githubStatus('owner/repo', 1, () => ({error: {code: 'ENOENT'}})),
    {state: 'UNKNOWN', reason: 'GitHub CLI not found'});
  assert.deepEqual(githubStatus('owner/repo', 1, () => ({status: 0, stdout: '{'})),
    {state: 'UNKNOWN', reason: 'Invalid GitHub response'});
  assert.deepEqual(githubStatus('owner/repo', 1, () => ({status: 0, stdout: '{"number":1,"state":"closed"}'})),
    {state: 'CLOSED', reason: null});
});

test('live and snapshot modes are mutually exclusive', () => {
  assert.throws(() => parseArgs(['--live', '--snapshot', 'snapshot.json']), /either/);
  assert.throws(() => parseArgs(['--snapshot', 'snapshot.json', '--live']), /either/);
  assert.throws(() => parseArgs(['--snapshot']), /requires a value/);
});
