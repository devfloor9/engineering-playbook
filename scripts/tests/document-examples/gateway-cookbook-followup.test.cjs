'use strict';

// CI: run from repository cwd; uses existing js-yaml and Ajv, no downloads.
// Test actual authored YAML, never execute article commands or copied snippets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');
const {createRequire} = require('node:module');
const load = createRequire(path.join(process.cwd(), 'package.json'));
const yaml = load('js-yaml');
const AjvModule = load('ajv');
const Ajv = AjvModule.default || AjvModule;
const ajv = new Ajv({allErrors: true, strict: false, validateFormats: false});
const bundle = require('./gateway-cookbook-schemas.json');
const validators = Object.fromEntries(Object.entries(bundle.schemas).map(([key, schema]) => [key, ajv.compile(schema)]));
for (const mod of ['node:http', 'node:https']) {
  require(mod).request = require(mod).get = () => { throw Error('Network disabled in document fixture tests'); };
}
require('node:net').connect = require('node:net').createConnection = () => { throw Error('Network disabled'); };
require('node:tls').connect = () => { throw Error('Network disabled'); };
globalThis.fetch = () => { throw Error('Network disabled'); };

const root = process.env.GATEWAY_COOKBOOK_SOURCE_ROOT || process.cwd();
const suffix = 'eks-best-practices/networking-performance/gateway-api-adoption-guide/feature-implementation-cookbook.md';
const files = {ko: 'docs/' + suffix, en: 'i18n/en/docusaurus-plugin-content-docs/current/' + suffix};
const definitions = [
  [2, 'cilium', 'cilium-rate'], [2, 'kgateway', 'kgateway-rate'],
  [6, 'nginx', 'ngf-session-rule'], [6, 'kgateway', 'kgateway-session-rule'],
  [7, 'cilium', 'cilium-body'], [7, 'kgateway', 'kgateway-body'],
  [8, 'kgateway', 'kgateway-maintenance'],
];
const api = {
  HTTPRoute: 'gateway.networking.k8s.io/v1', TrafficPolicy: 'gateway.kgateway.dev/v1alpha1',
  DirectResponse: 'gateway.kgateway.dev/v1alpha1', CiliumEnvoyConfig: 'cilium.io/v2',
};
const kindType = name => `type.googleapis.com/envoy.config.${name}.v3.`;
const TYPES = {
  listener: kindType('listener') + 'Listener',
  route: kindType('route') + 'RouteConfiguration',
  cluster: kindType('cluster') + 'Cluster',
  hcm: 'type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager',
  rate: 'type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit',
  buffer: 'type.googleapis.com/envoy.extensions.filters.http.buffer.v3.Buffer',
  router: 'type.googleapis.com/envoy.extensions.filters.http.router.v3.Router',
};
function section(text, number) {
  const heads = [...text.matchAll(/^## (\d+)\. .+$/gm)];
  const selected = heads.filter(m => Number(m[1]) === number);
  assert.equal(selected.length, 1, `missing/ambiguous section ${number}`);
  const start = selected[0].index;
  const end = heads.find(m => m.index > start)?.index ?? text.length;
  return text.slice(start, end);
}
function tab(text, number, id) {
  const matches = [...section(text, number).matchAll(/<TabItem\b[^>]*value="([^"]+)"[^>]*>([\s\S]*?)<\/TabItem>/g)]
    .filter(m => m[1] === id);
  assert.equal(matches.length, 1, `missing/ambiguous ${number}/${id}`);
  return matches[0][2];
}
function extract(text) {
  const out = {};
  for (const [number, id, marker] of definitions) {
    const body = tab(text, number, id);
    const blocks = [...body.matchAll(/^```yaml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
    assert.equal(blocks.length, 1, `${marker}: expected exactly one YAML fence`);
    assert.ok(blocks[0][1].startsWith(`# ${marker}.yaml\n`), `${marker}: missing exact marker`);
    out[marker] = yaml.loadAll(blocks[0][1]).filter(x => x != null);
  }
  return out;
}
function authRoute(text, id) {
  const body = tab(text, 1, id);
  const blocks = [...body.matchAll(/^```yaml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  assert.equal(blocks.length, 1);
  return one(yaml.loadAll(blocks[0][1]).filter(Boolean), 'HTTPRoute');
}
function one(objects, kind) {
  const found = objects.filter(x => x.kind === kind);
  assert.equal(found.length, 1, `missing/ambiguous ${kind}`);
  return found[0];
}
function validateResource(object) {
  assert.ok(validators[object.kind], `unsupported kind ${object.kind}`);
  assert.equal(object.apiVersion, api[object.kind]);
  assert.ok(object.metadata.name);
  assert.equal(object.metadata.namespace, 'production');
  const validate = validators[object.kind];
  assert.ok(validate(object), JSON.stringify(validate.errors));
}
function exactKeys(object, keys, label) {
  assert.deepEqual(Object.keys(object).sort(), [...keys].sort(), `${label}: unknown/missing contract fields`);
}
function bucket(value, snake = false) {
  const keys = snake ? ['max_tokens', 'tokens_per_fill', 'fill_interval'] : ['maxTokens', 'tokensPerFill', 'fillInterval'];
  exactKeys(value, keys, 'token bucket');
  assert.equal(value[keys[0]], 200);
  assert.equal(value[keys[1]], 100);
  assert.equal(value[keys[2]], '1s');
}
function cec(objects, mode) {
  const value = one(objects, 'CiliumEnvoyConfig');
  validateResource(value);
  assert.equal(value.metadata.annotations['cec.cilium.io/use-original-source-address'], 'false');
  assert.equal(value.spec.resources.length, 3);
  assert.equal(value.spec.services.length, 1);
  const service = value.spec.services[0];
  assert.equal(service.name, 'api-service');
  assert.equal(service.namespace, 'production');
  assert.deepEqual(service.ports, [8080]);
  const findType = type => {
    const matches = value.spec.resources.filter(x => x['@type'] === type);
    assert.equal(matches.length, 1, `unresolved/ambiguous xDS type ${type}`);
    return matches[0];
  };
  const listener = findType(TYPES.listener), route = findType(TYPES.route), cluster = findType(TYPES.cluster);
  exactKeys(listener, ['@type', 'name', 'filter_chains'], 'listener');
  assert.equal(service.listener, listener.name);
  assert.equal(listener.filter_chains.length, 1);
  assert.equal(listener.filter_chains[0].filters.length, 1);
  const network = listener.filter_chains[0].filters[0];
  assert.equal(network.name, 'envoy.filters.network.http_connection_manager');
  const hcm = network.typed_config;
  exactKeys(hcm, ['@type', 'stat_prefix', 'rds', 'http_filters'], 'HCM');
  assert.equal(hcm['@type'], TYPES.hcm);
  assert.ok(hcm.stat_prefix);
  assert.equal(hcm.rds.route_config_name, route.name);
  assert.equal(hcm.http_filters.length, 2);
  const [feature, router] = hcm.http_filters;
  assert.equal(router.name, 'envoy.filters.http.router');
  assert.deepEqual(router.typed_config, {'@type': TYPES.router});
  assert.equal(feature.name, `envoy.filters.http.${mode === 'rate' ? 'local_ratelimit' : 'buffer'}`);
  const config = feature.typed_config;
  if (mode === 'rate') {
    exactKeys(config, ['@type', 'stat_prefix', 'token_bucket', 'filter_enabled', 'filter_enforced'], 'local rate filter');
    assert.equal(config['@type'], TYPES.rate);
    assert.ok(config.stat_prefix);
    bucket(config.token_bucket, true);
    for (const name of ['filter_enabled', 'filter_enforced']) {
      assert.deepEqual(config[name], {default_value: {numerator: 100, denominator: 'HUNDRED'}});
    }
  } else {
    exactKeys(config, ['@type', 'max_request_bytes'], 'body buffer');
    assert.equal(config['@type'], TYPES.buffer);
    assert.equal(config.max_request_bytes, 10 * 1024 * 1024);
  }
  exactKeys(route, ['@type', 'name', 'virtual_hosts'], 'route configuration');
  assert.equal(route.virtual_hosts.length, 1);
  assert.deepEqual(route.virtual_hosts[0].domains, ['*']);
  const routes = route.virtual_hosts[0].routes;
  assert.equal(routes.length, 1);
  assert.deepEqual(routes[0].match, {prefix: '/'});
  assert.deepEqual(routes[0].route, {cluster: cluster.name});
  assert.equal(cluster.name, `${value.metadata.namespace}/${service.name}`);
  exactKeys(cluster, ['@type', 'name', 'type', 'connect_timeout', 'lb_policy'], 'cluster');
  assert.equal(cluster.type, 'EDS');
  assert.equal(cluster.connect_timeout, '5s');
  assert.equal(cluster.lb_policy, 'ROUND_ROBIN');
}
function policy(objects, mode, existingRoute) {
  const value = one(objects, 'TrafficPolicy');
  validateResource(value);
  assert.equal(value.metadata.namespace, existingRoute.metadata.namespace);
  assert.deepEqual(value.spec.targetRefs, [{
    group: 'gateway.networking.k8s.io', kind: 'HTTPRoute', name: existingRoute.metadata.name,
  }]);
  if (mode === 'rate') {
    exactKeys(value.spec, ['targetRefs', 'rateLimit'], 'rate policy');
    exactKeys(value.spec.rateLimit, ['local'], 'local-only scope');
    bucket(value.spec.rateLimit.local.tokenBucket);
  } else {
    exactKeys(value.spec, ['targetRefs', 'buffer'], 'body policy');
    assert.deepEqual(value.spec.buffer, {maxRequestSize: '10Mi'});
  }
}
function mergeSession(fragment, route) {
  exactKeys(fragment, ['sessionPersistence'], 'rule merge fragment');
  assert.deepEqual(fragment.sessionPersistence, {
    sessionName: 'BACKEND_SESSION', type: 'Cookie', absoluteTimeout: '1h',
    cookieConfig: {lifetimeType: 'Permanent'},
  });
  const merged = structuredClone(route);
  assert.ok(merged.spec.rules.length);
  merged.spec.rules[0] = {...merged.spec.rules[0], ...fragment};
  validateResource(merged);
  const restore = structuredClone(merged);
  delete restore.spec.rules[0].sessionPersistence;
  assert.deepEqual(restore, route, 'merge must not remove authentication/matches/backendRefs');
  return merged;
}
function maintenance(objects) {
  const response = one(objects, 'DirectResponse'), route = one(objects, 'HTTPRoute');
  objects.forEach(validateResource);
  assert.equal(response.spec.status, 503);
  assert.match(response.spec.body, /<html>[\s\S]*<body>[\s\S]*<\/body>[\s\S]*<\/html>/);
  assert.ok([...response.spec.body].length <= 4096);
  assert.equal(response.metadata.namespace, route.metadata.namespace);
  assert.deepEqual(route.spec.parentRefs, [{name: 'production-gateway', sectionName: 'https'}]);
  assert.deepEqual(route.spec.hostnames, ['api.example.com']);
  assert.equal(route.spec.rules.length, 1);
  const rule = route.spec.rules[0];
  assert.deepEqual(rule.matches, [{path: {type: 'PathPrefix', value: '/maintenance'}}]);
  assert.equal(Object.hasOwn(rule, 'backendRefs'), false, 'direct response must not forward to an application backend');
  assert.deepEqual(rule.filters, [
    {type: 'ExtensionRef', extensionRef: {group: 'gateway.kgateway.dev', kind: 'DirectResponse', name: response.metadata.name}},
    {type: 'ResponseHeaderModifier', responseHeaderModifier: {set: [{name: 'content-type', value: 'text/html; charset=utf-8'}]}},
  ]);
}

const texts = Object.fromEntries(Object.entries(files).map(([locale, file]) => [locale, fs.readFileSync(path.join(root, file), 'utf8')]));
const documents = {};
test('cookbook follow-up: both locales extract exactly seven unambiguous authored modules', () => {
  for (const [locale, text] of Object.entries(texts)) {
    documents[locale] = extract(text);
    assert.equal(Object.keys(documents[locale]).length, 7);
  }
});
test('cookbook follow-up: both locales have identical parsed executable mappings', () => {
  assert.deepEqual(extract(texts.ko), extract(texts.en));
});
for (const [locale, text] of Object.entries(texts)) {
  test(`${locale}: pinned schemas validate all complete selected resources`, () => {
    for (const [marker, objects] of Object.entries(extract(text))) {
      if (!marker.endsWith('-rule')) objects.forEach(validateResource);
    }
  });
  test(`${locale}: Cilium rate limiter has a complete connected xDS chain and enforces all requests`, () => cec(extract(text)['cilium-rate'], 'rate'));
  test(`${locale}: Cilium body cap uses the HTTP buffer filter on the connected xDS chain`, () => cec(extract(text)['cilium-body'], 'body'));
  test(`${locale}: kgateway local policy targets the existing authenticated route`, () => policy(extract(text)['kgateway-rate'], 'rate', authRoute(text, 'kgateway')));
  test(`${locale}: kgateway body policy limits buffered bytes on the existing route`, () => policy(extract(text)['kgateway-body'], 'body', authRoute(text, 'kgateway')));
  test(`${locale}: NGF session fragment preserves Basic auth ExtensionRef and routing`, () => {
    const route = authRoute(text, 'nginx'), fragment = extract(text)['ngf-session-rule'][0];
    const merged = mergeSession(fragment, route);
    assert.ok(merged.spec.rules[0].filters.some(x => x.extensionRef?.kind === 'AuthenticationFilter'));
  });
  test(`${locale}: kgateway session fragment preserves JWT policy target identity and routing`, () => {
    const route = authRoute(text, 'kgateway');
    const merged = mergeSession(extract(text)['kgateway-session-rule'][0], route);
    assert.equal(merged.metadata.name, 'api-route');
    assert.deepEqual(merged.spec.rules[0].backendRefs, route.spec.rules[0].backendRefs);
  });
  test(`${locale}: maintenance response resolves an explicit path and never calls a backend`, () => maintenance(extract(text)['kgateway-maintenance']));
  test(`${locale}: version and operational boundaries remain visible`, () => {
    assert.ok(tab(text, 6, 'nginx').includes('v2.4.0'));
    assert.ok(tab(text, 6, 'nginx').includes('NGINX Plus'));
    assert.ok(tab(text, 6, 'nginx').includes('experimental'));
    for (const number of [2, 6, 7, 8]) {
      assert.ok(tab(text, number, 'kgateway').includes('v2.2.0'));
      assert.ok(tab(text, number, 'kgateway').includes('Envoy'));
    }
    assert.ok(tab(text, 6, 'kgateway').includes('v1.4.1'));
    for (const number of [2, 7]) assert.ok(tab(text, number, 'cilium').includes('v1.19.3'));
  });
  test(`${locale}: extraction rejects missing, duplicate and misplaced module markers`, () => {
    assert.throws(() => extract(text.replace('# cilium-rate.yaml', '# wrong.yaml')));
    const block = text.match(/^```yaml\n# cilium-rate\.yaml\n[\s\S]*?^```$/m)[0];
    assert.throws(() => extract(text.replace(block, block + '\n' + block)));
    assert.throws(() => extract(text.replace('value="cilium"', 'value="not-cilium"').replace('# cilium-rate.yaml', '# wrong.yaml')));
  });
  test(`${locale}: Cilium negative controls reject the original missing-chain/disabled-filter/bad-body defects`, () => {
    const doc = extract(text);
    const cases = [
      ['rate', v => { delete v.spec.resources[0].filter_chains[0].filters[0].typed_config.stat_prefix; }],
      ['rate', v => { delete v.spec.resources[0].filter_chains[0].filters[0].typed_config.rds; }],
      ['rate', v => { v.spec.resources[0].filter_chains[0].filters[0].typed_config.http_filters.pop(); }],
      ['rate', v => { delete v.spec.resources[0].filter_chains[0].filters[0].typed_config.http_filters[0].typed_config.filter_enforced; }],
      ['rate', v => { v.spec.resources[0].filter_chains[0].filters[0].typed_config.http_filters[0].typed_config.filter_enabled.default_value.numerator = 0; }],
      ['rate', v => { delete v.metadata.namespace; }],
      ['rate', v => { v.spec.services[0].listener = 'unresolved'; }],
      ['rate', v => { v.spec.resources[2].type = 'STRICT_DNS'; }],
      ['body', v => { v.spec.resources[0].filter_chains[0].filters[0].typed_config.perConnectionBufferLimitBytes = 10485760; }],
      ['body', v => { delete v.spec.resources[0].filter_chains[0].filters[0].typed_config.http_filters[0].typed_config.max_request_bytes; }],
      ['body', v => { v.spec.resources[0].filter_chains[0].filters[0].typed_config.http_filters[0].typed_config.max_request_bytes = 10000000; }],
    ];
    for (const [mode, mutate] of cases) {
      const objects = structuredClone(doc[`cilium-${mode}`]);
      mutate(objects[0]);
      assert.throws(() => cec(objects, mode));
    }
  });
  test(`${locale}: policy/session negative controls reject legacy APIs, unsafe merges and wrong attachments`, () => {
    const doc = extract(text), route = authRoute(text, 'kgateway');
    for (const mutate of [
      v => { v.apiVersion = 'gateway.kgateway.io/v1alpha1'; },
      v => { v.kind = 'RouteOption'; },
      v => { v.spec.targetRefs[0].name = 'other-route'; },
      v => { v.spec.targetRef = v.spec.targetRefs[0]; delete v.spec.targetRefs; },
      v => { v.spec.rateLimit.local = {}; },
      v => { v.spec.rateLimit.local.tokenBucket.fillInterval = '10ms'; },
    ]) {
      const objects = structuredClone(doc['kgateway-rate']); mutate(objects[0]);
      assert.throws(() => policy(objects, 'rate', route));
    }
    for (const mutate of [
      v => { v.spec.buffer.maxRequestSize = '10M'; },
      v => { v.spec.buffer.disable = {}; },
      v => { v.spec.options = {perConnectionBufferLimitBytes: 10485760}; delete v.spec.buffer; },
    ]) {
      const objects = structuredClone(doc['kgateway-body']); mutate(objects[0]);
      assert.throws(() => policy(objects, 'body', route));
    }
    for (const marker of ['ngf-session-rule', 'kgateway-session-rule']) {
      for (const mutate of [
        v => { v.sessionAffinity = v.sessionPersistence; delete v.sessionPersistence; },
        v => { delete v.sessionPersistence.absoluteTimeout; },
        v => { v.sessionPersistence.cookieConfig.lifetimeType = 'Invalid'; },
        v => { v.filters = []; },
        v => { v.backendRefs = []; },
      ]) {
        const fragment = structuredClone(doc[marker][0]); mutate(fragment);
        assert.throws(() => mergeSession(fragment, route));
      }
    }
  });
  test(`${locale}: direct-response negative controls reject upstream forwarding and catch-all replacement`, () => {
    const doc = extract(text);
    for (const mutate of [
      v => { one(v, 'HTTPRoute').spec.rules[0].backendRefs = [{name: 'api-service', port: 8080}]; },
      v => { one(v, 'HTTPRoute').spec.rules[0].matches[0].path.value = '/'; },
      v => { one(v, 'HTTPRoute').spec.rules[0].filters[0].extensionRef.name = 'missing'; },
      v => { const d = one(v, 'DirectResponse'); d.spec.statusCode = d.spec.status; delete d.spec.status; },
      v => { one(v, 'DirectResponse').spec.body = 'x'.repeat(4097); },
    ]) {
      const objects = structuredClone(doc['kgateway-maintenance']); mutate(objects);
      assert.throws(() => maintenance(objects));
    }
  });
}
