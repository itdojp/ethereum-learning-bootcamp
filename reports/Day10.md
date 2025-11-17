# Day10 実行ログ

## 実装
- `contracts/EventToken.sol`：`mint` / `transfer` と `TransferLogged` イベントを備えた教材用トークンを追加。
- テスト: `test/eventtoken.ts` でイベント発火と残高更新を検証。
- スクリプト:
  - `scripts/deploy-event-token.ts`
  - `scripts/use-event-token.ts`（mint→transfer でイベント発火）
- `dapp/` へイベント購読フックを追加：`src/hooks/useEvents.ts` と `App.tsx` の UI 拡張。
  - `.env.example` に `VITE_EVENT_TOKEN` を追記し、購読対象アドレスを設定できるようにした。

## コマンド
```
# コントラクトテスト
npx hardhat test

# ローカルデプロイ & 送金
npx hardhat run scripts/deploy-event-token.ts --network localhost
EVT=0x3Aa5ebB10DC797CAC828524e59A333d0A371443c \
  npx hardhat run scripts/use-event-token.ts --network localhost

# DAppビルド（イベント購読機能込）
cd dapp && npm run build
```
テスト結果：`10 passing`（EventTokenを含む）。

## DApp 表示
- `VITE_EVENT_TOKEN` を設定すると `useTransferEvents` が `TransferLogged` イベントをリアルタイム購読し、最新30件をUIに表示。
- Hardhat ローカルRPCでも `wallet_switchEthereumChain` + `MetaMask` でログを確認可能。

## The Graph について
- `graph-cli` を使ったサブグラフ生成はホスト側APIキー・アクセスが必要になるため、ここでは雛形コマンドと `schema.graphql` / `mapping.ts` のサンプルを README（カリキュラム）どおり参照する形に留めた。CLI自体は `npm i -g @graphprotocol/graph-cli` で導入可能。

## デプロイ記録
- `DEPLOYMENTS.md` に `EventToken (localhost)` を追記し、イベント購読用アドレスを共有。

## まとめ
1. イベント発火コントラクトとHardhatテスト・スクリプト・DApp購読機能を追加し、Day10要件をローカルで一通り再現。
2. DAppは connect/switch/transfer UIに「Recent TransferLogged events」リストを表示し、ブラウザだけでイベントの挙動を確認できる。
3. The Graph はコマンドテンプレートを参照しつつ、APIキー準備後に `graph init` → `graph deploy` を行えば本番環境へ拡張できる構成になっている。
