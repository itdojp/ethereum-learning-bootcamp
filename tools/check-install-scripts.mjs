#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const errors = [];
const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const inventories = [
  {
    name: 'root',
    lockfile: 'package-lock.json',
    approved: new Map([
      ['node_modules/esbuild', {
        version: '0.28.1',
        optional: false,
        resolved: 'https://registry.npmjs.org/esbuild/-/esbuild-0.28.1.tgz',
        integrity: 'sha512-HrJrvZv5ayxBzPfwphOoNzkzOIIlifzk0KJrGK2c8R4+LKpMtpYLQeUdjnwjWv/LZlkH2laZk+4w78pi99D4Vw=='
      }],
      ['node_modules/fsevents', {
        version: '2.3.3',
        optional: true,
        resolved: 'https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz',
        integrity: 'sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw=='
      }]
    ]),
    forbidden: ['node_modules/keccak', 'node_modules/secp256k1']
  },
  {
    name: 'dapp',
    lockfile: 'dapp/package-lock.json',
    approved: new Map([
      ['node_modules/esbuild', {
        version: '0.27.2',
        optional: false,
        resolved: 'https://registry.npmjs.org/esbuild/-/esbuild-0.27.2.tgz',
        integrity: 'sha512-HyNQImnsOC7X9PMNaCIeAm4ISCQXs5a5YasTXVliKv4uuBo1dKrG0A+uQS8M5eXjVMnLg3WgXaKvprHlFJQffw=='
      }],
      ['node_modules/fsevents', {
        version: '2.3.3',
        optional: true,
        resolved: 'https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz',
        integrity: 'sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw=='
      }]
    ]),
    forbidden: []
  }
];

for (const inventory of inventories) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, inventory.lockfile), 'utf8'));
  const actual = Object.entries(lock.packages)
    .filter(([, metadata]) => metadata.hasInstallScript === true)
    .map(([packagePath, metadata]) => ({
      packagePath,
      version: metadata.version,
      optional: metadata.optional === true,
      resolved: metadata.resolved,
      integrity: metadata.integrity
    }))
    .sort((a, b) => a.packagePath.localeCompare(b.packagePath));

  for (const entry of actual) {
    const expected = inventory.approved.get(entry.packagePath);
    if (!expected) {
      errors.push(
        `${inventory.name}: ${entry.packagePath}@${entry.version} has an unreviewed install script`
      );
      continue;
    }
    if (
      entry.version !== expected.version ||
      entry.optional !== expected.optional ||
      entry.resolved !== expected.resolved ||
      entry.integrity !== expected.integrity
    ) {
      errors.push(
        `${inventory.name}: ${entry.packagePath}: expected ${expected.version} ` +
        `optional=${expected.optional} with reviewed registry artifact, got ${entry.version} ` +
        `optional=${entry.optional}`
      );
    }
  }

  for (const [packagePath, expected] of inventory.approved) {
    if (!actual.some((entry) => entry.packagePath === packagePath)) {
      errors.push(
        `${inventory.name}: ${packagePath}@${expected.version} is missing from the locked inventory`
      );
    }
  }

  for (const forbidden of inventory.forbidden) {
    if (lock.packages[forbidden] !== undefined) {
      errors.push(`${inventory.name}: ${forbidden} must not return without an explicit policy review`);
    }
  }
}

function checkWorkflowInstallOrder(relative, expectedInstallCount) {
  const workflow = fs.readFileSync(path.join(root, relative), 'utf8');
  const installPattern = /run:\s+npm ci --ignore-scripts/gu;
  const installs = [...workflow.matchAll(installPattern)].map((match) => match.index);
  if (installs.length !== expectedInstallCount) {
    errors.push(`${relative}: expected ${expectedInstallCount} reviewed npm ci steps, got ${installs.length}`);
  }
  if (/run:\s+npm ci(?! --ignore-scripts)/u.test(workflow)) {
    errors.push(`${relative}: npm ci must not execute lifecycle scripts`);
  }

  installs.forEach((installIndex, index) => {
    const previousInstall = index === 0 ? -1 : installs[index - 1];
    const nextInstall = installs[index + 1] ?? workflow.length;
    const policyIndex = workflow.lastIndexOf('run: node tools/check-install-scripts.mjs', installIndex);
    const rebuildIndex = workflow.indexOf('run: npm rebuild esbuild', installIndex);
    if (policyIndex <= previousInstall) {
      errors.push(`${relative}: install ${index + 1} is not preceded by the lockfile policy check`);
    }
    if (rebuildIndex <= installIndex || rebuildIndex >= nextInstall) {
      errors.push(`${relative}: install ${index + 1} is not followed by the reviewed esbuild rebuild`);
    }
  });
}

checkWorkflowInstallOrder('.github/workflows/test.yml', 3);
checkWorkflowInstallOrder('.github/workflows/deploy.yml', 2);

const expectedRootInstall =
  'node tools/check-install-scripts.mjs && npm ci --ignore-scripts && npm rebuild esbuild';
const expectedDappInstall =
  'node tools/check-install-scripts.mjs && npm --prefix dapp ci --ignore-scripts && npm --prefix dapp rebuild esbuild';
if (packageJson.scripts?.['install:reviewed'] !== expectedRootInstall) {
  errors.push('package.json: install:reviewed must preserve policy → ignore-scripts → esbuild order');
}
if (packageJson.scripts?.['dapp:ci:safe'] !== expectedDappInstall) {
  errors.push('package.json: dapp:ci:safe must preserve policy → ignore-scripts → esbuild order');
}

if (errors.length > 0) {
  console.error('Install-script policy check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Install-script policy check passed.');
console.log('Root: esbuild 0.28.1; optional macOS fsevents 2.3.3.');
console.log('Dapp: esbuild 0.27.2; optional macOS fsevents 2.3.3.');
