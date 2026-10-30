'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const repair = require('../repair-eks-debugging-artifact.cjs');

const root = path.resolve(__dirname, '../..');
// The frozen commit is the independent preservation reference.
const original = spawnSync('git', ['show', `a5bc624:${repair.STATIC}/assets/${repair.OLD_NAME}`], {
  cwd: root, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
});
if (original.status !== 0) throw new Error('Cannot read pinned historical JS from Git.');
const baselineIndex = `<script src="./assets/${repair.OLD_NAME}"></script>`;
const source = fs.readFileSync(path.join(root, repair.SOURCE), 'utf8');

test('the single correction changes no other published JS bytes', () => {
  const output = repair.prepareRepair(original.stdout, baselineIndex, source);
  assert.equal(output.bundle.replace(repair.NEW_TEXT, repair.OLD_TEXT), original.stdout);
  assert.equal(output.index.replace(repair.NEW_NAME, repair.OLD_NAME), baselineIndex);
  assert.equal(repair.validateRepaired(output.bundle, output.index, source), true);
});

test('a changed historical bundle is refused before a repair', () => {
  assert.throws(() => repair.prepareRepair(original.stdout + '\n', baselineIndex, source), /hash mismatch/);
});

test('missing, duplicate, or old source wording is refused', () => {
  for (const invalid of ['', source + repair.NEW_TEXT, source + repair.OLD_TEXT]) {
    assert.throws(() => repair.prepareRepair(original.stdout, baselineIndex, invalid), /Slide source/);
  }
});

test('missing and duplicate HTML references are refused', () => {
  for (const invalid of ['', baselineIndex + baselineIndex]) {
    assert.throws(() => repair.prepareRepair(original.stdout, invalid, source), /HTML/);
  }
});

test('a different output or stale HTML cannot pass verification', () => {
  const output = repair.prepareRepair(original.stdout, baselineIndex, source);
  assert.throws(() => repair.validateRepaired(output.bundle + '\n', output.index, source), /Published JS/);
  assert.throws(() => repair.validateRepaired(output.bundle, baselineIndex, source), /HTML/);
});

test('actual published source, bundle and index agree', () => {
  const base = path.join(root, repair.STATIC);
  assert.equal(repair.validateRepaired(
    fs.readFileSync(path.join(base, 'assets', repair.NEW_NAME), 'utf8'),
    fs.readFileSync(path.join(base, 'index.html'), 'utf8'), source,
  ), true);
  assert.equal(fs.existsSync(path.join(base, 'assets', repair.OLD_NAME)), false);
});
