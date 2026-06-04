#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function readText(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function fail(label, detail) {
  errors.push(`${label}: ${detail}`);
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    fail(label, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function expectPattern(label, actual, pattern, expectedDescription) {
  if (typeof actual !== 'string' || !pattern.test(actual)) {
    fail(label, `expected ${expectedDescription}, got ${JSON.stringify(actual)}`);
  }
}

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const hardhatConfig = readText('hardhat.config.ts');
const readme = readText('README.md');

const solidityVersionMatch = hardhatConfig.match(/solidity:\s*\{[\s\S]*?version:\s*['"]([^'"]+)['"]/m);
if (!solidityVersionMatch) {
  fail('hardhat.config.ts solidity.version', 'could not find a configured Solidity version');
}

const solidityVersion = solidityVersionMatch && solidityVersionMatch[1];
const rootLock = lock.packages && lock.packages[''];
const lockedSolc = lock.packages && lock.packages['node_modules/solc'];
const lockedHardhat = lock.packages && lock.packages['node_modules/hardhat'];
const lockedOpenZeppelin = lock.packages && lock.packages['node_modules/@openzeppelin/contracts'];

if (solidityVersion) {
  expectEqual('package.json devDependencies.solc', pkg.devDependencies && pkg.devDependencies.solc, solidityVersion);
  expectEqual(
    'package-lock.json packages[""].devDependencies.solc',
    rootLock && rootLock.devDependencies && rootLock.devDependencies.solc,
    solidityVersion
  );
  expectEqual('package-lock.json node_modules/solc.version', lockedSolc && lockedSolc.version, solidityVersion);
  if (!readme.includes(`Solidity ${solidityVersion}`)) {
    fail('README.md Solidity version', `expected README to mention "Solidity ${solidityVersion}"`);
  }
}

expectPattern(
  'package.json devDependencies.hardhat',
  pkg.devDependencies && pkg.devDependencies.hardhat,
  /^\^?2\./,
  'a Hardhat 2.x range'
);
expectPattern(
  'package-lock.json node_modules/hardhat.version',
  lockedHardhat && lockedHardhat.version,
  /^2\./,
  'a Hardhat 2.x version'
);
expectEqual(
  'package-lock.json node_modules/@openzeppelin/contracts.version',
  lockedOpenZeppelin && lockedOpenZeppelin.version,
  '5.0.2'
);

if (errors.length) {
  console.error('Toolchain consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Toolchain consistency check passed.');
console.log(`Hardhat: ${lockedHardhat.version}`);
console.log(`Solidity compiler: ${solidityVersion}`);
console.log(`OpenZeppelin Contracts: ${lockedOpenZeppelin.version}`);
