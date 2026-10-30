#!/usr/bin/env node

// Read-only review metadata inventory. Unknown is not proof of a missing review.
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const LOCALES = [
  {locale: 'en', directory: 'docs'},
  {locale: 'ko', directory: 'i18n/ko/docusaurus-plugin-content-docs/current'},
];
const FIELDS = ['owner', 'reviewed_on', 'status', 'next_review'];
const STATUSES = ['draft', 'published', 'review_needed', 'retired'];
const UNKNOWN = new Set(['unknown', 'unconfirmed', 'tbd', 'n/a', '미정', '미확인']);

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function inspectField(name, value, today) {
  if (value === undefined) return {state: 'unconfirmed', reason: 'missing'};
  if (value === null) return {state: 'unconfirmed', reason: 'null'};
  if (typeof value === 'string' && UNKNOWN.has(value.trim().toLowerCase())) {
    return {state: 'unconfirmed', reason: 'placeholder'};
  }
  if (typeof value !== 'string' || !value.trim()) return {state: 'invalid', reason: 'expected a non-empty string'};
  const normalized = value.trim();
  if (name === 'owner') return {state: 'known', value: normalized};
  if (name === 'status') {
    return STATUSES.includes(normalized)
      ? {state: 'known', value: normalized}
      : {state: 'invalid', reason: `expected one of: ${STATUSES.join(', ')}`};
  }
  if (!validDate(normalized)) return {state: 'invalid', reason: 'expected a valid YYYY-MM-DD date'};
  if (name === 'reviewed_on' && normalized > today) return {state: 'invalid', reason: 'review date is in the future', value: normalized};
  if (name === 'next_review' && normalized < today) return {state: 'expired', value: normalized};
  return {state: 'known', value: normalized};
}

function inspectDocument(source, today) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/);
  if (/^---[ \t]*$/.test(lines[0]) && !lines.slice(1).some(line => /^---[ \t]*$/.test(line))) {
    return {error: {kind: 'yaml', message: 'Unclosed frontmatter: missing closing ---'}};
  }
  let parsed;
  try {
    // JSON_SCHEMA retains unquoted dates as strings, avoiding silent rollover of invalid dates.
    parsed = matter(source, {engines: {yaml: input => yaml.load(input, {schema: yaml.JSON_SCHEMA})}});
  } catch (error) {
    return {error: {kind: 'yaml', message: error.message.split('\n')[0]}};
  }
  if (typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    return {error: {kind: 'invalid_frontmatter', message: 'frontmatter must be a mapping'}};
  }
  const review = parsed.data?.review;
  if (review !== undefined && review !== null && (typeof review !== 'object' || Array.isArray(review))) {
    return {error: {kind: 'invalid_review', message: 'review must be a mapping or null'}};
  }
  const fields = {};
  for (const name of FIELDS) fields[name] = inspectField(name, review?.[name], today);
  if (fields.reviewed_on.state === 'known' && ['known', 'expired'].includes(fields.next_review.state) &&
      fields.next_review.value < fields.reviewed_on.value) {
    fields.next_review = {state: 'invalid', reason: 'next review precedes the review date', value: fields.next_review.value};
  }
  return {fields};
}

function collectFiles(root, locale, relativeRoot) {
  let directory = root;
  for (const part of relativeRoot.split('/')) {
    directory = path.join(directory, part);
    let info;
    try { info = fs.lstatSync(directory); } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Missing documentation directory: ${directory}`);
      throw error;
    }
    if (info.isSymbolicLink()) {
      return {files: [], warnings: [{locale, path: path.relative(root, directory).split(path.sep).join('/'), reason: 'symlink'}]};
    }
    if (!info.isDirectory()) throw new Error(`Not a documentation directory: ${directory}`);
  }
  const files = [];
  const warnings = [];
  function walk(current, prefix) {
    const entries = fs.readdirSync(current, {withFileTypes: true}).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) warnings.push({locale, path: `${relativeRoot}/${relative}`, reason: 'symlink'});
      else if (entry.isDirectory()) walk(full, relative);
      else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) files.push({relative, full});
    }
  }
  walk(directory, '');
  return {files, warnings};
}

function scan(root, options = {}) {
  const today = options.today || new Date().toISOString().slice(0, 10);
  if (!validDate(today)) throw new Error('Date must be a valid YYYY-MM-DD calendar date');
  const rootInfo = fs.lstatSync(root);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new Error(`Root must be a non-symlink directory: ${root}`);
  const documents = [];
  const warnings = [];
  for (const {locale, directory} of LOCALES) {
    const found = collectFiles(root, locale, directory);
    warnings.push(...found.warnings);
    for (const file of found.files) {
      let result;
      try {
        result = inspectDocument(fs.readFileSync(file.full, 'utf8'), today);
      } catch (error) {
        result = {error: {kind: 'read', message: error.message.split('\n')[0]}};
      }
      documents.push({locale, path: `${directory}/${file.relative}`, ...result});
    }
  }
  const fieldStates = Object.fromEntries(FIELDS.map(name => [name, {known: 0, unconfirmed: 0, invalid: 0, expired: 0}]));
  const summary = {
    englishDocuments: documents.filter(doc => doc.locale === 'en').length,
    koreanDocuments: documents.filter(doc => doc.locale === 'ko').length,
    unconfirmedDocuments: 0,
    invalidDocuments: 0,
    expiredDocuments: 0,
    yamlErrorDocuments: 0,
    readErrorDocuments: 0,
    structureErrorDocuments: 0,
    completeDocuments: 0,
    skippedSymlinks: warnings.length,
    fieldStates,
  };
  for (const doc of documents) {
    if (doc.error?.kind === 'yaml') { summary.yamlErrorDocuments++; continue; }
    if (doc.error?.kind === 'read') { summary.readErrorDocuments++; continue; }
    if (doc.error?.kind === 'invalid_review' || doc.error?.kind === 'invalid_frontmatter') {
      summary.invalidDocuments++;
      summary.structureErrorDocuments++;
      continue;
    }
    const states = Object.values(doc.fields).map(field => field.state);
    for (const name of FIELDS) fieldStates[name][doc.fields[name].state]++;
    if (states.includes('unconfirmed')) summary.unconfirmedDocuments++;
    if (states.includes('invalid')) summary.invalidDocuments++;
    if (states.includes('expired')) summary.expiredDocuments++;
    if (states.every(state => state === 'known')) summary.completeDocuments++;
  }
  return {
    notice: 'Inventory only: complete means fields are populated, not that a review was performed. Missing or unconfirmed fields do not prove that no review occurred.',
    checkedOn: today,
    dateBasis: 'UTC; next_review expires after its stated date',
    scanComplete: !warnings.length && !summary.yamlErrorDocuments && !summary.readErrorDocuments && !summary.structureErrorDocuments,
    summary,
    warnings,
    documents,
  };
}

function main(args = process.argv.slice(2)) {
  let root = path.resolve(__dirname, '..');
  let today;
  let json = false;
  let summaryOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--summary') summaryOnly = true;
    else if (args[i] === '--root' && args[i + 1]) root = path.resolve(args[++i]);
    else if (args[i] === '--date' && args[i + 1]) today = args[++i];
    else if (args[i] === '--help') {
      console.log('Usage: node scripts/check-doc-review.cjs [--root DIR] [--date YYYY-MM-DD] [--summary] [--json]');
      return;
    } else throw new Error(`Invalid argument: ${args[i]}`);
  }
  const result = scan(root, {today});
  if (json) {
    const output = summaryOnly ? {notice: result.notice, checkedOn: result.checkedOn, dateBasis: result.dateBasis,
      scanComplete: result.scanComplete, summary: result.summary, warnings: result.warnings,
      errors: result.documents.filter(doc => doc.error)} : result;
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(result.notice);
    console.log(`Date: ${result.checkedOn} UTC; next review expires after its stated date.`);
    console.log(`Scanned: EN ${result.summary.englishDocuments}, KO ${result.summary.koreanDocuments}`);
    console.log(`Documents: complete ${result.summary.completeDocuments}, unconfirmed ${result.summary.unconfirmedDocuments}, invalid ${result.summary.invalidDocuments}, expired ${result.summary.expiredDocuments}, YAML errors ${result.summary.yamlErrorDocuments}, read errors ${result.summary.readErrorDocuments}, structure errors ${result.summary.structureErrorDocuments}`);
    console.log('Document categories may overlap.');
    for (const warning of result.warnings) console.log(`WARNING skipped ${warning.locale.toUpperCase()} symlink ${warning.path}; scan is incomplete`);
    for (const doc of result.documents.filter(item => item.error)) console.log(`ERROR ${doc.path}: ${doc.error.kind}: ${doc.error.message}`);
    if (!summaryOnly) {
      for (const doc of result.documents.filter(item => item.fields)) {
        const pending = FIELDS.filter(name => doc.fields[name].state !== 'known');
        if (pending.length) console.log(`REVIEW ${doc.path}: ${pending.map(name => `${name}=${doc.fields[name].state}`).join(', ')}`);
      }
    }
  }
  if (!result.scanComplete) process.exitCode = 2;
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 2; }
}

module.exports = {inspectDocument, inspectField, main, scan, validDate};
