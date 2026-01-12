# GitHub Actions / CI メモ（つまずきポイント集）

このメモは、Day6/Day7 の CI を動かすときに詰まりやすい点をまとめる。

## 1. テストCI（PRで自動実行）
目的：Pull Requestで `npm test` が自動で走り、手元との差分を早期に検出する。

このリポジトリでは `.github/workflows/test.yml` を使う。

### このリポジトリの実行内容（要点）
- ルート：`npm ci` → `npm test` → `npm run check:links`
- `dapp/`：`npm ci` → `npm run build`（フロントのビルド確認）

### よくある失敗
- Node.js のバージョン違い：ローカルとCIで `node -v` が違うと落ちやすい。
- `npm install` ではなく `npm ci`：CIは `npm ci` 前提のほうが再現性が高い。

### 失敗したときの最短デバッグ手順
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

## 3. Verifyは別メモへ
- Verify周りは `appendix/verify.md` を参照する。
