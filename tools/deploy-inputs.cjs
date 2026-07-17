'use strict';

const NETWORK_POLICIES = Object.freeze({
  sepolia: Object.freeze({
    chainId: 11155111,
    environment: 'deploy-sepolia',
    production: false,
    rpcEnvironmentVariable: 'SEPOLIA_RPC_URL',
    rpcSecretName: 'DEPLOY_SEPOLIA_RPC_URL',
    privateKeySecretName: 'DEPLOY_SEPOLIA_PRIVATE_KEY'
  }),
  optimismSepolia: Object.freeze({
    chainId: 11155420,
    environment: 'deploy-optimism-sepolia',
    production: false,
    rpcEnvironmentVariable: 'OPTIMISM_SEPOLIA_RPC_URL',
    rpcSecretName: 'DEPLOY_OPTIMISM_SEPOLIA_RPC_URL',
    privateKeySecretName: 'DEPLOY_OPTIMISM_SEPOLIA_PRIVATE_KEY'
  }),
  mainnet: Object.freeze({
    chainId: 1,
    environment: 'production-mainnet',
    production: true,
    rpcEnvironmentVariable: 'MAINNET_RPC_URL',
    rpcSecretName: 'DEPLOY_MAINNET_RPC_URL',
    privateKeySecretName: 'DEPLOY_MAINNET_PRIVATE_KEY'
  }),
  optimism: Object.freeze({
    chainId: 10,
    environment: 'production-optimism',
    production: true,
    rpcEnvironmentVariable: 'OPTIMISM_RPC_URL',
    rpcSecretName: 'DEPLOY_OPTIMISM_RPC_URL',
    privateKeySecretName: 'DEPLOY_OPTIMISM_PRIVATE_KEY'
  })
});

const PRODUCTION_CONFIRMATION = 'DEPLOY_PRODUCTION';
// Solidity's lexer permits letters, `_`, or `$` first, followed by digits too.
const SOLIDITY_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/u;
const MAX_ARGS_JSON_BYTES = 8192;
const MAX_ARGS = 32;
const MAX_JSON_DEPTH = 8;

function requireExactString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (value !== value.trim()) {
    throw new Error(`${label} must not contain leading or trailing whitespace`);
  }
  return value;
}

function validateNetwork(value) {
  const network = requireExactString(value, 'network');
  const policy = NETWORK_POLICIES[network];
  if (!policy) {
    throw new Error(`network must be one of: ${Object.keys(NETWORK_POLICIES).join(', ')}`);
  }
  return { network, ...policy };
}

function validateContractName(value) {
  const contract = requireExactString(value, 'contract');
  if (contract.length > 128 || !SOLIDITY_IDENTIFIER.test(contract)) {
    throw new Error('contract must be a Solidity identifier with at most 128 characters');
  }
  return contract;
}

function validateJsonValue(value, path, depth) {
  if (depth > MAX_JSON_DEPTH) {
    throw new Error(`${path} exceeds the maximum nesting depth of ${MAX_JSON_DEPTH}`);
  }

  if (typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`${path} must be a safe integer; encode large integers as strings`);
    }
    return;
  }
  if (value === null) {
    throw new Error(`${path} must not be null`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateJsonValue(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        throw new Error(`${path} contains a forbidden object key`);
      }
      validateJsonValue(item, `${path}.${key}`, depth + 1);
    }
    return;
  }
  throw new Error(`${path} contains an unsupported JSON value type`);
}

function parseConstructorArgs(value) {
  if (typeof value !== 'string') {
    throw new Error('args_json must be a JSON string');
  }
  if (Buffer.byteLength(value, 'utf8') > MAX_ARGS_JSON_BYTES) {
    throw new Error(`args_json exceeds ${MAX_ARGS_JSON_BYTES} bytes`);
  }

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`args_json must be valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('args_json must decode to a JSON array');
  }
  if (parsed.length > MAX_ARGS) {
    throw new Error(`args_json must contain at most ${MAX_ARGS} constructor arguments`);
  }
  parsed.forEach((item, index) => validateJsonValue(item, `args_json[${index}]`, 0));
  return parsed;
}

function validateDeployInputs({
  network,
  contract,
  argsJson = '[]',
  productionConfirmation = ''
}) {
  const networkPolicy = validateNetwork(network);
  const contractName = validateContractName(contract);
  const args = parseConstructorArgs(argsJson);

  if (
    networkPolicy.production &&
    productionConfirmation !== PRODUCTION_CONFIRMATION
  ) {
    throw new Error(
      `production network ${networkPolicy.network} requires the exact confirmation ${PRODUCTION_CONFIRMATION}`
    );
  }

  return Object.freeze({
    ...networkPolicy,
    contract: contractName,
    args,
    argsJson: JSON.stringify(args)
  });
}

module.exports = {
  MAX_ARGS,
  MAX_ARGS_JSON_BYTES,
  NETWORK_POLICIES,
  PRODUCTION_CONFIRMATION,
  parseConstructorArgs,
  validateContractName,
  validateDeployInputs,
  validateNetwork
};
