const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const matter = require('gray-matter');
const {stripMdx} = require('../generate-llm-wiki');
const {staticRenderer} = require('../llm-wiki-components');
const {readingTime} = require('../doc-metadata');

const root = path.resolve(__dirname, '../..');
const datasetPath = path.join(root, 'src/data/ralph-loop-bedrock.json');
const datasetBytes = fs.readFileSync(datasetPath);
const data = JSON.parse(datasetBytes);
const directories = {
  en: 'docs/benchmarks',
  ko: 'i18n/ko/docusaurus-plugin-content-docs/current/benchmarks',
};
const articles = [
  'ralph-loop-coding-agent-bedrock.md',
  'ralph-loop-series.md',
  'ralph-loop-coding-agent-eks.md',
  'ralph-loop-inference-optimization.md',
];
const source = (locale, article) => fs.readFileSync(path.join(root, directories[locale], article), 'utf8');

function exportArticle(locale, article) {
  const previous = staticRenderer.locale;
  const omitted = new Set();
  try {
    staticRenderer.locale = locale;
    const output = stripMdx(matter(source(locale, article)).content, {
      filePath: path.join(root, directories[locale], article), omitted,
    });
    assert.deepEqual([...omitted], [], `${locale}/${article}: omitted content`);
    return output;
  } finally {
    staticRenderer.locale = previous;
  }
}

function exportedTable(text, anchor, headers) {
  const position = text.indexOf(`{#${anchor}}`);
  assert.notEqual(position, -1, `Missing ${anchor} section`);
  const lines = text.slice(position).split('\n');
  const start = lines.findIndex(line => line.startsWith('|'));
  assert.notEqual(start, -1, `Missing ${anchor} table`);
  const block = [];
  for (const line of lines.slice(start)) {
    if (!line.startsWith('|')) break;
    block.push(line);
  }
  const cells = block.map(line => {
    assert.ok(line.endsWith('|'), `${anchor}: complete table row`);
    return line.slice(1, -1).split(/(?<!\\)\|/).map(cell => cell.trim());
  });
  assert.deepEqual(cells[0], headers, `${anchor}: column headers`);
  assert.equal(cells[1]?.length, headers.length, `${anchor}: separator width`);
  assert.ok(cells[1].every(cell => /^:?-{3,}:?$/.test(cell)), `${anchor}: GFM separator`);
  const rows = cells.slice(2);
  for (const row of rows) assert.equal(row.length, headers.length, `${anchor}: row width`);
  assert.equal(new Set(rows.map(row => row[0])).size, rows.length, `${anchor}: unique model rows`);
  return rows;
}

test('table assertions reject flattened and escaped pipe-table text', () => {
  const headers = ['Model', 'Cost'];
  const correct = '{#probe}\n\n| Model | Cost |\n| --- | --- |\n| GPT-6 Astra | $3.4954 |\n';
  assert.deepEqual(exportedTable(correct, 'probe', headers), [['GPT-6 Astra', '$3.4954']]);
  assert.throws(() => exportedTable(correct.replaceAll('\n', ' '), 'probe', headers));
  assert.throws(() => exportedTable(correct.replaceAll('|', '\\|'), 'probe', headers));
});

test('the original 14-model, 70-attempt dataset remains byte-identical', () => {
  // Frozen from main a5bc624 before the additive series/page changes.
  assert.equal(createHash('sha256').update(datasetBytes).digest('hex'),
    '30f1a53b205fbcd388ab20094c2bebea1d871900b9345f60c1919a0ef56b3da4');
  assert.equal(data.models.length, 14);
  assert.equal(data.runs.length, 70);
  assert.equal(data.runs.filter(run => run.status === 'done').length, 69);
});

test('Astra interpretation reproduces from its five historical attempts', () => {
  const runs = data.runs.filter(run => run.model === 'gpt6astra');
  assert.equal(runs.length, 5);
  assert.ok(runs.every(run => run.status === 'done' && run.iterations === 1));
  const median = key => runs.map(run => run[key]).sort((a, b) => a - b)[2];
  assert.equal(median('cost_usd'), 3.4954);
  assert.equal(median('run_minutes'), 7.883);
  for (const locale of Object.keys(directories)) {
    const text = exportArticle(locale, articles[0]);
    assert.ok(text.includes('us.openai.gpt-6-astra'));
    assert.ok(text.includes('3.4954'));
    assert.ok(text.includes('7.883'));
  }
});

test('both locale exports associate every model with its evidence coverage cells', () => {
  for (const locale of Object.keys(directories)) {
    const text = exportArticle(locale, articles[0]);
    const rows = exportedTable(text, 'model-evidence-coverage', locale === 'en'
      ? ['Model', 'Recorded / proposed ID', 'Local measurement', 'Public evaluation', 'Current Bedrock price']
      : ['모델', '기록된 / 계획 ID', '로컬 측정', '공개 평가', '현재 Bedrock 단가']);
    assert.equal(rows.length, 15);
    const unverified = locale === 'en' ? 'Not reverified' : '재확인 안 함';
    const verifiedPrice = locale === 'en'
      ? 'Verified Standard US CRIS; below' : 'Standard US CRIS 확인; 아래 참조';
    const evaluations = locale === 'en' ? {
      sonnet55: 'Provider report located; conditions below',
      haiku55: 'Provider report located; conditions below',
      gpt61sol: 'Model documentation verified; matched task evaluation pending',
      gpt6astra: 'System-card source located; scoped review below',
    } : {
      sonnet55: '제공사 보고서 확인; 아래 조건 참조',
      haiku55: '제공사 보고서 확인; 아래 조건 참조',
      gpt61sol: '모델 문서 확인; 같은 과제 평가 대기',
      gpt6astra: '시스템 카드 확인; 아래 검토 범위 참조',
    };
    for (const model of data.models) {
      const row = rows.find(cells => cells[0] === model.name);
      const runs = data.runs.filter(run => run.model === model.key);
      const complete = runs.filter(run => run.status === 'done').length;
      assert.deepEqual(row, [model.name, `\`${model.model_id}\``,
        `${complete}/${runs.length} ${locale === 'en' ? 'completed' : '완주'}`,
        evaluations[model.key] || unverified,
        ['gpt61sol', 'gpt6astra'].includes(model.key) ? verifiedPrice : unverified],
      `${locale}: ${model.name} coverage association`);
    }
    assert.deepEqual(rows.find(row => row[0] === 'GPT-6.1 Terra'), [
      'GPT-6.1 Terra',
      `\`us.openai.gpt-6.1-terra\` (${locale === 'en' ? 'follow-up target' : '후속 대상'})`,
      locale === 'en' ? 'No verified batch here' : '검증된 배치 없음',
      locale === 'en' ? 'System-card addendum located; scoped review below'
        : '시스템 카드 부록 확인; 아래 검토 범위 참조',
      verifiedPrice,
    ]);
  }
});

test('exported failure-inclusive rows reproduce all-attempt costs and completion denominators', () => {
  for (const locale of Object.keys(directories)) {
    const text = exportArticle(locale, articles[0]);
    const rows = exportedTable(text, 'failure-inclusive-cost', locale === 'en'
      ? ['Model', 'Attempts', 'Completed', 'All-attempt cost (USD)', 'Cost per completion (USD)']
      : ['모델', '시도', '완주', '전체 시도 비용(USD)', '완주당 비용(USD)']);
    assert.equal(rows.length, 14);
    for (const model of data.models) {
      const row = rows.find(cells => cells[0] === model.name);
      const runs = data.runs.filter(run => run.model === model.key);
      const completed = runs.filter(run => run.status === 'done').length;
      const total = runs.reduce((sum, run) => sum + run.cost_usd, 0);
      assert.deepEqual(row, [model.name, String(runs.length), String(completed),
        `$${total.toFixed(4)}`, `$${(total / completed).toFixed(4)}`],
      `${locale}: ${model.name} all-attempt association`);
    }
  }
});

test('current Bedrock prices retain primary sources, US IDs and both-locale token rates', () => {
  const expected = [
    ['GPT-6 Astra', 'us.openai.gpt-6-astra', '$11.00', '$13.75', '$1.10', '$55.00',
      'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-astra.html'],
    ['GPT-6.1 Terra', 'us.openai.gpt-6.1-terra', '$1.10', '$1.375', '$0.055', '$5.50',
      'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-1-terra.html'],
    ['GPT-6.1 Sol', 'us.openai.gpt-6.1-sol', '$2.20', '$2.75', '$0.11', '$11.00',
      'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-1-sol.html'],
  ];
  for (const locale of Object.keys(directories)) {
    const text = exportArticle(locale, articles[0]);
    const section = text.slice(text.indexOf('{#current-bedrock-prices}'));
    const table = section.slice(0, section.indexOf(locale === 'en' ? '## How It Was Measured' : '## 측정 방식'));
    const rows = exportedTable(text, 'current-bedrock-prices', locale === 'en'
      ? ['Model', 'US inference profile', 'Input', 'Cache write', 'Cache read', 'Output', 'Primary source']
      : ['모델', '미국 추론 프로필', '입력', '캐시 쓰기', '캐시 읽기', '출력', '공식 출처']);
    assert.equal(rows.length, 3);
    assert.ok(table.includes('2026-10-30'));
    assert.ok(table.includes('Standard'));
    assert.ok(table.includes('us-east-1'));
    assert.ok(table.includes('272,000'));
    for (const [model, id, ...values] of expected) {
      const row = rows.find(cells => cells[0] === model);
      assert.deepEqual(row, [model, `\`${id}\``, ...values.slice(0, 4),
        `[${locale === 'en' ? 'Bedrock model card' : 'Bedrock 모델 카드'}](${values[4]})`],
      `${locale}: ${model} price/source association`);
    }
  }
});

test('series links resolve reciprocally in both locales', () => {
  for (const locale of Object.keys(directories)) {
    for (const article of articles) {
      const text = source(locale, article);
      for (const target of articles.filter(target => target !== article)) {
        assert.ok(text.includes(`./${target}`), `${locale}/${article} -> ${target}`);
        assert.ok(fs.existsSync(path.join(root, directories[locale], target)));
      }
    }
  }
  const sidebar = require('../../sidebars');
  const agents = sidebar.benchmarks.find(item => item.label === 'AI Agents').items;
  for (const article of articles) {
    assert.ok(agents.includes(`benchmarks/${article.replace(/\.md$/, '')}`));
  }
});

test('planned EKS reports export their pending evidence without historical chart components', () => {
  for (const locale of Object.keys(directories)) {
    for (const article of articles.slice(1)) {
      const text = exportArticle(locale, article);
      assert.doesNotMatch(source(locale, article), /<Ralph(?:CostTimeScatter|ModelComparison|MetricMatrix)\b/);
      assert.match(text, locale === 'en' ? /Planned|Pending|pending|planned/ : /계획|대기/);
    }
    const index = exportArticle(locale, articles[1]);
    assert.ok(index.includes('Kimi K3'));
    assert.ok(index.includes('Qwen3-Coder-30B-A3B-Instruct'));
    assert.ok(index.includes('B0') && index.includes('P0') && index.includes('P1') && index.includes('S1'));
    assert.match(index, locale === 'en' ? /caching was already used/ : /이미 캐시 사용/);
  }
});

test('all changed benchmark documents have exact computed reading times', async () => {
  for (const locale of Object.keys(directories)) {
    for (const article of [...articles, 'index.md']) {
      const file = path.join(root, directories[locale], article);
      const text = source(locale, article);
      assert.equal(matter(text).data.reading_time, await readingTime(text, file),
        `${locale}/${article}: reading time`);
    }
  }
});
