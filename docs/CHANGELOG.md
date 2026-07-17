# 更新履歴（Changelog）

このページでは、本教材の「大きな変更」をまとめます。細かな修正は GitHub のコミット履歴を参照してください。

## 2026.07
- deploy workflow を testnet-first に変更し、入力検証、production 確認、network 別 GitHub Environment、最小権限、同時実行制御、action SHA pin を追加
- constructor 引数を `ARGS_JSON` の JSON 配列に統一し、workflow と deploy script の双方で network、contract identifier、引数型を検証
- Hardhat 2.x を維持したまま `@nomicfoundation/hardhat-verify` 2.1.3 と Etherscan API V2 の単一 API key 契約へ移行し、OP Sepolia を追加
- Day09 の localhost 手順から root `.env` と既知の開発用秘密鍵コピーを除去し、unlocked account から学習用 wallet へ ETH / MyToken を送る補助スクリプトを追加
- Day08 の見出し、blob sidecar retention、Fusaka / BPO1 / BPO2 / Glamsterdam / Hegotá の状態を 2026-07-11 時点の一次資料に合わせて更新
- Pages 出力に source commit と book version を埋め込み、公開 Home / CHANGELOG / Day08 の stale deployment 検出を追加

## 2026.05
- Issue #114 / Phase 5 対応：Ethereum / Solidity / L2 / Hardhat / Foundry / OpenZeppelin / The Graph の現行仕様レビューゲートを README、Home、Curriculum、Progress、Day03、Day08、Day12、参考資料、PR template に追加
- Day08 を Fusaka / PeerDAS / Blob Parameter Only fork の時点情報に更新し、L2/bridge の安全確認と `metrics/` 配下の記録例を明確化
- Day12 の監査チェックリストに署名・permit・approval・bridge・upgrade・自動解析の限界を追加
- DApp フロントエンドの Vite / Rollup / PostCSS / Picomatch を更新し、ethers 配下の `ws` advisory 対応として npm overrides を限定指定して、`npm --prefix dapp audit` で既知脆弱性 0 を確認

## 2026.02
- Issue #93 対応：教材の正誤・不整合を修正（Day1/2 の記録先統一、Day1 のコマンドと出力例の整合、Day3 の導線整理、Day12 のツール説明の誤解低減 など）
- Issue #96 対応：GitHub Pages での Markdown テーブル崩れを修正し、インラインコード末尾空白を除去（再発防止チェックを CI に追加）
- Issue #100 対応：Day03 の nvm 初期化コマンド誤記（`\.` → `\.`）を修正し、nvm の動作確認コマンドを追記
- Issue #108 対応：ローカル `npm test` では外部 RPC / 秘密鍵が不要であることを README・Home・Day03・`.env.example` に明記
- Issue #106 対応：Day03 の nvm install URL を release tag 固定に変更し、Day08 の Optimism Verify に必要な env 記載と Markdown style check の対象/ルールを補強

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
