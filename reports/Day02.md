# Day02 実行ログ

## 環境
- RPC: `http://127.0.0.1:8545`（Day01 と同じ Hardhat node を継続使用）
- サンプルコントラクト: `contracts/GasTest.sol`
- ドライバースクリプト: `scripts/day02_gas.ts`

## 実行手順
1. `npx hardhat compile`
2. `npx hardhat run scripts/day02_gas.ts --network localhost`
3. `curl -X POST ... eth_getTransactionReceipt` で `store` Tx を解析

## Gas 計測結果
| 呼び出し | Tx Hash | Gas Used | Effective Gas Price (wei) | 手数料 (ETH) |
|----------|---------|---------|---------------------------|--------------|
| `store(123)` | `0xb2538ac1...` | 43,516 | 1,393,966,933 | 6.07e-05 |
| `add(10,20)` | `0x78015d00...` | 21,860 | 1,346,601,148 | 2.94e-05 |
| `testRewrite(123)` | `0x09c46ca8...` | 23,638 | 1,303,944,076 | 3.08e-05 |

- `add()` は pure 関数のため、そのまま呼ぶと `call` になってしまう。`encodeFunctionData` で calldata を生成し、`sendTransaction` で Tx を作成してGasを取得。
- `testRewrite()` は同じ値を再書込みした結果、`store()` よりガスが少なくなり、Refund を確認できた。

## RPC での Tx 解析例
```
curl -s -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  --data '{
    "jsonrpc":"2.0",
    "method":"eth_getTransactionReceipt",
    "params":["0xb2538ac1859d90aed435e627a4b234f3072076bddc4f23095025474976c7665c"],
    "id":10
  }' | jq '.result | {blockNumber, gasUsed, effectiveGasPrice, status}'
```
→ `gasUsed`: `0xa9fc`, `effectiveGasPrice`: `0x53163f55`, `status`: `0x1`

## 学び
1. `pure/view` 関数であっても raw Tx を組めばガス計測が可能。
2. `SSTORE` の初回書込みは高コストだが、同値再書込みは Refund が発生しガスが下がる。
3. RPC から取得した `gasUsed` / `effectiveGasPrice` を 16進→10進変換すれば、手数料 (ETH) を精度高く算出できる。
