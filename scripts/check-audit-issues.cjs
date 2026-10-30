'use strict';

// Read-only comparison of unresolved audit items and their GitHub issues.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const DEFAULT_REPOSITORY = 'devfloor9/engineering-playbook';
const DEFAULT_TRACKING = path.resolve(__dirname, '../audits/2026-09-19/tracking.json');
const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000;

function validateRepository(repository) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
      repository.split('/').some(part => part === '.' || part === '..')) {
    throw new Error('Repository must be OWNER/REPO without dot-only path segments.');
  }
}

function groupOpenItems(tracking, repository = DEFAULT_REPOSITORY) {
  validateRepository(repository);
  if (!tracking || !Array.isArray(tracking.items)) {
    throw new Error('Tracking data must contain an items array.');
  }
  const items = new Map();
  const duplicates = new Set();
  const seenStates = new Map();
  const allowedStates = new Set(['source_correction_accepted', 'open', 'withdrawn']);
  let recordCount = 0;
  for (const [index, item] of tracking.items.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Tracking item ${index + 1} must be an object.`);
    }
    if (!allowedStates.has(item.source_correction_status)) {
      throw new Error(`Tracking item ${index + 1} has an unknown or missing source_correction_status.`);
    }
    if (typeof item.id !== 'string' || !item.id.trim()) {
      throw new Error(`Tracking item ${index + 1} has no valid ID.`);
    }
    const id = item.id.trim();
    const number = Number.isSafeInteger(item.issue) && item.issue > 0 ? item.issue : null;
    if (item.issue_url !== undefined && item.issue_url !== null) {
      let url;
      try {
        if (typeof item.issue_url !== 'string') throw new Error('Invalid URL');
        url = new URL(item.issue_url);
      } catch {
        throw new Error(`Tracking item ${id} has an invalid issue URL.`);
      }
      const expectedPath = `/${repository}/issues/${number}`.toLowerCase();
      if (number === null || url.protocol !== 'https:' || url.hostname !== 'github.com' ||
          url.username || url.password || url.port || url.search || url.hash ||
          url.pathname.replace(/\/$/, '').toLowerCase() !== expectedPath) {
        throw new Error(`Tracking item ${id} issue URL does not match the requested repository and issue.`);
      }
    }
    if (seenStates.has(id) && seenStates.get(id) !== item.source_correction_status) {
      throw new Error(`Tracking item ${id} has conflicting statuses.`);
    }
    seenStates.set(id, item.source_correction_status);
    if (item.source_correction_status !== 'open') continue;
    recordCount += 1;
    if (items.has(id)) {
      duplicates.add(id);
      if (items.get(id) !== number) {
        throw new Error(`Open item ${id} has conflicting issue numbers.`);
      }
    } else {
      items.set(id, number);
    }
  }

  const groups = new Map();
  for (const [id, number] of items) {
    if (!groups.has(number)) groups.set(number, []);
    groups.get(number).push(id);
  }
  return {
    open_records: recordCount,
    open_items: items.size,
    duplicate_ids: [...duplicates].sort(),
    groups: [...groups].sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity))
      .map(([number, ids]) => ({number, ids: ids.sort()})),
  };
}

function normalizeStatus(value, missingReason) {
  const state = typeof value === 'string' ? value : value && value.state;
  if (typeof state === 'string' && /^(open|closed)$/i.test(state)) {
    return {state: state.toUpperCase(), reason: null};
  }
  return {state: 'UNKNOWN', reason: missingReason};
}

function snapshotStatus(snapshot, repository, number) {
  if (!snapshot || snapshot.repository !== repository || !snapshot.issues ||
      typeof snapshot.issues !== 'object' || Array.isArray(snapshot.issues)) {
    throw new Error('Snapshot must name the requested repository and contain an issues object.');
  }
  return normalizeStatus(snapshot.issues[String(number)], 'Not present or invalid in snapshot');
}

function snapshotTime(value, referenceMs) {
  const match = typeof value === 'string' && value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) throw new Error('Snapshot checked_at must be an ISO timestamp with timezone.');
  const [, year, month, day, hour, minute, second] = match;
  const local = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || !Number.isFinite(local.getTime()) ||
      local.toISOString().slice(0, 19) !== `${year}-${month}-${day}T${hour}:${minute}:${second}`) {
    throw new Error('Snapshot checked_at must be a valid ISO timestamp.');
  }
  if (timestamp > referenceMs) throw new Error('Snapshot checked_at is in the future.');
  return {timestamp, stale: referenceMs - timestamp > MAX_SNAPSHOT_AGE_MS};
}

function githubStatus(repository, number, spawn = spawnSync) {
  const result = spawn('gh', ['api', `repos/${repository}/issues/${number}`], {
    encoding: 'utf8',
    timeout: 20000,
    env: {...process.env, GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1'},
  });
  if (result.error) {
    const reason = result.error.code === 'ENOENT' ? 'GitHub CLI not found' :
      result.error.code === 'ETIMEDOUT' ? 'GitHub request timed out' : 'GitHub request failed';
    return {state: 'UNKNOWN', reason};
  }
  if (result.status !== 0) {
    const detail = String(result.stderr || '');
    const reason = /auth|permission|unauthorized|forbidden|401|403|log in/i.test(detail)
      ? 'GitHub authentication or permission failure' : `GitHub request failed (exit ${result.status})`;
    return {state: 'UNKNOWN', reason};
  }
  try {
    const issue = JSON.parse(result.stdout);
    if (issue.number !== number || issue.pull_request) {
      return {state: 'UNKNOWN', reason: 'GitHub response is not the requested issue'};
    }
    return normalizeStatus(issue, 'GitHub response has no valid state');
  } catch {
    return {state: 'UNKNOWN', reason: 'Invalid GitHub response'};
  }
}

function buildReport(tracking, options = {}) {
  const repository = options.repository || DEFAULT_REPOSITORY;
  const mode = options.mode || 'none';
  const referenceMs = options.now === undefined ? Date.now() : options.now;
  if (!Number.isFinite(referenceMs) || !Number.isFinite(new Date(referenceMs).getTime())) {
    throw new Error('Invalid reference time.');
  }
  const referenceAt = new Date(referenceMs).toISOString();
  validateRepository(repository);
  if (!['none', 'snapshot', 'live'].includes(mode)) throw new Error('Invalid comparison mode.');
  let snapshotAge = null;
  if (mode === 'snapshot') {
    // Validate the snapshot even when there are no issue groups.
    snapshotStatus(options.snapshot, repository, 0);
    snapshotAge = snapshotTime(options.snapshot.checked_at, referenceMs);
  }
  const grouped = groupOpenItems(tracking, repository);
  const resolve = options.githubStatus || githubStatus;
  const groups = grouped.groups.map(group => {
    let status;
    if (group.number === null) status = {state: 'UNKNOWN', reason: 'No valid issue number'};
    else if (mode === 'live') status = resolve(repository, group.number);
    else if (mode === 'snapshot' && snapshotAge.stale) {
      status = {state: 'UNKNOWN', reason: 'Snapshot is older than 24 hours; current issue state is unverified'};
    } else if (mode === 'snapshot') status = snapshotStatus(options.snapshot, repository, group.number);
    else status = {state: 'UNKNOWN', reason: 'Not checked; use --live or --snapshot'};
    return {...group, ...status};
  });
  const closed = groups.filter(group => group.state === 'CLOSED');
  const unknown = groups.filter(group => group.state === 'UNKNOWN');
  return {
    repository,
    source: mode,
    checked_at: mode === 'live' ? referenceAt : mode === 'snapshot' ? options.snapshot.checked_at : null,
    reference_at: referenceAt,
    snapshot_stale: snapshotAge === null ? null : snapshotAge.stale,
    snapshot_max_age_hours: mode === 'snapshot' ? 24 : null,
    open_records: grouped.open_records,
    open_items: grouped.open_items,
    duplicate_ids: grouped.duplicate_ids,
    groups,
    closed_issues: closed.length,
    open_items_on_closed_issues: closed.reduce((sum, group) => sum + group.ids.length, 0),
    unknown_issues: unknown.length,
    unknown_items: unknown.reduce((sum, group) => sum + group.ids.length, 0),
  };
}

function exitCode(report) {
  if (report.source === 'none' || report.snapshot_stale || report.unknown_items) return 2;
  if (report.open_items_on_closed_issues) return 1;
  return 0;
}

function render(report) {
  const date = report.checked_at || 'not supplied';
  const lines = [
    `Repository: ${report.repository}`,
    `Source: ${report.source}; checked at: ${date}`,
    `Reference time: ${report.reference_at}${report.source === 'snapshot' ? '; snapshot limit: 24 hours' : ''}`,
    `Open audit items: ${report.open_items} (${report.open_records} records)`,
    `Duplicate IDs: ${report.duplicate_ids.join(', ') || 'none'}`,
  ];
  if (report.source === 'none') lines.push('GitHub issue states were not checked.');
  for (const group of report.groups) {
    const issue = group.number === null ? 'No issue' : `#${group.number}`;
    lines.push(`${issue}: ${group.state} — ${group.ids.join(', ')}${group.reason ? ` (${group.reason})` : ''}`);
  }
  lines.push(`Open items on closed issues: ${report.open_items_on_closed_issues} across ${report.closed_issues} issues`);
  lines.push(`Unverified items: ${report.unknown_items} across ${report.unknown_issues} groups`);
  lines.push('No audit records or GitHub issues were changed.');
  return lines.join('\n');
}

function parseArgs(args) {
  const options = {tracking: DEFAULT_TRACKING, repository: DEFAULT_REPOSITORY, mode: 'none', json: false};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--live') {
      if (options.mode !== 'none') throw new Error('Choose either --live or --snapshot.');
      options.mode = 'live';
    } else if (['--tracking', '--snapshot', '--repo'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.`);
      if (arg === '--tracking') options.tracking = value;
      if (arg === '--repo') options.repository = value;
      if (arg === '--snapshot') {
        if (options.mode !== 'none') throw new Error('Choose either --live or --snapshot.');
        options.mode = 'snapshot';
        options.snapshotPath = value;
      }
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function main(args) {
  const options = parseArgs(args);
  if (options.help) {
    console.log('Usage: node scripts/check-audit-issues.cjs [--tracking FILE] [--repo OWNER/REPO] [--live | --snapshot FILE] [--json]');
    console.log('Snapshot: {"repository":"OWNER/REPO","checked_at":"ISO timestamp","issues":{"88":{"state":"CLOSED"}}}');
    console.log('Snapshot timestamps require a timezone, cannot be in the future, and expire after 24 hours.');
    console.log('Exit: 0 verified and consistent; 1 closed issue has open items; 2 unverified or error.');
    return 0;
  }
  const tracking = JSON.parse(fs.readFileSync(options.tracking, 'utf8'));
  const snapshot = options.mode === 'snapshot' ? JSON.parse(fs.readFileSync(options.snapshotPath, 'utf8')) : undefined;
  const report = buildReport(tracking, {...options, snapshot});
  console.log(options.json ? JSON.stringify(report, null, 2) : render(report));
  return exitCode(report);
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`Audit issue check: ${error.message}`);
    process.exitCode = 2;
  }
}

module.exports = {buildReport, exitCode, githubStatus, groupOpenItems, parseArgs, render, snapshotStatus, snapshotTime};
