# Dependency overrides

The root project keeps Hardhat 2 and Solidity 0.8.24 for the published exercises.
Some upstream packages still pin vulnerable transitive versions, so `package.json` applies narrowly reviewed overrides until the upstream toolchain can remove them.

| Override | Affected path | Compatibility evidence | Removal condition |
| --- | --- | --- | --- |
| `bn.js` 4.12.5 | `ethjs-unit`, `number-to-bn` | Same 4.x API line; compile and tests pass | Upstream packages resolve a remediated 4.x release |
| `ws` 8.21.0 | `ethers`, `viem` | Same 8.x API line; dependency resolution and DApp build pass. Live WebSocket traffic is not covered | Upstream ranges resolve a remediated release |
| `lodash` 4.18.1 | Hardhat, TypeChain, coverage tools | Same 4.x API line; compile, tests, and coverage pass | Upstream packages stop pinning the affected release |
| `serialize-javascript` 7.0.7 | Mocha worker path | Serialization smoke and tests pass on Node 20+ | Mocha resolves a remediated supported release |
| `tmp` 0.2.7 | Solidity compiler helper | `fileSync` create/remove smoke and compile pass | Solc removes its legacy pin |
| `uuid` 11.1.1 | Hardhat analytics identifier | CommonJS `v4()` smoke and Hardhat commands pass | Hardhat resolves a remediated supported release |
| `undici` 6.27.0 | Hardhat JSON-RPC and verify HTTP wrappers | Mock JSON-RPC success/error/redirect/timeout and verify GET/POST checks pass | Hardhat 2 or its verify plugin supports a remediated release without an override |

`npm run check:dependency-compat` exercises the high-risk range-crossing paths.
Issue #121 remains responsible for real testnet deployment, Etherscan V2, and secret-handling changes; it must be rebased on this dependency baseline and rerun its network/verify acceptance checks.
