## 概要（必須）

- 変更内容:

## 関連 Issue（任意）

- Closes #

## 影響範囲（必須）

- 対象章/ページ（例: /path/to/page/）:
- 影響（例: 追記 / 構成変更 / リンク修正 / 図表修正）:

## QA（必須）

- [ ] Book QA（Unicode / textlint(PRH) / 内部リンク・アンカー / Jekyll build / built-site smoke）: PASS
  - 実行URL: （GitHub Actions の workflow run URL）

## Pages確認（原則必須）

- 確認URL: https://itdojp.github.io/ethereum-learning-bootcamp/ （fork/rename の場合は適宜読み替え）
- [ ] トップページ HTTP 200
- [ ] 主要導線（navigation.yml 相当）で 404 が無い
- [ ] 表示崩れが無い（図表/表/コード中心）

## プロジェクト固有チェック（推奨）

- [ ] `POLICY.md`（引用・AI利用・秘密情報）に適合している
- [ ] 章間リンク・参照リンクが壊れていない
- [ ] CI（`npm test` / `npm run check:links` など）が通っている

## 補足

- 既知の制約 / TODO:
