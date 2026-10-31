'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const matter = require('gray-matter');
const {validateResiduals, readAuditFiles} = require('../check-audit-residuals.cjs');

const ROOT = path.resolve(__dirname, '../..');
const BASE_REVISION = 'e2dab62657a1b3bb9113259d195d3ae0d1c71456';
const read = filename => fs.readFileSync(path.join(ROOT, filename), 'utf8');
const base = filename => execFileSync('git', ['show', `${BASE_REVISION}:${filename}`], {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
});
const followup = JSON.parse(read('audits/2026-09-19/source-followup-2026-10-31.json'));
const item = id => followup.items.find(entry => entry.id === id);
const sources = id => item(id).source_files.map(filename => ({filename, text: read(filename)}));
const between = (text, start, end) => {
  const from = text.indexOf(start);
  assert.ok(from >= 0, `Missing section: ${start}`);
  const to = text.indexOf(end, from + start.length);
  assert.ok(to > from, `Missing section end: ${end}`);
  return text.slice(from, to);
};

test('pinned Kiro setup is separated from estimated scores and AGENTS.md has no platform rating', () => {
  for (const {filename, text} of sources('AIDLC-C175')) {
    const section = between(text, '### 13.3 ', '\n---');
    assert.match(section, /v0\.1\.7/);
    assert.match(section, /\.kiro\/steering\/aws-aidlc-rules\//);
    assert.match(section, /\.kiro\/aws-aidlc-rule-details\//);
    assert.match(section, /Vibe/);
    assert.match(section, /https:\/\/github\.com\/awslabs\/aidlc-workflows\/blob\/v0\.1\.7\/README\.md#kiro/);
    assert.match(section, /unverified estimates|미검증 추정/);
    assert.doesNotMatch(section, /Spec-Driven built-in|Spec-Driven 기본 탑재/);
    assert.doesNotMatch(section, /^\|\s*\*\*AGENTS\.md\*\*\s*\|/m, filename);
    assert.match(section, /`AGENTS\.md`/);
    assert.match(section, /README\.md#cursor-ide/);
    assert.match(section, /README\.md#cline/);
    assert.equal(section.split('\n').filter(line => /^\|\s*\*\*(?:Kiro|Claude Code|Cursor|Q Developer|Cline|Copilot)\*\*/.test(line)).length, 6);
  }
});

test('ALB availability guidance preserves incident limits and distinguishes documented 503 from fail-open', () => {
  for (const {filename, text} of sources('ADS-NODE-009')) {
    // Locate the explicit incident anchor independently of translated heading text.
    const anchor = filename.startsWith('docs/')
      ? 'consolidation-and-single-replica-service-availability-verified-202607'
      : 'consolidation과-단일-replica-서비스-가용성-202607-검증';
    const heading = text.split('\n').find(line => line.includes(`{#${anchor}}`));
    assert.ok(heading, filename);
    assert.match(heading, /Observations|관찰/);
    assert.doesNotMatch(heading.split('{#')[0], /Verified|검증/);
    const incident = text.slice(text.indexOf(heading), text.indexOf('\n## ', text.indexOf(heading)));
    assert.match(incident, /`unused`/);
    assert.match(incident, /target optimizer/);
    assert.match(incident, /target optimizer (?:enabled|is)|target optimizer가 활성화/);
    assert.match(incident, /unhealthy/);
    assert.match(incident, /fails open|fail-open/);
    assert.match(incident, /target-group-health-checks\.html/);
    assert.match(incident, /load-balancer-troubleshooting\.html#http-503-issues/);
    assert.match(incident, /not proof of causation|인과를 증명하지/);
    assert.match(incident, /access logs|액세스 로그/);
    assert.doesNotMatch(incident, /no healthy registered targets, the ALB returns|healthy한 등록 타깃이 하나도 남지 않으면 ALB는/);
    assert.doesNotMatch(incident, /all targets in `initial`\/`draining`\) returns 503|모두 `initial`\/`draining`\) 하면 ALB는 503/);
  }
});

test('Trainium network scopes agree arithmetically while the memory conflict remains unresolved', () => {
  for (const {filename, text} of sources('ADS-MOE-008')) {
    const section = between(text, filename.startsWith('docs/')
      ? ':::info Specifications still to confirm'
      : ':::info 사양 확인이 남아 있는 항목', '\n:::');
    assert.match(section, /October 31, 2026|2026년 10월 31일/);
    assert.match(section, /8,192GiB/);
    assert.match(section, /memory specification remains unresolved|메모리 사양의 충돌은 미해결/);
    assert.match(section, /Network bandwidth \(Tbps\)/);
    assert.match(section, /3\.2 per instance|인스턴스당 3\.2/);
    assert.match(section, /12\.8Tbps across four instances|4대 합계 12\.8Tbps/);
    assert.match(section, /(?:Four|4) × 3\.2Tbps = 12\.8Tbps/);
  }
});

test('GLM identity and APIs match the official snapshot without converting public availability into account acceptance', () => {
  const evidence = item('ADS-OCLAW004');
  assert.equal(evidence.model_id, 'zai.glm-4.7');
  assert.deepEqual(evidence.supported_apis, ['Invoke', 'Converse', 'Chat Completions']);
  assert.deepEqual(evidence.unsupported_apis, ['Responses']);
  assert.equal(evidence.in_region_support.length, 13);
  assert.equal(new Set(evidence.in_region_support).size, 13);
  assert.equal(evidence.geo_inference_support, false);
  assert.equal(evidence.global_inference_support, false);
  for (const {text} of sources('ADS-OCLAW004')) {
    const note = between(text, ':::note ', '\n:::');
    assert.match(note, /2026-10-31/);
    assert.match(note, /model-card-zai-glm-4-7\.html/);
    assert.match(note, /`zai\.glm-4\.7`/);
    assert.match(note, /`bedrock-runtime`/);
    assert.match(note, /`bedrock-mantle`/);
    assert.match(note, /Invoke, Converse, (?:and )?Chat Completions/);
    assert.match(note, /not Responses|Responses는 지원하지/);
    const listedRegions = [...note.matchAll(/`((?:us|eu|ap|sa)-[a-z]+(?:-[a-z]+)?-\d)`/g)].map(match => match[1]);
    assert.deepEqual(listedRegions, evidence.in_region_support);
    assert.match(note, /not a check of the target account|대상 계정의 접근 권한/);
    assert.match(note, /Solar Pro 3.+unconfirmed|Solar Pro 3.+미확인/s);
    assert.match(note, /No paid inference|유료 inference는 실행하지/);
  }
});

test('source follow-up adds evidence without changing the frozen audit, original partial records or 11 residuals', () => {
  assert.equal(followup.audit_baseline, 'eb93387d33bd991beef2c4885890a312a093b5c3');
  assert.equal(followup.reviewed_base_revision, BASE_REVISION);
  assert.equal(followup.umbrella_issue, 83);
  assert.deepEqual(followup.items.map(entry => entry.id), [
    'AIDLC-C175', 'ADS-NODE-009', 'ADS-MOE-008', 'ADS-OCLAW004',
  ]);
  const audit = readAuditFiles();
  const report = validateResiduals(audit.tracking, audit.corrections, audit.register);
  assert.deepEqual(report.counts, {source_correction_accepted: 1896, open: 11, withdrawn: 284});
  assert.equal(report.unresolved_items, 11);
  assert.equal(report.runtime_acceptance_claimed, false);
  for (const entry of followup.items) {
    assert.equal(entry.disposition, 'partial');
    assert.ok(entry.remaining.length > 0);
    assert.ok(entry.primary_sources.length > 0);
    assert.ok(audit.corrections.records.some(record =>
      record.record_id === entry.original_partial_record && record.id === entry.id && record.disposition === 'partial'));
    assert.equal(audit.tracking.items.find(record => record.id === entry.id).source_correction_status, 'open');
    assert.ok(entry.source_files[0].startsWith('docs/'));
    assert.equal(entry.source_files[1], `i18n/ko/docusaurus-plugin-content-docs/current/${entry.source_files[0].slice(5)}`);
    for (const source of entry.primary_sources) assert.equal(source.retrieved_on, '2026-10-31');
  }
  for (const filename of ['tracking.json', 'corrections.json', 'residuals-2026-10-30.json']) {
    const full = `audits/2026-09-19/${filename}`;
    assert.equal(read(full), base(full), full);
  }
  const changed = execFileSync('git', ['diff', '--name-only', BASE_REVISION, '--', 'audits/2026-09-19'], {
    cwd: ROOT, encoding: 'utf8',
  }).trim().split('\n').filter(Boolean);
  assert.ok(changed.every(filename => [
    'audits/2026-09-19/README.md',
    'audits/2026-09-19/source-followup-2026-10-31.json',
  ].includes(filename)), changed.join('\n'));
});

test('eight content revisions preserve all other frontmatter, explicit anchors and executable examples', () => {
  const filenames = followup.items.flatMap(entry => entry.source_files);
  assert.equal(filenames.length, 8);
  for (const filename of filenames) {
    const old = base(filename);
    const current = read(filename);
    const previousMetadata = matter(old).data;
    const actual = matter(current).data;
    assert.equal(new Date(actual.last_update.date).toISOString().slice(0, 10), '2026-10-31', filename);
    assert.ok(Number.isInteger(actual.reading_time) && actual.reading_time > 0, filename);
    const otherMetadata = data => {
      const {reading_time, last_update, ...remaining} = data;
      const {date, ...updateOwner} = last_update;
      return {...remaining, last_update: updateOwner};
    };
    assert.deepEqual(otherMetadata(actual), otherMetadata(previousMetadata), filename);
    const anchors = source => [...source.matchAll(/\{#([^}\s]+)\}/g)].map(match => match[1]);
    assert.deepEqual(anchors(current), anchors(old), filename);
    const examples = source => source.match(/^```[^\n]*\n[\s\S]*?^```\s*$/gm) || [];
    assert.deepEqual(examples(current), examples(old), filename);
  }
});
