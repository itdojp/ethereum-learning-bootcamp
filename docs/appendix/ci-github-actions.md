# GitHub Actions / CI メモ（つまずきポイント集）

このメモは、Day6/Day7 の CI と手動 deploy を安全に動かすための確認事項をまとめる。

## 0. 最短成功ルート（迷ったらここ）

### 0.1 テストCI（PRで自動実行）
1. ローカルで `npm run check:all` を通す。
2. ブランチを push して PR を作る。
3. GitHub の Checks / Actions で `test` と Book QA が成功していることを確認する。

### 0.2 手動デプロイ（workflow_dispatch + Environment）
1. Settings > Environments に次の network 別 Environment を作る。
   - testnet: `deploy-sepolia`, `deploy-optimism-sepolia`
   - production: `production-mainnet`, `production-optimism`
2. 各 Environment Secrets に、その network 専用の `RPC_URL` と学習用 `PRIVATE_KEY` を保存する。
3. 4つすべてに exact `main` deployment branch rule を設定し、`production-*` には Required reviewers も設定する。
4. Actions > `deploy` から、まず `sepolia` または `optimismSepolia` を選ぶ。
5. `mainnet` / `optimism` の場合だけ、確認欄へ `DEPLOY_PRODUCTION` を正確に入力し、Environment approval を通す。

deploy workflow は Verify を実行しないため、Explorer API key を読み込まない。Verify は deploy 後に別の信頼境界で行う。

## 1. テストCI

このリポジトリでは `.github/workflows/test.yml` を使い、metadata、toolchain、依存互換性、deploy 入力境界、本文整合、contract tests、link、Markdown、dependency audit、DApp build を検証する。

失敗時は Actions の該当 step と同じコマンドを Node.js 20 で再現する。

```bash
node -v
npm ci
npm run check:all
```

`npm ci` が落ちる場合は、`package.json` と `package-lock.json` の不一致を先に確認する。

## 2. 手動デプロイの安全境界

`.github/workflows/deploy.yml` は、秘密情報を使わない `validate` job と、Environment Secrets を使う `deploy` job を分離している。

- default network は `sepolia`
- network は4値の allowlist
- contract は Solidity identifier として検証
- constructor 引数は `ARGS_JSON` の JSON 配列として検証
- production network は固定確認文字列と protected Environment の二重 gate
- workflow input は `env:` 経由で渡し、`run:` の shell source へ直接展開しない
- deploy 前に toolchain check、contract tests、compile を完了
- action は監査済み commit SHA に固定
- network 単位の concurrency で並行 deploy を抑止
- deploy job は main branch 以外で起動せず、GitHub API で exact main branch policy と production reviewer を再確認してから secrets を step へ渡す

### 2.1 承認が出ない

選択した network に対応する Environment 名を確認する。全 Environment に exact `main` branch policy、production には `production-mainnet` または `production-optimism` の Required reviewers が必要になる。設定が不足すると secret 使用前の preflight が fail closed する。

### 2.2 Secrets が読めない

Repository Secrets ではなく、選択した Environment の Secrets に次の共通名で置く。

- `RPC_URL`: その Environment の network 専用 RPC
- `PRIVATE_KEY`: その Environment 専用の学習用 deploy key

workflow が `RPC_URL` を `SEPOLIA_RPC_URL` 等へ allowlist に基づいて割り当てる。1つの Environment に複数 network の RPC や本番鍵を混在させない。

### 2.3 残高不足

`insufficient funds` の場合は選択中の chain ID、deploy address、学習用 test asset /少額 ETH の残高を確認する。Mainnet の実資産や長期保管用鍵を使わない。

## 3. よくあるエラー

| 症状 | 原因候補 | 確認 | 解決 |
|---|---|---|---|
| `npm ci` が落ちる | lockfile 不整合 | `package.json` と `package-lock.json` の差分 | lockfile を更新してコミット |
| deploy input validation が落ちる | network / contract / JSON /確認文字列が不正 | validation job のエラー | allowlist と `ARGS_JSON` 例を確認 |
| Environment approval が出ない | Environment名または保護設定不足 | Settings > Environments | 対応する `production-*` に reviewer を設定 |
| Secrets が読めない | Environment / secret名の不一致 | 選択 network と `RPC_URL` / `PRIVATE_KEY` | network 別 Environment へ配置 |
| `insufficient funds` | deploy address の残高不足 | 対象 chain の残高 | testnet faucet または少額を用意 |
| 公開鮮度チェックが落ちる | Pages が main より古い | `/build-info.json` の revision / version | Pages build 完了後に再確認し、継続する場合は build を調査 |

## 4. Verify は別メモへ

Etherscan V2 と constructor 引数を含む Verify は [`docs/appendix/verify.md`](./verify.md) を参照する。
