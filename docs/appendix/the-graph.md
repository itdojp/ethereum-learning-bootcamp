# The Graph（Subgraph Studio）メモ

このメモは、Day10/Day14 の The Graph 手順で詰まりやすい点をまとめる。

## 1. 何をしているか
- Solidity のイベントを The Graph がインデックス化し、GraphQLで履歴を取得できるようにする。
- オンチェーンの状態を全件スキャンするより、UIや分析で扱いやすい。

## 2. 最短成功ルート（Subgraph Studio）
最短は「対象コントラクトを決める → startBlockを決める → build する → Studioで反映を待つ」の順だ。

1) 対象コントラクト（例：Day10 の `EventToken`）をデプロイし、イベントが出る状態にする  
2) `graph init` でひな形を作る  
3) `startBlock` に **デプロイTxのブロック番号** を入れる  
4) `graph codegen` / `graph build` を通す  
5) Studio の手順でデプロイし、反映を待ってから GraphQL で取得する  

> 外部サービス（Studio/Indexer）依存のため、反映に時間がかかることがある（環境依存）。「デプロイできているか」「イベントが出ているか」を先に確認してから待つと切り分けが速い。

## 3. 前提
- Node.js（推奨：20）
- `graph-cli`（インストール方法は環境により異なる）
  - 例：`npm i -g @graphprotocol/graph-cli`
  - 権限エラーが出る場合は、npx で代替できることがある（例：`npx @graphprotocol/graph-cli --version`）。

## 4. 失敗時の切り分け（つまずきポイント）
### 4.1 `startBlock` が分からない
- `startBlock` は「このブロック以降だけ見る」というフィルタ。古すぎると同期が遅い。
- 目安：**デプロイTxのブロック番号** を入れる。

デプロイTxのブロック番号は、Txハッシュ（`0x...`）からレシートで取得できる。

最小例（JSON-RPC → hex → 10進へ変換）：
```bash
RPC=$SEPOLIA_RPC_URL
TX=0x...

BN_HEX=$(
  curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'"$TX"'"],"id":1}' \
    | jq -r '.result.blockNumber'
)

# The Graph の startBlock は通常 10進数で書く（例：12345678）
if [ "$BN_HEX" = "null" ] || [ -z "$BN_HEX" ]; then
  echo "receipt not found (TX/RPC/chain mismatch or still pending)"
  exit 1
fi
printf '%d\n' "$BN_HEX"
```
> `.result` が `null` の場合は、Txが未確定か、RPC/TxHash/チェーンが違う可能性がある。時間を置くか再確認する。

### 4.2 `graph codegen` / `graph build` が失敗する
- ABI とイベント定義、`schema.graphql` の型が不一致だと失敗しやすい。
- `schema.graphql` を変えたら `graph codegen` をやり直す。

### 4.3 反映が遅い / データが出ない
- `startBlock` が新しすぎるとイベントを取り逃がす。
- コントラクトアドレスやチェーンが間違っていると、そもそも何も取れない。
- 反映待ちの場合は、時間を置いて再確認する（環境依存）。

## 5. よくあるエラー（症状→原因候補→確認→解決）
| 症状 | 原因候補 | 確認 | 解決 |
|---|---|---|---|
| `startBlock` が分からない | デプロイTxのブロック番号が未取得 | Txレシートの `blockNumber` を確認 | 4.1 の手順で取得して設定する |
| build は通るがデータが出ない | `startBlock`/アドレス/チェーン不一致 | コントラクトアドレスとチェーンIDを再確認 | 正しい組み合わせに直す（必要なら `startBlock` を見直す） |
| `graph codegen` / `graph build` が落ちる | ABI/スキーマ不一致 | どの型/イベントで落ちているか | ABI と `schema.graphql` を揃え、codegen→build をやり直す |
| Studio にデプロイしたが反映が遅い | インデックス待ち | イベントが実際に出ているか | 先にイベント発火を確認し、時間を置いて再確認する |

## 6. ディレクトリの置き場所
- 本リポジトリでは、リポジトリルートに `subgraph/`（生成物）を作って進める運用を推奨する（例：`subgraph/event-token`）。
- 本リポジトリは生成物を同梱しない。作り方のガイドは [`docs/subgraph/README.md`](../subgraph/README.md) を参照する。
