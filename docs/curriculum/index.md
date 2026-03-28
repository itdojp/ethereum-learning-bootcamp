# Curriculum 共通の前提

このディレクトリ配下の手順は、原則として **本リポジトリをそのまま使って進める** 前提で書いている。
ゼロからプロジェクトを作る場合は Day3 を参考にする。

読む順序は [`docs/curriculum/TOC.md`](./TOC.md) を参照する。
目的別の進め方（学習ルート）は [`docs/curriculum/Guide.md`](./Guide.md) を参照する。
通しで作るもの（ミニプロジェクト）は [`docs/curriculum/Project.md`](./Project.md) を参照する。
進捗チェック（完走チェックリスト）は [`docs/curriculum/Progress.md`](./Progress.md) を参照する。

## 開始前チェック

### 必須
- Node.js 20 系と npm を使えること
- Git とターミナル操作の基本が分かること
- リポジトリルートで `npm ci` と `npm test` を実行できること
- 学習用の `.env` を自分で作成し、秘密情報をコミットしない前提を理解していること

### 任意だが後半で必要になりやすいもの
- RPC プロバイダのアカウントとテストネット用エンドポイント（Day03 以降）
- テスト ETH を受け取れるウォレット（Sepolia / Optimism など）
- MetaMask 等のウォレット拡張（Day09 以降）
- The Graph のアカウント（Day10 を実際に試す場合）
- IPFS / NFT メタデータ配信用のサービスアカウント（Day11 を実際に試す場合）

### 安全運用の前提
- 学習にはテストネット用またはローカル開発用の秘密鍵だけを使う。Mainnet や実資産を扱う鍵は使わない。
- RPC、IPFS、The Graph、Explorer などの外部サービスは無料枠や課金条件、レート制限がある。利用前に公式情報を確認する。
- アドレス、Tx、イベント、NFT メタデータは公開前提で扱う。共有してよい情報だけを使う。

## 0. 表記ルール（この本の読み方）
- `<...>` や `YOUR_...` / `0xYOUR_...` は **自分の値に置き換える**（例：`YOUR_API_KEY`, `0xYOUR_PRIVATE_KEY`, `<CONTRACT_ADDRESS>`, `<CID>`）。
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

### 2.1 動作確認済みバージョン（目安）

この教材は「本リポジトリの `package.json` をそのまま使う」前提のため、依存関係の実体は `npm ci` の lock に従う。

- Node.js: 20.x
- Hardhat: 2.22.x
- Solidity: 0.8.24
- ethers: v6（Hardhat toolbox 経由）
- OpenZeppelin Contracts: 5.0.2
- TypeScript: 5.4.x

### 2.2 確認時点と再確認ポイント
- このカリキュラムは、`package.json` / lock file / `docs/reports/` を **2026-03-24 時点**で確認した内容を基準としている。
- 特に変わりやすいのは、RPC 提供者の UI / API キー取得手順、Explorer の Verify 画面、GitHub Actions の画面導線、The Graph の管理画面である。
- 本文どおりに進まない場合は、まず `npm ci` と `npm test` が通ることを確認し、そのうえで付録の切り分け手順と各サービスの公式ドキュメントを参照する。
- 章末の「確認コマンド」と `docs/reports/` が再現できれば、本教材の主要手順は概ね追従できていると判断してよい。

## 3. 環境変数（`.env`）
- ローカル `npm test` だけなら `.env` の作成や値の投入は不要。Sepolia / Optimism へ deploy・verify するときだけ設定する。
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
- 実行ログ一覧：[`docs/reports/index.md`](../reports/index.md)
