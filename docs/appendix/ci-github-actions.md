# GitHub Actions / CI メモ（つまずきポイント集）

このメモは、Day6/Day7 の CI を動かすときに詰まりやすい点をまとめる。

## 0. 最短成功ルート（迷ったらここ）
### 0.1 テストCI（PRで自動実行）
1) ローカルで `npm run check:all` を通す（テスト + リンクチェック + dapp build）。  
2) ブランチを push して PR を作る。  
3) GitHub の Checks / Actions で `test` ワークフローが成功していることを確認する。  

### 0.2 手動承認付きデプロイ（workflow_dispatch + Environment）
1) Settings > Environments に `production` を作り、Required reviewers を設定する。  
2) `production` の Environment Secrets に、RPC/鍵/APIキーを入れる（鍵はコミットしない）。  
3) Actions タブから `deploy` を `Run workflow` で起動し、承認して完了させる。  

## 1. テストCI（PRで自動実行）
目的：Pull Requestで `npm test` が自動で走り、手元との差分を早期に検出する。

このリポジトリでは `.github/workflows/test.yml` を使う。

### このリポジトリの実行内容（要点）
- ルート：`npm ci` → `npm test` → `npm run check:links`
- `dapp/`：`npm ci` → `npm run build`（フロントのビルド確認）

### よくある失敗
- Node.js のバージョン違い：ローカルとCIで `node -v` が違うと落ちやすい。
- `npm install` ではなく `npm ci`：CIは `npm ci` 前提のほうが再現性が高い。

### 失敗時の切り分け（最短）
1) GitHub の Actions タブ → 該当 Run → **落ちた Step のログ**を開く。  
2) ローカルで **CIと同じ手順**を再現する（このrepoは Node.js 20 前提）：
```bash
node -v
npm ci
npm test
```
3) `npm ci` が落ちる場合は、まず `package-lock.json` と `package.json` の差分（依存追加/更新漏れ）を疑う。

## 2. 手動承認付きデプロイ（workflow_dispatch + Environment）
目的：誤デプロイを避けるため、**手動トリガ**＋**人間承認**でデプロイする。

このリポジトリでは `.github/workflows/deploy.yml` を使う。

### 2.0 どこから実行するか
- GitHub の Actions タブ → `deploy` → `Run workflow`（手動実行）から起動する。

### 2.1 つまずき：承認が出ない
- GitHub の Settings > Environments で `production` を作り、Required reviewers を設定する。

### 2.2 つまずき：Secretsの場所が違う
- Repository Secrets と Environment Secrets は別枠。
- Day7 の例は Environment Secrets に置く前提。

### 2.3 つまずき：HardhatがRPCを読めない
- `hardhat.config.ts` が参照する環境変数名と、Workflowで渡す変数名が一致している必要がある。
  - 例：`OPTIMISM_RPC_URL` を使うなら Workflow でも `OPTIMISM_RPC_URL` を渡す。

### 2.4 つまずき：残高不足
- CIからのデプロイでも、デプロイ用アドレスの残高が必要。
- `insufficient funds` の場合は、対象チェーンにETHを用意する。

## 3. よくあるエラー（症状→原因候補→確認→解決）
| 症状 | 原因候補 | 確認 | 解決 |
|---|---|---|---|
| `npm ci` が落ちる | lockfile不整合 / 依存更新漏れ | `package.json` と `package-lock.json` の差分 | lockfile を更新してコミット |
| `check:links` が落ちる | 相対リンク切れ | ログに出た `file:line` のリンクを確認 | Markdownのリンク先を修正 |
| `dapp-build` が落ちる | `dapp/` 側の依存・型・ビルドエラー | `npm --prefix dapp ci && npm --prefix dapp run build` | エラー箇所を修正して再実行 |
| ローカルは通るがCIだけ落ちる | Node.js差分 / 実行手順差分 | CIログの `node -v` とローカルを比較 | Node.js 20 に揃え、CIと同じ手順で再現する |
| 承認が出ない | Environment設定不足 | Settings > Environments の `production` | Required reviewers を設定する |
| Secretsが読めない | Secretsの置き場所/名前不一致 | Environment Secrets と変数名 | `hardhat.config.ts` と同じ名前でSecretsを置く |
| `insufficient funds` | デプロイ用残高不足 | 対象チェーンで残高確認 | 少額ETHを用意して再実行 |

## 4. Verifyは別メモへ
- Verify周りは [`docs/appendix/verify.md`](./verify.md) を参照する。
