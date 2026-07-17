'use strict';

const NETWORK_POLICIES = Object.freeze({
  sepolia: Object.freeze({
    chainId: 11155111,
    environment: 'deploy-sepolia',
    rpcEnvironmentVariable: 'SEPOLIA_RPC_URL',
    rpcSecretName: 'DEPLOY_SEPOLIA_RPC_URL',
    privateKeySecretName: 'DEPLOY_SEPOLIA_PRIVATE_KEY'
  }),
  optimismSepolia: Object.freeze({
    chainId: 11155420,
    environment: 'deploy-optimism-sepolia',
    rpcEnvironmentVariable: 'OPTIMISM_SEPOLIA_RPC_URL',
    rpcSecretName: 'DEPLOY_OPTIMISM_SEPOLIA_RPC_URL',
    privateKeySecretName: 'DEPLOY_OPTIMISM_SEPOLIA_PRIVATE_KEY'
  })
});

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
    // ethers treats a trailing object passed to ContractFactory.deploy() as
    // transaction overrides. Keep workflow input limited to constructor data;
    // tuples must use positional JSON arrays rather than named objects.
    throw new Error(`${path} must not be an object; encode tuple values as positional arrays`);
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

function validateDeployInputs({ network, contract, argsJson = '[]' }) {
  const networkPolicy = validateNetwork(network);
  const contractName = validateContractName(contract);
  const args = parseConstructorArgs(argsJson);

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
  parseConstructorArgs,
  validateContractName,
  validateDeployInputs,
  validateNetwork
};
