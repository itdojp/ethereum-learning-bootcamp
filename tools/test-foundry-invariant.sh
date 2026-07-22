#!/usr/bin/env bash
set -euo pipefail

forge_version="$(forge --version)"
printf '%s\n' "$forge_version"
if [[ "${forge_version%%$'\n'*}" != 'forge Version: 1.7.1' ]]; then
  echo 'Foundry must be the audited v1.7.1 release' >&2
  exit 1
fi
forge clean
forge test --match-contract '^Invariant$' -vv

set +e
negative_output="$({
  FOUNDRY_PROFILE=negative forge test \
    --match-contract '^UnsafeAccountingInvariant$' \
    -vv
} 2>&1)"
negative_status=$?
set -e

printf '%s\n' "$negative_output"

if [[ $negative_status -eq 0 ]]; then
  echo 'negative invariant fixture unexpectedly passed' >&2
  exit 1
fi

expected_failure='[FAIL: failed to set up invariant testing environment: recorded balances differ from assets] invariant_AccountingMatchesAssets()'
if ! grep -Fq "$expected_failure" <<<"$negative_output"; then
  echo 'negative invariant fixture did not expose the accounting mutation' >&2
  exit 1
fi

echo 'Foundry invariant contract passed; intentional accounting mutation was detected.'
