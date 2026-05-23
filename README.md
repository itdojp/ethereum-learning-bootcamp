# ethereum-learning-bootcamp

14日間でEthereum開発の基礎から応用まで学ぶ完全教材。
Node.js 20 以上（npm 10+）を前提としています。

## 3分で把握する
- 想定読者: JavaScript/TypeScript と Git の基礎がある初学者〜初級エンジニア
- 前提: Node.js 20+、npm、ターミナル操作、ローカルで `npm ci` と `npm test` を実行できること
- 完走後にできること: Hardhat を使ったコントラクト開発、ERC-20/ERC-721 の基本操作、DApp 接続、テスト/Verify/CI の基礎理解
- 最短開始: `npm ci` → `.env.example` をコピー → `npm test` → Pages の Day01 から順に読む
- 完走条件: Day01〜Day14 の要点を追い、ローカルテストと最小プロジェクトの流れを説明できること

## 読み方（GitHub Pages）
- 書籍（GitHub Pages）：https://itdojp.github.io/ethereum-learning-bootcamp/
- シリーズ（IT Engineer Knowledge Architecture）：https://itdojp.github.io/it-engineer-knowledge-architecture/
- 読み方ガイド：https://itdojp.github.io/ethereum-learning-bootcamp/curriculum/Guide/
- 更新履歴：https://itdojp.github.io/ethereum-learning-bootcamp/CHANGELOG/

## Quick Start
### ローカル検証
```bash
npm ci
npm test
```

### Sepolia / Optimism へ deploy・verify する場合
```bash
npm ci
cp .env.example .env
# 任意のエディタで .env を開いて編集する（例: nano .env / code .env）
```
- `SEPOLIA_RPC_URL` / `PRIVATE_KEY`: Sepolia へ deploy する場合に必要
- `ETHERSCAN_API_KEY`: Sepolia で verify する場合に必要
- `OPTIMISM_RPC_URL` / `PRIVATE_KEY`: Optimism へ deploy する場合に必要
- `OPTIMISTIC_ETHERSCAN_API_KEY`: Optimism で verify する場合に必要

（まとめて確認する場合：`npm run check:all`）

## 安全運用の注意
- 学習用の秘密鍵とテストネットを使い、Mainnet や実資産を扱う鍵は使わないでください。
- `.env` / `.env.local` はコミットせず、ログや画面共有にも秘密情報を残さないでください。
- RPC、Explorer、IPFS、The Graph などの外部サービスは無料枠や課金条件、レート制限があるため、利用前に公式情報を確認してください。
- アドレス、トランザクション、イベント、NFTメタデータは公開前提で扱ってください。
- ウォレットのリカバリーフレーズ、秘密鍵、署名リクエスト、token approval は、フィッシングや資産流出の主要経路です。教材外のサイトやチャットで入力・署名しないでください。

## Phase 5 現行仕様レビューゲート
- 確認日: 2026-05-23（Asia/Tokyo）。本書は `package.json` / `package-lock.json` の再現性を優先し、Hardhat 2.x・Solidity 0.8.24・OpenZeppelin Contracts 5.0.2 の学習用構成を維持します。
- 新規プロジェクトへ転用する場合は、Hardhat 3、Solidity 最新リリース、OpenZeppelin Contracts 5.x、Foundry、The Graph、各L2/Explorer/RPCの公式ドキュメントを再確認してください。
- L2/Blob は Dencun、Pectra、Fusaka/PeerDAS 以降も Blob Parameter Only fork 等で容量・手数料前提が変わるため、本文の数値は「観測時点の前提」として扱い、実測と公式情報を優先してください。
- GitHub Copilot review の本文・inline comment・suggestion は全件確認し、対応後に未解決 review thread 0 を確認してからマージします。

## 参考リンク
- Optimism Etherscan: https://optimistic.etherscan.io/
- Hardhat 2 verify docs: https://v2.hardhat.org/hardhat-runner/docs/guides/verifying
- Hardhat 3 docs: https://hardhat.org/docs/getting-started
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
