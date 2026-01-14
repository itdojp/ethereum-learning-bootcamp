# The Graph（Subgraph Studio）メモ

このメモは、Day10/Day14 の The Graph 手順で詰まりやすい点をまとめる。

## 1. 何をしているか
- Solidity のイベントを The Graph がインデックス化し、GraphQLで履歴を取得できるようにする。
- オンチェーンの状態を全件スキャンするより、UIや分析で扱いやすい。

## 2. 前提
- Node.js（推奨：20）
- `graph-cli`（インストール方法は環境により異なる）
  - 例：`npm i -g @graphprotocol/graph-cli`
  - 権限エラーが出る場合は、npx で代替できることがある（例：`npx @graphprotocol/graph-cli --version`）。

## 3. つまずきポイント
### 3.1 `startBlock` が分からない
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

### 3.2 `graph codegen` / `graph build` が失敗する
- ABI とイベント定義、`schema.graphql` の型が不一致だと失敗しやすい。
- `schema.graphql` を変えたら `graph codegen` をやり直す。

### 3.3 反映が遅い / データが出ない
- `startBlock` が新しすぎるとイベントを取り逃がす。
- コントラクトアドレスが間違っていると、そもそも何も取れない。

## 4. ディレクトリの置き場所
- 本リポジトリでは `subgraph/` 配下に生成する運用を推奨する（例：`subgraph/event-token`）。
- 詳細は `subgraph/README.md` を参照する。
