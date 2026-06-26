#!/usr/bin/env node
/**
 * strip-zh.js — src/components 의 중국어(zh) 로케일 분기를 AST 기반으로 제거한다.
 *
 * 변환 규칙 (예외 없이 균일 적용):
 *  1. `isZh ? X : Y`           → `Y`           (zh 분기 삭제, en/ko fallback 유지)
 *  2. `const isZh = i18n.currentLocale === 'zh';`  → 선언 제거
 *  3. 위 변환 후 `i18n` 이 더 이상 쓰이지 않으면 그대로 둔다(isKo가 보통 계속 사용).
 *
 * dry-run: node scripts/strip-zh.js           (변경 없이 영향만 출력)
 * apply  : node scripts/strip-zh.js --apply
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const APPLY = process.argv.includes('--apply');
const ROOT = path.join(__dirname, '..', 'src');

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx)$/.test(item)) out.push(full);
  }
  return out;
}

let filesChanged = 0;
let ternariesStripped = 0;
let declsRemoved = 0;
const errors = [];

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('isZh')) continue;

  let ast;
  try {
    ast = parser.parse(src, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    errors.push(`${file}: PARSE ERROR ${e.message}`);
    continue;
  }

  let localTernary = 0;
  let localDecl = 0;

  traverse(ast, {
    // 1. isZh ? X : Y  → Y
    ConditionalExpression(p) {
      const test = p.node.test;
      if (test.type === 'Identifier' && test.name === 'isZh') {
        p.replaceWith(p.node.alternate);
        localTernary++;
      }
    },
    // 2. const isZh = i18n.currentLocale === 'zh';  → 제거
    VariableDeclarator(p) {
      if (
        p.node.id.type === 'Identifier' &&
        p.node.id.name === 'isZh'
      ) {
        const decl = p.parentPath; // VariableDeclaration
        if (decl.node.declarations.length === 1) {
          decl.remove();
        } else {
          p.remove();
        }
        localDecl++;
      }
    },
  });

  if (localTernary === 0 && localDecl === 0) continue;

  // 안전 가드: 변환 후에도 isZh 가 남아있으면 실패 처리
  const output = generate(ast, { retainLines: false, jsescOption: { minimal: true } }, src).code;
  if (/\bisZh\b/.test(output)) {
    errors.push(`${file}: RESIDUAL isZh after transform — skipped`);
    continue;
  }

  filesChanged++;
  ternariesStripped += localTernary;
  declsRemoved += localDecl;

  if (APPLY) {
    fs.writeFileSync(file, output, 'utf8');
  }
}

console.log(`\n${APPLY ? '✅ APPLIED' : '🔍 DRY-RUN'}`);
console.log(`  파일 변경: ${filesChanged}`);
console.log(`  zh 삼항 제거: ${ternariesStripped}`);
console.log(`  isZh 선언 제거: ${declsRemoved}`);
if (errors.length) {
  console.log(`\n❌ 오류 ${errors.length}건:`);
  errors.forEach((e) => console.log('  ' + e));
  process.exit(1);
}
console.log(errors.length === 0 ? '\n오류 없음.' : '');
