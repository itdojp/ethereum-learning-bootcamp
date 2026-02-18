# Day9：DAppフロント（React + ethers）— ウォレット接続／ネットワーク切替／残高・送金UI

[← 目次](./TOC.md) | [前: Day8](./Day08_L2_Rollups.md) | [次: Day10](./Day10_Events_TheGraph.md)

## 学習目的
- ブラウザからMetaMask等に接続し、アカウント・ネットワークを取得できるようになる。
- ネットワーク切替（Local/Sepolia/Optimism）とエラー処理の考え方を理解し、典型的な失敗を切り分けできるようになる。
- ETH残高、ERC‑20残高の表示と送金UIを動かして確認できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 前提
- フロントエンドは `dapp/` に同梱してある（新規作成不要）。
- Day5 で `MyToken` をデプロイして、アドレスを控えている。
- ブラウザにMetaMask等のウォレット拡張が入っている。
- ミニプロジェクト（通しで作るもの）：Day14 を“完成”としてつなぐ（全体像：[`docs/curriculum/Project.md`](./Project.md)）
- 先に読む付録：[`docs/appendix/glossary.md`](../appendix/glossary.md)（用語に迷ったとき）
- 触るファイル（主なもの）：`dapp/.env.local` / `dapp/src/App.tsx` / `dapp/src/lib/web3.ts`
- 今回触らないこと：UI/UXの作り込み（接続と切り分けが主題）
- 最短手順（迷ったらここ）：1章で `dapp/` を起動 → `.env.local` に chainId/アドレス設定 → 画面で Connect/Switch/Send を確認

### 0.1 どのチェーンで動かすか
- ローカル（推奨）：Hardhat node（chainId=31337）
- テストネット：Sepolia（chainId=11155111）
- L2：Optimism（chainId=10）

---

## 1. DApp を起動する
```bash
cd dapp
npm ci
cp .env.example .env.local
```

`dapp/.env.local` を編集する：
```bash
VITE_CHAIN_ID=31337
VITE_TOKEN_ADDRESS=0x...   # MyToken（同じチェーン上）のアドレス
VITE_EVENT_TOKEN=          # 任意：Day10で使う
```

起動：
```bash
npm run dev
```
期待される出力（最小例）：
```text
Local:   http://localhost:5173/
```
> ポートが埋まっている場合は別ポートになる（表示されたURLを開く）。

ブラウザで `http://localhost:5173` を開き、次の順で操作する：
1) Connect Wallet  
2) Switch to Chain  
3) Refresh Balances  
4) Send（少額で）  

---

## 2. ローカルで動かす（Hardhat node）
### 2.1 Hardhat node を起動する
```bash
npx hardhat node
```
期待される出力（最小例）：
```text
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### 2.2 MetaMask にローカルチェーンを追加する
MetaMask のネットワーク追加で次を設定する：
- RPC URL：`http://127.0.0.1:8545`
- Chain ID：`31337`

> 学習用のローカルチェーン前提。間違って本番鍵を入れないこと。

### 2.3 MyToken をローカルへデプロイする
別ターミナルでリポジトリルートに戻り、`.env` を用意する：
```bash
cp .env.example .env
```

`npx hardhat node` の出力に出てくるテスト用の秘密鍵を、`.env` の `PRIVATE_KEY` に入れる。

デプロイ：
```bash
npx hardhat run scripts/deploy-token.ts --network localhost
```
期待される出力（最小例）：
```text
MTK: 0x...
```

出力された `MyToken` のアドレスを `dapp/.env.local` の `VITE_TOKEN_ADDRESS` に入れる。

---

## 3. 実装の読みどころ
- `dapp/src/lib/web3.ts`：`BrowserProvider` 取得、`eth_requestAccounts`、chainId取得、`wallet_switchEthereumChain`
- `dapp/src/App.tsx`：残高取得（`getBalance` / `balanceOf`）、ERC‑20 transfer、UI状態管理
- `dapp/src/hooks/useEvents.ts`：イベント購読（Day10）

---

## 4. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| `No injected provider detected` | MetaMask等が入っていない | 拡張機能を入れて再読み込みする |
| Switch が失敗する | チェーンが未追加 / 許可がない | 先にMetaMask側でネットワークを追加してから再実行する |
| `Token contract not configured` | `VITE_TOKEN_ADDRESS` 未設定 | `.env.local` を見直す |
| トークン残高が 0 | デプロイしたアカウントと接続中アカウントが違う | デプロイ時と同じアカウントで接続する（初期供給はデプロイアドレスにミントされる） |
| `call revert` / `execution reverted` | アドレスが違う / コントラクトが存在しない | チェーンIDとアドレスの組み合わせを確認する |

---

## 5. 追加課題
- 送金フォームに入力検証（アドレス形式、数量、負数/空文字）を追加する。
- UI のエラーハンドリングを `alert` からトーストに置き換える。
- `permit(EIP‑2612)` を使った「署名→中継」送金のUI案を考える（実装は発展）。

---

## 6. まとめ
- `dapp/` を起動し、ウォレット接続→chainId確認→残高取得までの流れを動かした。
- `dapp/.env.local` の chainId とコントラクトアドレスが、動作の成否を決める前提を押さえた。
- 典型的なエラー（provider未検出、チェーン不一致、アドレス不一致）の切り分け観点を整理した。

### 理解チェック（3問）
- Q1. DApp が injected provider（MetaMask等）を使うとき、何が前提になるか？
- Q2. `VITE_CHAIN_ID` と MetaMask 側のチェーンが不一致だと、どんな症状が起きやすいか？
- Q3. `dapp/.env.local` の `VITE_*` を分けて管理する利点は何か？

### 解答例（短く）
- A1. ブラウザにウォレット拡張があり、ユーザーが接続/承認する前提になる（勝手に送金できない）。
- A2. コントラクトが見つからない、残高が0に見える、イベントが読めないなど「別チェーンを見ている」症状が起きやすい。
- A3. チェーンIDやアドレスなど環境依存の設定をコードから切り離し、切り替えミスやコミット事故を減らせる。

### 確認コマンド（最小）
```bash
# Terminal A（ローカルチェーン）
npx hardhat node

# Terminal B（MyToken をローカルへデプロイ）
npx hardhat run scripts/deploy-token.ts --network localhost

# Terminal C（dapp を起動：事前に dapp/.env.local を編集）
npm --prefix dapp ci
test -f dapp/.env.local || cp dapp/.env.example dapp/.env.local
npm --prefix dapp run dev
```

## 7. 提出物
- [ ] 稼働中スクリーンショット（接続、chainId、残高表示、送金ログ）
- [ ] 使用した `VITE_CHAIN_ID` とネットワーク名（鍵は伏せる）
- [ ] 実行した送金TxHash（Explorerリンクがあるとよい）

## 8. 実行例
- 実行ログ例：[`docs/reports/Day09.md`](../reports/Day09.md)
