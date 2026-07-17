# GitHub Actions / CI メモ（つまずきポイント集）

このメモは、Day6/Day7 の CI と手動 deploy を安全に動かすための確認事項をまとめる。

## 0. 最短成功ルート（迷ったらここ）

### 0.1 テストCI（PRで自動実行）
1. ローカルで `npm run check:all` を通す。
2. ブランチを push して PR を作る。
3. GitHub の Checks / Actions で `test` と Book QA が成功していることを確認する。

### 0.2 手動デプロイ（workflow_dispatch + Environment）
1. Settings > Environments に次の network 別 Environment を作る。
   - `deploy-sepolia`
   - `deploy-optimism-sepolia`
2. 各 Environment Secrets に、下表の network 固有名で RPC と学習用 private key を保存する。
3. 両方に exact `main` deployment branch rule を設定する。
4. Actions > `deploy` から、まず `sepolia` または `optimismSepolia` を選ぶ。

deploy workflow は Verify を実行しないため、Explorer API key を読み込まない。Verify は deploy 後に別の信頼境界で行う。

GitHub Actions から本番 network へ deploy しない。本番用 private key を GitHub Secrets に保存しない。単独運用では自己承認を独立統制とみなさず、AIエージェントのレビューもRequired reviewerの代替にはしない。

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
- network は`sepolia` / `optimismSepolia`の2値allowlist
- contract は Solidity identifier として検証
- constructor 引数は `ARGS_JSON` の JSON 配列として検証し、transaction overrides になり得るobjectを拒否
- production networkはworkflow inputとvalidatorの両方から除外
- workflow input は `env:` 経由で渡し、`run:` の shell source へ直接展開しない
- deploy 前に toolchain check、contract tests、compile を完了
- action は監査済み commit SHA に固定
- network 単位の concurrency で並行 deploy を抑止
- deploy job はmain branch以外で起動せず、GitHub APIでexact main branch policyを再確認してからtestnet secretsをstepへ渡す
- `hardhat.config.ts`はMainnet / Optimismの`accounts`を空配列に固定し、repository内のdeploy scriptへ本番signerを供給しない

### 2.1 Environment policyで停止する

選択したtestnetに対応するEnvironment名とexact `main` branch policyを確認する。branch policyが不足するとsecret使用前のpreflightがfail closedする。

### 2.2 Secrets が読めない

Repository Secrets ではなく、選択した Environment の Secrets に次の network 固有名で置く。

- `deploy-sepolia`: `DEPLOY_SEPOLIA_RPC_URL` / `DEPLOY_SEPOLIA_PRIVATE_KEY`
- `deploy-optimism-sepolia`: `DEPLOY_OPTIMISM_SEPOLIA_RPC_URL` / `DEPLOY_OPTIMISM_SEPOLIA_PRIVATE_KEY`

validatorがallowlistに基づいてsecret名を決め、workflowは選択された1組だけをdeploy stepに渡す。network固有名は別networkのsecret名を取り違える事故を防ぐ。同名secretのscope fallbackは後述の設定監査で防ぎ、1つのEnvironmentに複数networkのsecretを混在させない。

GitHubは同名secretが複数scopeにある場合にEnvironmentを優先するが、Environment側が欠けたときのfallbackを避けるため、管理者は設定時と定期監査時にsecret名だけを確認する。値は出力しない。

```bash
REPO=itdojp/ethereum-learning-bootcamp
gh secret list --repo "$REPO"
gh api "repos/$REPO/actions/organization-secrets" --jq '[.secrets[].name]'
gh secret list --repo "$REPO" --env deploy-sepolia
gh secret list --repo "$REPO" --env deploy-optimism-sepolia
```

- repository / organization scopeに`DEPLOY_*`を置かない。
- Environment scopeには対応する2件だけを置く。
- secret値をIssue、PR、ログ、AIセッションへ渡さない。

### 2.3 残高不足

`insufficient funds`の場合は選択中のtestnet chain ID、deploy address、faucet由来のtest ETH残高を確認する。Mainnetの実資産や長期保管用鍵を使わない。

## 3. よくあるエラー

| 症状 | 原因候補 | 確認 | 解決 |
|---|---|---|---|
| `npm ci` が落ちる | lockfile 不整合 | `package.json` と `package-lock.json` の差分 | lockfile を更新してコミット |
| deploy input validation が落ちる | network / contract / JSONが不正 | validation jobのエラー | testnet allowlistと`ARGS_JSON`例を確認 |
| Environment policy checkが落ちる | Environment名またはexact `main` rule不足 | Settings > Environments | 対応するtestnet Environmentを修正 |
| Secrets が読めない | Environment / network固有secret名の不一致 | 選択 network と上記の対応表 | 対応 Environment へ固有名で配置 |
| `insufficient funds` | deploy address の残高不足 | 対象 chain の残高 | testnet faucet または少額を用意 |
| 公開鮮度チェックが落ちる | Pages が main より古い | `/build-info.json` の revision / version | Pages build 完了後に再確認し、継続する場合は build を調査 |

## 4. Verify は別メモへ

Etherscan V2 と constructor 引数を含む Verify は [`docs/appendix/verify.md`](./verify.md) を参照する。
