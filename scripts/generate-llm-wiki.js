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
const {readImports, fenceMarker, jsxBlock, compactMarkdown, inlineComponentOffset} = require('./llm-wiki-source');
const {rewriteMarkdownLinks} = require('./llm-wiki-links');
const {embeddedDiagram} = require('./llm-wiki-diagrams');
const {StaticGap} = require('./llm-wiki-static');
const {
  renderComponent, renderNavigation, componentName, supportedNavigationComponents, staticRenderer,
} = require('./llm-wiki-components');

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
  'eks-hybrid-nodes',
  'rosa',
  'benchmarks',
];

const DOMAIN_LABELS = {
  __root__: 'Getting Started',
  'eks-best-practices': 'EKS Best Practices',
  'agentic-ai-platform': 'Agentic AI Platform',
  aidlc: 'AIDLC',
  'eks-hybrid-nodes': 'EKS Hybrid Nodes',
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

// Work on source spans: prose and fenced code remain untouched. A component is
// replaced only after Babel has found the complete JSX expression boundary.
function stripMdx(content, {
  sourceUrl = '', omitted = new Set(), serialized = new Set(),
  navigation = new Set(), omittedNavigation = new Set(),
  filePath, diagnostics = [], renderedSources = [],
} = {}) {
  const {lines, imports, declarations} = readImports(content);
  const out = [];
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index];
    let trimmed = line.trim();
    const marker = fenceMarker(line, fence);
    fence = marker.fence;
    if (fence || marker.boundary || /^ {4}|^\t/.test(line)) { out.push(line); continue; }
    const container = trimmed.match(/^<\/?(Tabs|TabItem)\b/);
    if (container && (!imports.has(container[1]) || imports.get(container[1]).source === `@theme/${container[1]}`)) {
      // Markdown children are not JSX and must not be parsed as JavaScript.
      while (!/>(?:\s*)$/.test(lines[index]) && index + 1 < lines.length) index++;
      continue;
    }
    if (!trimmed.startsWith('<')) {
      const offset = inlineComponentOffset(line, imports, declarations);
      if (offset !== -1) {
        out.push(line.slice(0, offset));
        line = lines[index] = line.slice(offset);
        trimmed = line.trim();
      }
    }
    const tag = trimmed.match(/^<([A-Z][\w.]*|iframe|svg|canvas|object|embed)\b/)?.[1];
    if (!tag) { out.push(line); continue; }
    const block = jsxBlock(lines, index);
    if (!block) {
      throw new Error(`Cannot delimit JSX ${tag} in ${filePath || 'Markdown'}:${index + 1}`);
    }
    const context = {filePath, diagnostics, declarations};
    let rendered;
    if (tag === 'iframe') {
      staticRenderer.reset();
      try { rendered = embeddedDiagram(block, {...context, renderer: staticRenderer}); }
      catch (error) {
        if (!(error instanceof StaticGap)) throw error;
        diagnostics.push({component: tag, reason: error.message});
      }
    } else rendered = renderNavigation(block.text, imports, context) || renderComponent(block.text, imports, context);
    if (rendered) {
      out.push('', rendered.markdown, '');
      for (const name of rendered.names || [rendered.name]) {
        serialized.add(name);
        if (rendered.names) navigation.add(name);
      }
      renderedSources.push({component: tag, ...rendered, markdown: undefined});
    } else {
      omitted.add(tag);
      if (['DocCardGrid', 'DocCard', 'DocCardList'].includes(componentName(tag, imports)) ||
          imports.get(tag)?.source === '@site/src/components/LegacySectionLinks') omittedNavigation.add(tag);
      const reference = sourceUrl ? `[web version](${sourceUrl})` : 'web version';
      let detail = diagnostics.findLast(d => d.component === tag);
      if (!detail) {
        const binding = imports.get(tag);
        detail = {component: tag, source: binding ? `${binding.source}#${binding.exported}` : null,
          reason: 'No supported static source or literal props for this component'};
        diagnostics.push(detail);
      }
      const reason = detail.reason;
      out.push('', `> Export note: the \`${tag}\` component is not included in this Markdown export.${reason ? ` ${reason}.` : ''} Read its content in the ${reference}.`, '');
    }
    if (block.trailing && inlineComponentOffset(block.trailing, imports, declarations) !== -1) {
      lines[block.end] = block.trailing;
      index = block.end - 1;
    } else {
      if (block.trailing) out.push(block.trailing);
      index = block.end;
    }
  }
  return compactMarkdown(out.join('\n'));
}

// 마크다운 링크 재작성 + related slug 추출
// - 상대 .md/.mdx 링크: wiki 내 포함 문서면 유지(.mdx→.md), 제외/부재면 사람용 절대 URL로
// - 절대 경로 링크(/docs/..., /img/... 등): 사이트 절대 URL로
// - 그 외(외부 URL, 앵커, 이미지 상대 경로)는 그대로 둔다
async function rewriteLinks(content, filePath, includedSet) {
  const fileDir = path.dirname(filePath);
  const related = new Set();
  const rewritten = await rewriteMarkdownLinks(content, target => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) return target;
    const [, rawPath, suffix = ''] = target.match(/^([^?#]*)([?#][\s\S]*)?$/);
    if (rawPath.startsWith('/')) {
      const basePath = new URL(SITE.baseUrl).pathname;
      return `${rawPath.startsWith(basePath + '/') ? new URL(SITE.baseUrl).origin : SITE.baseUrl}${rawPath}${suffix}`;
    }
    if (/\.mdx?$/.test(rawPath)) {
      const resolved = path.resolve(fileDir, rawPath);
      if (includedSet.has(resolved)) {
        related.add(toSlug(resolved));
        return `${rawPath.replace(/\.mdx$/, '.md')}${suffix}`;
      }
      if (fs.existsSync(resolved)) return `${SITE.baseUrl}${toPermalink(resolved)}${suffix}`;
    }
    return target;
  });
  return {rewritten, related: [...related]};
}

async function main() {
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
    const omitted = new Set();
    const serialized = new Set();
    const navigation = new Set();
    const omittedNavigation = new Set();
    const diagnostics = [];
    const renderedSources = [];
    const stripped = stripMdx(content, {sourceUrl: url, omitted, serialized, navigation, omittedNavigation, filePath: file, diagnostics, renderedSources});
    const { rewritten, related } = await rewriteLinks(stripped, file, includedSet);

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
      content_coverage: {
        serialized_components: [...serialized].sort(),
        omitted_components: [...omitted].sort(),
        serialized_navigation_components: [...navigation].sort(),
        omitted_navigation_components: [...omittedNavigation].sort(),
        rendered_sources: renderedSources,
        omission_details: diagnostics,
      },
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
    component_coverage: {
      supported_components: [...new Set(docs.flatMap(doc => doc.content_coverage.serialized_components.filter(name => !doc.content_coverage.serialized_navigation_components.includes(name))))].sort(),
      supported_navigation_components: supportedNavigationComponents,
      supported_sources: [...new Set(docs.flatMap(doc => doc.content_coverage.rendered_sources.map(r => r.source)))].sort(),
      serialized_occurrences: docs.reduce((sum, doc) => sum + doc.content_coverage.rendered_sources.length, 0),
      docs_with_omissions: docs.filter(doc => doc.content_coverage.omitted_components.length).length,
      docs_with_technical_omissions: docs.filter(doc =>
        doc.content_coverage.omitted_components.some(name =>
          !doc.content_coverage.omitted_navigation_components.includes(name))).length,
      docs_with_navigation_omissions: docs.filter(doc =>
        doc.content_coverage.omitted_navigation_components.length).length,
      omitted_component_count: new Set(docs.flatMap(doc => doc.content_coverage.omitted_components)).size,
    },
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
  index += "Component coverage: source-qualified static JSX, shared datasets, expanded static tables and text equivalents preserve article content. Navigation is derived from literal props or the source sidebar. Interactive controls, animation and theme changes are not reproduced. Unknown runtime content remains explicitly omitted; check each entry's `content_coverage`, `rendered_sources` and `omission_details`. Zero omissions describes this source snapshot, not arbitrary MDX support.\n\n";
  index += `- Pages with omitted technical content: ${manifest.component_coverage.docs_with_technical_omissions}\n`;
  index += `- Pages with omitted navigation: ${manifest.component_coverage.docs_with_navigation_omissions}\n`;
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
  console.log(`Component coverage: ${manifest.component_coverage.supported_components.length} technical and ${supportedNavigationComponents.length} navigation components; ${manifest.component_coverage.docs_with_omissions} pages identify omitted components.`);
}

// created가 Date 객체로 파싱된 경우 방어
function toDateStr(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {stripMdx, rewriteLinks, collectDocs, isIncluded, readImports, main};
