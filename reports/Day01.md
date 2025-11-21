# Day01 実行ログ

## 環境
- RPC: `http://127.0.0.1:8545`（ローカル Hardhat node）
- Hardhat node は `npx hardhat node` でバックグラウンド起動

## コマンドと結果

### 最新ブロック番号
```
curl -s -X POST $RPC --data '{"method":"eth_blockNumber"}'
→ 0x3 (decimal 3)
```

### ブロック詳細（#0）
```
{
  "number": "0x0",
  "hash": "0xa8a6...",
  "baseFeePerGas": "0x3b9aca00",
  "gasUsed": "0x0",
  "gasLimit": "0x1c9c380",
  "miner": "0x000...000",
  "timestamp": "0x69162929",
  "transactions": 0
}
```

### 3ブロック分の混雑度
| Block | gasUsed | gasLimit | congestion |
|-------|---------|----------|------------|
| 0x3 | 0x5208 | 0x1c9c380 | 0.0007 |
| 0x2 | 0x5208 | 0x1c9c380 | 0.0007 |
| 0x1 | 0x5208 | 0x1c9c380 | 0.0007 |

（Block #1〜#3 は `eth_sendTransaction` を3回実行して生成）

## 学び
1. Hardhat ローカルノードでも RPC 手順は同様に再現できる。
2. `eth_sendTransaction` を使えば手動でブロックを進められ、混雑度計算も確認可能。
3. Genesis ブロックは `eth_getBlockByNumber("0x0")` で取得し、`jq '.result | ...'` で主要フィールドを抽出する。
