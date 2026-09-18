const assert = require('node:assert/strict');
const {test} = require('node:test');
const {PassThrough} = require('node:stream');
const {text} = require('node:stream/consumers');
const React = require('react');
const {renderToString, renderToPipeableStream} = require('react-dom/server');
const fs = require('node:fs');
const path = require('node:path');

function renderStream(app) {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const stream = renderToPipeableStream(app, {
      onError: reject,
      onAllReady() {
        stream.pipe(output);
        text(output).then(resolve, reject);
      },
    });
  });
}

test('streamed Korean HTML preserves text and anchor IDs across buffer boundaries', async () => {
  const headings = Array.from({length: 160}, (_, index) =>
    React.createElement('section', {key: index},
      React.createElement('h2', {id: `section-${index}-모니터링`}, `${index}. EKS Control Plane 모니터링`),
      React.createElement('p', null, '워크로드 규모에 따른 확장과 관측성. '.repeat(17)),
      React.createElement('a', {href: `#section-${index}-모니터링`}, '이 섹션으로 이동'),
    ),
  );
  const app = React.createElement('main', null, headings);
  const reference = renderToString(app);
  const streamed = await renderStream(app);
  assert.equal(streamed.includes('\0'), false, 'HTML must not contain NUL bytes');
  assert.equal(streamed, reference, 'Streaming must preserve the same text and IDs');
});

test('document API placeholders render as literal text instead of MDX variables', async () => {
  const {compile, run} = await import('@mdx-js/mdx');
  const root = path.resolve(__dirname, '../..');
  const cases = [
    ['design-architecture/platform-selection/agentcore-hybrid-strategy.md', 'ac-{session_id}'],
    ['model-serving/gpu-infrastructure/criu-gpu-migration.md', '/checkpoint/{namespace}/{pod}/{container}'],
  ];
  for (const [file, placeholder] of cases) {
    const source = fs.readFileSync(path.join(root,
      'i18n/en/docusaurus-plugin-content-docs/current/agentic-ai-platform', file), 'utf8');
    const paragraph = source.split(/\n\s*\n/).find(value => value.includes(placeholder));
    assert.ok(paragraph, `Missing API example in ${file}`);
    const compiled = await compile(paragraph, {outputFormat: 'function-body'});
    const {default: Content} = await run(compiled, require('react/jsx-runtime'));
    const html = renderToString(React.createElement(Content));
    assert.ok(html.includes(placeholder), `The API placeholder must remain visible in ${file}`);
  }
});
