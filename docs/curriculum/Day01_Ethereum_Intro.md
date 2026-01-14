# Day1：ブロックチェーン原理とEthereum全体像

[← 目次](./TOC.md) | [次: Day2](./Day02_Transaction_Gas.md)

## 学習目的
- ブロックチェーンの構造とEthereumの基本概念を理解し、簡単に説明できるようになる。
- 実際にRPCを叩いてネットワーク情報を取得し、結果を確認できるようになる。

> まず [`docs/curriculum/README.md`](./README.md) の「共通の前提」を確認してから進める。

---

## 0. 前提
- OS：Linux/macOS/WSL2（コマンドは `bash` 想定）
- 必要コマンド：`curl`, `jq`
- 必要なもの：Sepolia などの RPC エンドポイント（Alchemy/Infura 等）
- この章は **Tx を送らない**。テストETHは不要だ。
- 先に読む付録：[`docs/appendix/glossary.md`](../appendix/glossary.md)（用語に迷ったとき）
- 触るファイル（主なもの）：（任意）`REPORT.md`
- 今回触らないこと：秘密鍵で署名してTxを送る／コントラクトのデプロイ（Day3以降で扱う）
- 最短手順（迷ったらここ）：RPCを `RPC` に設定 → 2.3 でブロック番号 → 2.4 でブロック詳細 → 2.5 で3ブロック比較

---

## 1. 理論解説（教科書）

### 1.1 ブロックチェーンの基本構造
- ブロックチェーンは**改ざん困難な分散台帳**であり、ノードが共有する取引履歴の集合体。
- 各ブロックは以下を含む：
  - **ヘッダ情報**：`parentHash`, `timestamp`, `gasLimit`, `stateRoot`など。
  - **トランザクションリスト**：ブロック内の取引情報。
  - **ハッシュ参照**：前のブロックを指すチェーン構造で整合性を維持。

### 1.2 Ethereumの特徴
- Ethereumは「**世界状態マシン (World State Machine)**」。
  - すべてのアカウントとコントラクトの状態を保持。
  - 状態はMerkle-Patricia Trie（MPT）で管理される。
- **アカウントの種類**：
  - [EOA](../appendix/glossary.md)（Externally Owned Account）：人間が秘密鍵で操作。
    - 補足：従来は「EOAはコードを持たない」と説明されることが多いが、**EIP‑7702** によりEOAが **[delegation indicator](../appendix/glossary.md)（委任先）** をセットして、実行時に別アドレスのコードへ委譲する挙動が入り得る。初心者は「EOA＝常に code empty」と固定観念にしないこと（概要は [`docs/appendix/account-abstraction.md`](../appendix/account-abstraction.md)）。
  - コントラクトアカウント：コードを持ち、EVM上で実行される。

### 1.3 Proof of Stake (PoS) の仕組み
- Ethereumは2022年の「Merge」以降、PoSを採用。
- **バリデータ**がステークしたETHを担保にブロック提案・検証。
- 最終性（[Finality](../appendix/glossary.md)）は**Gasper（Casper FFG + LMD-GHOST）**により達成。

### 1.4 L1とL2の関係
- L1（Ethereum Mainnet）は安全性・データ可用性を重視。
- L2（Optimism、Arbitrumなど）はスケーラビリティを重視。
  - トランザクション実行をL2で行い、結果をL1に保存。
  - 近年は **rollup-centric（L2中心）** のスケーリングが前提で、L2手数料は「L1へ投稿するデータ可用性（[DA](../appendix/glossary.md)）コスト」の影響が大きくなりやすい（詳細はDay8）。
    - **Dencun（EIP‑4844）** で blob-carrying transactions（[Blob](../appendix/glossary.md)）が導入され、L2のDAコストが下がりやすくなった。
    - **Pectra（EIP‑7691）** では blob の throughput が増え、blob の target/max が **3/6 → 6/9** に引き上げられている。

---

## 2. ハンズオン演習

> 用語メモ：以降、トランザクションを **[Tx](../appendix/glossary.md)**、ブロックチェーンノードとの通信エンドポイントを **[RPC](../appendix/glossary.md)** と書く。16進数は `0x` から始まる表記。

### 2.1 事前準備
環境：Linux/macOS/WSL2。`curl`と`jq`コマンドを使用。

```bash
sudo apt update && sudo apt install -y curl jq
```

> Ubuntu/WSL2 以外は各OSの方法で `curl`/`jq` を用意する。

### 2.2 RPCエンドポイント設定
AlchemyまたはInfuraで取得したRPCを設定。

```bash
export RPC="https://sepolia.infura.io/v3/<YOUR_API_KEY>"
```

確認：
```bash
echo $RPC
```

---

### 2.3 現在のブロック番号を取得
Ethereumノードの最新ブロック番号を取得する。

```bash
curl -s -X POST "$RPC" \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result
```

16進数（先頭が `0x` の数値）で返ってくるため、人間が読みやすい 10 進数に変換したい場合：
```bash
printf "%d\n" 0x$(curl -s -X POST "$RPC" \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result | cut -c3-)
```

---

### 2.4 ブロックの詳細を取得
直近のブロックデータを取得し、主要フィールドを確認。

```bash
BLOCK=$(curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)

curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["'"$BLOCK"'", true],"id":2}' | jq '{number, hash, baseFeePerGas, gasUsed, gasLimit, miner, timestamp, transactions:(.transactions|length)}'
```

出力例：
```json
{
  "number": "0x158b4c9",
  "baseFeePerGas": "0x19a3af8b6",
  "gasUsed": "0x5f9d03",
  "gasLimit": "0x1c9c380",
  "transactions": 143
}
```

---

### 2.5 ブロック混雑度を分析
1. `gasUsed` と `gasLimit` の比率を計算。
2. 3ブロック分を連続取得して比較。

```bash
LATEST_HEX=$(curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)
LATEST_DEC=$((16#${LATEST_HEX#0x}))

for i in 0 1 2; do
  BLOCK_DEC=$((LATEST_DEC - i))
  BLOCK_HEX=$(printf "0x%x" "$BLOCK_DEC")
  echo "Block $BLOCK_HEX"
  curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["'"$BLOCK_HEX"'", false],"id":2}' | jq '{gasUsed, gasLimit}'
  sleep 1
done
```

---

## 3. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| `jq: command not found` | `jq` が未インストール | OSの方法で `jq` を入れる（Ubuntu/WSL2なら `sudo apt install -y jq`） |
| RPCが `403` / `unauthorized` | APIキー不正/制限、URLの貼り間違い | RPC URLを見直し、プロバイダ側でキーを確認する |
| 10進変換がうまくいかない | 16進数（`0x...`）の扱いミス | `printf \"%d\\n\" 0x...` の形で変換する（例は 2.3 を参照） |

---

## 4. まとめ
- PoSは計算力ではなく資金をベースにした合意形成方式。
- L1は安全性、L2はスケーラビリティを担う。
- `gasUsed/gasLimit`比はネットワークの混雑度を示す指標。

### 確認コマンド（最小）
```bash
# RPC が設定されていること
echo $RPC

# 最新ブロック番号が取得できること
curl -s -X POST "$RPC" \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result
```

## 5. 提出物
- [ ] `REPORT.md` を作成し、次を記載する：
  - [ ] 実行したコマンドと出力例
  - [ ] 3ブロック分の混雑度分析
  - [ ] 学んだ内容を3行で要約

## 6. 実行例
- 実行ログ例：[`docs/reports/Day01.md`](../reports/Day01.md)
