# Deployments

このページは「どのネットワークに、何を、どの設定で」デプロイしたかの記録だ。  
Verifyや再現（あとから同じ手順をやり直す）のときに、迷子になりにくくなる。

> 記録の考え方は Day14 を正とする：[`docs/curriculum/Day14_Integration.md`](./curriculum/Day14_Integration.md)

## 記録ルール（最低限）
- `Date`：`YYYY-MM-DD`
- `Network`：`hardhat.config.ts` で使うネットワーク名（例：`sepolia`, `optimism`, `localhost`）
- `Contract` / `Address`：コントラクト名とアドレス
- `Tx Hash`：デプロイTxのハッシュ（ローカルは `(local)` でもよい）
- `Notes`：後で詰まりやすい情報をまとめて残す（例：`chainId`、コンストラクタ引数、`solc`/optimizer設定、Verifyリンク）

### Notes の書き方（例）
- `chainId=11155111; solc=0.8.24; optimizer=true(runs=200); args=[...]`

| Date       | Network   | Contract  | Address                                      | Tx Hash                                      | Notes                      |
|------------|-----------|-----------|----------------------------------------------|----------------------------------------------|----------------------------|
| 2025-11-13 | localhost | WalletBox | 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318   | (local)                                     | Day04 ハンズオン検証用 |
| 2025-11-13 | localhost | MyToken   | 0x610178dA211FEF7D417bC0e6FeD39F05609AD788   | (local)                                     | Day05 固定供給 1,000,000 |
| 2025-11-13 | localhost | MyNFT     | 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e   | (local)                                     | Day05 baseURI=ipfs://cid/ |
| 2025-11-13 | localhost | WalletBox | 0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1   | (local)                                     | Day07 deploy-generic 動作確認 |
| 2025-11-13 | localhost | EventToken | 0x3Aa5ebB10DC797CAC828524e59A333d0A371443c   | (local)                                     | Day10 イベント購読用 |
| 2025-11-13 | localhost | FixedPriceMarket | 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1 | (local)                                     | Day14 統合リハーサル |
