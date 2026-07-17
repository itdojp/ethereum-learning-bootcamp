#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  Etherscan,
  ETHERSCAN_V2_API_URL
} = require('@nomicfoundation/hardhat-verify/internal/etherscan');

const root = process.cwd();
const workflowPath = path.join(root, '.github/workflows/deploy.yml');
const configPath = path.join(root, 'hardhat.config.ts');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const config = fs.readFileSync(configPath, 'utf8');
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function runBlocks(yaml) {
  const lines = yaml.split(/\r?\n/u);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)run:\s*(.*)$/u);
    if (!match) continue;
    const indentation = match[1].length;
    const block = [match[2]];
    while (index + 1 < lines.length) {
      const next = lines[index + 1];
      if (next.trim() && next.match(/^\s*/u)[0].length <= indentation) break;
      index += 1;
      block.push(next);
    }
    blocks.push(block.join('\n'));
  }
  return blocks;
}

function permissionBlock(yaml, indentation) {
  const lines = yaml.split(/\r?\n/u);
  const prefix = ' '.repeat(indentation);
  const start = lines.findIndex((line) => line === `${prefix}permissions:`);
  if (start < 0) return null;

  const entries = Object.create(null);
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const leading = line.match(/^\s*/u)[0].length;
    if (leading <= indentation) break;
    const match = line.match(new RegExp(`^\\s{${indentation + 2}}([a-z-]+):\\s*(read|write|none)\\s*$`, 'u'));
    if (!match || Object.hasOwn(entries, match[1])) return null;
    entries[match[1]] = match[2];
  }
  return entries;
}

function hasExactPermissions(actual, expected) {
  if (!actual) return false;
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index] && actual[key] === expected[key])
  );
}

for (const block of runBlocks(workflow)) {
  check(
    !/\$\{\{\s*(?:github\.event\.)?inputs\./u.test(block),
    'deploy workflow must not interpolate workflow inputs directly into run: shell source'
  );
}

check(/default:\s*sepolia(?:\s|$)/u.test(workflow), 'deploy default network must be sepolia');
for (const network of ['sepolia', 'optimismSepolia', 'mainnet', 'optimism']) {
  check(workflow.includes(`- ${network}`), `deploy network choices must include ${network}`);
}
const validateJob = workflow.match(/^  validate:\s*$([\s\S]*?)(?=^  deploy:\s*$)/mu)?.[1] || '';
const deployJob = workflow.match(/^  deploy:\s*$([\s\S]*)/mu)?.[1] || '';
check(hasExactPermissions(permissionBlock(workflow, 0), { contents: 'read' }), 'workflow default permissions must declare contents: read only');
check(permissionBlock(validateJob, 4) === null, 'validate job must inherit the contents-only workflow permission');
check(hasExactPermissions(permissionBlock(deployJob, 4), {
  actions: 'read',
  contents: 'read',
  deployments: 'write'
}), 'deploy job requires exactly actions: read, contents: read, and deployments: write');
check(/INPUT_PRODUCTION_CONFIRMATION:\s*\$\{\{\s*inputs\.production_confirmation\s*\}\}/u.test(deployJob), 'deploy job must revalidate the operator-provided production confirmation');
check(!/INPUT_PRODUCTION_CONFIRMATION:\s*DEPLOY_PRODUCTION/u.test(deployJob), 'deploy job must not substitute a hard-coded production confirmation');
check(/concurrency:/u.test(workflow), 'deploy job must define concurrency');
check(/production_confirmation:/u.test(workflow), 'production confirmation input is required');
check(/needs\.validate\.outputs\.environment/u.test(workflow), 'deploy environment must come from validated output');
check(/rpc_environment_variable:\s*\$\{\{\s*steps\.inputs\.outputs\.rpc_environment_variable\s*\}\}/u.test(workflow), 'validate job must expose the policy-derived RPC environment variable');
check(/RPC_ENVIRONMENT_VARIABLE:\s*\$\{\{\s*needs\.validate\.outputs\.rpc_environment_variable\s*\}\}/u.test(workflow), 'deploy job must consume the policy-derived RPC environment variable');
check(/export "\$RPC_ENVIRONMENT_VARIABLE=\$RPC_URL"/u.test(workflow), 'deploy step must export the policy-derived RPC environment variable');
check(!/case\s+"\$TARGET_NETWORK"/u.test(workflow), 'deploy step must not duplicate the validator network-to-RPC mapping');
check(/if:\s*github\.ref\s*==\s*'refs\/heads\/main'/u.test(workflow), 'deploy job must fail closed outside main');
check(/check-deployment-environment\.cjs/u.test(workflow), 'deploy job must verify repository Environment protections before loading secrets');
check(/secrets\[needs\.validate\.outputs\.rpc_secret_name\]/u.test(workflow), 'RPC secret must use a validated network-specific name');
check(/secrets\[needs\.validate\.outputs\.private_key_secret_name\]/u.test(workflow), 'private-key secret must use a validated network-specific name');
check(!/secrets\.[A-Za-z0-9_]*ETHERSCAN/u.test(workflow), 'deploy workflow must not load Explorer API keys');

for (const match of workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gmu)) {
  const reference = match[1];
  if (reference.startsWith('./')) continue;
  const at = reference.lastIndexOf('@');
  check(at > 0 && /^[0-9a-f]{40}$/u.test(reference.slice(at + 1)), `action must use a full commit SHA: ${reference}`);
}

const forbiddenV1EtherscanEndpoint = /https?:\/\/api(?:-[a-z0-9-]+)?\.etherscan\.io\/api(?:\b|[/?#])/iu;
const forbiddenKey = ['OPTIMISTIC_', 'ETHERSCAN_API_KEY'].join('');
const ignoredDirectories = new Set(['.git', 'node_modules', 'artifacts', 'cache', 'coverage', 'dist', 'typechain-types']);

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
    } else if (entry.isFile()) {
      let contents;
      try {
        contents = fs.readFileSync(absolute, 'utf8');
      } catch {
        continue;
      }
      const relative = path.relative(root, absolute);
      check(!forbiddenV1EtherscanEndpoint.test(contents), `${relative}: legacy Etherscan V1 endpoint is forbidden`);
      check(!contents.includes(forbiddenKey), `${relative}: chain-specific Etherscan key name is forbidden`);
    }
  }
}

walk(root);

check(/etherscan:\s*\{[\s\S]*?apiKey:\s*process\.env\.ETHERSCAN_API_KEY\s*\|\|\s*''/u.test(config), 'Hardhat must configure one Etherscan V2 API key string');
check(!/apiKey:\s*\{/u.test(config), 'network-specific Etherscan key maps are forbidden');

try {
  const instance = Etherscan.fromChainConfig('fixture-key', {
    network: 'optimisticEthereum',
    chainId: 10,
    urls: {
      apiURL: 'https://unused.invalid/api',
      browserURL: 'https://optimistic.etherscan.io'
    }
  });
  assert.equal(instance.apiUrl, ETHERSCAN_V2_API_URL);
  assert.equal(instance.chainId, 10);
} catch (error) {
  errors.push(`hardhat-verify V2 runtime contract failed: ${error.message}`);
}

const verify = spawnSync(process.execPath, [
  require.resolve('hardhat/internal/cli/cli'),
  'verify',
  '--list-networks'
], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, HARDHAT_DISABLE_TELEMETRY_PROMPT: 'true' }
});

if (verify.status !== 0) {
  errors.push(`hardhat verify --list-networks failed: ${verify.stderr || verify.stdout}`);
} else {
  check(/optimisticEthereum\s+│\s+10/u.test(verify.stdout), 'Hardhat verify must resolve Optimism mainnet chain id 10');
  check(/optimismSepolia\s+│\s+11155420/u.test(verify.stdout), 'Hardhat verify must resolve Optimism Sepolia chain id 11155420');
  check(/sepolia\s+│\s+11155111/u.test(verify.stdout), 'Hardhat verify must resolve Sepolia chain id 11155111');
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
check(
  pkg.devDependencies?.['@nomicfoundation/hardhat-verify'] === '2.1.3',
  '@nomicfoundation/hardhat-verify must be an explicit exact dependency at 2.1.3'
);

if (errors.length) {
  console.error('Deploy and Etherscan safety check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deploy and Etherscan safety check passed.');
console.log(`Etherscan endpoint: ${ETHERSCAN_V2_API_URL}`);
console.log('Resolved chains: Sepolia (11155111), Optimism Sepolia (11155420), Optimism (10).');
