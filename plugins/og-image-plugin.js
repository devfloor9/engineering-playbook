// plugins/og-image-plugin.js
//
// Docusaurus postBuild 훅에서 모든 문서 페이지(build/**/docs/**/*.html)의
// per-page OG 이미지(PNG)를 생성하고, 해당 HTML의 og:image·twitter:image를
// 그 경로로 치환한다.
//
// - 제목은 빌드된 HTML의 <meta property="og:title">에서 추출 → permalink 추론 불필요
// - ko/en 두 로케일을 자동 커버 (build/docs, build/en/docs)
// - 외부 네트워크 없이 satori+resvg로 빌드타임에 생성
//
// 참고: 홈/태그/검색 등 비문서 페이지는 전역 소셜 카드를 유지한다.

const fs = require('fs');
const path = require('path');
const { renderOgImage } = require('../scripts/og-image/render');

// HTML에서 메타 content를 추출 (Docusaurus는 data-rh="true" 속성을 붙인다)
function extractMeta(html, key, attr) {
  // attr: 'property' (og:*) | 'name' (twitter:*)
  const re = new RegExp(
    `<meta[^>]*${attr}="${key.replace(/[:]/g, '\\:')}"[^>]*content="([^"]*)"`,
    'i'
  );
  const m = html.match(re);
  if (m) return m[1];
  // content가 속성 앞에 오는 경우도 대비
  const re2 = new RegExp(
    `<meta[^>]*content="([^"]*)"[^>]*${attr}="${key.replace(/[:]/g, '\\:')}"`,
    'i'
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

// "소개 | Engineering Playbook" → "소개"
function cleanTitle(ogTitle) {
  if (!ogTitle) return null;
  return ogTitle.replace(/\s*\|\s*Engineering Playbook\s*$/i, '').trim();
}

// HTML 파일 경로 → 라우트 카테고리 (og 색상 테마용)
// build/docs/agentic-ai-platform/...  → agentic-ai-platform
// build/en/docs/eks-best-practices/... → eks-best-practices
// build/docs/intro.html               → __root__
function categoryFromPath(htmlPath, buildDir) {
  const rel = path.relative(buildDir, htmlPath).replace(/\\/g, '/');
  // (en/)?docs/<category>/...
  const m = rel.match(/^(?:en\/)?docs\/([^/]+)\//);
  return m ? m[1] : '__root__';
}

// og 이미지 파일명: 라우트를 안전한 슬러그로 (디렉토리 구분자 → __)
function ogFileName(htmlPath, buildDir) {
  const rel = path
    .relative(buildDir, htmlPath)
    .replace(/\\/g, '/')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '');
  return rel.replace(/\//g, '__') + '.png';
}

// HTML 내 og:image / twitter:image content를 새 절대 URL로 치환
function rewriteImageMeta(html, newUrl) {
  let out = html;
  // og:image (property)
  out = out.replace(
    /(<meta[^>]*property="og:image"[^>]*content=")[^"]*(")/i,
    `$1${newUrl}$2`
  );
  // twitter:image (name)
  out = out.replace(
    /(<meta[^>]*name="twitter:image"[^>]*content=")[^"]*(")/i,
    `$1${newUrl}$2`
  );
  return out;
}

// 재귀적으로 docs/ 하위 .html 수집
function collectDocHtml(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectDocHtml(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

module.exports = function ogImagePlugin(context) {
  const { siteConfig } = context;
  const siteUrl = siteConfig.url + siteConfig.baseUrl.replace(/\/$/, '');
  const siteLabel = siteUrl.replace(/^https?:\/\//, '');

  return {
    name: 'og-image-plugin',

    async postBuild({ outDir }) {
      // 문서 HTML만 대상: build/docs, build/en/docs
      const docDirs = [
        path.join(outDir, 'docs'),
        path.join(outDir, 'en', 'docs'),
      ];
      const htmlFiles = [];
      for (const d of docDirs) collectDocHtml(d, htmlFiles);

      const ogOutDir = path.join(outDir, 'img', 'og');
      fs.mkdirSync(ogOutDir, { recursive: true });

      let generated = 0;
      let skipped = 0;

      for (const htmlPath of htmlFiles) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const title = cleanTitle(extractMeta(html, 'og:title', 'property'));
        if (!title) {
          skipped++;
          continue;
        }

        const category = categoryFromPath(htmlPath, outDir);
        const fileName = ogFileName(htmlPath, outDir);
        const pngPath = path.join(ogOutDir, fileName);
        const publicUrl = `${siteUrl}/img/og/${fileName}`;

        try {
          const png = await renderOgImage({ title, category, siteLabel });
          fs.writeFileSync(pngPath, png);
          const rewritten = rewriteImageMeta(html, publicUrl);
          if (rewritten !== html) fs.writeFileSync(htmlPath, rewritten);
          generated++;
        } catch (err) {
          skipped++;
          console.warn(
            `[og-image-plugin] skip ${path.relative(outDir, htmlPath)}: ${err.message}`
          );
        }
      }

      console.log(
        `[og-image-plugin] generated ${generated} OG images, skipped ${skipped} (out: img/og/)`
      );
    },
  };
};
