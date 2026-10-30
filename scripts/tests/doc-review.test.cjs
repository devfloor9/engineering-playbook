const assert = require('node:assert/strict');
const {execFileSync, spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {test} = require('node:test');
const {inspectDocument, inspectField, scan, validDate} = require('../check-doc-review.cjs');

const root = path.resolve(__dirname, '../..');
const cli = path.join(root, 'scripts/check-doc-review.cjs');
const koDir = 'i18n/ko/docusaurus-plugin-content-docs/current';
const TODAY = '2026-10-30';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(process.env.KIROCREW_SCRATCH || os.tmpdir(), 'doc-review-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  for (const part of ['docs', koDir]) fs.mkdirSync(path.join(directory, part), {recursive: true});
  return {
    directory,
    put(locale, name, content) {
      const full = path.join(directory, locale === 'en' ? 'docs' : koDir, name);
      fs.mkdirSync(path.dirname(full), {recursive: true});
      fs.writeFileSync(full, content);
      return full;
    },
  };
}

const source = content => `---\n${content}\n---\n\nBody\n`;

test('missing, null and explicit unknown values remain unconfirmed', () => {
  const fields = inspectDocument(source('review:\n  owner: null\n  reviewed_on: 미확인\n  status: TBD'), TODAY).fields;
  assert.deepEqual(fields.owner, {state: 'unconfirmed', reason: 'null'});
  assert.deepEqual(fields.reviewed_on, {state: 'unconfirmed', reason: 'placeholder'});
  assert.deepEqual(fields.status, {state: 'unconfirmed', reason: 'placeholder'});
  assert.deepEqual(fields.next_review, {state: 'unconfirmed', reason: 'missing'});
  assert.equal(inspectDocument('# No frontmatter', TODAY).fields.owner.state, 'unconfirmed');
});

test('recognizes valid status values and reports invalid owners, mappings and statuses', () => {
  for (const status of ['draft', 'published', 'review_needed', 'retired']) {
    assert.deepEqual(inspectField('status', status, TODAY), {state: 'known', value: status});
  }
  assert.equal(inspectField('status', 'active', TODAY).state, 'invalid');
  assert.equal(inspectField('owner', '', TODAY).state, 'invalid');
  assert.equal(inspectField('owner', ['team'], TODAY).state, 'invalid');
  assert.equal(inspectDocument(source('review: []'), TODAY).error.kind, 'invalid_review');
  assert.equal(inspectDocument(source('review: later'), TODAY).error.kind, 'invalid_review');
  assert.equal(inspectDocument(source('- unexpected list'), TODAY).error.kind, 'invalid_frontmatter');
  assert.equal(inspectDocument(source('unexpected scalar'), TODAY).error.kind, 'invalid_frontmatter');
});

test('checks actual calendar dates without YAML timestamp rollover', () => {
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2026-10-30T00:00:00Z'), false);
  for (const date of ['2026-02-30', '"2026-02-30"']) {
    const result = inspectDocument(source(`review:\n  reviewed_on: ${date}`), TODAY);
    assert.equal(result.fields.reviewed_on.state, 'invalid');
  }
  assert.equal(inspectDocument(source('review:\n  reviewed_on: 2026-10-30'), TODAY).fields.reviewed_on.state, 'known');
  assert.equal(inspectDocument(source('review:\n  reviewed_on: "2026-10-31"'), TODAY).fields.reviewed_on.state, 'invalid');
});

test('treats the scheduled date as valid through that day', () => {
  assert.equal(inspectField('next_review', '2026-10-29', TODAY).state, 'expired');
  assert.equal(inspectField('next_review', TODAY, TODAY).state, 'known');
  assert.equal(inspectField('next_review', '2026-10-31', TODAY).state, 'known');
  assert.equal(inspectField('next_review', TODAY, '2026-10-31').state, 'expired');
});

test('rejects a next review earlier than the recorded review', () => {
  const fields = inspectDocument(source('review:\n  reviewed_on: 2026-10-29\n  next_review: 2026-10-28'), TODAY).fields;
  assert.equal(fields.next_review.state, 'invalid');
  assert.match(fields.next_review.reason, /precedes/);
});

test('reports YAML syntax errors without replacing them with unknown fields', () => {
  const result = inspectDocument(source('review: [unfinished'), TODAY);
  assert.equal(result.error.kind, 'yaml');
  assert.equal(result.fields, undefined);
});

test('unclosed frontmatter is a YAML error and makes the scan incomplete', t => {
  const f = fixture(t);
  const text = '---\nreview:\n  owner: platform\n  reviewed_on: 2026-10-30\n';
  assert.equal(inspectDocument(text, TODAY).error.kind, 'yaml');
  assert.match(inspectDocument(text, TODAY).error.message, /missing closing/);
  f.put('en', 'unclosed.md', text);
  const result = scan(f.directory, {today: TODAY});
  assert.equal(result.summary.yamlErrorDocuments, 1);
  assert.equal(result.scanComplete, false);
  const run = spawnSync(process.execPath, [cli, '--root', f.directory, '--date', TODAY, '--summary'], {encoding: 'utf8'});
  assert.equal(run.status, 2);
  assert.match(run.stdout, /Unclosed frontmatter/);
});

test('scans both locales with deterministic dates and keeps category counts separate', t => {
  const f = fixture(t);
  const complete = source('review:\n  owner: platform-team\n  reviewed_on: 2026-10-01\n  status: published\n  next_review: 2026-10-30');
  const due = source('review:\n  owner: platform-team\n  reviewed_on: 2026-09-01\n  status: review_needed\n  next_review: 2026-10-29');
  const file = f.put('en', 'a.md', complete);
  f.put('en', 'b.md', due);
  f.put('ko', 'a.md', '# No review metadata');
  f.put('ko', 'broken.md', source('review: [unfinished'));
  const before = fs.readFileSync(file, 'utf8');
  const result = scan(f.directory, {today: TODAY});
  assert.equal(result.summary.englishDocuments, 2);
  assert.equal(result.summary.koreanDocuments, 2);
  assert.equal(result.summary.completeDocuments, 1);
  assert.match(result.notice, /complete means fields are populated, not that a review was performed/);
  assert.equal(result.summary.unconfirmedDocuments, 1);
  assert.equal(result.summary.expiredDocuments, 1);
  assert.equal(result.summary.yamlErrorDocuments, 1);
  assert.equal(result.scanComplete, false);
  assert.deepEqual(result.documents.map(item => item.path), [
    'docs/a.md', 'docs/b.md', `${koDir}/a.md`, `${koDir}/broken.md`,
  ]);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('JSON summary exposes parse errors and exits 2 for an incomplete scan', t => {
  const f = fixture(t);
  f.put('en', 'bad.md', source('review: [unfinished'));
  const run = spawnSync(process.execPath, [cli, '--root', f.directory, '--date', TODAY, '--summary', '--json'], {encoding: 'utf8'});
  assert.equal(run.status, 2);
  const data = JSON.parse(run.stdout);
  assert.equal(data.summary.yamlErrorDocuments, 1);
  assert.equal(data.errors[0].error.kind, 'yaml');
  assert.equal(data.checkedOn, TODAY);
  assert.equal(data.documents, undefined);
});

test('invalid review or frontmatter structure makes the scan incomplete', t => {
  const f = fixture(t);
  f.put('en', 'bad-review.md', source('review: []'));
  f.put('ko', 'bad-frontmatter.md', source('- unexpected list'));
  const result = scan(f.directory, {today: TODAY});
  assert.equal(result.summary.invalidDocuments, 2);
  assert.equal(result.summary.structureErrorDocuments, 2);
  assert.equal(result.scanComplete, false);
  const run = spawnSync(process.execPath, [cli, '--root', f.directory, '--date', TODAY, '--summary', '--json'], {encoding: 'utf8'});
  assert.equal(run.status, 2);
  assert.equal(JSON.parse(run.stdout).errors.length, 2);
});

test('invalid individual fields remain review candidates, not scan errors', t => {
  const f = fixture(t);
  f.put('en', 'bad-field.md', source('review:\n  status: active'));
  const result = scan(f.directory, {today: TODAY});
  assert.equal(result.summary.invalidDocuments, 1);
  assert.equal(result.summary.structureErrorDocuments, 0);
  assert.equal(result.scanComplete, true);
  assert.equal(spawnSync(process.execPath, [cli, '--root', f.directory, '--date', TODAY, '--summary']).status, 0);
});

test('symlink files and directories are skipped, named, and make the scan incomplete', t => {
  const f = fixture(t);
  const external = path.join(f.directory, 'outside');
  fs.mkdirSync(external);
  fs.writeFileSync(path.join(external, 'hidden.md'), '# outside');
  fs.symlinkSync(external, path.join(f.directory, 'docs', 'linked-dir'), 'dir');
  fs.symlinkSync(path.join(external, 'hidden.md'), path.join(f.directory, 'docs', 'linked.md'), 'file');
  const result = scan(f.directory, {today: TODAY});
  assert.deepEqual(result.warnings.map(item => item.path), ['docs/linked-dir', 'docs/linked.md']);
  assert.equal(result.summary.englishDocuments, 0);
  assert.equal(result.scanComplete, false);
  const run = spawnSync(process.execPath, [cli, '--root', f.directory, '--date', TODAY, '--summary'], {encoding: 'utf8'});
  assert.equal(run.status, 2);
  assert.match(run.stdout, /WARNING skipped EN symlink docs\/linked-dir/);
});

test('a symlink documentation root is skipped rather than followed', t => {
  const f = fixture(t);
  fs.renameSync(path.join(f.directory, 'docs'), path.join(f.directory, 'real-docs'));
  fs.symlinkSync('real-docs', path.join(f.directory, 'docs'), 'dir');
  const result = scan(f.directory, {today: TODAY});
  assert.equal(result.warnings[0].path, 'docs');
  assert.equal(result.scanComplete, false);
});

test('CLI rejects invalid clock dates and returns 0 for ordinary unknown metadata', t => {
  const f = fixture(t);
  f.put('en', 'unknown.md', '# Missing review metadata');
  assert.equal(spawnSync(process.execPath, [cli, '--root', f.directory, '--date', '2026-02-30']).status, 2);
  const output = execFileSync(process.execPath, [cli, '--root', f.directory, '--date', TODAY, '--summary', '--json'], {encoding: 'utf8'});
  const data = JSON.parse(output);
  assert.equal(data.summary.unconfirmedDocuments, 1);
  assert.equal(data.scanComplete, true);
});
