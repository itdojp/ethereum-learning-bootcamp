# Day08 実行ログ

## 実装/更新
- `scripts/measure-fee.ts`：任意ネットワークでEOA→EOA送金を行い、`gasUsed`/`effectiveGasPrice`/`feeEth`/`latencyMs` をJSON出力。
- `scripts/measure-contract.ts`：ERC-20の`transfer`を呼び出して同様の指標を取得。`TOKEN`環境変数で対象アドレスを指定。
- `tools/to-csv.sh`：`jq`を用いてJSON→CSVに変換。`metrics/metrics.csv` へ追記するための小さなユーティリティ。
- `metrics/metrics.csv`：測定結果（ネットワーク、Txハッシュ、ガス、手数料、レイテンシ）を蓄積するファイル。

## 実行コマンド
```
# 送金の手数料計測
npx hardhat run scripts/measure-fee.ts --network localhost | tee metrics/fee-local.json
cat metrics/fee-local.json | tools/to-csv.sh > metrics/metrics.csv

# ERC-20 transfer計測
TOKEN=0x610178dA211FEF7D417bC0e6FeD39F05609AD788 \
  npx hardhat run scripts/measure-contract.ts --network localhost | tee metrics/contract-local.json
cat metrics/contract-local.json | tools/to-csv.sh >> metrics/metrics.csv
```

`metrics/metrics.csv`
```
"localhost","0x3d7f57...","21000","0.0",14
"localhost","0x23301c...","34508","0.0",15
```
> ローカルHardhatネットワークはgasPrice=0設定のため `feeEth` は `0.0`。実ネットワークで実行すればそのまま有効な数値を取得できる。

## 追加メモ
- `measure-contract.ts` は Day05 でローカルにデプロイ済みの MyToken (0x6101...) を再利用。
- 本番やL2（Optimism等）で実行する場合は `.env` に RPC URL と鍵を設定し、`--network optimism` などと併用するだけで手数料が計測できる。
- Blob手数料やLatency比較用に `metrics.csv` を継続的に追記できる構成にしてある。

## まとめ
1. L2比較ハンズオンで要求される「手数料計測スクリプト」と「指標の表」をローカルで動作確認済み。
2. 計測結果は JSON + CSV で保存し、後続の章やレポートで参照可能。
3. 実ネットワークでの検証はAPIキー／RPC準備後に `--network optimism` 等へ切り替えるだけで再現できる。
