# Day01 実行ログ（2026-01 更新）

## 環境
- RPC: `http://127.0.0.1:8545`（ローカル Hardhat node）
- Day01 本文は Sepolia RPC 前提だが、今回はローカルで再現（APIキー不要）。

## 実行
```bash
./node_modules/.bin/hardhat node
export RPC=http://127.0.0.1:8545
```

## コマンドと結果

### 最新ブロック番号
```bash
curl -s -X POST $RPC \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result
# => 0x3
```

### ブロック詳細（#0）
```bash
curl -s -X POST $RPC \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["0x0", true],"id":2}' \
  | jq '{number: .result.number, hash: .result.hash, baseFeePerGas: .result.baseFeePerGas, gasUsed: .result.gasUsed, gasLimit: .result.gasLimit, miner: .result.miner, timestamp: .result.timestamp, transactions: (.result.transactions|length)}'
```

出力（抜粋）：
```json
{
  "number": "0x0",
  "hash": "0x6a865ec00f0a285a3ea37de8372d022f0156e5e4b46cd81044b7850d891b8cf4",
  "baseFeePerGas": "0x3b9aca00",
  "gasUsed": "0x0",
  "gasLimit": "0x1c9c380",
  "miner": "0x0000000000000000000000000000000000000000",
  "timestamp": "0x69630a46",
  "transactions": 0
}
```

### ブロックを進める（Txを3回送る）
```bash
A0=$(curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' | jq -r '.result[0]')
A1=$(curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' | jq -r '.result[1]')

for i in 1 2 3; do
  curl -s -X POST $RPC -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_sendTransaction","params":[{"from":"'"$A0"'","to":"'"$A1"'","value":"0x1"}],"id":'"$i"'}' \
    | jq -r .result
done
```

### 3ブロック分の混雑度（`gasUsed/gasLimit`）
| Block | gasUsed | gasLimit | congestion |
|-------|--------:|---------:|-----------:|
| 0x1 | 21,000 | 30,000,000 | 0.000700 |
| 0x2 | 21,000 | 30,000,000 | 0.000700 |
| 0x3 | 21,000 | 30,000,000 | 0.000700 |

## 学び
1. ローカルノードでも JSON-RPC の基本操作（`eth_blockNumber` / `eth_getBlockByNumber`）は再現できる。
2. `eth_sendTransaction`（unlock済みアカウント）でTxを投げると、ブロックを手動で進められる。
3. `gasUsed/gasLimit` はブロック混雑の目安になる（ただし L1/L2 の“手数料”そのものとは別）。
