#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseConstructorArgs, validateDeployInputs } = require('./deploy-inputs.cjs');

test('Sepolia is accepted by the testnet-only policy', () => {
  const result = validateDeployInputs({
    network: 'sepolia',
    contract: 'Hello',
    argsJson: '[]'
  });
  assert.equal(result.environment, 'deploy-sepolia');
  assert.equal(result.rpcSecretName, 'DEPLOY_SEPOLIA_RPC_URL');
  assert.equal(result.privateKeySecretName, 'DEPLOY_SEPOLIA_PRIVATE_KEY');
  assert.deepEqual(result.args, []);
});

test('Optimism Sepolia is an allowed test network', () => {
  const result = validateDeployInputs({
    network: 'optimismSepolia',
    contract: 'MyToken',
    argsJson: '["1000000000000000000000000"]'
  });
  assert.equal(result.chainId, 11155420);
});

for (const network of ['mainnet', 'optimism']) {
  test(`${network} is rejected by the repository deploy automation`, () => {
    assert.throws(
      () => validateDeployInputs({ network, contract: 'Hello', argsJson: '[]' }),
      /network must be one of: sepolia, optimismSepolia/u
    );
  });
}

test('unknown and whitespace-padded networks are rejected', () => {
  for (const network of ['hardhat', 'mainnet ', '$(touch owned)']) {
    assert.throws(
      () => validateDeployInputs({ network, contract: 'Hello', argsJson: '[]' }),
      /network/u
    );
  }
});

test('contract shell injection and path traversal are rejected', () => {
  for (const contract of ['Hello; id', '$(touch owned)', '../Hello', 'Hello\nwhoami']) {
    assert.throws(
      () => validateDeployInputs({ network: 'sepolia', contract, argsJson: '[]' }),
      /contract/u
    );
  }
});

test('Solidity identifiers containing dollar signs are accepted', () => {
  for (const contract of ['$Hello', '_$Token', 'Hello$2']) {
    const result = validateDeployInputs({ network: 'sepolia', contract, argsJson: '[]' });
    assert.equal(result.contract, contract);
  }
});

test('constructor strings containing shell metacharacters remain inert data', () => {
  const marker = '$(touch should-not-exist); echo not-executed';
  const result = parseConstructorArgs(JSON.stringify([marker]));
  assert.deepEqual(result, [marker]);
});

test('constructor arguments must be a valid JSON array', () => {
  for (const value of ['', '{"amount":1}', '[', 'null']) {
    assert.throws(() => parseConstructorArgs(value), /args_json/u);
  }
});

test('unsafe numbers and null constructor values are rejected', () => {
  assert.throws(() => parseConstructorArgs('[9007199254740992]'), /safe integer/u);
  assert.throws(() => parseConstructorArgs('[null]'), /must not be null/u);
});

test('nested tuple-like JSON values are accepted within limits', () => {
  const value = '[{"recipient":"0x0000000000000000000000000000000000000001","amount":"42"},[true,7]]';
  assert.deepEqual(parseConstructorArgs(value), [
    { recipient: '0x0000000000000000000000000000000000000001', amount: '42' },
    [true, 7]
  ]);
});
