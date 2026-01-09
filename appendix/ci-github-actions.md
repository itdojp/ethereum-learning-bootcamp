# GitHub Actions / CI メモ（つまずきポイント集）

このメモは、Day6/Day7 の CI を動かすときに詰まりやすい点をまとめる。

## 1. テストCI（PRで自動実行）
目的：Pull Requestで `npm test` が自動で走り、手元との差分を早期に検出する。

このリポジトリでは `.github/workflows/test.yml` を使う。

### よくある失敗
- Node.js のバージョン違い：ローカルとCIで `node -v` が違うと落ちやすい。
- `npm install` ではなく `npm ci`：CIは `npm ci` 前提のほうが再現性が高い。

## 2. 手動承認付きデプロイ（workflow_dispatch + Environment）
目的：誤デプロイを避けるため、**手動トリガ**＋**人間承認**でデプロイする。

このリポジトリでは `.github/workflows/deploy.yml` を使う。

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

