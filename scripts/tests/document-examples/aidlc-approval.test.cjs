'use strict';

// Extract exact repository YAML; execute only its reporting script with inert doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const vm = require('node:vm');
const {test} = require('node:test');

const DOCS = {
  ko: 'docs/aidlc/enterprise/agent-versioning/governance-automation.md',
  en: 'i18n/en/docusaurus-plugin-content-docs/current/aidlc/enterprise/agent-versioning/governance-automation.md',
};
function repositoryRoot() {
  // Repo cwd works for the review artifact; ancestors work after installation.
  for (const seed of [process.cwd(), __dirname]) {
    for (let candidate = path.resolve(seed);;) {
      if (fs.existsSync(path.join(candidate, 'package.json'))
          && Object.values(DOCS).every(file => fs.existsSync(path.join(candidate, file)))) {
        return candidate;
      }
      const parent = path.dirname(candidate);
      if (parent === candidate) break;
      candidate = parent;
    }
  }
  throw new Error('Repository root with both AI-DLC governance documents was not found');
}
const root = repositoryRoot();
const yaml = createRequire(path.join(root, 'package.json'))('js-yaml');

function exactlyOne(values, label) {
  assert.equal(values.length, 1, `${label}: expected exactly one match, got ${values.length}`);
  return values[0];
}
function extractReporter(relativePath) {
  const document = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const blocks = [...document.matchAll(/^```([^\r\n]*)\r?\n([\s\S]*?)^```[ \t]*\r?$/gm)];
  const block = exactlyOne(
    blocks.filter(match => match[1].trim() === 'yaml'
      && match[2].startsWith('# .github/workflows/prompt-approval.yml')),
    `${relativePath}: prompt-approval YAML`);
  const workflow = yaml.load(block[2]);
  const evaluate = workflow.jobs.evaluate;
  const report = workflow.jobs.report;
  const step = (job, predicate, label) => exactlyOne(job.steps.filter(predicate), label);
  const checkout = step(evaluate, item => item.uses?.startsWith('actions/checkout@'), 'checkout');
  const run = step(evaluate, item => item.name === 'Run Golden Dataset Eval', 'evaluation command');
  const upload = step(evaluate, item => item.uses?.startsWith('actions/upload-artifact@'), 'upload');
  const gate = step(report, item => item.id === 'gate', 'reporting gate');
  const headSHA = '${{ github.event.pull_request.head.sha }}';
  assert.equal(checkout.with.ref, headSHA, 'Checkout must test the PR head, not the default merge ref');
  assert.ok(run.run.includes(`--new-version "${headSHA}"`), 'Evaluator argument must match checkout');
  assert.equal(gate.env.EXPECTED_SHA, headSHA, 'Reporting expectation must match checkout');
  assert.equal(gate.env.EVALUATION_JOB_RESULT, '${{ needs.evaluate.result }}');
  assert.equal(report.needs, 'evaluate');
  assert.equal(report.permissions.issues, 'write');
  assert.notEqual((evaluate.permissions || workflow.permissions)?.issues, 'write');
  assert.ok(!report.steps.some(item => item.uses?.startsWith('actions/checkout@')),
    'Reporting must not check out PR code');
  assert.ok(upload.if.includes('always()'), 'Preserve an artifact even after evaluation failure');
  assert.equal(upload.with['if-no-files-found'], 'error');
  assert.equal(typeof gate.with.script, 'string', 'Reporting script is required');
  assert.ok(gate.with.script.trim(), 'Reporting script must not be empty');
  return new vm.Script(
    `(async function(require, core, github, context, process) {\n${gate.with.script}\n})`,
    {filename: `${relativePath}:reporting-script`}
  ).runInNewContext({}, {timeout: 1000, contextCodeGeneration: {strings: false, wasm: false}});
}

const SHA = 'a'.repeat(40);
const VALID = {
  schema_version: 1, complete: true, evaluated_sha: SHA,
  baseline: 0.82, exact_match: 0.85, sample_count: 100,
};
async function runReporter(fn, value, options = {}) {
  const errors = [], comments = [], outputs = {};
  let completed = false;
  let release;
  const deferred = options.deferComment ? new Promise(resolve => { release = resolve; }) : null;
  const mockedFS = {
    statSync() {
      if (options.missing) throw new Error('mock missing artifact');
      return {size: options.size ?? 100, isFile: () => !options.directory};
    },
    readFileSync() { return options.raw ?? JSON.stringify(value); },
  };
  const completion = fn(
    name => {
      assert.equal(name, 'node:fs', 'Only the mock filesystem can be imported');
      return mockedFS;
    },
    {setFailed: message => errors.push(message), setOutput: (key, result) => { outputs[key] = result; }},
    {rest: {issues: {createComment: async comment => {
      comments.push(comment);
      if (options.rejectComment) throw new Error('mock permission failure');
      if (deferred) await deferred;
    }}}},
    {repo: {owner: 'mock-owner', repo: 'mock-repo'}, issue: {number: 99}},
    {env: {EXPECTED_SHA: options.sha ?? SHA, EVALUATION_JOB_RESULT: options.job ?? 'success'}}
  ).then(() => { completed = true; });
  if (deferred) {
    await Promise.resolve();
    const returnedEarly = completed;
    release();
    await completion;
    assert.equal(returnedEarly, false, 'Reporter returned before createComment completed');
  } else {
    await completion;
  }
  assert.equal(comments.length, 1, 'Exactly one decision must be reported');
  const comment = comments[0];
  assert.deepEqual(
    {owner: comment.owner, repo: comment.repo, issue_number: comment.issue_number},
    {owner: 'mock-owner', repo: 'mock-repo', issue_number: 99});
  return {errors, comments, outputs};
}
function rejected(result) {
  assert.ok(result.errors.length > 0, 'Invalid evaluation must fail the job');
  assert.equal(result.outputs.decision, 'REJECTED');
  assert.ok(result.comments[0].body.includes('REJECTED'), 'Comment must agree with rejection');
}

for (const [locale, relativePath] of Object.entries(DOCS)) {
  const reporter = extractReporter(relativePath);
  test(`${locale}: complete finite matching evaluation passes the metric gate`, async () => {
    const result = await runReporter(reporter, VALID);
    assert.equal(result.errors.length, 0);
    assert.equal(result.outputs.decision, 'METRIC_GATE_PASSED');
  });
  const invalidResults = [
    ['null result', null],
    ['array result', []],
    ['missing fields', {}],
    ['incomplete evaluation', {...VALID, complete: false}],
    ['wrong schema', {...VALID, schema_version: 2}],
    ['null score', {...VALID, baseline: null}],
    ['boolean score', {...VALID, baseline: true}],
    ['string score', {...VALID, exact_match: '0.85'}],
    ['score below zero', {...VALID, exact_match: -1}],
    ['score above one', {...VALID, exact_match: 1.01}],
    ['too few cases', {...VALID, sample_count: 99}],
    ['fractional case count', {...VALID, sample_count: 100.5}],
    ['unsafe integer case count', {...VALID, sample_count: Number.MAX_SAFE_INTEGER + 1}],
    ['stale evaluated SHA', {...VALID, evaluated_sha: 'b'.repeat(40)}],
    ['failing score despite pass=true', {...VALID, exact_match: 0.7, pass: true}],
  ];
  for (const [name, value] of invalidResults) {
    test(`${locale}: reject ${name}`, async () => rejected(await runReporter(reporter, value)));
  }
  const invalidArtifacts = [
    ['missing artifact', {missing: true}],
    ['invalid JSON', {raw: 'not-json'}],
    ['NaN in JSON', {raw: '{"exact_match":NaN}'}],
    ['Infinity in JSON', {raw: '{"exact_match":Infinity}'}],
    ['artifact over 64 KiB', {size: 65537}],
    ['directory as artifact', {directory: true}],
    ['failed evaluation job', {job: 'failure'}],
    ['skipped evaluation job', {job: 'skipped'}],
    ['missing expected SHA', {sha: ''}],
  ];
  for (const [name, options] of invalidArtifacts) {
    test(`${locale}: reject ${name}`, async () => rejected(await runReporter(reporter, VALID, options)));
  }
  test(`${locale}: two-point boundary passes despite pass=false`, async () => {
    const result = await runReporter(reporter, {...VALID, exact_match: 0.80, pass: false});
    assert.equal(result.outputs.decision, 'METRIC_GATE_PASSED');
    assert.equal(result.errors.length, 0);
  });
  test(`${locale}: decimal two-point boundary passes and larger drops fail`, async () => {
    const boundary = await runReporter(reporter, {...VALID, baseline: 0.20, exact_match: 0.18});
    assert.equal(boundary.outputs.decision, 'METRIC_GATE_PASSED');
    rejected(await runReporter(reporter, {...VALID, baseline: 0.20, exact_match: 0.179999}));
  });
  test(`${locale}: comment API rejection fails the job`, async () => {
    const result = await runReporter(reporter, VALID, {rejectComment: true});
    assert.ok(result.errors.length > 0, 'Comment failure must not be hidden');
  });
  test(`${locale}: reporting awaits comment API completion`, async () => {
    const result = await runReporter(reporter, VALID, {deferComment: true});
    assert.equal(result.errors.length, 0);
  });
}
