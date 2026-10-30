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

test('both locale exports retain every measured model and its exact coverage ID', () => {
  for (const locale of Object.keys(directories)) {
    const text = exportArticle(locale, articles[0]);
    for (const model of data.models) {
      assert.ok(text.includes(model.name), `${locale}: ${model.name}`);
      assert.ok(text.includes(model.model_id), `${locale}: ${model.model_id}`);
    }
    assert.ok(text.includes('us.openai.gpt-6.1-terra'));
    assert.match(text, locale === 'en' ? /No verified batch here/ : /검증된 배치 없음/);
    assert.match(text, locale === 'en' ? /Not reverified/ : /재확인 안 함/);
  }
});

test('failure-inclusive tables reproduce cost and denominators from all attempts', () => {
  for (const locale of Object.keys(directories)) {
    const article = source(locale, articles[0]);
    const section = article.slice(article.indexOf('{#failure-inclusive-cost}'));
    const table = section.slice(0, section.indexOf('</DataTableFrame>'));
    for (const model of data.models) {
      const line = table.split('\n').find(row => row.startsWith(`| ${model.name} |`));
      assert.ok(line, `${locale}: ${model.name}`);
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      const runs = data.runs.filter(run => run.model === model.key);
      const completed = runs.filter(run => run.status === 'done').length;
      const total = runs.reduce((sum, run) => sum + run.cost_usd, 0);
      assert.deepEqual(cells, [model.name, String(runs.length), String(completed),
        `$${total.toFixed(4)}`, `$${(total / completed).toFixed(4)}`]);
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
