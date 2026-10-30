'use strict';

// A single audited text repair, not a replacement/bundling utility.
// This preserves every other byte of the historical published JS and CSS.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const OLD_NAME = 'index-D-mWz1Nz.js';
const OLD_HASH = 'b607edbacfc31734dc80c11446fc5b55de28a997d968ced47cdcbc709d894c63';
const NEW_HASH = 'dcd93abe78cebbd28a7d0e1fc96376c4270bb2d5f38c2098396bf45c2c60d2b4';
const NEW_NAME = `index-audit-${NEW_HASH.slice(0, 8)}.js`;
const OLD_TEXT = 'Nitro: 타입별 상이 (최대 128개)';
const NEW_TEXT = 'Nitro: 타입·크기별 상이 (공유 또는 전용 한도)';
const SOURCE = 'slides/eks-debugging/src/slides/40-PvcFailures.tsx';
const STATIC = 'static/slides/eks-debugging';

const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const count = (text, value) => text.split(value).length - 1;

function validateSource(source) {
  if (count(source, NEW_TEXT) !== 1 || source.includes(OLD_TEXT)) {
    throw new Error('Slide source does not contain exactly the audited replacement.');
  }
}

function prepareRepair(bundle, index, source) {
  validateSource(source);
  if (digest(bundle) !== OLD_HASH) throw new Error('Historical JS hash mismatch; no files changed.');
  if (count(bundle, OLD_TEXT) !== 1 || bundle.includes(NEW_TEXT)) {
    throw new Error('Historical JS does not contain exactly one audited defect.');
  }
  if (/sourceMappingURL/.test(bundle)) {
    throw new Error('Historical JS has a source map; refuse an unpaired repair.');
  }
  if (count(index, `./assets/${OLD_NAME}`) !== 1 || index.includes(NEW_NAME)) {
    throw new Error('HTML does not reference exactly the expected historical JS.');
  }
  const output = bundle.replace(OLD_TEXT, NEW_TEXT);
  if (digest(output) !== NEW_HASH) throw new Error('Replacement changed bytes outside the audited text.');
  return {bundle: output, index: index.replace(OLD_NAME, NEW_NAME)};
}

function validateRepaired(bundle, index, source) {
  validateSource(source);
  if (digest(bundle) !== NEW_HASH || count(bundle, NEW_TEXT) !== 1 || bundle.includes(OLD_TEXT)) {
    throw new Error('Published JS does not match the audited repair.');
  }
  if (count(index, `./assets/${NEW_NAME}`) !== 1 || index.includes(OLD_NAME)) {
    throw new Error('HTML does not reference exactly the audited content hash.');
  }
  if (/sourceMappingURL/.test(bundle)) throw new Error('Published JS has an unmatched source map.');
  return true;
}

function main(args = process.argv.slice(2), root = path.resolve(__dirname, '..')) {
  if (args.length !== 1 || !['--apply', '--check'].includes(args[0])) {
    throw new Error('Usage: node scripts/repair-eks-debugging-artifact.cjs --apply|--check');
  }
  const base = path.join(root, STATIC);
  const oldFile = path.join(base, 'assets', OLD_NAME);
  const newFile = path.join(base, 'assets', NEW_NAME);
  const indexFile = path.join(base, 'index.html');
  const source = fs.readFileSync(path.join(root, SOURCE), 'utf8');
  const index = fs.readFileSync(indexFile, 'utf8');
  if (args[0] === '--check') {
    validateRepaired(fs.readFileSync(newFile, 'utf8'), index, source);
    if (fs.existsSync(oldFile)) throw new Error('Obsolete defective JS remains in publication.');
    console.log('Published storage-slide text matches source; all other historical JS bytes are preserved.');
    return;
  }
  if (fs.existsSync(newFile)) throw new Error('Destination exists; refusing to overwrite another artifact.');
  const output = prepareRepair(fs.readFileSync(oldFile, 'utf8'), index, source);
  // Both output values are fully validated before the first write.
  fs.writeFileSync(newFile, output.bundle, {encoding: 'utf8', flag: 'wx'});
  fs.writeFileSync(indexFile, output.index, 'utf8');
  fs.unlinkSync(oldFile);
  console.log(`Replaced the audited text only: ${OLD_NAME} -> ${NEW_NAME}`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {
  prepareRepair, validateRepaired, validateSource, main,
  OLD_NAME, NEW_NAME, OLD_HASH, NEW_HASH, OLD_TEXT, NEW_TEXT, SOURCE, STATIC,
};
