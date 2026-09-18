const matter = require('gray-matter');
const {stripMdx} = require('./generate-llm-wiki');
const {staticRenderer} = require('./llm-wiki-components');

// Keep the manual's established character-based estimate. Code execution and
// diagram study take longer than prose reading and are not estimated here.
const CHARACTERS_PER_MINUTE = 424;

async function readingTime(source, filePath) {
  const [{unified}, {default: remarkParse}, {default: remarkGfm}] = await Promise.all([
    import('unified'), import('remark-parse'), import('remark-gfm'),
  ]);
  const {parseFragment} = require('parse5');
  const omitted = new Set();
  const previousLocale = staticRenderer.locale;
  let rendered;
  try {
    staticRenderer.locale = /[/\\]i18n[/\\]en[/\\]/.test(filePath || '') ? 'en' : 'ko';
    rendered = stripMdx(matter(source).content, {filePath, omitted});
  } finally {
    staticRenderer.locale = previousLocale;
  }
  if (omitted.size) {
    throw new Error(`Cannot estimate omitted content in ${filePath}: ${[...omitted].join(', ')}`);
  }
  const text = [];
  const htmlStack = [];
  const hidden = () => htmlStack.at(-1)?.hidden;
  const htmlText = node => {
    if (node.nodeName === '#text') text.push(node.value);
    for (const child of node.childNodes || []) htmlText(child);
  };
  const consumeHtml = value => {
    const html = value.replace(/<!--[\s\S]*?-->/g, '');
    const tags = /<\/?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
    let offset = 0;
    for (const match of html.matchAll(tags)) {
      if (!hidden()) htmlText(parseFragment(html.slice(offset, match.index)));
      const name = match[1].toLowerCase();
      if (match[0].startsWith('</')) {
        const index = htmlStack.findLastIndex(entry => entry.name === name);
        if (index >= 0) htmlStack.splice(index);
      } else if (!/\/>$/.test(match[0]) && !['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr', 'source', 'area', 'base', 'col', 'embed', 'param', 'track'].includes(name)) {
        const node = parseFragment(match[0]).childNodes[0];
        const attrs = Object.fromEntries((node?.attrs || []).map(a => [a.name, a.value]));
        htmlStack.push({name, hidden: hidden() || ['script', 'style'].includes(name) ||
          'hidden' in attrs || attrs['aria-hidden'] === 'true' ||
          /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(attrs.style || '')});
      }
      offset = match.index + match[0].length;
    }
    if (!hidden()) htmlText(parseFragment(html.slice(offset)));
  };
  const visit = (node, heading = false) => {
    if (['code', 'definition', 'thematicBreak'].includes(node.type)) return;
    if (node.type === 'html') consumeHtml(node.value);
    else if (!hidden() && ['text', 'inlineCode'].includes(node.type)) {
      text.push(heading && node.type === 'text' ? node.value.replace(/\s*\{#[^{}\s]+\}\s*$/, '') : node.value);
    }
    else if (!hidden() && node.type === 'image') text.push(node.alt || '');
    for (const child of node.children || []) visit(child, node.type === 'heading');
  };
  visit(unified().use(remarkParse).use(remarkGfm).parse(rendered));
  const characters = [...text.join('').replace(/[^\p{L}\p{N}]/gu, '')].length;
  return Math.max(1, Math.ceil(characters / CHARACTERS_PER_MINUTE));
}

function frontmatter(source) {
  const match = source.match(/^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Document must have YAML frontmatter');
  return {match, yaml: match[1], newline: source.includes('\r\n') ? '\r\n' : '\n'};
}

function replaceField(source, key, replacement) {
  const {match, yaml, newline} = frontmatter(source);
  const lines = yaml.split(/\r?\n/);
  let start = lines.findIndex(line => line.startsWith(`${key}:`));
  if (start < 0) start = lines.length;
  let end = start + 1;
  while (end < lines.length && !/^[^\s#][^:]*:/.test(lines[end])) end++;
  lines.splice(start, end - start, ...replacement.split('\n'));
  return match[0].replace(yaml, () => lines.join(newline)) + source.slice(match[0].length);
}

function updateContentMetadata(source, date, minutes) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error('Date must be a valid YYYY-MM-DD value');
  }
  if (!Number.isInteger(minutes) || minutes < 1) throw new Error('Reading time must be a positive integer');
  const data = matter(source).data;
  const {yaml} = frontmatter(source);
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex(line => /^last_update:\s*(?:#.*)?$/.test(line));
  let output = source;
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length && !/^[^\s#][^:]*:/.test(lines[end])) end++;
    const section = lines.slice(start, end);
    const depths = section.slice(1).map(line => line.match(/^(\s+)[\w-]+:/)?.[1].length).filter(Number.isInteger);
    const indent = depths.length ? Math.min(...depths) : 2;
    const directDate = new RegExp(`^ {${indent}}date:`);
    const dateLine = section.findIndex(line => directDate.test(line));
    if (dateLine >= 0) section[dateLine] = section[dateLine].replace(/^(\s+date:).*$/, `$1 ${date}`);
    else section.splice(1, 0, `${' '.repeat(indent)}date: ${date}`);
    output = replaceField(output, 'last_update', section.join('\n'));
  } else {
    const yaml = require('js-yaml');
    const previous = data.last_update && typeof data.last_update === 'object' &&
      !(data.last_update instanceof Date) ? data.last_update : {};
    const value = yaml.dump({last_update: {...previous, date}}, {lineWidth: -1}).trimEnd();
    output = replaceField(output, 'last_update', value);
  }
  output = replaceField(output, 'reading_time', `reading_time: ${minutes}`);
  const expected = {...data, last_update: {...(data.last_update && typeof data.last_update === 'object' &&
    !(data.last_update instanceof Date) ? data.last_update : {}), date}, reading_time: minutes};
  const parsed = matter(output).data;
  const actual = {...parsed, last_update: {...parsed.last_update,
    date: parsed.last_update.date instanceof Date ? parsed.last_update.date.toISOString().slice(0, 10) : parsed.last_update.date}};
  require('node:assert/strict').deepEqual(actual, expected, 'Unexpected metadata change; document was not written');
  return output;
}

function writeBatch(updates, io = require('node:fs')) {
  const {randomUUID} = require('node:crypto');
  const staged = [];
  try {
    for (const update of updates) {
      if (update.output === update.source) continue;
      if (io.readFileSync(update.full, 'utf8') !== update.source) throw new Error(`Document changed during review: ${update.full}`);
      const suffix = `.metadata-${randomUUID()}`;
      const entry = {...update, temporary: `${update.full}${suffix}.tmp`, backup: `${update.full}${suffix}.bak`, replaced: false};
      staged.push(entry);
      const options = {flag: 'wx', mode: io.statSync(update.full).mode};
      io.writeFileSync(entry.temporary, update.output, options);
      io.writeFileSync(entry.backup, update.source, options);
    }
    for (const entry of staged) {
      if (io.readFileSync(entry.full, 'utf8') !== entry.source) throw new Error(`Document changed during review: ${entry.full}`);
      io.renameSync(entry.temporary, entry.full);
      entry.replaced = true;
    }
  } catch (error) {
    for (const entry of staged.slice().reverse()) {
      if (!entry.replaced) continue;
      try { io.renameSync(entry.backup, entry.full); }
      catch (restoreError) {
        entry.keepBackup = true;
        error.message += `; restore failed, recovery copy: ${entry.backup} (${restoreError.message})`;
      }
    }
    throw error;
  } finally {
    for (const entry of staged) {
      for (const file of [entry.temporary, ...(!entry.keepBackup ? [entry.backup] : [])]) {
        if (io.existsSync(file)) io.unlinkSync(file);
      }
    }
  }
}

module.exports = {CHARACTERS_PER_MINUTE, readingTime, updateContentMetadata, writeBatch};
