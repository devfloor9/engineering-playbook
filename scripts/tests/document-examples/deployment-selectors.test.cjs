'use strict';

// HYP-OPS-073: extract current authored examples; never run article commands.
// Existing js-yaml only. This guards the selected selector/Pod/Service contract,
// not complete Kubernetes admission, application behavior or a live upgrade.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {createRequire} = require('node:module');
const load = createRequire(path.join(process.env.DEPLOYMENT_DEPS_ROOT || process.cwd(), 'package.json'));
const yaml = load('js-yaml');
const root = process.env.DEPLOYMENT_DOC_ROOT || process.cwd();
for (const module of ['node:http', 'node:https']) {
  require(module).request = require(module).get = () => { throw Error('Network disabled'); };
}
require('node:net').connect = require('node:net').createConnection = () => { throw Error('Network disabled'); };
require('node:tls').connect = () => { throw Error('Network disabled'); };
globalThis.fetch = () => { throw Error('Network disabled'); };

const prefix = 'eks-best-practices/operations-reliability/';
const definitions = [
  ['eks-debugging/workload.md', ['spring-boot-app', 'app', 'web-app']],
  ['pod-lifecycle/node-readiness.md', ['critical-service']],
  ['pod-lifecycle/probe-load-balancers.md', ['myapp']],
  ['pod-lifecycle/shutdown-languages.md', ['nodejs-app', 'spring-boot-app', 'go-app', 'python-app']],
];
const locales = {ko: 'docs/', en: 'i18n/en/docusaurus-plugin-content-docs/current/'};
const fencePattern = () => /^```ya?ml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));

function extract(text, expectedNames) {
  // Other fences include unrelated side-by-side Pod excerpts. Parse the complete
  // Deployment fences only, including any Service sharing a selected fence.
  // The exact name inventory below makes removed/renamed kinds fail closed.
  const fences = [...text.matchAll(fencePattern())].filter(fence =>
    /^kind:[ \t]*(?:Deployment|"Deployment"|'Deployment')[ \t]*(?:#.*)?$/m.test(fence[1]));
  const resources = fences.flatMap(fence =>
    yaml.loadAll(fence[1]).filter(value => value != null)
      .map(value => ({value, fence})));
  const deployments = resources.filter(item => item.value.kind === 'Deployment');
  assert.deepEqual(
    deployments.map(item => item.value.metadata?.name).sort(),
    [...expectedNames].sort(),
    'missing, duplicate or unexpected Deployment example',
  );
  return {resources, deployments};
}

function selectorMatches(selector, labels) {
  return Object.entries(selector).every(([key, value]) =>
    Object.hasOwn(labels, key) && labels[key] === value);
}

function validateSelector(deployment) {
  assert.equal(deployment.apiVersion, 'apps/v1');
  assert.equal(deployment.kind, 'Deployment');
  assert.ok(plain(deployment.spec), 'missing Deployment spec');
  const selector = deployment.spec.selector;
  assert.ok(plain(selector), 'missing selector');
  // These examples use matchLabels only; new selector forms need explicit review.
  assert.deepEqual(Object.keys(selector), ['matchLabels'], 'unexpected selector form');
  assert.ok(plain(selector.matchLabels), 'missing matchLabels map');
  const entries = Object.entries(selector.matchLabels);
  assert.ok(entries.length > 0, 'empty selector');
  assert.ok(entries.every(([key, value]) => key.length > 0 && typeof value === 'string'),
    'selector values must be strings');
  const labels = deployment.spec.template?.metadata?.labels;
  assert.ok(plain(labels), 'missing Pod-template labels');
  assert.ok(Object.values(labels).every(value => typeof value === 'string'),
    'Pod labels must be strings');
  assert.ok(selectorMatches(selector.matchLabels, labels), 'selector does not match Pod-template labels');
}

function validateDocument(extracted) {
  for (const {value} of extracted.deployments) validateSelector(value);
  // The standalone examples within a document have distinct workload identities.
  for (const a of extracted.deployments) for (const b of extracted.deployments) {
    if (a === b) continue;
    if ((a.value.metadata.namespace || 'default') !== (b.value.metadata.namespace || 'default')) continue;
    assert.ok(!selectorMatches(a.value.spec.selector.matchLabels, b.value.spec.template.metadata.labels),
      'one example selector also selects another example workload');
  }
}

function validateServiceLink(extracted) {
  const services = extracted.resources.filter(item =>
    item.value.kind === 'Service' && item.value.metadata?.name === 'myapp');
  assert.equal(services.length, 1, 'missing/ambiguous myapp Service');
  const deployment = extracted.deployments.find(item => item.value.metadata.name === 'myapp').value;
  const service = services[0].value;
  assert.equal(service.apiVersion, 'v1');
  assert.equal(service.metadata.namespace || 'default', deployment.metadata.namespace || 'default');
  assert.deepEqual(service.spec.selector, {app: 'myapp'}, 'existing Service selector changed');
  assert.ok(selectorMatches(service.spec.selector, deployment.spec.template.metadata.labels),
    'Service selector does not match the Deployment Pods');
}

function mutateFence(text, fence, mutate) {
  const objects = yaml.loadAll(fence[1]).filter(value => value != null);
  const deployment = objects.find(value => value.kind === 'Deployment');
  assert.ok(deployment, 'mutation setup requires a Deployment');
  mutate(deployment, objects);
  const body = objects.map(value => yaml.dump(value)).join('---\n');
  return text.slice(0, fence.index) + '```yaml\n' + body + '```' +
    text.slice(fence.index + fence[0].length);
}

const documents = {};
for (const [locale, localePrefix] of Object.entries(locales)) {
  documents[locale] = {};
  for (const [suffix, names] of definitions) {
    const relative = localePrefix + prefix + suffix;
    const text = fs.readFileSync(path.join(root, relative), 'utf8');
    const extracted = extract(text, names);
    documents[locale][suffix] = {text, extracted};
    for (const name of names) {
      test(`${locale}/${suffix}: ${name} selector matches actual Pod labels`, () => {
        validateSelector(extracted.deployments.find(item => item.value.metadata.name === name).value);
      });
    }
    test(`${locale}/${suffix}: missing, empty, misplaced or mismatched selector regressions fail`, () => {
      validateDocument(extracted);
      const first = extracted.deployments[0];
      const mutations = [
        value => { delete value.spec.selector; },
        value => { value.spec.selector = {}; },
        value => { value.spec.selector.matchLabels = {}; },
        value => { delete value.spec.template.metadata.labels; },
        value => { value.spec.template.metadata.labels.app = 'other-workload'; },
        value => { value.spec.selector.matchLabels.app = 123; },
        value => { value.spec.template.spec.selector = value.spec.selector; delete value.spec.selector; },
        value => { value.spec.selector.matchExpressions = [{key: 'app', operator: 'DoesNotExist'}]; },
        value => { value.apiVersion = 'extensions/v1beta1'; },
      ];
      for (const mutate of mutations) {
        const changed = mutateFence(text, first.fence, mutate);
        assert.throws(() => validateDocument(extract(changed, names)), assert.AssertionError);
      }
      if (names.length > 1) {
        const second = extracted.deployments[1].value;
        const changed = mutateFence(text, first.fence, value => {
          value.spec.selector = clone(second.spec.selector);
          value.spec.template.metadata.labels = clone(second.spec.template.metadata.labels);
        });
        assert.throws(() => validateDocument(extract(changed, names)), assert.AssertionError);
      }
    });
    test(`${locale}/${suffix}: missing/duplicate fences and malformed YAML fail extraction`, () => {
      const first = extracted.deployments[0].fence;
      const removed = text.slice(0, first.index) + text.slice(first.index + first[0].length);
      const duplicate = text + '\n' + first[0] + '\n';
      const malformed = text.slice(0, first.index) + '```yaml\nkind: Deployment\nmetadata: [\n```\n' +
        text.slice(first.index + first[0].length);
      assert.throws(() => extract(removed, names), assert.AssertionError);
      assert.throws(() => extract(duplicate, names), assert.AssertionError);
      assert.throws(() => extract(malformed, names), yaml.YAMLException);
      const duplicateKey = text.slice(0, first.index) +
        first[0].replace(/^kind: Deployment$/m, 'kind: Deployment\nkind: Deployment') +
        text.slice(first.index + first[0].length);
      assert.notEqual(duplicateKey, text, 'duplicate-key mutation target missing');
      assert.throws(() => extract(duplicateKey, names), yaml.YAMLException);
    });
    if (suffix.endsWith('/probe-load-balancers.md')) {
      test(`${locale}: the existing myapp Service selects the shown Deployment Pods`, () => {
        validateDocument(extracted);
        validateServiceLink(extracted);
      });
      test(`${locale}: coherent Deployment relabeling cannot silently break the Service link`, () => {
        const first = extracted.deployments[0].fence;
        const changed = mutateFence(text, first, value => {
          value.spec.selector.matchLabels.app = 'other-workload';
          value.spec.template.metadata.labels.app = 'other-workload';
        });
        const parsed = extract(changed, names);
        validateDocument(parsed);
        assert.throws(() => validateServiceLink(parsed), assert.AssertionError);
      });
    }
  }
}
for (const [suffix] of definitions) {
  test(`KO/EN Deployment executable YAML parity: ${suffix}`, () => {
    const values = locale => documents[locale][suffix].extracted.deployments
      .map(item => item.value).sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
    assert.deepEqual(values('ko'), values('en'));
  });
}
