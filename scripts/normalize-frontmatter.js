#!/usr/bin/env node
/**
 * normalize-frontmatter.js - 전 문서 frontmatter를 단일 템플릿으로 통일한다.
 *
 * 적용 대상: docs 하위 .md (+ --include-en 시 i18n/en 하위 .md)
 *
 * 통일 규칙 (AWS Tech Blog 구조 기준, 예외 없이):
 *  - 필드 순서 고정(TEMPLATE_ORDER). 그 외 알 수 없는 키는 순서 뒤에 원본 유지.
 *  - title         : 기존 보존. 없으면 리포트(스크립트가 임의 생성하지 않음 - 의미 보강은 LLM 단계).
 *  - description   : 기존 보존. 없으면 리포트.
 *  - created       : 기존값 절대 보존. 없을 때만 git 최초 커밋일로 backfill.
 *  - last_update   : object 형식 {date, author}. date 없으면 git 최종 커밋일. author 없으면 DEFAULT_AUTHOR.
 *                    기존 date 보존(오늘로 bump 안 함).
 *  - reading_time  : 본문(코드블록/frontmatter 제외) 문자수 / RATE 올림, 최소 1. 균일화 위해 항상 재산출.
 *  - tags          : 기존 보존(배열 정규화). scope 태그 없으면 경로 기반 1개 추가.
 *
 * dry-run: node scripts/normalize-frontmatter.js
 * apply  : node scripts/normalize-frontmatter.js --apply [--include-en]
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const matter = require('gray-matter');
const yaml = require('js-yaml');

// frontmatter를 안전하게 직렬화한다.
// js-yaml 직접 사용 + lineWidth 무제한으로 긴 한국어 값(콜론/하이픈 포함)이 깨지지 않게 한다.
function dumpFrontmatter(data, body) {
  const yamlStr = yaml.dump(data, {
    lineWidth: -1, // 줄바꿈 접기 비활성화 (긴 description 보호)
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false, // 우리가 정한 순서 유지
  });
  // 본문 앞쪽 공백 정리 후 표준 형식으로 결합
  const cleanBody = body.replace(/^\n+/, '');
  return `---\n${yamlStr}---\n\n${cleanBody}`;
}

const APPLY = process.argv.includes('--apply');
const INCLUDE_EN = process.argv.includes('--include-en');
const ROOT = path.join(__dirname, '..');
const DEFAULT_AUTHOR = 'YoungJoon Jeong';
const RATE = 424; // 글자/분 - 기존 우수 문서 reading_time 중앙값에서 역산(calibrated)

const TEMPLATE_ORDER = [
  'title',
  'description',
  'created',
  'last_update',
  'reading_time',
  'tags',
  'keywords',
  'sidebar_label',
  'sidebar_position',
  'category',
];

// 날짜 값을 YYYY-MM-DD 문자열로 안전 변환한다.
// gray-matter는 YAML 날짜를 JS Date 객체로 파싱하므로(타임존 변환 발생),
// Date면 UTC 기준으로 포맷해 원본 날짜를 보존한다. 문자열이면 앞 10자만 취한다.
function toISODate(v) {
  if (v == null) return null;
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, '0');
    const d = String(v.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s.slice(0, 10);
}

function scopeForPath(rel) {
  if (/\/design-architecture\//.test(rel)) return 'scope:design';
  if (/\/model-serving\//.test(rel)) return 'scope:tech';
  if (/\/operations-mlops\//.test(rel)) return 'scope:ops';
  if (/\/reference-architecture\//.test(rel)) return 'scope:impl';
  if (/index\.md$/.test(rel)) return 'scope:nav';
  return null;
}

function gitDate(file, kind) {
  try {
    if (kind === 'created') {
      const out = cp
        .execSync(`git log --diff-filter=A --follow --format=%as -- "${file}"`, {
          cwd: ROOT,
          stdio: ['ignore', 'pipe', 'ignore'],
        })
        .toString()
        .trim()
        .split('\n')
        .filter(Boolean);
      return out.length ? out[out.length - 1] : null;
    } else {
      const out = cp
        .execSync(`git log -1 --format=%as -- "${file}"`, {
          cwd: ROOT,
          stdio: ['ignore', 'pipe', 'ignore'],
        })
        .toString()
        .trim();
      return out || null;
    }
  } catch {
    return null;
  }
}

function bodyChars(body) {
  const noCode = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const stripped = noCode.replace(/[\s#>*|\-_=\[\]()`!]/g, '');
  return [...stripped].length;
}

function computeReadingTime(body) {
  const chars = bodyChars(body);
  return Math.max(1, Math.ceil(chars / RATE));
}

function normalizeTags(tags, rel) {
  let arr = Array.isArray(tags) ? tags.slice() : tags ? [tags] : [];
  arr = arr.map((t) => String(t).trim()).filter(Boolean);
  const scopes = arr.filter((t) => t.startsWith('scope:'));
  const nonScopes = arr.filter((t) => !t.startsWith('scope:'));
  let scope = scopes[0];
  if (!scope) scope = scopeForPath(rel);
  const result = nonScopes;
  if (scope) result.push(scope);
  return result;
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (item.endsWith('.md')) out.push(full);
  }
  return out;
}

const targets = [...walk(path.join(ROOT, 'docs'))];
if (INCLUDE_EN) targets.push(...walk(path.join(ROOT, 'i18n/en/docusaurus-plugin-content-docs/current')));

let changed = 0;
let createdBackfilled = 0;
let createdPreserved = 0;
let rtRecomputed = 0;
let scopeAdded = 0;
const missingTitle = [];
const missingDesc = [];
const fewTags = [];
const parseErrors = [];
let createdMutationGuardHits = 0;

for (const file of targets) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    parseErrors.push(`${rel}: ${e.reason || e.message}`);
    continue;
  }
  const fmIn = parsed.data;
  const body = parsed.content;

  const fm = { ...fmIn };
  const originalCreated = fmIn.created ? toISODate(fmIn.created) : null;

  if (fm.created) {
    fm.created = toISODate(fm.created);
    createdPreserved++;
  } else {
    const gd = gitDate(file, 'created');
    if (gd) {
      fm.created = gd;
      createdBackfilled++;
    }
  }

  let lu = fm.last_update;
  let luDate = null;
  let luAuthor = null;
  if (lu && lu instanceof Date) {
    luDate = toISODate(lu);
  } else if (lu && typeof lu === 'object') {
    luDate = lu.date ? toISODate(lu.date) : null;
    luAuthor = lu.author || null;
  } else if (lu) {
    luDate = toISODate(lu);
  }
  if (!luDate) luDate = gitDate(file, 'updated') || fm.created || null;
  if (!luAuthor) luAuthor = DEFAULT_AUTHOR;
  if (luDate) fm.last_update = { date: luDate, author: luAuthor };

  const newRt = computeReadingTime(body);
  if (fm.reading_time !== newRt) rtRecomputed++;
  fm.reading_time = newRt;

  const hadScope = (Array.isArray(fm.tags) ? fm.tags : []).some((t) =>
    String(t).startsWith('scope:')
  );
  fm.tags = normalizeTags(fm.tags, rel);
  if (!hadScope && fm.tags.some((t) => t.startsWith('scope:'))) scopeAdded++;

  if (!fm.title) missingTitle.push(rel);
  if (!fm.description) missingDesc.push(rel);
  if (fm.tags.filter((t) => !t.startsWith('scope:')).length < 3) fewTags.push(rel);

  if (originalCreated && fm.created !== originalCreated) {
    createdMutationGuardHits++;
    console.error(`CREATED MUTATION BLOCKED: ${rel} (${originalCreated} -> ${fm.created}) - 원복`);
    fm.created = originalCreated;
  }

  const ordered = {};
  for (const key of TEMPLATE_ORDER) {
    if (fm[key] !== undefined) ordered[key] = fm[key];
  }
  for (const key of Object.keys(fm)) {
    if (!(key in ordered)) ordered[key] = fm[key];
  }

  const output = dumpFrontmatter(ordered, body);

  if (output !== raw) {
    changed++;
    if (APPLY) fs.writeFileSync(file, output, 'utf8');
  }
}

console.log(`\n${APPLY ? 'APPLIED' : 'DRY-RUN'}  (RATE=${RATE}자/분, 대상 ${targets.length}개)`);
console.log(`  파일 변경: ${changed}`);
console.log(`  created 보존: ${createdPreserved} / git backfill: ${createdBackfilled}`);
console.log(`  reading_time 재산출(변경): ${rtRecomputed}`);
console.log(`  scope 태그 추가: ${scopeAdded}`);
console.log(`\n-- 의미 보강 필요(LLM 단계) --`);
console.log(`  title 누락: ${missingTitle.length}`);
console.log(`  description 누락: ${missingDesc.length}`);
console.log(`  비-scope 태그 3개 미만: ${fewTags.length}`);
console.log(`\ncreated 불변 가드 차단 횟수: ${createdMutationGuardHits} (0이어야 정상)`);
if (parseErrors.length) {
  console.log(`\nYAML 파스 에러 ${parseErrors.length}건 (수동 수정 필요):`);
  parseErrors.forEach((e) => console.log('  ' + e));
}

const report = {
  rate: RATE,
  targets: targets.length,
  changed,
  createdPreserved,
  createdBackfilled,
  missingTitle,
  missingDesc,
  fewTags,
  parseErrors,
};
fs.writeFileSync(
  path.join(ROOT, '.omc/frontmatter-normalize-report.json'),
  JSON.stringify(report, null, 2)
);
console.log(`\n리포트: .omc/frontmatter-normalize-report.json`);
