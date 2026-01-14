# Part 2：テスト・デプロイ・運用（概要と進め方）

[← 目次](./TOC.md) | [前: Day5](./Day05_ERC_Standards.md) | [次: Day6](./Day06_Local_Testing.md)

このPartは「動いた」を「再現できる」に変える章だ。ローカル検証→デプロイ→Verify→CIまでを、実務の流れとしてつなぐ。

## このPartでできるようになること
- テスト/カバレッジ/ガス計測を、手元で回して比較できる。
- テストネットやL2へデプロイし、エクスプローラで確認できる。
- Verify（ソース検証）とCIの“つまずきポイント”を避けながら進められる。

## このPartで扱わないこと（先に宣言）
- 「一発で全部自動化する」完璧なCI（まずは手動確認と最小自動化から始める）。
- 監視/アラートなどの運用設計（本教材の範囲外）。

## 最短ルート（迷ったらここだけ）
1) Day6：ローカル検証：[`Day06_Local_Testing.md`](./Day06_Local_Testing.md)  
2) Day7：デプロイ/Verify/CI：[`Day07_Deploy_CI.md`](./Day07_Deploy_CI.md)

## 先に読む付録（詰まったらここ）
- Verify：[`docs/appendix/verify.md`](../appendix/verify.md)
- GitHub Actions / CI：[`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)

## チェックリスト（ここまでできれば次へ進める）
- [ ] `npm test` が通る（ローカル）
- [ ] Day6のガス計測の“読み方”を説明できる（数値の意味を取り違えない）
- [ ] Day7でデプロイ→（任意）Verifyまで一度通せる

---

[← 目次](./TOC.md)
