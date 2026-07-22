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

function check(condition, message) {
  if (!condition) errors.push(message);
}

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const dappLock = readJson('dapp/package-lock.json');
const config = readText('hardhat.config.ts');
const readme = readText('README.md');
const rootLock = lock.packages?.[''];

const exactDevDependencies = {
  hardhat: '3.11.0',
  '@nomicfoundation/hardhat-ethers': '4.0.15',
  '@nomicfoundation/hardhat-ethers-chai-matchers': '3.0.11',
  '@nomicfoundation/hardhat-mocha': '3.0.21',
  '@nomicfoundation/hardhat-typechain': '3.1.1',
  '@nomicfoundation/hardhat-verify': '3.0.21',
  ethers: '6.17.0',
  chai: '6.2.2',
  mocha: '11.7.6',
  solc: '0.8.24',
  typescript: '5.9.3'
};

check(pkg.type === 'module', 'package.json must declare type=module for Hardhat 3');
check(pkg.engines?.node === '>=22.13.0', 'package.json must require Node.js >=22.13.0');

for (const [name, version] of Object.entries(exactDevDependencies)) {
  check(pkg.devDependencies?.[name] === version, `${name} must be exact ${version} in package.json`);
  check(
    rootLock?.devDependencies?.[name] === version,
    `${name} must be exact ${version} in package-lock root metadata`
  );
  check(lock.packages?.[`node_modules/${name}`]?.version === version, `${name} must lock to ${version}`);
}

check(
  pkg.dependencies?.['@openzeppelin/contracts'] === '5.0.2' &&
    rootLock?.dependencies?.['@openzeppelin/contracts'] === '5.0.2',
  'OpenZeppelin Contracts must be exact 5.0.2 in package and lock metadata'
);
check(
  lock.packages?.['node_modules/@openzeppelin/contracts']?.version === '5.0.2',
  'OpenZeppelin Contracts must remain locked to 5.0.2'
);
check(
  dappLock.packages?.['node_modules/vite']?.engines?.node === '^20.19.0 || >=22.12.0',
  'review the root Node.js minimum when the locked Vite engine changes'
);

for (const removed of [
  '@nomicfoundation/hardhat-toolbox',
  'hardhat-gas-reporter',
  'solidity-coverage',
  'ts-node'
]) {
  check(pkg.devDependencies?.[removed] === undefined, `${removed} must stay removed from direct dependencies`);
}

check(/defineConfig\s*\(/u.test(config), 'hardhat.config.ts must use defineConfig');
check(/plugins:\s*\[/u.test(config), 'hardhat.config.ts must declare plugins explicitly');
check(
  /path:\s*fileURLToPath\(import\.meta\.resolve\(['"]solc\/soljson\.js['"]\)\)/u.test(config),
  'hardhat.config.ts must use the locked local solc-js path'
);
check(/version:\s*['"]0\.8\.24['"]/u.test(config), 'Hardhat must compile with Solidity 0.8.24');
check(
  /hardhatMainnet:\s*\{\s*type:\s*['"]edr-simulated['"],\s*chainType:\s*['"]l1['"]\s*\}/u.test(config),
  'Hardhat 3 must declare an explicit local EDR L1 network'
);
check(
  /polygonZk:\s*\{[\s\S]*?type:\s*['"]http['"][\s\S]*?chainType:\s*['"]generic['"][\s\S]*?chainId:\s*1101/u.test(config),
  'Polygon zkEVM must match Hardhat chain 1101 with chainType=generic'
);
check(readme.includes('Hardhat 3.11.0'), 'README must state the audited Hardhat version');
check(readme.includes('Node.js 22.13.0'), 'README must state the minimum Node.js version');
check(readme.includes('Solidity 0.8.24'), 'README must state the Solidity version');

if (errors.length > 0) {
  console.error('Toolchain consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Toolchain consistency check passed.');
console.log('Node.js: >=22.13.0');
console.log('Hardhat: 3.11.0');
console.log('Solidity compiler: 0.8.24 (locked local solc-js)');
console.log('OpenZeppelin Contracts: 5.0.2');
