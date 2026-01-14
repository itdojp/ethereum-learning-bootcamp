---
layout: book
title: "進捗チェック（完走チェックリスト）"
description: "Day01〜Day14を迷わず進めるための、最小の成功判定と任意項目"
---

# 進捗チェック（完走チェックリスト）

このページは、Day01〜Day14を進めるときの「最小の成功判定」をまとめたチェックリストだ。  
迷ったら、まずここで「いまどこまでできているか」を確認する。

> まず [`docs/curriculum/README.md`](./README.md) の「共通の前提」を確認してから進める。

## 使い方
- このチェックリストは「写して自分のメモにする」用途を想定する（GitHub Pages上のチェックは保存されない）。
- 迷ったら「最短完走」だけ先にDoneにし、任意項目は後回しでよい。

## 最短完走（この本のゴール）
- [ ] ルートで `npm test` が通る
- [ ] 任意ネットワークへデプロイし、DAppから接続して動作確認できる
- [ ] 記録（`docs/DEPLOYMENTS.md` と `docs/reports/`）を残せる

## Day別チェック（最小）
> 各Dayの詳細は本文へ。詰まったら付録（Verify/CI/The Graph）へ逃がす。

### Part 0：導入・環境
- [ ] Day1：RPCを叩き、ブロック番号を10進数で読める（本文：[`docs/curriculum/Day01_Ethereum_Intro.md`](./Day01_Ethereum_Intro.md)）
- [ ] Day2：Txの `gasUsed` と `effectiveGasPrice` を取得し、意味を説明できる（本文：[`docs/curriculum/Day02_Transaction_Gas.md`](./Day02_Transaction_Gas.md)）
- [ ] Day3：`npm ci` → `npm test` が通り、（任意）テストネットへデプロイできる（本文：[`docs/curriculum/Day03_Env_Setup.md`](./Day03_Env_Setup.md)）

### Part 1：Solidityと標準規格
- [ ] Day4：イベント/エラー/ETH受領の最小構成をテストで確認できる（本文：[`docs/curriculum/Day04_Solidity_Basics.md`](./Day04_Solidity_Basics.md)）
- [ ] Day5：ERC‑20 の `approve→transferFrom` と、NFTの `tokenURI` を動かして確認できる（本文：[`docs/curriculum/Day05_ERC_Standards.md`](./Day05_ERC_Standards.md)）

### Part 2：テスト・デプロイ・運用
- [ ] Day6：ガス計測の出力を読み、差分を比較できる（本文：[`docs/curriculum/Day06_Local_Testing.md`](./Day06_Local_Testing.md)）
- [ ] Day7：デプロイ結果を `docs/DEPLOYMENTS.md` に残せる（本文：[`docs/curriculum/Day07_Deploy_CI.md`](./Day07_Deploy_CI.md)）
  - [ ] （任意）Verifyを一度通せる（付録：[`docs/appendix/verify.md`](../appendix/verify.md)）
  - [ ] （任意）CIで `npm test` が回る（付録：[`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)）

### Part 3：L2 / DApp / Indexing
- [ ] Day8：L2へデプロイし、手数料/確定時間を記録できる（本文：[`docs/curriculum/Day08_L2_Rollups.md`](./Day08_L2_Rollups.md)）
- [ ] Day9：`dapp/` を起動し、ウォレット接続と残高表示を確認できる（本文：[`docs/curriculum/Day09_DApp_Frontend.md`](./Day09_DApp_Frontend.md)）
- [ ] Day10：イベント購読ができる（本文：[`docs/curriculum/Day10_Events_TheGraph.md`](./Day10_Events_TheGraph.md)）
  - [ ] （任意）The Graph で `startBlock` を入れて build できる（付録：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)）

### Part 4：NFT / Security / Gas
- [ ] Day11：`tokenURI` とメタデータ表示（IPFS Gateway）を確認できる（本文：[`docs/curriculum/Day11_NFT_Metadata.md`](./Day11_NFT_Metadata.md)）
- [ ] Day12：再入を再現し、対策の違いを説明できる（本文：[`docs/curriculum/Day12_Security.md`](./Day12_Security.md)）
- [ ] Day13：ガス最適化を実測で比較できる（本文：[`docs/curriculum/Day13_Gas_Optimization.md`](./Day13_Gas_Optimization.md)）

### Part 5：統合
- [ ] Day14：デプロイ→DApp接続→（任意）Verify/CI/The Graph を、できる範囲で統合できる（本文：[`docs/curriculum/Day14_Integration.md`](./Day14_Integration.md)）

