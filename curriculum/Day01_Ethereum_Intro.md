# Day1：ブロックチェーン原理とEthereum全体像

[← 目次](./TOC.md) | [次: Day2](./Day02_Transaction_Gas.md)

## 学習目的
- ブロックチェーンの構造とEthereumの基本概念を理解する。
- 実際にRPCを叩いてネットワーク情報を取得する。

> まず `curriculum/README.md` の「共通の前提」を確認してから進める。

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
  - EOA（Externally Owned Account）：人間が秘密鍵で操作。
    - 補足：従来は「EOAはコードを持たない」と説明されることが多いが、**EIP‑7702** によりEOAが **delegation indicator（委任先）** をセットして、実行時に別アドレスのコードへ委譲する挙動が入り得る。初心者は「EOA＝常に code empty」と固定観念にしないこと（概要は `appendix/account-abstraction.md`）。
  - コントラクトアカウント：コードを持ち、EVM上で実行される。

### 1.3 Proof of Stake (PoS) の仕組み
- Ethereumは2022年の「Merge」以降、PoSを採用。
- **バリデータ**がステークしたETHを担保にブロック提案・検証。
- 最終性（Finality）は**Gasper（Casper FFG + LMD-GHOST）**により達成。

### 1.4 L1とL2の関係
- L1（Ethereum Mainnet）は安全性・データ可用性を重視。
- L2（Optimism、Arbitrumなど）はスケーラビリティを重視。
  - トランザクション実行をL2で行い、結果をL1に保存。
  - 近年は **rollup-centric（L2中心）** のスケーリングが前提で、L2手数料は「L1へ投稿するデータ可用性（DA）コスト」の影響が大きくなりやすい（詳細はDay8）。
    - **Dencun（EIP‑4844）** で blob-carrying transactions（Blob）が導入され、L2のDAコストが下がりやすくなった。
    - **Pectra（EIP‑7691）** では blob の throughput が増え、blob の target/max が **3/6 → 6/9** に引き上げられている。

---

## 2. ハンズオン演習

> 用語メモ：以降、トランザクションを **Tx**、ブロックチェーンノードとの通信エンドポイントを **RPC** と書く。16進数は `0x` から始まる表記。

### 2.1 事前準備
環境：Linux/macOS/WSL2。`curl`と`jq`コマンドを使用。

```bash
sudo apt update && sudo apt install -y curl jq
```

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
curl -s -X POST $RPC \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result
```

16進数（先頭が `0x` の数値）で返ってくるため、人間が読みやすい 10 進数に変換したい場合：
```bash
printf "%d\n" 0x$(curl -s -X POST $RPC \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result | cut -c3-)
```

---

### 2.4 ブロックの詳細を取得
直近のブロックデータを取得し、主要フィールドを確認。

```bash
BLOCK=$(curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)

curl -s -X POST $RPC -H 'Content-Type: application/json' \
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
for i in {0..2}; do
  BLOCK=$(printf "0x%x" $((0x$(curl -s -X POST $RPC \
    -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result | cut -c3-) - i)))
  echo "Block $BLOCK"
  curl -s -X POST $RPC -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["'"$BLOCK"'", false],"id":2}' | jq '{gasUsed, gasLimit}'
  sleep 1
done
```

---

## 3. まとめとレポート
- PoSは計算力ではなく資金をベースにした合意形成方式。
- L1は安全性、L2はスケーラビリティを担う。
- `gasUsed/gasLimit`比はネットワークの混雑度を示す指標。

### 提出物
- `REPORT.md` に以下を記載：
  - 実行したコマンドと出力例
  - 3ブロック分の混雑度分析
  - 学んだ内容を3行で要約
