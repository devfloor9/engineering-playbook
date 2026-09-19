'use strict';

// Authored YAML contracts only: no schema download, commands or infrastructure.
// Default cwd matches scripts/test-document-examples.cjs. Root overrides allow
// isolated proposal/baseline checks without copying implementations into tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const root = path.resolve(process.env.FARGATE_DOC_ROOT || process.cwd());
const dependencyRoot = path.resolve(process.env.FARGATE_DEPS_ROOT || process.cwd());
const yaml = createRequire(path.join(dependencyRoot, 'package.json'))('js-yaml');
const documents = {
  ko: 'docs/eks-best-practices/operations-reliability/pod-lifecycle/shutdown-fargate.md',
  en: 'i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/operations-reliability/pod-lifecycle/shutdown-fargate.md',
};

function extract(relativePath) {
  const filename = path.join(root, relativePath);
  const blocks = [];
  let fence;
  fs.readFileSync(filename, 'utf8').split(/\r?\n/).forEach((line, index) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!fence && marker) {
      fence = {marker: marker[1], language: marker[2].trim().split(/\s+/)[0], line: index + 1, lines: []};
    } else if (fence && marker && marker[1][0] === fence.marker[0]
      && marker[1].length >= fence.marker.length && !marker[2].trim()) {
      blocks.push({...fence, code: fence.lines.join('\n')});
      fence = undefined;
    } else if (fence) fence.lines.push(line);
  });
  assert.equal(fence, undefined, `${relativePath}: unclosed code fence`);
  const result = blocks.filter(block => block.language === 'yaml');
  assert.ok(result.length, `${relativePath}: no YAML extracted`);
  return result.map(block => ({...block, filename}));
}

const sources = Object.fromEntries(Object.entries(documents).map(([locale, filename]) => [locale, extract(filename)]));
function parse(block) {
  const values = yaml.loadAll(block.code, {filename: `${block.filename}:${block.line}`});
  assert.ok(values.length && values.every(value => value && typeof value === 'object' && !Array.isArray(value)),
    'Every YAML document must be a nonempty mapping');
  return values;
}
function allYaml(locale) { return sources[locale].flatMap(parse); }
function resources(locale) {
  // Parse full resources independently so an invalid probe fragment cannot mask
  // a second, independently actionable ECS-container error in the old source.
  return sources[locale].filter(block => /^apiVersion:/m.test(block.code)).flatMap(parse);
}
const apiVersions = {Deployment: 'apps/v1', Pod: 'v1', PodDisruptionBudget: 'policy/v1', Namespace: 'v1', ConfigMap: 'v1'};
function probes(values) {
  const result = [];
  const collect = container => {
    for (const kind of ['startupProbe', 'livenessProbe', 'readinessProbe']) {
      if (Object.hasOwn(container, kind)) result.push({kind, probe: container[kind]});
    }
  };
  for (const value of values) {
    if (!value.kind) collect(value);
    const spec = podSpec(value);
    if (spec) [...spec.containers, ...(spec.initContainers || [])].forEach(collect);
  }
  return result;
}
function validateProbe(probe, kind) {
  assert.ok(probe && typeof probe === 'object' && !Array.isArray(probe), `${kind}: probe mapping`);
  const handlers = ['httpGet', 'tcpSocket', 'exec', 'grpc'].filter(key => Object.hasOwn(probe, key));
  assert.equal(handlers.length, 1, `${kind}: exactly one probe handler required`);
  assert.ok(probe[handlers[0]] && typeof probe[handlers[0]] === 'object', `${kind}: handler mapping`);
  for (const field of ['failureThreshold', 'successThreshold', 'periodSeconds', 'timeoutSeconds']) {
    if (Object.hasOwn(probe, field)) assert.ok(Number.isInteger(probe[field]) && probe[field] > 0,
      `${kind}: ${field} must be a positive integer`);
  }
  if (kind !== 'readinessProbe') assert.ok(probe.successThreshold === undefined || probe.successThreshold === 1,
    `${kind}: successThreshold must equal 1`);
  if (Object.hasOwn(probe, 'initialDelaySeconds')) assert.ok(Number.isInteger(probe.initialDelaySeconds)
    && probe.initialDelaySeconds >= 0, `${kind}: initialDelaySeconds must be nonnegative`);
}
function validateYaml(values) {
  for (const value of values) {
    if (value.kind) {
      assert.ok(Object.hasOwn(apiVersions, value.kind), `Unreviewed kind: ${value.kind}`);
      assert.equal(value.apiVersion, apiVersions[value.kind], `Incorrect apiVersion for ${value.kind}`);
    } else {
      assert.deepEqual(Object.keys(value), ['startupProbe'], 'Unclassified YAML fragment');
    }
  }
  const reviewed = probes(values);
  assert.ok(reviewed.length, 'No probes were checked');
  reviewed.forEach(({probe, kind}) => validateProbe(probe, kind));
}
function podSpec(resource) {
  return resource.kind === 'Deployment' ? resource.spec.template.spec
    : resource.kind === 'Pod' ? resource.spec : undefined;
}
function validateContainers(values) {
  let count = 0;
  for (const resource of values) {
    const spec = podSpec(resource);
    if (!spec) continue;
    assert.ok(Array.isArray(spec.containers) && spec.containers.length);
    for (const container of [...spec.containers, ...(spec.initContainers || [])]) {
      count++;
      assert.ok(typeof container.name === 'string' && container.name);
      assert.ok(typeof container.image === 'string' && container.image);
      for (const field of ['firelensConfiguration', 'logConfiguration', 'essential']) {
        assert.ok(!Object.hasOwn(container, field), `ECS-only container field: ${field}`);
      }
    }
  }
  assert.ok(count, 'No application containers were checked');
}
function one(values, kind, name) {
  const matches = values.filter(value => value.kind === kind && (!name || value.metadata?.name === name));
  assert.equal(matches.length, 1, `Expected one ${kind} ${name || ''}`);
  return matches[0];
}
function validateLogging(values) {
  const namespace = one(values, 'Namespace', 'aws-observability');
  assert.equal(namespace.metadata.labels?.['aws-observability'], 'enabled', 'Logging namespace label');
  const config = one(values, 'ConfigMap', 'aws-logging');
  assert.equal(config.metadata.namespace, 'aws-observability', 'Logging namespace');
  const data = config.data;
  assert.ok(data && typeof data['output.conf'] === 'string', 'Logging output.conf');
  assert.ok(Object.keys(data).every(key => ['output.conf', 'flb_log_cw'].includes(key)),
    'This minimal example must remain output-only');
  assert.ok(Object.values(data).every(value => typeof value === 'string'), 'ConfigMap data must be strings');
  if (Object.hasOwn(data, 'flb_log_cw')) assert.ok(['true', 'false'].includes(data.flb_log_cw));
  assert.ok(Object.values(data).join('').length <= 5300, 'Fargate logging configuration size');
  assert.ok(!Object.values(data).join('').includes('${'), 'Fargate rejects environment substitutions');
  const lines = data['output.conf'].split('\n').filter(line => line.trim() && !line.trimStart().startsWith('#'));
  const header = lines.shift();
  assert.equal(header?.trim(), '[OUTPUT]', 'Expected output stanza');
  const indentation = line => line.match(/^[ \t]*/)[0];
  const sectionIndent = indentation(header);
  const propertyIndent = lines.length ? indentation(lines[0]) : '';
  assert.ok(propertyIndent.startsWith(sectionIndent) && propertyIndent.length > sectionIndent.length,
    'FluentConf properties must be indented deeper than the directive');
  const options = {};
  for (const line of lines) {
    assert.ok(!line.trimStart().startsWith('['), 'Only one output stanza; no INPUT/SERVICE section');
    assert.equal(indentation(line), propertyIndent, 'FluentConf property indentation must be consistent');
    const pair = line.trim().match(/^(\S+)\s+(.+)$/);
    assert.ok(pair, 'Malformed output setting');
    const key = pair[1].toLowerCase();
    assert.ok(!Object.hasOwn(options, key), `Duplicate output setting: ${key}`);
    options[key] = pair[2];
  }
  assert.equal(options.name, 'cloudwatch_logs', 'Expected supported CloudWatch Logs output');
  assert.equal(options.match, 'kube.*', 'Output must match the built-in input tag');
  for (const key of ['region', 'log_group_name', 'log_stream_prefix']) assert.ok(options[key], `Missing ${key}`);
  assert.ok(['true', 'false'].includes(options.auto_create_group), 'Explicit log-group creation choice');
}
function validatePlacement(values) {
  const deployments = values.filter(value => value.kind === 'Deployment');
  assert.ok(deployments.length, 'No Deployments checked');
  for (const deployment of deployments) {
    const selector = deployment.spec.selector.matchLabels;
    assert.ok(selector && Object.keys(selector).length);
    assert.ok(Object.entries(selector).every(([key, value]) => deployment.spec.template.metadata.labels[key] === value),
      'Deployment selector must match its template');
  }
  const pdb = one(values, 'PodDisruptionBudget');
  const selector = pdb.spec.selector.matchLabels;
  assert.ok(selector && Object.keys(selector).length, 'PDB must have an explicit selector');
  const selected = deployments.filter(deployment => deployment.metadata.namespace === pdb.metadata.namespace
    && Object.entries(selector).every(([key, value]) => deployment.spec.template.metadata.labels[key] === value));
  assert.equal(selected.length, 1, 'PDB must select one intended example Deployment');
  const replicas = selected[0].spec.replicas;
  const minimum = pdb.spec.minAvailable;
  assert.ok(Number.isInteger(replicas) && Number.isInteger(minimum) && minimum > 0 && minimum < replicas,
    'PDB must retain Ready capacity and allow a disruption when every replica is Ready');
}
function validateGrace(values) {
  let count = 0;
  for (const resource of values) {
    const spec = podSpec(resource);
    if (!spec) continue;
    for (const container of spec.containers) {
      const command = container.lifecycle?.preStop?.exec?.command;
      if (!command) continue;
      count++;
      assert.deepEqual(command.slice(0, 2), ['/bin/sh', '-c']);
      assert.equal(command.length, 3, 'Unreviewed preStop command arguments');
      const wait = command[2].trim().match(/^sleep\s+(\d+(?:\.\d+)?)$/);
      assert.ok(wait, 'Cannot establish the budget of this preStop command without review');
      const grace = spec.terminationGracePeriodSeconds;
      assert.ok(Number.isInteger(grace) && Number(wait[1]) > 0 && grace > Number(wait[1]),
        'preStop must leave positive time inside the total grace period');
    }
  }
  assert.ok(count, 'No termination-budget examples checked');
}

for (const locale of ['ko', 'en']) {
  test(`${locale}: unique YAML keys and classified API documents/fragments`, () => validateYaml(allYaml(locale)));
  test(`${locale}: Kubernetes containers reject ECS-only fields`, () => validateContainers(resources(locale)));
  test(`${locale}: logging namespace, input tag and output-only configuration`, () => validateLogging(resources(locale)));
  test(`${locale}: Deployment selectors and PDB capacity agree`, () => validatePlacement(resources(locale)));
  test(`${locale}: preStop leaves application shutdown time`, () => validateGrace(resources(locale)));
}
test('KO/EN YAML examples have equivalent configuration', () => assert.deepEqual(allYaml('ko'), allYaml('en')));

// Mutate parsed authored examples; no copied application implementation or schema.
const changed = change => { const values = structuredClone(resources('ko')); change(values); return values; };
test('negative: duplicate YAML keys are rejected', () => {
  const block = sources.ko.find(item => /^apiVersion:/m.test(item.code));
  assert.throws(() => parse({...block, code: block.code.replace(/^(apiVersion:.*)$/m, '$1\n$1')}), /duplicated mapping key/);
});
test('negative: ECS FireLens injection is rejected', () => {
  const values = changed(items => { podSpec(items.find(item => item.kind === 'Deployment')).containers[0].firelensConfiguration = {type: 'fluentbit'}; });
  assert.throws(() => validateContainers(values), /ECS-only container field/);
});
test('negative: wrong logging namespace or missing enabling label is rejected', () => {
  const values = changed(items => { one(items, 'ConfigMap', 'aws-logging').metadata.namespace = 'default'; });
  assert.throws(() => validateLogging(values), /Logging namespace/);
  const missingLabel = changed(items => { delete one(items, 'Namespace', 'aws-observability').metadata.labels['aws-observability']; });
  assert.throws(() => validateLogging(missingLabel), /Logging namespace label/);
});
test('negative: unmatched log tag is rejected', () => {
  const values = changed(items => {
    const data = one(items, 'ConfigMap', 'aws-logging').data;
    const before = data['output.conf'];
    data['output.conf'] = before.replace(/^(\s*match\s+)\S+/im, '$1unrelated.*');
    assert.notEqual(data['output.conf'], before, 'Log-tag mutation must change the authored configuration');
  });
  assert.throws(() => validateLogging(values), /built-in input tag/);
});
test('negative: router INPUT and malformed FluentConf indentation are rejected', t => {
  const values = changed(items => { one(items, 'ConfigMap', 'aws-logging').data['output.conf'] += '\n[INPUT]\n    Name tail\n'; });
  assert.throws(() => validateLogging(values), /no INPUT\/SERVICE/);
  // Reuse Averroes' two counterexamples against both authored configurations.
  for (const locale of ['ko', 'en']) {
    for (const variant of ['inconsistent-indent', 'no-indent']) {
      const bad = structuredClone(resources(locale));
      const data = one(bad, 'ConfigMap', 'aws-logging').data;
      const before = data['output.conf'];
      data['output.conf'] = variant === 'inconsistent-indent'
        ? before.replace(/^([ \t]+)(Match\b)/im, (_, space, key) => space.slice(0, -2) + key)
        : before.replace(/^[ \t]+/gm, '');
      assert.notEqual(data['output.conf'], before, `${locale}: ${variant} mutation must apply`);
      assert.throws(() => validateLogging(bad), /FluentConf.*indent/);
      t.diagnostic(`reviewer control rejected: ${locale}:${variant}`);
    }
  }
});
test('negative: mismatched selector and unattainable PDB capacity are rejected', () => {
  const values = changed(items => { items.find(item => item.kind === 'Deployment').spec.template.metadata.labels.app = 'mismatch'; });
  assert.throws(() => validatePlacement(values), /selector must match/);
  const unattainable = changed(items => {
    const largestReplicaCount = Math.max(...items.filter(item => item.kind === 'Deployment').map(item => item.spec.replicas));
    one(items, 'PodDisruptionBudget').spec.minAvailable = largestReplicaCount + 1;
  });
  assert.throws(() => validatePlacement(unattainable), /retain Ready capacity/);
});
test('negative: preStop exhausting the grace period is rejected', () => {
  const values = changed(items => {
    const spec = items.map(podSpec).find(item => item?.containers.some(container => container.lifecycle?.preStop));
    const container = spec.containers.find(item => item.lifecycle?.preStop);
    container.lifecycle.preStop.exec.command[2] = `sleep ${spec.terminationGracePeriodSeconds}`;
  });
  assert.throws(() => validateGrace(values), /leave positive time/);
});
test('negative: startup/liveness success thresholds and zero probe periods are rejected', t => {
  for (const locale of ['ko', 'en']) {
    const reviewed = probes(allYaml(locale));
    for (const kind of ['startupProbe', 'livenessProbe']) {
      const bad = structuredClone(reviewed.find(item => item.kind === kind).probe);
      bad.successThreshold = 2;
      assert.throws(() => validateProbe(bad, kind), /successThreshold must equal 1/);
      t.diagnostic(`reviewer control rejected: ${locale}:${kind}-success-threshold-two`);
    }
    for (const {kind, probe} of reviewed) {
      const bad = {...structuredClone(probe), periodSeconds: 0};
      assert.throws(() => validateProbe(bad, kind), /periodSeconds must be a positive integer/);
    }
    t.diagnostic(`reviewer control rejected: ${locale}:zero-probe-period`);
    const readiness = structuredClone(reviewed.find(item => item.kind === 'readinessProbe').probe);
    readiness.successThreshold = 2;
    assert.doesNotThrow(() => validateProbe(readiness, 'readinessProbe'), 'Readiness may require repeated successes');
  }
});
test('negative: simultaneous probe handlers are rejected', t => {
  for (const locale of ['ko', 'en']) {
    const original = probes(allYaml(locale)).find(item => item.kind === 'startupProbe' && item.probe.httpGet).probe;
    const bad = {...structuredClone(original), tcpSocket: {port: 8080}};
    assert.throws(() => validateProbe(bad, 'startupProbe'), /exactly one probe handler/);
    t.diagnostic(`reviewer control rejected: ${locale}:two-simultaneous-probe-handlers`);
  }
});
