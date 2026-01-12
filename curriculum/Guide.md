---
layout: book
title: "読み方ガイド（学習ルート）"
description: "初心者が迷わず進めるための、読む順序・環境の使い分け・つまずき対策"
---

# 読み方ガイド（学習ルート）

この教材は Day01〜Day14 を順番に進める構成だが、初心者が迷わないように「読む順序」「環境の使い分け」「つまずきポイントの参照先」をまとめる。

> まず `curriculum/README.md` の「共通の前提」を確認してから進める。

---

## 1. まず読むページ（最短）
1) 共通の前提：[`curriculum/README.md`](./README.md)  
2) 目次（読む順序）：[`curriculum/TOC.md`](./TOC.md)  
3) 用語に迷ったら：[`appendix/glossary.md`](../appendix/glossary.md)  

---

## 2. 学習ルート（目的別）
### 2.1 スマートコントラクト中心（おすすめ）
- Day01〜Day06 を順番に進める。
- Day07 は「Verify/CI」の入口として一度読んでおく。
- Day12/Day13 で「セキュリティ/ガス」まで固める。

### 2.2 DApp中心（フロント寄り）
- Day01〜Day05 を押さえたら、Day09/Day10 を優先してよい。
- Day14 で「デプロイ→DApp接続→（任意）Verify/CI/The Graph」を通す。

### 2.3 L2や運用中心（実務寄り）
- Day07/Day08 を重点的に読む（運用・観測・記録が主題になる）。
- Day14 のチェックリストを “Done” にするのがゴールになる。

---

## 3. ローカル/テストネット/L2 の使い分け
初心者が詰まりやすいのは「何をどのネットワークで動かしているか」が曖昧になることだ。

- ローカル（hardhat）：最初に動作確認したいとき（`npm test` / `npx hardhat node`）
- テストネット（例：Sepolia）：実際のエクスプローラやVerifyを試したいとき
- L2（例：Optimism）：L2手数料や運用の流れを体験したいとき

> 環境変数とネットワーク指定（`--network sepolia` など）が一致しているか、最初に確認する。

---

## 4. つまずいたら（参照先の固定）
つまずきやすい所は付録に集約している。

- Verify：[`appendix/verify.md`](../appendix/verify.md)
- GitHub Actions / CI：[`appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)
- The Graph：[`appendix/the-graph.md`](../appendix/the-graph.md)

各Dayの末尾にも「つまずきポイント」「実行例（`reports/`）」へのリンクがあるため、まずはそこから辿る。

