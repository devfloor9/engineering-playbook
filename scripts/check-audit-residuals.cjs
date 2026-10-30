'use strict';

// Offline, read-only integrity check. Success means coverage, not acceptance.
const fs = require('node:fs');
const path = require('node:path');
const {groupOpenItems} = require('./check-audit-issues.cjs');

const AUDIT_DIRECTORY = path.resolve(__dirname, '../audits/2026-09-19');
const KINDS = new Set([
  'measured_cost', 'primary_specification', 'incident_reproduction',
  'account_availability', 'legal_acceptance', 'measured_performance',
  'versioned_tool_behavior', 'versioned_configuration',
]);

function validateResiduals(tracking, corrections, register) {
  const grouped = groupOpenItems(tracking);
  if (!register || register.schema_version !== 1 || register.umbrella_issue !== 83 ||
      register.audit_baseline !== tracking.baseline_commit ||
      typeof register.limits !== 'string' || !register.limits.trim() ||
      !Array.isArray(register.items)) {
    throw new Error('Residual register must preserve the audit baseline, umbrella and evidence limit.');
  }
  if (!corrections || corrections.audit_baseline !== tracking.baseline_commit ||
      !Array.isArray(corrections.records)) {
    throw new Error('Correction ledger must match the audit baseline.');
  }
  if (tracking.grouped_review_items !== tracking.items.length) {
    throw new Error('Grouped review count does not match tracking.');
  }
  const tracked = new Map();
  const counts = {source_correction_accepted: 0, open: 0, withdrawn: 0};
  for (const item of tracking.items) {
    if (tracked.has(item.id)) throw new Error(`Duplicate tracking ID: ${item.id}`);
    tracked.set(item.id, item);
    counts[item.source_correction_status] += 1;
  }
  for (const [status, count] of Object.entries(counts)) {
    if (tracking.source_correction_status_counts?.[status] !== count) {
      throw new Error(`Tracking count mismatch: ${status}`);
    }
  }
  const records = new Map();
  for (const record of corrections.records) {
    if (!record || typeof record.record_id !== 'string' || !record.record_id.trim() ||
        records.has(record.record_id)) {
      throw new Error('Correction record IDs must be present and unique.');
    }
    records.set(record.record_id, record);
  }
  const seen = new Set();
  for (const entry of register.items) {
    if (!entry || typeof entry.id !== 'string' || seen.has(entry.id)) {
      throw new Error('Residual IDs must be present and unique.');
    }
    seen.add(entry.id);
    const item = tracked.get(entry.id);
    if (!item || item.source_correction_status !== 'open' || entry.issue !== item.issue ||
        entry.status !== 'unresolved' || !KINDS.has(entry.kind)) {
      throw new Error(`Residual state or issue mismatch: ${entry.id}`);
    }
    if (!Array.isArray(entry.required_evidence) || entry.required_evidence.length === 0 ||
        entry.required_evidence.some(value => typeof value !== 'string' || !value.trim()) ||
        new Set(entry.required_evidence).size !== entry.required_evidence.length) {
      throw new Error(`Required evidence must be explicit and unique: ${entry.id}`);
    }
    const record = records.get(entry.correction_record);
    if (!record || record.id !== entry.id || record.issue !== entry.issue ||
        record.disposition !== 'partial' ||
        typeof record.remaining !== 'string' || !record.remaining.trim() ||
        !item.correction_records?.includes(entry.correction_record)) {
      throw new Error(`Residual must reference its preserved partial record: ${entry.id}`);
    }
  }
  const missing = tracking.items.filter(item =>
    item.source_correction_status === 'open' && !seen.has(item.id));
  if (missing.length || seen.size !== grouped.open_items) {
    throw new Error(`Residual coverage mismatch: ${missing.map(item => item.id).join(', ')}`);
  }
  return {
    grouped_review_items: tracking.items.length,
    counts,
    unresolved_items: seen.size,
    runtime_acceptance_claimed: false,
  };
}

function readAuditFiles(directory = AUDIT_DIRECTORY) {
  const read = filename => JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
  return {
    tracking: read('tracking.json'),
    corrections: read('corrections.json'),
    register: read('residuals-2026-10-30.json'),
  };
}

function main(args = process.argv.slice(2)) {
  if (args.length && !(args.length === 1 && args[0] === '--json')) {
    throw new Error('Usage: node scripts/check-audit-residuals.cjs [--json]');
  }
  const {tracking, corrections, register} = readAuditFiles();
  const report = validateResiduals(tracking, corrections, register);
  console.log(args[0] === '--json' ? JSON.stringify(report, null, 2) :
    `${report.unresolved_items} unresolved evidence items registered; no runtime acceptance claimed.`);
  return report;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Audit residual integrity failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {validateResiduals, readAuditFiles, main};
