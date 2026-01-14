# Day05 実行ログ（2026-01 更新）

## 確認したこと
- ERC‑20（`MyToken`）の `transfer` / `approve` / `transferFrom` をスクリプトで実行できること。
- ERC‑721（`MyNFT`）の mint と `tokenURI` を確認できること（`.../<id>.json` 形式）。

## 実行（localhost）
```bash
./node_modules/.bin/hardhat node
```

別ターミナルで：
```bash
# ERC-20 deploy
npx hardhat run scripts/deploy-token.ts --network localhost
# → MTK: <TOKEN>

# transfer
TOKEN=<TOKEN> npx hardhat run scripts/token-transfer.ts --network localhost

# approve -> transferFrom（複数署名者を使う）
TOKEN=<TOKEN> npx hardhat run scripts/token-approve.ts --network localhost

# ERC-721 deploy & mint
npx hardhat run scripts/deploy-nft.ts --network localhost
# → MyNFT: <NFT_ADDRESS>

NFT_ADDRESS=<NFT_ADDRESS> npx hardhat run scripts/mint-nft.ts --network localhost
```

### 結果（抜粋）
- `MTK: 0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `token-transfer.ts`：
  - `owner before: 1000000000000000000000000`
  - `to: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - `to after: 10000000000000000000`
- `token-approve.ts`：
  - `allowance: 1000000000000000000`
  - `transferFrom complete`
- `MyNFT: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- `mint-nft.ts`：
  - `minted: { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', tokenId: '1' }`
- `tokenURI: ipfs://example/1.json`

## 未実施（外部依存）
- Sepolia 等へのデプロイや Verify は、APIキー・秘密鍵が必要なため未実施。
