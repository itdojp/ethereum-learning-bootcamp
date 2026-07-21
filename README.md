# ethereum-learning-bootcamp

14日間でEthereum開発の基礎から応用まで学ぶ完全教材。
Node.js 22.13.0 以上（npm 10+）を前提としています。

## 3分で把握する
- 想定読者: JavaScript/TypeScript と Git の基礎がある初学者〜初級エンジニア
- 前提: Node.js 22.13.0+、npm、ターミナル操作、ローカルで `npm run install:reviewed` と `npm test` を実行できること
- 完走後にできること: Hardhat を使ったコントラクト開発、ERC-20/ERC-721 の基本操作、DApp 接続、テスト/Verify/CI の基礎理解
- 最短開始: `npm run install:reviewed` → `npm test` → Pages の Day01 から順に読む
- 完走条件: Day01〜Day14 の要点を追い、ローカルテストと最小プロジェクトの流れを説明できること

## 読み方（GitHub Pages）
- 書籍（GitHub Pages）：https://itdojp.github.io/ethereum-learning-bootcamp/
- シリーズ（IT Engineer Knowledge Architecture）：https://itdojp.github.io/it-engineer-knowledge-architecture/
- 読み方ガイド：https://itdojp.github.io/ethereum-learning-bootcamp/curriculum/Guide/
- 更新履歴：https://itdojp.github.io/ethereum-learning-bootcamp/CHANGELOG/

## Quick Start
### ローカル検証
```bash
npm run install:reviewed
npm run check:toolchain
npm test
npm run check:security
```

### 外部ネットワークへ deploy・verify する場合
```bash
npm run install:reviewed
cp .env.example .env
# 任意のエディタで .env を開いて編集する（例: nano .env / code .env）
```
- `SEPOLIA_RPC_URL` / `PRIVATE_KEY`: Sepolia へ deploy する場合に必要
- `OPTIMISM_SEPOLIA_RPC_URL` / `PRIVATE_KEY`: OP Sepolia へ deploy する場合に必要
- `MAINNET_RPC_URL`: Mainnet の read / Verify にだけ使用（このリポジトリからは deploy しない）
- `OPTIMISM_RPC_URL`: Optimism の read / Verify にだけ使用（このリポジトリからは deploy しない）
- `ETHERSCAN_API_KEY`: Etherscan V2 で Sepolia / OP Sepolia / Mainnet / Optimism を verify する場合に共通で必要

GitHub Actions の deploy は Sepolia / OP Sepolia 専用とし、GitHub Actions から本番 network へ deploy しない。本番用 private key を GitHub Secrets に保存しない。Mainnet / Optimism の設定は read / Verify 用で、`hardhat.config.ts` は signer account を読み込まない。

（まとめて確認する場合：`npm run check:all`）

`npm run check:deploy-safety` は deploy 入力境界、action SHA pin、Etherscan V2 / chain 解決を検査する。`npm run check:docs-consistency` は章番号と公開 marker を検査する。

### メタデータ整合性チェック

```bash
npm run check:metadata
```

`npm run check:metadata` は、`book-config.json` / `package.json` / `package-lock.json` / `docs/_config.yml` / `docs/index.md` のタイトル・説明・著者・版数・公開URLがずれていないことを検証します。

### Hardhat / Solidity ツールチェーン整合性チェック

```bash
npm run check:toolchain
```

`npm run check:toolchain` は、Hardhat 3.11.0、Node.js 22.13.0以上、公式Ethers/Mocha plugin群、Solidity 0.8.24のexact pinを検証します。`hardhat.config.ts` はlockfile内のローカル `solc-js` を使うため、clean environmentでもコンパイラ取得先に依存しません。`npm run check:install-scripts` はルートと`dapp/`のlockfileにあるinstall scriptをallowlistと照合します。CIは照合前の実行を防ぐため、`npm ci --ignore-scripts`の後に監査済み`esbuild`だけをrebuildします。

### 依存関係のセキュリティチェック

```bash
npm run check:security
```

`npm run check:security` はルートと `dapp/` のdevelopment dependencyを含む `npm audit` を実行し、moderate以上で失敗します。`contracts/*.sol` に取り込まれるOpenZeppelin Contractsはルートの `dependencies` に配置しています。2026-07-22時点でroot/dappともhigh・criticalは0件です。Hardhat Verify 3の旧Ethers ABI経路など、upstreamに修正版がないlow advisoryは件数を記録し、gateを弱めず継続監視します。

## 安全運用の注意
- 学習用の秘密鍵とテストネットを使い、Mainnet や実資産を扱う鍵は使わないでください。
- AI レビューは差分検査を補助するが、独立した人間承認や秘密鍵の分離を代替しません。単独運用では本番 deploy 自体をこのリポジトリの自動化対象外にします。
- `.env` / `.env.local` はコミットせず、ログや画面共有にも秘密情報を残さないでください。
- RPC、Explorer、IPFS、The Graph などの外部サービスは無料枠や課金条件、レート制限があるため、利用前に公式情報を確認してください。
- アドレス、トランザクション、イベント、NFTメタデータは公開前提で扱ってください。
- ウォレットのリカバリーフレーズ、秘密鍵、署名リクエスト、token approval は、フィッシングや資産流出の主要経路です。教材外のサイトやチャットで入力・署名しないでください。

## Phase 5 現行仕様レビューゲート
- 確認日: 2026-07-22（Asia/Tokyo）。本書は `package.json` / `package-lock.json` の再現性を優先し、Hardhat 3.11.0・Solidity 0.8.24・OpenZeppelin Contracts 5.0.2の学習用構成を維持します。
- 新規プロジェクトへ転用する場合は、Hardhat 3の最新minor、Solidity最新リリース、OpenZeppelin Contracts 5.x、Foundry、The Graph、各L2/Explorer/RPCの公式ドキュメントを再確認してください。
- L2/Blob は Dencun、Pectra、Fusaka/PeerDAS 以降も Blob Parameter Only fork 等で容量・手数料前提が変わるため、本文の数値は「観測時点の前提」として扱い、実測と公式情報を優先してください。
- GitHub Copilot review の本文・inline comment・suggestion は全件確認し、対応後に未解決 review thread 0 を確認してからマージします。
- 公開版の source commit と版数は [`build-info.json`](https://itdojp.github.io/ethereum-learning-bootcamp/build-info.json) で機械的に確認できます。

## 参考リンク
- Optimism Etherscan: https://optimistic.etherscan.io/
- Hardhat 3 docs: https://hardhat.org/docs/getting-started
- Hardhat 3 migration guide: https://hardhat.org/docs/migrate-from-hardhat2
- Ethereum security and scam prevention: https://ethereum.org/security/

## 構成
- 公開用コンテンツ（GitHub Pages のソース想定）：`docs/`
- `docs/curriculum/` : Day01〜Day14 各日の教科書＋ハンズオン
- 読む順序（目次）：`docs/curriculum/TOC.md`
- `docs/appendix/` : 補足資料（EIP, リソース集）
- `contracts/`, `scripts/`, `test/`: 実践サンプル
- `.github/workflows/`: CI/CD雛形
- Quick reference: `docs/appendix/glossary.md`（主要用語リスト）

## ライセンス / お問い合わせ
**License**: CC BY-NC-SA 4.0 / Non-Commercial. Commercial use requires permission from ITDO Inc.  
商用利用は別途許諾が必要です。お問い合わせ: [contact@itdo.jp](mailto:contact@itdo.jp)

© 2025 ITDO Inc.
