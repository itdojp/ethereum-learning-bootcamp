#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

const expectedOverrides = {
  'adm-zip': '0.6.0',
  'serialize-javascript': '7.0.7',
  tmp: '0.2.7'
};

assert.deepEqual(pkg.overrides, expectedOverrides, 'dependency overrides must remain minimal and exact');

for (const [name, version] of Object.entries(expectedOverrides)) {
  assert.equal(
    lock.packages[`node_modules/${name}`]?.version,
    version,
    `${name} must resolve to the reviewed override version`
  );
}

assert.equal(
  lock.packages['node_modules/hardhat']?.dependencies?.['adm-zip'],
  '^0.4.16',
  'update the compatibility review when Hardhat changes its adm-zip dependency range'
);
assert.equal(lock.packages['node_modules/keccak'], undefined, 'legacy keccak install path must stay removed');
assert.equal(
  lock.packages['node_modules/secp256k1'],
  undefined,
  'legacy secp256k1 install path must stay removed'
);

const AdmZip = require('adm-zip');
const scratch = fs.mkdtempSync(path.join(root, '.hardhat-adm-zip-compat-'));
try {
  const archivePath = path.join(scratch, 'compiler.zip');
  const extractionPath = path.join(scratch, 'compiler');
  const archive = new AdmZip();
  archive.addFile('solc.exe', Buffer.from('reviewed-compiler-fixture\n'));
  archive.writeZip(archivePath);

  const downloadedArchive = new AdmZip(archivePath);
  downloadedArchive.extractAllTo(extractionPath);
  assert.equal(
    fs.readFileSync(path.join(extractionPath, 'solc.exe'), 'utf8'),
    'reviewed-compiler-fixture\n',
    'adm-zip 0.6.0 must preserve the constructor and extractAllTo API used by Hardhat'
  );
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

const serialize = require('serialize-javascript');
const serialized = serialize({ closingTag: '</script>', lineSeparators: '\u2028\u2029' });
assert.equal(
  serialized.includes('</script>'),
  false,
  'serialize-javascript must escape a closing script tag in the reporter serialization path'
);
assert.deepEqual(
  Function(`"use strict"; return (${serialized});`)(),
  { closingTag: '</script>', lineSeparators: '\u2028\u2029' },
  'serialize-javascript 7.0.7 output must remain executable and lossless'
);
const mochaSerialized = serialize(
  { grep: /reviewed/u, ignoredCallback: () => 'not serialized', jobs: 2 },
  { unsafe: true, ignoreFunction: true }
);
const mochaOptions = Function(`"use strict"; return (${mochaSerialized});`)();
assert.equal(mochaOptions.grep.source, 'reviewed', 'Mocha parallel-worker RegExp options must round-trip');
assert.equal(mochaOptions.grep.flags, 'u', 'Mocha parallel-worker RegExp flags must round-trip');
assert.equal(mochaOptions.jobs, 2, 'Mocha parallel-worker scalar options must round-trip');
assert.equal(
  Object.hasOwn(mochaOptions, 'ignoredCallback'),
  false,
  'Mocha ignoreFunction=true must omit callback options'
);

const previousTmpdir = process.env.TMPDIR;
const reviewedTmpdir = fs.mkdtempSync(path.join(root, '.solc-tmp-compat-'));
process.env.TMPDIR = reviewedTmpdir;
const tmp = require('tmp');
const temporaryFile = tmp.fileSync({ prefix: 'compiler-' });
try {
  fs.writeFileSync(temporaryFile.name, 'reviewed-solc-fixture\n');
  assert.equal(
    fs.readFileSync(temporaryFile.name, 'utf8'),
    'reviewed-solc-fixture\n',
    'tmp 0.2.7 must preserve the synchronous temporary-file lifecycle used by build tooling'
  );
} finally {
  temporaryFile.removeCallback();
  fs.rmSync(reviewedTmpdir, { recursive: true, force: true });
  if (previousTmpdir === undefined) delete process.env.TMPDIR;
  else process.env.TMPDIR = previousTmpdir;
}

console.log('Dependency compatibility check passed.');
console.log('Reviewed overrides: adm-zip 0.6.0, serialize-javascript 7.0.7, tmp 0.2.7.');
console.log('Legacy native install paths removed: keccak, secp256k1.');
