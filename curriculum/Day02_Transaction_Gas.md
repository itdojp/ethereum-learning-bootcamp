# Day2：トランザクションとGas、EIP‑1559

## 学習目的
- トランザクション構造、署名、Gas、EIP‑1559料金モデルを理解する。
- コントラクトを用いてGas使用量を比較し、Etherscanで手数料を解析する。

---

## 1. 理論解説（教科書）

### 1.1 トランザクションの構造
Ethereumのトランザクション（Tx）は以下のフィールドを持つ：
| フィールド | 意味 |
|-------------|------|
| `nonce` | 送信者のTx順序番号（再送防止） |
| `to` | 宛先アドレス（EOAまたはコントラクト） |
| `value` | 送金額（Wei単位） |
| `data` | コントラクト呼び出し情報（関数 + 引数） |
| `gasLimit` | 実行可能な最大Gas量 |
| `maxFeePerGas` | 1単位Gasに支払う最大額（EIP‑1559） |
| `maxPriorityFeePerGas` | マイナー（バリデータ）へのチップ |
| `v, r, s` | 署名情報 |

### 1.2 ガスと料金計算
- 各EVM命令にはGasコストが割り当てられている。
  - 例：`ADD`=3Gas, `SSTORE`=最大20,000Gas。
- トランザクション料金：
  ```
  手数料 = gasUsed × effectiveGasPrice
  effectiveGasPrice = baseFeePerGas + priorityFee（ただし上限はmaxFee）
  ```

### 1.3 EIP‑1559の仕組み
- baseFeePerGas はネットワーク混雑に応じて自動調整。
- priorityFee（チップ）は送信者が自由に設定。
- 結果として手数料は安定し、予測可能性が向上。

### 1.4 トランザクション失敗時の注意
- `revert`（失敗）しても消費したGasは戻らない（返金は未使用分のみ）。

---

## 2. ハンズオン演習

### 2.1 準備
Remix IDE を利用するか、Hardhat プロジェクト内で実施する。

---

### 2.2 コントラクト作成
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GasTest {
    uint256 public count;

    function store(uint256 x) external {
        count = x; // ストレージ書込み（高Gas）
    }

    function add(uint256 x, uint256 y) external pure returns (uint256) {
        return x + y; // 計算のみ（低Gas）
    }
}
```
保存後に「Compile」→「Deploy」ボタンを押す。

---

### 2.3 Gas消費量を比較
1. Remix の **Deployed Contracts** パネルで：
   - `store(123)` を呼び出し。
   - `add(10,20)` を呼び出し。
2. 各Txの詳細で **Gas Used** を比較。

例：
```
store():  21,000 Gas
add():      8,000 Gas
```

`SSTORE` は永続ストレージ書込みでコストが高いことを確認する。

---

### 2.4 Etherscanでトランザクションを解析
1. RemixコンソールまたはMetaMaskでTxハッシュを取得。
2. [https://sepolia.etherscan.io/](https://sepolia.etherscan.io/) にアクセスし、Txハッシュを検索。
3. 下部「Transaction Details」で以下を確認：
   - `Gas Limit` / `Gas Used`
   - `Base Fee Per Gas`
   - `Max Priority Fee Per Gas`
   - `Effective Gas Price`

**手数料計算**：
```
Gas Used × Effective Gas Price = 総手数料（Wei）
```
`1 Ether = 10^18 Wei` を用いてETH換算。

---

### 2.5 CLIでTx情報を取得（RPC直叩き）

```bash
TX=<任意のトランザクションハッシュ>

curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'"$TX"'"],"id":1}' | jq '{blockNumber, gasUsed, effectiveGasPrice, status}'
```

出力例：
```json
{
  "blockNumber": "0x158b6f4",
  "gasUsed": "0x5208",
  "effectiveGasPrice": "0x19a3af8b6",
  "status": "0x1"
}
```
Gas消費量が16進数で表示されるので、次のように変換してETHに換算：
```bash
expr $(printf "%d" 0x5208) \* $(printf "%d" 0x19a3af8b6) / 1000000000000000000
```

---

### 2.6 追加実験：再書込みのGas差
`SSTORE` のガスは「元の値」と「新しい値」の組み合わせで変わります。代表的な3パターン（0→非0 / 非0→別の非0 / 非0→0）を比較します。

```solidity
function set(uint256 x) external { count = x; }
function setTwice(uint256 a, uint256 b) external { count = a; count = b; }
function clear() external { count = 0; }
```
実験手順（例）：
1. `set(1)`（0→非0）
2. `set(2)`（非0→別の非0）
3. `clear()`（非0→0）

> メモ：Gas Refund は近年のアップデートで縮小され、上限もあります。**Refund狙いの最適化は推奨されません**（まずはストレージ書込み回数そのものを減らす）。

---

## 3. まとめとレポート
- `SSTORE` は最も高コストな命令であり、ストレージ書込みは最小限に抑える設計が重要。
- `add()` のような `pure` 関数は安価。
- EIP‑1559により手数料が自動調整され、ユーザー体験が改善された。

### 提出物
- `REPORT.md` に以下を記載：
  - `store()` と `add()` のGas使用量比較（表形式）
  - Etherscanで確認したTx詳細（スクリーンショットまたは値）
  - 2.6の追加実験の結果（3パターンの比較）
