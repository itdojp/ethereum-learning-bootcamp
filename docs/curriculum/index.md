# Curriculum 共通の前提

このディレクトリ配下の手順は、原則として **本リポジトリをそのまま使って進める** 前提で書いている。
ゼロからプロジェクトを作る場合は Day3 を参考にする。

読む順序は [`docs/curriculum/TOC.md`](./TOC.md) を参照する。
目的別の進め方（学習ルート）は [`docs/curriculum/Guide.md`](./Guide.md) を参照する。
通しで作るもの（ミニプロジェクト）は [`docs/curriculum/Project.md`](./Project.md) を参照する。
進捗チェック（完走チェックリスト）は [`docs/curriculum/Progress.md`](./Progress.md) を参照する。

## 開始前チェック

### 必須
- Node.js 22.12.0以上とnpmを使えること（本リポジトリのHardhat 3.11.0再現用）
- Git とターミナル操作の基本が分かること
- リポジトリルートで `npm run install:reviewed` と `npm test` を実行できること
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
- `dapp/` は別のプロジェクト（別 `package.json`）なので、リポジトリルートで `npm run dapp:ci:safe` を実行する。

## 2. Node.js / npm
- 必須：Node.js 22.12.0以上
- ルートで依存を入れる：
  - `npm run install:reviewed`
- `dapp/` 側の依存を入れる（必要な場合）：
  - `npm run dapp:ci:safe`

### 2.1 動作確認済みバージョン（目安）

この教材は「本リポジトリの `package.json` をそのまま使う」前提のため、依存関係の実体は `npm run install:reviewed` が使用するlockfileに従う。

- Node.js: 22.12.0以上（本リポジトリのHardhat 3.11.0再現用）
- Hardhat: 3.11.0（公式pluginを個別にexact pin）
- Solidity: 0.8.24
- ethers: 6.17.0（`@nomicfoundation/hardhat-ethers` 4.0.15経由）
- OpenZeppelin Contracts: 5.0.2
- TypeScript: 5.9.3

### 2.2 確認時点と再確認ポイント
- このカリキュラムは、`package.json` / lock file / `docs/reports/` を **2026-07-22（Asia/Tokyo）時点**で確認した内容を基準としている。
- 特に変わりやすいのは、Hardhat 3のminor versionとNode.jsサポート、Solidity最新リリース、OpenZeppelin Contracts 5.x、RPC提供者のUI/APIキー取得手順、ExplorerのVerify画面、GitHub Actionsの画面導線、The Graphの管理画面である。
- 本文どおりに進まない場合は、まず `npm run install:reviewed` と `npm test` が通ることを確認し、そのうえで付録の切り分け手順と各サービスの公式ドキュメントを参照する。
- 章末の「確認コマンド」と `docs/reports/` が再現できれば、本教材の主要手順は概ね追従できていると判断してよい。

### 2.3 現行仕様レビューゲート
- 本リポジトリを学習用に進める場合は、lockfileによる再現性を優先し、Hardhat 3.11.0 / Node.js 22.12.0以上 / Solidity 0.8.24の組み合わせを無検証で変更しない。
- 新規プロジェクトを作る場合は、Hardhat 3の公式ドキュメント、Node.jsサポート条件、plugin互換性、`hardhat.config`の形式を確認してから作業する。
- Solidity は公式ドキュメントが「デプロイ時は最新リリースを使う」ことを推奨しているため、本番転用時は pragma、compiler、known bugs、optimizer、EVM version を確認する。
- OpenZeppelin Contracts は 5.x の `latest` / `dev` tag と監査済み release の扱い、upgradeable 版との storage 互換性を確認する。
- Sepolia、Holesky、Hoodi、Optimism、Arbitrum などの testnet / L2 名、faucet、Explorer、RPC、Verify API は固定前提にしない。各チェーンの公式情報を確認し、学習用の鍵だけを使う。
- Dencun / Pectra / Fusaka・PeerDAS / Blob Parameter Only fork の影響で、L2手数料や blob target/max は時点依存になる。Day08 では数値暗記ではなく、観測時刻・RPC・chainId・txHash を記録する。

## 3. 環境変数（`.env`）
- ローカル `npm test` と localhost deploy だけなら `.env` の作成や値の投入は不要。外部 network へ deploy・verify するときだけ設定する。
- ルートは `.env.example` をコピーして `.env` を作成する：
  - `cp .env.example .env`
- 秘密鍵・API キーはコミットしない（`.gitignore` 済み）。

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
