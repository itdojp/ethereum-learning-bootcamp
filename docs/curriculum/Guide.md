---
layout: book
title: "読み方ガイド（学習ルート）"
description: "初心者が迷わず進めるための、読む順序・環境の使い分け・つまずき対策"
---

# 読み方ガイド（学習ルート）

この教材は Day01〜Day14 を順番に進める構成だが、初心者が迷わないように「読む順序」「環境の使い分け」「つまずきポイントの参照先」をまとめる。

> まず [`docs/curriculum/README.md`](./README.md) の「共通の前提」を確認してから進める。

---

## 1. まず読むページ（最短）
1) 共通の前提：[`docs/curriculum/README.md`](./README.md)  
2) 目次（読む順序）：[`docs/curriculum/TOC.md`](./TOC.md)  
3) 用語に迷ったら：[`docs/appendix/glossary.md`](../appendix/glossary.md)  
4) 通しで作るもの：[`docs/curriculum/Project.md`](./Project.md)  

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

### 2.4 1つの小さなプロダクトとして進める（完走ルート）
この教材は章ごとに題材が変わるが、「最後に全部つなぐ（Day14）」を小さなプロダクト完成のゴールにすると迷いにくい。

- ゴール：Day14 で「デプロイ→DApp接続」まで通し、`docs/DEPLOYMENTS.md` と `docs/reports/` に記録を残す
- 中心にする題材：`MyToken` / `EventToken`（DAppとイベント購読で使う）。NFTやThe Graphは任意で足す

進め方（最小）：
1) Day01〜Day03：環境を整え、ローカルで `npm test` を通す  
2) Day04〜Day06：コントラクト実装とテスト・計測の流れを掴む  
3) Day07：テストネット/L2へデプロイし、必要ならVerifyする（詰まったら付録へ）  
4) Day09〜Day10：DAppから接続し、イベントを読める状態にする（必要ならThe Graphへ）  
5) Day14：統合チェックリストをできる範囲でDoneにする（ここが“完成”）

---

## 3. ローカル/テストネット/L2 の使い分け
初心者が詰まりやすいのは「何をどのネットワークで動かしているか」が曖昧になることだ。

- ローカル（hardhat）：最初に動作確認したいとき（`npm test` / `npx hardhat node`）
- テストネット（例：Sepolia）：実際のエクスプローラやVerifyを試したいとき
- L2（例：Optimism）：L2手数料や運用の流れを体験したいとき

> 環境変数とネットワーク指定（`--network sepolia` など）が一致しているか、最初に確認する。

### 3.1 設定差分（早見表）
#### Hardhat（テスト/スクリプト/デプロイ/Verify）
| 環境 | Hardhat network | chainId | `.env` のRPC | Verify APIキー | Explorer |
|---|---|---:|---|---|---|
| ローカル（Hardhat node） | `localhost` | 31337 | （不要） | （不要） | （なし） |
| テストネット（Sepolia） | `sepolia` | 11155111 | `SEPOLIA_RPC_URL` | `ETHERSCAN_API_KEY` | https://sepolia.etherscan.io/ |
| L2（Optimism） | `optimism` | 10 | `OPTIMISM_RPC_URL` | `OPTIMISTIC_ETHERSCAN_API_KEY` | https://optimistic.etherscan.io/ |
| Mainnet（注意） | `mainnet` | 1 | `MAINNET_RPC_URL` | `ETHERSCAN_API_KEY` | https://etherscan.io/ |

> “Explorerは合っているのに表示が出ない”場合は、そもそもチェーンが違う（別ネットワークのTxHash/アドレスを見ている）ことが多い。

#### DApp（Vite / MetaMask）
| 環境 | chainId | `dapp/.env.local` の主な変数 |
|---|---:|---|
| ローカル / Sepolia / Optimism | 31337 / 11155111 / 10 | `VITE_CHAIN_ID`, `VITE_TOKEN_ADDRESS`, `VITE_EVENT_TOKEN` |

- `VITE_CHAIN_ID` と、MetaMask側で接続中のチェーンが一致していないと動かない（Day9参照）。
- アドレス（`VITE_TOKEN_ADDRESS` 等）は **同じチェーン上でデプロイしたもの**を入れる。

---

## 4. つまずいたら（参照先の固定）
つまずきやすい所は付録に集約している。

- Verify：[`docs/appendix/verify.md`](../appendix/verify.md)（最短成功ルート→切り分け→エラー表）
- GitHub Actions / CI：[`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)（最短成功ルート→切り分け→エラー表）
- The Graph：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)（最短成功ルート→切り分け→エラー表）

各Dayの末尾にも「つまずきポイント」「実行例（`reports/`）」へのリンクがあるため、まずはそこから辿る。
