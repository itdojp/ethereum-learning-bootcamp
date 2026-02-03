---
layout: book
title: "Ethereum Learning Bootcamp"
description: "14日間でEthereum開発の基礎から応用まで学ぶ完全教材"
permalink: /
---

# Ethereum Learning Bootcamp

この教材は、**Ethereum / Solidity / DApp** を「手を動かしながら」学ぶための 14 日間ブートキャンプだ。

本書は **IT Engineer Knowledge Architecture** シリーズの 1 冊として公開することを想定している。  
書籍一覧：<https://itdojp.github.io/it-engineer-knowledge-architecture/>

## 想定読者
- 初心者〜初級エンジニア（新卒〜実務経験2年未満）
- Ethereum / Solidity は初学者を含む

## 学習成果
- ブロックチェーン/Ethereumの基本概念（Tx、Gas、PoS、L1/L2）を説明できる
- Hardhat を使ってコントラクトをテストし、スクリプトで操作できる
- ERC‑20 / ERC‑721 の基本フロー（transfer/approve/mint/tokenURI）を動かして理解できる
- L2（Blob前提のコスト構造）や、Verify/CI/The Graph の「つまずきポイント」を避けながら進められる

## 進め方（最短ルート）
1. 共通の前提を読む：[`docs/curriculum/index.md`]({{ '/curriculum/' | relative_url }})
2. 通しで作るもの（ミニプロジェクト）：[`docs/curriculum/Project.md`]({{ '/curriculum/Project/' | relative_url }})
3. 読み方ガイド：[`docs/curriculum/Guide.md`]({{ '/curriculum/Guide/' | relative_url }})
4. 進捗チェック：[`docs/curriculum/Progress.md`]({{ '/curriculum/Progress/' | relative_url }})
5. 用語に迷ったら：[`docs/appendix/glossary.md`]({{ '/appendix/glossary/' | relative_url }})
6. 目次どおりに進める：[`docs/curriculum/TOC.md`]({{ '/curriculum/TOC/' | relative_url }})

## Quick Start（ローカル検証）
```bash
npm ci
cp .env.example .env && edit .env
npm test
```

## 前提知識
（前提知識を記載してください）

## 所要時間
（所要時間の目安を記載してください）

## 読み方ガイド
- 本書の読み進め方を記載してください
- 推奨学習順序やゴールを明示します

## ライセンス
本書は CC BY-NC-SA 4.0 で公開されています。商用利用は別途契約が必要です。

## 目次
- まずは Day1 から：[`docs/curriculum/Day01_Ethereum_Intro.md`]({{ '/curriculum/Day01_Ethereum_Intro/' | relative_url }})
- 通しで作るもの（ミニプロジェクト）：[`docs/curriculum/Project.md`]({{ '/curriculum/Project/' | relative_url }})
- 全体の目次：[`docs/curriculum/TOC.md`]({{ '/curriculum/TOC/' | relative_url }})

## つまずきポイント（先に読む）
- Verify：[`docs/appendix/verify.md`]({{ '/appendix/verify/' | relative_url }})
- GitHub Actions / CI：[`docs/appendix/ci-github-actions.md`]({{ '/appendix/ci-github-actions/' | relative_url }})
- The Graph：[`docs/appendix/the-graph.md`]({{ '/appendix/the-graph/' | relative_url }})

## 更新履歴
- 現行バージョン：v{{ site.version }}
- 更新履歴：[`docs/CHANGELOG.md`]({{ '/CHANGELOG/' | relative_url }})
