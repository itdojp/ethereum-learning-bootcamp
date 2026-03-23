# ethereum-learning-bootcamp

14日間でEthereum開発の基礎から応用まで学ぶ完全教材。
Node.js 20 以上（npm 10+）を前提としています。

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

## 参考リンク
- Optimism Etherscan: https://optimistic.etherscan.io/
- Hardhat Etherscan plugin docs: https://hardhat.org/hardhat-runner/docs/guides/verifying

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
