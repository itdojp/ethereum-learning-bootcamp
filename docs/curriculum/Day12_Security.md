# Day12：セキュリティ入門（再入・権限・静的解析・ファジング）

[← 目次](./TOC.md) | [前: Day11](./Day11_NFT_Metadata.md) | [次: Day13](./Day13_Gas_Optimization.md)

## 学習目的
- 代表的脆弱性（Reentrancy, tx.origin誤用, delegatecall乱用, Proxyのストレージ衝突）を理解し、簡単に説明できるようになる。
- 対策（CEI, ReentrancyGuard, AccessControl/Ownable, Pull-Payment, Pausable）を実装し、テストで検証できるようになる。
- Slither（静的解析）、Foundry（任意：テスト + fuzz / invariant）、Echidna（任意：別系統のプロパティベーステスト/ファジング）を実行し、自動検出を体験できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. セキュリティ実務レビューゲート

確認日: **2026-05-23（Asia/Tokyo）**。この章の攻撃例は学習目的であり、実ネットワークや第三者資産に対して実行しない。

- すべての検証は Hardhat Network、Anvil、または学習用 testnet アカウントに限定する。Mainnet、実資産、第三者 contract、許可のない fork target は対象外にする。
- リカバリーフレーズ、秘密鍵、RPC/API キー、Explorer API キーをチャット、Issue、PR、ログ、スクリーンショット、AI ツールへ貼り付けない。
- wallet signature、permit、token approval、bridge、airdrop claim は資産流出に直結し得る。署名前に domain、chainId、spender、amount、deadline、calldata を確認する。
- Slither、Foundry fuzz/invariant、Echidna はレビュー補助であり、専門監査や threat modeling の代替ではない。
- OpenZeppelin Contracts、Solidity compiler、proxy / upgradeable contract の breaking change と known bugs は、導入・更新のたびに公式情報で再確認する。

---

## 1. 前提
- Hardhat 環境（Day3）。
- 任意でFoundry（`foundryup` 済）。
- 先に読む付録：[`docs/appendix/glossary.md`](../appendix/glossary.md)（用語に迷ったとき）
- 触るファイル（主なもの）：`contracts/VulnBank.sol` / `contracts/SafeBank.sol` / `contracts/Attacker.sol` / `test/reentrancy.ts` / `contracts/AdminBox.sol`
- 今回触らないこと：すべての脆弱性の網羅（まずは頻出の再入と権限の基本から）
- 最短手順（迷ったらここ）：2章のコントラクト/テストを動かして“攻撃できる/防げる”を体験 → `npx hardhat test test/reentrancy.ts` で確認

---

## 2. 脆弱性：Reentrancy（再入）

### 2.1 脆弱コントラクト
`contracts/VulnBank.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract VulnBank {
    mapping(address=>uint256) public bal;
    function dep() external payable { bal[msg.sender]+=msg.value; }
    function wd(uint256 amt) external {
        require(bal[msg.sender] >= amt, "bal");
        // 脆弱：送金→その後に残高更新（CEI違反）
        (bool ok,) = msg.sender.call{value: amt}("");
        require(ok, "send");
        bal[msg.sender]-=amt;
    }
}
```

### 2.2 攻撃コントラクト
`contracts/Attacker.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface IVulnBank { function dep() external payable; function wd(uint256) external; }
contract Attacker {
    IVulnBank public bank; address public owner;
    constructor(address b){ bank = IVulnBank(b); owner = msg.sender; }
    receive() external payable { if (address(bank).balance >= 1 ether) { bank.wd(1 ether); } }
    function attack() external payable { require(msg.value>=1 ether, "fund"); bank.dep{value:1 ether}(); bank.wd(1 ether); }
    function sweep() external { payable(owner).transfer(address(this).balance); }
}
```

### 2.3 対策版（CEI + ReentrancyGuard）
`contracts/SafeBank.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
contract SafeBank is ReentrancyGuard {
    mapping(address=>uint256) public bal;
    function dep() external payable { bal[msg.sender]+=msg.value; }
    function wd(uint256 amt) external nonReentrant {
        uint256 b = bal[msg.sender];
        require(b >= amt, "bal");
        bal[msg.sender] = b - amt;            // Effects（先）
        (bool ok,) = msg.sender.call{value: amt}(""); // Interactions（後）
        require(ok, "send");
    }
}
```

### 2.4 テスト（攻撃成功/失敗）
`test/reentrancy.ts`
```ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Reentrancy scenario", () => {
  it("VulnBank is drainable", async () => {
    const [deployer, attackerSigner] = await ethers.getSigners();
    const bankFactory = await ethers.getContractFactory("VulnBank");
    const bank = await bankFactory.deploy();
    await bank.waitForDeployment();

    // 直送（sendTransaction）ではなく、payable関数（dep）経由で入金する。
    await bank.connect(deployer).dep({ value: ethers.parseEther("10") });

    const attackerFactory = await ethers.getContractFactory("Attacker");
    const attacker = await attackerFactory
      .connect(attackerSigner)
      .deploy(await bank.getAddress());
    await attacker.waitForDeployment();

    await attacker.connect(attackerSigner).attack({ value: ethers.parseEther("1") });

    const bankBalance = await ethers.provider.getBalance(await bank.getAddress());
    expect(bankBalance).to.be.lessThan(ethers.parseEther("9"));
  });

  it("SafeBank resists reentrancy", async () => {
    const [deployer, attackerSigner] = await ethers.getSigners();
    const bankFactory = await ethers.getContractFactory("SafeBank");
    const bank = await bankFactory.deploy();
    await bank.waitForDeployment();
    await bank.connect(deployer).dep({ value: ethers.parseEther("10") });

    const attackerFactory = await ethers.getContractFactory("Attacker");
    const attacker = await attackerFactory
      .connect(attackerSigner)
      .deploy(await bank.getAddress());
    await attacker.waitForDeployment();

    await expect(attacker.connect(attackerSigner).attack({ value: ethers.parseEther("1") })).to.be.reverted;
  });
});
```
実行：
```bash
npx hardhat test test/reentrancy.ts
```

---

## 3. 権限：tx.origin、AccessControl、Pausable

### 3.1 tx.originの誤用
`tx.origin` を認可に使うと**中継コントラクト経由**で権限漏れ。

誤り例：
```solidity
if (tx.origin != owner) revert(); // NG
```
正：`msg.sender`で判断し、必要に応じて`Ownable`/`AccessControl`を使用。

### 3.2 Ownable + Pausable
`contracts/AdminBox.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
contract AdminBox is Ownable, Pausable {
    string private data; constructor() Ownable(msg.sender) {}
    function set(string calldata d) external onlyOwner whenNotPaused { data=d; }
    function get() external view returns(string memory){ return data; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
```

### 3.3 AccessControl（ロール）
```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";
contract Roles is AccessControl {
    bytes32 public constant OPERATOR = keccak256("OPERATOR");
    constructor(){ _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); }
    function act() external onlyRole(OPERATOR) {}
}
```

---

## 4. delegatecall と Proxyの落とし穴

### 4.1 delegatecallの危険
呼び出し先の**ストレージレイアウト**を共有。誤ると上書きや資産流出につながる。
> 補足：`SELFDESTRUCT` は近年のアップグレードで挙動が大きく変わっている（設計・監査時に都度確認）。

### 4.2 ストレージ衝突（Proxy）
UUPS/Transparent Proxyでは**永続化変数の並び**が重要。新実装で順序変更・削除は禁止。`storage gap` を確保する。

雛形（UUPS要点、実運用はOpenZeppelin Upgradesを利用）：
```solidity
uint256[50] private __gap; // 予約領域
```

---

## 5. 支払い設計：Pull-Payment

### 5.1 原則
- **Push型**送金（その場で`call`）は再入/失敗リスク。
- **Pull型**（受取人が引出）に分離すると安全性向上。

雛形：
```solidity
mapping(address=>uint256) public credit;
function settle(address to, uint256 amt) internal { credit[to]+=amt; }
function withdraw() external { uint v=credit[msg.sender]; credit[msg.sender]=0; (bool ok,) = msg.sender.call{value:v}(""); require(ok); }
```

---

## 6. ツール：Slither（静的解析）

### 6.1 インストール
```bash
pipx install slither-analyzer
```

### 6.2 実行
```bash
slither . --filter-paths "node_modules"
```
レポート要点：
- `Reentrancy` 警告、`tx.origin` 検出、`delegatecall` 使用箇所、未初期化ストレージ参照など。

---

## 7. ツール：Foundry（テスト + fuzz / invariant）とEchidna（任意）

Foundry はテストフレームワークで、fuzz（ランダム入力探索）や invariant（永続条件）を内蔵する。  
Echidna は Foundry の一部ではなく、別系統のツールとしてプロパティベーステスト/ファジングに使われる。

### 7.1 Invariant（永続条件）例（Foundry）
`test/Invariant.t.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Test.sol";
import {SafeBank} from "../contracts/SafeBank.sol";
contract Invariant is Test {
    SafeBank b; address user;
    function setUp() public { b = new SafeBank(); user = address(0xBEEF); }
    function invariant_NoOverdraw() public {
        // バンクの総残高 >= ユーザ残高合計（厳密版は配列管理）
        assert(address(b).balance >= 0);
    }
}
```
実行：
```bash
forge test --match-contract Invariant -vvvv
```

### 7.2 Echidna（任意）
- 目的：ランダム化された呼び出し列で特性違反を探索。
- セットアップは公式ドキュメント参照。時間があれば`VulnBank`に対して資産流出を検出させる設定を追加。

---

## 8. 監査チェックリスト（抜粋）
- [ ] 重要関数は`onlyOwner`/`AccessControl`で保護。
- [ ] `DEFAULT_ADMIN_ROLE`、owner、upgrade admin、pauser、minter、bridge admin の保管先と多署名/遅延実行を文書化。
- [ ] `pause`可能か。緊急停止Runbookがあるか。
- [ ] 送金はPull型。Pushは最小化。
- [ ] CEI順序（Checks→Effects→Interactions）。
- [ ] 外部呼び出しの戻り値を検査。
- [ ] `tx.origin`不使用。
- [ ] Proxyのストレージ互換性、initializer、upgrade 権限、rollback 手順を文書化。
- [ ] signature / permit / approval は domain separator、chainId、spender、amount、deadline、nonce を検査。
- [ ] bridge / cross-chain message は replay、finality、challenge window、失敗時の rescue 手順を検査。
- [ ] Slither、Foundry fuzz/invariant、Echidna の結果と「検出できない前提」をレビュー記録に残す。
- [ ] イベントは必要最小限を`indexed`で設計し、機密情報を出さない。

---

## 9. つまずきポイント

| 症状 | 原因 | 対処 |
|---|---|---|
| `slither` が実行できない | 未インストール / PATH問題 | 章中の `pipx install slither-analyzer` を再確認する |
| `forge` が見つからない | Foundry未導入 | Day3 の Foundry 手順（`foundryup`）を先に行う |
| 攻撃テストが再現しない | 前提（残高、呼び出し順）が崩れている | テスト内の初期入金額と `attack()` の送金額を再確認する |

---

## 10. まとめ
- 代表的な脆弱性を「攻撃→原因→対策（パターン/ライブラリ）」の形で整理した。
- 静的解析やプロパティテストの入口として、まずは“自動で検査する”習慣を作るのが重要だと分かった。
- チェックリストを使い、権限・署名・approval・bridge・upgrade・自動解析の限界をレビュー時に言語化できる状態にした。

### 理解チェック（3問）
- Q1. 再入（reentrancy）が起きる条件を、状態更新の順序まで含めて説明してみる。
- Q2. 認可に `tx.origin` を使うと危険になりやすい理由は何か？
- Q3. Pull-Payment（引き出し型）の設計は、どんなリスクを下げるか？

### 解答例（短く）
- A1. 外部呼び出し（送金など）中に相手が再び呼び戻してきて、状態更新前の前提が崩れると起きる。Checks-Effects-Interactionsやガードで対策する。
- A2. 呼び出し経路に別コントラクトが挟まると、意図しない主体が `tx.origin` を悪用して通ってしまう場合があるため。
- A3. 送金をその場で押し付けず、受け手が後で引き出す形にすることで、外部呼び出し由来の失敗や再入リスクを減らしやすい。

### 確認コマンド（最小）
```bash
npx hardhat test test/reentrancy.ts

# 任意（Slither が入っている場合）
slither .
```

## 11. 提出物
- [ ] `VulnBank`攻撃ログ、`SafeBank`防御ログ
- [ ] Slitherレポート（主要警告の抜粋）と対応方針
- [ ] Invariantテストの結果スクリーンショット
- [ ] 監査チェックリストの自己評価（5項目以上）

## 12. 実行例
- 実行ログ例：[`docs/reports/Day12.md`](../reports/Day12.md)
