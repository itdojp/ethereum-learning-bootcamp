#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { NETWORK_POLICIES } = require('./deploy-inputs.cjs');
const { validateEnvironmentConfiguration } = require('./check-deployment-environment.cjs');

function configuredEnvironment(name, withReviewers) {
  return {
    name,
    deployment_branch_policy: {
      protected_branches: false,
      custom_branch_policies: true
    },
    protection_rules: withReviewers
      ? [{
          type: 'required_reviewers',
          prevent_self_review: true,
          reviewers: [{ type: 'User', id: 1 }]
        }]
      : []
  };
}

test('accepts a main-only testnet environment', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('deploy-sepolia', false),
    [{ name: 'main' }],
    { network: 'sepolia', ...NETWORK_POLICIES.sepolia }
  );
  assert.deepEqual(errors, []);
});

test('accepts a reviewed production environment', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('production-mainnet', true),
    [{ name: 'main' }],
    { network: 'mainnet', ...NETWORK_POLICIES.mainnet }
  );
  assert.deepEqual(errors, []);
});

test('rejects production without reviewers', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('production-mainnet', false),
    [{ name: 'main' }],
    { network: 'mainnet', ...NETWORK_POLICIES.mainnet }
  );
  assert.match(errors.join('\n'), /required reviewer/u);
});

test('rejects production when the initiator can self-approve', () => {
  const environment = configuredEnvironment('production-mainnet', true);
  environment.protection_rules[0].prevent_self_review = false;
  const errors = validateEnvironmentConfiguration(
    environment,
    [{ name: 'main' }],
    { network: 'mainnet', ...NETWORK_POLICIES.mainnet }
  );
  assert.match(errors.join('\n'), /prevent self-review/u);
});

test('rejects a missing main branch policy and wrong environment', () => {
  const errors = validateEnvironmentConfiguration(
    configuredEnvironment('production', true),
    [{ name: 'release/*' }],
    { network: 'mainnet', ...NETWORK_POLICIES.mainnet }
  );
  assert.match(errors.join('\n'), /expected environment/u);
  assert.match(errors.join('\n'), /main deployment branch/u);
});

test('rejects protected-branch mode and additional branch policies', () => {
  const environment = configuredEnvironment('deploy-sepolia', false);
  environment.deployment_branch_policy.protected_branches = true;
  const errors = validateEnvironmentConfiguration(
    environment,
    [{ name: 'main' }, { name: 'release/*' }],
    { network: 'sepolia', ...NETWORK_POLICIES.sepolia }
  );
  assert.match(errors.join('\n'), /protected_branches/u);
  assert.match(errors.join('\n'), /exactly one main/u);
});
