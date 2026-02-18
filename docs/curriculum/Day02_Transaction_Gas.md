# Day2：トランザクションとGas、EIP‑1559

[← 目次](./TOC.md) | [前: Day1](./Day01_Ethereum_Intro.md) | [次: Day3](./Day03_Env_Setup.md)

## 学習目的
- トランザクション構造、署名、Gas、EIP‑1559料金モデルを理解し、簡単に説明できるようになる。
- コントラクトを用いてGas使用量を比較し、[Etherscan](../appendix/glossary.md)で手数料を確認・解析できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 前提
- Day1 で `RPC` を設定済み（2.5 の CLI パートで使う）
- Remix IDE を使う場合はブラウザで操作する（ウォレット連携は環境により異なる）
- 先に読む付録：[`docs/appendix/glossary.md`](../appendix/glossary.md)（用語に迷ったとき）
- 触るファイル（主なもの）：（任意）`REPORT.md`
- 今回触らないこと：ガス最適化の細部（Day13）／ガス計測の実装（Day6）
- 最短手順（迷ったらここ）：2.2 でコントラクト作成 → 2.3 で `store/add` の違い確認 → 2.4 でEtherscan解析（2.5は任意）

---

## 1. 理論解説（教科書）

### 1.1 トランザクションの構造
Ethereumのトランザクション（[Tx](../appendix/glossary.md)）は以下のフィールドを持つ：
| フィールド | 意味 |
|-------------|------|
| `nonce` | 送信者のTx順序番号（再送防止） |
| `to` | 宛先アドレス（[EOA](../appendix/glossary.md)またはコントラクト） |
| `value` | 送金額（Wei単位） |
| `data` | コントラクト呼び出し情報（関数 + 引数） |
| `gasLimit` | 実行可能な最大Gas量 |
| `maxFeePerGas` | 1単位Gasに支払う最大額（EIP‑1559） |
| `maxPriorityFeePerGas` | バリデータ（ブロック提案者）へのチップ |
| `v, r, s` | 署名情報 |

### 1.2 ガスと料金計算
- 各EVM命令にはGasコストが割り当てられている。
  - 例：`ADD`=3Gas, `SSTORE`=最大20,000Gas。
- トランザクション料金：
  ```text
  手数料 = gasUsed × effectiveGasPrice

  effectivePriorityFee = min(maxPriorityFeePerGas, maxFeePerGas - baseFeePerGas)
  effectiveGasPrice = baseFeePerGas + effectivePriorityFee
  ```

### 1.3 EIP‑1559の仕組み
- baseFeePerGas はネットワーク混雑に応じて自動調整。
- priorityFee（チップ）は送信者が自由に設定。
- `maxFeePerGas` が上限なので、実効チップは `maxFeePerGas - baseFeePerGas` で頭打ちになり得る（式の `min(...)` の意味）。
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
2. `store(123)` の Tx で **Gas Used** を確認する。

補足：
- `add()` は `pure` のため、Remix では **Txを送らずに call（読み取り）** として実行されることがある。
- 「Txとして呼んだときのガス差」を見たい場合は、Day6 のようにベンチ用関数（Tx化）を用意して測定する。

`SSTORE` は永続ストレージ書込みでコストが高いことを確認する（Tx の最低コスト 21,000 Gas に加算される）。

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
```text
Gas Used × Effective Gas Price = 総手数料（Wei）
```
`1 Ether = 10^18 Wei` を用いてETH換算。

---

### 2.5 CLIでTx情報を取得（RPC直叩き）

```bash
TX=<任意のトランザクションハッシュ>

curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
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
> メモ：`expr` は整数演算のため、小額だと 0 になることがある。小数まで見たい場合は `node` や `python` で計算する。

---

### 2.6 追加実験：再書込みのGas差
`SSTORE` のガスは「元の値」と「新しい値」の組み合わせで変わる。代表的な3パターン（0→非0 / 非0→別の非0 / 非0→0）を比較する。

```solidity
function set(uint256 x) external { count = x; }
function setTwice(uint256 a, uint256 b) external { count = a; count = b; }
function clear() external { count = 0; }
```
実験手順（例）：
1. `set(1)`（0→非0）
2. `set(2)`（非0→別の非0）
3. `clear()`（非0→0）

> メモ：Gas Refund は近年のアップデートで縮小され、上限もある。**Refund狙いの最適化は推奨しない**（まずはストレージ書込み回数そのものを減らす）。

---

## 3. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| `add()` のガスが測れない | `pure` 関数が call として実行され、Txになっていない | Txとして測りたい場合は 2.3 の補足（Tx化）に従う |
| EtherscanでTxが見つからない | チェーンが違う / 反映待ち | Sepoliaなら `https://sepolia.etherscan.io/` を使い、少し待って再確認する |
| 手数料計算が 0 になる | `expr` が整数演算で、小額が丸められる | 小数まで見たい場合は `node` / `python` で計算する |

---

## 4. まとめ
- `SSTORE` は最も高コストな命令であり、ストレージ書込みは最小限に抑える設計が重要。
- `add()` のような `pure` 関数は安価。
- EIP‑1559により手数料が自動調整され、ユーザー体験が改善された。

### 理解チェック（3問）
- Q1. `gasLimit` と `gasUsed` の違いは何か？
- Q2. `effectiveGasPrice` は何を表すか？Tx手数料（ETH）はどう計算するか？
- Q3. `pure/view` の関数は「Txとして」実行されないことがある。Txとして測りたいときの方針は何か？

### 解答例（短く）
- A1. `gasLimit` は「ここまでしか使わない」という上限で、`gasUsed` は実際に消費した量だ。
- A2. 実際に支払った 1 gas あたりの価格だ。概ね `fee = gasUsed * effectiveGasPrice`（wei）で計算し、ETHへ換算する。
- A3. call ではなくTxとして送る必要がある。例：計測用にTxを発生させる関数（状態更新/イベント）を用意し、それをスクリプトやテストから実行して計測する。

### 確認コマンド（最小）
```bash
# Day1 で設定した RPC を使う
echo $RPC

# Etherscan/Remix で控えた Tx hash を入れる
TX=0x...
curl -s -X POST "$RPC" -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["'"$TX"'"],"id":1}' \
  | jq '{blockNumber, gasUsed, effectiveGasPrice, status}'
```

## 5. 提出物
- [ ] `REPORT.md` を作成し、次を記載する：
  - [ ] `store()`（Tx）のGas Used と、2.6 の3パターンのGas差（表形式）
  - [ ] Etherscanで確認したTx詳細（スクリーンショットまたは値）
  - [ ] 2.6の追加実験の結果（3パターンの比較）

## 6. 実行例
- 実行ログ例：[`docs/reports/Day02.md`](../reports/Day02.md)
