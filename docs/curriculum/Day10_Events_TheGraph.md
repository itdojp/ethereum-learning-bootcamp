# Day10：イベント購読とThe Graph（サブグラフ）

[← 目次](./TOC.md) | [前: Day9](./Day09_DApp_Frontend.md) | [次: Day11](./Day11_NFT_Metadata.md)

## 学習目的
- Solidityイベントの `indexed` 設計と購読方法を理解し、簡単に説明できるようになる。
- ブラウザからリアルタイム購読（ethers）を動かして表示を確認できるようになる。
- [The Graph](../appendix/glossary.md)で履歴データをインデックス化し、[GraphQL](../appendix/glossary.md)で取得できるようになる。

> まず [`docs/curriculum/README.md`](./README.md) の「共通の前提」を確認してから進める。

---

## 0. 前提
- Day9 の `dapp/` を起動できる。
- `EventToken` を任意ネットワークへデプロイできる（ローカル/テストネット/L2のどれでもよい）。
- The Graph で詰まりやすい点は [`docs/appendix/the-graph.md`](../appendix/the-graph.md) の「最短成功ルート」→「失敗時の切り分け」→「よくあるエラー表」を参照する。
- 先に読む付録：[`docs/appendix/the-graph.md`](../appendix/the-graph.md) / [`appendix/glossary.md`](../appendix/glossary.md)
- 触るファイル（主なもの）：`contracts/EventToken.sol` / `scripts/deploy-event-token.ts` / `scripts/use-event-token.ts` / `dapp/src/hooks/useEvents.ts`
- 今回触らないこと：本番運用のインデックス設計（まずは“作って動かす”）
- 最短手順（迷ったらここ）：2章でイベント発火 → 3章でdapp購読表示 →（任意）4章でThe Graphのひな形生成

---

## 1. 理論解説（教科書）

### 1.1 イベントの役割
- オンチェーン状態を直接列挙するのはコスト高。**イベントログ**を使うとオフチェーンで効率取得できる。
- `indexed` を付けた引数は**topic**になり、フィルタが高速になる。

### 1.2 設計指針
- 検索キーは `indexed`。多すぎるとtopicが増え、ログのサイズも増えやすい。
- イベント名と引数は**安定**させる。後方互換性を意識する。

---

## 2. ハンズオンA：EventToken をデプロイしてイベントを発火する
`contracts/EventToken.sol` とスクリプトは同梱してある。

### 2.1 デプロイ
```bash
npx hardhat run scripts/deploy-event-token.ts --network sepolia
```
期待される出力（最小例）：
```text
EventToken: 0x...
```
出力されたアドレスを控える（`0x...`）。

### 2.2 イベント発火
```bash
EVT=0x... npx hardhat run scripts/use-event-token.ts --network sepolia
```
期待される出力（最小例）：
```text
transfer complete { to: '0x...' }
```
`TransferLogged` が複数回 `emit` される。

---

## 3. ハンズオンB：ブラウザ購読（dapp）
このリポジトリの `dapp/` は、`TransferLogged` を購読して最新ログを表示できる（`dapp/src/hooks/useEvents.ts`）。

### 3.1 設定
`dapp/.env.local`（なければ `cp dapp/.env.example dapp/.env.local`）を編集する：
```
VITE_CHAIN_ID=11155111
VITE_EVENT_TOKEN=0x...      # 2.1 の EventToken アドレス
```

> `dapp/` は injected provider（MetaMask等）を使うため、MetaMask側の接続チェーンも揃える必要がある。

### 3.2 起動
```bash
cd dapp
npm run dev
```
`http://localhost:5173` を開き、Connect Wallet → Switch to Chain →（必要なら）Refresh Balances を押す。

イベントが流れていれば、画面に `Recent TransferLogged events` が表示される。

---

## 4. ハンズオンC：The Graph（サブグラフ）
The Graph の手順は更新されやすい。ここでは [Subgraph](../appendix/glossary.md)（サブグラフ）について「作る場所」と「詰まりやすい点」だけ押さえ、詳細は補足へ寄せる。

- 生成物はこのリポジトリでは同梱しない。
- `subgraph/` 配下に生成する運用を推奨する（参照：[`docs/subgraph/README.md`](../subgraph/README.md)）。

### 4.1 ひな形生成（例：Sepolia）
```bash
graph init \
  --from-contract <EVENT_TOKEN_ADDR> \
  --network sepolia \
  subgraph/event-token
```

### 4.2 startBlock を入れる
`startBlock` は「このブロック以降だけを見る」という範囲指定。**デプロイTxのブロック番号** を入れるのが基本。

取得例やつまずきは [`docs/appendix/the-graph.md`](../appendix/the-graph.md) を参照する。

### 4.3 codegen / build
```bash
cd subgraph/event-token
npm i
graph codegen
graph build
```

デプロイは The Graph Studio の手順に従う（Authトークンが必要）。

---

## 5. つまずきポイント
- startBlock が分からない / 遅すぎる：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)
- build が落ちる（ABI/スキーマ不一致）：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)
- ブラウザ購読が発火しない：チェーンID、コントラクトアドレス、イベント定義（`TransferLogged`）を確認する

---

## 6. まとめ
- `indexed` を含むイベント設計と、購読が「履歴取得・UI更新」の土台になることを押さえた。
- EventToken のイベント発火 → dapp での購読表示、までの一連の流れを確認した。
- The Graph は更新頻度が高いため、生成場所・`startBlock` といった“詰まりどころ”を付録に寄せる構成にした。

### 確認コマンド（最小）
```bash
# EventToken をデプロイ（例：Sepolia。要 .env）
npx hardhat run scripts/deploy-event-token.ts --network sepolia

# EVT にデプロイアドレスを入れてイベントを発火
EVT=0x... npx hardhat run scripts/use-event-token.ts --network sepolia

# dapp を起動（事前に dapp/.env.local の VITE_EVENT_TOKEN を設定）
npm --prefix dapp run dev
```

## 7. 提出物
- [ ] EventTokenアドレスと、イベント発火スクリプトの実行ログ
- [ ] dapp でリアルタイムログが表示されているスクリーンショット
- [ ] （任意）サブグラフの `graph build` ログと GraphQL クエリ結果

## 8. 実行例
- 実行ログ例：[`reports/Day10.md`](../reports/Day10.md)
