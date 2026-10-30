#!/usr/bin/env node

// Reports review candidates, not confirmed translation or technical errors.
const fs = require('node:fs');
const path = require('node:path');

const EN_DIR = 'docs';
const KO_DIR = 'i18n/ko/docusaurus-plugin-content-docs/current';
const VERSION = /(?:\b(EKS|Kubernetes|K8s|Cilium|Istio|Linkerd|Karpenter|Helm|Python|Node(?:\.js)?)\s+(?:v(?:ersion)?\s*)?(\d+\.\d+(?:\.\d+)?)(?!\d|\.\d)|(?<![\w.])v(\d+\.\d+(?:\.\d+)?)(?!\d|\.\d))/gi;

function canonicalProduct(product) {
  if (!product) return null;
  const value = product.toLowerCase();
  if (value === 'k8s') return 'kubernetes';
  if (value === 'node.js') return 'node';
  return value;
}

function headingNumber(text) {
  return text.match(/^\s*(\d+(?:\.\d+)*)(?:[.)])?(?=\s|$)/)?.[1] || null;
}

function markdownFiles(directory, locale, rootPath) {
  const result = [];
  const skipped = [];
  function walk(current, prefix) {
    const entries = fs.readdirSync(current, {withFileTypes: true}).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) skipped.push({locale, path: relative, location: `${rootPath}/${relative}`});
      else if (entry.isDirectory()) walk(full, relative);
      else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) result.push(relative);
    }
  }
  walk(directory, '');
  return {files: result, skipped};
}

function analyzeDocument(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let start = 0;
  if (lines[0]?.replace(/^\uFEFF/, '').trim() === '---') {
    const end = lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)\s*$/.test(line));
    if (end !== -1) start = end + 1;
  }
  const headings = [];
  const versions = [];
  const blocks = [];
  let fence = null;
  let inComment = false;
  let previous = '';
  function withoutComments(input) {
    let output = '';
    let inlineTicks = 0;
    for (let i = 0; i < input.length;) {
      if (inComment) {
        const end = input.indexOf('-->', i);
        if (end < 0) return output;
        inComment = false;
        i = end + 3;
      } else if (input[i] === '`') {
        const length = input.slice(i).match(/^`+/)[0].length;
        if (!inlineTicks) inlineTicks = length;
        else if (inlineTicks === length) inlineTicks = 0;
        output += input.slice(i, i + length);
        i += length;
      } else if (!inlineTicks && input.startsWith('<!--', i)) {
        inComment = true;
        i += 4;
      } else {
        output += input[i++];
      }
    }
    return output;
  }
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i];
    if (fence) {
      const marker = raw.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (marker && marker[1][0] === fence.marker[0] && marker[1].length >= fence.marker.length && !marker[2].trim()) {
        blocks.push({line: fence.line, language: fence.language, body: fence.body.join('\n')});
        fence = null;
        previous = '';
      } else {
        fence.body.push(raw.replace(/[ \t]+$/, ''));
      }
      continue;
    }
    const line = withoutComments(raw);
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
      fence = {marker: marker[1], line: i + 1, language: marker[2].trim().split(/\s+/)[0].toLowerCase(), body: []};
      previous = '';
      continue;
    }
    const heading = line.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*)|$)/);
    if (heading) headings.push({line: i + 1, level: heading[1].length, number: headingNumber(heading[2] || '')});
    else if (previous && /^ {0,3}(=+|-+)\s*$/.test(line)) {
      headings.push({line: i, level: line.trim()[0] === '=' ? 1 : 2, number: headingNumber(previous)});
    }
    for (const match of line.matchAll(VERSION)) {
      versions.push({line: i + 1, product: canonicalProduct(match[1]), value: match[2] || match[3]});
    }
    previous = !heading && line.trim() && !/^ {0,3}(?:>|[-+*]\s|\d+\.\s|<!--)/.test(line) ? line : '';
  }
  if (fence) blocks.push({line: fence.line, language: fence.language, body: fence.body.join('\n'), unclosed: true});
  return {headings, versions, blocks};
}

function compareDocuments(english, korean) {
  const en = analyzeDocument(english);
  const ko = analyzeDocument(korean);
  const difference = {};
  const enStructure = en.headings.map(item => [item.level, item.number]);
  const koStructure = ko.headings.map(item => [item.level, item.number]);
  if (JSON.stringify(enStructure) !== JSON.stringify(koStructure)) {
    difference.headings = {english: en.headings, korean: ko.headings};
  }
  const enVersions = en.versions.map(item => [item.product, item.value]);
  const koVersions = ko.versions.map(item => [item.product, item.value]);
  if (JSON.stringify(enVersions) !== JSON.stringify(koVersions)) {
    difference.versions = {english: en.versions, korean: ko.versions};
  }
  const code = [];
  for (let i = 0; i < Math.max(en.blocks.length, ko.blocks.length); i++) {
    const a = en.blocks[i];
    const b = ko.blocks[i];
    if (!a || !b || a.language !== b.language || a.body !== b.body || Boolean(a.unclosed) !== Boolean(b.unclosed)) {
      const describe = block => block ? {line: block.line, language: block.language, unclosed: Boolean(block.unclosed)} : null;
      code.push({index: i + 1, english: describe(a), korean: describe(b)});
    }
  }
  if (code.length) difference.code = code;
  return difference;
}

function scan(root) {
  const rootInfo = fs.lstatSync(root);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
    throw new Error(`Root must be a non-symlink directory: ${root}`);
  }
  function inspectLocale(relativeRoot, locale) {
    let directory = root;
    for (const part of relativeRoot.split('/')) {
      directory = path.join(directory, part);
      let info;
      try { info = fs.lstatSync(directory); } catch (error) {
        if (error.code === 'ENOENT') throw new Error(`Missing documentation directory: ${directory}`);
        throw error;
      }
      if (info.isSymbolicLink()) {
        return {files: [], skipped: [{locale, path: '.', location: path.relative(root, directory).split(path.sep).join('/')}]};
      }
      if (!info.isDirectory()) throw new Error(`Not a documentation directory: ${directory}`);
    }
    return markdownFiles(directory, locale, relativeRoot);
  }
  const enRoot = path.join(root, EN_DIR);
  const koRoot = path.join(root, KO_DIR);
  const enResult = inspectLocale(EN_DIR, 'en');
  const koResult = inspectLocale(KO_DIR, 'ko');
  const english = enResult.files;
  const korean = koResult.files;
  const warnings = [...enResult.skipped, ...koResult.skipped];
  const enSet = new Set(english);
  const koSet = new Set(korean);
  const missing = [];
  const unscanned = [];
  const differences = [];
  for (const relative of [...new Set([...english, ...korean])].sort()) {
    if (!enSet.has(relative) || !koSet.has(relative)) {
      const missingLocale = enSet.has(relative) ? 'ko' : 'en';
      const blocked = warnings.some(w => w.locale === missingLocale &&
        (w.path === '.' || relative === w.path || relative.startsWith(`${w.path}/`)));
      if (blocked) unscanned.push({path: relative, locale: missingLocale});
      else missing.push({path: relative, missing: missingLocale});
      continue;
    }
    const detail = compareDocuments(
      fs.readFileSync(path.join(enRoot, relative), 'utf8'),
      fs.readFileSync(path.join(koRoot, relative), 'utf8'),
    );
    if (Object.keys(detail).length) differences.push({path: relative, ...detail});
  }
  return {
    notice: 'Review candidates only; headings compare depth and leading numbers, not translated meaning. Version and code differences are not proof of an error.',
    limits: 'Versions outside fences are limited to EKS, Kubernetes/K8s, Cilium, Istio, Linkerd, Karpenter, Helm, Python, Node/Node.js and v-prefixed numbers. Code compares normalized blocks by order, including translated comments.',
    roots: {english: EN_DIR, korean: KO_DIR},
    summary: {
      englishDocuments: english.length,
      koreanDocuments: korean.length,
      pairedDocuments: english.filter(file => koSet.has(file)).length,
      missingEnglish: missing.filter(item => item.missing === 'en').length,
      missingKorean: missing.filter(item => item.missing === 'ko').length,
      unscannedEnglish: unscanned.filter(item => item.locale === 'en').length,
      unscannedKorean: unscanned.filter(item => item.locale === 'ko').length,
      skippedSymlinks: warnings.length,
      headingDifferentPages: differences.filter(item => item.headings).length,
      versionDifferentPages: differences.filter(item => item.versions).length,
      codeDifferentPages: differences.filter(item => item.code).length,
      codeDifferentBlocks: differences.reduce((total, item) => total + (item.code?.length || 0), 0),
    },
    warnings,
    missing,
    unscanned,
    differences,
  };
}

function main(args = process.argv.slice(2)) {
  let root = path.resolve(__dirname, '..');
  let json = false;
  let summaryOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--summary') summaryOnly = true;
    else if (args[i] === '--root' && args[i + 1]) root = path.resolve(args[++i]);
    else if (args[i] === '--help') {
      console.log('Usage: node scripts/check-locale-parity.cjs [--root DIR] [--summary] [--json]');
      return;
    } else throw new Error(`Invalid argument: ${args[i]}`);
  }
  const result = scan(root);
  if (json) {
    console.log(JSON.stringify(summaryOnly ? {notice: result.notice, limits: result.limits, roots: result.roots, summary: result.summary, warnings: result.warnings} : result, null, 2));
    return;
  }
  console.log(result.notice);
  console.log(result.limits);
  console.log(`Documents: EN ${result.summary.englishDocuments}, KO ${result.summary.koreanDocuments}, paired ${result.summary.pairedDocuments}`);
  console.log(`Missing: EN ${result.summary.missingEnglish}, KO ${result.summary.missingKorean}`);
  if (result.warnings.length) {
    console.log(`WARNING: ${result.warnings.length} symlink(s) skipped; scan is incomplete.`);
    for (const warning of result.warnings) console.log(`WARNING skipped ${warning.locale.toUpperCase()} symlink ${warning.location}`);
    console.log(`Unscanned counterparts: EN ${result.summary.unscannedEnglish}, KO ${result.summary.unscannedKorean}`);
  }
  console.log(`Different pages: headings ${result.summary.headingDifferentPages}, versions ${result.summary.versionDifferentPages}, code ${result.summary.codeDifferentPages} (${result.summary.codeDifferentBlocks} blocks)`);
  if (summaryOnly) return;
  for (const item of result.missing) console.log(`MISSING ${item.missing.toUpperCase()} ${item.path}`);
  for (const item of result.unscanned) console.log(`UNSCANNED ${item.locale.toUpperCase()} ${item.path}`);
  for (const item of result.differences) {
    console.log(`REVIEW ${item.path}: ${['headings', 'versions', 'code'].filter(key => item[key]).join(', ')}`);
    if (item.headings) {
      const format = headings => headings.map(h => `${h.level}${h.number ? `:${h.number}` : ''}@${h.line}`).join(', ') || '(none)';
      console.log(`  headings EN: ${format(item.headings.english)}`);
      console.log(`  headings KO: ${format(item.headings.korean)}`);
    }
    if (item.versions) {
      const format = versions => versions.map(v => `${v.product || '?'}:${v.value}@${v.line}`).join(', ') || '(none)';
      console.log(`  versions EN: ${format(item.versions.english)}`);
      console.log(`  versions KO: ${format(item.versions.korean)}`);
    }
    if (item.code) console.log(`  code blocks: ${item.code.map(block => `${block.index}(EN:${block.english?.line || '-'},KO:${block.korean?.line || '-'})`).join(', ')}`);
  }
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 2; }
}

module.exports = {analyzeDocument, compareDocuments, main, scan};
