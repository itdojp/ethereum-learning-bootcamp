# Day11 実行ログ

## 実装確認
- `contracts/MyNFT.sol` / `FixedPriceMarket.sol`：Day11教材どおりのロイヤリティ対応NFTと固定価格マーケットがリポジトリに存在することを再確認。
- 新規テスト `test/market.ts` を追加し、`list`→`buy` で `FixedPriceMarket` がNFTを移転させる流れを自動テスト化。
- 既存 `test/mynft.ts` で `tokenURI` を検証済み。

## コマンド
```
# 全テスト（MyNFT + Market 含む）
npx hardhat test
→ 11 passing（MyToken, EventToken, GasBench, Hello, FixedPriceMarket, MyNFT, WalletBox）

# ローカルデプロイ例
npx hardhat run scripts/deploy-nft.ts --network localhost
NFT_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e \
  npx hardhat run scripts/mint-nft.ts --network localhost
npx hardhat run scripts/deploy-event-token.ts --network localhost   # Day10連携
```
- `FixedPriceMarket` テストでは `setApprovalForAll`→`list`→`buy` を通し、新しいオーナーが `buyer` になることを確認。

## IPFS / OpenSea
- 実際のIPFSアップロードやOpenSeaテストネット確認はAPIキー・画像ファイルが必要なため未実施。`NFT_BASE=ipfs://cid/` 等を `.env` に設定すれば `scripts/deploy-nft.ts`/`mint-nft.ts` で即再現可能。

## まとめ
1. NFTロイヤリティ実装と最小マーケットプレイスの挙動をHardhatテストでカバーし、Day11の「IPFS→mint→販売」フローをコードレベルで再現。
2. `scripts/deploy-nft.ts` / `mint-nft.ts` によりメタデータCIDとロイヤリティBPSを環境変数から変更できる状態を整備。
3. 今後は実ネットワークでのVerify・OpenSea表示確認を `.env` と `npx hardhat verify` コマンドで行うだけで良い状態になった。
