#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const workflowPath = path.join(root, '.github/workflows/deploy.yml');
const testWorkflowPath = path.join(root, '.github/workflows/test.yml');
const configPath = path.join(root, 'hardhat.config.ts');
const deployScriptPath = path.join(root, 'scripts/deploy-generic.ts');
const day07Path = path.join(root, 'docs/curriculum/Day07_Deploy_CI.md');
const day08Path = path.join(root, 'docs/curriculum/Day08_L2_Rollups.md');
const ciAppendixPath = path.join(root, 'docs/appendix/ci-github-actions.md');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const testWorkflow = fs.readFileSync(testWorkflowPath, 'utf8');
const config = fs.readFileSync(configPath, 'utf8');
const deployScript = fs.readFileSync(deployScriptPath, 'utf8');
const day07 = fs.readFileSync(day07Path, 'utf8');
const day08 = fs.readFileSync(day08Path, 'utf8');
const ciAppendix = fs.readFileSync(ciAppendixPath, 'utf8');
const errors = [];
let Etherscan;
let ETHERSCAN_V2_API_URL;

try {
  ({ Etherscan, ETHERSCAN_V2_API_URL } = require('@nomicfoundation/hardhat-verify/internal/etherscan'));
} catch (error) {
  errors.push(`hardhat-verify V2 contract import failed: ${error.message}`);
}

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

function hasPermissionDeclaration(yaml, indentation) {
  const prefix = ' '.repeat(indentation);
  return yaml.split(/\r?\n/u).some((line) =>
    new RegExp(`^${prefix}permissions\\s*:`, 'u').test(line)
  );
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
const networkInput = workflow.match(/^      network:\s*$[\s\S]*?(?=^      contract:\s*$)/mu)?.[0] || '';
const networkChoices = [...networkInput.matchAll(/^\s+-\s+([A-Za-z0-9_-]+)\s*$/gmu)]
  .map((match) => match[1]);
check(
  JSON.stringify(networkChoices) === JSON.stringify(['sepolia', 'optimismSepolia']),
  `deploy network choices must be exactly sepolia, optimismSepolia; got ${networkChoices.join(', ')}`
);
const validateJob = workflow.match(/^  validate:\s*$([\s\S]*?)(?=^  deploy:\s*$)/mu)?.[1] || '';
const deployJob = workflow.match(/^  deploy:\s*$([\s\S]*)/mu)?.[1] || '';
check(hasExactPermissions(permissionBlock(workflow, 0), { contents: 'read' }), 'workflow default permissions must declare contents: read only');
check(!hasPermissionDeclaration(validateJob, 4), 'validate job must inherit the contents-only workflow permission');
check(hasExactPermissions(permissionBlock(deployJob, 4), {
  actions: 'read',
  contents: 'read',
  deployments: 'write'
}), 'deploy job requires exactly actions: read, contents: read, and deployments: write');
check(!/production_confirmation/u.test(workflow), 'testnet-only deploy workflow must not declare a production confirmation input');
check(!/DEPLOY_PRODUCTION/u.test(workflow), 'testnet-only deploy workflow must not contain a production confirmation bypass');
check(/concurrency:/u.test(workflow), 'deploy job must define concurrency');
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
check(
  /process\.env\.CONTRACT\s*\?\?\s*['"]Hello['"]/u.test(deployScript),
  'deploy script must default CONTRACT only when the variable is absent'
);
check(
  /process\.env\.ARGS_JSON\s*\?\?\s*['"]\[\]['"]/u.test(deployScript),
  'deploy script must default ARGS_JSON only when the variable is absent'
);
check(
  day07.includes('GitHub Actions から本番 network へ deploy しない') &&
    ciAppendix.includes('GitHub Actions から本番 network へ deploy しない'),
  'deployment guidance must declare the testnet-only GitHub Actions boundary'
);
check(
  day07.includes('本番用 private key を GitHub Secrets に保存しない') &&
    ciAppendix.includes('本番用 private key を GitHub Secrets に保存しない'),
  'deployment guidance must forbid production private keys in GitHub Secrets'
);
check(
  !/(?:mainnet|optimism)\s*:\s*\{[^}\n]*accounts:\s*\[process\.env\.PRIVATE_KEY/u.test(day08),
  'Day08 must not reconnect a production network to PRIVATE_KEY'
);
for (const [name, contents] of [
  ['deploy workflow', workflow],
  ['Day07', day07],
  ['CI appendix', ciAppendix]
]) {
  check(
    !/DEPLOY_(?:MAINNET|OPTIMISM)_(?:RPC_URL|PRIVATE_KEY)/u.test(contents),
    `${name} must not declare production deployment secret names`
  );
}

for (const [name, yaml] of [['deploy', workflow], ['test', testWorkflow]]) {
  for (const match of yaml.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gmu)) {
    const reference = match[1];
    if (reference.startsWith('./')) continue;
    const at = reference.lastIndexOf('@');
    check(
      at > 0 && /^[0-9a-f]{40}$/u.test(reference.slice(at + 1)),
      `${name} action must use a full commit SHA: ${reference}`
    );
  }
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
      if (relative.endsWith('.md')) {
        check(
          !/npx\s+hardhat\s+run\s+scripts\/(?:deploy|measure)[^\n]*--network\s+(?:mainnet|optimism)(?:\s|$)/u.test(contents),
          `${relative}: repository deploy/measure scripts must not target a production network`
        );
        check(
          !/DEPLOY_(?:MAINNET|OPTIMISM)_(?:RPC_URL|PRIVATE_KEY)/u.test(contents),
          `${relative}: production deployment secret names are forbidden`
        );
      }
    }
  }
}

walk(root);

check(/etherscan:\s*\{[\s\S]*?apiKey:\s*process\.env\.ETHERSCAN_API_KEY\s*\|\|\s*''/u.test(config), 'Hardhat must configure one Etherscan V2 API key string');
check(!/apiKey:\s*\{/u.test(config), 'network-specific Etherscan key maps are forbidden');
check(
  /mainnet:\s*\{[^}]*accounts:\s*\[\]/u.test(config) &&
    /optimism:\s*\{[^}]*accounts:\s*\[\]/u.test(config),
  'production Hardhat networks must not load signer accounts'
);

try {
  assert.ok(Etherscan && ETHERSCAN_V2_API_URL, 'hardhat-verify V2 contract import is unavailable');
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

const hardhatExecutable = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'hardhat.cmd' : 'hardhat'
);
const verify = spawnSync(hardhatExecutable, [
  'verify',
  '--list-networks'
], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  env: { ...process.env, HARDHAT_DISABLE_TELEMETRY_PROMPT: 'true' }
});

if (verify.error) {
  errors.push(`hardhat verify --list-networks could not start: ${verify.error.message}`);
} else if (verify.status !== 0) {
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
