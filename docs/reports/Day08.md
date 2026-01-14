# Day08 実行ログ（2026-01 更新）

## 対象
- `scripts/measure-fee.ts`：EOA→EOA送金の `gasUsed` / `feeEth` / `latencyMs` をJSON出力。
- `scripts/measure-contract.ts`：ERC‑20 `transfer` の `gasUsed` / `feeEth` / `latencyMs` をJSON出力（`TOKEN` 必須）。
- `tools/to-csv.sh`：JSON→CSV 変換。

## 実行（localhost）
```bash
./node_modules/.bin/hardhat node
```

別ターミナルで：
```bash
# 事前にERC-20をデプロイ（例）
npx hardhat run scripts/deploy-token.ts --network localhost
# → MTK: <TOKEN>

# 送金の手数料計測（宛先や金額は任意で上書きできる）
npx hardhat run scripts/measure-fee.ts --network localhost | tee metrics/fee-local.json
cat metrics/fee-local.json | tools/to-csv.sh > metrics/metrics.csv

# ERC-20 transfer 計測
TOKEN=<TOKEN> npx hardhat run scripts/measure-contract.ts --network localhost | tee metrics/contract-local.json
cat metrics/contract-local.json | tools/to-csv.sh >> metrics/metrics.csv
```

### 結果（抜粋）
`measure-fee.ts`：
```json
{
  "network": "localhost",
  "chainId": 31337,
  "txHash": "0x11672f988af75c5527c63a6dd9fbb1dd4015ff7ba39b5f8b45dd7262d12ac9d8",
  "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "valueWei": "100000000000000",
  "gasUsed": "21000",
  "effGasPriceWei": "444855188",
  "feeEth": "0.000009341958948",
  "latencyMs": 18
}
```

`measure-contract.ts`：
```json
{
  "network": "localhost",
  "chainId": 31337,
  "txHash": "0x8ea292b948fda640138368509dfdb2895e15b1f35213fd511cff600f581733e1",
  "gasUsed": "34508",
  "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "amount": "10000000000000000",
  "effGasPriceWei": "389326139",
  "feeEth": "0.000013434866404612",
  "latencyMs": 19
}
```

> `feeEth` は `gasUsed * effectiveGasPrice` で計算している。手数料の比較（L1/L2差分）を目的にする場合は、Sepolia/Optimism 等の実ネットワークで計測する。
