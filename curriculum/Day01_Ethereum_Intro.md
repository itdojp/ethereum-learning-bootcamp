# Day1：ブロックチェーン原理とEthereum全体像

## 学習目的
- ブロックチェーンの構造とEthereumの基本概念を理解する。
- 実際にRPCを叩いてネットワーク情報を取得する。

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
  - コントラクトアカウント：コードを持ち、EVM上で実行される。

### 1.3 Proof of Stake (PoS) の仕組み
- Ethereumは2022年の「Merge」以降、PoSを採用。
- **バリデータ**がステークしたETHを担保にブロック提案・検証。
- 最終性（Finality）は**Gasper（Casper FFG + LMD-GHOST）**により達成。

### 1.4 L1とL2の関係
- L1（Ethereum Mainnet）は安全性・データ可用性を重視。
- L2（Optimism、Arbitrumなど）はスケーラビリティを重視。
  - トランザクション実行をL2で行い、結果をL1に保存。

---

## 2. ハンズオン演習

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

16進数で返るため、10進変換したい場合：
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

