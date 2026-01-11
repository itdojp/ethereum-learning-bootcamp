# Day11：NFT実装（IPFS・メタデータ）と表示確認（`tokenURI`/IPFS Gateway）

[← 目次](./TOC.md) | [前: Day10](./Day10_Events_TheGraph.md) | [次: Day12](./Day12_Security.md)

## 学習目的
- ERC‑721の`tokenURI`設計とIPFSメタデータのベストプラクティスを理解。
- 画像→IPFS→`baseURI`→ミント→`tokenURI`/Gatewayで表示確認まで一気通貫。
- EIP‑2981（ロイヤリティ）導入と固定価格販売の最小例を実装。

> まず `curriculum/README.md` の「共通の前提」を確認してから進める。

---

## 0. 前提
- PinataまたはInfura IPFS（Project ID/Secret）を用意。
- 画像ファイル（例：`assets/1.png`）。

`.env.example`（項目は同梱してあるので、`.env` に値を入れる）：
```
NFT_BASE=ipfs://<CID>/
NFT_ROYALTY_BPS=500   # 5% = 500 basis points
```

---

## 1. メタデータ設計（教科書）
- metadata.json 必須キー：`name`, `description`, `image`。拡張：`attributes[]`, `animation_url`。
- 画像は`ipfs://<CID>/1.png` のように**内容アドレス**で参照。HTTP Gateway（`https://ipfs.io/ipfs/<CID>`）はプレビュー用。
- `baseURI` を `ipfs://<CID>/` に固定し、`tokenURI(id)` を `baseURI + id + .json` とする。
- メタデータは**凍結**（フリーズ）方針を採用。差し替えが必要ならバージョンを変えて再発行。

---

## 2. IPFS へのアップロード

### 2.1 ディレクトリ構成
```
ipfs/
├── 1.png
├── 1.json
└── _metadata_schema.md
```

### 2.2 `1.json` 雛形
```json
{
  "name": "Sample #1",
  "description": "Demo NFT",
  "image": "ipfs://REPLACE_IMAGE_CID/1.png",
  "attributes": [
    { "trait_type": "tier", "value": "basic" },
    { "trait_type": "series", "value": 1 }
  ]
}
```
> 画像CIDとメタデータCIDは**異なる**可能性がある。Pinataでフォルダ単位アップロードするとルートCIDが付く。

### 2.3 CLI例（Pinata）
Web UIで`ipfs/`フォルダをアップロード→取得したルートCIDを`NFT_BASE`に設定。

---

## 3. コントラクト実装
`contracts/MyNFT.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract MyNFT is ERC721, Ownable, IERC2981 {
    using Strings for uint256;
    string private _base;
    address private _royaltyReceiver;
    uint96  private _royaltyBps; // 10000 = 100%

    constructor(string memory base_, address royaltyReceiver_, uint96 royaltyBps_)
        ERC721("MyNFT", "MNFT") Ownable(msg.sender)
    {
        _base = base_;
        _royaltyReceiver = royaltyReceiver_;
        _royaltyBps = royaltyBps_;
    }

    function _baseURI() internal view override returns (string memory) { return _base; }
    function setBase(string calldata b) external onlyOwner { _base = b; }

    function mint(address to, uint256 id) external onlyOwner { _safeMint(to, id); }

    // tokenURI: baseURI + tokenId + ".json"（IPFSで `1.json` のように保存しやすい形）
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";
        string memory suffix = string.concat(tokenId.toString(), ".json");
        if (bytes(base)[bytes(base).length - 1] == bytes1("/")) return string.concat(base, suffix);
        return string.concat(base, "/", suffix);
    }

    // EIP‑2981
    function royaltyInfo(uint256, uint256 salePrice) external view override
        returns (address receiver, uint256 royaltyAmount)
    { return (_royaltyReceiver, (salePrice * _royaltyBps) / 10000); }

    // NOTE: IERC2981 は IERC165 準拠。ここでIFIDを認識し、その他は ERC721 実装へ委譲。
    function supportsInterface(bytes4 iid) public view override(ERC721, IERC165) returns (bool) {
        return iid == type(IERC2981).interfaceId || super.supportsInterface(iid);
    }
}
```

---

## 4. デプロイ・ミント
`scripts/deploy-nft.ts`
```ts
import { ethers } from "hardhat";
async function main(){
  const base = process.env.NFT_BASE!; // ipfs://<CID>/
  const bps  = Number(process.env.NFT_ROYALTY_BPS || 500);
  const [owner] = await ethers.getSigners();
  const F = await ethers.getContractFactory("MyNFT");
  const c = await F.deploy(base, owner.address, bps);
  await c.waitForDeployment();
  console.log("MyNFT:", await c.getAddress());
}
main().catch(e=>{console.error(e);process.exit(1)});
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

Verify：
```bash
npx hardhat verify --network sepolia <NFT_ADDRESS> "$NFT_BASE" <OWNER_ADDRESS> $NFT_ROYALTY_BPS
```
> Verifyで詰まったら [`appendix/verify.md`](../appendix/verify.md) を参照する（引数不一致が典型）。

---

## 5. 表示確認（`tokenURI` と IPFS Gateway）
OpenSea はテストネット表示を終了したため、次の手順で確認する。

1) `tokenURI(1)` が `ipfs://<CID>/1.json` を返すこと（スクリプト、またはエクスプローラの Read Contract で確認）。  
2) `ipfs://<CID>/1.json` を HTTP に置き換えて開く（例：`https://ipfs.io/ipfs/<CID>/1.json`）。  
3) JSON 内の `image` も同様に置き換えて開き、画像が表示されることを確認。  

> メモ：IPFS Gateway は複数ある。表示できない場合は別Gatewayで再確認する。

---

## 6. 固定価格マーケット（最小実装）
`contracts/FixedPriceMarket.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// NOTE: DEMO ONLY / NOT FOR PRODUCTION
// 本契約は教材用の最小例。実運用不可の主な理由:
// - ReentrancyGuard/CEI等の再入防御なし
// - クリエイターロイヤリティ未対応（EIP-2981非連動）
// - キャンセル/有効期限/再出品の整合性なし
// - 手数料・スリッページ・会計処理の考慮なし
// 実運用時は監査済み実装と包括的テストを使用すること。
interface IERC721X { function safeTransferFrom(address,address,uint256) external; function ownerOf(uint256) external view returns(address); }
contract FixedPriceMarket {
    event Listed(address indexed nft, uint256 indexed id, address indexed seller, uint256 price);
    event Purchased(address indexed nft, uint256 indexed id, address indexed buyer, uint256 price);
    struct Listing { address seller; uint256 price; }
    mapping(address=>mapping(uint256=>Listing)) public listings;

    function list(address nft, uint256 id, uint256 price) external {
        require(IERC721X(nft).ownerOf(id) == msg.sender, "owner");
        require(price > 0, "price=0");
        require(listings[nft][id].seller == address(0), "already listed");
        listings[nft][id] = Listing(msg.sender, price);
        emit Listed(nft,id,msg.sender,price);
    }
    function buy(address nft, uint256 id) external payable {
        Listing memory L = listings[nft][id];
        require(L.seller != address(0), "no list");
        require(msg.value == L.price, "price");
        delete listings[nft][id];
        (bool ok,) = L.seller.call{value: msg.value}(""); require(ok, "pay");
        IERC721X(nft).safeTransferFrom(L.seller, msg.sender, id);
        emit Purchased(nft,id,msg.sender,msg.value);
    }
}
```
> デモ用途。手数料、ロイヤリティ分配、再入保護、キャンセル、タイムロック等は省略。実運用不可。

### 6.1 流れ
1) オーナーが`MyNFT`で`setApprovalForAll(market,true)`。
2) `list(nft,id,price)` 呼び出し。
3) 購入者が `buy(nft,id)` に `msg.value=price` で送金。

---

## 7. テスト（抜粋）
`test/mynft.ts`
```ts
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MyNFT', () => {
  it('mints and returns tokenURI', async () => {
    const [owner, alice] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyNFT');
    const base = 'ipfs://cid/';
    const c = await F.deploy(base, owner.address, 500);
    await c.waitForDeployment();
    await (await c.mint(alice.address, 1)).wait();
    expect(await c.tokenURI(1)).to.eq(`${base}1.json`);
  });
});
```

---

## 8. トラブルシュート
| 症状 | 原因 | 対応 |
|---|---|---|
| Gatewayで開けない | Gateway側の障害/レート制限、またはURIのパス不一致 | 別Gatewayで再確認。`tokenURI` とファイル名（`1.json` 等）が一致しているか確認 |
| 画像が表示されない | `image`がHTTP/HTTPSや拡張子誤り | `ipfs://CID/...png` を再確認 |
| Verify失敗 | コンストラクタ引数不一致 | 引数順序・型・`solidity`バージョン確認 |
| `safeTransferFrom`失敗 | `approve`不足 | `setApprovalForAll` または `approve(id)` 実行 |

---

## 9. 提出物
- `MyNFT` と `FixedPriceMarket` のアドレス、Verifyリンク。
- `tokenURI(1)` の戻り値と、IPFS Gatewayで開いたメタデータ/画像のスクリーンショット。
- IPFSのCID、`1.json` の最終版。

## 10. 実行例
- 実行ログ例：[`reports/Day11.md`](../reports/Day11.md)
