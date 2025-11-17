# Day05 実行ログ

## 対象コード
- 既存の `contracts/MyToken.sol`（固定Supply ERC-20）と Day11 で導入した `contracts/MyNFT.sol` を活用。
- テストを新規追加：
  - `test/erc20.ts` … `approve/allowance/transferFrom` の一連フロー。
  - `test/mynft.ts` … baseURI 付きで mint し、`tokenURI` を検証。
- スクリプトを整備：
  - `scripts/deploy-token.ts`, `token-transfer.ts`, `token-approve.ts`
  - `scripts/deploy-nft.ts`, `mint-nft.ts`

## コマンドと結果
```
# 単体テスト（ERC20/NFT含む全体）
npx hardhat test
→ 9 passing (MyToken, MyNFT, WalletBox, Hello, GasBench)

# ローカルネットでのデプロイ／操作例
npx hardhat run scripts/deploy-token.ts --network localhost
→ MTK: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788

TOKEN=0x610178dA211FEF7D417bC0e6FeD39F05609AD788 \
  npx hardhat run scripts/token-transfer.ts --network localhost
→ owner before: 1,000,000 MTK / bob after: 10 MTK

TOKEN=... \
  npx hardhat run scripts/token-approve.ts --network localhost
→ allowance: 1 MTK, transferFrom 完了

NFT_BASE=ipfs://cid/ \
  npx hardhat run scripts/deploy-nft.ts --network localhost
→ MyNFT: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e

NFT_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e \
  npx hardhat run scripts/mint-nft.ts --network localhost
→ tokenURI: ipfs://cid/1
```

## 追加確認
- `token-transfer.ts` で `transfer` 後の `balanceOf` をログ表示。
- `token-approve.ts` で `approve` → `allowance` → `transferFrom` を同一スクリプト内で実施。
- `mint-nft.ts` の `tokenURI` 表示により baseURI + tokenId の結合結果を確認。

## 未実施
- Sepolia でのデプロイ／Etherscan確認は APIキー・秘密鍵を設定していないため未実行。`.env` に `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY` を入れた上で、同じコマンドを `--network sepolia` で再実行すれば再現可。

## まとめ
1. ERC-20/721 の典型操作（直接送金、approve/transferFrom、mint/tokenURI）をローカルRPCで自動化。
2. ハンズオンで紹介されたスクリプトを TypeScript/ethers v6 形式で揃え、環境変数を切り替えるだけでテストネットへ流用可能。
3. テストカバレッジに ERC-20 と NFT を加え、教材全体の自己診断をハードハットテスト1回で回せる状態に整備。
