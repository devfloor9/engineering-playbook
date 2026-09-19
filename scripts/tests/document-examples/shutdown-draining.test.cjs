'use strict';

// Evaluates the exact HTTP block from each document with inert test doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {EventEmitter} = require('node:events');
const {test} = require('node:test');

const DOCS = {
  ko: 'docs/eks-best-practices/operations-reliability/pod-lifecycle/shutdown-draining.md',
  en: 'i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/operations-reliability/pod-lifecycle/shutdown-draining.md',
};
function argumentsFrom(argv) {
  const options = {root: process.env.SHUTDOWN_DOC_ROOT || process.cwd(), mutation: '', case: ''};
  for (let i = 0; i < argv.length; i += 2) {
    assert.ok(['--root', '--mutation', '--case'].includes(argv[i]), `Unknown option ${argv[i]}`);
    assert.ok(argv[i + 1], `Missing value for ${argv[i]}`);
    options[argv[i].slice(2)] = argv[i + 1];
  }
  return options;
}
const options = argumentsFrom(process.argv.slice(2));
const root = path.resolve(options.root);
const repoLayout = Object.values(DOCS).map(file => fs.existsSync(path.join(root, file)));
const proposalLayout = Object.keys(DOCS).map(locale => fs.existsSync(path.join(root, `${locale}.md`)));
assert.ok(repoLayout.every(Boolean) || (!repoLayout.some(Boolean) && proposalLayout.every(Boolean)),
  'Root must contain both canonical document paths, or both ko.md and en.md snapshots; mixed/missing extraction is forbidden');

function extract(locale) {
  const filename = path.join(root, repoLayout.every(Boolean) ? DOCS[locale] : `${locale}.md`);
  const text = fs.readFileSync(filename, 'utf8');
  const lines = text.split('\n');
  const sections = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) { fence = !fence; continue; }
    if (!fence && /^#{1,6}\s/.test(lines[i])) sections.push({index: i, text: lines[i]});
  }
  assert.equal(fence, false, `${filename}: unclosed fence`);
  const hits = sections.filter(section => section.text.includes('{#http-keep-alive-연결-처리}'));
  assert.equal(hits.length, 1, `${filename}: expected exactly one HTTP section`);
  const start = hits[0].index;
  const end = sections.find(section => section.index > start)?.index ?? lines.length;
  const section = lines.slice(start + 1, end).join('\n');
  const blocks = [...section.matchAll(/^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)];
  assert.equal(blocks.length, 1, `${filename}: HTTP section must have exactly one code block`);
  assert.equal(blocks[0][1].trim(), 'javascript', `${filename}: unexpected code language`);
  assert.ok(blocks[0][2].trim(), `${filename}: empty HTTP block`);
  const code = blocks[0][2];
  const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
  console.log('EXTRACTION ' + JSON.stringify({
    locale, document: DOCS[locale], actualFile: filename, sourceSha256: sha256(text),
    codeSha256: sha256(code), sectionLines: [start + 1, end], mutation: options.mutation || null,
  }));
  return code;
}

function replaceExactlyOnce(code, before, after) {
  assert.equal(code.split(before).length - 1, 1, `Mutation site missing/ambiguous: ${before}`);
  return code.replace(before, after);
}
function mutate(code) {
  switch (options.mutation) {
    case '': return code;
    case 'early-destroy':
      return replaceExactlyOnce(code, 'isShuttingDown = true;',
        'isShuttingDown = true; for (const conn of activeConnections) conn.destroy();');
    case 'admission-bypass':
      return replaceExactlyOnce(code, 'if (isShuttingDown) {', 'if (false) {');
    case 'timeout-success':
      return replaceExactlyOnce(code, 'timedOut = true;\n    process.exitCode = 1;',
        'timedOut = true;\n    process.exitCode = 0;');
    case 'no-idempotence':
      return replaceExactlyOnce(code, 'if (isShuttingDown) return;', '/* removed idempotence guard */');
    case 'success-after-timeout':
      return replaceExactlyOnce(code, 'else if (!timedOut)', 'else if (true)');
    default: throw new Error(`Unknown mutation ${options.mutation}`);
  }
}

function load(code) {
  const records = {log: [], error: [], exits: [], closeCalls: 0, timerCalls: 0, cleared: []};
  const middleware = [];
  const signals = new Map();
  const timers = new Map();
  const server = new EventEmitter();
  let now = 0;
  let nextTimer = 1;
  let closeCallback;
  server.close = callback => { records.closeCalls++; closeCallback = callback; };
  const app = {
    use(callback) { middleware.push(callback); },
    listen(port) { assert.equal(port, 8080); return server; },
  };
  const processDouble = {
    exitCode: undefined,
    on(name, callback) {
      const handlers = signals.get(name) || [];
      handlers.push(callback);
      signals.set(name, handlers);
    },
    exit(code) { records.exits.push(code); },
  };
  const context = vm.createContext({
    require(name) {
      assert.equal(name, 'express', 'Only the fake express module may be imported');
      return () => app;
    },
    console: {
      log: (...args) => records.log.push(args.map(String).join(' ')),
      error: (...args) => records.error.push(args.map(String).join(' ')),
    },
    process: processDouble,
    setTimeout(callback, delay) {
      assert.ok(Number.isFinite(delay) && delay >= 0);
      const id = nextTimer++;
      records.timerCalls++;
      timers.set(id, {callback, due: now + delay, delay});
      return id;
    },
    clearTimeout(id) { records.cleared.push(id); timers.delete(id); },
  }, {codeGeneration: {strings: false, wasm: false}});
  new vm.Script(code, {filename: 'extracted-http.cjs'}).runInContext(context, {timeout: 1000});
  assert.equal(signals.get('SIGTERM')?.length, 1, 'Exactly one SIGTERM callback must be tested');
  function connection() {
    const conn = new EventEmitter();
    conn.destroyCalls = 0;
    conn.destroy = () => { conn.destroyCalls++; conn.emit('close'); };
    server.emit('connection', conn);
    return conn;
  }
  function request() {
    const response = {
      headers: {}, statusCode: 200, ended: false, nextCalls: 0,
      setHeader(name, value) { this.headers[name] = value; },
      end(body) { this.ended = true; this.body = body; },
    };
    let index = 0;
    const next = () => {
      if (index < middleware.length) middleware[index++]({}, response, next);
      else response.nextCalls++;
    };
    next();
    return response;
  }
  return {
    records, process: processDouble, timers, request, connection,
    signal() { signals.get('SIGTERM')[0](); },
    deadline() { assert.equal(timers.size, 1); return [...timers.values()][0].delay; },
    advance(ms) {
      now += ms;
      for (;;) {
        const due = [...timers.entries()].find(([, timer]) => timer.due <= now);
        if (!due) break;
        timers.delete(due[0]);
        due[1].callback();
      }
    },
    completeClose(err) { assert.equal(typeof closeCallback, 'function'); closeCallback(err); },
  };
}
const successfulDrain = h => h.records.log.some(line => /HTTP connections drained/.test(line));
const scenarios = [
  ['admission gate preserves previously dispatched work', h => {
    const admitted = h.request();
    assert.equal(admitted.nextCalls, 1);
    h.signal();
    const rejected = h.request();
    assert.equal(rejected.statusCode, 503);
    assert.equal(rejected.headers.Connection, 'close');
    assert.equal(rejected.ended, true);
    assert.equal(rejected.nextCalls, 0);
    assert.equal(admitted.ended, false);
  }],
  ['active response survives until deadline', h => {
    const conn = h.connection();
    const response = h.request();
    h.signal();
    assert.equal(h.records.closeCalls, 1);
    assert.equal(conn.destroyCalls, 0, 'Active socket destroyed before the deadline');
    h.advance(h.deadline() - 1);
    assert.equal(conn.destroyCalls, 0);
    assert.equal(response.ended, false);
    assert.equal(successfulDrain(h), false);
  }],
  ['normal completion cancels timeout without forced process exit', h => {
    const conn = h.connection();
    const response = h.request();
    h.signal();
    const deadline = h.deadline();
    assert.equal(successfulDrain(h), false);
    response.end('completed');
    conn.emit('close');
    h.completeClose();
    h.advance(deadline + 1);
    assert.equal(conn.destroyCalls, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.records.cleared.length, 1);
    assert.equal(successfulDrain(h), true);
    assert.notEqual(h.process.exitCode, 1);
    assert.deepEqual(h.records.exits, []);
  }],
  ['timeout failure destroys remaining sockets and cannot become success', h => {
    const conns = [h.connection(), h.connection()];
    h.signal();
    h.advance(h.deadline());
    assert.deepEqual(conns.map(conn => conn.destroyCalls), [1, 1]);
    assert.equal(h.process.exitCode, 1);
    assert.equal(h.records.error.length, 1);
    h.completeClose();
    assert.equal(successfulDrain(h), false);
    assert.deepEqual(h.records.exits, []);
  }],
  ['idempotence before and after timeout', h => {
    const conn = h.connection();
    h.signal();
    h.signal();
    assert.equal(h.records.closeCalls, 1);
    assert.equal(h.records.timerCalls, 1);
    h.advance(h.deadline());
    h.signal();
    assert.equal(h.records.closeCalls, 1);
    assert.equal(h.records.timerCalls, 1);
    assert.equal(conn.destroyCalls, 1);
  }],
  ['naturally closed sockets are removed from forced-close set', h => {
    const closed = h.connection();
    const active = h.connection();
    closed.emit('close');
    h.signal();
    h.advance(h.deadline());
    assert.equal(closed.destroyCalls, 0);
    assert.equal(active.destroyCalls, 1);
  }],
  ['close callback error fails without success or forced process exit', h => {
    h.signal();
    h.completeClose(new Error('fixture close error'));
    assert.equal(h.process.exitCode, 1);
    assert.equal(successfulDrain(h), false);
    assert.equal(h.records.error.length, 1);
    assert.equal(h.timers.size, 0);
    assert.deepEqual(h.records.exits, []);
  }],
];
const chosen = scenarios.filter(([name]) => !options.case || name.includes(options.case));
assert.ok(chosen.length, `No cases selected by ${options.case}`);
for (const locale of Object.keys(DOCS)) {
  const code = mutate(extract(locale));
  for (const [name, check] of chosen) {
    test(`${locale}: HTTP ${name}`, () => check(load(code)));
  }
}
