'use strict';

// ADS-GPUOPS-001: the KEDA Prometheus triggers for vLLM on two model-serving pages (KO/EN).
// Reads current repository sources. No network, cluster, Prometheus or writes.
// Selected-field contract only: NOT KEDA admission, PromQL evaluation or HPA behavior.
// Pinned sources, read 2026-10-14:
// - KEDA v2.18 Prometheus scaler: serverAddress and query are required; a query must return a
//   single element. https://keda.sh/docs/2.18/scalers/prometheus/
// - KEDA v2.18 ScaledObject: metricType is AverageValue unless set; fallback applies to Value and
//   AverageValue triggers. https://keda.sh/docs/2.18/reference/scaledobject-spec/
// - KEDA v2.18.0 pkg/scalers/prometheus_scaler.go: more than one result element is an error; an
//   empty result is read as 0 unless ignoreNullValues is false.
// - vLLM v0.23.0 vllm/v1/metrics/loggers.py: labelnames ["model_name", "engine"];
//   vllm:kv_cache_usage_perc ("1 means 100 percent usage"), vllm:num_requests_waiting and the
//   vllm:time_to_first_token_seconds histogram.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {test} = require('node:test');

const PAGES = {
  'agentic-ai-platform/model-serving/inference-optimization/gpu-autoscaling-operations.md':
    {ko: '### KEDA 스케일링 구성', en: '### KEDA Scaling Configuration'},
  'agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management.md':
    {ko: '### LLM 서빙 메트릭 기반 ScaledObject', en: '### LLM Serving Metrics-Based ScaledObject'},
};
const PREFIXES = {ko: 'i18n/ko/docusaurus-plugin-content-docs/current/', en: 'docs/'};
// Bounded extraction of the pinned vLLM exporter: only the series these examples query.
const VLLM_SERIES = new Set(['kv_cache_usage_perc', 'num_requests_waiting',
  'time_to_first_token_seconds_bucket']);
const SINGLE_AGGREGATE = /^(avg|sum|max|min)\s*\(/;
const HISTOGRAM = /^histogram_quantile\(\s*0?\.\d+\s*,\s*sum by \(le\)\s*\(\s*rate\(/;

function findRoot() {
  const probe = path.join('docs', Object.keys(PAGES)[0]);
  for (const start of [__dirname, process.cwd()]) {
    let candidate = path.resolve(start);
    for (;;) {
      if (fs.existsSync(path.join(candidate, 'package.json')) &&
          fs.existsSync(path.join(candidate, probe))) return candidate;
      const parent = path.dirname(candidate);
      if (parent === candidate) break;
      candidate = parent;
    }
  }
  throw new Error('Cannot locate repository; run from its cwd or install this test under scripts/tests/document-examples');
}
const root = findRoot();
const yaml = createRequire(path.join(root, 'package.json'))('js-yaml');

function scaledObject(relative, heading) {
  const lines = fs.readFileSync(path.join(root, relative), 'utf8').split('\n');
  const start = lines.indexOf(heading);
  assert.ok(start >= 0, `Missing section ${heading} in ${relative}`);
  const level = heading.match(/^#+/)[0].length;
  const blocks = [];
  let fence = null;
  for (const line of lines.slice(start + 1)) {
    if (!fence && new RegExp(`^#{1,${level}} `).test(line)) break;
    if (!fence && line.startsWith('```yaml')) fence = [];
    else if (fence && line.startsWith('```')) { blocks.push(fence.join('\n')); fence = null; }
    else if (fence) fence.push(line);
  }
  const objects = blocks.map(block => yaml.load(block)).filter(doc => doc?.kind === 'ScaledObject');
  assert.equal(objects.length, 1, `Expected one ScaledObject under ${heading} in ${relative}`);
  return objects[0];
}

function checkTrigger(trigger, where) {
  assert.equal(trigger.type, 'prometheus', where);
  assert.ok(['Value', 'AverageValue'].includes(trigger.metricType), `${where}: metricType must be explicit`);
  const {serverAddress, query, threshold, ignoreNullValues} = trigger.metadata ?? {};
  assert.match(serverAddress ?? '', /^https?:\/\/\S+$/, `${where}: serverAddress is required`);
  assert.equal(ignoreNullValues, 'false', `${where}: an empty result must not read as 0`);
  const target = Number(threshold);
  assert.ok(Number.isFinite(target) && target > 0, `${where}: threshold must be a positive number`);
  const promql = query.trim();
  assert.doesNotMatch(promql, /\bvllm_[a-z]/, `${where}: vLLM series use the vllm: prefix`);
  const series = [...promql.matchAll(/vllm:([a-z_]+)/g)].map(m => m[1]);
  assert.ok(series.length > 0 && series.every(name => VLLM_SERIES.has(name)), `${where}: unknown series ${series}`);
  for (const [, matchers] of promql.matchAll(/\{([^}]*)\}/g)) {
    const keys = matchers.split(',').map(m => m.split(/[=!~]/)[0].trim());
    assert.ok(keys.includes('model_name') && keys.includes('namespace'), `${where}: scope by model_name and namespace`);
    assert.ok(!keys.includes('model'), `${where}: vLLM exports model_name, not model`);
  }
  if (series[0] === 'time_to_first_token_seconds_bucket') {
    assert.match(promql, HISTOGRAM, `${where}: aggregate buckets by le before histogram_quantile`);
    assert.equal(promql.match(/\bby\s*\(/g).length, 1, `${where}: only the le grouping may remain`);
  } else {
    assert.match(promql, SINGLE_AGGREGATE, `${where}: the query must reduce to one series`);
    assert.doesNotMatch(promql, /\b(by|without)\s*\(/, `${where}: grouping would return several series`);
  }
  return {series: series[0], metricType: trigger.metricType, target};
}

for (const [page, headings] of Object.entries(PAGES)) {
  test(`${page}: KEDA triggers follow the KEDA v2.18 and vLLM v0.23.0 contracts`, () => {
    const parsed = {};
    for (const locale of ['ko', 'en']) {
      const object = scaledObject(PREFIXES[locale] + page, headings[locale]);
      const {spec} = object;
      assert.equal(object.apiVersion, 'keda.sh/v1alpha1');
      const {failureThreshold, replicas} = spec.fallback ?? {};
      assert.ok(Number.isInteger(failureThreshold) && failureThreshold > 0, `${locale}: fallback.failureThreshold`);
      assert.ok(replicas >= spec.minReplicaCount && replicas <= spec.maxReplicaCount, `${locale}: fallback.replicas`);
      const triggers = spec.triggers.map((trigger, i) => checkTrigger(trigger, `${locale} trigger ${i + 1}`));
      const bySeries = Object.fromEntries(triggers.map(t => [t.series, t]));
      assert.deepEqual(Object.keys(bySeries).sort(), [...VLLM_SERIES].sort());
      // A 0-1 ratio and a latency are compared as workload values; a queue total is split per replica.
      assert.equal(bySeries.kv_cache_usage_perc.metricType, 'Value');
      assert.ok(bySeries.kv_cache_usage_perc.target <= 1, `${locale}: KV cache usage is a 0-1 ratio`);
      assert.equal(bySeries.time_to_first_token_seconds_bucket.metricType, 'Value');
      assert.equal(bySeries.num_requests_waiting.metricType, 'AverageValue');
      parsed[locale] = object;
    }
    assert.deepEqual(parsed.ko, parsed.en, 'Korean and English examples must be the same manifest');
  });
}
