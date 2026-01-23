# Day5：ERC標準（ERC‑20 / ERC‑721）とOpenZeppelin実装

[← 目次](./TOC.md) | [前: Day4](./Day04_Solidity_Basics.md) | [次: Day6](./Day06_Local_Testing.md)

## 学習目的
- ERC‑20/721 の最小実装を、OpenZeppelinを用いて安全に組み立てられるようになる。
- `approve/allowance/transferFrom` のフローを、実際の取引で確認できるようになる。
- NFTの `tokenURI` とメタデータの基礎を理解し、簡単に説明できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提」を確認してから進める。

---

## 0. 前提
- Day3 までの環境構築が完了している（`npm ci` / `.env`）
- Sepolia にデプロイする場合は、`SEPOLIA_RPC_URL` と `PRIVATE_KEY` を設定し、少額のテストETHを入れておく
- Verify（任意）をやる場合は `ETHERSCAN_API_KEY` も必要
- 先に読む付録：[`docs/appendix/glossary.md`](../appendix/glossary.md) / [`docs/appendix/verify.md`](../appendix/verify.md)（任意）
- 触るファイル（主なもの）：
  - ERC‑20：`contracts/MyToken.sol` / `scripts/deploy-token.ts` / `test/erc20.ts`
  - ERC‑721：`contracts/MyNFT.sol` / `scripts/deploy-nft.ts` / `scripts/mint-nft.ts` / `test/mynft.ts`
  - （任意）`scripts/token-transfer.ts` / `scripts/token-approve.ts`
- 今回触らないこと：すべてのERC派生規格の網羅（まずはERC‑20/721の最小フローに集中）
- 最短手順（迷ったらここ）：ERC‑20（2章）→ ERC‑721（3章）→ `npm test` で動作確認（Verifyは4章で任意）
- ミニプロジェクト（通しで作るもの）：この章の `MyToken` は Day9/Day14 の DApp 接続で使う（全体像：[`docs/curriculum/Project.md`](./Project.md)）

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
このリポジトリでは `@openzeppelin/contracts` は導入済み（ルートで `npm ci` 済みならスキップ可）。ゼロから作る場合は次を実行する。
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
  const c = await F.deploy(ethers.parseEther("1000000"));
  await c.waitForDeployment();
  console.log("MTK:", await c.getAddress());
}
main().catch(e=>{console.error(e);process.exit(1)});
```
```bash
npx hardhat run scripts/deploy-token.ts --network sepolia
```

### 2.4 基本操作（直接送金）
このリポジトリの `scripts/token-transfer.ts` を使う。
```bash
TOKEN=0x... TO=0x... npx hardhat run scripts/token-transfer.ts --network sepolia
```
> `TO` を省略した場合、ローカルでは2番目の署名者、そうでなければ自分宛になる。

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
  await (await cOwner.approve(spender.address, ethers.parseEther("1"))).wait();
  const allow = await cOwner.allowance(owner.address, spender.address);
  console.log("allowance:", allow.toString());

  // 2) 委任送金（spenderが実行）
  await (await cSpender.transferFrom(owner.address, to.address, ethers.parseEther("0.5"))).wait();
}
main().catch(console.error);
```
> このスクリプトは複数署名者が必要（owner/spender/to）。最短は 2.6 のテストで確認する。

### 2.6 テスト（最小）
`test/erc20.ts`
```ts
import { expect } from "chai"; import { ethers } from "hardhat";
describe("MyToken",()=>{
  it("approve/transferFrom flow", async()=>{
    const [owner, sp, to] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MyToken");
    const c = await F.deploy(ethers.parseEther("100")); await c.waitForDeployment();
    await (await c.approve(sp.address, ethers.parseEther("1"))).wait();
    expect(await c.allowance(owner.address, sp.address)).to.eq(ethers.parseEther("1"));
    await (await c.connect(sp).transferFrom(owner.address, to.address, ethers.parseEther("0.5"))).wait();
  });
});
```
```bash
npx hardhat test test/erc20.ts
```

---

## 3. ハンズオン（ERC‑721）

### 3.1 実装：NFT（ERC‑721）と`tokenURI`
このリポジトリでは、後半（Day11）でも使うため `contracts/MyNFT.sol` は **EIP‑2981（ロイヤリティ）** も含む。Day5ではまず **ERC‑721 と `tokenURI` の挙動**だけ確認し、ロイヤリティの意味はDay11で扱う。

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
  const [owner] = await ethers.getSigners();
  const F = await ethers.getContractFactory("MyNFT");
  const c = await F.deploy("ipfs://<CID>/", owner.address, 500);
  await c.waitForDeployment();
  console.log("MyNFT:", await c.getAddress());
}
main().catch(console.error);
```
```bash
npx hardhat run scripts/deploy-nft.ts --network sepolia
```
ミント：
このリポジトリの `scripts/mint-nft.ts` を使う。
```bash
NFT_ADDRESS=0x... TOKEN_ID=1 TO=0x... npx hardhat run scripts/mint-nft.ts --network sepolia
```
> `TO` を省略した場合、ローカルでは2番目の署名者、そうでなければ自分宛になる。
`tokenURI` の戻り値（例：`ipfs://<CID>/1.json`）を、IPFS Gateway（例：`https://ipfs.io/ipfs/<CID>/1.json`）に置き換えて、メタデータと画像が開けることを確認。

---

## 4. Verify（任意）
```bash
npm i -D @nomicfoundation/hardhat-verify
npx hardhat verify --network sepolia <TOKEN_ADDRESS> 1000000000000000000000000
npx hardhat verify --network sepolia <NFT_ADDRESS> "ipfs://<CID>/" <ROYALTY_RECEIVER_ADDR> 500
```
> つまずいたら [`docs/appendix/verify.md`](../appendix/verify.md) を参照する（コンストラクタ引数・optimizer設定・APIキーの不足が典型）。

---

## 5. 追加課題
- ERC‑20：EIP‑2612 Permit（署名承認）対応版を別ブランチに実装。
- ERC‑721：`setApprovalForAll` と `safeTransferFrom` のUI操作をdapp側に追加。
- ガス測定：`transfer` vs `transferFrom`、`mint`の費用を表化。

---

## 6. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| `import \"@openzeppelin/...\"` が解決できない | 依存が入っていない | ルートで `npm ci`（または `npm i @openzeppelin/contracts`）を実行する |
| スクリプトが落ちる（`TOKEN` など） | 環境変数未設定 / `--network` 不一致 | `TOKEN`/`NFT_ADDRESS` 等の値と、`--network` を見直す |
| Verifyが失敗する | APIキー/引数/コンパイラ設定不一致 | [`docs/appendix/verify.md`](../appendix/verify.md) を参照し、引数と optimizer 等を合わせる |

---

## 7. まとめ
- ERC‑20/721 の必須要素と、OpenZeppelin を使う理由（標準準拠・安全性）を押さえた。
- ERC‑20 の `approve→transferFrom` フローを、テストまたはスクリプトで再現した。
- NFT の `tokenURI` とメタデータ（IPFS/HTTP Gateway）の確認方法を整理した。

### 理解チェック（3問）
- Q1. ERC‑20 の `approve → transferFrom` で、「誰が」「誰に」「何の権限」を渡すか？
- Q2. ERC‑721 の `tokenURI` を確認するとき、最低限どの2点をチェックすると安心か？
- Q3. Verify が失敗するとき、まず一致を確認すべき情報を3つ挙げる。

### 解答例（短く）
- A1. 保有者（owner）が、第三者（spender）に「自分の残高から一定量を引き出してよい」権限（allowance）を渡す。
- A2. `tokenURI` の戻り値（参照先）が意図どおりか、参照先のメタデータ/画像が取得できるか。
- A3. 例：コンストラクタ引数、solc/optimizer設定、APIキーやネットワーク（Explorer）が正しいか。

### 確認コマンド（最小）
```bash
npx hardhat test test/erc20.ts
npx hardhat test test/mynft.ts

# 任意（テストネット：要 .env）
npx hardhat run scripts/deploy-token.ts --network sepolia
npx hardhat run scripts/deploy-nft.ts --network sepolia
```

## 8. 提出物
- [ ] トークン・NFTのコントラクトアドレス、Verifyリンク
- [ ] `approve→transferFrom`の実行ログと`allowance`の値
- [ ] `tokenURI` の戻り値と、IPFS Gatewayで開いたメタデータ/画像のキャプチャ

## 9. 実行例
- 実行ログ例：[`docs/reports/Day05.md`](../reports/Day05.md)
