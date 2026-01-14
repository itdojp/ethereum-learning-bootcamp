---
layout: book
title: "ミニプロジェクト（通しで作るもの）"
description: "Day01〜Day14 を通して、MyToken / EventToken / DApp を“1つの小さなプロダクト”として完成させる"
---

# ミニプロジェクト（通しで作るもの）

この教材は Day01〜Day14 を順番に進める構成だが、章ごとに題材が変わるため「今どこに向かっているか」を見失いやすい。
そこで本ページでは、Day14 の統合（デプロイ＋DApp接続）を **小さなプロダクトの完成**として、各Dayの位置づけを整理する。

> まず [`docs/curriculum/README.md`](./README.md) の「共通の前提」を確認してから進める。

---

## 1. 何を作るか（完成イメージ）
完成形は「コントラクトをデプロイし、DAppから動かして、記録を残せる」状態だ。

- コントラクト：`MyToken`（ERC‑20）/ `EventToken`（イベント購読用）を中心にする
- DApp：`dapp/` からウォレット接続し、残高表示・送金・イベント購読を確認する
- 記録：`docs/DEPLOYMENTS.md`（デプロイ記録）と `docs/reports/`（実行ログ）を残す

> NFT や The Graph、CI/Verify は「必要になったら足す」任意要素として扱う（Day14 のチェックリスト参照）。

---

## 2. 最短で“完成”まで通す（迷ったら）
1) Day03：`npm test` が通る状態まで整える：[`Day03_Env_Setup.md`](./Day03_Env_Setup.md)  
2) Day05：トークンを理解し、デプロイできる状態にする：[`Day05_ERC_Standards.md`](./Day05_ERC_Standards.md)  
3) Day09：DApp から接続して残高を見られる状態にする：[`Day09_DApp_Frontend.md`](./Day09_DApp_Frontend.md)  
4) Day10：イベントを読める状態にする（任意でThe Graph）：[`Day10_Events_TheGraph.md`](./Day10_Events_TheGraph.md)  
5) Day14：統合チェックリストをできる範囲でDoneにする：[`Day14_Integration.md`](./Day14_Integration.md)

---

## 3. Dayごとの位置づけ（プロダクト視点）
| Day | 章の主題 | プロダクトとしての増分（何が進むか） |
|---|---|---|
| Day01 | 全体像 / RPC | ネットワーク・用語・数値の読み方を揃える（迷子防止） |
| Day02 | Gas / Tx | 手数料の見方を揃え、後の計測（Day06/Day13）につなげる |
| Day03 | 環境 | `npm test` が通る状態にして、以降の開発ができる土台を作る |
| Day04 | Solidity基礎 | 状態・イベント・revert の基本形を実装し、テストで検証する練習をする |
| Day05 | ERC | `MyToken` / `EventToken` を理解し、デプロイ・操作できる状態にする |
| Day06 | ローカル検証 | テスト・カバレッジ・ガス計測の回し方を固める（再現性を上げる） |
| Day07 | デプロイ/Verify/CI | “外部に出す”運用（デプロイ記録、Verify、CI）の入口を作る |
| Day08 | L2/Blob | L2コスト構造の前提を押さえ、どこで動かすか判断できるようにする |
| Day09 | DApp | DApp から `MyToken` を読み書きできる状態にする |
| Day10 | Events/The Graph | `EventToken` のイベント購読を通し、履歴取得の方法を増やす（任意でThe Graph） |
| Day11 | NFT/IPFS | “表示が分かる題材”で `tokenURI`/IPFS の流れを体験し、外部依存を扱う練習をする |
| Day12 | Security | 脆弱性の再現と対策を体験し、自分の実装に当てはめて考える土台を作る |
| Day13 | Gas最適化 | “効くポイント”を実測で掴み、数値で比較して判断できるようにする |
| Day14 | 統合 | デプロイ→DApp接続→（任意）Verify/CI/The Graph を通し、成果物として残す |

---

## 4. 成果物（最低限）
本当に役立つのは「あとで再現できる」成果物だ。最小でも次を残す。

- `docs/DEPLOYMENTS.md`：ネットワーク、アドレス、TxHash、設定（solc/optimizer）  
- `docs/reports/`：実行したコマンドと、成功判定に必要な最小ログ  

> 例の書き方は Day14 を正とする：[`Day14_Integration.md`](./Day14_Integration.md)

