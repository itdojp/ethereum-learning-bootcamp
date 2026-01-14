# Part 3：L2 / DApp / Indexing（概要と進め方）

[← 目次](./TOC.md) | [前: Day7](./Day07_Deploy_CI.md) | [次: Day8](./Day08_L2_Rollups.md)

このPartは「コントラクトを“使う側”の視点」を増やす章だ。L2の前提（Blob）→DApp→イベント購読/Indexingまでをつなげる。

## このPartでできるようになること
- L2のコスト構造（特にDAコスト）と、Blob前提の変化を説明できる。
- フロントエンド（React + ethers）からコントラクトへ接続できる。
- イベントを購読し、必要ならThe GraphでIndexingする流れを理解できる。

## このPartで扱わないこと（先に宣言）
- 本番運用のインデックス設計（スキーマ設計やスケーリングの最適解）。
- UI/UXの作り込み（この教材では接続と検証が主題）。

## 最短ルート（迷ったらここだけ）
1) Day8：L2/Blob：[`Day08_L2_Rollups.md`](./Day08_L2_Rollups.md)  
2) Day9：DApp：[`Day09_DApp_Frontend.md`](./Day09_DApp_Frontend.md)  
3) Day10：イベント/The Graph：[`Day10_Events_TheGraph.md`](./Day10_Events_TheGraph.md)

## 先に読む付録（詰まったらここ）
- The Graph：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)

## チェックリスト（ここまでできれば次へ進める）
- [ ] Day9の `dapp/` をビルドできる（`npm --prefix dapp ci` → `npm --prefix dapp run build`）
- [ ] Day10でイベントを読める（購読できているかを確認できる）

---

[← 目次](./TOC.md)
