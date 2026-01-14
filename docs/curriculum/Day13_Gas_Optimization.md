# Day13：ガス最適化（設計原則・実測・比較）

[← 目次](./TOC.md) | [前: Day12](./Day12_Security.md) | [次: Day14](./Day14_Integration.md)

## 学習目的
- ガスコストの主要要因（ストレージ、calldata、イベント、ループ）を理解し、簡単に説明できるようになる。
- 設計で削減できるポイント（packing、immutable/constant、custom errors、関数属性）を実践できるようになる。
- Hardhat/Foundryで**同一機能の実装差**を測定し、表にまとめられるようになる。

> まず [`docs/curriculum/README.md`](./README.md) の「共通の前提」を確認してから進める。

---

## 0. 前提
- Day6で `hardhat-gas-reporter` を導入済み。
- 任意でFoundryの `gas-snapshot` を併用可。
- 先に読む付録：[`appendix/glossary.md`](../appendix/glossary.md)（用語に迷ったとき）
- 触るファイル（主なもの）：`contracts/GasPack.sol` / `test/gas-pack.ts` / `contracts/GasArgs.sol` / `test/gas-args.ts` / `metrics/gas_day13.md`
- 今回触らないこと：最小可読性を捨てる極限最適化（まずは“効くポイント”を実測で掴む）
- 最短手順（迷ったらここ）：2章/3章のテストを個別に実行してガス差を確認 → 表にまとめる（例：`npx hardhat test test/gas-pack.ts`）

---

## 1. 理論（教科書）

### 1.1 コストの本質
- **ストレージ書込み（SSTORE）**が高コスト。読み出し（SLOAD）も相対的に高い。
- **calldata** は読み取り専用で安価。外部関数引数は可能な限り `calldata`。
- **イベント**はtopic数とデータ量に比例。監視キーのみ `indexed`。
- **ループ**は要素数に比例。オンチェーン集計は最小化し、必要ならバッチ化。

### 1.2 言語機能
- `immutable/constant`：ストレージ→コード定数化でSLOAD回避。
- `custom errors`：`revert("msg")` より安価。
- `unchecked`：オーバーフロー検査を省略（安全が自明な箇所のみ）。
- 構造体 **packing**：小さいビット幅をまとめるとslot数を削減。

### 1.3 設計選択
- **mapping vs array**：キーアクセスが主なら`mapping`。順序列挙が必要なら別インデックスを持つ。
- **オンチェーン/オフチェーン分割**：計算負荷はオフチェーン、結果のみ検証。
- **[メタトランザクション](../appendix/glossary.md)**（EIP-2771）や **[Permit](../appendix/glossary.md)**（EIP-2612）はトランザクション回数削減＝体感コスト低減。

---

## 2. 実装A：Naive vs Packed 構造体

### 2.1 概念（何を比べるか）
同じ「注文を保存する」処理でも、構造体の設計次第で **使うストレージslot数** が変わり、ガスに差が出る。

- Naive：`uint256` が多く、1件あたりのslot消費が大きい
- Packed：ビット幅の小さい型を寄せてslotを圧縮し、書き込みコスト（SSTORE）を減らす

### 2.2 最小コード（`contracts/GasPack.sol`）
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Naive: slot消費が大きい
contract GasNaive {
    struct Order { uint256 id; uint256 price; uint256 qty; address user; bool active; }
    mapping(uint256=>Order) public orders; uint256 public nextId;
    function add(uint256 price, uint256 qty) external {
        orders[++nextId] = Order({ id: nextId, price: price, qty: qty, user: msg.sender, active: true });
    }
}

// Packed: slotを圧縮（同一slot内に収める）
contract GasPacked {
    struct Order { uint128 price; uint96 qty; address user; bool active; uint32 id; }
    mapping(uint32=>Order) public orders; uint32 public nextId;
    function add(uint128 price, uint96 qty) external {
        unchecked { nextId++; }
        orders[nextId] = Order({ id: nextId, price: price, qty: qty, user: msg.sender, active: true });
    }
}
```

### 2.3 テスト（`test/gas-pack.ts`）
```ts
import { ethers } from "hardhat";
import { expect } from "chai";

describe("GasPack", ()=>{
  it("compare add() gas", async()=>{
    const N = await (await ethers.getContractFactory("GasNaive")).deploy(); await N.waitForDeployment();
    const P = await (await ethers.getContractFactory("GasPacked")).deploy(); await P.waitForDeployment();
    const tx1 = await N.add(1_000_000, 100); const r1 = await tx1.wait();
    const tx2 = await P.add(1_000_000, 100); const r2 = await tx2.wait();
    console.log("naive", r1.gasUsed.toString(), "packed", r2.gasUsed.toString());
    expect(r2.gasUsed).to.be.lt(r1.gasUsed);
  });
});
```

実行：
```bash
npx hardhat test test/gas-pack.ts
```

### 2.4 結果の見方（どの数字を見るか）
- `console.log("naive ... packed ...")` の `gasUsed` を比較し、`packed` のほうが小さければOK。
- 計測値は `metrics/gas_day13.md` の表に転記する（比較対象と一緒に残す）。

### 2.5 よくある失敗
- Packed側で型を小さくしすぎて値が入らない（例：`uint96` に大きすぎる数を入れる）。
- 「計測対象が同じ」になっていない（同じ回数、同じ入力で比較する）。

---

## 3. 実装B：calldata vs memory、custom errors

### 3.1 概念（何を比べるか）
- `calldata`：外部入力をコピーせず読み取れる（引数が大きいほど効きやすい）
- `memory`：引数の受領時にコピーが発生し、コストが上がりやすい
- `custom errors`：`revert("message")` より安く revert できる（失敗ケースのコスト削減）

### 3.2 最小コード（`contracts/GasArgs.sol`）
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
error TooLong();
contract GasArgs {
    uint256 public last;
    // calldata: コピー無しで読み取り
    function sumCalldata(uint256[] calldata a) public pure returns(uint256 r){
        uint256 n=a.length; if(n>10_000) revert TooLong();
        for(uint256 i; i<n;){ unchecked { r+=a[i]; i++; } }
    }
    // memory: 引数受領時にコピーが発生
    function sumMemory(uint256[] memory a) public pure returns(uint256 r){
        uint256 n=a.length;
        for(uint256 i; i<n;){ unchecked { r+=a[i]; i++; } }
    }

    // Tx化してgasReporterに載せる（Day6と同じ考え方）
    function sumCalldataTx(uint256[] calldata a) external { last = sumCalldata(a); }
    function sumMemoryTx(uint256[] memory a) external { last = sumMemory(a); }
}
```

### 3.3 テスト（`test/gas-args.ts`）
```ts
import { ethers } from "hardhat";

describe("GasArgs", ()=>{
  it("compare calldata vs memory", async()=>{
    const C = await (await ethers.getContractFactory("GasArgs")).deploy(); await C.waitForDeployment();
    const arr = Array.from({length:1000}, (_,i)=>BigInt(i+1));
    await (await C.sumCalldataTx(arr)).wait();
    await (await C.sumMemoryTx(arr)).wait();
  });
});
```

実行：
```bash
npx hardhat test test/gas-args.ts
```

### 3.4 結果の見方（どの数字を見るか）
- Day6 と同様に、Txとして実行する関数（`*Tx`）を用意しているため、gasReporter に載りやすい。
- `sumCalldataTx(1k)` と `sumMemoryTx(1k)` の差を `metrics/gas_day13.md` に転記する。

### 3.5 よくある失敗
- 配列が小さすぎて差が見えない（入力サイズを揃えて比較する）。
- `TooLong` が発生する（`a.length > 10_000`）。まずは 1,000 要素程度で試す。

---

## 4. 実装C：イベント最小化

`contracts/GasEvent.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract GasEvent {
    event Log1(address indexed a, uint256 v);
    event Log2(address indexed a, address indexed b, uint256 v);
    function e1(uint256 v) external { emit Log1(msg.sender, v); }
    function e2(address b, uint256 v) external { emit Log2(msg.sender, b, v); }
}
```

テスト：`test/gas-event.ts` に `e1` と `e2` のガス差を記録。

---

## 5. solc最適化設定
`hardhat.config.ts`
```ts
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: { enabled: true, runs: 200 }, // コードサイズと実行頻度で調整
    viaIR: false // Yul最適化を使う場合は true（挙動差に注意）
  }
}
```
> `runs` は「関数を平均何回呼ばれるか」の仮定。バッチ実行なら大きめ、単発なら小さめ。

---

## 6. Foundryでガススナップショット（任意）
`foundry.toml`
```toml
[profile.default]
optimizer = true
optimizer_runs = 200
```
実行：
```bash
forge snapshot  # gas-snapshot を生成
```
PRで差分をレビューできる。

---

## 7. 測定結果テンプレート
`metrics/gas_day13.md`
```
# Gas Benchmarks (Day13)

| Case | gasUsed |
|------|--------:|
| Naive.add |  
| Packed.add |  
| sumCalldataTx(1k) |  
| sumMemoryTx(1k) |  
| e1 |  
| e2 |  

- solc: 0.8.24, runs=200, viaIR=false
- network: hardhat
```

---

## 8. ガイドライン（最終チェック）
- [ ] ストレージ書込み回数を削る。不要な`id`重複保存を避ける。
- [ ] `immutable/constant` でSLOAD回避。
- [ ] 引数は `calldata`。返り値は必要最小限。
- [ ] `custom errors` を使い revert文字列を廃止。
- [ ] ループは境界チェックの上で `unchecked`、ただしオーバーフロー安全性を証明。
- [ ] イベントは監視キーのみ `indexed`。大量発火は二次コストも増える。

---

## 9. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| calldata と memory の差が見えない | 計測対象が SSTORE など別要因に支配されている | “どこを測っているか”を分解し、必要なら測定用の関数を分ける |
| gas が毎回ブレる | 実行経路/初期状態の差、または測定対象の揺れ | 同じ入力・同じネットワーク（hardhat）で比較し、複数回測る |
| 表が埋まらない | 計測→転記の手順が抜けている | `npx hardhat test test/gas-pack.ts` 等を実行し、`metrics/gas_day13.md` に転記する |

---

## 10. まとめ
- ガスの主要コスト要因（ストレージ、calldata、イベント、ループ）を前提として設計判断できる状態にした。
- 同一機能の実装差は「測って比較する」ことで初めて評価できることを確認した。
- 数値（`metrics/gas_day13.md`）と判断理由をセットで残すのが重要だ。

### 確認コマンド（最小）
```bash
npx hardhat test test/gas-pack.ts
npx hardhat test test/gas-args.ts
```

## 11. 提出物
- [ ] `metrics/gas_day13.md`（表を埋める）
- [ ] `hardhat test` 出力ログ（差分をコメント）
- [ ] 最適化の設計判断を3行で要約

## 12. 実行例
- 実行ログ例：[`reports/Day13.md`](../reports/Day13.md)
