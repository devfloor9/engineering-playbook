'use strict';

// These suites extract reviewed examples and substitute offline test doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const directory = path.join(__dirname, 'tests', 'document-examples');
const files = fs.readdirSync(directory).sort();
const javascript = files.filter(file => file.endsWith('.test.cjs'));
const python = files.filter(file => /^test_.*\.py$/.test(file));
assert.ok(javascript.length && python.length, 'Expected both JavaScript and Python example checks');

const commands = [
  [process.execPath, '--test', ...javascript.map(file => path.join(directory, file))],
  ...python.map(file => ['python3', path.join(directory, file)]),
];
for (const [command, ...args] of commands) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: {...process.env, PYTHONDONTWRITEBYTECODE: '1'},
    timeout: 60_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
