# Day8：L2ロールアップ（Optimistic vs ZK）とDencun/Blob実測

[← 目次](./TOC.md) | [前: Day7](./Day07_Deploy_CI.md) | [次: Day9](./Day09_DApp_Frontend.md)

## 学習目的
- Optimistic Rollup と ZK Rollup の仕組み差（証明、引出し、最終性）を理解し、簡単に説明できるようになる。
- Dencun（EIP‑4844 / [Blob](../appendix/glossary.md)）の要点を押さえ、L2手数料を実測して記録できるようになる。
- 既存コントラクトをL2（Optimism、任意でzkEVM/zkSync）にデプロイし、手数料・確定時間を比較できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 現行L2/Blobレビューゲート

確認日: **2026-05-23（Asia/Tokyo）**。L2手数料や blob 供給枠はネットワークアップグレードとチェーン実装で変化するため、次を前提に進める。

- Dencun（EIP-4844）で blob が導入され、Pectra（EIP-7691）で mainnet の blob target/max は 6/9 に増えた。
- Fusaka/PeerDAS と Blob Parameter Only fork により、mainnet の blob target/max は段階的に 10/15、14/21 へ引き上げるスケジュールが告知された。各L2やtestnetでの有効化・表示・課金方式はチェーンごとに確認する。
- L2費用は「L2実行コスト + L1データ可用性コスト + sequencer / bridge / RPC / Explorer 周辺条件」の影響を受ける。古いブログの単価やスクリーンショットを根拠にしない。
- bridge は公式導線、contract address、domain、withdrawal/finality、trust assumption、手数料、replay/rescue 手順を確認する。初回は学習用アカウントで小額の test asset だけを扱う。

---

## 1. 前提
- Day3 までの環境構築が完了している（`npm ci` / `.env`）
- L2（例：Optimism）へ送る場合は、対象チェーン側に手数料分の ETH が必要だ（ブリッジ等で用意する）
- 先に読む付録：[`docs/appendix/verify.md`](../appendix/verify.md)（任意：L2 でVerifyする場合）
- 触るファイル（主なもの）：`scripts/deploy-generic.ts` / `scripts/measure-fee.ts` / `scripts/measure-contract.ts` / `metrics/metrics.csv`
- 今回触らないこと：各L2の運用最適解（まずは「Blob前提のコスト構造」を押さえる）
- 最短手順（迷ったらここ）：3.2 でL2へ再デプロイ → 4.1 で `measure-fee.ts` を回してL1/L2の差分を記録（Verifyは任意）

---

## 2. 理論解説（教科書）

### 2.1 ロールアップの基本
- **Optimistic Rollup**：L2は“正しい”と**楽観**し、一定のチャレンジ期間で不正を指摘可能（[Fraud Proof](../appendix/glossary.md)）。引出しに数分〜数日かかる設計が一般的。
- **ZK Rollup**：L2のバッチに**有効性証明（[Validity Proof](../appendix/glossary.md)）**を添付。L1検証が通れば即時確定に近い。実装は高難度。

### 2.2 データ可用性（[DA](../appendix/glossary.md)）と手数料
- L2のトランザクションデータは**L1に投稿**される（calldataやblob等）。
- L1の**データ可用性コスト**がL2手数料のボトルネックになりやすい。
  - rollup-centric の前提では、この「L1へ投稿するデータ（DA）」が **L2コスト構造の中心**になりやすい（＝EIP‑4844/Blobが重要）。

### 2.3 Dencun（EIP‑4844：Proto‑Danksharding / Blob）
- L2データを **[Blob](../appendix/glossary.md)** として一時的にL1へ格納。calldataより安価。
- Blobは一定期間で**非可用化**される（目安: 約18日程度）。ただしロールアップのDA要件は満たす。結果としてL2手数料が大幅に低減。
  - EIP‑4844 は **blob-carrying transactions** を導入し、ロールアップがL1へ投稿するデータの単価（DAコスト）を下げるための土台になっている。

### 2.4 L2手数料の内訳（概念）
ロールアップの手数料は、ざっくり次の2つに分かれる（表示名はL2やエクスプローラで異なる）。

```text
L2手数料 ≒ L2実行コスト + L1データ可用性（Blob）コスト
```

このため、L2上で同じ操作をしても **Blobの混雑**（base fee）次第で費用が変動する。

### 2.5 Pectra（EIP‑7691）：Blob throughput increase
**EIP‑7691** は、2026-05-23（Asia/Tokyo）時点で Ethereum mainnet の Pectra upgrade により **有効化済み** で、Blob の供給枠を増やした Core EIP だ。

| パラメータ（1ブロックあたり） | EIP‑4844 初期値 | EIP‑7691（Pectra） |
|---|---:|---:|
| target blobs | 3 | 6 |
| max blobs | 6 | 9 |

- **target**：この値を基準に blob の base fee が上下しやすい（混雑の“中心”）。
- **max**：1ブロックで許容される上限。

> 注：Ethereum mainnet では Pectra が 2025-05-07 10:05 UTC（epoch 364032）に有効化され、EIP-7691 の target/max 6/9 前提が適用された。テストネット/L2 の有効化タイミングはチェーンや時期で異なるため、実測と公式情報を優先する。
>
> 参考：
> - https://ethereum.org/roadmap/pectra/
> - https://blog.ethereum.org/2025/04/23/pectra-mainnet
> - https://eips.ethereum.org/EIPS/eip-7691

### 2.6 Fusaka / PeerDAS / Blob Parameter Only fork
Fusaka は Pectra 後のネットワークアップグレードで、PeerDAS（EIP-7594）により blob data availability をサンプリングで扱う方向へ進めた。Ethereum Foundation の mainnet announcement では、Fusaka activation 後に Blob Parameter Only（BPO）fork で blob target/max を段階的に増やす方針が示されている。

| 段階 | target blobs | max blobs | 備考 |
|---|---:|---:|---|
| Pectra 後 | 6 | 9 | EIP-7691 の前提 |
| BPO1 | 10 | 15 | 2025-12-09 UTC の予定として告知 |
| BPO2 | 14 | 21 | 2026-01-07 UTC の予定として告知 |

> 注：この表は mainnet announcement と ethereum.org の記載をもとにした時点情報である。学習時は `eth_blobBaseFee`、Explorer、L2 docs、rollup status、RPC の返す値を優先して確認する。
>
> 参考：
> - https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement
> - https://ethereum.org/roadmap/fusaka/peerdas/
> - https://eips.ethereum.org/EIPS/eip-7594

### 2.7 比較観点

| 観点 | Optimistic | ZK |
|---|---|---|
| セキュリティ | fraud proof | validity proof |
| 引出し時間 | 長め | 短い/即時に近い |
| 実装難易度 | 低〜中 | 高 |
| 手数料 | 低（Blobでさらに低減） | 低（計算コストや証明生成が影響） |

---

## 3. ハンズオン：L2追加と再デプロイ

### 3.1 HardhatにL2を追加（参考）
このリポジトリでは `sepolia` / `optimism` / `polygonZk` のネットワーク設定は同梱済みだ（`hardhat.config.ts` を確認する）。  
自分のプロジェクトに追加する場合は、次を参考にする。  
環境変数は **ルートの `.env.example` をベースに管理**し、この章で最低限必要なのは `OPTIMISM_RPC_URL` / `PRIVATE_KEY` / `OPTIMISTIC_ETHERSCAN_API_KEY` だ。

`hardhat.config.ts`
```ts
networks: {
  sepolia: { url: process.env.SEPOLIA_RPC_URL!, accounts: [process.env.PRIVATE_KEY!] },
  optimism: { url: process.env.OPTIMISM_RPC_URL!, accounts: [process.env.PRIVATE_KEY!] },
  // 任意：Polygon zkEVM, zkSync（Hardhatプラグインや設定がチェーン毎に異なる）
  // polygonZk: { url: process.env.POLYGON_ZKEVM_RPC_URL!, accounts: [process.env.PRIVATE_KEY!] },
}
```
`.env.example`（Day8で最低限見る項目）
```bash
OPTIMISM_RPC_URL=
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
OPTIMISTIC_ETHERSCAN_API_KEY=YOUR_OPTIMISTIC_ETHERSCAN_API_KEY

# 任意：Polygon zkEVM も試す場合
POLYGON_ZKEVM_RPC_URL=
```

### 3.2 既存ERC‑20の再デプロイ
```bash
CONTRACT=MyToken ARGS=1000000000000000000000 \
  npx hardhat run scripts/deploy-generic.ts --network optimism
```
出力されたアドレスを控える。

### 3.3 Verify（可能な場合）
```bash
npx hardhat verify --network optimism <DEPLOYED_ADDR> 1000000000000000000000
```
> Optimism の Verify には `OPTIMISTIC_ETHERSCAN_API_KEY` が必要。つまずいたら [`docs/appendix/verify.md`](../appendix/verify.md) を参照する。

---

## 4. 実測：手数料・確定時間を取る

### 4.1 スクリプトで送金と計測
このリポジトリの `scripts/measure-fee.ts` を使う。

実行：
```bash
# 宛先を指定して計測（`TO` を省略した場合は自分宛になる）
TO=0x... VALUE_ETH=0.0001 npx hardhat run scripts/measure-fee.ts --network sepolia
TO=0x... VALUE_ETH=0.0001 npx hardhat run scripts/measure-fee.ts --network optimism
```
出力JSONの `feeEth` と `latencyMs` を表に記録する。

### 3.2 コントラクト関数の計測
このリポジトリの `scripts/measure-contract.ts` を使う（環境変数 `TOKEN` が必須）。

- `TOKEN`：計測したいERC‑20アドレス
- 任意：`TO`（宛先）、`AMOUNT_ETH`（送る量。デフォルト `0.01`）

```bash
TOKEN=0x... TO=0x... AMOUNT_ETH=0.01 npx hardhat run scripts/measure-contract.ts --network optimism
```

### 3.3 CSV出力（任意）
`tools/to-csv.sh`
```bash
#!/usr/bin/env bash
jq -r '[.network,.txHash,.gasUsed,.feeEth,.latencyMs] | @csv'
```
使用例：
```bash
mkdir -p metrics
npx hardhat run scripts/measure-fee.ts --network optimism | tee metrics/op.json
cat metrics/op.json | tools/to-csv.sh >> metrics/metrics.csv
```

---

## 5. L2ブリッジ（概要）
- L1→L2入金（deposit）とL2→L1引出し（withdraw）は、**公式ブリッジ**または信頼境界を明示したサードパーティブリッジを利用。
- Optimisticは**引出しに時間**がかかる。運用上は**流動性ブリッジ**も検討対象だが、追加の trust assumption、手数料、失敗時の rescue 手順を確認する。
- セキュリティ上、公式ドメイン、bridge contract address、upgrade 権限、多署名管理、withdrawal/finality、過去のインシデント、support channel を確認。
- 初回は学習用アカウントと test asset / 少額で検証し、Mainnet 実資産や長期保管用の鍵を使わない。

---

## 6. 評価観点とドキュメント
- `metrics/metrics.csv` に **feeEth** と **latencyMs** を時刻つきで蓄積。
- [`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) に L2 デプロイ・Verify・ブリッジ手順の要約を追記。
- 差分が大きいときは、**RPCベンダ、L2 status page**や**Blob可用状況**を確認。

---

## 7. つまずきポイント

| 症状 | 原因 | 対策 |
|---|---|---|
| `insufficient funds` | L2 で手数料不足 | L2のETH をブリッジまたは取引所から供給 |
| Verify失敗 | コンパイラ設定差分 | `hardhat.config.ts` の設定を一致させる。詰まったら [`docs/appendix/verify.md`](../appendix/verify.md) |
| 異常な`latencyMs` | RPC遅延/混雑 | 別RPCで再測、再試行、バッチ間隔を変える |

---

## 8. まとめ
- rollup-centric 前提では、L2コスト構造の中心が「L1へ投稿するデータ（DA）」になりやすいことを押さえた。
- L1/L2へデプロイし、手数料（fee）と確定までの体感（latency）を同じ物差しで測る方法を整理した。
- 計測結果は `metrics/metrics.csv` や [`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) に残し、後から比較できる形にするのが重要だ。

### 理解チェック（3問）
- Q1. Optimistic Rollup と ZK Rollup の違いを、確定までの仕組み（チャレンジ/証明）で説明してみる。
- Q2. EIP‑4844（Blob）と EIP‑7691（Blob throughput増）は、L2手数料にどう影響し得るか？
- Q3. 手数料・確定時間を実測するとき、最低限どんな項目を記録するとよいか？

### 解答例（短く）
- A1. Optimistic は「正しい」と楽観し、一定期間で不正を指摘できる設計になりやすい。ZK は有効性証明を添付し、L1検証が通れば確定に近い。
- A2. BlobはDAコストの前提を変え、rollupの投稿単価が下がり得る。Pectra や Fusaka/BPO の throughput 増は供給枠を増やし、混雑時の単価上昇を抑え得るが、実際の手数料は各L2の設計と混雑に依存する。
- A3. 例：network/chainId、TxHash、gasUsed/effectiveGasPrice（または手数料ETH）、計測時刻とlatency、使用RPC。

### 確認コマンド（最小）
```bash
# 要 .env（OPTIMISM_RPC_URL / PRIVATE_KEY）と、Optimism 側の手数料分ETH
npx hardhat run scripts/deploy-generic.ts --network optimism

# ETH転送の手数料を実測（feeEth / latencyMs が出る）
npx hardhat run scripts/measure-fee.ts --network optimism

# 任意（ERC-20 transfer の手数料を実測：TOKEN にデプロイ済みアドレス）
TOKEN=0x... npx hardhat run scripts/measure-contract.ts --network optimism
```

## 8. 提出物
- [ ] `measure-fee.ts` と `measure-contract.ts` の実行JSONと `metrics/metrics.csv`
- [ ] Optimism（任意でzkEVM）でのデプロイアドレス、Verifyリンク
- [ ] ブリッジで得たL2残高のスクリーンショット（鍵・残高は秘匿）

## 9. 実行例
- 実行ログ例：[`docs/reports/Day08.md`](../reports/Day08.md)
