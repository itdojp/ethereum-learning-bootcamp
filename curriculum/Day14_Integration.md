# Day14：総合演習 — デプロイ＋DApp＋（任意）Verify/CI/The Graph

[← 目次](./TOC.md) | [前: Day13](./Day13_Gas_Optimization.md)

## 学習目的
- 任意ネットワーク（ローカル/テストネット/L2）へコントラクトをデプロイし、成果物として記録する。
- DApp（`dapp/`）から残高確認・送金・イベント購読までを一連で動かす。
- （任意）Verify/CI/The Graph の導線を整えて、チーム開発で破綻しない形にする。

> まず `curriculum/README.md` の「共通の前提」を確認してから進める。

---

## 0. 前提
- つまずきやすい点は補足を参照する：
  - Verify：`appendix/verify.md`
  - GitHub Actions / CI：`appendix/ci-github-actions.md`
  - The Graph：`appendix/the-graph.md` / `subgraph/README.md`

---

## 1. 全体構成（このリポジトリ）
```
.
├── contracts/        # コントラクト
├── scripts/          # デプロイ／操作スクリプト
├── test/             # テスト
├── dapp/             # フロント（Vite + React）
├── curriculum/       # Day01〜Day14
├── appendix/         # つまずき補足・用語
├── subgraph/         # The Graph（生成物は必要に応じて作る）
└── DEPLOYMENTS.md    # デプロイ記録（同梱）
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

例：Optimism（任意）
```bash
npx hardhat run scripts/deploy-token.ts --network optimism
npx hardhat run scripts/deploy-event-token.ts --network optimism
```

出力されたアドレスを控える。

### 2.3 `DEPLOYMENTS.md` に残す
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
```
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

ブラウザで `http://localhost:5173` を開き、Connect Wallet → Switch to Chain → Refresh Balances を確認する。

EventToken を操作してイベントを流したい場合：
```bash
EVT=0x... npx hardhat run scripts/use-event-token.ts --network sepolia
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

> つまずきやすいのは「引数不一致」「コンパイラ設定不一致」「反映待ち」。`appendix/verify.md` を参照する。

---

## 5. フェーズ4：CI / 手動デプロイ（任意）
- テストCI：`.github/workflows/test.yml`（`npm test` を自動実行）
- 手動承認付きデプロイ：`.github/workflows/deploy.yml`（workflow_dispatch + Environment）

運用・つまずきは `appendix/ci-github-actions.md` と Day7 を参照する。

---

## 6. フェーズ5：The Graph（任意）
サブグラフの生成・運用は `subgraph/README.md` と `appendix/the-graph.md` を参照する。

最小は Day10 と同様に「EventToken を対象」にするのが分かりやすい。

---

## 7. チェックリスト
- [ ] デプロイしたアドレスを `DEPLOYMENTS.md` に記録した
- [ ] DApp で chainId / ETH残高 / MyToken残高が表示できる
- [ ] DApp から MyToken を送金できる（少額で）
- [ ] EventToken のイベントを DApp で購読できる（任意）
- [ ] Verify を通せる（任意）
- [ ] CI が動く（任意）
- [ ] サブグラフが build できる（任意）

---

## 8. 提出物
- `DEPLOYMENTS.md` の追記（鍵は伏せる）
- DApp の動作スクリーンショット
- TxHash（送金・イベント発火の実績）
- （任意）Verifyリンク / CI実行ログ / Subgraph buildログ
