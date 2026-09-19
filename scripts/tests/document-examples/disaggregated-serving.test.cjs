'use strict';

// Reviewed example: vLLM v0.23.0 multi-node mp; LWS v0.8.0, resource API v1.
// These are authored-contract guards, NOT an implementation of either runtime:
// no schemas/cache downloads, SDK imports, model/cluster calls or commands.
// No GPU fit, PVC contents/access, actual env injection, health, recovery or
// transport performance is established by passing these tests.
// Run from repository cwd (scripts/test-document-examples.cjs already does).
// Explicit roots allow proposal/baseline review; there is no fallback to drafts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const root = path.resolve(process.env.DISAGGREGATION_DOC_ROOT || process.cwd());
const deps = path.resolve(process.env.DISAGGREGATION_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(deps, 'package.json'))('js-yaml');
const suffix = 'agentic-ai-platform/model-serving/inference-optimization/disaggregated-serving.md';
const paths = {ko: `docs/${suffix}`, en: `i18n/en/docusaurus-plugin-content-docs/current/${suffix}`};
const SET = 'leaderworkerset.sigs.k8s.io/name';
const INDEX = 'leaderworkerset.sigs.k8s.io/worker-index';
const GPU = 'nvidia.com/gpu';
const MODEL = 'zai-org/GLM-5-FP8';
const roles = ['leader', 'worker'];
const requireThat = (condition, code) => assert.ok(condition, code);

function extract(text, filename) {
  const values = [];
  let fence;
  text.split(/\r?\n/).forEach((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!fence && marker) fence = {marker: marker[1], language: marker[2].trim().split(/\s+/)[0], line: index + 1, lines: []};
    else if (fence && marker && marker[1][0] === fence.marker[0]
      && marker[1].length >= fence.marker.length && !marker[2].trim()) {
      if (['yaml', 'yml'].includes(fence.language)) {
        const parsed = yaml.loadAll(fence.lines.join('\n'), {filename: `${filename}:${fence.line}`});
        requireThat(parsed.length && parsed.every(v => v && typeof v === 'object' && !Array.isArray(v)), 'YAML_MAPPING');
        values.push(...parsed);
      }
      fence = undefined;
    } else if (fence) fence.lines.push(line);
  });
  requireThat(!fence, 'UNCLOSED_FENCE');
  requireThat(values.length, 'YAML_COUNT');
  return {values};
}
const documents = Object.fromEntries(Object.entries(paths).map(([locale, relative]) =>
  [locale, extract(fs.readFileSync(path.join(root, relative), 'utf8'), relative)]));
function each(check) {
  for (const [locale, document] of Object.entries(documents)) {
    try { check(document); } catch (error) { error.message = `${locale}: ${error.message}`; throw error; }
  }
}
function one(values, code) { assert.equal(values.length, 1, code); return values[0]; }
function lws(d) { return one(d.values.filter(v => v.kind === 'LeaderWorkerSet'), 'LWS_COUNT'); }
function service(d) { return one(d.values.filter(v => v.kind === 'Service'), 'API_COUNT'); }
function template(d, role) { return lws(d).spec.leaderWorkerTemplate[`${role}Template`]; }
function container(d, role) {
  return one(template(d, role).spec.containers.filter(c => c.name === 'vllm'), 'VLLM_CONTAINER_COUNT');
}
function positiveInt(value, code) {
  requireThat(['string', 'number'].includes(typeof value) && /^[1-9]\d*$/.test(String(value)), code);
  const number = Number(value);
  requireThat(Number.isSafeInteger(number), code);
  return number;
}
function options(d, role, replica = 0) {
  const resource = lws(d), c = container(d, role);
  assert.deepEqual(c.command, ['vllm', 'serve'], 'VLLM_COMMAND');
  requireThat(Array.isArray(c.args) && c.args.every(a => typeof a === 'string'), 'ARGV_STRINGS');
  // Inputs promised by the reviewed LWS Shared-subdomain contract, not a
  // simulated controller. Refuse authored overrides that could shadow them.
  const env = {
    LWS_GROUP_SIZE: String(resource.spec.leaderWorkerTemplate.size),
    LWS_WORKER_INDEX: role === 'leader' ? '0' : '1',
    LWS_LEADER_ADDRESS: `${resource.metadata.name}-${replica}.${resource.metadata.name}.${resource.metadata.namespace}`,
  };
  requireThat(!(c.env || []).some(e => Object.hasOwn(env, e.name)), 'SHADOWED_LWS_IDENTITY');
  const argv = c.args.map(arg => arg.replace(/\$\(([A-Za-z_]\w*)\)/g, (_, key) => {
    requireThat(Object.hasOwn(env, key), 'UNBOUND_ARG_VARIABLE');
    return env[key];
  }));
  requireThat(argv.every(a => !/\$\(|\$\{|\$[A-Za-z_]/.test(a)), 'UNBOUND_ARG_VARIABLE');
  requireThat(argv.length && !argv[0].startsWith('--'), 'MODEL_POSITIONAL');
  const result = {model: argv[0], expectedAddress: env.LWS_LEADER_ADDRESS};
  // Normalize the displayed --flag=value and --flag value forms. This does
  // not validate every possible vLLM option or its upstream implementation.
  for (let i = 1; i < argv.length; i++) {
    const match = /^(--[a-z][a-z0-9-]*)(?:=(.*))?$/.exec(argv[i]);
    requireThat(match, 'ARGV_OPTION');
    requireThat(!Object.hasOwn(result, match[1]), 'DUPLICATE_ARG');
    result[match[1]] = match[2] ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
  }
  return result;
}
function version(d) {
  const resource = lws(d);
  assert.equal(resource.apiVersion, 'leaderworkerset.x-k8s.io/v1', 'LWS_API_VERSION');
  assert.equal(resource.metadata.namespace, 'agentic-serving', 'LWS_NAMESPACE');
  assert.equal(resource.spec.leaderWorkerTemplate.size, 2, 'LWS_TWO_NODES');
  requireThat(!resource.spec.networkConfig || resource.spec.networkConfig.subdomainPolicy === 'Shared', 'LWS_SHARED_DISCOVERY');
  for (const role of roles) requireThat(
    /^vllm\/vllm-openai:v0\.23\.0(?:@sha256:[a-f0-9]{64})?$/.test(container(d, role).image), 'VLLM_REVIEWED_IMAGE');
}
function launch(d) {
  for (const replica of [0, 1, 17]) {
    const parsed = roles.map(role => options(d, role, replica));
    parsed.forEach((o, index) => {
      assert.equal(o['--distributed-executor-backend'], 'mp', 'MP_BACKEND');
      assert.equal(positiveInt(o['--nnodes'], 'NNODES'), lws(d).spec.leaderWorkerTemplate.size, 'NNODES');
      assert.equal(o['--node-rank'], String(index), 'NODE_RANK');
      assert.equal(o['--master-addr'], o.expectedAddress, 'RENDEZVOUS_ADDRESS');
      assert.equal(o['--master-port'], '29501', 'RENDEZVOUS_PORT');
      assert.equal(positiveInt(o['--tensor-parallel-size'], 'TP'), 8, 'TP');
      assert.equal(positiveInt(o['--pipeline-parallel-size'], 'PP'), 2, 'PP');
      requireThat(container(d, roles[index]).env?.some(e => e.name === 'VLLM_HOST_IP'
        && e.valueFrom?.fieldRef?.fieldPath === 'status.podIP'), 'PER_POD_RUNTIME_IP');
    });
    assert.equal(parsed[0]['--master-addr'], parsed[1]['--master-addr'], 'SHARED_RENDEZVOUS');
    assert.notEqual(parsed[0]['--node-rank'], parsed[1]['--node-rank'], 'UNIQUE_RANKS');
  }
}
function startup(d) {
  // The coupled leader needs its worker before engine health can succeed.
  // LeaderReady would therefore prevent that worker from being created.
  assert.equal(lws(d).spec.startupPolicy, 'LeaderCreated', 'STARTUP_DEPENDENCY');
}
function gpu(d) {
  for (const role of roles) {
    const c = container(d, role);
    const requested = positiveInt(c.resources?.requests?.[GPU], 'GPU_REQUEST');
    const limited = positiveInt(c.resources?.limits?.[GPU], 'GPU_LIMIT');
    assert.equal(requested, limited, 'GPU_EQUAL_REQUEST_LIMIT');
    const o = options(d, role);
    const world = positiveInt(o['--tensor-parallel-size'], 'TP') * positiveInt(o['--pipeline-parallel-size'], 'PP');
    assert.equal(world, 16, 'GPU_WORLD');
    assert.equal(world / lws(d).spec.leaderWorkerTemplate.size, requested, 'GPU_LOCAL_PROCESSES');
  }
}
function resolvePort(c, target) {
  return typeof target === 'string'
    ? one((c.ports || []).filter(p => p.name === target), 'NAMED_HTTP_PORT').containerPort : target;
}
function http(d) {
  const leader = container(d, 'leader'), worker = container(d, 'worker');
  const left = options(d, 'leader'), right = options(d, 'worker');
  requireThat(right['--headless'] === true
    && (right['--api-server-count'] === undefined || right['--api-server-count'] === '0'), 'WORKER_HEADLESS');
  requireThat(!left['--headless'] && !left['--render-only']
    && (left['--api-server-count'] === undefined || left['--api-server-count'] === '1'), 'LEADER_API');
  requireThat(!worker.readinessProbe && !(worker.ports || []).some(p => p.name === 'http'), 'WORKER_NO_HTTP_PROBE');
  const port = positiveInt(left['--port'], 'HTTP_LISTEN_PORT');
  assert.equal(left['--host'], '0.0.0.0', 'HTTP_LISTEN_HOST');
  const probe = leader.readinessProbe;
  requireThat(probe?.httpGet && !['exec', 'tcpSocket', 'grpc'].some(k => probe[k]), 'LEADER_HTTP_READINESS');
  assert.equal(probe.httpGet.path, '/health', 'HEALTH_PATH');
  assert.equal(resolvePort(leader, probe.httpGet.port), port, 'HEALTH_PORT');
  const api = service(d);
  assert.equal(api.apiVersion, 'v1', 'SERVICE_API_VERSION');
  assert.equal(api.metadata.namespace, lws(d).metadata.namespace, 'API_NAMESPACE');
  assert.equal(api.spec.type, 'ClusterIP', 'API_CLUSTER_IP');
  requireThat(api.spec.publishNotReadyAddresses !== true, 'API_READINESS_BYPASS');
  const labels = role => ({...template(d, role).metadata?.labels, [SET]: lws(d).metadata.name, [INDEX]: role === 'leader' ? '0' : '1'});
  const matches = target => api.spec.selector && Object.keys(api.spec.selector).length
    && Object.entries(api.spec.selector).every(([key, value]) => target[key] === value);
  requireThat(matches(labels('leader')) && !matches(labels('worker'))
    && !matches({...labels('leader'), [SET]: 'another-lws'}), 'API_LEADER_SELECTOR');
  const exposed = one(api.spec.ports.filter(p => p.port === 8000), 'API_PORT');
  assert.equal(resolvePort(leader, exposed.targetPort), port, 'API_TARGET_PORT');
}
function checkpoint(d) {
  const mounts = roles.map(role => {
    const c = container(d, role), o = options(d, role);
    requireThat(path.posix.isAbsolute(o.model), 'CHECKPOINT_PATH');
    assert.equal(o['--served-model-name'], MODEL, 'CLIENT_MODEL_ALIAS');
    const mount = one(c.volumeMounts.filter(m => {
      requireThat(typeof m.mountPath === 'string' && path.posix.isAbsolute(m.mountPath), 'MOUNT_ABSOLUTE_PATH');
      const relative = path.posix.relative(m.mountPath, o.model);
      // Include exact-directory mounts: otherwise one could hide the real
      // checkpoint under a second volume while the parent PVC still matches.
      return relative !== '..' && !relative.startsWith('../') && !path.posix.isAbsolute(relative);
    }), 'CHECKPOINT_MOUNT');
    requireThat(mount.readOnly === true && !mount.subPathExpr, 'CHECKPOINT_READ_ONLY');
    const volume = one(template(d, role).spec.volumes.filter(v => v.name === mount.name), 'CHECKPOINT_VOLUME');
    requireThat(volume.persistentVolumeClaim?.claimName && volume.persistentVolumeClaim.readOnly === true
      && !volume.emptyDir, 'CHECKPOINT_PVC');
    return {model: o.model, claim: volume.persistentVolumeClaim.claimName,
      pathInVolume: path.posix.join(mount.subPath || '', path.posix.relative(mount.mountPath, o.model))};
  });
  assert.deepEqual(mounts[0], mounts[1], 'SAME_CHECKPOINT');
}
const checks = {version, launch, startup, gpu, http, checkpoint};
function all(d) { Object.values(checks).forEach(check => check(d)); }
function rewriteArg(d, role, name, replacement) {
  const c = container(d, role), next = [];
  for (let i = 0; i < c.args.length; i++) {
    const arg = c.args[i];
    if (arg === name || arg.startsWith(`${name}=`)) {
      if (arg === name && c.args[i + 1] && !c.args[i + 1].startsWith('--')) i++;
    } else next.push(arg);
  }
  if (replacement !== undefined) next.push(replacement === true ? name : `${name}=${replacement}`);
  c.args = next;
}

test('both actual locale documents have identical executable YAML', () => assert.deepEqual(documents.ko.values, documents.en.values));
for (const [name, check] of Object.entries(checks)) test(`reviewed ${name} contract in both locales`, () => each(check));
test('missing/ambiguous YAML resources fail instead of skipping coverage', () => each(d => {
  const originalLws = lws(d), originalApi = service(d); // Valid base before duplicate controls.
  assert.throws(() => extract('No fenced example', 'missing'), /YAML_COUNT/);
  assert.throws(() => lws({values: []}), /LWS_COUNT/);
  assert.throws(() => lws({values: [...d.values, structuredClone(originalLws)]}), /LWS_COUNT/);
  assert.throws(() => service({values: [...d.values, structuredClone(originalApi)]}), /API_COUNT/);
}));
test('historical local-launch/request-only/cache defects remain invalid', () => each(d => {
  all(d); // An already-broken input must not make a negative control pass.
  const old = structuredClone(d);
  for (const role of roles) {
    for (const arg of ['--distributed-executor-backend', '--nnodes', '--node-rank', '--master-addr', '--master-port', '--headless'])
      rewriteArg(old, role, arg);
    delete container(old, role).resources.limits[GPU];
    container(old, role).args[0] = MODEL;
  }
  // Reconstructed defect control only; no historical document/cache is a CI dependency.
  assert.throws(() => launch(old), /MP_BACKEND/);
  assert.throws(() => gpu(old), /GPU_LIMIT/);
  assert.throws(() => http(old), /WORKER_HEADLESS/);
  assert.throws(() => checkpoint(old), /CHECKPOINT_PATH/);
}));
test('headless worker cannot also request HTTP API servers', () => each(d => {
  all(d);
  const changed = structuredClone(d);
  rewriteArg(changed, 'worker', '--api-server-count', '1');
  assert.throws(() => http(changed), /WORKER_HEADLESS/);
}));
test('checkpoint mounts cannot hide the directory or select different PVC contents', () => each(d => {
  all(d);
  const hidden = structuredClone(d), c = container(hidden, 'worker');
  c.volumeMounts.push({name: 'shadow', mountPath: options(hidden, 'worker').model});
  template(hidden, 'worker').spec.volumes.push({name: 'shadow', emptyDir: {}});
  assert.throws(() => checkpoint(hidden), /CHECKPOINT_MOUNT/);
  const shifted = structuredClone(d);
  const claims = template(shifted, 'worker').spec.volumes.filter(v => v.persistentVolumeClaim).map(v => v.name);
  const mount = one(container(shifted, 'worker').volumeMounts.filter(m => claims.includes(m.name)), 'FIXTURE_PVC_MOUNT');
  mount.subPath = path.posix.join(mount.subPath || '', 'different-revision');
  assert.throws(() => checkpoint(shifted), /SAME_CHECKPOINT/);
}));

const mutations = [
  ['missing nnodes', 'launch', /NNODES/, d => rewriteArg(d, 'worker', '--nnodes')],
  ['duplicate rank', 'launch', /NODE_RANK/, d => rewriteArg(d, 'worker', '--node-rank', '0')],
  ['wrong rendezvous', 'launch', /RENDEZVOUS_ADDRESS/, d => rewriteArg(d, 'worker', '--master-addr', 'localhost')],
  ['unexpanded variable', 'launch', /UNBOUND_ARG_VARIABLE/, d => rewriteArg(d, 'worker', '--nnodes', '$(GROUP_SIZE_TYPO)')],
  ['worker API instead of headless', 'http', /WORKER_HEADLESS/, d => rewriteArg(d, 'worker', '--headless')],
  ['GPU requests only', 'gpu', /GPU_LIMIT/, d => { delete container(d, 'leader').resources.limits[GPU]; }],
  ['unequal GPU request/limit', 'gpu', /GPU_EQUAL_REQUEST_LIMIT/, d => { container(d, 'worker').resources.limits[GPU] = '4'; }],
  ['leader readiness startup cycle', 'startup', /STARTUP_DEPENDENCY/, d => { lws(d).spec.startupPolicy = 'LeaderReady'; }],
  ['Service includes worker', 'http', /API_LEADER_SELECTOR/, d => { service(d).spec.selector = {[SET]: lws(d).metadata.name}; }],
  ['Service bypasses readiness', 'http', /API_READINESS_BYPASS/, d => { service(d).spec.publishNotReadyAddresses = true; }],
  ['unwired model cache', 'checkpoint', /CHECKPOINT_PATH/, d => { container(d, 'leader').args[0] = MODEL; }],
  ['client-facing model alias changed', 'checkpoint', /CLIENT_MODEL_ALIAS/, d => rewriteArg(d, 'leader', '--served-model-name', 'unexpected-name')],
  ['wrong health port', 'http', /HEALTH_PORT/, d => { container(d, 'leader').readinessProbe.httpGet.port = 8080; }],
];
for (const [name, guard, reason, mutate] of mutations) test(`reject ${name} in both locales`, () => each(d => {
  all(d);
  const changed = structuredClone(d);
  mutate(changed);
  assert.throws(() => checks[guard](changed), reason); // Must hit the intended guard, not an unrelated failure.
}));
