// k6 2.2.0. No remote imports, redirects, retries, setup requests or sleeps.
import http from 'k6/http';
import {check} from 'k6';
import exec from 'k6/execution';
import crypto from 'k6/crypto';
import {Rate, Trend} from 'k6/metrics';

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

requireValue(__ENV.BENCHMARK_CONFIG, 'BENCHMARK_CONFIG must point to an explicit run JSON file');
requireValue(__ENV.BENCHMARK_OUTPUT && __ENV.BENCHMARK_OUTPUT !== __ENV.BENCHMARK_CONFIG,
  'BENCHMARK_OUTPUT must name a distinct raw output file');
const configText = open(__ENV.BENCHMARK_CONFIG);
const configSha = crypto.sha256(configText, 'hex');
const config = JSON.parse(configText);
const p = config.provenance || {};
const c = config.load || {};
const e = c.expected || {};
requireValue(config.schema_version === 1, 'unsupported configuration schema');
for (const name of ['run_id', 'target', 'implementation', 'implementation_version', 'evidence_scope',
  'environment_id', 'environment_notes', 'generator_version', 'source_revision', 'sut_config_sha256']) {
  requireValue(typeof p[name] === 'string' && p[name].trim() && !/REPLACE|UNMEASURED|TODO|<[^>]+>/i.test(p[name]),
    `missing/placeholder provenance: ${name}`);
}
requireValue(['local-fixture', 'implementation-measurement'].includes(p.evidence_scope), 'unknown/unmeasured scope');
requireValue(/^https?:\/\/(?:\[[0-9a-fA-F:]+\]|[A-Za-z0-9._-]+)(?::[0-9]+)?\/?$/.test(p.target),
  'target must be an HTTP(S) origin without credentials, path, query or fragment');
const targetPort = p.target.match(/:(\d+)\/?$/);
requireValue(!targetPort || (Number(targetPort[1]) >= 1 && Number(targetPort[1]) <= 65535), 'target port must be in [1, 65535]');
requireValue(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(p.source_revision), 'source_revision must be a Git hash');
requireValue(/^[0-9a-f]{64}$/.test(p.sut_config_sha256), 'sut_config_sha256 must be SHA-256');
requireValue(/\bk6 v?2\.2\.0\b/.test(p.generator_version), 'this kit is pinned to k6 2.2.0; record k6 version output');
const local = p.evidence_scope === 'local-fixture';
for (const [key, low, high] of [
  ['rate', 1, local ? 20 : 10000], ['duration_seconds', 1, local ? 30 : 3600],
  ['preallocated_vus', 1, local ? 4 : 1000], ['max_vus', 1, local ? 4 : 1000],
  ['timeout_ms', 1, local ? 2000 : 60000], ['grace_seconds', 1, local ? 5 : 120],
]) {
  requireValue(Number.isInteger(c[key]) && c[key] >= low && c[key] <= high, `${key} must be an integer in [${low}, ${high}]`);
}
requireValue(c.preallocated_vus <= c.max_vus, 'preallocated_vus exceeds max_vus');
requireValue(c.timeout_ms <= c.grace_seconds * 1000, 'timeout must fit within graceful stop');
requireValue(typeof c.path === 'string' && c.path.startsWith('/') && !c.path.startsWith('//') &&
  !/[\x00-\x20\x7f#]/.test(c.path), 'path must be encoded, origin-relative and fragment-free');
requireValue(c.headers && typeof c.headers === 'object' && !Array.isArray(c.headers), 'headers must be an object');
const headerNames = new Set();
for (const [key, value] of Object.entries(c.headers)) {
  requireValue(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(key) && !headerNames.has(key.toLowerCase()), 'invalid/duplicate header');
  headerNames.add(key.toLowerCase());
  requireValue(typeof value === 'string' && !/[\r\n\x00]/.test(value), 'invalid header value');
  requireValue(!['content-length', 'transfer-encoding'].includes(key.toLowerCase()), 'GET framing headers are unsupported');
}
requireValue(Number.isInteger(e.status) && e.status >= 200 && e.status <= 599 && ![204, 205, 304].includes(e.status),
  'expected status must permit a body');
requireValue(typeof e.body_contains === 'string' && e.body_contains, 'expected body substring must be nonempty');
requireValue(Array.isArray(e.backend_ids) && e.backend_ids.length &&
  e.backend_ids.every(id => typeof id === 'string' && id) && new Set(e.backend_ids).size === e.backend_ids.length,
'expected backend IDs must be distinct nonempty strings');
requireValue(['HTTP/1.1', 'HTTP/2.0'].includes(e.protocol), 'expected protocol must be explicit');
requireValue(!(p.target.startsWith('http://') && e.protocol === 'HTTP/2.0'), 'k6 h2 requires HTTPS; no h2c');

const statusOK = new Rate('bench_status_ok');
const bodyOK = new Rate('bench_body_ok');
const backendOK = new Rate('bench_backend_ok');
const protocolOK = new Rate('bench_protocol_ok');
const starts = new Trend('bench_start_ms', true);
const scenarioEpoch = new Trend('bench_scenario_unix_ms', true);
const finishes = new Trend('bench_finish_unix_ms', true);
const trendStats = ['min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max', 'avg', 'count'];
const sourceSha = crypto.sha256(['fixture.py', 'probe.py', 'load.js', 'results.py']
  .map(name => `${name}\0${open(`./${name}`)}\0`).join(''), 'hex');

function deepFreeze(value) {
  for (const item of Object.values(value)) {
    if (item && typeof item === 'object') deepFreeze(item);
  }
  return Object.freeze(value);
}

// k6 can rewrite the exported options object. Keep the comparison contract
// private and immutable, with no nested references shared with that export.
const expectedOptions = deepFreeze({
  scenarios: {
    benchmark: {
      executor: 'constant-arrival-rate', rate: c.rate, timeUnit: '1s',
      duration: `${c.duration_seconds}s`, preAllocatedVUs: c.preallocated_vus, maxVUs: c.max_vus,
      gracefulStop: `${c.grace_seconds}s`,
    },
  },
  maxRedirects: 0,
  insecureSkipTLSVerify: false,
  noConnectionReuse: false,
  noVUConnectionReuse: false,
  discardResponseBodies: false,
  summaryTimeUnit: 'ms',
  summaryTrendStats: trendStats,
  thresholds: {
    http_reqs: ['count>0'], dropped_iterations: ['count==0'], http_req_failed: ['rate==0'],
    checks: ['rate==1'], bench_status_ok: ['rate==1'], bench_body_ok: ['rate==1'],
    bench_backend_ok: ['rate==1'], bench_protocol_ok: ['rate==1'],
  },
  tags: {run_id: p.run_id, implementation: p.implementation, evidence_scope: p.evidence_scope},
});
export const options = JSON.parse(JSON.stringify(expectedOptions));
http.setResponseCallback(http.expectedStatuses(e.status));

function durationMs(value) {
  // Consolidated k6 options serialize durations using Go's duration strings.
  let total = 0;
  const tokens = String(value).match(/[0-9]+(?:\.[0-9]+)?(?:ms|s|m|h)/g);
  requireValue(tokens && tokens.join('') === String(value), `unsupported duration option: ${value}`);
  for (const token of tokens) {
    const [, amount, unit] = token.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m|h)$/);
    total += Number(amount) * {ms: 1, s: 1000, m: 60000, h: 3600000}[unit];
  }
  return total;
}

function validateEffectiveOptions(actual) {
  requireValue(Object.keys(actual.scenarios).join(',') === 'benchmark', 'scenario override is forbidden');
  const a = actual.scenarios.benchmark;
  const planned = expectedOptions.scenarios.benchmark;
  for (const key of ['executor', 'rate', 'preAllocatedVUs', 'maxVUs']) {
    requireValue(a[key] === planned[key], `effective ${key} differs from recorded configuration`);
  }
  for (const key of ['duration', 'timeUnit', 'gracefulStop']) {
    requireValue(durationMs(a[key]) === durationMs(planned[key]), `effective ${key} differs from configuration`);
  }
  requireValue(!a.startTime || durationMs(a.startTime) === 0, 'delayed scenario start is unsupported');
  for (const key of ['maxRedirects', 'insecureSkipTLSVerify', 'noConnectionReuse', 'noVUConnectionReuse', 'discardResponseBodies']) {
    requireValue(actual[key] === expectedOptions[key], `effective ${key} override is forbidden`);
  }
  requireValue(actual.summaryTimeUnit === 'ms' && JSON.stringify(actual.summaryTrendStats) === JSON.stringify(trendStats),
    'summary unit/statistics override is forbidden');
  requireValue(!actual.executionSegment || actual.executionSegment === '0:1', 'distributed execution is unsupported');
  for (const [name, expressions] of Object.entries(expectedOptions.thresholds)) {
    const actualExpressions = (actual.thresholds[name] || []).map(item => typeof item === 'string' ? item : item.threshold);
    requireValue(JSON.stringify(actualExpressions) === JSON.stringify(expressions), `threshold override: ${name}`);
  }
  return actual;
}

export function setup() {
  return {
    validated_config_sha256: configSha,
    effective_options: validateEffectiveOptions(exec.test.options),
  };
}

let iterationOptionsChecked = false;

export default function (setupData) {
  // --no-setup must fail before metrics or network calls, even with a shortcut
  // that replaces the declared arrival-rate scenario or increases its VUs.
  if (!setupData || setupData.validated_config_sha256 !== configSha) {
    exec.test.abort('validated setup data is required; --no-setup is unsupported');
    return;
  }
  if (!iterationOptionsChecked) {
    validateEffectiveOptions(exec.test.options);
    iterationOptionsChecked = true;
  }
  starts.add(Date.now() - exec.scenario.startTime);
  scenarioEpoch.add(exec.scenario.startTime);
  const response = http.get(`${p.target.replace(/\/$/, '')}${c.path}`, {
    headers: c.headers, timeout: `${c.timeout_ms}ms`, redirects: 0,
    tags: {name: 'benchmark-contract'},
  });
  let backend;
  try { backend = response.json('backend_id'); } catch (_) { backend = undefined; }
  const assertions = {
    expected_status: response.status === e.status,
    expected_body: typeof response.body === 'string' && response.body.includes(e.body_contains),
    expected_backend: e.backend_ids.includes(backend),
    expected_protocol: response.proto === e.protocol,
  };
  statusOK.add(assertions.expected_status);
  bodyOK.add(assertions.expected_body);
  backendOK.add(assertions.expected_backend);
  protocolOK.add(assertions.expected_protocol);
  check(response, Object.fromEntries(Object.entries(assertions).map(([name, passed]) => [name, () => passed])));
  finishes.add(Date.now());
}

export function handleSummary(data) {
  requireValue(data.metrics && data.state && data.options,
    'unsupported summary format: use --new-machine-readable-summary=false --summary-mode=full with k6 2.2.0');
  const record = {
    schema_version: 1, kind: 'gateway-api-k6', summary_format: 'k6-2.2-legacy',
    config_text: configText, config_sha256: configSha,
    harness_sha256: sourceSha, generator: p.generator_version,
    finished_at: new Date().toISOString(), gateway_api_conformance: false,
    units: {latency: 'ms', time: 'ms', rate: 'requests/s'},
    raw: data,
  };
  return {
    [__ENV.BENCHMARK_OUTPUT]: JSON.stringify(record, null, 2),
    stdout: `Raw run: ${__ENV.BENCHMARK_OUTPUT}; scope=${p.evidence_scope}; validate with results.py. No ranking.\n`,
  };
}
