# subgraph/ について

このページは、リポジトリルートに作る `subgraph/`（The Graph の生成物）について説明する。
`docs/subgraph/` はGitHub Pages用の説明ページであり、生成物は本リポジトリには同梱していない。
必要に応じて `graph init` で作成して進める。2026-07-22にclean environmentで確認したCLIは `@graphprotocol/graph-cli@0.98.1`（Node.js 20.18.1以上）である。

## 推奨構成
- `subgraph/event-token/`：Day10 の EventToken を対象にしたサブグラフ
- （発展）`subgraph/market/`：Day14 の Market を対象にしたサブグラフ

## 識別子と生成先

- `SUBGRAPH_SLUG`：Subgraph Studioで先に作成したSubgraphのID（例：`event-token-sepolia`）
- `subgraph/event-token`：このrepository内のlocal directory
- `network`：indexするcontractがdeployされたchain（例：`sepolia`）
- Studio deploy key：auth専用secret。slug、directory、query API keyとは別物

公式install pageには `--product subgraph-studio` の例があるが、CLI 0.98.1はこのflagを定義せず、Subgraph Studioをdefault deploy先にする。実行前にexact versionの `init --help` を確認する。

## 作成例（EventToken）
リポジトリルートで実行し、Studioのslugとは別のlocal directoryへ生成する：

```bash
export SUBGRAPH_SLUG=event-token-sepolia
export EVENT_TOKEN_ADDR=0x...
export EVENT_TOKEN_START_BLOCK=12345678
export EVENT_TOKEN_ABI=artifacts/contracts/EventToken.sol/EventToken.json

npx --yes @graphprotocol/graph-cli@0.98.1 --version
npx --yes @graphprotocol/graph-cli@0.98.1 init \
  "$SUBGRAPH_SLUG" \
  subgraph/event-token \
  --protocol ethereum \
  --from-contract "$EVENT_TOKEN_ADDR" \
  --network sepolia \
  --abi "$EVENT_TOKEN_ABI" \
  --contract-name EventToken \
  --start-block "$EVENT_TOKEN_START_BLOCK" \
  --index-events \
  --skip-install \
  --skip-git

cd subgraph/event-token
npm install --ignore-scripts
npm audit --omit=dev --omit=optional
npm run codegen
npm run build
```

`--skip-git` は0.98.1が親repositoryを自動stage/commitしないための指定で、次のmajorではdefault変更予定である。version更新時は削除を推測せずhelpを再確認する。

2026-07-22のclean scaffoldはcodegen/buildまで成功したが、生成依存の `npm audit --omit=dev --omit=optional` はmoderate 4 / high 9 / critical 2を報告した。学習用の隔離workdirと信頼できるABI/manifestでのみ検証し、deploy keyを使う前に最新releaseとadvisoryを再監査する。`npm audit fix --force`による旧CLIへの自動downgradeは行わない。

Studioでのauth/deployとsecret境界は [`docs/appendix/the-graph.md`](../appendix/the-graph.md) を正本とする。生成物の内容やoptionは更新されるため、公式ドキュメントに加えて実配布CLIのversion/helpを確認する。
