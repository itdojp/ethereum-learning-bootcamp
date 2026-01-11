# Day02 実行ログ（2026-01 更新）

## 環境
- RPC: `http://127.0.0.1:8545`（ローカル Hardhat node）
- サンプルコントラクト: `contracts/GasTest.sol`
- ドライバースクリプト: `scripts/day02_gas.ts`

## 実行手順
1. `./node_modules/.bin/hardhat node`
2. `npx hardhat compile`
3. `npx hardhat run scripts/day02_gas.ts --network localhost`
4. `curl -X POST ... eth_getTransactionReceipt` で `store` Tx を解析

## Gas 計測結果
| 呼び出し | Tx Hash | Gas Used | Effective Gas Price (wei) | 手数料 (ETH) |
|----------|---------|---------|---------------------------|--------------|
| `store(123)` | `0xba728419...` | 43,516 | 970,068,939 | 4.221e-05 |
| `add(10,20)` | `0xcd44a299...` | 21,860 | 849,162,102 | 1.856e-05 |
| `testRewrite(123)` | `0x5306f1d4...` | 23,638 | 743,171,529 | 1.757e-05 |

- `add()` は pure 関数のため、そのまま呼ぶと `call` になってしまう。`encodeFunctionData` で calldata を生成し、`sendTransaction` で Tx を作成してGasを取得。
- `testRewrite()` は同じ値を再書込みした結果、`store()` よりガスが少なくなり、Refund を確認できた。

## RPC での Tx 解析例
```
curl -s -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  --data '{
    "jsonrpc":"2.0",
    "method":"eth_getTransactionReceipt",
    "params":["0xba7284193ee601b6787921d03a78bf8ce1e1fe35359447754cbe1872750970be"],
    "id":10
  }' | jq '.result | {blockNumber, gasUsed, effectiveGasPrice, status}'
```
→ `gasUsed`: `0xa9fc`, `effectiveGasPrice`: `0x39d213cb`, `status`: `0x1`

## 学び
1. `pure/view` 関数であっても raw Tx を組めばガス計測が可能。
2. `SSTORE` の初回書込みは高コストだが、同値再書込みは Refund が発生しガスが下がる。
3. RPC から取得した `gasUsed` / `effectiveGasPrice` を 16進→10進変換すれば、手数料 (ETH) を精度高く算出できる。
