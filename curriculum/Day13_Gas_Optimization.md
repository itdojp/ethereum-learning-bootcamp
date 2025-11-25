# Day13：ガス最適化（設計原則・実測・比較）

## 学習目的
- ガスコストの主要要因（ストレージ、calldata、イベント、ループ）を理解。
- 設計で削減できるポイント（packing、immutable/constant、custom errors、関数属性）を実践。
- Hardhat/Foundryで**同一機能の実装差**を測定し、表にまとめる。

---

## 0. 前提
- Day6で `hardhat-gas-reporter` を導入済み。
- 任意でFoundryの `gas-snapshot` を併用可。

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
- **メタトランザクション**（EIP-2771）や **Permit**（EIP-2612）はトランザクション回数削減＝体感コスト低減。

---

## 2. 実装A：Naive vs Packed 構造体

`contracts/GasPack.sol`
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

テスト：`test/gas-pack.ts`
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

---

## 3. 実装B：calldata vs memory、custom errors

`contracts/GasArgs.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
error TooLong();
contract GasArgs {
    // calldata: コピー無しで読み取り
    function sumCalldata(uint256[] calldata a) external pure returns(uint256 r){
        uint256 n=a.length; if(n>10_000) revert TooLong();
        for(uint256 i; i<n;){ unchecked { r+=a[i]; i++; } }
    }
    // memory: 引数受領時にコピーが発生
    function sumMemory(uint256[] memory a) external pure returns(uint256 r){
        for(uint256 i; i<a.length;){ unchecked { r+=a[i]; i++; } }
    }
}
```

テスト：`test/gas-args.ts`
```ts
import { ethers } from "hardhat";

describe("GasArgs", ()=>{
  it("compare calldata vs memory", async()=>{
    const C = await (await ethers.getContractFactory("GasArgs")).deploy(); await C.waitForDeployment();
    const arr = Array.from({length:1000}, (_,i)=>BigInt(i+1));
    // view/pure 関数を call で呼び出した場合は実行時ガスは課金されない。
    // hardhat-gas-reporter に表示させるため、あえて sum*Tx 系関数で Tx に変換する方法もある。
    await (await C.sumCalldata(arr)).wait?.().catch(()=>{});
    await (await C.sumMemory(arr)).wait?.().catch(()=>{});
  });
});
```

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
evmodin = false
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
| sumCalldata(1k) |  
| sumMemory(1k) |  
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

## 9. 提出物
- `metrics/gas_day13.md`（表を埋める）。
- `hardhat test` 出力ログ（差分をコメント）。
- 最適化の設計判断を3行で要約。
