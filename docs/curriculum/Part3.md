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

## 復習問題（理解チェック）
- Q1. L2のコスト構造で「DAコスト」が重要になりやすいのはなぜか？（Blobの文脈で）
- Q2. DAppが動かないとき、まず疑うべき設定ミスを2つ挙げる（MetaMask/環境変数）。
- Q3. The Graph で `startBlock` を入れる目的は何か？

### 解答例（短く）
- A1. rollupではL1へ投稿するデータがコストの中心になりやすい。Blob（EIP‑4844）はその単価に影響するため、L2手数料の体感に直結する。
- A2. 例：接続中のチェーンIDが違う、コントラクトアドレスが別チェーンのもの（`VITE_CHAIN_ID` / `VITE_*_ADDRESS` の不一致）。
- A3. インデックス対象の範囲を絞り、不要な過去ブロックを走査しないため。基本はデプロイTxのブロック以降にする。

---

[← 目次](./TOC.md)
