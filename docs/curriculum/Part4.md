# Part 4：NFT / Security / Gas（概要と進め方）

[← 目次](./TOC.md) | [前: Day10](./Day10_Events_TheGraph.md) | [次: Day11](./Day11_NFT_Metadata.md)

このPartは「見た目が分かる題材（NFT）」から入り、セキュリティとガス最適化へ進む章だ。最後に“なぜ危ないのか/なぜ高いのか”を実測で理解する。

## このPartでできるようになること
- NFTとメタデータ（tokenURI）の構造を説明し、表示確認まで進められる。
- 代表的な脆弱性（再入など）を、再現→対策まで一度通せる。
- ガス最適化を「理屈」だけでなく「計測」で比較できる。

## このPartで扱わないこと（先に宣言）
- すべての脆弱性パターンの網羅（入門として“頻出”を優先する）。
- 速度/サイズの極限最適化（読みやすさと安全性を優先する）。

## 最短ルート（迷ったらここだけ）
1) Day11：NFT：[`Day11_NFT_Metadata.md`](./Day11_NFT_Metadata.md)  
2) Day12：セキュリティ：[`Day12_Security.md`](./Day12_Security.md)  
3) Day13：ガス最適化：[`Day13_Gas_Optimization.md`](./Day13_Gas_Optimization.md)

## チェックリスト（ここまでできれば次へ進める）
- [ ] Day11でtokenURIが意図どおり返ることを確認できる
- [ ] Day12で再入の再現と対策の違いを説明できる
- [ ] Day13で“どの変更がどれくらい効いたか”を数値で比較できる

---

[← 目次](./TOC.md)

