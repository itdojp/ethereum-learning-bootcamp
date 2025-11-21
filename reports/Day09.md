# Day09 実行ログ

## フロントエンド構築
- `dapp/` ディレクトリに React + Vite (+ TypeScript) プロジェクトを新規作成。
- 主要ファイル：
  - `package.json`（React18 + Vite + ethers + node-polyfills）
  - `src/App.tsx`：ウォレット接続／ネットワーク切替／ETH・ERC20残高参照／トークン送信UI。
  - `src/lib/web3.ts`：`ethers.BrowserProvider` を用いたユーティリティ。
  - `vite.config.ts`, `tsconfig*.json`, `.env.example`（`VITE_TOKEN_ADDRESS`, `VITE_CHAIN_ID`, `VITE_RPC`）。

## コマンド
```
cd dapp
npm install
npm run build
```
→ `vite build` が成功し、`dist/` に成果物を生成。

## 実装ポイント
- ethers v6 を利用し、`BrowserProvider` + `getSigner()` でアカウントを取得。
- `window.ethereum.on('accountsChanged'|'chainChanged')` でUIを再読み込み。
- `Switch to Chain` ボタンは `wallet_switchEthereumChain` を呼び、`.env` の `VITE_CHAIN_ID` を目標チェーンとして使用。
- `Send` ボタンは `ethers.parseUnits` で任意桁数に対応し、トランザクション完了後に残高をリフレッシュ。

## 動作確認
- `npm run build` により TypeScript / Vite ビルドを通過。ブラウザで `npm run dev` を実行すれば MetaMask と連携可能（ローカル Hardhat RPC でも動作）。
- `.env.example` の値をコピーして `.env` を作成し、`VITE_TOKEN_ADDRESS` を Day05 で発行したトークンアドレス（例: `0x6101...`）へ差し替えることで即テスト可能。

## まとめ
1. Day09 で要求される DApp フロントの基本機能（接続/切替/残高/送金）を React + Vite で実装。
2. ビルドが通る形でテンプレート化したため、`npm run dev` で容易にホットリロード開発が可能。
3. ハードハットでローカルに立てた ERC-20 (`MyToken`) の送金UIとしても再利用できる。
