const assert = require('node:assert/strict');
const {test} = require('node:test');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

test('generated AI documentation describes its actual language and routes', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-wiki-language-'));
  try {
    for (const script of ['generate-llm-wiki.js', 'generate-llms-txt.js']) {
      execFileSync(process.execPath, [path.join(root, 'scripts', script), '--out', outputDir], {
        cwd: root,
        stdio: 'pipe',
      });
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'llm-wiki/manifest.json'), 'utf8'));
    const wikiIndex = fs.readFileSync(path.join(outputDir, 'llm-wiki/index.md'), 'utf8');
    const discovery = fs.readFileSync(path.join(outputDir, 'llms.txt'), 'utf8');
    const page = fs.readFileSync(path.join(outputDir, 'llm-wiki/intro.md'), 'utf8');

    assert.equal(manifest.language, 'en');
    assert.match(wikiIndex, /- Language: English \(en\)/);
    assert.match(discovery, /- Language: English \(en\); Korean \(ko\) web pages are available under \/ko\//);
    assert.doesNotMatch(wikiIndex + discovery, /Korean \(ko\) primary|English \(en\) mirror under \/en\//);
    assert.ok(manifest.docs.some(doc => doc.slug === 'intro'));
    assert.ok(page.includes('source_url: https://devfloor9.github.io/engineering-playbook/docs/intro'));
  } finally {
    fs.rmSync(outputDir, {recursive: true, force: true});
  }
});
