# Day14 実行ログ（2026-01 更新）

## 実施内容（localhostで統合リハーサル）
- Hardhat node を起動し、`MyToken` / `EventToken` / `MyNFT` をデプロイ。
- スクリプトで「送金」「イベント発火」「NFT mint」を確認。
- 計測スクリプト（`measure-fee.ts` / `measure-contract.ts`）のJSON出力を確認。

## 実行
```bash
npx hardhat node
```

別ターミナルで：
```bash
# Deploy
npx hardhat run scripts/deploy-token.ts --network localhost
npx hardhat run scripts/deploy-event-token.ts --network localhost
npx hardhat run scripts/deploy-nft.ts --network localhost

# Use
TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  npx hardhat run scripts/token-transfer.ts --network localhost

EVT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
  npx hardhat run scripts/use-event-token.ts --network localhost

NFT_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 \
  npx hardhat run scripts/mint-nft.ts --network localhost

# Measure
npx hardhat run scripts/measure-fee.ts --network localhost
TOKEN=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  npx hardhat run scripts/measure-contract.ts --network localhost
```

## 結果（抜粋）
- `MyToken: 0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `EventToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- `MyNFT: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`

`measure-fee.ts`：
```json
{"network":"localhost","chainId":31337,"txHash":"0x11672f...","gasUsed":"21000","feeEth":"0.0"}
```
`measure-contract.ts`：
```json
{"network":"localhost","chainId":31337,"txHash":"0x8ea292...","gasUsed":"34508","feeEth":"0.0"}
```
> ローカルHardhat node は `gasPrice=0` のため `feeEth` は `0.0` になる。実ネットワークでは実費が出る。

## DApp / Verify / CI / The Graph（入口）
- DApp：`cd dapp && npm ci && npm run build` が成功（UI動作はMetaMask等が必要）。
- Verify：`appendix/verify.md`
- CI：`.github/workflows/test.yml`（PR/Pushで `npm test`）
- The Graph：`appendix/the-graph.md` / `subgraph/README.md`
