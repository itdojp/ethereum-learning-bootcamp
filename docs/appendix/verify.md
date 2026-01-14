# Verify（ソース検証）メモ

このメモは、Etherscan / Blockscout などで **コントラクトのソース検証（Verify）** を行うときの“つまずきポイント”をまとめる。

## 1. Verifyとは
- エクスプローラ上で「ソースコード ⇔ デプロイ済みバイトコード」を対応付ける作業。
- Verifyすると、UI上でABIが読みやすくなり、Read/Write（読み取り/書き込み）画面が使いやすくなる。

## 2. 最短成功ルート（Hardhat）
1) `.env` を用意する（例：`cp .env.example .env`）。  
2) コンパイルする：`npx hardhat compile`  
3) Verifyする：`npx hardhat verify --network <network> <address> <constructor args...>`

> デプロイした直後は、エクスプローラ側の反映が遅れることがある（環境依存）。その場合は時間を置いて再実行する。

## 3. 失敗時の切り分けルート（最小）
Verifyが失敗したときは、まず「どこがズレているか」を上から潰す。

1) `--network` はデプロイ先と一致しているか  
2) `<address>` はデプロイしたコントラクトのアドレスか  
3) APIキーは `.env` に入っているか（空ではないか）  
4) コンストラクタ引数は「順序・型・値」が一致しているか  
5) コンパイラ設定（Solidity/optimizer/viaIR など）はデプロイ時と一致しているか  
6) デプロイ直後で、エクスプローラの反映待ちになっていないか  

このリポジトリでは、デプロイ時の引数や設定を [`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) に残す運用を推奨する（Verifyで迷子になりにくい）。

## 4. このリポジトリの環境変数
- RPC：
  - `SEPOLIA_RPC_URL`, `MAINNET_RPC_URL`, `OPTIMISM_RPC_URL`
- APIキー：
  - Ethereum（mainnet / Sepolia）：`ETHERSCAN_API_KEY`
  - Optimism：`OPTIMISTIC_ETHERSCAN_API_KEY`

## 5. よくあるエラー（症状→原因候補→確認→解決）
| 症状 | 原因候補 | 確認 | 解決 |
|---|---|---|---|
| `--network` を変えても通らない | ネットワーク不一致 | デプロイ先と `--network` が一致しているか | デプロイ先のネットワークに合わせて再実行 |
| API key が必要と言われる / 失敗する | APIキー未設定 / 空 | `.env` に `ETHERSCAN_API_KEY`（または `OPTIMISTIC_ETHERSCAN_API_KEY`）が入っているか | `.env` にキーを入れて再実行（鍵はコミットしない） |
| `constructor arguments` が原因っぽい | 引数の不一致 | デプロイ時の引数（順序/型/値）を確認 | デプロイ時と同じ引数で Verify（文字列はクォートが必要なことがある） |
| 設定が合っているはずなのに通らない | コンパイラ設定の不一致 | `hardhat.config.ts` の `solidity` / optimizer / `viaIR` を確認 | デプロイ時と同じ設定に揃えて再実行（デプロイ後に設定を変えた場合は要注意） |
| デプロイ直後に通らない / エクスプローラで見つからない | 反映遅延（取り込み待ち） | エクスプローラ側でTxやアドレスが見えるか | 時間を置いて再実行（混雑やサービス状況に依存） |
| すでにVerify済みと言われる | すでにVerify済み | エクスプローラでソース表示できるか | ソースが表示できるなら実害なし（必要なら別アドレスで検証） |
| 1ファイルに複数コントラクトがあり失敗する | 対象コントラクトの指定が曖昧 | Verify対象のコントラクト名を確認 | `--contract contracts/Path.sol:ContractName` で fully qualified name を指定 |

## 6. 補足：L2 / Blockscout
- L2はエクスプローラがEtherscan系とは限らない（Blockscout等）。
- その場合、`hardhat.config.ts` の `customChains` 設定が必要になることがある。
- 本リポジトリは Optimism を例として設定している。他チェーンは必要に応じて更新する。
