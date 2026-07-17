#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { validateDeployInputs } = require('./deploy-inputs.cjs');

function appendOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(name)) {
    throw new Error(`invalid GitHub output name: ${name}`);
  }
  if (String(value).includes('\n') || String(value).includes('\r')) {
    throw new Error(`GitHub output ${name} must be a single line`);
  }
  fs.appendFileSync(outputPath, `${name}=${value}\n`, 'utf8');
}

try {
  const result = validateDeployInputs({
    network: process.env.INPUT_NETWORK,
    contract: process.env.INPUT_CONTRACT,
    argsJson: process.env.INPUT_ARGS_JSON
  });

  appendOutput('network', result.network);
  appendOutput('environment', result.environment);
  appendOutput('contract', result.contract);
  appendOutput('args_json', result.argsJson);
  appendOutput('rpc_environment_variable', result.rpcEnvironmentVariable);
  appendOutput('rpc_secret_name', result.rpcSecretName);
  appendOutput('private_key_secret_name', result.privateKeySecretName);

  console.log(
    `Deploy inputs validated: network=${result.network}, contract=${result.contract}, constructor_args=${result.args.length}, environment=${result.environment}`
  );
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`Deploy input validation failed: ${detail}`);
  process.exitCode = 1;
}
