# CONTRIBUTING

本リポジトリ（Ethereum Learning Bootcamp）へのコントリビューション手順です。執筆の一貫性とレビュー容易性を優先します。

## 前提

- 引用/参照の扱いは `POLICY.md` を参照してください
- コントリビューションは本リポジトリのライセンス（`LICENSE.md`）の下で提供されます

## 変更の粒度（推奨）

- 1 PR = 1 目的（例: 1 日分（DayXX）の改善、付録の改善、CI/ツールの改善）
- 大規模改訂は、章（Day/Part/付録）単位に分割してください

## ブランチ命名（推奨）

- 本文: `content/<topic>`（例: `content/day06-local-testing-clarify`）
- 修正: `fix/<topic>`（例: `fix/typo-day02`）
- リポジトリ運用: `repo/<topic>`（例: `repo/add-pr-template`）
- CI: `ci/<topic>`（例: `ci/links-check`）

## レビュー観点（推奨）

- 初学者が躓くポイント（前提不足、手順抜け、用語未定義）が減っているか
- 章間リンク・参照リンクが壊れていないか
- `STYLEGUIDE.md` の表記・コードブロック方針に整合しているか（存在する場合）
- `POLICY.md`（引用・AI利用・秘密情報）に適合しているか
- CI が通っているか（導入済みの場合）

## ローカル確認（推奨）

```bash
npm ci
npm test
npm run check:links
```

`dapp/` を変更した場合は、`dapp` ディレクトリでもビルドを確認してください。

## フィードバック

- 誤字脱字・不備: Issue（`[Errata]`）として報告してください
- 改善提案: Issue（`[Content]`）として、対象ファイルと目的を記載してください

