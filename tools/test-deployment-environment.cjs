#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { NETWORK_POLICIES } = require('./deploy-inputs.cjs');
const { validateEnvironmentConfiguration } = require('./check-deployment-environment.cjs');

function configuredEnvironment(name) {
  return {
    name,
    deployment_branch_policy: {
      protected_branches: false,
      custom_branch_policies: true
    },
    protection_rules: []
  };
}

test('accepts a main-only testnet environment', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('deploy-sepolia'),
    [{ name: 'main' }],
    { network: 'sepolia', ...NETWORK_POLICIES.sepolia }
  );
  assert.deepEqual(errors, []);
});

test('accepts a main-only OP Sepolia environment', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('deploy-optimism-sepolia'),
    [{ name: 'main' }],
    { network: 'optimismSepolia', ...NETWORK_POLICIES.optimismSepolia }
  );
  assert.deepEqual(errors, []);
});

test('rejects a missing main branch policy and wrong environment', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('deploy-sepolia-wrong'),
    [{ name: 'release/*' }],
    { network: 'sepolia', ...NETWORK_POLICIES.sepolia }
  );
  assert.match(errors.join('\n'), /expected environment/u);
  assert.match(errors.join('\n'), /main deployment branch/u);
});

test('rejects protected-branch mode and additional branch policies', () => {
  const environment = configuredEnvironment('deploy-sepolia');
  environment.deployment_branch_policy.protected_branches = true;
  const errors = validateEnvironmentConfiguration(
    environment,
    [{ name: 'main' }, { name: 'release/*' }],
    { network: 'sepolia', ...NETWORK_POLICIES.sepolia }
  );
  assert.match(errors.join('\n'), /protected_branches/u);
  assert.match(errors.join('\n'), /exactly one main/u);
});
