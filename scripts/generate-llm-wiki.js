// scripts/generate-llm-wiki.js
//
// docs/ 의 기술 도메인 문서만을 LLM/에이전트 친화적 정적 엔드포인트로 내보낸다.
//   - llm-wiki/manifest.json      : 문서 목록 + 메타(slug, domain, tags, related, md_url)
//   - llm-wiki/index.md           : 도메인별 문서 목록 (사람/LLM 공용 인덱스)
//   - llm-wiki/<domain>/<path>.md : 페이지별 클린 마크다운 (MDX import/JSX 제거, 링크 재작성)
//
// 사람용 문서(docs/, HTML 사이트)는 건드리지 않는다. industry-solutions·sales는 제외한다.
// 발견 계층은 llms.txt(scripts/generate-llms-txt.js)가 담당하고, 이 산출물은 콘텐츠 계층이다.
//
// 사용법:
//   node scripts/generate-llm-wiki.js                 # ./llm-wiki 에 출력
//   node scripts/generate-llm-wiki.js --out build     # build/llm-wiki 에 출력 (배포 산출물)

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

// 포함할 기술 도메인 (industry demo·sales 제외). docs 루트 직속 문서(intro.md)는 항상 포함.
const INCLUDED_DOMAINS = [
  'eks-best-practices',
  'agentic-ai-platform',
  'aidlc',
  'hybrid-infrastructure',
  'security-governance',
  'rosa',
  'benchmarks',
];

const DOMAIN_LABELS = {
  __root__: 'Getting Started',
  'eks-best-practices': 'EKS Best Practices',
  'agentic-ai-platform': 'Agentic AI Platform',
  aidlc: 'AIDLC',
  'hybrid-infrastructure': 'Hybrid Infrastructure',
  'security-governance': 'Security & Governance',
  rosa: 'ROSA',
  benchmarks: 'Benchmarks',
};

function parseOutDir() {
  const idx = process.argv.indexOf('--out');
  if (idx !== -1 && process.argv[idx + 1]) {
    return path.resolve(ROOT, process.argv[idx + 1]);
  }
  return ROOT;
}

// docs/ 하위의 모든 .md 파일을 재귀 수집 (_ prefix 제외, README/SUMMARY 제외)
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
      /\.mdx?$/.test(entry.name) &&
      !entry.name.startsWith('_') &&
      entry.name !== 'README.md' &&
      entry.name !== 'SUMMARY.md'
    ) {
      results.push(full);
    }
  }
  return results;
}

// docs/ 기준 상대 경로 (확장자 제거 전)
function relDocPath(filePath) {
  return path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
}

// 파일이 속한 최상위 도메인. docs 루트 직속 파일은 '__root__'
function topDomain(filePath) {
  const rel = relDocPath(filePath);
  const parts = rel.split('/');
  return parts.length > 1 ? parts[0] : '__root__';
}

// wiki 포함 여부
function isIncluded(filePath) {
  const domain = topDomain(filePath);
  return domain === '__root__' || INCLUDED_DOMAINS.includes(domain);
}

// docs 상대 경로 → wiki 내 md 상대 경로 (.mdx → .md 정규화, 디렉토리 구조 유지)
function toWikiRelPath(filePath) {
  return relDocPath(filePath).replace(/\.mdx$/, '.md');
}

// docs 상대 경로 → slug (확장자 제거, index는 디렉토리 경로)
function toSlug(filePath) {
  let s = relDocPath(filePath).replace(/\.mdx?$/, '');
  return s;
}

// 파일 경로 → 사람용 사이트 permalink
function toPermalink(filePath) {
  let routePath = relDocPath(filePath).replace(/\.mdx?$/, '');
  routePath = routePath.replace(/\/index$/, '');
  if (routePath === 'index') routePath = '';
  return routePath ? `/docs/${routePath}` : '/docs';
}

// MDX import 라인과 JSX 컴포넌트 블록을 제거한다.
// - import ... from '...' 라인 제거
// - 대문자로 시작하는 JSX 태그(<XxxTables />, <Xxx>...</Xxx>) 블록 제거
//   (라인 단위 보수적 처리 — 문서 내 컴포넌트는 항상 독립 라인/블록으로 사용된다)
function stripMdx(content) {
  const lines = content.split('\n');
  const out = [];
  let inJsxBlock = false;
  let jsxTag = null;
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 코드 펜스 내부는 건드리지 않는다
    if (/^(```|~~~)/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      out.push(line);
      continue;
    }
    if (inCodeFence) {
      out.push(line);
      continue;
    }

    if (inJsxBlock) {
      // 블록 종료: 자기 닫힘(/>) 또는 닫는 태그(</Tag>)
      if (
        /\/>\s*$/.test(trimmed) ||
        new RegExp(`</${jsxTag}>\\s*$`).test(trimmed)
      ) {
        inJsxBlock = false;
        jsxTag = null;
      }
      continue;
    }

    // import 라인 제거
    if (/^import\s+.+\s+from\s+['"].+['"];?\s*$/.test(trimmed)) continue;

    // JSX 컴포넌트 시작 (대문자 태그)
    const jsxOpen = trimmed.match(/^<([A-Z][A-Za-z0-9]*)/);
    if (jsxOpen) {
      const tag = jsxOpen[1];
      // 한 줄로 끝나는 경우: <Comp ... /> 또는 <Comp>...</Comp>
      if (
        /\/>\s*$/.test(trimmed) ||
        new RegExp(`</${tag}>\\s*$`).test(trimmed)
      ) {
        continue;
      }
      inJsxBlock = true;
      jsxTag = tag;
      continue;
    }

    out.push(line);
  }

  // 3줄 이상 연속 빈 줄 압축
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// 마크다운 링크 재작성 + related slug 추출
// - 상대 .md/.mdx 링크: wiki 내 포함 문서면 유지(.mdx→.md), 제외/부재면 사람용 절대 URL로
// - 절대 경로 링크(/docs/..., /img/... 등): 사이트 절대 URL로
// - 그 외(외부 URL, 앵커, 이미지 상대 경로)는 그대로 둔다
function rewriteLinks(content, filePath, includedSet) {
  const fileDir = path.dirname(filePath);
  const related = new Set();

  const rewritten = content.replace(
    /(\]\()([^)\s]+)(\))/g,
    (m, open, target, close) => {
      // 외부 URL / 앵커 / mailto는 그대로
      if (/^(https?:|mailto:|#)/.test(target)) return m;

      const [rawPath, anchor] = target.split('#');
      const suffix = anchor ? `#${anchor}` : '';

      // 절대 경로(/...): 사이트 절대 URL로 재작성
      if (rawPath.startsWith('/')) {
        return `${open}${SITE.baseUrl}${rawPath}${suffix}${close}`;
      }

      // 상대 .md/.mdx 링크
      if (/\.mdx?$/.test(rawPath)) {
        const resolved = path.resolve(fileDir, rawPath);
        if (includedSet.has(resolved)) {
          related.add(toSlug(resolved));
          // wiki가 docs/ 디렉토리 구조를 그대로 미러링하므로 상대 경로 유지 (.mdx만 정규화)
          return `${open}${rawPath.replace(/\.mdx$/, '.md')}${suffix}${close}`;
        }
        // 제외 문서(industry 등) 또는 부재 파일 → 사람용 사이트 절대 URL
        if (fs.existsSync(resolved)) {
          return `${open}${SITE.baseUrl}${toPermalink(resolved)}${suffix}${close}`;
        }
        return m; // 깨진 링크는 손대지 않는다 (원본 이슈로 보존)
      }

      return m;
    },
  );

  return { rewritten, related: [...related] };
}

function main() {
  const outRoot = parseOutDir();
  const outDir = path.join(outRoot, 'llm-wiki');

  const allFiles = collectDocs(DOCS_DIR).sort();
  const included = allFiles.filter(isIncluded);
  const includedSet = new Set(included);
  const excludedCount = allFiles.length - included.length;

  const docs = []; // manifest entries
  const byDomain = {}; // domain -> entries

  for (const file of included) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);

    const domain = topDomain(file);
    const slug = toSlug(file);
    const wikiRel = toWikiRelPath(file);
    const title = data.title || path.basename(file).replace(/\.mdx?$/, '');
    const description = (data.description || '').trim();
    const tags = Array.isArray(data.tags)
      ? data.tags.filter((t) => typeof t === 'string' && !t.startsWith('scope:'))
      : [];
    const created = data.created || null;
    const updated =
      (data.last_update && data.last_update.date) || data.created || null;
    const readingTime = data.reading_time || null;
    const url = `${SITE.baseUrl}${toPermalink(file)}`;
    const mdUrl = `${SITE.baseUrl}/llm-wiki/${wikiRel}`;

    // 본문 정제: MDX 제거 → 링크 재작성
    const stripped = stripMdx(content);
    const { rewritten, related } = rewriteLinks(stripped, file, includedSet);

    // 표준화된 최소 frontmatter로 재작성
    const fm = [
      '---',
      `title: ${JSON.stringify(title)}`,
      description ? `description: ${JSON.stringify(description)}` : null,
      `domain: ${domain === '__root__' ? 'getting-started' : domain}`,
      tags.length ? `tags: [${tags.join(', ')}]` : null,
      created ? `created: ${toDateStr(created)}` : null,
      updated ? `updated: ${toDateStr(updated)}` : null,
      `source_url: ${url}`,
      '---',
    ]
      .filter(Boolean)
      .join('\n');

    const outFile = path.join(outDir, wikiRel);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, `${fm}\n\n${rewritten.trim()}\n`, 'utf8');

    const entry = {
      slug,
      title,
      description,
      domain: domain === '__root__' ? 'getting-started' : domain,
      tags,
      created: created ? toDateStr(created) : null,
      updated: updated ? toDateStr(updated) : null,
      reading_time: readingTime,
      url,
      md_url: mdUrl,
      related,
    };
    docs.push(entry);
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(entry);
  }

  // ---- manifest.json ----
  const manifest = {
    site: SITE,
    format: 'llm-wiki/v1',
    generated_at: new Date().toISOString().slice(0, 10),
    language: 'ko',
    doc_count: docs.length,
    domains: Object.keys(byDomain).map((d) => ({
      id: d === '__root__' ? 'getting-started' : d,
      label: DOMAIN_LABELS[d] || d,
      doc_count: byDomain[d].length,
    })),
    docs,
  };
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  );

  // ---- index.md (도메인별 목록) ----
  const orderedDomains = ['__root__', ...INCLUDED_DOMAINS].filter(
    (d) => byDomain[d],
  );
  let index = `# ${SITE.title} — LLM Wiki\n\n`;
  index += `> ${SITE.description}\n\n`;
  index += `Machine-friendly markdown mirror of the technical domains (industry demos excluded).\n`;
  index += `Each entry links to a clean per-page markdown file. Programmatic access: [manifest.json](${SITE.baseUrl}/llm-wiki/manifest.json)\n\n`;
  index += `- Documents: ${docs.length}\n`;
  index += `- Language: Korean (ko)\n`;
  index += `- Discovery: ${SITE.baseUrl}/llms.txt\n\n`;
  for (const d of orderedDomains) {
    index += `## ${DOMAIN_LABELS[d] || d}\n\n`;
    const entries = byDomain[d].sort((a, b) => a.slug.localeCompare(b.slug));
    for (const e of entries) {
      const desc = e.description ? `: ${e.description}` : '';
      index += `- [${e.title}](${SITE.baseUrl}/llm-wiki/${e.slug.replace(/\.mdx?$/, '')}.md)${desc}\n`;
    }
    index += `\n`;
  }
  fs.writeFileSync(path.join(outDir, 'index.md'), index, 'utf8');

  console.log(
    `✓ llm-wiki: ${docs.length} docs exported (${excludedCount} excluded: industry-solutions/sales), ${Object.keys(byDomain).length} domains`,
  );
  console.log(`  → ${path.relative(ROOT, outDir)}/{manifest.json, index.md, <domain>/*.md}`);
}

// created가 Date 객체로 파싱된 경우 방어
function toDateStr(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

main();
