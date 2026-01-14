# subgraph/ について

このディレクトリは The Graph のサブグラフ（Subgraph Studio）用に使う。
本リポジトリには生成物を同梱していないため、必要に応じて `graph init` で作成する。

## 推奨構成
- `subgraph/event-token/`：Day10 の EventToken を対象にしたサブグラフ
- （発展）`subgraph/market/`：Day14 の Market を対象にしたサブグラフ

## 作成例（EventToken）
リポジトリルートで実行し、`subgraph/` 配下に生成する：
```bash
graph init \
  --from-contract <EVENT_TOKEN_ADDR> \
  --network sepolia \
  subgraph/event-token
```

> メモ：生成物の内容やコマンドのオプションは更新されることがある。公式ドキュメントと `appendix/the-graph.md` を参照する。

