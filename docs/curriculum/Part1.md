# Part 1：Solidityと標準規格（概要と進め方）

[← 目次](./TOC.md) | [前: Day3](./Day03_Env_Setup.md) | [次: Day4](./Day04_Solidity_Basics.md)

このPartは「Solidityの書き方」と「標準規格（ERC）」を、動かしながら身につける章だ。ここを押さえると以降のPartが一気に楽になる。

## このPartでできるようになること
- Solidityの基本（型、可視性、イベント、エラー、支払い）を説明できる。
- ERC‑20 / ERC‑721 の最小フロー（mint/transfer/approve/tokenURI）を動かして理解できる。
- OpenZeppelin実装を「そのまま使う」だけでなく、何が入っているかを見分けられる。

## このPartで扱わないこと（先に宣言）
- アップグレード（Proxy）や複雑な権限設計（まずは基本形を理解する）。
- ガス最適化の細部（Day13でまとめて扱う）。

## 最短ルート（迷ったらここだけ）
1) Day4：Solidity基礎：[`Day04_Solidity_Basics.md`](./Day04_Solidity_Basics.md)  
2) Day5：ERC標準：[`Day05_ERC_Standards.md`](./Day05_ERC_Standards.md)

## チェックリスト（ここまでできれば次へ進める）
- [ ] Day4のテスト（または実行例）で、イベント発火とrevertを確認できる
- [ ] Day5でERC‑20/721をデプロイし、transferとtokenURIが動く

## 復習問題（理解チェック）
- Q1. `revert` は何を意味するか？テストで `revert` を確認する利点は何か？
- Q2. ERC‑20 の `approve → transferFrom` フローで、「誰が」「誰に」「何の権限」を渡しているか？
- Q3. ERC‑721 の `tokenURI` は何を指すか？最低限、どの2点を確認すると安心か？

### 解答例（短く）
- A1. `revert` は処理を失敗として巻き戻すことだ（状態が更新されない）。テストで確認すると、失敗条件が仕様どおりかを早期に検出できる。
- A2. トークン保有者が、第三者（spender）に「自分の残高から一定量を引き出してよい」権限（allowance）を与える。
- A3. メタデータ（JSON等）への参照だ。例：`tokenURI` が期待どおり返ること、参照先で名前/画像などが取得できること。

---

[← 目次](./TOC.md)
