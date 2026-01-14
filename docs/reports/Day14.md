# Day14 実行ログ（2026-01 更新）

## 実施内容（localhostで統合リハーサル）
- Hardhat node を起動し、`MyToken` / `EventToken` / `MyNFT` をデプロイ。
- スクリプトで「送金」「イベント発火」「NFT mint」を確認。
- 計測スクリプト（`measure-fee.ts` / `measure-contract.ts`）のJSON出力を確認。

## 実行
```bash
./node_modules/.bin/hardhat node
```

別ターミナルで：
```bash
# Deploy
npx hardhat run scripts/deploy-token.ts --network localhost
npx hardhat run scripts/deploy-event-token.ts --network localhost
npx hardhat run scripts/deploy-nft.ts --network localhost

# Use
TOKEN=<TOKEN> npx hardhat run scripts/token-transfer.ts --network localhost

EVT=<EVT> npx hardhat run scripts/use-event-token.ts --network localhost

NFT_ADDRESS=<NFT_ADDRESS> npx hardhat run scripts/mint-nft.ts --network localhost

# Measure
npx hardhat run scripts/measure-fee.ts --network localhost
TOKEN=<TOKEN> npx hardhat run scripts/measure-contract.ts --network localhost
```

## 結果（抜粋）
- `MyToken: 0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `EventToken: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- `MyNFT: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

`measure-fee.ts`：
```json
{
  "network": "localhost",
  "chainId": 31337,
  "txHash": "0x11672f988af75c5527c63a6dd9fbb1dd4015ff7ba39b5f8b45dd7262d12ac9d8",
  "gasUsed": "21000",
  "effGasPriceWei": "444855188",
  "feeEth": "0.000009341958948"
}
```
`measure-contract.ts`：
```json
{
  "network": "localhost",
  "chainId": 31337,
  "txHash": "0x8ea292b948fda640138368509dfdb2895e15b1f35213fd511cff600f581733e1",
  "gasUsed": "34508",
  "effGasPriceWei": "389326139",
  "feeEth": "0.000013434866404612"
}
```
> `feeEth` は `gasUsed * effectiveGasPrice` で計算している。実ネットワーク（Sepolia/Optimism等）では価格が変動するため、比較したい場合は同じ条件で複数回計測する。

## DApp / Verify / CI / The Graph（入口）
- DApp：`cd dapp && npm ci && npm run build` が成功（UI動作はMetaMask等が必要）。
- Verify：`docs/appendix/verify.md`
- CI：`.github/workflows/test.yml`（PR/Pushで `npm test`）
- The Graph：`docs/appendix/the-graph.md` / `docs/subgraph/README.md`
