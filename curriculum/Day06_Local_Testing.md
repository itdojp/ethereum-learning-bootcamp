# Day6：ローカル検証・カバレッジ・ガス計測（Hardhat中心）

## 学習目的
- ローカルノード（Hardhat Network）で素早く再現可能なテストを書く。
- `solidity-coverage` と `hardhat-gas-reporter` を導入し、品質とコストを数値で把握する。
- `storage`/`memory`/`calldata` とイベント量の違いを実測する。

---

## 1. 事前準備
プロジェクト直下で以下を実行。
```bash
npm i -D solidity-coverage hardhat-gas-reporter
```
`hardhat.config.ts` を編集：
```ts
import "solidity-coverage";
import "hardhat-gas-reporter";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  gasReporter: {
    enabled: true,
    currency: "USD",           // 単位（任意）
    excludeContracts: [],       // 除外する場合に指定
    src: "./contracts",        // 対象ディレクトリ
    showTimeSpent: true,
  },
  mocha: { timeout: 60_000 },   // テストが重い場合
};
export default config;
```

---

## 2. 計測用コントラクト
`contracts/GasBench.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GasBench {
    uint256 public s;

    // storage 書込み（高コスト）
    function setS(uint256 x) external { s = x; }

    // memory 配列：コピーが発生
    function sumMemory(uint256[] memory a) public pure returns(uint256 r){
        for (uint i=0; i<a.length; i++) r += a[i];
    }

    // calldata 配列：読み取り専用で安価
    function sumCalldata(uint256[] calldata a) public pure returns(uint256 r){
        for (uint i=0; i<a.length; i++) r += a[i];
    }

    // Tx化してgasReporterに載せるベンチ関数
    function benchSumCalldata(uint256[] calldata a) external { uint256 r = sumCalldata(a); s = r; }
    function benchSumMemory(uint256[] memory a) external { uint256 r = sumMemory(a); s = r; }

    // イベント多発のコスト比較
    event Ping(uint256 indexed i, uint256 v);
    function emitMany(uint256 n) external {
        for (uint i=0; i<n; i++) emit Ping(i, i);
    }
}
```

---

## 3. テストコード（カバレッジ＆ガス差の可視化）
`test/gasbench.ts`
```ts
import { expect } from "chai";
import { ethers } from "hardhat";

function arr(n:number){ return Array.from({length:n},(_,i)=>i+1); }

describe("GasBench", () => {
  it("storage write vs read-only ops", async () => {
    const F = await ethers.getContractFactory("GasBench");
    const c = await F.deploy();
    await c.waitForDeployment();
    const tx = await c.setS(123);
    await tx.wait();
    expect(await c.s()).to.eq(123);
  });

  it("memory vs calldata", async () => {
    const F = await ethers.getContractFactory("GasBench");
    const c = await F.deploy();
    await c.waitForDeployment();
    const a = arr(200);

    await (await c.benchSumMemory(a)).wait();
    await (await c.benchSumCalldata(a)).wait();
  });

  it("event emission cost", async ()=>{
    const F = await ethers.getContractFactory("GasBench");
    const c = await F.deploy();
    await c.waitForDeployment();
    await (await c.emitMany(5)).wait();
  });
});
```
> 注：`pure/view`は本来call扱いのためgasReporterに出ない。`bench*`関数のようにストレージ書込みを伴うTxへ変換するか、Foundryの`gas-snapshot`等を併用する。

---

## 4. 実行コマンド
```bash
# 単体テスト（ローカル）
npx hardhat test

# カバレッジ
npx hardhat coverage --temp artifacts-coverage --network hardhat

# 参考：出力例（概念）
# GasBench: setS  ~42,000 gas
# GasBench: emitMany(5)  ~50,000+ gas（イベント数に比例）
```

---

## 5. カバレッジ閾値（任意）
Mochaの前に NYC 等のJSカバレッジではなく、Solidity行網羅率を採用。閾値の目安：
- ライブラリ・ユーティリティ：80%以上
- コア資産（資金移動や権限制御）：95%以上

`package.json`（任意）にスクリプト追加：
```json
{
  "scripts": {
    "test": "hardhat test",
    "coverage": "hardhat coverage"
  }
}
```

---

## 6. ガイドライン（設計とレビュー）
- **見える化**：PRで gas レポート差分を貼る（前回比↑↓）。
- **ストレージ抑制**：集計は極力オフチェーンへ。必要ならバッチ化。
- **イベント最小化**：監視に必要な key のみ `indexed`。大量イベントは二次費用も増える。
- **`calldata`優先**：外部入力は書換不要なので`calldata`で受ける。

---

## 7. CIへの組み込み（雛形）
`.github/workflows/test.yml`
```yaml
name: test
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx hardhat test
      - run: npx hardhat coverage
```

---

## 8. 追加課題
- `unchecked` ブロックを使った加算ループのgas比較と、安全性の注記。
- `struct` の packing（`uint128,uint128`等）で storage slot 削減を実証。
- `emitMany(n)` の n を 1→50 に振ってグラフ化（gas vs n）。

---

## 9. 提出物
- `npx hardhat test` と `coverage` の出力（スクリーンショット可）。
- memory vs calldata、イベント数の差分を表に整理。
- ガス最適化の所感を3行で記述。
