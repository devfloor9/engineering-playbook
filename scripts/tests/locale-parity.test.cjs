const assert = require('node:assert/strict');
const {execFileSync, spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {test} = require('node:test');
const {analyzeDocument, compareDocuments, scan} = require('../check-locale-parity.cjs');

const root = path.resolve(__dirname, '../..');
const cli = path.join(root, 'scripts/check-locale-parity.cjs');
const koDir = 'i18n/ko/docusaurus-plugin-content-docs/current';

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(process.env.KIROCREW_SCRATCH || os.tmpdir(), 'locale-parity-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  for (const part of ['docs', koDir]) fs.mkdirSync(path.join(directory, part), {recursive: true});
  return {
    directory,
    put(locale, name, text) {
      const file = path.join(directory, locale === 'en' ? 'docs' : koDir, name);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, text);
    },
  };
}

test('fenced code and frontmatter never create headings or prose versions', () => {
  const source = '---\ntitle: Example\nversion: v9.9\n---\n## Heading\n````yaml\n# not a heading\nimage: v8.8\n```\n````\n### Next\n';
  const actual = analyzeDocument(source);
  assert.deepEqual(actual.headings.map(item => item.level), [2, 3]);
  assert.deepEqual(actual.versions, []);
  assert.equal(actual.blocks.length, 1);
  assert.match(actual.blocks[0].body, /# not a heading\nimage: v8\.8\n```/);
  assert.equal(actual.blocks[0].unclosed, undefined);
});

test('recognizes tilde fences, CRLF, setext headings and unclosed blocks', () => {
  const actual = analyzeDocument('Title\r\n=====\r\n~~~sh\r\n# comment\r\n~~~\r\n## Next\r\n```js\r\ncode');
  assert.deepEqual(actual.headings.map(item => item.level), [1, 2]);
  assert.equal(actual.blocks.length, 2);
  assert.equal(actual.blocks[1].unclosed, true);
});

test('ignores multiline and inline HTML comments without hiding real headings', () => {
  const source = '## Visible <!-- EKS 9.9 -->\n<!--\n## Hidden\nCilium 1.99\n```\n-->\n## Next\nText `<!--` stays code\n### Last\n';
  const actual = analyzeDocument(source);
  assert.deepEqual(actual.headings.map(item => item.level), [2, 2, 3]);
  assert.deepEqual(actual.versions, []);
  assert.deepEqual(actual.blocks, []);
});

test('HTML-like text inside fenced code does not hide later prose', () => {
  const actual = analyzeDocument('```html\n<!--\n# comment\n```\n## Visible\nEKS 1.32');
  assert.deepEqual(actual.headings.map(item => item.level), [2]);
  assert.equal(actual.versions[0].value, '1.32');
});

test('identical structure and version numbers compare equal despite translated headings', () => {
  const en = '## Health\nEKS 1.32+ and v2.9\n```yaml\nport: 8080\n```\n';
  const ko = '## 상태\r\nEKS 1.32+ 및 v2.9\r\n```yaml\r\nport: 8080\r\n```\r\n';
  assert.deepEqual(compareDocuments(en, ko), {});
});

test('compares product names with versions and normalizes established aliases', () => {
  const result = compareDocuments('EKS 1.32', 'Kubernetes 1.32');
  assert.equal(result.versions.english[0].product, 'eks');
  assert.equal(result.versions.korean[0].product, 'kubernetes');
  assert.deepEqual(compareDocuments('K8s 1.32 and Node.js 20.1', 'Kubernetes 1.32 및 Node 20.1'), {});
  assert.equal(compareDocuments('Cilium 1.15', 'Cilium 1.16').versions.korean[0].value, '1.16');
  assert.deepEqual(compareDocuments('Weaviate 1.15', 'Weaviate 1.16'), {});
});

test('compares leading heading numbers but not translated heading text', () => {
  assert.deepEqual(compareDocuments('### 2.1 English', '### 2.1 한국어'), {});
  const result = compareDocuments('### 2.1 English', '### 2.2 한국어');
  assert.equal(result.headings.english[0].number, '2.1');
  assert.equal(result.headings.korean[0].number, '2.2');
});

test('reports differing heading levels, version occurrences and fenced example content', () => {
  const en = '## Health\nEKS 1.32+\n```yaml\nport: 8080\n```\n';
  const ko = '### 상태\nEKS 1.33+\n```yaml\nport: 8081\n```\n';
  const result = compareDocuments(en, ko);
  assert.deepEqual(result.headings.english.map(item => item.level), [2]);
  assert.deepEqual(result.headings.korean.map(item => item.level), [3]);
  assert.deepEqual(result.versions.english.map(item => item.value), ['1.32']);
  assert.deepEqual(result.versions.korean.map(item => item.value), ['1.33']);
  assert.deepEqual(result.code.map(item => item.index), [1]);
  assert.equal(result.code[0].english.line, 3);
});

test('reports missing and changed code blocks without treating them as confirmed errors', () => {
  const result = compareDocuments('```yaml\n# English comment\na: 1\n```\n```js\nx()\n```', '```yaml\n# 한국어 주석\na: 1\n```');
  assert.equal(result.code.length, 2);
  assert.equal(result.code[1].korean, null);
});

test('pairs by relative path and sorts missing and changed pages deterministically', t => {
  const f = fixture(t);
  f.put('en', 'b.md', '## B\nEKS 1.32');
  f.put('ko', 'b.md', '### 나\nEKS 1.33');
  f.put('en', 'z.mdx', '# Only English');
  f.put('ko', 'a.md', '# 한국어만');
  const result = scan(f.directory);
  assert.deepEqual(result.missing, [{path: 'a.md', missing: 'en'}, {path: 'z.mdx', missing: 'ko'}]);
  assert.equal(result.summary.pairedDocuments, 1);
  assert.equal(result.summary.headingDifferentPages, 1);
  assert.equal(result.summary.versionDifferentPages, 1);
  assert.match(result.notice, /not proof of an error/);
  assert.equal(result.differences[0].path, 'b.md');
  const output = execFileSync(process.execPath, [cli, '--root', f.directory, '--json'], {encoding: 'utf8'});
  assert.deepEqual(JSON.parse(output), result);
  const summary = execFileSync(process.execPath, [cli, '--root', f.directory, '--summary', '--json'], {encoding: 'utf8'});
  assert.deepEqual(JSON.parse(summary).summary, result.summary);
  assert.equal('differences' in JSON.parse(summary), false);
  const plain = execFileSync(process.execPath, [cli, '--root', f.directory, '--summary'], {encoding: 'utf8'});
  assert.doesNotMatch(plain, /MISSING|REVIEW/);
  assert.match(plain, /limited to EKS/);
  assert.match(plain, /not translated meaning/);
});

test('CLI fails on invalid arguments and missing roots but not on review candidates', t => {
  const f = fixture(t);
  f.put('en', 'missing.md', '# only');
  assert.equal(spawnSync(process.execPath, [cli, '--root', f.directory]).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, '--bad']).status, 2);
  assert.equal(spawnSync(process.execPath, [cli, '--root', path.join(f.directory, 'missing')]).status, 2);
});

test('reports skipped file and directory symlinks without calling counterparts missing', t => {
  const f = fixture(t);
  const outside = path.join(f.directory, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'secret.md'), '# Target');
  fs.symlinkSync(outside, path.join(f.directory, 'docs', 'linked-dir'), 'dir');
  fs.symlinkSync(path.join(outside, 'secret.md'), path.join(f.directory, 'docs', 'linked.md'), 'file');
  f.put('ko', 'linked-dir/secret.md', '# 번역');
  f.put('ko', 'linked.md', '# 번역');
  const result = scan(f.directory);
  assert.deepEqual(result.warnings.map(item => item.location), ['docs/linked-dir', 'docs/linked.md']);
  assert.deepEqual(result.unscanned, [
    {path: 'linked-dir/secret.md', locale: 'en'},
    {path: 'linked.md', locale: 'en'},
  ]);
  assert.equal(result.summary.missingEnglish, 0);
  assert.equal(result.summary.unscannedEnglish, 2);
  assert.equal(result.summary.skippedSymlinks, 2);
  const summary = JSON.parse(execFileSync(process.execPath, [cli, '--root', f.directory, '--summary', '--json'], {encoding: 'utf8'}));
  assert.deepEqual(summary.warnings, result.warnings);
  assert.match(execFileSync(process.execPath, [cli, '--root', f.directory, '--summary'], {encoding: 'utf8'}), /scan is incomplete/);
});

test('does not follow a symlink at a documentation root', t => {
  const f = fixture(t);
  fs.renameSync(path.join(f.directory, 'docs'), path.join(f.directory, 'real-docs'));
  fs.symlinkSync('real-docs', path.join(f.directory, 'docs'), 'dir');
  f.put('ko', 'paired.md', '# 한국어');
  const result = scan(f.directory);
  assert.equal(result.warnings[0].location, 'docs');
  assert.equal(result.summary.unscannedEnglish, 1);
  assert.equal(result.summary.missingEnglish, 0);
});

function healthBaselineFixture(english, korean) {
  const baseline = /\bEKS\s+(\d+\.\d+)\+/;
  const enVersion = english.match(baseline)?.[1];
  const koVersion = korean.match(baseline)?.[1];
  assert.ok(enVersion && koVersion, 'both health-check pages need a baseline version');
  // If the documents are fixed later, retain a mismatch fixture without freezing the defect.
  const expectedKo = enVersion === koVersion ? '999.998' : koVersion;
  if (enVersion === koVersion) korean = korean.replace(baseline, `EKS ${expectedKo}+`);
  return {enVersion, expectedKo, result: compareDocuments(english, korean)};
}

test('detects the health-check baseline version difference', () => {
  const file = 'eks-best-practices/operations-reliability/eks-debugging/health-check-mismatch.md';
  const english = fs.readFileSync(path.join(root, 'docs', file), 'utf8');
  const korean = fs.readFileSync(path.join(root, koDir, file), 'utf8');
  const {enVersion, expectedKo, result} = healthBaselineFixture(english, korean);
  assert.ok(result.versions.english.some(item => item.value === enVersion));
  assert.ok(result.versions.korean.some(item => item.value === expectedKo));
});

test('health-check test remains valid after the baseline mismatch is fixed', () => {
  const english = '## Overview\nEKS 1.32+ and v2.9';
  const korean = '## 개요\nEKS 1.32+ 및 v2.9';
  const {enVersion, expectedKo, result} = healthBaselineFixture(english, korean);
  assert.equal(enVersion, '1.32');
  assert.equal(expectedKo, '999.998');
  assert.ok(result.versions.korean.some(item => item.value === '999.998'));
});
