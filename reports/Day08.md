# Day08 実行ログ（2026-01 更新）

## 対象
- `scripts/measure-fee.ts`：EOA→EOA送金の `gasUsed` / `feeEth` / `latencyMs` をJSON出力。
- `scripts/measure-contract.ts`：ERC‑20 `transfer` の `gasUsed` / `feeEth` / `latencyMs` をJSON出力（`TOKEN` 必須）。
- `tools/to-csv.sh`：JSON→CSV 変換。

## 実行（localhost）
```bash
npx hardhat node
```

別ターミナルで：
```bash
# 事前にERC-20をデプロイ（例）
npx hardhat run scripts/deploy-token.ts --network localhost

# 送金の手数料計測（宛先や金額は任意で上書きできる）
npx hardhat run scripts/measure-fee.ts --network localhost | tee metrics/fee-local.json
cat metrics/fee-local.json | tools/to-csv.sh > metrics/metrics.csv

# ERC-20 transfer 計測
TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  npx hardhat run scripts/measure-contract.ts --network localhost | tee metrics/contract-local.json
cat metrics/contract-local.json | tools/to-csv.sh >> metrics/metrics.csv
```

### 結果（抜粋）
`measure-fee.ts`：
```json
{
  "network": "localhost",
  "chainId": 31337,
  "txHash": "0x11672f988af75c5527c63a6dd9fbb1dd4015ff7ba39b5f8b45dd7262d12ac9d8",
  "gasUsed": "21000",
  "feeEth": "0.0",
  "latencyMs": 16
}
```

`measure-contract.ts`：
```json
{
  "network": "localhost",
  "chainId": 31337,
  "txHash": "0x8ea292b948fda640138368509dfdb2895e15b1f35213fd511cff600f581733e1",
  "gasUsed": "34508",
  "feeEth": "0.0",
  "latencyMs": 16
}
```

> ローカルHardhat node は `gasPrice=0` のため `feeEth` は `0.0` になる。実ネットワークで実行すればそのまま有効な数値を取得できる。
