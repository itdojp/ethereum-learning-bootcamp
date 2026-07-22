# Dependency overrides and install-script policy

The root project uses Hardhat 3.11.0 and Solidity 0.8.24. Direct development dependencies are exact-pinned. Three transitive packages are overridden because their upstream parents still declare vulnerable ranges.

| Override | Affected path | Compatibility evidence | Removal condition |
| --- | --- | --- | --- |
| `adm-zip` 0.6.0 | Hardhat Windows compiler extraction | Exercises the same `new AdmZip(path)` and `extractAllTo(path)` calls used by Hardhat; compile, 16 tests, coverage, and gas statistics pass | Hardhat declares a range containing 0.6.0 or later |
| `serialize-javascript` 7.0.7 | Mocha serialization | Exercises escaping and executable round-trip behavior; TypeScript tests, coverage, and gas statistics pass | Mocha resolves a non-vulnerable version without an override |
| `tmp` 0.2.7 | `solc` helper path | Exercises synchronous create/write/read/cleanup behavior; locked local solc-js compilation and the full test suite pass | `solc` removes its legacy exact dependency |

`adm-zip` 0.6.0 is outside Hardhat 3.11.0's declared `^0.4.16` range. The override is therefore guarded by `npm run check:dependency-compat`; it must not be changed without repeating the extraction, compilation, test, coverage, and deployment-safety checks.

## Install scripts

`npm run check:install-scripts` fails when either the root or `dapp/` lockfile adds or changes a package with an install script. The allowlist fixes package path, version, optional status, registry tarball URL, and integrity digest. CI and deployment workflows run this check before installation, install with `--ignore-scripts`, and explicitly rebuild only the reviewed `esbuild` binary. Local setup uses `npm run install:reviewed` or `npm run dapp:ci:safe` to preserve the same order.

| Package | Script purpose | Scope |
| --- | --- | --- |
| `esbuild` 0.28.1 | Installs/verifies the platform-specific binary used by Hardhat's TypeScript loader | Root, all supported platforms |
| `esbuild` 0.27.2 | Installs/verifies the platform-specific binary used by Vite | `dapp/`, all supported platforms |
| `fsevents` 2.3.3 | Optional native filesystem events support | Root and `dapp/`, macOS only |

The Hardhat 2 paths `keccak` and `secp256k1` are absent from the migrated lockfile. Their reappearance is a policy failure until separately reviewed.
