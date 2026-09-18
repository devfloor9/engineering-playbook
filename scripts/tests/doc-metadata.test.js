const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const matter = require('gray-matter');
const {readingTime, updateContentMetadata, writeBatch} = require('../doc-metadata');

const source = `---
title: Example
created: 2026-02-05
last_update:
  date: 2026-03-01
  author: Original Author
reading_time: 4
tags: [example]
---

# Heading

Article text.
`;
const filePath = path.resolve(__dirname, '../../docs/intro.md');

test('content edits change only the update date and estimate, preserving creation, author and body', () => {
  const output = updateContentMetadata(source, '2026-09-18', 6);
  assert.equal(output, source.replace('date: 2026-03-01', 'date: 2026-09-18').replace('reading_time: 4', 'reading_time: 6'));
  assert.deepEqual(matter(output).data.created, matter(source).data.created);
  assert.equal(matter(output).data.last_update.author, 'Original Author');
  assert.equal(matter(output).content, matter(source).content);
  assert.equal(updateContentMetadata(output, '2026-09-18', 6), output);
});

test('missing update fields and inline objects preserve existing metadata', () => {
  const output = updateContentMetadata(source.replace(/last_update:\n  date:.*\n  author:.*\n/, 'last_update: {date: 2026-03-01, author: Original Author}\n'), '2026-09-18', 2);
  assert.equal(matter(output).data.last_update.author, 'Original Author');
  const missing = updateContentMetadata(source.replace(/last_update:\n  date:.*\n  author:.*\nreading_time:.*\n/, ''), '2026-09-18', 2);
  assert.equal(matter(missing).data.reading_time, 2);
  assert.throws(() => updateContentMetadata(source, '2026-02-30', 2), /valid/);
});

test('reading estimate follows visible prose and table text, excluding code and presentation markup', async () => {
  const text = 'Read '.repeat(200);
  const plain = await readingTime(`${source}\n${text}`, filePath);
  const formatted = await readingTime(`${source}\n**${text}**\n\n<!-- presentation comment -->\n\n\`\`\`js\n${'code'.repeat(2000)}\n\`\`\`\n`, filePath);
  assert.equal(plain, formatted);
  assert.ok(await readingTime(`${source}\n${text.repeat(4)}`, filePath) > plain);
  const table = await readingTime(`${source}\n| Content |\n| --- |\n| ${text} |\n`, filePath);
  assert.equal(table, plain);
  assert.equal(await readingTime('', filePath), 1);
});

test('shared Figure and Icon styling does not inflate the estimate', async () => {
  const imports = `import Figure from '@site/src/components/Figure';\nimport Icon from '@site/src/components/Icon';\n`;
  const body = 'word '.repeat(240);
  const a = await readingTime(`${imports}<Figure title="Capacity"><p>${body}</p></Figure>`, filePath);
  const b = await readingTime(`${imports}<Figure title="Capacity" className="new-design"><p><Icon name="cpu" size={24} />${body}</p></Figure>`, filePath);
  assert.equal(a, b);
  await assert.rejects(readingTime(`import Unknown from '@site/src/components/Unknown';\n<Unknown />`, filePath), /omitted content/);
});

test('English sidebar cards contribute localized text to reading estimates', async () => {
  const file = path.resolve(__dirname, '../../i18n/en/docusaurus-plugin-content-docs/current/agentic-ai-platform/index.md');
  const result = await readingTime(fs.readFileSync(file, 'utf8'), file);
  assert.ok(Number.isInteger(result) && result > 0);
  assert.equal(require('../llm-wiki-components').staticRenderer.locale, 'ko');
});

test('presentation mode leaves source dates and reading time byte-for-byte unchanged', async () => {
  const {main} = require('../update-doc-metadata');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-metadata-'));
  fs.mkdirSync(path.join(directory, 'docs'));
  const target = path.join(directory, 'docs/article.md');
  try {
    fs.writeFileSync(target, source);
    const timestamp = fs.statSync(target).mtimeMs;
    await main(['--kind', 'presentation', '--apply', target], {workspace: directory});
    assert.equal(fs.readFileSync(target, 'utf8'), source);
    assert.equal(fs.statSync(target).mtimeMs, timestamp);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('nested date-like author text is preserved with nonstandard indentation', () => {
  const input = source.replace('  date: 2026-03-01\n  author: Original Author', '    author: |\n      date: Original Author\n    date: 2026-03-01');
  const result = matter(updateContentMetadata(input, '2026-09-18', 2)).data;
  assert.equal(result.last_update.author, 'date: Original Author\n');
  assert.equal(result.last_update.date.toISOString().slice(0, 10), '2026-09-18');
});

test('anchor IDs and hidden HTML do not contribute to the reading estimate', async () => {
  const plain = await readingTime('# Topic\n\nVisible text.', filePath);
  assert.equal(await readingTime(`# Topic {#${'anchor'.repeat(200)}}\n\nVisible text.`, filePath), plain);
  for (const attr of ['hidden', 'aria-hidden="true"', 'style="display:none"']) {
    assert.equal(await readingTime(`# Topic\n\nVisible text.\n\n<div ${attr}>${'hidden'.repeat(400)}</div>`, filePath), plain);
    assert.equal(await readingTime(`# Topic\n\nVisible text.<span ${attr}>${'hidden'.repeat(400)}</span>`, filePath), plain);
    assert.equal(await readingTime(`# Topic\n\nVisible text.\n\n<div ${attr}>\n\n${'hidden'.repeat(400)}\n\n</div>`, filePath), plain);
  }
});

test('a failed replacement restores prior documents without truncating any source', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-metadata-'));
  try {
    const updates = ['first.md', 'second.md'].map(name => {
      const full = path.join(directory, name);
      fs.writeFileSync(full, source);
      return {full, source, output: updateContentMetadata(source, '2026-09-18', 3)};
    });
    let renames = 0;
    const io = {...fs, renameSync: (...args) => {
      if (++renames === 2) throw new Error('Injected write failure');
      fs.renameSync(...args);
    }};
    assert.throws(() => writeBatch(updates, io), /Injected write failure/);
    for (const update of updates) assert.equal(fs.readFileSync(update.full, 'utf8'), source);
    assert.deepEqual(fs.readdirSync(directory).sort(), ['first.md', 'second.md']);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('a symlink outside the documentation directory is rejected', async () => {
  const {main} = require('../update-doc-metadata');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-metadata-'));
  try {
    fs.mkdirSync(path.join(directory, 'docs'));
    const external = path.join(directory, 'outside.md');
    fs.writeFileSync(external, source);
    const link = path.join(directory, 'docs/link.md');
    fs.symlinkSync(external, link);
    await assert.rejects(main(['--kind', 'content', '--date', '2026-09-18', '--apply', link], {workspace: directory}), /Symlinked/);
    assert.equal(fs.readFileSync(external, 'utf8'), source);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
