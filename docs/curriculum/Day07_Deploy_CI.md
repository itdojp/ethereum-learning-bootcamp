# Day7：本番・L2 デプロイ／Etherscan検証／手動承認付きCI

[← 目次](./TOC.md) | [前: Day6](./Day06_Local_Testing.md) | [次: Day8](./Day08_L2_Rollups.md)

## 学習目的
- testnet-first の入力契約で安全にデプロイする流れを実行できるようになる。
- Etherscan API V2 のソース検証（[Verify](../appendix/glossary.md)）と記録方法を理解する。
- GitHub Environment と固定確認文字列を使い、本番 network の誤選択を防げるようになる。

---

## 0. 前提
- Hardhat 構成は Day3 までに完了し、`npm run check:all` が成功している。
- 外部 network では `.env` に必要な RPC、学習用 `PRIVATE_KEY`、Verify 時だけ `ETHERSCAN_API_KEY` を設定する。秘密情報は Git やログへ出さない。
- 最初の実行先は Mainnet / Optimism ではなく Sepolia または OP Sepolia にする。
- 先に [`docs/appendix/verify.md`](../appendix/verify.md) と [`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md) を読む。

### 0.1 環境変数

```bash
SEPOLIA_RPC_URL=
OPTIMISM_SEPOLIA_RPC_URL=
MAINNET_RPC_URL=
OPTIMISM_RPC_URL=
PRIVATE_KEY=0xYOUR_LEARNING_ONLY_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_V2_API_KEY
```

---

## 1. デプロイ入力の安全な指定

`scripts/deploy-generic.ts` は contract name を Solidity identifier として検証し、constructor 引数を `ARGS_JSON` の JSON 配列として parse する。旧来の空白区切り `ARGS` は受け付けない。大きな整数は JavaScript の精度損失を避けるため文字列で書く。

```bash
# Hello: constructor 引数なし
CONTRACT=Hello ARGS_JSON='[]' \
  npx hardhat run scripts/deploy-generic.ts --network sepolia

# MyToken: uint256 を10進文字列で渡す
CONTRACT=MyToken ARGS_JSON='["1000000000000000000000000"]' \
  npx hardhat run scripts/deploy-generic.ts --network optimismSepolia
```

workflow は network allowlist と production 確認も `tools/validate-deploy-inputs.cjs` で検証する。入力は `env:` に渡され、shell source へ直接展開されない。

---

## 2. Etherscan API V2 で Verify

Hardhat 2.x 互換版として `@nomicfoundation/hardhat-verify` 2.1.3 を固定する。`ETHERSCAN_API_KEY` は Sepolia / OP Sepolia / Mainnet / Optimism で共通であり、plugin は V2 endpoint に `chainid` を付ける。

```bash
# 秘密情報なしで chain 解決を確認
npx hardhat verify --list-networks

# Sepolia: Hello
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS>

# OP Sepolia: MyToken
npx hardhat verify --network optimismSepolia \
  <DEPLOYED_ADDRESS> 1000000000000000000000000
```

実際の Verify は deploy 時と同じ compiler 設定と constructor 引数を使う。詳細は [Verify付録](../appendix/verify.md) を参照する。

---

## 3. リスクを下げる運用チェックリスト
- [ ] local tests と compile が成功している。
- [ ] Sepolia / OP Sepolia で少額の動作確認を終えている。
- [ ] deploy key は network /用途を限定し、長期保管用鍵や実資産を扱わない。
- [ ] contract owner / role / pause /上限 / upgrade 権限をレビューしている。
- [ ] address、chain ID、TxHash、compiler、constructor 引数を [`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) に記録する。
- [ ] Verify 後の source、ABI、owner を explorer で確認する。

---

## 4. GitHub Actions の手動デプロイ

### 4.1 network 別 Environment

Settings > Environments に次を作り、各 Environment Secrets へ下表の network 固有名で RPC と private key を保存する。4つすべてに exact `main` deployment branch rule だけを設定する。

| workflow network | Environment | Environment Secrets | 保護 |
|---|---|---|---|
| `sepolia` | `deploy-sepolia` | `DEPLOY_SEPOLIA_RPC_URL` / `DEPLOY_SEPOLIA_PRIVATE_KEY` | testnet。任意で reviewer |
| `optimismSepolia` | `deploy-optimism-sepolia` | `DEPLOY_OPTIMISM_SEPOLIA_RPC_URL` / `DEPLOY_OPTIMISM_SEPOLIA_PRIVATE_KEY` | testnet。任意で reviewer |
| `mainnet` | `production-mainnet` | `DEPLOY_MAINNET_RPC_URL` / `DEPLOY_MAINNET_PRIVATE_KEY` | Required reviewers、Prevent self-review、main branch rule 必須 |
| `optimism` | `production-optimism` | `DEPLOY_OPTIMISM_RPC_URL` / `DEPLOY_OPTIMISM_PRIVATE_KEY` | Required reviewers、Prevent self-review、main branch rule 必須 |

network を分けることで、Sepolia job が Mainnet RPC / key を取得する状態を避ける。production では UI の確認欄へ `DEPLOY_PRODUCTION` を正確に入力し、さらに自己承認を禁止した Environment approval を通す。workflow は GitHub API で branch policy、production reviewer、Prevent self-review を再確認し、不足していれば secrets を step へ渡す前に停止する。

### 4.2 workflow の実行順

1. 秘密情報を持たない `validate` job が network、contract、`ARGS_JSON`、production 確認を検証する。
2. toolchain check、input tests、contract tests、compile を実行する。
3. 検証済み network に対応する Environment の gate を通る。
4. environment-scoped `RPC_URL` / `PRIVATE_KEY` だけを読み、同一 network の同時 deploy を抑止して実行する。

deploy workflow は Verify を行わないため `ETHERSCAN_API_KEY` を読み込まない。Verify を自動化する場合は別 workflow / job として、address artifact と承認境界を設計する。

---

## 5. デプロイ記録

[`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) には、最低限次を記録する。

```markdown
## <YYYY-MM-DD> <network> MyToken
- source commit: <40-character SHA>
- chainId: <chain id>
- address: 0x...
- txHash: 0x...
- compiler: 0.8.24 / optimizer runs 200
- constructor args: ["1000000000000000000000000"]
- verified: <explorer URL or not yet>
- owner: <address / multisig policy>
```

---

## 6. 本番 network へ進む条件
1. 同じ source commit と constructor 引数を testnet で確認する。
2. DApp、monitoring、owner / role、emergency procedure を確認する。
3. source commit、chain ID、address、TxHash を peer review する。
4. `production-*` Environment の別 reviewer が network と費用を確認する（Prevent self-review 必須）。
5. deploy 後に記録と Verify を完了する。

---

## 7. つまずきポイント

| 症状 | 原因 | 対処 |
|---|---|---|
| input validation が失敗 | contract名、JSON、production確認が不正 | Solidity identifier、JSON配列、固定確認文字列を確認 |
| `insufficient funds` | 選択 network の手数料不足 | chain ID と deploy address の少額残高を確認 |
| Verify失敗 | compiler / constructor 引数 / chain 不一致 | deploy記録と `hardhat.config.ts` を照合 |
| 承認が出ない | Environment名、reviewer、Prevent self-review の設定不足 | Settings > Environments と対応表を確認 |
| Secrets が読めない | network別 Environment に共通名がない | `RPC_URL` / `PRIVATE_KEY` を対応 Environment に設定 |

---

## 8. まとめ
- testnet-first、allowlist、JSON 引数、二重 production gate で deploy の信頼境界を明確にした。
- Etherscan V2 の単一 API key と chain ID に基づく Verify を確認した。
- source commit から deploy / Verify /記録を追跡できる運用を整理した。

### 理解チェック（3問）
- Q1. workflow input を shell source へ直接展開しない理由は何か？
- Q2. production で固定確認文字列と Environment approval の両方を使う理由は何か？
- Q3. Verify の再現に必要な情報を3つ挙げる。

### 解答例（短く）
- A1. shell metacharacter や command substitution をコードとして解釈させず、入力をデータとして検証するため。
- A2. 誤選択を機械的に止める gate と、人間が network /費用 /revision を確認する gate を分離するため。
- A3. source commit、compiler設定、constructor引数、chain ID、deployed address など。

### 確認コマンド（最小）
```bash
npm run test:deploy-inputs
npm run check:deploy-safety
CONTRACT=Hello ARGS_JSON='[]' \
  npx hardhat run scripts/deploy-generic.ts --network sepolia
```

## 9. 提出物
- [ ] network、address、TxHash、source commit を含む deploy記録
- [ ] Etherscan V2 の Verify URL または未実施理由
- [ ] testnet の Actions run と、productionを扱う場合は approval記録

## 10. 実行例
- 実行ログ例：[`docs/reports/Day07.md`](../reports/Day07.md)
