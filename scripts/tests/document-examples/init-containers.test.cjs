'use strict';

// Exact source extraction; selected contracts and offline doubles, not an API schema validator.
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {createRequire} = require('node:module');
const root = path.resolve(process.env.INIT_DOC_ROOT || process.cwd());
const deps = path.resolve(process.env.INIT_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(deps, 'package.json'))('js-yaml');
const DOCS = {
  ko: 'docs/eks-best-practices/operations-reliability/pod-lifecycle/init-containers.md',
  en: 'i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/operations-reliability/pod-lifecycle/init-containers.md',
};
const mutation = process.env.INIT_TEST_MUTATION || '';
assert.ok(['', 'mask-migration-failure', 'dump-secret', 'accept-exhaustion'].includes(mutation));
function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length - 1, 1, `Missing/ambiguous mutation: ${before}`);
  return source.replace(before, after);
}
function extract(relative) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8');
  const fences = [...text.matchAll(/^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)];
  assert.equal((text.match(/^```/gm) || []).length, fences.length * 2, 'Unclosed/nested fence');
  assert.equal(fences.length, 6, 'Every example must be extracted, including the diagram');
  assert.equal(fences.filter(x => x[1] === 'yaml').length, 5);
  const resources = fences.filter(x => x[1] === 'yaml').flatMap(x => yaml.loadAll(x[2]));
  assert.equal(resources.length, 6);
  assert.equal(resources.filter(x => x.kind === 'Deployment').length, 4);
  assert.equal(resources.filter(x => x.kind === 'Pod').length, 1);
  assert.equal(resources.filter(x => x.kind === 'ConfigMap').length, 1);
  console.log('EXTRACTION ' + JSON.stringify({
    document: relative, sha256: crypto.createHash('sha256').update(text).digest('hex'),
    yamlBlocks: 5, resources: resources.length, mutation: mutation || null,
  }));
  return {text, resources, diagram: fences.find(x => x[1] === 'mermaid')[2]};
}
const documents = Object.fromEntries(Object.entries(DOCS).map(([locale, file]) => [locale, extract(file)]));
const locales = Object.keys(documents);
const resource = (locale, name) => {
  const found = documents[locale].resources.filter(x => x.metadata?.name === name);
  assert.equal(found.length, 1, `Missing/ambiguous resource ${name}`);
  return found[0];
};
function container(locale, deployment, name) {
  const found = resource(locale, deployment).spec.template.spec.initContainers.filter(x => x.name === name);
  assert.equal(found.length, 1, `Missing/ambiguous init container ${name}`);
  const value = structuredClone(found[0]);
  if (mutation === 'mask-migration-failure' && name === 'db-migration') {
    value.command[2] = replaceOnce(value.command[2], '/app/migrate up || exit "$?"', '/app/migrate up');
  }
  if (mutation === 'dump-secret' && name === 'config-generator') {
    value.command[2] += '\nprint(os.environ["DB_URL"])\n';
  }
  if (mutation === 'accept-exhaustion' && name.startsWith('wait-for-')) {
    value.command[2] = replaceOnce(value.command[2],
      'raise SystemExit("TCP connection failed after 30 attempts")', 'break');
  }
  return value;
}

function validateDeployments(resources) {
  for (const item of resources.filter(x => x.kind === 'Deployment')) {
    assert.equal(item.apiVersion, 'apps/v1');
    const selector = item.spec.selector?.matchLabels;
    assert.ok(selector && Object.keys(selector).length, `${item.metadata.name}: selector required`);
    for (const [key, value] of Object.entries(selector)) {
      assert.equal(item.spec.template.metadata?.labels?.[key], value);
    }
    assert.ok(item.spec.template.spec.containers.every(x => typeof x.image === 'string' && x.image));
  }
}

function shellRun(item, fail = '') {
  assert.deepEqual(item.command.slice(0, 2), ['/bin/sh', '-c']);
  assert.equal(item.command.length, 3, 'Only the extracted shell command is supported');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'init-example-'));
  try {
    for (const name of ['migrate', 'chown', 'chmod']) {
      fs.writeFileSync(path.join(temp, name),
        `#!/bin/sh\nprintf '%s\\n' '${name}'\nif [ "$FAIL_COMMAND" = '${name}' ]; then exit 42; fi\n`, {mode: 0o700});
    }
    // Map only the fixture executable location; preserve the extracted shell logic.
    const script = item.command[2].replaceAll('/app/migrate', path.join(temp, 'migrate'));
    const result = spawnSync('/bin/sh', ['-c', script], {
      encoding: 'utf8', timeout: 3000,
      env: {PATH: temp, FAIL_COMMAND: fail},
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return result;
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
}

// The extracted Python code is compiled/executed unchanged. Imports, filesystem,
// socket creation and sleep are replaced before execution; no real I/O is reachable.
const PYTHON_HARNESS = String.raw`
import builtins, contextlib, io, json, sys, types
p = json.load(sys.stdin)
calls, sleeps, closed, output = [], [], [], {}
class Sink(io.StringIO):
    def close(self):
        output["config"] = self.getvalue()
        super().close()
    def write(self, value):
        if p.get("write_error"):
            raise OSError("fixture write failure")
        return super().write(value)
def fake_open(name, mode="r", encoding=None):
    if name == "/config-template/config.template" and mode == "r":
        if p.get("read_error"):
            raise OSError("fixture read failure")
        return io.StringIO(p["template"])
    if name == "/config/config.yaml" and mode == "w":
        return Sink()
    raise AssertionError("unexpected filesystem access")
class Connection:
    def __enter__(self):
        return self
    def __exit__(self, *args):
        closed.append(True)
def connect(address, timeout=None):
    calls.append([list(address), timeout])
    if len(calls) > 31:
        raise AssertionError("unbounded retry")
    if p.get("always_fail") or len(calls) <= p.get("failures", 0):
        raise OSError("fixture connection failure")
    return Connection()
def sleep(seconds):
    sleeps.append(seconds)
    if len(sleeps) > 30:
        raise AssertionError("unbounded sleep")
modules = {
    "json": json,
    "os": types.SimpleNamespace(environ=p.get("env", {})),
    "socket": types.SimpleNamespace(create_connection=connect),
    "time": types.SimpleNamespace(sleep=sleep),
}
def fake_import(name, *args, **kwargs):
    if name not in modules:
        raise AssertionError("unexpected import: " + name)
    return modules[name]
safe = dict(vars(builtins))
safe.update(open=fake_open, __import__=fake_import)
stdout, stderr = io.StringIO(), io.StringIO()
status, error = 0, None
with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
    try:
        exec(compile(p["code"], "<exact-document-example>", "exec"), {"__builtins__": safe})
    except BaseException as exc:
        status = 1
        error = type(exc).__name__ + ": " + str(exc)
print(json.dumps(dict(status=status, error=error, stdout=stdout.getvalue(),
                     stderr=stderr.getvalue(), calls=calls, sleeps=sleeps,
                     closed=len(closed), output=output)))
`;
function pythonRun(item, options = {}) {
  assert.deepEqual(item.command.slice(0, 2), ['python3', '-c']);
  assert.equal(item.command.length, 3, 'Only the extracted Python command is supported');
  const result = spawnSync('python3', ['-I', '-c', PYTHON_HARNESS], {
    input: JSON.stringify({code: item.command[2], ...options}),
    encoding: 'utf8', timeout: 3000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
const ENV = {PORT: '8080', HOST: '0.0.0.0', DB_URL: 'postgres://fixture:secret@example/db'};
function configRun(locale, options = {}) {
  return pythonRun(container(locale, 'app-with-config', 'config-generator'), {
    template: resource(locale, 'app-config-template').data['config.template'],
    env: ENV, ...options,
  });
}
function assertSecretAbsent(result, secret) {
  const diagnostics = [result.stdout, result.stderr, result.error || ''].join('\n');
  assert.ok(!diagnostics.includes(secret), 'Secret leaked to diagnostics');
}
function validateLogRoute(pod) {
  const sidecar = pod.spec.initContainers.find(x => x.name === 'log-collector');
  assert.equal(sidecar.restartPolicy, 'Always');
  assert.deepEqual(sidecar.command, ['/fluent-bit/bin/fluent-bit']);
  const args = sidecar.args;
  assert.ok(Array.isArray(args) && args.length % 2 === 0, 'Explicit Fluent Bit route required');
  const stages = [];
  let stage;
  for (let i = 0; i < args.length; i += 2) {
    const [flag, value] = args.slice(i, i + 2);
    if (flag === '-i' || flag === '-o') {
      stage = {type: flag, name: value, properties: {}};
      stages.push(stage);
    } else {
      assert.ok(stage && ['-p', '-t', '-m'].includes(flag), 'Unsupported/misordered option');
      const equal = value.indexOf('=');
      const key = flag === '-p' ? value.slice(0, equal) : flag === '-t' ? 'tag' : 'match';
      const val = flag === '-p' ? value.slice(equal + 1) : value;
      assert.ok(flag !== '-p' || equal > 0);
      assert.ok(!(key in stage.properties), 'Duplicate route property');
      stage.properties[key] = val;
    }
  }
  assert.equal(stages.length, 2);
  const [input, output] = stages;
  assert.equal(input.type, '-i'); assert.equal(input.name, 'tail');
  assert.equal(output.type, '-o'); assert.equal(output.name, 'stdout');
  assert.equal(input.properties.path, '/var/log/app/*.log');
  assert.equal(input.properties.read_from_head, 'true');
  assert.ok(input.properties.tag);
  assert.equal(output.properties.match, input.properties.tag);
  const reader = sidecar.volumeMounts.find(x => x.mountPath === '/var/log/app');
  const writer = pod.spec.containers[0].volumeMounts.find(x => x.mountPath === '/app/logs');
  assert.ok(reader && writer);
  assert.equal(reader.name, writer.name);
  assert.ok(pod.spec.volumes.some(x => x.name === reader.name && x.emptyDir));
}

test('all YAML examples are extracted, unique-key parsed and semantically bilingual', () => {
  assert.deepEqual(documents.ko.resources, documents.en.resources);
  assert.throws(() => yaml.load('kind: Pod\nkind: Deployment\n'), /duplicated mapping key/);
});
test('all four Deployments select their own matching Pod labels', () => {
  for (const locale of locales) validateDeployments(documents[locale].resources);
});
test('selector deletion and mismatched labels are rejected', () => {
  for (const locale of locales) {
    for (const change of ['delete', 'mismatch']) {
      const values = structuredClone(documents[locale].resources);
      const deployment = values.find(x => x.kind === 'Deployment');
      if (change === 'delete') delete deployment.spec.selector;
      else deployment.spec.template.metadata.labels.app = 'wrong-workload';
      assert.throws(() => validateDeployments(values));
    }
  }
});
test('retry diagram returns failed init2 to init2, preserving completed init1', () => {
  for (const {diagram} of Object.values(documents)) {
    assert.match(diagram, /RESTART2\s*-->\s*INIT2/);
    assert.doesNotMatch(diagram, /RESTART2\s*-->\s*INIT1/);
  }
});
test('migration failure preserves nonzero status and suppresses completion', () => {
  for (const locale of locales) {
    const result = shellRun(container(locale, 'web-app', 'db-migration'), 'migrate');
    assert.equal(result.status, 42);
    assert.doesNotMatch(result.stdout, /Migrations completed/);
  }
});
test('migration success reports completion after the migrator', () => {
  for (const locale of locales) {
    const result = shellRun(container(locale, 'web-app', 'db-migration'));
    assert.equal(result.status, 0);
    assert.match(result.stdout, /migrate\nMigrations completed/);
  }
});
test('failed ownership change prevents chmod and completion', () => {
  for (const locale of locales) {
    const result = shellRun(container(locale, 'app-with-volume', 'volume-permissions'), 'chown');
    assert.equal(result.status, 42);
    assert.doesNotMatch(result.stdout, /chmod|Permissions set/);
  }
});
test('failed chmod propagates its status without completion', () => {
  for (const locale of locales) {
    const result = shellRun(container(locale, 'app-with-volume', 'volume-permissions'), 'chmod');
    assert.equal(result.status, 42);
    assert.doesNotMatch(result.stdout, /Permissions set/);
  }
});
test('successful permission setup preserves ownership-mode-completion order', () => {
  for (const locale of locales) {
    const result = shellRun(container(locale, 'app-with-volume', 'volume-permissions'));
    assert.equal(result.status, 0);
    assert.match(result.stdout, /chown\nchmod\nPermissions set/);
  }
});
test('serializer preserves literal punctuation, quotes, backslashes, newlines and Unicode without logging secrets', () => {
  for (const locale of locales) {
    const secret = 'postgres://u:s&x|y\\z"\'@db/name?a=1&b=2\n한국어:#[]{}';
    const env = {...ENV, DB_URL: secret, HOST: 'false: # literal'};
    const result = configRun(locale, {env});
    assert.equal(result.status, 0, result.error);
    const parsed = yaml.load(result.output.config);
    assert.deepEqual(parsed, {server: {port: 8080, host: env.HOST}, database: {url: secret}});
    assertSecretAbsent(result, secret);
    assert.ok(!result.stdout.includes('postgres://'));
  }
});
test('invalid port is rejected before writing configuration', () => {
  for (const locale of locales) for (const PORT of ['0', '65536', 'not-a-port']) {
    const result = configRun(locale, {env: {...ENV, PORT}});
    assert.equal(result.status, 1);
    assert.equal(result.output.config, undefined);
    assertSecretAbsent(result, ENV.DB_URL);
  }
});
test('malformed template and missing Secret input fail without completion', () => {
  for (const locale of locales) for (const options of [
    {template: '{'}, {env: {PORT: '8080', HOST: 'localhost'}},
  ]) {
    const result = configRun(locale, options);
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stdout, /Config file generated/);
    assertSecretAbsent(result, ENV.DB_URL);
  }
});
test('configuration read/write failures propagate without a success message', () => {
  for (const locale of locales) for (const flag of ['read_error', 'write_error']) {
    const result = configRun(locale, {[flag]: true});
    assert.equal(result.status, 1);
    assert.match(result.error, /OSError/);
    assert.doesNotMatch(result.stdout, /Config file generated/);
    assertSecretAbsent(result, ENV.DB_URL);
  }
});
const WAITS = [['wait-for-db', 'postgres-service', 5432], ['wait-for-redis', 'redis-service', 6379]];
test('successful TCP attempt closes the connection without sleeping', () => {
  for (const locale of locales) for (const [name, host, port] of WAITS) {
    const result = pythonRun(container(locale, 'backend-api', name));
    assert.equal(result.status, 0, result.error);
    assert.deepEqual(result.calls, [[[host, port], 2]]);
    assert.equal(result.closed, 1);
    assert.deepEqual(result.sleeps, []);
  }
});
test('transient TCP failure retries only until successful connection', () => {
  for (const locale of locales) for (const [name] of WAITS) {
    const result = pythonRun(container(locale, 'backend-api', name), {failures: 2});
    assert.equal(result.status, 0, result.error);
    assert.equal(result.calls.length, 3);
    assert.equal(result.closed, 1);
    assert.deepEqual(result.sleeps, [2, 2]);
  }
});
test('TCP retry exhaustion fails after 30 attempts and 29 fake sleeps', () => {
  for (const locale of locales) for (const [name] of WAITS) {
    const result = pythonRun(container(locale, 'backend-api', name), {always_fail: true});
    assert.equal(result.status, 1);
    assert.match(result.error, /SystemExit/);
    assert.equal(result.calls.length, 30);
    assert.equal(result.sleeps.length, 29);
    assert.equal(result.closed, 0);
    assert.doesNotMatch(result.stdout, /established|ready/i);
  }
});
test('Fluent Bit explicitly tails the app shared-volume path and matches stdout output', () => {
  for (const locale of locales) validateLogRoute(resource(locale, 'app-with-sidecar'));
});
test('missing logging configuration and mismatched output tags are rejected', () => {
  for (const locale of locales) for (const change of ['missing', 'mismatch']) {
    const pod = structuredClone(resource(locale, 'app-with-sidecar'));
    if (change === 'missing') delete pod.spec.initContainers[0].args;
    else pod.spec.initContainers[0].args[pod.spec.initContainers[0].args.length - 1] = 'wrong.tag';
    assert.throws(() => validateLogRoute(pod));
  }
});
