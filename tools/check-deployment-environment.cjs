#!/usr/bin/env node
'use strict';

const { validateNetwork } = require('./deploy-inputs.cjs');

function validateEnvironmentConfiguration(environment, branchPolicies, networkPolicy) {
  const errors = [];
  if (environment.name !== networkPolicy.environment) {
    errors.push(`expected environment ${networkPolicy.environment}, got ${environment.name}`);
  }
  if (!environment.deployment_branch_policy?.custom_branch_policies) {
    errors.push('custom deployment branch policies must be enabled');
  }
  if (environment.deployment_branch_policy?.protected_branches !== false) {
    errors.push('protected_branches must be disabled in favor of one explicit main policy');
  }
  if (branchPolicies.length !== 1 || branchPolicies[0]?.name !== 'main') {
    errors.push('exactly one main deployment branch policy is required');
  }
  if (networkPolicy.production) {
    const reviewerRule = (environment.protection_rules || []).find(
      (rule) => rule.type === 'required_reviewers'
    );
    if (!reviewerRule || !Array.isArray(reviewerRule.reviewers) || reviewerRule.reviewers.length === 0) {
      errors.push('production environment requires at least one required reviewer');
    } else if (reviewerRule.prevent_self_review !== true) {
      errors.push('production environment must prevent self-review');
    }
  }
  return errors;
}

async function githubJson(pathname, token, repository) {
  const response = await fetch(`https://api.github.com/repos/${repository}${pathname}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'user-agent': 'ethereum-learning-bootcamp-deploy-preflight',
      'x-github-api-version': '2022-11-28'
    },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(`GitHub environment API ${pathname} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');
  }

  const networkPolicy = validateNetwork(process.env.TARGET_NETWORK);
  const encodedEnvironment = encodeURIComponent(networkPolicy.environment);
  const [environment, policiesResponse] = await Promise.all([
    githubJson(`/environments/${encodedEnvironment}`, token, repository),
    githubJson(`/environments/${encodedEnvironment}/deployment-branch-policies`, token, repository)
  ]);
  const errors = validateEnvironmentConfiguration(
    environment,
    policiesResponse.branch_policies || [],
    networkPolicy
  );
  if (errors.length) {
    throw new Error(
      `GitHub Environment ${networkPolicy.environment} is not deploy-safe:\n- ${errors.join('\n- ')}`
    );
  }
  console.log(
    `GitHub Environment policy validated: network=${networkPolicy.network}, environment=${networkPolicy.environment}, production=${networkPolicy.production}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { validateEnvironmentConfiguration };
