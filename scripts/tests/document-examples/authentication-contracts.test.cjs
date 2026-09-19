'use strict';

// Focused authored-contract guards, NOT full CRD/CEL/controller validation.
// Run from repository cwd. No schemas are fetched and no YAML is executed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const test = require('node:test');
const yaml = createRequire(path.join(process.cwd(), 'package.json'))('js-yaml');

const suffix = 'eks-best-practices/networking-performance/gateway-api-adoption-guide/feature-implementation-cookbook.md';
const paths = [
  path.join('docs', suffix),
  path.join('i18n/en/docusaurus-plugin-content-docs/current', suffix),
];
const variants = ['aws', 'cilium', 'nginx', 'envoy', 'kgateway'];
const api = {
  HTTPRoute: 'gateway.networking.k8s.io/v1',
  ListenerRuleConfiguration: 'gateway.k8s.aws/v1beta1',
  Deployment: 'apps/v1',
  Service: 'v1',
  CiliumNetworkPolicy: 'cilium.io/v2',
  AuthenticationFilter: 'gateway.nginx.org/v1alpha1',
  SecurityPolicy: 'gateway.envoyproxy.io/v1alpha1',
  TrafficPolicy: 'gateway.kgateway.dev/v1alpha1',
  GatewayExtension: 'gateway.kgateway.dev/v1alpha1',
};

function extract(text) {
  const starts = [...text.matchAll(/^## 1\. .+$/gm)];
  const ends = [...text.matchAll(/^## 2\. Rate Limiting.*$/gm)];
  assert.equal(starts.length, 1, 'missing/ambiguous Authentication section');
  assert.equal(ends.length, 1, 'missing/ambiguous Rate Limiting boundary');
  assert.ok(starts[0].index < ends[0].index, 'section order');
  const section = text.slice(starts[0].index, ends[0].index);
  const tabs = [...section.matchAll(/<TabItem\b[^>]*value="([^"]+)"[^>]*>([\s\S]*?)<\/TabItem>/g)];
  assert.deepEqual(tabs.map(m => m[1]), variants, 'missing/duplicate/reordered auth alternatives');
  const result = {};
  for (const [, name, body] of tabs) {
    const blocks = [...body.matchAll(/^```yaml[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
    assert.equal(blocks.length, 1, `${name}: expected one YAML block`);
    assert.ok(blocks[0][1].startsWith(`# auth-${name}.yaml\n`), `${name}: module marker`);
    result[name] = yaml.loadAll(blocks[0][1]).filter(value => value != null);
    assert.ok(result[name].length, `${name}: no resources`);
  }
  return result;
}

const documents = paths.map(file => extract(fs.readFileSync(file, 'utf8')));
const eachLocale = check => documents.forEach(check);
function one(resources, kind) {
  const matches = resources.filter(resource => resource.kind === kind);
  assert.equal(matches.length, 1, `missing/ambiguous ${kind}`);
  return matches[0];
}
function route(resources) { return one(resources, 'HTTPRoute'); }
function namespaceMatches(left, right) {
  assert.equal(left.metadata.namespace, right.metadata.namespace);
}
function targetMatches(policy, target) {
  namespaceMatches(policy, target);
  assert.deepEqual(policy.spec.targetRefs, [{
    group: 'gateway.networking.k8s.io', kind: 'HTTPRoute', name: target.metadata.name,
  }]);
}
function https(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.username + url.password, '');
}
function extensionMatches(resources, group, kind) {
  const extension = one(resources, kind);
  namespaceMatches(extension, route(resources));
  for (const rule of route(resources).spec.rules) {
    assert.deepEqual(rule.filters, [{
      type: 'ExtensionRef',
      extensionRef: {group, kind, name: extension.metadata.name},
    }]);
  }
  return extension;
}
function checkAWS(doc) {
  const policy = extensionMatches(doc.aws, 'gateway.k8s.aws', 'ListenerRuleConfiguration');
  assert.equal(policy.spec.actions.length, 1);
  const action = policy.spec.actions[0];
  assert.equal(action.type, 'jwt-validation');
  const config = action.jwtValidationConfig;
  https(config.issuer);
  https(config.jwksEndpoint);
  assert.equal(config.additionalClaims.length, 1);
  assert.equal(config.additionalClaims[0].name, 'aud');
  assert.equal(config.additionalClaims[0].format, 'single-string');
  assert.ok(config.additionalClaims[0].values.every(value => typeof value === 'string' && value));
  assert.ok(config.additionalClaims[0].values.length);
  assert.equal(Object.hasOwn(policy.spec, 'claimsToHeaders'), false);
}
function checkProxyRoute(doc) {
  const service = one(doc.cilium, 'Service');
  namespaceMatches(service, route(doc.cilium));
  assert.equal(service.spec.ports.length, 1);
  for (const rule of route(doc.cilium).spec.rules) {
    assert.deepEqual(rule.backendRefs, [{name: service.metadata.name, port: service.spec.ports[0].port}]);
    assert.deepEqual(rule.matches, [{path: {type: 'PathPrefix', value: '/'}}]);
    assert.deepEqual(rule.filters ?? [], []);
  }
}
function checkNGF(doc) {
  const filter = extensionMatches(doc.nginx, 'gateway.nginx.org', 'AuthenticationFilter');
  assert.equal(filter.spec.type, 'Basic');
  assert.ok(filter.spec.basic.secretRef.name);
  assert.ok(filter.spec.basic.realm);
  assert.equal(doc.nginx.some(resource => resource.kind === 'UpstreamSettingsPolicy'), false);
}
function checkEnvoy(doc) {
  const policy = one(doc.envoy, 'SecurityPolicy');
  targetMatches(policy, route(doc.envoy));
  const auth = policy.spec.extAuth;
  assert.equal(auth.failOpen, false);
  assert.match(auth.timeout, /^[1-9]\d*(?:ms|s)$/);
  assert.ok(auth.headersToExtAuth.includes('authorization'));
  assert.equal(Object.hasOwn(auth.http, 'service'), false);
  assert.equal(auth.http.backendRefs.length, 1);
  assert.ok(auth.http.backendRefs[0].name);
  assert.ok(Number.isInteger(auth.http.backendRefs[0].port));
}
function checkKgateway(doc) {
  const policy = one(doc.kgateway, 'TrafficPolicy');
  const extension = one(doc.kgateway, 'GatewayExtension');
  targetMatches(policy, route(doc.kgateway));
  namespaceMatches(policy, extension);
  assert.equal(policy.spec.jwtAuth.extensionRef.name, extension.metadata.name);
  assert.equal(extension.spec.type, 'JWT');
  assert.ok(extension.spec.jwt.providers.length);
}

test('authentication: exact five alternatives and unique expected resource identities', () => {
  eachLocale(doc => {
    assert.deepEqual(Object.values(doc).map(resources => resources.length), [2, 4, 2, 2, 3]);
    for (const resources of Object.values(doc)) {
      const identities = resources.map(resource => `${resource.kind}/${resource.metadata.namespace}/${resource.metadata.name}`);
      assert.equal(new Set(identities).size, identities.length);
      for (const resource of resources) {
        assert.equal(resource.apiVersion, api[resource.kind], `${resource.kind}: unexpected API`);
        assert.ok(resource.metadata.name && resource.metadata.namespace);
      }
    }
  });
});

test('authentication: both locales have equal parsed executable YAML', () => {
  assert.deepEqual(documents[0], documents[1]);
});

test('AWS: route extension actually requests native JWT validation and audience', () => eachLocale(checkAWS));

test('Cilium: every path including callback goes through the authentication proxy', () => eachLocale(checkProxyRoute));

test('Cilium: proxy service resolves to matching Pods and uses secret references', () => {
  eachLocale(doc => {
    const deployment = one(doc.cilium, 'Deployment');
    const service = one(doc.cilium, 'Service');
    namespaceMatches(deployment, service);
    const template = deployment.spec.template;
    for (const [key, value] of Object.entries(service.spec.selector)) {
      assert.equal(template.metadata.labels[key], value);
    }
    assert.deepEqual(deployment.spec.selector.matchLabels, service.spec.selector);
    const container = template.spec.containers[0];
    assert.equal(container.ports[0].name, service.spec.ports[0].targetPort);
    assert.equal(container.ports[0].containerPort, service.spec.ports[0].port);
    for (const arg of ['--provider=oidc', '--reverse-proxy=true', '--cookie-secure=true', '--code-challenge-method=S256']) {
      assert.ok(container.args.includes(arg));
    }
    for (const key of ['OAUTH2_PROXY_CLIENT_ID', 'OAUTH2_PROXY_CLIENT_SECRET', 'OAUTH2_PROXY_COOKIE_SECRET']) {
      const env = container.env.filter(value => value.name === key);
      assert.equal(env.length, 1);
      assert.equal(Object.hasOwn(env[0], 'value'), false);
      assert.ok(env[0].valueFrom.secretKeyRef.name && env[0].valueFrom.secretKeyRef.key);
    }
  });
});

test('Cilium: authored isolation rule selects the prerequisite backend label and proxy identity', () => {
  eachLocale(doc => {
    const policy = one(doc.cilium, 'CiliumNetworkPolicy');
    const deployment = one(doc.cilium, 'Deployment');
    namespaceMatches(policy, deployment);
    // This verifies the authored prerequisite, not labels/policy enforcement in a real cluster.
    assert.deepEqual(policy.spec.endpointSelector, {matchLabels: {app: 'api-service'}});
    assert.equal(policy.spec.ingress.length, 1);
    assert.deepEqual(policy.spec.ingress[0].fromEndpoints, [{matchLabels: {
      'io.kubernetes.pod.namespace': deployment.metadata.namespace,
      ...deployment.spec.template.metadata.labels,
    }}]);
    assert.deepEqual(policy.spec.ingress[0].toPorts, [{ports: [{port: '8080', protocol: 'TCP'}]}]);
  });
});

test('NGF: route binds the supported Basic AuthenticationFilter', () => eachLocale(checkNGF));

test('Envoy: ext_authz has a valid backend reference and fails closed', () => eachLocale(checkEnvoy));

test('kgateway: TrafficPolicy binds the local JWT GatewayExtension', () => eachLocale(checkKgateway));

test('kgateway: provider declares issuer/audience/Bearer token and JWKS reference', () => {
  eachLocale(doc => {
    const extension = one(doc.kgateway, 'GatewayExtension');
    for (const provider of extension.spec.jwt.providers) {
      https(provider.issuer);
      assert.ok(provider.audiences.length && provider.audiences.every(value => typeof value === 'string' && value));
      assert.deepEqual(provider.tokenSource, {header: {header: 'Authorization', prefix: 'Bearer '}});
      assert.ok(provider.jwks.local.configMapRef.name);
    }
  });
});

test('authentication: each alternative attaches to HTTPS with explicit routes/backend ports', () => {
  eachLocale(doc => {
    for (const resources of Object.values(doc)) {
      const value = route(resources);
      assert.equal(value.spec.parentRefs.length, 1);
      assert.equal(value.spec.parentRefs[0].sectionName, 'https');
      assert.ok(value.spec.parentRefs[0].name);
      assert.ok(value.spec.hostnames.length);
      assert.ok(value.spec.rules.length);
      for (const rule of value.spec.rules) {
        assert.ok(rule.backendRefs.length);
        for (const backend of rule.backendRefs) {
          assert.ok(backend.name && Number.isInteger(backend.port) && backend.port > 0);
        }
      }
    }
  });
});

test('authentication: concrete invalid-auth and proxy-bypass mutations are rejected', () => {
  for (const doc of documents) {
    const cases = [
      [checkAWS, value => { one(value.aws, 'ListenerRuleConfiguration').spec.actions[0].type = 'invented-jwt'; }],
      [checkNGF, value => { one(value.nginx, 'AuthenticationFilter').spec.type = 'JWT'; }],
      [checkEnvoy, value => { one(value.envoy, 'SecurityPolicy').spec.extAuth.http.service = {}; }],
      [checkEnvoy, value => { one(value.envoy, 'SecurityPolicy').spec.extAuth.failOpen = true; }],
      [checkKgateway, value => { one(value.kgateway, 'GatewayExtension').spec.type = 'NotAProvider'; }],
      [checkProxyRoute, value => { route(value.cilium).spec.rules[0].backendRefs[0].name = 'api-service'; }],
    ];
    for (const [check, mutate] of cases) {
      const changed = structuredClone(doc);
      mutate(changed);
      assert.throws(() => check(changed), assert.AssertionError);
    }
  }
});
