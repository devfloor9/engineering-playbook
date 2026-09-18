const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const {root, sourceLoader} = require('./source-loader.cjs');
const {markdownUrlFromManifest, loadManifest, forgetManifest, loadMarkdownText} =
  sourceLoader()(path.join(root, 'src/components/DocTools/manifest.js'));

const siteUrl = 'https://example.test';
const rootPath = '/engineering-playbook/';
const permalink = `${rootPath}docs/aidlc`;
const mdUrl = `${siteUrl}${rootPath}llm-wiki/aidlc/index.md`;
const options = {siteUrl, root: rootPath, permalink, locale: 'ko'};
const manifest = (md_url = mdUrl, url = `${siteUrl}${permalink}`) =>
  ({language: 'ko', docs: [{url, md_url}]});

test('Markdown lookup uses the manifest route and locale, allowing a category trailing slash', () => {
  assert.equal(markdownUrlFromManifest(manifest(), options), `${rootPath}llm-wiki/aidlc/index.md`);
  assert.equal(markdownUrlFromManifest(manifest(), {...options, permalink: `${permalink}/`}), `${rootPath}llm-wiki/aidlc/index.md`);
  assert.equal(markdownUrlFromManifest(manifest(mdUrl, `${siteUrl}${permalink}/`), options), `${rootPath}llm-wiki/aidlc/index.md`);
  assert.equal(markdownUrlFromManifest(manifest(), {...options, permalink: `${permalink}-other`}), null);
  assert.equal(markdownUrlFromManifest(manifest(), {...options, locale: 'en'}), null);
  assert.equal(markdownUrlFromManifest(manifest(), {...options, permalink: `${rootPath}en/docs/aidlc`}), null);
  assert.equal(markdownUrlFromManifest({language: 'ko', docs: []}, options), null);
  assert.equal(markdownUrlFromManifest({...manifest(), language: 'en'}, {...options, locale: 'en'}),
    `${rootPath}llm-wiki/aidlc/index.md`);
});

test('foreign, credentialed and malformed document URLs cannot match a permalink', () => {
  for (const url of [
    `https://evil.test${permalink}`, `https://name:secret@example.test${permalink}`,
    `${siteUrl}${permalink}?x=1`, `${siteUrl}${permalink}#intro`, permalink, null,
  ]) assert.equal(markdownUrlFromManifest(manifest(mdUrl, url), options), null, String(url));
});

test('unsafe Markdown URLs fail closed rather than appearing as a supported link', () => {
  for (const url of [
    'javascript:alert(1)', '//example.test/engineering-playbook/llm-wiki/a.md',
    `https://evil.test${rootPath}llm-wiki/a.md`,
    `https://user:pass@example.test${rootPath}llm-wiki/a.md`,
    `${siteUrl}${rootPath}llm-wiki-evil/a.md`,
    `${siteUrl}${rootPath}llm-wiki/a.html`,
    `${mdUrl}?download=1`, `${mdUrl}#a`,
    `${siteUrl}${rootPath}llm-wiki/../a.md`,
    `${siteUrl}${rootPath}llm-wiki/a/../b.md`,
    `${siteUrl}${rootPath}llm-wiki/%2e%2e/a.md`,
    `${siteUrl}${rootPath}llm-wiki/%252e%252e/a.md`,
    `${siteUrl}${rootPath}llm-wiki/a%2fb.md`,
    `${siteUrl}${rootPath}llm-wiki/a%5cb.md`,
    `${siteUrl}${rootPath}llm-wiki/%zz.md`,
    `${siteUrl}${rootPath}llm-wiki/\\evil.md`,
    `${mdUrl}\n`, null,
  ]) assert.throws(() => markdownUrlFromManifest(manifest(url), options), undefined, String(url));
});

test('an invalid manifest is an error, not an unsupported document', () => {
  for (const payload of [null, {}, {language: 'ko'}, {language: 'ko', docs: {}}]) {
    assert.throws(() => markdownUrlFromManifest(payload, options));
  }
});

test('manifest fetches share an in-flight request and failed requests can be retried', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_, init) => {
    assert.equal(init.redirect, 'error');
    calls += 1;
    if (calls === 1) throw new Error('offline');
    return Response.json(manifest());
  });
  const url = '/test-manifest.json';
  const first = loadManifest(url);
  assert.equal(loadManifest(url), first);
  await assert.rejects(first);
  assert.deepEqual(await loadManifest(url), manifest());
  assert.equal(calls, 2);
  forgetManifest(url);
  await loadManifest(url);
  assert.equal(calls, 3);
  forgetManifest(url);
});

test('invalid JSON payloads do not poison the manifest cache', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => Response.json(++calls === 1 ? {} : manifest()));
  await assert.rejects(loadManifest('/invalid.json'));
  assert.deepEqual(await loadManifest('/invalid.json'), manifest());
  forgetManifest('/invalid.json');
});

test('Markdown copy rejects HTTP failures, HTML (including mislabeled HTML) and redirects', async t => {
  let response;
  t.mock.method(globalThis, 'fetch', async (_, init) => {
    assert.equal(init.redirect, 'error');
    return response;
  });
  for (const [body, type, status = 200] of [
    ['missing', 'text/plain', 404], ['<html>error</html>', 'text/html'],
    ['<html>error</html>', 'application/xhtml+xml'],
    ['\ufeff \n<!DOCTYPE html><html>error</html>', 'text/plain'],
    ['<BODY>error</BODY>', 'text/markdown'], ['{}', 'application/json'],
  ]) {
    response = new Response(body, {status, headers: {'content-type': type}});
    await assert.rejects(loadMarkdownText('/export.md'));
  }
  for (const type of ['text/markdown; charset=utf-8', 'text/plain', 'application/octet-stream']) {
    response = new Response('# 문서\n\nPreserve **Markdown**.', {headers: {'content-type': type}});
    assert.equal(await loadMarkdownText('/export.md'), '# 문서\n\nPreserve **Markdown**.');
  }
});
