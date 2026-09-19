'use strict';

// Supplemental PR104-01/02/04/08/10/11 authored-example contracts, reviewed 2026-09-19.
// No source evaluation, subprocesses, downloaded fixtures, schemas, network or cluster calls.
// Formula/table operands come from the actual Markdown. This is NOT admission,
// IPAM/NAU accounting, CPU isolation, add-on convergence or performance verification.
// Prose checks guard specific operator instructions; human review still checks their meaning.
// Primary references for the deliberately bounded contracts:
// https://aws.amazon.com/blogs/containers/amazon-eks-add-ons-advanced-configuration/
// https://docs.aws.amazon.com/eks/latest/userguide/updating-an-add-on.html
// https://raw.githubusercontent.com/aws/karpenter-provider-aws/v1.14.1/pkg/apis/crds/karpenter.k8s.aws_ec2nodeclasses.yaml
// https://github.com/aws/amazon-vpc-resource-controller-k8s/blob/93df905c6fb7bec57d90afd490e926b1ad04a57e/pkg/aws/vpc/limits.go
// https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/
// Copy to scripts/tests/document-examples; run from repository cwd.
// An explicit alternate document root is only for proposal/baseline review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');
const yaml = createRequire(path.join(process.cwd(), 'package.json'))('js-yaml');
const root = path.resolve(process.env.PR104_DOC_ROOT || process.cwd());
const prefixes = {ko: 'docs/', en: 'i18n/en/docusaurus-plugin-content-docs/current/'};
const suffixes = {
  ip: 'eks-best-practices/networking-performance/ip-capacity-planning-karpenter.md',
  cpu: 'eks-best-practices/resource-cost/cpu-sizing-comparability.md',
  networking: 'eks-best-practices/operations-reliability/eks-debugging/networking.md',
};
const titles = {
  ko: {pool: '### 인스턴스 크기에 따른 차이', warm: '### warm 타깃은 add-on configuration으로 관리',
    cpu: '### CPU Manager static 노드풀', isolation: '### Guaranteed 정수 CPU와 CPU Manager static'},
  en: {pool: '### Effect of instance size', warm: '### Managing warm targets through add-on configuration',
    cpu: '### A CPU Manager static node pool', isolation: '### Guaranteed integer CPU and CPU Manager static'},
};
const ok = (value, code) => assert.ok(value, code);
function one(values, code) { assert.equal(values.length, 1, code); return values[0]; }
const number = value => {
  ok(/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(value), 'NUMBER');
  return Number(value.replaceAll(',', ''));
};
const close = (actual, expected, code) => ok(Math.abs(actual - expected) <= 1e-10, code);

function scan(text) {
  const blocks = [], headings = [];
  let active;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (active) {
      if (marker && marker[1][0] === active.marker[0] &&
          marker[1].length >= active.marker.length && !marker[2].trim()) {
        blocks.push({...active, body: active.lines.join('\n')}); active = undefined;
      } else active.lines.push(line);
    } else if (marker) active = {
      marker: marker[1], language: marker[2].trim().split(/\s+/)[0], line: index, lines: [],
    };
    else if (/^#{1,6} /.test(line)) headings.push({title: line, line: index, depth: line.indexOf(' ')});
  });
  ok(!active, 'UNCLOSED_FENCE');
  return {blocks, headings, lines};
}
function section(text, title) {
  const parsed = scan(text);
  const start = one(parsed.headings.filter(h => h.title === title), 'SECTION_COUNT');
  const end = parsed.headings.find(h => h.line > start.line && h.depth <= start.depth)?.line ?? parsed.lines.length;
  return parsed.lines.slice(start.line + 1, end).join('\n');
}
function yamlValues(text) {
  return scan(text).blocks.filter(b => ['yaml', 'yml'].includes(b.language)).flatMap(b => {
    const values = yaml.loadAll(b.body);
    ok(values.length && values.every(v => v && typeof v === 'object' && !Array.isArray(v)), 'YAML_MAPPING');
    return values;
  });
}
const named = (text, kind, name) =>
  one(yamlValues(text).filter(v => v.kind === kind && v.metadata?.name === name), 'RESOURCE_COUNT');
function inlineFormula(text, lhs) {
  const match = one([...text.matchAll(/`([^`\n]+)`/g)]
    .map(m => m[1]).filter(value => value.startsWith(lhs + ' = ')), 'FORMULA_COUNT');
  return match.slice(match.indexOf('=') + 1).trim();
}

// Restricted arithmetic grammar. Unknown identifiers, trailing tokens and executable
// JavaScript are rejected; neither eval nor Function is used for authored expressions.
function calculate(expression, bindings = {}) {
  const source = expression.replaceAll('×', '*').replaceAll('−', '-').replace(/\s/g, '');
  const tokens = source.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|[()+*/,-]/g) || [];
  assert.equal(tokens.join(''), source, 'FORMULA_TOKEN');
  let at = 0;
  function atom() {
    const token = tokens[at++];
    if (token === '(') { const value = add(); assert.equal(tokens[at++], ')', 'FORMULA_PAREN'); return value; }
    if (/^\d+(?:\.\d+)?$/.test(token || '')) return Number(token);
    if (['max', 'ceil'].includes(token)) {
      assert.equal(tokens[at++], '(', 'FORMULA_CALL');
      const args = [add()];
      while (tokens[at] === ',') { at++; args.push(add()); }
      assert.equal(tokens[at++], ')', 'FORMULA_CALL');
      assert.equal(args.length, token === 'max' ? 2 : 1, 'FORMULA_ARITY');
      return token === 'max' ? Math.max(...args) : Math.ceil(args[0]);
    }
    ok(Object.hasOwn(bindings, token), 'FORMULA_IDENTIFIER');
    return bindings[token];
  }
  function product() {
    let value = atom();
    while (['*', '/'].includes(tokens[at])) {
      const op = tokens[at++], rhs = atom(); value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }
  function add() {
    let value = product();
    while (['+', '-'].includes(tokens[at])) {
      const op = tokens[at++], rhs = product(); value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  const value = add();
  assert.equal(at, tokens.length, 'FORMULA_TRAILING'); ok(Number.isFinite(value), 'FORMULA_FINITE');
  return value;
}
function addressContract(text) {
  const inventory = one(scan(text).blocks.filter(b => b.language === 'text')
    .flatMap(b => b.body.split('\n')).filter(line => /=\s*E\s*\+/.test(line)), 'INVENTORY_COUNT');
  const expression = inventory.slice(inventory.indexOf('=') + 1);
  for (const [inputs, expected] of [
    [{E: 4, A: 3, F: 2, B: 5}, 44], [{E: 1, A: 0, F: 0, B: 0}, 1],
    [{E: 0, A: 0, F: 0, B: 7}, 7],
  ]) close(calculate(expression, inputs), expected, 'INVENTORY_UNITS');
  const target = inlineFormula(text, 'T');
  for (const [inputs, expected] of [
    [{MINIMUM_IP_TARGET: 33, P: 20, WARM_IP_TARGET: 2}, 33],
    [{MINIMUM_IP_TARGET: 33, P: 33, WARM_IP_TARGET: 2}, 35],
  ]) close(calculate(target, inputs), expected, 'MINIMUM_FLOOR');
  const prefix = one([...text.matchAll(/`16 × F ≈ ([^`]+)`/g)], 'PREFIX_COUNT')[1];
  close(calculate(prefix, {T: 20}), 32, 'PREFIX_ROUNDING');
  close(calculate(prefix, {T: 32}), 32, 'PREFIX_ROUNDING');
}
function poolContract(text, locale) {
  const body = section(text, titles[locale].pool);
  const warm = number(one([...body.matchAll(/`WARM_IP_TARGET=(\d+)`/g)], 'WARM_VALUE')[1]);
  const rows = body.split('\n').filter(line => /^\|\s*\d+xlarge\s*\|/.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
  assert.equal(rows.length, 3, 'POOL_ROW_COUNT');
  assert.equal(new Set(rows.map(row => row[0])).size, 3, 'POOL_DUPLICATE_SIZE');
  const target = inlineFormula(text, 'T');
  const totals = [];
  for (const row of rows) {
    assert.equal(row.length, 5, 'POOL_COLUMN_COUNT');
    const [distribution, reportedPods] = row[1].split(/\s*=\s*/);
    ok(reportedPods, 'DISTRIBUTION_EQUALITY');
    const terms = distribution.split(/\s*\+\s*/).map(term => {
      const m = /^([\d,]+)\s*×\s*([\d,]+)$/.exec(term); ok(m, 'DISTRIBUTION_TERM');
      return [number(m[1]), number(m[2])];
    });
    const pods = terms.reduce((sum, [nodes, count]) => sum + nodes * count, 0);
    assert.equal(pods, number(reportedPods), 'POD_TOTAL');
    assert.equal(terms.reduce((sum, [nodes]) => sum + nodes, 0), number(row[2]), 'NODE_TOTAL');
    // The authored example states MINIMUM_IP_TARGET = each row's maximum Pod count.
    const minimum = Math.max(...terms.map(([, count]) => count));
    const allocated = terms.reduce((sum, [nodes, count]) => sum + nodes *
      calculate(target, {MINIMUM_IP_TARGET: minimum, P: count, WARM_IP_TARGET: warm}), 0);
    assert.equal(allocated, number(row[3]), 'POOL_TOTAL');
    assert.equal(allocated - pods, number(row[4]), 'UNUSED_TOTAL');
    totals.push(pods);
  }
  assert.equal(new Set(totals).size, 1, 'UNEQUAL_WORKLOADS');
  // The paragraph explicitly gives full-node count, full occupancy, last occupancy,
  // last pool floor and final total. Read these values instead of asserting 2133 alone.
  const packed = one(body.split(/\n\s*\n/).filter(p =>
    /last|마지막/.test(p) && /minimum|최소/.test(p) && !p.startsWith('|')), 'PACKED_EXAMPLE');
  const numbers = [...packed.matchAll(/\d+(?:,\d{3})*/g)].map(m => number(m[0]));
  assert.equal(numbers.length, 5, 'PACKED_OPERANDS');
  const [nodes, occupancy, last, lastPool, total] = numbers;
  assert.equal(nodes * occupancy + last, totals[0], 'PACKED_POD_TOTAL');
  assert.equal(calculate(target, {MINIMUM_IP_TARGET: occupancy, P: last, WARM_IP_TARGET: warm}), lastPool, 'PACKED_FLOOR');
  assert.equal(nodes * calculate(target, {MINIMUM_IP_TARGET: occupancy, P: occupancy, WARM_IP_TARGET: warm}) + lastPool, total, 'PACKED_TOTAL');
}
function hardwareContract(text) {
  const formula = one([...text.matchAll(/`(\d+)\s*×\s*\((\d+)\s*−\s*(\d+)\)\s*=\s*(\d+)`/g)], 'ENI_EQUATION');
  const [interfaces, perInterface, primary, reported] = formula.slice(1).map(number);
  // Pinned controller table values; not a post-trunk or kubelet maxPods assertion.
  assert.deepEqual([interfaces, perInterface, primary], [8, 30, 1], 'PINNED_ENI_INPUTS');
  assert.equal(interfaces * (perInterface - primary), reported, 'SECONDARY_SLOTS');
  ok(text.includes('54') && text.includes('234') && /충돌|conflict/.test(text), 'UPSTREAM_DISAGREEMENT_VISIBLE');
}
function shellWords(command) {
  const words = []; let word = '', quote = null, active = false;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) { if (c === quote) quote = null; else word += c; }
    else if (c === "'" || c === '"') { quote = c; active = true; }
    else if (/\s/.test(c)) { if (active) words.push(word); word = ''; active = false; }
    else { ok(!/[;|&<>`]/.test(c), 'COMMAND_OPERATOR'); word += c; active = true; }
  }
  ok(!quote, 'COMMAND_QUOTE'); if (active) words.push(word); return words;
}
function addonCommand(text, locale) {
  const body = section(text, titles[locale].warm);
  const command = one(scan(body).blocks.filter(b => ['bash', 'sh', 'shell'].includes(b.language))
    .flatMap(b => b.body.replace(/\\\r?\n\s*/g, ' ').split('\n'))
    .filter(line => /^\s*aws eks update-addon(?:\s|$)/.test(line)), 'ADDON_COMMAND_COUNT');
  const argv = shellWords(command);
  assert.deepEqual(argv.splice(0, 3), ['aws', 'eks', 'update-addon'], 'ADDON_COMMAND');
  const options = {};
  while (argv.length) {
    const token = argv.shift(), match = /^(--[\w-]+)(?:=(.+))?$/.exec(token);
    ok(match && !Object.hasOwn(options, match[1]), 'ADDON_DUPLICATE_OPTION');
    const value = match[2] ?? argv.shift(); ok(value && !value.startsWith('--'), 'ADDON_OPTION_VALUE');
    options[match[1]] = value;
  }
  assert.equal(options['--addon-name'], 'vpc-cni', 'ADDON_NAME');
  ok(options['--cluster-name'], 'ADDON_CLUSTER');
  assert.match(options['--configuration-values'] || '', /^file:\/\/[^{}\s]+\.json$/, 'FULL_CONFIG_FILE');
  assert.equal(options['--resolve-conflicts'], 'PRESERVE', 'CONFLICT_MODE');
  return options;
}
function addonGuidance(text, locale) {
  const body = section(text, titles[locale].warm);
  ok(/configurationValues/.test(body) && /schema/.test(body) &&
    /전체|완전|complete|full/i.test(body) && /병합|합치|merg|incorporat/i.test(body), 'CONFIG_MERGE_GUIDANCE');
  const paragraphs = body.split(/\n\s*\n/);
  ok(paragraphs.some(p => /PRESERVE/.test(p) && NO_CONVERGENCE.test(p)), 'PRESERVE_NOT_CONVERGENCE');
  ok(/describe-update/.test(body) && /Successful/.test(body) && /describe-addon/.test(body), 'UPDATE_RESULT_CHECK');
  ok(/aws-node/.test(body) && /DaemonSet/.test(body) &&
    EFFECTIVE_PODS.test(body) && /환경\s*변수|environment|\benv\b/i.test(body), 'EFFECTIVE_CONFIG_CHECK');
  ok(/백업|backup|saved.*config|retained.*config/i.test(body) &&
    STOP.test(body) && /복구|되돌|recover|roll\s*back|restor/i.test(body), 'RECOVERY_GUIDANCE');
}
// Natural equivalents are accepted. These checks enforce documented checkpoints,
// not the exact proposed paragraph, and cannot determine the truth of arbitrary prose.
const NO_CONVERGENCE = /보장하지|보장되지|증명하지|증거가\s*아니|충분하지|(?:does\s+not|doesn't|cannot|can't)\s+(?:guarantee|ensure|prove|establish)|(?:is\s+not|isn't)\s+(?:proof|evidence|sufficient)|insufficient/i;
const EFFECTIVE_PODS = /(?:실행\s*중|실제|running|live|actual|effective)[^.\n]{0,100}\bPods?\b|\bPods?\b[^.\n]{0,100}(?:실행\s*중|실제|running|live|actual|effective)/i;
const STOP = /중단|멈추|정지|\b(?:stop|halt|pause|abort)\b/i;
function cpuContract(text, locale) {
  const body = section(text, titles[locale].cpu);
  const node = named(body, 'EC2NodeClass', 'cpu-pinned');
  assert.equal(node.apiVersion, 'karpenter.k8s.aws/v1', 'NODECLASS_API');
  const kubelet = node.spec.kubelet;
  ok(!Object.hasOwn(kubelet, 'cpuManagerPolicy'), 'POLICY_IN_WRONG_SCHEMA');
  const cpu = value => {
    ok(/^\d+(?:\.\d+)?m?$/.test(value), 'CPU_QUANTITY');
    return value.endsWith('m') ? Number(value.slice(0, -1)) / 1000 : Number(value);
  };
  const reserved = cpu(String(kubelet.systemReserved?.cpu ?? '0')) +
    cpu(String(kubelet.kubeReserved?.cpu ?? '0'));
  ok(reserved > 0, 'NONZERO_RESERVATION');
  const config = one(yaml.loadAll(node.spec.userData), 'NODECONFIG_COUNT');
  assert.equal(config.apiVersion, 'node.eks.aws/v1alpha1', 'NODECONFIG_API');
  assert.equal(config.kind, 'NodeConfig', 'NODECONFIG_KIND');
  assert.equal(config.spec.kubelet.config.cpuManagerPolicy, 'static', 'CPU_STATIC_POLICY');
  const identities = ['role', 'instanceProfile'].filter(k => Object.hasOwn(node.spec, k));
  const incomplete = identities.length !== 1 || !node.spec.subnetSelectorTerms || !node.spec.securityGroupSelectorTerms;
  if (incomplete) {
    ok(/발췌|일부\s*설정|(?:configuration|manifest)\s+(?:fragment|excerpt)|partial\s+(?:configuration|manifest)/i.test(body), 'FRAGMENT_DISCLOSURE');
    for (const term of ['role', 'instanceProfile', 'subnet', 'security']) ok(body.includes(term), 'FRAGMENT_REQUIREMENTS');
  }
  const isolation = section(text, titles[locale].isolation);
  ok(/논리|logical/.test(isolation) && isolation.includes('full-pcpus-only') &&
    isolation.includes('SMT'), 'LOGICAL_VS_PHYSICAL');
  return node;
}
function quotaContract(text) {
  const quota = named(text, 'ResourceQuota', 'production-quota');
  assert.equal(quota.apiVersion, 'v1', 'QUOTA_API');
  ok(!Object.hasOwn(quota.spec.hard, 'limits.cpu'), 'CPU_LIMIT_OPTIONAL');
  const gi = value => { assert.match(value, /^\d+Gi$/, 'MEMORY_UNIT'); return Number(value.slice(0, -2)); };
  const requestCap = gi(quota.spec.hard['requests.memory']), limitCap = gi(quota.spec.hard['limits.memory']);
  ok(requestCap > 0 && requestCap === limitCap, 'AUTHORED_EQUAL_CAPS');
  // This demonstrates only that the two numeric inequalities do not imply equality.
  // It is not an admission simulation: LimitRange/policies/other usage are not run.
  const request = requestCap / 4, limit = limitCap / 2;
  ok(request <= requestCap && limit <= limitCap && request !== limit, 'QUOTA_COUNTEREXAMPLE');
}
function costContract(text) {
  const expression = inlineFormula(text, 'cost-per-1K-req');
  for (const [H, R] of [[3.6, 100], [7.2, 250], [0, 7]])
    close(calculate(expression, {H, R}), H / (R * 3600) * 1000, 'COST_UNITS');
  const paragraph = one(text.split(/\n\s*\n/).filter(p => p.includes('`cost-per-1K-req =')), 'COST_PARAGRAPH');
  const money = [...paragraph.matchAll(/\$(\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
  assert.equal(money.length, 2, 'COST_EXAMPLE_MONEY');
  const rps = number(one([...paragraph.matchAll(/(\d+(?:,\d{3})*) RPS/g)], 'COST_EXAMPLE_RPS')[1]);
  close(calculate(expression, {H: money[0], R: rps}), money[1], 'COST_EXAMPLE_RESULT');
}
function semanticYaml(text) {
  return yamlValues(text).map(value => {
    if (value.kind === 'EC2NodeClass' && typeof value.spec?.userData === 'string')
      value.spec.userData = yaml.load(value.spec.userData);
    return value;
  });
}
const docs = Object.fromEntries(Object.entries(prefixes).map(([locale, prefix]) => [locale,
  Object.fromEntries(Object.entries(suffixes).map(([kind, suffix]) =>
    [kind, fs.readFileSync(path.join(root, prefix + suffix), 'utf8')]))]));
for (const locale of Object.keys(prefixes)) {
  for (const [name, kind, validator] of [
    ['IPv4 inventory, minimum floor and prefix rounding', 'ip', addressContract],
    ['actual table and packed-placement arithmetic', 'ip', poolContract],
    ['raw ENI slots retain visible source disagreement', 'ip', hardwareContract],
    ['complete configuration file and explicit conflict mode', 'ip', addonCommand],
    ['effective configuration verification and recovery instructions', 'ip', addonGuidance],
    ['CPU Manager schema, reservation and fragment scope', 'cpu', cpuContract],
    ['authored quota and independent aggregate caps', 'cpu', quotaContract],
    ['cost equation and displayed numerical example', 'cpu', costContract],
  ]) test(`PR104 ${locale}: ${name}`, () => validator(docs[locale][kind], locale));
  test(`PR104 ${locale}: troubleshooting warning retains full configuration and runbook link`, () => {
    const warning = one([...docs[locale].networking.matchAll(/:::caution[^\n]*\n([\s\S]*?)\n:::/g)]
      .map(m => m[1]).filter(p => p.includes('configurationValues')), 'WARNING_COUNT');
    ok(/PRESERVE/.test(warning) && /전체|complete/.test(warning), 'WARNING_CONFIG_SCOPE');
    ok(warning.includes('../../networking-performance/ip-capacity-planning-karpenter.md'), 'WARNING_RUNBOOK_LINK');
  });
}
for (const kind of ['ip', 'cpu']) test(`PR104: ${kind} KO/EN YAML semantics`, () =>
  assert.deepEqual(semanticYaml(docs.ko[kind]), semanticYaml(docs.en[kind])));
test('PR104: KO/EN add-on command options', () =>
  assert.deepEqual(addonCommand(docs.ko.ip, 'ko'), addonCommand(docs.en.ip, 'en')));

function replacement(text, before, after) {
  assert.equal(text.split(before).length - 1, 1, 'MUTATION_TARGET_COUNT');
  return text.replace(before, after);
}
function negative(name, kind, validator, mutate, code) {
  test(`Negative control: ${name}`, () => {
    const original = docs.en[kind]; validator(original, 'en'); // no vacuous pass on an invalid baseline
    const changed = mutate(original); assert.notEqual(changed, original, 'MUTATION_DID_NOT_CHANGE');
    assert.throws(() => validator(changed, 'en'), error =>
      error instanceof assert.AssertionError && (!code || error.message.includes(code)));
  });
}
for (const [name, before, after, code] of [
  ['2013 Pods mislabeled as 2000', '48 × 33 + 13 × 32 = 2,000', '61 × 33 = 2,000', 'POD_TOTAL'],
  ['wrong pool total', '| 61 | 2,122 | 122 |', '| 61 | 2,133 | 122 |', 'POOL_TOTAL'],
  ['wrong unused total', '| 61 | 2,122 | 122 |', '| 61 | 2,122 | 133 |', 'UNUSED_TOTAL'],
  ['wrong packed-placement total', '2,133 Pod-pool IPs', '2,122 Pod-pool IPs', 'PACKED_TOTAL'],
]) negative(name, 'ip', poolContract, s => replacement(s, before, after), code);
negative('missing primary-address contribution', 'ip', addressContract,
  s => replacement(s, '= E + A + 16 × F + B', '= E + A + 16 × F + B - E'), 'INVENTORY_UNITS');
negative('minimum floor removed', 'ip', addressContract,
  s => replacement(s, 'T = max(MINIMUM_IP_TARGET, P + WARM_IP_TARGET)', 'T = P + WARM_IP_TARGET'), 'MINIMUM_FLOOR');
negative('prefix rounded down', 'ip', addressContract,
  s => replacement(s, '16 × ceil(T / 16)', '16 × (T / 16)'), 'PREFIX_ROUNDING');
negative('234 substituted for raw secondary slots', 'ip', hardwareContract,
  s => replacement(s, '8 × (30 − 1) = 232', '8 × (30 − 1) = 234'), 'SECONDARY_SLOTS');
negative('hour/second conversion removed', 'cpu', costContract,
  s => replacement(s, 'H × 1000 / (3600 × R)', 'H / R'), 'COST_UNITS');
negative('cost denominator parentheses dropped', 'cpu', costContract,
  s => replacement(s, 'H × 1000 / (3600 × R)', 'H × 1000 / 3600 × R'), 'COST_UNITS');
negative('inline partial add-on configuration', 'ip', addonCommand,
  s => replacement(s, 'file://reviewed-vpc-cni-config.json', '\'{"env":{"WARM_IP_TARGET":"2"}}\''), 'FULL_CONFIG_FILE');
negative('OVERWRITE substituted without operator review', 'ip', addonCommand,
  s => replacement(s, '--resolve-conflicts PRESERVE', '--resolve-conflicts OVERWRITE'), 'CONFLICT_MODE');
negative('duplicate configuration flag', 'ip', addonCommand,
  s => replacement(s, '--resolve-conflicts PRESERVE',
    '--configuration-values file://other.json --resolve-conflicts PRESERVE'), 'ADDON_DUPLICATE_OPTION');
negative('PRESERVE described as sufficient', 'ip', addonGuidance,
  s => s.split(/\n\s*\n/).map(p => /PRESERVE/.test(p) && NO_CONVERGENCE.test(p) ?
    'PRESERVE alone guarantees that the intended values took effect.' : p).join('\n\n'), 'PRESERVE_NOT_CONVERGENCE');
negative('effective running-Pod verification omitted', 'ip', addonGuidance,
  s => s.split(/\n\s*\n/).map(p => EFFECTIVE_PODS.test(p) ?
    p.replace(/\bPods?\b/g, 'desired template') : p).join('\n\n'), 'EFFECTIVE_CONFIG_CHECK');
negative('recovery paragraph omitted', 'ip', addonGuidance,
  s => s.replace(/\b(?:stop|halt|pause|abort)\b/gi, 'continue'), 'RECOVERY_GUIDANCE');
negative('CPU policy placed directly in EC2NodeClass kubelet', 'cpu', cpuContract,
  s => replacement(s, '  kubelet:\n    systemReserved:', '  kubelet:\n    cpuManagerPolicy: static\n    systemReserved:'), 'POLICY_IN_WRONG_SCHEMA');
negative('both CPU reservations zero', 'cpu', cpuContract,
  s => s.replace(/cpu: "1"/g, 'cpu: "0"'), 'NONZERO_RESERVATION');
negative('wrong embedded NodeConfig API', 'cpu', cpuContract,
  s => replacement(s, 'apiVersion: node.eks.aws/v1alpha1', 'apiVersion: karpenter.k8s.aws/v1'), 'NODECONFIG_API');
negative('incomplete manifest no longer disclosed', 'cpu', cpuContract,
  s => s.replace(/(?:configuration|manifest)\s+(?:fragment|excerpt)|partial\s+(?:configuration|manifest)/gi,
    'standalone manifest'), 'FRAGMENT_DISCLOSURE');
negative('CPU limit quota introduced', 'cpu', quotaContract,
  s => replacement(s, '    requests.cpu: "200"', '    limits.cpu: "200"\n    requests.cpu: "200"'), 'CPU_LIMIT_OPTIONAL');
test('Restricted formula parser rejects executable/trailing input', () => {
  for (const expression of ['process.exit(0)', 'H;1', 'H R', 'max(1)', '1/0'])
    assert.throws(() => calculate(expression, {H: 1, R: 1}));
});
test('P1 checkpoints accept natural equivalents in both languages', () => {
  addonGuidance(`${titles.en.warm}

Merge configurationValues using the version schema and retain the full configuration.
PRESERVE isn't proof of convergence. Check describe-update Successful, describe-addon,
the aws-node DaemonSet env and the actual Pod environment.

Retain a backup; pause the rollout on a mismatch and restore the saved configuration.`, 'en');
  addonGuidance(`${titles.ko.warm}

configurationValues 전체를 schema에 맞춰 합치고 PRESERVE만으로 적용을 보장하지 않습니다.
describe-update Successful과 describe-addon, aws-node DaemonSet 환경 변수 및 실제 Pod 값을 확인합니다.

백업을 저장하고 불일치하면 rollout을 중단한 뒤 복구합니다.`, 'ko');
});
test('Extraction rejects missing/duplicate headings and unclosed fences', () => {
  const original = docs.en.ip, title = titles.en.warm;
  addonCommand(original, 'en');
  for (const changed of [replacement(original, title, '### Different heading'),
    original + '\n' + title + '\n', original + '\n```yaml\nspec: {}\n'])
    assert.throws(() => addonCommand(changed, 'en'));
});
