# Day7：テストネット・L2デプロイ／Etherscan検証／安全なCI

[← 目次](./TOC.md) | [前: Day6](./Day06_Local_Testing.md) | [次: Day8](./Day08_L2_Rollups.md)

## 学習目的
- testnet-first の入力契約で安全にデプロイする流れを実行できるようになる。
- Etherscan API V2 のソース検証（[Verify](../appendix/glossary.md)）と記録方法を理解する。
- GitHub Actions を testnet 専用に制限し、単独運用でも本番鍵を自動化境界へ入れない理由を説明できるようになる。

---

## 0. 前提
- Hardhat 構成は Day3 までに完了し、`npm run check:all` が成功している。
- 外部 network では `.env` に必要な RPC、学習用 `PRIVATE_KEY`、Verify 時だけ `ETHERSCAN_API_KEY` を設定する。秘密情報は Git やログへ出さない。
- GitHub Actions と本リポジトリの signer は Sepolia / OP Sepolia だけを対象にする。
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

`MAINNET_RPC_URL` / `OPTIMISM_RPC_URL` は read / Verify 専用である。`PRIVATE_KEY` はテストネット専用とし、`hardhat.config.ts` は Mainnet / Optimism で `accounts: []` を使用する。

---

## 1. デプロイ入力の安全な指定

`scripts/deploy-generic.ts` は contract name を Solidity identifier として検証し、constructor 引数を `ARGS_JSON` の JSON 配列として parse する。旧来の空白区切り `ARGS` は受け付けない。大きな整数は JavaScript の精度損失を避けるため文字列で書く。JSON object は ethers の transaction overrides と誤認され得るため拒否し、tuple は位置指定の入れ子配列で表す。

```bash
# Hello: constructor 引数なし
CONTRACT=Hello ARGS_JSON='[]' \
  npx hardhat run scripts/deploy-generic.ts --network sepolia

# MyToken: uint256 を10進文字列で渡す
CONTRACT=MyToken ARGS_JSON='["1000000000000000000000000"]' \
  npx hardhat run scripts/deploy-generic.ts --network optimismSepolia
```

workflow はnetworkを`sepolia` / `optimismSepolia`の2値allowlistで検証する。`mainnet` / `optimism`は入力候補にもvalidatorにも含めない。入力は`env:`に渡され、shell sourceへ直接展開されない。

---

## 2. Etherscan API V2 で Verify

Hardhat 3向け `@nomicfoundation/hardhat-verify` 3.0.21を固定する。`ETHERSCAN_API_KEY` はSepolia / OP Sepolia / Mainnet / Optimismで共通であり、pluginはEtherscan API V2へchain IDを付ける。

```bash
# 秘密情報なしでplugin登録とchain descriptorを確認
npx hardhat verify --help
npm run check:deploy-safety

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

Settings > Environments に次の 2 件だけを作り、各 Environment Secrets へ network 固有の RPC と学習用 private key を保存する。両方に exact `main` deployment branch rule だけを設定する。

| workflow network | Environment | Environment Secrets | 保護 |
|---|---|---|---|
| `sepolia` | `deploy-sepolia` | `DEPLOY_SEPOLIA_RPC_URL` / `DEPLOY_SEPOLIA_PRIVATE_KEY` | testnet、exact `main` |
| `optimismSepolia` | `deploy-optimism-sepolia` | `DEPLOY_OPTIMISM_SEPOLIA_RPC_URL` / `DEPLOY_OPTIMISM_SEPOLIA_PRIVATE_KEY` | testnet、exact `main` |

GitHub Actions から本番 network へ deploy しない。本番用 private key を GitHub Secrets に保存しない。AI エージェントのレビューは差分検査を補助できるが、独立した人間承認主体ではない。単独運用で Required reviewer を自己承認へ弱める代わりに、production network と production secret を自動化の到達可能集合から除外する。

### 4.2 workflow の実行順

1. 秘密情報を持たない `validate` job が testnet network、contract、`ARGS_JSON` を検証する。
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

## 6. 本番 network を自動化しない境界

単独運用では、同じ人が変更・起動・承認を兼ねるため、Required reviewer を設定しても独立した承認にはならない。ChatGPT、Codex CLI、GitHub Copilot、Claude Code 等の AI レビューも、秘密鍵を分離して責任を負う別主体ではない。このリポジトリでは次を固定する。

1. `.github/workflows/deploy.yml` は Sepolia / OP Sepolia だけを受け付ける。
2. Mainnet / Optimism の Hardhat 設定は `accounts: []` とし、repository script へ本番 signer を渡さない。
3. 本番用 private key を GitHub Secrets、repository `.env`、AI セッションへ入力しない。
4. 将来 production deploy が必要になった場合は、この教材 workflow を拡張せず、hardware wallet / KMS 等の外部署名境界、dry-run、変更凍結、監査ログ、緊急停止を備えた別 runbook として設計・レビューする。
5. 本番 read / Verify に RPC や Explorer API を使う場合も、署名能力と分離する。

---

## 7. つまずきポイント

| 症状 | 原因 | 対処 |
|---|---|---|
| input validation が失敗 | network、contract名、JSONが不正 | testnet allowlist、Solidity identifier、JSON配列を確認 |
| `insufficient funds` | 選択 network の手数料不足 | chain ID と deploy address の少額残高を確認 |
| Verify失敗 | compiler / constructor 引数 / chain 不一致 | deploy記録と `hardhat.config.ts` を照合 |
| Secrets が読めない | 選択したnetworkのEnvironmentに固有名のsecretがない | `DEPLOY_SEPOLIA_*` / `DEPLOY_OPTIMISM_SEPOLIA_*` を対応表どおりに設定 |

---

## 8. まとめ
- testnet-only allowlist、JSON引数、production signer除外でdeployの信頼境界を明確にした。
- Etherscan V2 の単一 API key と chain ID に基づく Verify を確認した。
- source commit から deploy / Verify /記録を追跡できる運用を整理した。

### 理解チェック（3問）
- Q1. workflow input を shell source へ直接展開しない理由は何か？
- Q2. 単独運用でAIレビューをRequired reviewerの代替とせず、production deployを自動化対象外にする理由は何か？
- Q3. Verify の再現に必要な情報を3つ挙げる。

### 解答例（短く）
- A1. shell metacharacter や command substitution をコードとして解釈させず、入力をデータとして検証するため。
- A2. AIは独立した鍵・責任主体ではなく、自己承認も独立統制にならないため。本番signerを到達不能にする方がfail-closedになる。
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
- [ ] testnetのActions run、または秘密情報未設定で実行しなかった理由

## 10. 実行例
- 実行ログ例：[`docs/reports/Day07.md`](../reports/Day07.md)
