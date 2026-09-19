'use strict';

// Run from repository cwd; existing js-yaml only, no downloads or YAML execution.
// EPN-CB-006 / GFR-01: read the real IP-control tab, not a copied fixture.
// This is a bounded example-contract guard, not full Kubernetes API validation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {createRequire} = require('node:module');
const load = createRequire(path.join(process.cwd(), 'package.json'));
const yaml = load('js-yaml');
for (const module of ['node:http', 'node:https']) {
  require(module).request = require(module).get = () => { throw Error('Network disabled'); };
}
require('node:net').connect = require('node:net').createConnection = () => { throw Error('Network disabled'); };
require('node:tls').connect = () => { throw Error('Network disabled'); };
globalThis.fetch = () => { throw Error('Network disabled'); };
const root = process.env.GATEWAY_COOKBOOK_SOURCE_ROOT || process.cwd();
const suffix = 'eks-best-practices/networking-performance/gateway-api-adoption-guide/feature-implementation-cookbook.md';
const paths = {ko: `docs/${suffix}`, en: `i18n/en/docusaurus-plugin-content-docs/current/${suffix}`};

function ipTab(text) {
  const sections = [...text.matchAll(/^## (\d+)\. .+$/gm)];
  const matches = sections.filter(m => Number(m[1]) === 3);
  assert.equal(matches.length, 1, 'missing/ambiguous IP-control section');
  const start = matches[0].index;
  const end = sections.find(m => m.index > start)?.index ?? text.length;
  const tabs = [...text.slice(start, end).matchAll(/<TabItem\b[^>]*value="([^"]+)"[^>]*>([\s\S]*?)<\/TabItem>/g)]
    .filter(m => m[1] === 'kgateway');
  assert.equal(tabs.length, 1, 'missing/ambiguous kgateway IP-control tab');
  return tabs[0][2];
}
function check(text) {
  const body = ipTab(text);
  const prose = body.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '').replace(/[`*_]/g, '');
  // The obsolete resource/property must not silently survive as a prose claim
  // while tests validate only YAML. Technical identifiers, not a prose template.
  assert.doesNotMatch(prose, /\bRouteOption\b[\s\S]{0,160}\bnetworkPolicy\b/i);
  assert.doesNotMatch(prose, /\bgateway\.kgateway\.io\b/);
  // Check presence of the limitation's technical subjects, not a wording template
  // or a demand to add an unrelated RBAC alternative. Human review establishes
  // the meaning/negation of the CNI, NAT and HTTP-header caveats.
  for (const token of ['NetworkPolicy', 'CNI', 'NAT', 'HTTP']) {
    assert.ok(prose.includes(token), `missing ${token} limitation subject`);
  }
  const fences = [...body.matchAll(/^```yaml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  assert.equal(fences.length, 1, 'missing/ambiguous IP-control YAML fence');
  const objects = yaml.loadAll(fences[0][1]).filter(value => value != null);
  assert.equal(objects.length, 1, 'missing/ambiguous IP-control resource');
  const policy = objects[0];
  assert.equal(policy.apiVersion, 'networking.k8s.io/v1');
  assert.equal(policy.kind, 'NetworkPolicy');
  assert.equal(policy.metadata.name, 'ip-allowlist');
  assert.equal(policy.metadata.namespace, 'production');
  assert.deepEqual(policy.spec.podSelector, {matchLabels: {app: 'api-service'}});
  assert.deepEqual(policy.spec.policyTypes, ['Ingress']);
  assert.deepEqual(Object.keys(policy.spec).sort(), ['ingress', 'podSelector', 'policyTypes']);
  assert.equal(policy.spec.ingress.length, 1, 'unexpected additive ingress rule');
  const rule = policy.spec.ingress[0];
  assert.deepEqual(Object.keys(rule).sort(), ['from', 'ports']);
  assert.deepEqual(rule.ports, [{protocol: 'TCP', port: 8080}]);
  assert.ok(rule.from.every(peer =>
    Object.keys(peer).length === 1 && peer.ipBlock &&
    Object.keys(peer.ipBlock).length === 1 && typeof peer.ipBlock.cidr === 'string'
  ), 'expected CIDR-only peers');
  assert.deepEqual(rule.from.map(peer => peer.ipBlock.cidr).sort(),
    ['10.0.0.0/8', '192.168.1.0/24', '203.0.113.100/32'].sort());
  return policy;
}
function replaceInIPTab(text, before, after) {
  const body = ipTab(text);
  assert.ok(body.includes(before), 'mutation target absent from IP-control tab');
  return text.replace(body, () => body.replace(before, () => after));
}
function changeYAML(text, mutate) {
  const body = ipTab(text);
  const fences = [...body.matchAll(/^```yaml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  assert.equal(fences.length, 1, 'mutation setup needs exactly one YAML fence');
  const value = yaml.load(fences[0][1]);
  mutate(value);
  return replaceInIPTab(text, fences[0][0], '```yaml\n' + yaml.dump(value) + '```');
}
const texts = Object.fromEntries(Object.entries(paths).map(([locale, file]) => [
  locale, fs.readFileSync(path.join(root, file), 'utf8'),
]));
for (const [locale, text] of Object.entries(texts)) {
  test(`${locale}: actual NetworkPolicy matches the qualified Pod/TCP example`, () => check(text));
  test(`${locale}: negative control rejects reintroduced RouteOption.networkPolicy`, () => {
    for (const legacy of ['RouteOption.networkPolicy', "RouteOption CRD's networkPolicy", 'RouteOption CRD의 networkPolicy']) {
      const changed = replaceInIPTab(text, '```yaml', `${legacy} enables native IP filtering.\n\n\`\`\`yaml`);
      assert.throws(() => check(changed), assert.AssertionError);
    }
    const wrongGroup = replaceInIPTab(text, '```yaml', 'gateway.kgateway.io/v1alpha1\n\n```yaml');
    assert.throws(() => check(wrongGroup), assert.AssertionError);
  });
  test(`${locale}: negative control rejects a different namespace or backend selector`, () => {
    for (const mutate of [
      policy => { policy.metadata.namespace = 'default'; },
      policy => { policy.spec.podSelector.matchLabels.app = 'other-backend'; },
      policy => { policy.spec.podSelector = {}; },
    ]) {
      const changed = changeYAML(text, mutate);
      assert.throws(() => check(changed), assert.AssertionError);
    }
  });
  test(`${locale}: negative control rejects port, protocol or additive-rule broadening`, () => {
    for (const mutate of [
      policy => { policy.spec.ingress[0].ports[0].port = 80; },
      policy => { policy.spec.ingress[0].ports[0].protocol = 'UDP'; },
      policy => { delete policy.spec.ingress[0].ports; },
      policy => { policy.spec.ingress.push({}); },
      policy => { policy.spec.ingress[0].from[0].ipBlock.cidr = '0.0.0.0/0'; },
    ]) {
      const changed = changeYAML(text, mutate);
      assert.throws(() => check(changed), assert.AssertionError);
    }
  });
  test(`${locale}: removing CNI, NAT or HTTP limitation subjects is detected`, () => {
    for (const token of ['CNI', 'NAT', 'HTTP']) {
      const changed = replaceInIPTab(text, token, 'REMOVED');
      assert.throws(() => check(changed), assert.AssertionError);
    }
  });
  test(`${locale}: missing/duplicate section or kgateway tab cannot pass extraction`, () => {
    const heading = text.match(/^## 3\. .+$/m)[0];
    const body = ipTab(text);
    const duplicateTab = replaceInIPTab(text, body,
      body + '</TabItem>\n<TabItem value="kgateway">' + body);
    const tagStart = text.lastIndexOf('<TabItem', text.indexOf(body));
    const openingTag = text.slice(tagStart, text.indexOf(body));
    assert.match(openingTag, /^<TabItem\b[^>]*value="kgateway"[^>]*>$/);
    const missingTab = text.slice(0, tagStart) +
      openingTag.replace('value="kgateway"', 'value="removed"') +
      text.slice(tagStart + openingTag.length);
    assert.throws(() => check(text.replace(heading, '## 30. Wrong section')), assert.AssertionError);
    assert.throws(() => check(text + '\n' + heading + '\n'), assert.AssertionError);
    assert.throws(() => check(duplicateTab), assert.AssertionError);
    assert.throws(() => check(missingTab), assert.AssertionError);
  });
  test(`${locale}: missing/duplicate YAML fence or resource cannot pass extraction`, () => {
    const fence = [...ipTab(text).matchAll(/^```yaml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)][0];
    assert.ok(fence, 'mutation setup needs a YAML fence');
    const noFence = replaceInIPTab(text, fence[0], '');
    const duplicateFence = replaceInIPTab(text, fence[0], fence[0] + '\n' + fence[0]);
    const noResource = replaceInIPTab(text, fence[1], '# empty\n');
    const duplicateResource = replaceInIPTab(text, fence[1], fence[1] + '---\n' + fence[1]);
    for (const changed of [noFence, duplicateFence, noResource, duplicateResource]) {
      assert.throws(() => check(changed), assert.AssertionError);
    }
  });
}
test('KO/EN authored IP-control YAML has identical parsed semantics', () => {
  assert.deepEqual(check(texts.ko), check(texts.en));
});
