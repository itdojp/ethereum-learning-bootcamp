# Day10：イベント購読とThe Graph（サブグラフ）

[← 目次](./TOC.md) | [前: Day9](./Day09_DApp_Frontend.md) | [次: Day11](./Day11_NFT_Metadata.md)

## 学習目的
- Solidityイベントの `indexed` 設計と購読方法を理解し、簡単に説明できるようになる。
- ブラウザからリアルタイム購読（ethers）を動かして表示を確認できるようになる。
- [The Graph](../appendix/glossary.md)で履歴データをインデックス化し、[GraphQL](../appendix/glossary.md)で取得できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 前提
- Day9 の `dapp/` を起動できる。
- `EventToken` を任意ネットワークへデプロイできる（ローカル/テストネット/L2のどれでもよい）。
- ミニプロジェクト（通しで作るもの）：`EventToken` は Day14 の統合でも使う（全体像：[`docs/curriculum/Project.md`](./Project.md)）
- The Graph で詰まりやすい点は [`docs/appendix/the-graph.md`](../appendix/the-graph.md) の「最短成功ルート」→「失敗時の切り分け」→「よくあるエラー表」を参照する。
- 先に読む付録：[`docs/appendix/the-graph.md`](../appendix/the-graph.md) / [`docs/appendix/glossary.md`](../appendix/glossary.md)
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
```bash
VITE_CHAIN_ID=11155111
VITE_EVENT_TOKEN=0x...      # 2.1 の EventToken アドレス
```

> `dapp/` は injected provider（MetaMask 等）を使うため、MetaMask 側の接続チェーンも揃える必要がある。

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

### 4.1 StudioとCLIの役割を分ける

2026-07-22に動作確認した対象は `@graphprotocol/graph-cli@0.98.1`（Node.js 20.18.1以上）である。Subgraph Studioで先にSubgraphを作成し、詳細画面に表示されるslugを確認する。

| 値 | 役割 | 例 |
|---|---|---|
| Subgraph Studio | 生成物のdeploy先（product） | Studio上で作成したSubgraph |
| `SUBGRAPH_SLUG` | Studio上のSubgraph ID | `event-token-sepolia` |
| local directory | scaffoldを生成するローカルパス | `subgraph/event-token` |
| `network` | index対象コントラクトのchain | `sepolia` |

公式install pageには `--product subgraph-studio` の例も残っているが、配布中のCLI 0.98.1はこのflagを定義せず、deploy先はSubgraph Studioがdefaultである。公式ページだけでなく、実行するversionの `--version` と `init --help` を確認する。

### 4.2 ひな形生成（例：Sepolia）

リポジトリルートで、Studioのslug、デプロイ済みEventTokenのaddressとblock、Hardhat artifactを明示する。

```bash
export SUBGRAPH_SLUG=event-token-sepolia
export EVENT_TOKEN_ADDR=0x...
export EVENT_TOKEN_START_BLOCK=12345678
export EVENT_TOKEN_ABI=artifacts/contracts/EventToken.sol/EventToken.json

npx hardhat compile
npx --yes @graphprotocol/graph-cli@0.98.1 --version
npx --yes @graphprotocol/graph-cli@0.98.1 init \
  "$SUBGRAPH_SLUG" \
  subgraph/event-token \
  --protocol ethereum \
  --from-contract "$EVENT_TOKEN_ADDR" \
  --network sepolia \
  --abi "$EVENT_TOKEN_ABI" \
  --contract-name EventToken \
  --start-block "$EVENT_TOKEN_START_BLOCK" \
  --index-events \
  --skip-install \
  --skip-git
```

`--skip-install` は生成された `package.json` を確認してから依存関係を入れるため、`--skip-git` は親repositoryをCLIが自動stage/commitしないために指定する。後者は0.98.1でdeprecation warningが出るため、将来versionでは `init --help` でdefaultを再確認する。

### 4.3 startBlock を入れる
`startBlock` は「このブロック以降だけを見る」という範囲指定。**デプロイTxのブロック番号**を入れるのが基本で、address、network、blockの3点を同じdeploy記録から取得する。

取得例やつまずきは [`docs/appendix/the-graph.md`](../appendix/the-graph.md) を参照する。

### 4.4 dependency確認 / codegen / build
```bash
cd subgraph/event-token
npm install --ignore-scripts
npm audit --omit=dev --omit=optional
npm run codegen
npm run build
```

`npm audit` はbuild成功と別の判定である。2026-07-22のclean scaffoldではcodegen/buildは成功した一方、Graph CLI 0.98.1の生成依存にproduction vulnerability（moderate 4 / high 9 / critical 2）が残った。`npm audit fix --force`で旧CLIへ自動downgradeせず、deploy keyを入力する前に最新releaseとadvisoryを再監査する。

Studio deploy keyの準備、`graph auth`、`graph deploy`、平文credential fileの扱いは [`docs/appendix/the-graph.md`](../appendix/the-graph.md) に分離する。slugはdeploy先IDであり、local directoryやdeploy keyではない。

---

## 5. つまずきポイント
- startBlock が分からない / 遅すぎる：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)
- build が落ちる（ABI/スキーマ不一致）：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)
- `--product` がunknown flagになる：CLI 0.98.1では指定せず、`--version` / `init --help` とStudio defaultを確認する
- `npm audit` が失敗する：build結果と分離し、最新CLI release・advisory・影響経路を確認する。`--force`で自動downgradeしない
- ブラウザ購読が発火しない：チェーン ID、コントラクトアドレス、イベント定義（`TransferLogged`）を確認する

---

## 6. まとめ
- `indexed` を含むイベント設計と、購読が「履歴取得・UI更新」の土台になることを押さえた。
- EventToken のイベント発火 → dapp での購読表示、までの一連の流れを確認した。
- The GraphはStudioのslug、local directory、network、deploy keyを別の役割として扱い、CLI version・`startBlock`・dependency監査を再現条件に含める。

### 理解チェック（3問）
- Q1. イベント引数に `indexed` を付けると何が変わるか？デメリットは何か？
- Q2. ブラウザ購読（dapp）と The Graph でのIndexingは、何が得意で何が苦手か？
- Q3. Studioのslugとlocal directoryは何が違い、`startBlock` を入れる理由は何か？

### 解答例（短く）
- A1. topicとして検索しやすくなり、フィルタが高速になる。増やしすぎるとログサイズが増え、設計変更もしにくい。
- A2. ブラウザ購読はリアルタイム表示に向くが、長期履歴の集計は苦手になりやすい。The Graphは履歴/集計に向くが、セットアップや更新追従が必要になる。
- A3. slugはStudio上のSubgraph ID、local directoryはscaffoldの保存先である。`startBlock`は走査範囲を絞り、不要な過去ブロックを読まないために、基本はデプロイTxのblockを指定する。

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
- 実行ログ例：[`docs/reports/Day10.md`](../reports/Day10.md)
