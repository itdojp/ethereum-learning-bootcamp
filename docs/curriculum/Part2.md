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

## 復習問題（理解チェック）
- Q1. 「ローカルで `npm test` が通る」ことは、何の再現性を保証するか？
- Q2. Verify が失敗しやすい原因を3つ挙げる（例：引数/設定/キー）。
- Q3. CIでだけ落ちるとき、まず確認する“差分”は何か？（手元とCIで違いが出やすい点）

### 解答例（短く）
- A1. コントラクトの振る舞い（成功/失敗条件、イベント、状態変化）が、手元で同じ手順で再現できること。
- A2. 例：コンストラクタ引数が違う、optimizerやsolc設定が違う、Explorer/APIキーが未設定（詳細は付録 `docs/appendix/verify.md`）。
- A3. 例：Node.jsバージョン、環境変数の有無、依存インストールの差（`npm ci` になっているか）など（詳細は付録 `docs/appendix/ci-github-actions.md`）。

---

[← 目次](./TOC.md)
