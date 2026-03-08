# 更新履歴（Changelog）

このページでは、本教材の「大きな変更」をまとめます。細かな修正は GitHub のコミット履歴を参照してください。

## 2026.01
- 書籍（GitHub Pages）として読みやすいレイアウト／ナビゲーションを整備
- 進捗チェック（完走チェックリスト）ページを追加し、迷子になりにくくした
- Part0〜Part5 に復習問題（理解チェック）を追加し、区切りで振り返れるようにした
- Day01〜Day14 に理解チェック（3問）を追加し、章末で要点を確認できるようにした
- 用語集（Glossary）をカテゴリ分けし、基礎用語（Gas/EVM/calldata など）を補強
- Day01〜Day14 の章末に「つまずきポイント / まとめ / 提出物 / 実行例」を追加し、学習の区切りを明確化
- 付録を強化（Verify / CI / The Graph / Account Abstraction など）
- CI に Markdown 相対リンクチェックと DApp build を追加
- 実行ログ（`docs/reports/`）を整備し、再現手順の確認に使えるようにした

## 2026.02
- Issue #93 対応：教材の正誤・不整合を修正（Day1/2 の記録先統一、Day1 のコマンドと出力例の整合、Day3 の導線整理、Day12 のツール説明の誤解低減 など）
- Issue #96 対応：GitHub Pages での Markdown テーブル崩れを修正し、インラインコード末尾空白を除去（再発防止チェックを CI に追加）
- Issue #100 対応：Day03 の nvm 初期化コマンド誤記（`\\.` → `\.`）を修正し、nvm の動作確認コマンドを追記
- Issue #106 対応：Day03 の nvm install URL を release tag 固定に変更し、Day08 の Optimism Verify に必要な env 記載と Markdown style check の対象/ルールを補強
