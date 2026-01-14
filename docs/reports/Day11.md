# Day11 実行ログ（2026-01 更新）

## 実行（localhost）
NFT の `tokenURI` が `.../<id>.json` になることを、ローカルで確認した。

```bash
./node_modules/.bin/hardhat node
```

別ターミナルで：
```bash
npx hardhat run scripts/deploy-nft.ts --network localhost
# → MyNFT: <NFT_ADDRESS>

NFT_ADDRESS=<NFT_ADDRESS> npx hardhat run scripts/mint-nft.ts --network localhost
```

### 結果（抜粋）
- `MyNFT: 0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `tokenURI: ipfs://example/1.json`

## IPFS 表示確認（未実施）
- OpenSea はテストネット表示を終了しているため、`tokenURI` を HTTP Gateway（例：`https://ipfs.io/ipfs/<CID>/1.json`）に置き換えて確認する流れになる。
- 実際のIPFSアップロードは APIキーや素材ファイルが必要なため未実施。

## Market（FixedPriceMarket）
- `test/market.ts` が `list`→`buy` の最小フローを自動テストしている（UIは未実施）。
