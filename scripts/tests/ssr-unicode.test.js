const assert = require('node:assert/strict');
const {test} = require('node:test');
const {PassThrough} = require('node:stream');
const {text} = require('node:stream/consumers');
const React = require('react');
const {renderToString, renderToPipeableStream} = require('react-dom/server');

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
