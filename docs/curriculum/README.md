# Curriculum 共通の前提

このディレクトリ配下の手順は、原則として **本リポジトリをそのまま使って進める** 前提で書いている。
ゼロからプロジェクトを作る場合は Day3 を参考にする。

読む順序は [`docs/curriculum/TOC.md`](./TOC.md) を参照する。
目的別の進め方（学習ルート）は [`docs/curriculum/Guide.md`](./Guide.md) を参照する。
通しで作るもの（ミニプロジェクト）は [`docs/curriculum/Project.md`](./Project.md) を参照する。

## 0. 表記ルール（この本の読み方）
- `<...>` は **自分の値に置き換える**（例：`<YOUR_API_KEY>`, `<PRIVATE_KEY>`, `<CONTRACT_ADDRESS>`）。
- [Tx](../appendix/glossary.md) はトランザクション（transaction）の略として使う。
- [RPC](../appendix/glossary.md) はノードと通信するエンドポイント（JSON-RPC）として使う。
- `0x...` は16進数表記だ。必要に応じて10進数へ変換して読む（Day1参照）。
- コマンドは原則「このリポジトリ直下（ルート）」で実行する。`dapp/` は別プロジェクトなので、`cd dapp` または `npm --prefix dapp ...` を使う。
- 出力例は環境差分がある。アドレス/ハッシュ/ブロック番号は変わり得るため、**どの値が変わってよいか**を意識して読む（迷ったら `docs/reports/` を参照）。

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
- ソース検証（Verify）：[`docs/appendix/verify.md`](../appendix/verify.md)
- GitHub Actions / CI：[`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)
- The Graph（Subgraph Studio）：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)

## 6. 実行ログ（期待される出力例）
本文は環境差分で出力が変わり得る。迷ったら `docs/reports/` の実行ログと突き合わせる。
- 実行ログ一覧：[`reports/index.md`](../reports/index.md)
