# The Graph（Subgraph Studio）メモ

このメモは、Day10/Day14のThe Graph手順について、Studio、CLI、secret、local artifactの境界をまとめる。CLIと外部serviceは更新されるため、確認日とexact versionを再現条件に含める。

## 1. 何をしているか

- SolidityのeventをThe Graphがindexし、GraphQLで履歴を取得できるようにする。
- オンチェーンの状態を全件scanするより、UIや分析で扱いやすい。
- Subgraph Studioへの**deploy**は検証用versionをStudioへ送る操作で、decentralized networkへの**publish**とは別である。

## 2. Studio、slug、directory、networkの役割

| 値 | 管理場所 | 役割 | secretか |
|---|---|---|---|
| Subgraph | Subgraph Studio | deploy先product / project | いいえ |
| `SUBGRAPH_SLUG` | StudioのSubgraph details | Studio上のSubgraph ID | いいえ |
| `subgraph/event-token` | local repository | scaffoldのlocal directory | いいえ |
| `network` | `subgraph.yaml` | index対象contractのchain | いいえ |
| deploy key | StudioのSubgraph details | CLIのauth/deploy credential | **はい** |
| query API key | StudioのAPI Keys | published Subgraphへのquery認証 | **はい** |

slugをdirectoryとして解釈したり、deploy keyとquery API keyを混同したりしない。

## 3. 検証済みCLI契約

2026-07-22にnpm registryのlatestとclean scaffoldを確認した対象は次である。

- `@graphprotocol/graph-cli@0.98.1`
- Node.js requirement: `>=20.18.1`
- この書籍の検証runtime: Node.js 22.22.2

```bash
npx --yes @graphprotocol/graph-cli@0.98.1 --version
npx --yes @graphprotocol/graph-cli@0.98.1 init --help
```

The Graph公式install pageには `--product subgraph-studio` を含む例が残っている。一方、配布中0.98.1のhelp/sourceは `--product` を定義せず、default nodeを `https://api.studio.thegraph.com/deploy/` とする。公式ページと実配布CLIが食い違う場合、この章ではexact versionのhelp/sourceと実行結果を優先する。

versionを上げる場合は、release、Node.js requirement、`init --help`、生成package、audit、codegen/buildをまとめて再検証する。

## 4. 最短成功ルート（Subgraph Studio）

1. EventTokenをSepoliaへdeployし、addressとdeploy transactionのblock numberを記録する。
2. Subgraph StudioでSubgraphを作り、`SUBGRAPH_SLUG`を取得する。deploy keyはまだCLIへ入力しない。
3. rootで `npx hardhat compile` を実行し、EventTokenのHardhat artifactを生成する。
4. exact CLIで `subgraph/event-token` へscaffoldを生成する。
5. 生成された `package.json`、manifest、mapping、install script、auditを確認する。
6. 隔離した学習環境でcodegen/buildを実行する。
7. dependency riskを受容できるreleaseへ更新できた場合だけ、trusted local shellでauth/deployする。

## 5. Scaffold / codegen / build

repository rootで実行する。

```bash
export SUBGRAPH_SLUG=event-token-sepolia
export EVENT_TOKEN_ADDR=0x...
export EVENT_TOKEN_START_BLOCK=12345678
export EVENT_TOKEN_ABI=artifacts/contracts/EventToken.sol/EventToken.json

npx hardhat compile
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

- local ABIを指定し、Explorerから取得した古いABIや一時的なpublic RPCにscaffoldの成否を依存させない。
- `--start-block`にはaddressと同じdeploy transactionのblockを指定する。
- `--skip-install`で生成packageを先にreviewする。
- `--skip-git`は0.98.1が親repositoryを自動stage/commitしないために必要だが、次のmajorでは削除予定と警告される。version更新時はhelpを再確認する。
- `npm install --ignore-scripts`はlifecycle scriptを実行しない。依存を盲目的に信頼してよいという意味ではない。

確認時のclean fixtureは `subgraph/event-token/` を生成し、`npm run codegen`と`npm run build`が成功した。fixtureはpublic dummy address、local EventToken ABI、`startBlock: 0`を使い、deploy keyを一切使用していない。

## 6. Dependency auditの境界

2026-07-22時点で、CLI 0.98.1が生成したpackageのproduction/non-optional auditは次を報告した。

- moderate: 4
- high: 9
- critical: 2

主な経路はdirect dependencyの `@graphprotocol/graph-cli` と、そのtransitive dependencyである。build成功はdependency安全性を意味しない。

- `npm audit fix --force`は0.91.1へのbreaking downgradeを提案するため、自動適用しない。
- untrusted ABI、manifest、archive、endpointをCLIへ渡さない。
- 学習用scaffoldは使い捨て可能なworkdirで生成し、repositoryへ入れる前に差分をreviewする。
- deploy keyを使う前に、npm latest、Graph CLI release、audit/advisoryを再確認する。high/criticalが残る場合は、影響経路と実行機能を評価し、許容できなければauth/deployを延期する。

## 7. Auth / deployとsecret境界

Subgraph Studioでwallet接続後にSubgraphを作ると、Subgraph detailsにslugとdeploy keyが表示される。deploy keyはrepository、`.env.example`、Issue、PR、screenshot、shell history、CI logへ記録しない。

Graph CLI 0.98.1の `graph auth` はcredentialを平文の `~/.graph-cli.json` に保存する。また、CLIはkey用の専用stdin/env flagを提供していない。次はdependency riskを再監査済みのtrusted single-user shellでのみ行う。

```bash
set +x
read -r -s -p 'Subgraph Studio deploy key: ' GRAPH_DEPLOY_KEY
printf '\n'
npx --yes @graphprotocol/graph-cli@0.98.1 auth "$GRAPH_DEPLOY_KEY"
unset GRAPH_DEPLOY_KEY
chmod 600 "$HOME/.graph-cli.json"

cd subgraph/event-token
export SUBGRAPH_SLUG=event-token-sepolia
npx --yes @graphprotocol/graph-cli@0.98.1 deploy \
  "$SUBGRAPH_SLUG" \
  --version-label 0.0.1
```

shell historyにはliteral keyを残さないが、command argumentは同一hostのprocess inspectionから一時的に見える可能性がある。共有hostでは実行せず、使用後はStudioでkeyをregenerateし、不要な `~/.graph-cli.json` credentialを安全に削除する。CIへdeploy keyを入れる場合は別のthreat modelとsecret管理が必要であり、この教材の最小手順には含めない。

deploy後はStudioのindexing log、sync status、development query URLを確認する。Studioへのdeployが成功してもdecentralized networkへpublishされたことにはならない。

## 8. `startBlock` の取得

`startBlock`は「このblock以降だけを見る」というfilterで、古すぎると同期が遅く、新しすぎるとeventを取り逃がす。基本はdeploy transactionのblock numberを使う。

```bash
RPC=$SEPOLIA_RPC_URL
TX=0x...

BN_HEX=$(
  curl -sS -X POST "$RPC" -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'"$TX"'"],"id":1}' \
    | jq -r '.result.blockNumber'
)

if [ "$BN_HEX" = "null" ] || [ -z "$BN_HEX" ]; then
  echo "receipt not found (TX/RPC/chain mismatch or still pending)"
  exit 1
fi
printf '%d\n' "$BN_HEX"
```

RPC URLにAPI keyが含まれる場合はlogへ出力しない。`.result`が `null` の場合は、transactionが未確定か、RPC、transaction hash、chainの組合せが違う可能性がある。

## 9. 失敗時の切り分け

### 9.1 `graph init` が対話入力へ戻る

0.98.1のnon-interactive pathにはslug、directory、protocol、contract、network、ABIなどが必要である。5章の引数が欠けていないか確認する。

### 9.2 `--product` がunknown flagになる

0.98.1では指定しない。`--version`、`init --help`、default Studio nodeを確認し、異なるversionの例を混ぜない。

### 9.3 `graph codegen` / `graph build` が失敗する

- ABIとevent definition、`schema.graphql`、mappingの型が一致しているか確認する。
- `schema.graphql`またはABIを変えたら `npm run codegen` をやり直す。
- address、network、`startBlock`が同じdeploy記録に由来するか確認する。

### 9.4 Deploy後にdataが出ない

- EventTokenが実際にeventをemitしたか確認する。
- Studioのindexing logとsync statusを確認する。
- `startBlock`がeventより新しくないか確認する。
- deployとpublish、deploy keyとquery API keyを混同していないか確認する。

## 10. よくあるエラー

| 症状 | 原因候補 | 確認 | 解決 |
|---|---|---|---|
| slug位置にlocal pathを置いた | Studio slugとdirectoryの混同 | `graph init --help`の2 positional args | `<SUBGRAPH_SLUG> subgraph/event-token`の順に分離 |
| `--product`がunknown | 公式例とCLI 0.98.1の差異 | exact versionのhelp | 0.98.1では指定せずStudio defaultを使う |
| buildは通るがdataが出ない | `startBlock` / address / network不一致 | deploy記録とmanifest | 3点を同じdeploy記録へ揃える |
| codegen/buildが失敗 | ABI / schema / mapping不一致 | 最初に失敗した型・event | local artifactへ揃え、codegen→build |
| auditがhigh/critical | Graph CLIのupstream dependency | `npm audit --omit=dev --omit=optional` | auth/deployを止め、release/advisory/影響経路を再監査 |
| Studio deploy後も反映されない | indexing待ちまたはevent未発火 | Studio log / sync status | eventを発火し、errorを解消して再確認 |

## 11. ディレクトリの置き場所

- repository rootの `subgraph/` 配下に生成する（例：`subgraph/event-token`）。
- この教材repositoryは生成物を同梱しない。作成commandの短縮版は [`docs/subgraph/README.md`](../subgraph/README.md) を参照する。
- clean fixture、`node_modules`、build output、credential fileは教材原稿やPR artifactへ含めない。

## 12. 公式一次情報

- CLI install/init: https://thegraph.com/docs/en/subgraphs/developing/creating/install-the-cli/
- Subgraph Studio deploy: https://thegraph.com/docs/en/subgraphs/developing/deploying-publishing/using-subgraph-studio/
- CLI 0.98.1 release: https://github.com/graphprotocol/graph-tooling/releases/tag/%40graphprotocol%2Fgraph-cli%400.98.1
- CLI source: https://github.com/graphprotocol/graph-tooling/tree/%40graphprotocol%2Fgraph-cli%400.98.1/packages/cli
