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

## 対象読者
- 初心者〜初級エンジニア（新卒〜実務経験2年未満）
- Ethereum / Solidity は初学者を含む

## この本でできるようになること
- ブロックチェーン/Ethereumの基本概念（Tx、Gas、PoS、L1/L2）を説明できる
- Hardhat を使ってコントラクトをテストし、スクリプトで操作できる
- ERC‑20 / ERC‑721 の基本フロー（transfer/approve/mint/tokenURI）を動かして理解できる
- L2（Blob前提のコスト構造）や、Verify/CI/The Graph の「つまずきポイント」を避けながら進められる

## 進め方（最短ルート）
1. 共通の前提を読む：[`curriculum/README.md`]({{ '/curriculum/README/' | relative_url }})
2. 通しで作るもの（ミニプロジェクト）：[`curriculum/Project.md`]({{ '/curriculum/Project/' | relative_url }})
3. 読み方ガイド：[`curriculum/Guide.md`]({{ '/curriculum/Guide/' | relative_url }})
4. 用語に迷ったら：[`appendix/glossary.md`]({{ '/appendix/glossary/' | relative_url }})
5. 目次どおりに進める：[`curriculum/TOC.md`]({{ '/curriculum/TOC/' | relative_url }})

## Quick Start（ローカル検証）
```bash
npm ci
cp .env.example .env && edit .env
npm test
```

## 目次（読む順序）
- まずは Day1 から：[`curriculum/Day01_Ethereum_Intro.md`]({{ '/curriculum/Day01_Ethereum_Intro/' | relative_url }})
- 通しで作るもの（ミニプロジェクト）：[`curriculum/Project.md`]({{ '/curriculum/Project/' | relative_url }})
- 全体の目次：[`curriculum/TOC.md`]({{ '/curriculum/TOC/' | relative_url }})

## つまずきポイント（先に読む）
- Verify：[`appendix/verify.md`]({{ '/appendix/verify/' | relative_url }})
- GitHub Actions / CI：[`appendix/ci-github-actions.md`]({{ '/appendix/ci-github-actions/' | relative_url }})
- The Graph：[`appendix/the-graph.md`]({{ '/appendix/the-graph/' | relative_url }})

## 更新履歴
- 現行バージョン：v{{ site.version }}
- 更新履歴：[`CHANGELOG.md`]({{ '/CHANGELOG/' | relative_url }})
