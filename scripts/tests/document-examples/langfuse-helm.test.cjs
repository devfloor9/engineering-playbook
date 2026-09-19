// C041: a bounded reference-profile check, NOT the chart's full schema or Helm.
// Primary pin: langfuse-k8s 7e60f0985d36f0d4f68c0e09fd5b6da9c362fdd4,
// charts/langfuse/{Chart.yaml,values.yaml,templates/_helpers.tpl,
// templates/{web,worker}/deployment.yaml,templates/validations.yaml}.
// Only Node builtins and the repository's existing js-yaml are required.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const yaml = require('js-yaml');

const PATHS = {
  ko: 'docs/aidlc/enterprise/agent-versioning/prompt-model-registry.md',
  en: 'i18n/en/docusaurus-plugin-content-docs/current/aidlc/enterprise/agent-versioning/prompt-model-registry.md',
};
const PIN = {chart: '2.1.1', app: '4.35.0'};
const MARKER = '# langfuse-values.yaml';

function root() {
  if (process.env.AIDLC_DOC_ROOT) return path.resolve(process.env.AIDLC_DOC_ROOT);
  for (const start of [process.cwd(), __dirname]) {
    let cursor = start;
    for (;;) {
      if (Object.values(PATHS).every(p => fs.existsSync(path.join(cursor, p)))) return cursor;
      const parent = path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }
  throw new Error('repository docs not found');
}

function extract(text) {
  let fence = null, language = null, body = [];
  const matches = [];
  for (const line of text.split(/\r?\n/)) {
    if (fence) {
      if (new RegExp(`^${fence[0]}{${fence.length},}\\s*$`).test(line)) {
        if (language === 'yaml' && body[0] === MARKER) matches.push(body.join('\n'));
        fence = null;
        body = [];
      } else body.push(line);
    } else {
      const opening = line.match(/^(`{3,}|~{3,})([^`]*)$/);
      if (opening) [fence, language] = [opening[1], opening[2].trim()];
    }
  }
  if (fence) throw new Error('unclosed fence');
  if (matches.length !== 1) throw new Error('missing or ambiguous Helm example');
  const source = matches[0];
  if (!source.includes(`# Chart: langfuse/langfuse ${PIN.chart}; appVersion: ${PIN.app}`)) {
    throw new Error('missing or changed chart/app pin');
  }
  const value = yaml.load(source); // Duplicate mapping keys and multiple documents fail.
  return {source, value};
}

function at(object, dotted) {
  return dotted.split('.').reduce((value, key) => value?.[key], object);
}
function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
const text = v => typeof v === 'string' && v.trim().length > 0;
const off = v => v === false;
const on = v => v === true;
const port = v => Number.isInteger(v) && v > 0 && v <= 65535;
const host = v => text(v) && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(v);
const secretName = v => text(v) && v.length <= 253 && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(v);
const secretKey = v => text(v) && /^[A-Za-z0-9_.-]+$/.test(v);
function httpsHost(v) {
  if (typeof v !== 'string' || !/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(v)) return false;
  try {
    const parsed = new URL(v);
    return parsed.protocol === 'https:' && !!parsed.hostname && !parsed.port &&
      !parsed.username && !parsed.password && parsed.pathname === '/' &&
      !parsed.search && !parsed.hash;
  } catch { return false; }
}
const secret = {secretKeyRef: {name: secretName, key: secretKey}};
const quantity = v => text(v) && /^(?:[1-9]\d*)(?:m|Ki|Mi|Gi)?$/.test(v);
const prefix = v => text(v) && !v.startsWith('/') && v.endsWith('/') && !v.includes('..');
// Exact selected profile. Other valid chart features require a separate review.
const SHAPE = {
  langfuse: {
    image: {tag: v => v === PIN.app},
    replicas: v => Number.isInteger(v) && v > 0,
    resources: {requests: {cpu: quantity, memory: quantity}, limits: {cpu: quantity, memory: quantity}},
    salt: secret, encryptionKey: secret,
    nextauth: {url: httpsHost, secret},
  },
  postgresql: {
    deploy: off, host, port, args: text,
    auth: {username: text, database: text, existingSecret: secretName, secretKeys: {userPasswordKey: secretKey}},
    migration: {autoMigrate: off},
  },
  redis: {
    deploy: off, host, port, tls: {enabled: on},
    auth: {username: text, existingSecret: secretName, existingSecretPasswordKey: secretKey},
  },
  clickhouse: {
    deploy: off, host: httpsHost, httpPort: port, nativePort: port, database: text,
    cluster: {enabled: off},
    auth: {username: text, existingSecret: secretName, existingSecretKey: secretKey},
    migration: {ssl: on, autoMigrate: off},
  },
  s3: {
    deploy: off, storageProvider: v => v === 's3', bucket: text, region: text,
    endpoint: httpsHost, forcePathStyle: on,
    accessKeyId: secret, secretAccessKey: secret,
    eventUpload: {prefix}, batchExport: {enabled: on, prefix}, mediaUpload: {enabled: on, prefix},
  },
};

function checkShape(value, shape, where = '') {
  if (typeof shape === 'function') {
    assert.ok(shape(value), `invalid reference value at ${where}`);
    return;
  }
  assert.ok(plain(value), `expected mapping at ${where}`);
  assert.deepEqual(Object.keys(value).sort(), Object.keys(shape).sort(), `unknown/missing key at ${where}`);
  for (const [key, rule] of Object.entries(shape)) {
    checkShape(value[key], rule, where ? `${where}.${key}` : key);
  }
}

function cpu(v) {
  assert.match(v, /^\d+m?$/);
  return v.endsWith('m') ? Number(v.slice(0, -1)) : Number(v) * 1000;
}
function memory(v) {
  const match = v.match(/^(\d+)(Ki|Mi|Gi)$/);
  assert.ok(match, 'memory must use Ki/Mi/Gi in this reference');
  return Number(match[1]) * {Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3}[match[2]];
}
function references(values) {
  return [
    ...['langfuse.salt', 'langfuse.encryptionKey', 'langfuse.nextauth.secret', 's3.accessKeyId', 's3.secretAccessKey']
      .map(p => ({path: p, ...at(values, p).secretKeyRef})),
    {path: 'postgresql.auth', name: values.postgresql.auth.existingSecret, key: values.postgresql.auth.secretKeys.userPasswordKey},
    {path: 'redis.auth', name: values.redis.auth.existingSecret, key: values.redis.auth.existingSecretPasswordKey},
    {path: 'clickhouse.auth', name: values.clickhouse.auth.existingSecret, key: values.clickhouse.auth.existingSecretKey},
  ];
}
function validate(values) {
  checkShape(values, SHAPE);
  const modes = new URLSearchParams(values.postgresql.args).getAll('sslmode');
  assert.equal(modes.length, 1, 'one PostgreSQL sslmode required');
  assert.ok(['require', 'verify-ca', 'verify-full'].includes(modes[0]), 'PostgreSQL TLS required by this profile');
  const resources = values.langfuse.resources;
  assert.ok(cpu(resources.requests.cpu) <= cpu(resources.limits.cpu), 'CPU request exceeds limit');
  assert.ok(memory(resources.requests.memory) <= memory(resources.limits.memory), 'memory request exceeds limit');
  const refs = references(values);
  assert.equal(refs.length, 8);
  // The prose declares one existing Secret with eight distinct keys.
  assert.ok(refs.every(ref => ref.name === 'langfuse-runtime'), 'Secret name differs from declared prerequisite');
  assert.equal(new Set(refs.map(ref => ref.key)).size, 8, 'distinct credential keys required by this example');
  const prefixes = ['eventUpload', 'batchExport', 'mediaUpload'].map(key => values.s3[key].prefix);
  assert.equal(new Set(prefixes).size, 3, 'upload prefixes overlap');
  return {secretReferences: refs, applicationPods: values.langfuse.replicas * 2};
}

function altered(values, dotted, replacement, remove = false) {
  const copy = structuredClone(values);
  const pieces = dotted.split('.');
  const last = pieces.pop();
  const parent = pieces.reduce((value, key) => value[key], copy);
  if (remove) delete parent[last];
  else parent[last] = replacement;
  return copy;
}

function register() {
  const sources = {};
  for (const [locale, relative] of Object.entries(PATHS)) {
    const doc = fs.readFileSync(path.join(root(), relative), 'utf8');
    sources[locale] = extract(doc);
    const values = sources[locale].value;
    test(`${locale}: selected chart profile is coherent`, () => {
      const result = validate(values);
      assert.equal(result.applicationPods, 4);
      assert.equal(cpu(values.langfuse.resources.requests.cpu), 500);
      assert.equal(cpu(values.langfuse.resources.limits.cpu), 2000);
      assert.equal(memory(values.langfuse.resources.requests.memory), 1024 ** 3);
      assert.equal(memory(values.langfuse.resources.limits.memory), 4 * 1024 ** 3);
    });
    for (const key of ['replicaCount', 'env', 'resources']) {
      test(`${locale}: rejects old top-level ${key}`, () =>
        assert.throws(() => validate({...values, [key]: key === 'env' ? [] : 2})));
    }
    for (const store of ['postgresql', 'redis', 'clickhouse', 's3']) {
      test(`${locale}: ${store} cannot silently enable a bundled store`, () => {
        for (const bad of [true, 'false', null, 0]) {
          assert.throws(() => validate(altered(values, `${store}.deploy`, bad)));
        }
        assert.throws(() => validate(altered(values, `${store}.deploy`, undefined, true)));
      });
    }
    for (const dotted of ['postgresql.host', 'redis.host', 'clickhouse.host', 's3.bucket', 's3.region', 's3.endpoint']) {
      test(`${locale}: ${dotted} prerequisite cannot be blank`, () =>
        assert.throws(() => validate(altered(values, dotted, ''))));
    }
    for (const dotted of ['postgresql.auth', 'redis.auth', 'clickhouse.auth']) {
      test(`${locale}: ${dotted} rejects inline/conflicting password`, () =>
        assert.throws(() => validate(altered(values, `${dotted}.password`, 'illustrative-invalid-inline-value'))));
    }
    test(`${locale}: refuses duplicate or incomplete Secret references`, () => {
      assert.throws(() => validate(altered(values, 'langfuse.salt.secretKeyRef.key', '')));
      assert.throws(() => validate(altered(values, 'langfuse.encryptionKey.secretKeyRef.key', 'salt')));
      assert.throws(() => validate(altered(values, 's3.accessKeyId.secretKeyRef.name', 'other-secret')));
      assert.throws(() => validate(altered(values, 'postgresql.auth.secretKeys.userPasswordKey', '')));
      assert.throws(() => validate(altered(values, 'redis.auth.existingSecretPasswordKey', '')));
      assert.throws(() => validate(altered(values, 'clickhouse.auth.existingSecretKey', '')));
    });
    test(`${locale}: refuses fallback credential values`, () => {
      for (const dotted of ['langfuse.salt', 'langfuse.encryptionKey', 'langfuse.nextauth.secret', 's3.accessKeyId', 's3.secretAccessKey']) {
        assert.throws(() => validate(altered(values, `${dotted}.value`, 'invalid-inline')));
      }
    });
    test(`${locale}: refuses conflicting additionalEnv override`, () =>
      assert.throws(() => validate(altered(values, 'langfuse.additionalEnv', [{name: 'DATABASE_URL', value: 'invalid'}]))));
    test(`${locale}: TLS endpoint fields reject credentials and double ports`, () => {
      for (const dotted of ['langfuse.nextauth.url', 'clickhouse.host', 's3.endpoint']) {
        for (const bad of ['http://example.invalid', 'https://u:p@example.invalid', 'https://example.invalid:8443', 'https://example.invalid:443', 'https://example.invalid/', 'https://example.invalid/a', 'https://example.invalid?token=x']) {
          assert.throws(() => validate(altered(values, dotted, bad)));
        }
      }
    });
    test(`${locale}: migration and nonclustered assumptions stay explicit`, () => {
      for (const dotted of ['postgresql.migration.autoMigrate', 'clickhouse.migration.autoMigrate', 'clickhouse.cluster.enabled']) {
        assert.throws(() => validate(altered(values, dotted, true)));
      }
      assert.throws(() => validate(altered(values, 'clickhouse.migration.ssl', false)));
      assert.throws(() => validate(altered(values, 'redis.tls.enabled', false)));
    });
    test(`${locale}: rejects unsupported placeholder port types`, () => {
      for (const bad of [0, 65536, 1.5, '5432', false]) {
        assert.throws(() => validate(altered(values, 'postgresql.port', bad)));
      }
    });
    test(`${locale}: enforces selected chart app tag`, () =>
      assert.throws(() => validate(altered(values, 'langfuse.image.tag', 'latest'))));
    test(`${locale}: rejects resource request greater than limit`, () => {
      assert.throws(() => validate(altered(values, 'langfuse.resources.requests.cpu', '3000m')));
      assert.throws(() => validate(altered(values, 'langfuse.resources.requests.memory', '8Gi')));
    });
    test(`${locale}: rejects replicas coerced from strings or booleans`, () => {
      for (const bad of ['2', true, 0, -1]) assert.throws(() => validate(altered(values, 'langfuse.replicas', bad)));
    });
    test(`${locale}: PostgreSQL TLS mode cannot be disabled or ambiguous`, () => {
      for (const bad of ['sslmode=disable', 'sslmode=prefer', 'sslmode=require&sslmode=disable']) {
        assert.throws(() => validate(altered(values, 'postgresql.args', bad)));
      }
    });
    test(`${locale}: upload settings cannot erase external-store assumptions`, () => {
      assert.throws(() => validate(altered(values, 's3.forcePathStyle', false)));
      assert.throws(() => validate(altered(values, 's3.mediaUpload.prefix', 'events/')));
      assert.throws(() => validate(altered(values, 's3.storageProvider', 'gcs')));
    });
  }
  test('KO/EN YAML is identical', () => assert.deepEqual(sources.ko.value, sources.en.value));
  test('missing extraction fails', () => assert.throws(() => extract('```yaml\nx: 1\n```')));
  test('ambiguous extraction fails', () => {
    const block = `\`\`\`yaml\n${sources.en.source}\n\`\`\`\n`;
    assert.throws(() => extract(block + block));
  });
  test('unclosed extraction fails', () => assert.throws(() => extract(`\`\`\`yaml\n${sources.en.source}`)));
  test('duplicate YAML keys fail', () => assert.throws(() =>
    extract(`\`\`\`yaml\n${sources.en.source}\nlangfuse: {}\n\`\`\``)));
  test('multiple YAML documents fail', () => assert.throws(() =>
    extract(`\`\`\`yaml\n${sources.en.source}\n---\nx: 1\n\`\`\``)));
  test('changing chart pin requires contract review', () => assert.throws(() =>
    extract(`\`\`\`yaml\n${sources.en.source.replace('langfuse/langfuse 2.1.1', 'langfuse/langfuse 2.1.2')}\n\`\`\``)));
}

module.exports = {extract, validate, references, SHAPE, PIN, PATHS};
if (require.main === module) register();
