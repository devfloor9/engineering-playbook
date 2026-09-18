#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const {readingTime, updateContentMetadata, writeBatch} = require('./doc-metadata');

const root = path.resolve(__dirname, '..');

async function main(args = process.argv.slice(2), {workspace = root} = {}) {
  const options = {apply: false};
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') options.apply = true;
    else if (['--kind', '--date'].includes(args[i])) options[args[i].slice(2)] = args[++i];
    else if (args[i].startsWith('--')) throw new Error(`Unknown option: ${args[i]}`);
    else files.push(args[i]);
  }
  if (!files.length || !['content', 'presentation'].includes(options.kind)) {
    throw new Error('Usage: node scripts/update-doc-metadata.js --kind content --date YYYY-MM-DD [--apply] <document>...\nUse --kind presentation for a change that leaves the article content unchanged.');
  }
  if (options.kind === 'content' && !options.date) throw new Error('Content edits require an explicit --date');
  const updates = [];
  for (const file of [...new Set(files)]) {
    const full = path.resolve(workspace, file);
    const relative = path.relative(workspace, full).replaceAll(path.sep, '/');
    if (!/^(docs\/|i18n\/en\/docusaurus-plugin-content-docs\/current\/).+\.mdx?$/.test(relative)) {
      throw new Error(`Not a documentation source: ${file}`);
    }
    const realRelative = path.relative(fs.realpathSync(workspace), fs.realpathSync(full)).replaceAll(path.sep, '/');
    if (realRelative !== relative) throw new Error(`Symlinked document paths require review: ${file}`);
    const source = fs.readFileSync(full, 'utf8');
    const minutes = options.kind === 'content' ? await readingTime(source, full) : null;
    const output = options.kind === 'content' ? updateContentMetadata(source, options.date, minutes) : source;
    updates.push({full, source, output});
    console.log(options.kind === 'presentation'
      ? `Preserved article metadata: ${relative}`
      : `${options.apply ? 'Update' : 'Would update'} ${relative}: ${options.date}, ${minutes} min read`);
  }
  // Calculate the complete batch before writing, so an unsupported component or
  // invalid argument cannot leave earlier documents partially updated.
  if (options.apply) writeBatch(updates);
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = {main};
