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

---

[← 目次](./TOC.md)

