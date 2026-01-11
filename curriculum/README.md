# Curriculum 共通の前提

このディレクトリ配下の手順は、原則として **本リポジトリをそのまま使って進める** 前提で書いている。
ゼロからプロジェクトを作る場合は Day3 を参考にする。

読む順序は `curriculum/TOC.md` を参照する。

## 1. 作業ディレクトリ
- ルートの `package.json` がある場所（このリポジトリ直下）で作業する。
- `dapp/` は別のプロジェクト（別 `package.json`）なので、必要に応じて `cd dapp` してから `npm ci` を実行する。

## 2. Node.js / npm
- 推奨：Node.js 20（LTS）
- ルートで依存を入れる：
  - `npm ci`
- `dapp/` 側の依存を入れる（必要な場合）：
  - `cd dapp && npm ci`

## 3. 環境変数（`.env`）
- ルートは `.env.example` をコピーして `.env` を作成する：
  - `cp .env.example .env`
- 秘密鍵・APIキーはコミットしない（`.gitignore` 済み）。

### dapp の環境変数（Vite）
- `dapp/` は Vite のため、`.env.local` を使うと事故が少ない：
  - `cp dapp/.env.example dapp/.env.local`
- `VITE_*` の値（コントラクトアドレス、chainId など）を入力する（Day9参照）。

## 4. ethers v6
- TypeScript のサンプルコードは **ethers v6** 前提。
- 代表的な差分：
  - `ethers.parseEther` / `ethers.formatEther`
  - `await contract.waitForDeployment()` / `await contract.getAddress()`

## 5. つまずきポイント（先に読む）
- ソース検証（Verify）：[`appendix/verify.md`](../appendix/verify.md)
- GitHub Actions / CI：[`appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)
- The Graph（Subgraph Studio）：[`appendix/the-graph.md`](../appendix/the-graph.md)
