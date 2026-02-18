# Day14：総合演習 — デプロイ＋DApp＋（任意）Verify/CI/The Graph

[← 目次](./TOC.md) | [前: Day13](./Day13_Gas_Optimization.md)

## 学習目的
- 任意ネットワーク（ローカル/テストネット/L2）へコントラクトをデプロイし、成果物として記録できるようになる。
- DApp（`dapp/`）から残高確認・送金・イベント購読までを一連で動かせるようになる。
- （任意）[Verify](../appendix/glossary.md)/[CI](../appendix/glossary.md)/[The Graph](../appendix/glossary.md) の導線を整えて、チーム開発で破綻しない形にできるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 前提
- 先に読む付録：[`docs/appendix/verify.md`](../appendix/verify.md) / [`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md) / [`docs/appendix/the-graph.md`](../appendix/the-graph.md)
- 触るファイル（主なもの）：`.env` / `scripts/deploy-token.ts` / `scripts/deploy-event-token.ts` / `dapp/.env.local` / `docs/DEPLOYMENTS.md`
- 今回触らないこと：最初から全部を完璧に通すこと（任意項目は“必要になったら”でよい）
- 最短手順（迷ったらここ）：2.1 で `.env` → 2.2 でデプロイ → 3.1 で `dapp/.env.local` → 3.2 で起動・接続

---

## 1. 全体構成（このリポジトリ）
```text
.
├── contracts/        # コントラクト
├── scripts/          # デプロイ／操作スクリプト
├── test/             # テスト
├── dapp/             # フロント（Vite + React）
└── docs/             # GitHub Pages（公開用コンテンツ）
    ├── curriculum/   # Day01〜Day14
    ├── appendix/     # つまずき補足・用語
    ├── subgraph/     # The Graph（生成物は必要に応じて作る）
    ├── reports/      # 実行ログ
    ├── CHANGELOG.md  # 更新履歴
    └── DEPLOYMENTS.md  # デプロイ記録
```

---

## 2. フェーズ1：コントラクトをデプロイして記録する

### 2.1 `.env` を用意する
```bash
cp .env.example .env
```

`.env` に、使うネットワークのRPCと `PRIVATE_KEY` を入れる（学習用の鍵を推奨）。

### 2.2 MyToken / EventToken をデプロイする
例：Sepolia
```bash
npx hardhat run scripts/deploy-token.ts --network sepolia
npx hardhat run scripts/deploy-event-token.ts --network sepolia
```
期待される出力（最小例）：
```text
MTK: 0x...
EventToken: 0x...
```

例：Optimism（任意）
```bash
npx hardhat run scripts/deploy-token.ts --network optimism
npx hardhat run scripts/deploy-event-token.ts --network optimism
```

出力されたアドレスを控える。

### 2.3 [`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) に残す
最低限、次を残すと後で詰まりにくい：
- network / chainId
- コントラクト名とアドレス
- デプロイTxHash
- コンパイラバージョン（`hardhat.config.ts`）
- （任意）Verifyリンク

---

## 3. フェーズ2：DApp を接続して動かす
`dapp/` は同梱してある。

### 3.1 `dapp/.env.local` を用意する
```bash
cp dapp/.env.example dapp/.env.local
```

`dapp/.env.local` を編集する：
```bash
VITE_CHAIN_ID=11155111
VITE_TOKEN_ADDRESS=0x...   # MyToken
VITE_EVENT_TOKEN=0x...     # EventToken
```

### 3.2 起動
```bash
cd dapp
npm ci
npm run dev
```
期待される出力（最小例）：
```text
Local:   http://localhost:5173/
```

ブラウザで `http://localhost:5173` を開き、Connect Wallet → Switch to Chain → Refresh Balances を確認する。

EventToken を操作してイベントを流したい場合：
```bash
EVT=0x... npx hardhat run scripts/use-event-token.ts --network sepolia
```
期待される出力（最小例）：
```text
transfer complete { to: '0x...' }
```

---

## 4. フェーズ3：Verify（任意）
実行ネットワークが Etherscan/Optimistic Etherscan 対応の場合、Hardhat Verify を使える。

例：Sepolia（MyToken。constructor引数は `deploy-token.ts` の `supply`）
```bash
npx hardhat verify --network sepolia <TOKEN_ADDR> 1000000000000000000000000
```

例：Sepolia（EventToken。constructor引数なし）
```bash
npx hardhat verify --network sepolia <EVENT_TOKEN_ADDR>
```

> つまずきやすいのは「引数不一致」「コンパイラ設定不一致」「反映待ち」。[`docs/appendix/verify.md`](../appendix/verify.md) の「失敗時の切り分けルート」→「よくあるエラー表」を参照する。

---

## 5. フェーズ4：CI / 手動デプロイ（任意）
- テストCI：`.github/workflows/test.yml`（`npm test` を自動実行）
- 手動承認付きデプロイ：`.github/workflows/deploy.yml`（workflow_dispatch + Environment）

運用・つまずきは [`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md) と Day7 を参照する。

---

## 6. フェーズ5：The Graph（任意）
サブグラフの生成・運用は [`docs/subgraph/README.md`](../subgraph/README.md) と [`docs/appendix/the-graph.md`](../appendix/the-graph.md) を参照する。

最小は Day10 と同様に「EventToken を対象」にするのが分かりやすい。

---

## 7. チェックリスト
- [ ] デプロイしたアドレスを `docs/DEPLOYMENTS.md` に記録した
- [ ] DApp で chainId / ETH残高 / MyToken残高が表示できる
- [ ] DApp から MyToken を送金できる（少額で）
- [ ] EventToken のイベントを DApp で購読できる（任意）
- [ ] Verify を通せる（任意）
- [ ] CI が動く（任意）
- [ ] サブグラフが build できる（任意）

---

## 8. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| DApp が動かない / 残高が出ない | chainId とアドレスが不一致 | `dapp/.env.local` と MetaMask のチェーンを揃え、アドレスを再確認する |
| Verifyが通らない | APIキー/引数/設定不一致、反映待ち | [`docs/appendix/verify.md`](../appendix/verify.md) を参照し、引数と設定を合わせる |
| 手動デプロイの承認が出ない | Environment設定・Secretsの場所違い | [`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md) を参照して確認する |
| サブグラフが同期しない | `startBlock`/アドレス不一致 | [`docs/appendix/the-graph.md`](../appendix/the-graph.md) を参照して確認する |

---

## 9. まとめ
- デプロイ記録（`docs/DEPLOYMENTS.md`）→DApp接続→（任意）Verify/CI/The Graph の順で、統合手順を一本化した。
- `dapp/.env.local` の chainId/アドレス不一致が典型的な原因になるため、設定の置き場所を意識する必要がある。
- チェックリストで「どこまで動けばOKか」を明確にし、チーム開発で破綻しにくい形にした。

### 理解チェック（3問）
- Q1. “再現できる成果物”として、最低限どの2つのファイル/ディレクトリを更新するか？
- Q2. DAppが動かないときの典型原因（chainId/アドレス不一致）を、どこで確認してどう直すか？
- Q3. Verify/CI/The Graph は、いつ「任意」から「必要」に変わりやすいか？

### 解答例（短く）
- A1. `docs/DEPLOYMENTS.md`（デプロイ記録）と `docs/reports/`（実行ログ）を残す。
- A2. `dapp/.env.local` の `VITE_CHAIN_ID` / `VITE_*_ADDRESS` と、MetaMask側の接続チェーンを確認し、同じチェーン上のアドレスを入れ直す。
- A3. チームで共有/運用する段階（第三者がExplorerで確認したい、PRで自動テストしたい、履歴/集計を安定して取りたい）になると必要になりやすい。

### 確認コマンド（最小）
```bash
# ルートで一括チェック（テスト + リンクチェック + dapp build）
npm run check:all

# 任意（ローカルで dapp を動かす）
# Terminal A:
npx hardhat node

# Terminal B:
npx hardhat run scripts/deploy-token.ts --network localhost

# Terminal C（事前に dapp/.env.local を編集）:
npm --prefix dapp run dev
```

## 10. 提出物
- [ ] `docs/DEPLOYMENTS.md` の追記（鍵は伏せる）
- [ ] DApp の動作スクリーンショット
- [ ] TxHash（送金・イベント発火の実績）
- [ ] （任意）Verifyリンク / CI実行ログ / [Subgraph](../appendix/glossary.md) buildログ

## 11. 実行例
- 実行ログ例：[`docs/reports/Day14.md`](../reports/Day14.md)
