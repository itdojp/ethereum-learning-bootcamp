# Day4：Solidity基礎（型・可視性・イベント・エラー・支払い）

[← 目次](./TOC.md) | [前: Day3](./Day03_Env_Setup.md) | [次: Day5](./Day05_ERC_Standards.md)

## 学習目的
- 主要構文（型・可視性・関数修飾子）とエラーハンドリングを理解。
- 送金を伴う`payable`処理とイベントログを実装・検証。

> まず `curriculum/README.md` の「共通の前提」を確認してから進める。

---

## 0. 前提
- Day3 までの環境構築が完了している（`npm ci` / `.env`）
- Sepolia にデプロイする場合は、`SEPOLIA_RPC_URL` と `PRIVATE_KEY` を設定し、少額のテストETHを入れておく

---

## 1. 理論解説（教科書）

### 1.1 代表的な型
- 値型：`uint256 / int256 / bool / address / bytesN`
- 参照型：`string / bytes / array / mapping / struct`
- `storage`（永続）と`memory`（一時）と`calldata`（読み取り専用、外部入力）

### 1.2 可視性と関数属性
- 可視性：`public / external / internal / private`
- 関数属性：`view / pure / payable`
- エラー：`require(condition, message)`, `revert CustomError(args)`, `assert()`
- イベント：`event Name(type indexed a, type b)` → ログで検索容易

### 1.3 受領関数
- `receive()`：ETH受領専用。`payable`必須。データ無しの送金時に呼ばれる。
- `fallback()`：未定義関数呼び出し時などに実行。

### 1.4 アクセス制御（最小）
- オーナーのみ許可：`onlyOwner`（自作 or OpenZeppelin `Ownable`）
- Checks–Effects–Interactions（CEI）原則を守る。

---

## 2. ハンズオン（即実行）

### 2.1 コントラクト実装
`contracts/WalletBox.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error NotOwner();
error EmptyMessage();

contract WalletBox {
    // ---- 状態 ----
    address public immutable owner;           // デプロイ時に固定
    string  private _note;                    // メモ

    event NoteChanged(address indexed caller, string note);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(string memory initNote) {
        owner = msg.sender;
        _note = initNote;
    }

    // ---- 読み取り ----
    function note() external view returns (string memory) { return _note; }
    function balance() public view returns (uint256) { return address(this).balance; }

    // ---- 変更 ----
    function setNote(string calldata newNote) external {
        if (bytes(newNote).length == 0) revert EmptyMessage();
        _note = newNote;
        emit NoteChanged(msg.sender, newNote);
    }

    // ---- ETH受領 ----
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    // ---- 引出（オーナーのみ） ----
    function withdraw(address payable to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        require(amount <= address(this).balance, "insufficient");
        // CEI: 先に状態更新は不要。残高は参照のみ。
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "send failed");
        emit Withdrawn(to, amount);
    }
}
```

### 2.2 テスト（Hardhat / TypeScript）
`test/walletbox.ts`
```ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("WalletBox", () => {
  it("deploys with owner and note", async () => {
    const [owner] = await ethers.getSigners();
    const F = await ethers.getContractFactory("WalletBox");
    const c = await F.deploy("init");
    await c.waitForDeployment();
    expect(await c.note()).to.eq("init");
    expect(await c.owner()).to.eq(owner.address);
  });

  it("reverts on empty note and emits on change", async ()=>{
    const [owner, alice] = await ethers.getSigners();
    const c = await (await ethers.getContractFactory("WalletBox")).deploy("n");
    await c.waitForDeployment();
    await expect(c.setNote("")).to.be.revertedWithCustomError(c, "EmptyMessage");
    await expect(c.connect(alice).setNote("ok")).to.emit(c, "NoteChanged");
  });

  it("accepts ether via receive and allows owner withdraw", async ()=>{
    const [owner, alice] = await ethers.getSigners();
    const c = await (await ethers.getContractFactory("WalletBox")).deploy("n");
    await c.waitForDeployment();

    // deposit 0.1 ETH
    const addr = await c.getAddress();
    await owner.sendTransaction({ to: addr, value: ethers.parseEther("0.1") });
    expect(await c.balance()).to.eq(ethers.parseEther("0.1"));

    // non-owner cannot withdraw
    await expect(c.connect(alice).withdraw(alice.address, 1)).to.be.revertedWithCustomError(c, "NotOwner");

    // owner withdraws
    await expect(c.withdraw(owner.address, ethers.parseEther("0.05"))).to.emit(c, "Withdrawn");
  });
});
```
実行：
```bash
npx hardhat test
```

### 2.3 デプロイ（Sepolia）
`scripts/deploy-walletbox.ts`
```ts
import { ethers } from "hardhat";
async function main(){
  const F = await ethers.getContractFactory("WalletBox");
  const c = await F.deploy("hello");
  await c.waitForDeployment();
  console.log("WalletBox:", await c.getAddress());
}
main().catch(e=>{console.error(e);process.exit(1)});
```
```bash
npx hardhat run scripts/deploy-walletbox.ts --network sepolia
```

### 2.4 送金とイベント確認
```bash
# 0.01 ETH送金（任意）
# - ウォレット（MetaMask 等）で、`<DEPLOYED_ADDR>` 宛に 0.01 ETH を送る
# - CLIで送る場合は、次のように Hardhat 経由で Tx を送る
TO=<DEPLOYED_ADDR> VALUE_ETH=0.01 npx hardhat run scripts/measure-fee.ts --network sepolia
```
Etherscan（Sepolia）で `Deposited`/`Withdrawn` イベントを確認する。

---

## 3. 追加課題
- `fallback()`を実装し未定義データ到着時の挙動をログ化。
- OpenZeppelin `Ownable`版を別ブランチで作成し、`onlyOwner`と`NotOwner`の使い分けを比較。
- `custom errors` と `require(message)` のgas差を`hardhat-gas-reporter`で計測。

---

## 4. 提出物
- テスト出力スクリーンショット（`3 passed` など）。
- デプロイアドレス、Txハッシュ、イベントのキャプチャ。
- `custom errors` vs `require` の計測結果（簡潔な表）。

## 5. 実行例
- 実行ログ例：[`reports/Day04.md`](../reports/Day04.md)
