// scripts/generate-llms-txt.js
//
// docs/ 디렉토리의 frontmatter를 순회하여 llmstxt.org 형식의 산출물을 생성한다.
//   - llms.txt       : 카테고리별 섹션 + 각 문서 링크/설명 (인덱스)
//   - llms-full.txt  : 모든 문서 본문을 병합한 단일 파일 (전문)
//
// LLM(ChatGPT, Claude, Perplexity 등)이 사이트 콘텐츠를 발견·인용하기 쉽게 한다.
// 참고: https://llmstxt.org/
//
// 사용법:
//   node scripts/generate-llms-txt.js            # ./ 에 출력
//   node scripts/generate-llms-txt.js --out build  # build/ 에 출력 (배포 산출물에 포함)

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');

// 사이트 메타데이터 (docusaurus.config.js와 동기화)
const SITE = {
  title: 'Engineering Playbook',
  description:
    'Amazon EKS 기반 인프라, Agentic AI 플랫폼, AI/ML 워크플로우, 보안, 자동화된 운영에 대한 실전 엔지니어링 가이드',
  baseUrl: 'https://devfloor9.github.io/engineering-playbook',
};

// 카테고리 표시 순서 및 라벨 (docs/ 최상위 디렉토리명 → 사람이 읽는 제목)
const CATEGORY_ORDER = [
  'eks-best-practices',
  'agentic-ai-platform',
  'aidlc',
  'hybrid-infrastructure',
  'security-governance',
  'rosa',
  'benchmarks',
  'industry-solutions',
  'sales',
];

const CATEGORY_LABELS = {
  'eks-best-practices': 'EKS Best Practices',
  'agentic-ai-platform': 'Agentic AI Platform',
  aidlc: 'AIDLC',
  'hybrid-infrastructure': 'Hybrid Infrastructure',
  'security-governance': 'Security & Governance',
  rosa: 'ROSA',
  benchmarks: 'Benchmarks',
  'industry-solutions': 'Industry Solutions',
  sales: 'Sales',
};

// --out <dir> 인자 파싱
function parseOutDir() {
  const idx = process.argv.indexOf('--out');
  if (idx !== -1 && process.argv[idx + 1]) {
    return path.resolve(ROOT, process.argv[idx + 1]);
  }
  return ROOT;
}

// docs/ 하위의 모든 .md 파일을 재귀 수집 (_ prefix 디렉토리/파일, README, SUMMARY 제외)
function collectDocs(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      results.push(...collectDocs(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      !entry.name.startsWith('_') &&
      entry.name !== 'README.md' &&
      entry.name !== 'SUMMARY.md'
    ) {
      results.push(full);
    }
  }
  return results;
}

// 파일 경로 → Docusaurus permalink (routeBasePath='docs', custom slug 미사용 전제)
// 예) docs/eks-best-practices/intro.md → /docs/eks-best-practices/intro
//     docs/intro.md                    → /docs/intro
//     .../index.md                     → 디렉토리 경로 (index 제거)
function toPermalink(filePath) {
  const rel = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  let routePath = rel.replace(/\.md$/, '');
  routePath = routePath.replace(/\/index$/, ''); // index.md → 디렉토리
  if (routePath === 'index') routePath = ''; // docs/index.md → /docs
  return routePath ? `/docs/${routePath}` : '/docs';
}

// 파일이 속한 최상위 카테고리 (docs/<category>/...). docs 루트 직속 파일은 'getting-started'
function topCategory(filePath) {
  const rel = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  return parts.length > 1 ? parts[0] : '__root__';
}

function main() {
  const outDir = parseOutDir();
  const files = collectDocs(DOCS_DIR).sort();

  // 카테고리별 그룹화
  const groups = {}; // category -> [{title, description, permalink, body, filePath}]
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const title = data.title || path.basename(file, '.md');
    const description = (data.description || '').trim();
    const permalink = toPermalink(file);
    const cat = topCategory(file);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ title, description, permalink, body: content, filePath: file });
  }

  // 정렬된 카테고리 키: __root__(Getting Started) 먼저, 이후 CATEGORY_ORDER, 나머지 알파벳순
  const presentCats = Object.keys(groups);
  const orderedCats = [];
  if (groups['__root__']) orderedCats.push('__root__');
  for (const c of CATEGORY_ORDER) {
    if (groups[c]) orderedCats.push(c);
  }
  for (const c of presentCats.sort()) {
    if (c !== '__root__' && !CATEGORY_ORDER.includes(c)) orderedCats.push(c);
  }

  const catLabel = (c) =>
    c === '__root__' ? 'Getting Started' : CATEGORY_LABELS[c] || c;

  // ---- llms.txt (인덱스) ----
  let llms = `# ${SITE.title}\n\n`;
  llms += `> ${SITE.description}\n\n`;
  llms += `This file follows the llmstxt.org convention. It indexes all documentation pages with links and summaries.\n\n`;

  let linkCount = 0;
  for (const cat of orderedCats) {
    const docs = groups[cat].sort((a, b) => a.permalink.localeCompare(b.permalink));
    llms += `## ${catLabel(cat)}\n\n`;
    for (const d of docs) {
      const url = `${SITE.baseUrl}${d.permalink}`;
      const desc = d.description ? `: ${d.description}` : '';
      llms += `- [${d.title}](${url})${desc}\n`;
      linkCount++;
    }
    llms += `\n`;
  }

  // ---- llms-full.txt (전문 병합) ----
  let full = `# ${SITE.title}\n\n`;
  full += `> ${SITE.description}\n\n`;
  full += `This file contains the full text of all documentation pages, concatenated for LLM ingestion.\n\n`;

  for (const cat of orderedCats) {
    const docs = groups[cat].sort((a, b) => a.permalink.localeCompare(b.permalink));
    for (const d of docs) {
      const url = `${SITE.baseUrl}${d.permalink}`;
      full += `\n\n---\n\n`;
      full += `# ${d.title}\n\n`;
      if (d.description) full += `> ${d.description}\n\n`;
      full += `Source: ${url}\n\n`;
      full += `${d.body.trim()}\n`;
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const llmsPath = path.join(outDir, 'llms.txt');
  const fullPath = path.join(outDir, 'llms-full.txt');
  fs.writeFileSync(llmsPath, llms, 'utf8');
  fs.writeFileSync(fullPath, full, 'utf8');

  const kb = (p) => (fs.statSync(p).size / 1024).toFixed(1);
  console.log(`✓ ${path.relative(ROOT, llmsPath)} — ${files.length} docs, ${linkCount} links (${kb(llmsPath)} KB)`);
  console.log(`✓ ${path.relative(ROOT, fullPath)} — full text merge (${kb(fullPath)} KB)`);
}

main();
