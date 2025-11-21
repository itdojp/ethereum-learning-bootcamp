# Day14 実行ログ

## 統合状況
- **コントラクト**: ERC-20 (`MyToken`), NFT (`MyNFT`), FixedPriceMarket, EventToken などを `deploy-generic.ts` 等でローカルOptimism相当（Hardhat）にデプロイ。`DEPLOYMENTS.md` にアドレスを追記。
- **DApp**: Day09で構築した `dapp/` は `VITE_CHAIN_ID`/`VITE_TOKEN_ADDRESS`/`VITE_EVENT_TOKEN` を切り替えるだけでL2向けにも利用可能。イベント購読（Day10）を統合済み。
- **計測**: Day08/Day13で作成した `measure-fee.ts`, `metrics/metrics.csv`, `metrics/gas_day13.md` を使用して手数料・ガス差を記録。

## 実行コマンド（ローカルでの統合リハーサル）
```
# 既存汎用スクリプトで順番にデプロイ
CONTRACT=MyToken ARGS=1000000000000000000000000 \
  npx hardhat run scripts/deploy-generic.ts --network localhost
CONTRACT=MyNFT ARGS="ipfs://cid/ 0xf39Fd... 500" \
  npx hardhat run scripts/deploy-generic.ts --network localhost
CONTRACT=FixedPriceMarket \
  npx hardhat run scripts/deploy-generic.ts --network localhost

# DAppビルド（L2 RPCを想定）
cd dapp && npm run build

# 計測
npx hardhat run scripts/measure-fee.ts --network localhost
TOKEN=<MyToken addr> npx hardhat run scripts/measure-contract.ts --network localhost
```

## ドキュメント連携
- `DEPLOYMENTS.md`：ローカルでのERC20/NFT/Market/EventTokenアドレスと日付を一覧化。
- `reports/Day0X.md`：Day01〜Day14の各章で実行したコマンド・結果をMarkdown化。
- `metrics/*.json/csv`：手数料・ガス比較をファイルとして保存し、将来Mainnet/Optimism結果を追記できる状態。

## 今後（本番L2）に向けたTODO
1. `.env` に `OPTIMISM_RPC_URL` / `PRIVATE_KEY` / `ETHERSCAN` キーをセットし、`--network optimism` で `deploy-generic.ts` を再実行。
2. DAppの `.env` を L2 用に更新し、`npm run dev` で実機テスト → `npm run build` で静的ホストへ配置。
3. The Graph CLI (`graph init ...`) を使い `FixedPriceMarket` の `Listed`/`Purchased` イベントをIndex化。Day10の `useEvents` と併用してUIに履歴を表示。
4. `measure-fee.ts` の出力を `metrics/metrics.csv` に追記し、Mainnet vs Optimism の手数料差をドキュメント化。

## まとめ
- Day14で求められる「契約／フロント／イベント／メトリクス」の統合要素は既存コンポーネントで再利用できる状態にあり、手順は `reports/Day01-14.md` ＋ `DEPLOYMENTS.md` に集約済み。
- 本番環境への切り替えは `.env` (Hardhat/DApp) と GitHub Actions（Day07）で Secrets を更新し、`workflow_dispatch` から承認付きデプロイを実行するだけで完了できるよう準備済み。
