# Day5：ERC標準（ERC‑20 / ERC‑721）とOpenZeppelin実装

## 学習目的
- ERC‑20/721 の最小実装を安全に組み立てる。
- `approve/allowance/transferFrom` のフローを実取引で確認。
- NFTの`tokenURI`とメタデータの基礎を理解。

---

## 1. 理論解説（教科書）

### 1.1 ERC‑20 要点
- 同質トークン。必須関数：`totalSupply, balanceOf, transfer, allowance, approve, transferFrom`。
- イベント：`Transfer`, `Approval`。
- 代表フロー：所有者A→Bへ直接`transfer`。委任送金はAがCへ`approve`→Cが`transferFrom(A→B)`。

### 1.2 ERC‑721 要点
- 非同質トークン（NFT）。必須：`ownerOf, balanceOf, transferFrom, approve, getApproved, setApprovalForAll, safeTransferFrom`。
- メタデータ拡張：`tokenURI(tokenId)` がJSON（`name, description, image, attributes[]`）を返すURI。

### 1.3 OpenZeppelin利用の意義
- 標準準拠と既知の安全対策を内包。再実装より安全・速い。

---

## 2. ハンズオン（ERC‑20）

### 2.1 依存導入
```bash
npm i @openzeppelin/contracts
```

### 2.2 実装：固定Supplyのミント
`contracts/MyToken.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("MyToken","MTK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
}
```

### 2.3 デプロイ
`scripts/deploy-token.ts`
```ts
import { ethers } from "hardhat";
async function main(){
  const F = await ethers.getContractFactory("MyToken");
  const c = await F.deploy(ethers.utils.parseEther("1000000"));
  await c.deployed();
  console.log("MTK:", c.address);
}
main().catch(e=>{console.error(e);process.exit(1)});
```
```bash
npx hardhat run scripts/deploy-token.ts --network sepolia
```

### 2.4 基本操作（直接送金）
`scripts/token-transfer.ts`
```ts
import { ethers } from "hardhat";
const ADDR = process.env.TOKEN!;
async function main(){
  const [owner, bob] = await ethers.getSigners();
  const abi=["function balanceOf(address) view returns(uint)","function transfer(address,uint) returns(bool)"];
  const c = new ethers.Contract(ADDR, abi, owner);
  console.log("owner before:",(await c.balanceOf(owner.address)).toString());
  await (await c.transfer(bob.address, ethers.utils.parseEther("10"))).wait();
  console.log("bob after:",(await c.balanceOf(bob.address)).toString());
}
main().catch(console.error);
```
```bash
TOKEN=0x... npx hardhat run scripts/token-transfer.ts --network sepolia
```

### 2.5 委任送金フロー（approve→transferFrom）
`scripts/token-approve.ts`
```ts
import { ethers } from "hardhat";
const ADDR = process.env.TOKEN!;
async function main(){
  const [owner, spender, to] = await ethers.getSigners();
  const abi=[
    "function approve(address,uint) returns(bool)",
    "function allowance(address,address) view returns(uint)",
    "function transferFrom(address,address,uint) returns(bool)",
    "event Approval(address indexed,address indexed,uint)"
  ];
  const cOwner = new ethers.Contract(ADDR, abi, owner);
  const cSpender = new ethers.Contract(ADDR, abi, spender);

  // 1) 承認
  await (await cOwner.approve(spender.address, ethers.utils.parseEther("1"))).wait();
  const allow = await cOwner.allowance(owner.address, spender.address);
  console.log("allowance:", allow.toString());

  // 2) 委任送金（spenderが実行）
  await (await cSpender.transferFrom(owner.address, to.address, ethers.utils.parseEther("0.5"))).wait();
}
main().catch(console.error);
```
```bash
TOKEN=0x... npx hardhat run scripts/token-approve.ts --network sepolia
```

### 2.6 テスト（最小）
`test/erc20.ts`
```ts
import { expect } from "chai"; import { ethers } from "hardhat";
describe("MyToken",()=>{
  it("approve/transferFrom flow", async()=>{
    const [owner, sp, to] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MyToken");
    const c = await F.deploy(ethers.utils.parseEther("100")); await c.deployed();
    await (await c.approve(sp.address, ethers.utils.parseEther("1"))).wait();
    expect(await c.allowance(owner.address, sp.address)).to.eq(ethers.utils.parseEther("1"));
    await (await c.connect(sp).transferFrom(owner.address, to.address, ethers.utils.parseEther("0.5"))).wait();
  });
});
```
```bash
npx hardhat test test/erc20.ts
```

---

## 3. ハンズオン（ERC‑721）

### 3.1 実装：シンプルNFT + baseURI
`contracts/MyNFT.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    string private _base;
    constructor(string memory base) ERC721("MyNFT","MNFT") Ownable(msg.sender) { _base = base; }
    function _baseURI() internal view override returns (string memory){ return _base; }
    function setBase(string calldata b) external onlyOwner { _base = b; }
    function mint(address to, uint256 id) external onlyOwner { _safeMint(to,id); }
}
```

### 3.2 メタデータ（雛形）
`ipfs://<CID>/1.json`
```json
{ "name": "Sample #1", "description": "Demo NFT", "image": "ipfs://<CID>/1.png", "attributes": [{"trait_type":"tier","value":"basic"}] }
```

### 3.3 デプロイと表示
`scripts/deploy-nft.ts`
```ts
import { ethers } from "hardhat";
async function main(){
  const F = await ethers.getContractFactory("MyNFT");
  const c = await F.deploy("ipfs://<CID>/");
  await c.deployed();
  console.log("MyNFT:", c.address);
}
main().catch(console.error);
```
```bash
npx hardhat run scripts/deploy-nft.ts --network sepolia
```
ミント：
```ts
// scripts/mint-nft.ts
import { ethers } from "hardhat";
const ADDR = process.env.NFT!;
async function main(){
  const [owner, alice] = await ethers.getSigners();
  const abi=["function mint(address,uint256)","function tokenURI(uint256) view returns(string)"];
  const c = new ethers.Contract(ADDR, abi, owner);
  await (await c.mint(alice.address, 1)).wait();
  console.log("tokenURI:", await c.tokenURI(1));
}
main().catch(console.error);
```
```bash
NFT=0x... npx hardhat run scripts/mint-nft.ts --network sepolia
```
OpenSea（テストネット）でコレクションを確認。

---

## 4. Verify（任意）
```bash
npm i -D @nomicfoundation/hardhat-verify
npx hardhat verify --network sepolia <TOKEN_ADDRESS> 1000000000000000000000000
npx hardhat verify --network sepolia <NFT_ADDRESS> "ipfs://<CID>/"
```

---

## 5. 追加課題
- ERC‑20：EIP‑2612 Permit（署名承認）対応版を別ブランチに実装。
- ERC‑721：`setApprovalForAll` と `safeTransferFrom` のUI操作をdapp側に追加。
- ガス測定：`transfer` vs `transferFrom`、`mint`の費用を表化。

---

## 6. 提出物
- トークン・NFTのコントラクトアドレス、Verifyリンク。
- `approve→transferFrom`の実行ログと`allowance`の値。
- OpenSea（テストネット）の表示キャプチャ。

