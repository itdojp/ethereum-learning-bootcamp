# Verify（ソース検証）メモ

このメモは、Etherscan / Blockscout などで **コントラクトのソース検証（Verify）** を行うときの“つまずきポイント”をまとめる。

## 1. Verifyとは
- エクスプローラ上で「ソースコード ⇔ デプロイ済みバイトコード」を対応付ける作業。
- Verifyすると、UI上でABIが読みやすくなり、Read/Write（読み取り/書き込み）画面が使いやすくなる。

## 2. 最短手順（Hardhat）
1) `.env` を用意する（例：`cp .env.example .env`）。  
2) コンパイルする：`npx hardhat compile`  
3) Verifyする：`npx hardhat verify --network <network> <address> <constructor args...>`

## 3. このリポジトリの環境変数
- RPC：
  - `SEPOLIA_RPC_URL`, `MAINNET_RPC_URL`, `OPTIMISM_RPC_URL`
- APIキー：
  - Ethereum（mainnet / Sepolia）：`ETHERSCAN_API_KEY`
  - Optimism：`OPTIMISTIC_ETHERSCAN_API_KEY`

## 4. つまずきポイント（よくある順）
### 4.1 ネットワークを間違える
- `--network` と、実際にデプロイしたチェーンが一致していることを確認する。

### 4.2 コンストラクタ引数の不一致
- もっとも多い原因。**引数の順序・型・値**が一致しないとVerifyが通らない。
- 文字列（例：`ipfs://.../`）はクォートが必要なことがある：
  - 例：`"ipfs://<CID>/"`（空白を含む場合は必須）
- デプロイ時の引数を `DEPLOYMENTS.md` やデプロイログに残しておくと再現しやすい。

### 4.3 コンパイラ設定の不一致
- `solidity` バージョン、optimizer（`runs`）、`viaIR` などがデプロイ時と一致しないと通らない。
- “デプロイ後に `hardhat.config.ts` を変えた”場合は特に注意する。

### 4.4 反映遅延（インデックス待ち）
- デプロイ直後は、エクスプローラ側の取り込みが追いつかないことがある。
- 少し待ってから再実行する。

### 4.5 すでにVerify済み
- すでにVerify済みの場合、エラー表示になることがある。
- エクスプローラ側でソースが表示できるなら実害はない。

## 5. 補足：L2 / Blockscout
- L2はエクスプローラがEtherscan系とは限らない（Blockscout等）。
- その場合、`hardhat.config.ts` の `customChains` 設定が必要になることがある。
- 本リポジトリは Optimism を例として設定している。他チェーンは必要に応じて更新する。

