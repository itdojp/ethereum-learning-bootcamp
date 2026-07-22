# Day11：NFT実装（IPFS・メタデータ）と表示確認（`tokenURI`/IPFS Gateway）

[← 目次](./TOC.md) | [前: Day10](./Day10_Events_TheGraph.md) | [次: Day12](./Day12_Security.md)

## 学習目的
- ERC‑721の `tokenURI` 設計とIPFSメタデータのベストプラクティスを理解し、簡単に説明できるようになる。
- 画像→content addressing→pinning→`baseURI`→ミント→`tokenURI`/Gateway で表示確認までを一連で実行できるようになる。
- provider固有のupload手順と、CID・`ipfs://`・Gatewayというprovider-neutralな契約を分離できるようになる。
- EIP‑2981（ロイヤリティ）と固定価格販売の最小例を実装し、動作確認できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 前提
- IPFSへ公開してよい画像だけを用意する。public IPFSへpinしたdataは、CIDを知る第三者が取得できる前提で扱う。
- 実際にuploadする場合は、新規登録可能なpinning serviceのアカウント（本章の例はPinata Public IPFS）、またはself-hosted IPFS nodeを用意する。
- 画像ファイル（例：`assets/1.png`）。
- 先に読む付録：[`docs/appendix/glossary.md`](../appendix/glossary.md)（用語に迷ったとき）
- 触るファイル（主なもの）：`contracts/MyNFT.sol` / `scripts/deploy-nft.ts` / `scripts/mint-nft.ts` / `contracts/FixedPriceMarket.sol` / `test/mynft.ts`
- 今回触らないこと：NFTマーケットの本格実装（まずはtokenURI/IPFSの流れを固める）
- 最短手順（迷ったらここ）：2章で公開dataをpinしてfolder root CIDを得る → 3章の `MyNFT` をデプロイ → 4章でミント → `tokenURI`/Gateway で表示確認

`.env.example`（項目は同梱してあるので、`.env` に値を入れる）：
```bash
NFT_BASE=ipfs://<CID>/
NFT_ROYALTY_BPS=500   # 5% = 500 basis points
```

---

## 1. メタデータ設計（教科書）
- metadata.json 必須キー：`name`, `description`, `image`。拡張：`attributes[]`, `animation_url`。
- 画像は`ipfs://<CID>/1.png` のように**内容アドレス**で参照する。CIDはcontentと生成条件から決まる識別子であり、保存場所や永続提供を単独では保証しない。
- pinningはCIDに対応するdataをnode／serviceが保持・提供する契約、Gatewayは`ipfs://`を直接扱えないHTTP client向けの取得経路である。この3つを同じものとして扱わない。
- HTTP Gateway（例：`https://ipfs.io/ipfs/<CID>`）はプレビュー用の取得経路であり、providerやrate limitに依存する。on-chainの参照はprovider固有URLではなく`ipfs://`を維持する。
- `baseURI` を `ipfs://<CID>/` に固定し、`tokenURI(id)` を `baseURI + id + .json` とする。
- メタデータは**凍結**（フリーズ）方針を採用。差し替えが必要ならバージョンを変えて再発行。

---

## 2. IPFS へのアップロード

### 2.1 ディレクトリ構成
```text
ipfs/
├── images/
│   └── 1.png
└── metadata/
    ├── 1.json
    └── _metadata_schema.md
```

### 2.2 `1.json` 雛形
```json
{
  "name": "Sample #1",
  "description": "Demo NFT",
  "image": "ipfs://REPLACE_IMAGE_ROOT_CID/1.png",
  "attributes": [
    { "trait_type": "tier", "value": "basic" },
    { "trait_type": "series", "value": 1 }
  ]
}
```
画像folderを先にpinし、そのroot CIDを`1.json`へ書いてからmetadata folderをpinする。metadataが自身のroot CIDを含む自己参照は作れないため、image root CIDとmetadata root CIDは別に記録する。

### 2.3 primary path：Public IPFSへfolderをpinする

本章では、2026-07-23（Asia/Tokyo）時点で新規accountから利用できるPinata Appをservice固有例にする。provider-neutralな学習目標は「同じdirectory構造を保持してpublic IPFSへpinし、folder root CIDを得る」ことであり、UI名や料金planの暗記ではない。

1. Pinata AppのFiles画面で、networkが**Public IPFS**であることを確認する。NFT metadataを公開する演習なのでPrivate IPFSを選ばない。
2. `ipfs/images/`をfolderとしてuploadし、root CIDを`<IMAGE_ROOT_CID>`として記録する。
3. `ipfs/metadata/1.json`の`image`を`ipfs://<IMAGE_ROOT_CID>/1.png`へ置き換える。
4. `ipfs/metadata/`をfolderとしてuploadし、root CIDを`<METADATA_ROOT_CID>`として記録する。
5. Files画面で両方がpinning対象として保持されていることを確認し、次の値を`.env`へ設定する。

```bash
NFT_BASE=ipfs://<METADATA_ROOT_CID>/
```

PinataのUIやplanが変わって手順どおりに進まない場合は、IPFS公式のPinning quickstartから、その時点で新規利用可能なWeb UI、CLI、またはself-hosted nodeを選ぶ。providerを変更しても、image／metadataの相対path、2つのfolder root CID、`NFT_BASE=ipfs://<CID>/`という成果物は変えない。

### 2.4 CIDとpathをupload直後に検証する

取得用Gatewayはpinning先と別の責務である。まずservice gateway、次に別のpublic gatewayで同じCID/pathを確認する。Gateway URLをcontractへ保存しない。

```bash
export METADATA_ROOT_CID='<METADATA_ROOT_CID>'
export IMAGE_ROOT_CID='<IMAGE_ROOT_CID>'

curl --fail --show-error --location \
  "https://gateway.pinata.cloud/ipfs/${METADATA_ROOT_CID}/1.json"
curl --fail --show-error --location \
  "https://dweb.link/ipfs/${METADATA_ROOT_CID}/1.json"
curl --fail --show-error --location \
  "https://dweb.link/ipfs/${IMAGE_ROOT_CID}/1.png" \
  --output /dev/null
```

返されたJSONの`image`が`ipfs://<CID>/1.png`を指し、そのCID/pathも取得できることを確認する。公開Gatewayはrate limit、denylist、cache、障害の影響を受けるため、1つのGatewayが失敗しただけでCIDが無効とは判断しない。

### 2.5 credential境界とAPI利用

Web Appだけを使う本章のprimary pathでは、API keyやJWTをrepositoryへ追加しない。自動uploadへ発展させる場合も、次を必須とする。

- admin JWT／API secretはserver-sideのsecret store、またはgitignore済みのserver-only環境変数だけに置く。tracked file、`.env.example`、`dapp/`の`VITE_*`、browser bundle、public log、screenshot、shell historyへ出さない。
- keyはuploadに必要な最小scopeと利用回数に制限し、演習後にrevoke／rotateする。
- browserからuploadする場合は、認証済みserverが短命のsigned upload URLを発行し、admin JWTをclientへ渡さない。
- metadataや画像にwallet seed、private key、個人情報、非公開dataを含めない。public IPFSからの削除を前提にしない。

### 2.6 Infura IPFSを使っていた読者へ

Infura公式quickstartは、新規IPFS key作成を全userで停止し、2024年後半にactiveだったkeyだけが継続accessできると明記している。そのためInfura IPFSは本章の新規onboarding routeではない。既存legacy keyを持つ場合だけ公式quickstartとaccount状態を確認して利用し、他の読者へ新規key作成を前提とする手順を共有しない。

---

## 3. コントラクト実装
この章の `MyNFT` は、まず「`tokenURI` が IPFS 上のメタデータを指す」状態を**最小で**作る。

### 3.1 概念（何を実装するか）
- `baseURI` を `ipfs://<CID>/` に固定し、`tokenURI(id)` は `baseURI + id + .json` を返す。
- ミントは `onlyOwner` にして、まずは手順の再現性を優先する（権限制御の深掘りは Day12 で扱う）。
- ロイヤリティは EIP‑2981 の `royaltyInfo` で「受取人 + 割合（BPS）」を返す。
- EIP‑2981はロイヤリティ情報を通知するinterfaceであり、マーケットによる支払いを強制しない。

### 3.2 最小コード（`contracts/MyNFT.sol`）
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

    error InvalidRoyaltyReceiver(address receiver);
    error InvalidRoyaltyBps(uint96 royaltyBps);

    uint96 private constant BPS_DENOMINATOR = 10_000;
    string private _base;
    address private _royaltyReceiver;
    uint96 private _royaltyBps; // 10_000 = 100%

    constructor(string memory base_, address royaltyReceiver_, uint96 royaltyBps_)
        ERC721("MyNFT", "MNFT") Ownable(msg.sender)
    {
        if (royaltyReceiver_ == address(0)) revert InvalidRoyaltyReceiver(royaltyReceiver_);
        if (royaltyBps_ > BPS_DENOMINATOR) revert InvalidRoyaltyBps(royaltyBps_);

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
    { return (_royaltyReceiver, (salePrice * _royaltyBps) / BPS_DENOMINATOR); }

    // NOTE: IERC2981 は IERC165 準拠。ここでIFIDを認識し、その他は ERC721 実装へ委譲。
    function supportsInterface(bytes4 iid) public view override(ERC721, IERC165) returns (bool) {
        return iid == type(IERC2981).interfaceId || super.supportsInterface(iid);
    }
}
```

### 3.3 結果の見方（ここが確認できればOK）
- デプロイ後に `tokenURI(1)` が `ipfs://<CID>/1.json` の形で返る。
- `NFT_BASE` の末尾に `/` があってもなくても、`tokenURI` の戻り値が壊れない（末尾スラッシュを吸収する）。
- `supportsInterface` が `IERC2981` を返す（ロイヤリティ対応の最小確認）。
- `royaltyReceiver_` がzero address、または `royaltyBps_` が10000を超える場合はデプロイを拒否する。10000 bps（100%）は仕様上許容される境界値である。

このコードはinterfaceとvalidation境界を学ぶために手動実装を維持している。本番用途では、default/per-token royalty、burn時の後処理、将来の保守を含むOpenZeppelin Contracts 5.xの `ERC2981` / `ERC721Royalty` など、監査済み実装を優先する。

> **支払いとの境界**: EIP‑2981は `royaltyInfo` で受取人と金額をsignalするだけで、NFT移転時や売買時の送金を強制しない。この章の `FixedPriceMarket` もEIP‑2981を参照せず、売却代金の全額をsellerへ送るため、クリエイターロイヤリティは支払われない。

### 3.4 よくある失敗
- `tokenURI` と、IPFS 上の**パス/ファイル名**（`1.json` / `1.png`）が一致していない。
- `NFT_BASE` を `ipfs://<CID>/` にしていない（末尾スラッシュなし・CID違い）。
- `royaltyBps` の値が意図と違う（BPSは 10000=100% の前提で設定する）。
- zero addressの受取人または10000を超える `royaltyBps` を指定し、constructor validationでデプロイがrevertする。

---

## 4. デプロイ・ミント
`scripts/deploy-nft.ts`
```ts
import { network } from "hardhat";

const { ethers } = await network.create();
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
> Verifyで詰まったら [`docs/appendix/verify.md`](../appendix/verify.md) の「失敗時の切り分けルート」→「よくあるエラー表」を参照する（引数不一致が典型）。

---

## 5. 表示確認（`tokenURI` と IPFS Gateway）
マーケットプレイスの対応ネットワークは更新されるため、テストネットでの表示を前提にしない。ここでは `tokenURI` と IPFS Gateway で確認する（参考: https://docs.opensea.io/）。

1) `tokenURI(1)` が `ipfs://<CID>/1.json` を返すこと（スクリプト、またはエクスプローラの Read Contract で確認）。  
2) `ipfs://<CID>/1.json` を HTTP に置き換えて開く（例：`https://ipfs.io/ipfs/<CID>/1.json`）。  
3) JSON 内の `image` も同様に置き換えて開き、画像が表示されることを確認。  

> メモ：IPFS Gateway は複数ある。表示できない場合は別 Gateway で再確認する。

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
import { network } from 'hardhat';

const { ethers } = await network.create();

describe('MyNFT', () => {
  it('mints, returns tokenURI, and signals ERC-2981 royalty information', async () => {
    const [owner, alice] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyNFT');
    const base = 'ipfs://cid/';
    const c = await F.deploy(base, owner.address, 500);
    await c.waitForDeployment();
    await (await c.mint(alice.address, 1)).wait();
    expect(await c.tokenURI(1)).to.eq(`${base}1.json`);
    expect(await c.supportsInterface('0x2a55205a')).to.eq(true);

    const [receiver, amount] = await c.royaltyInfo(1, ethers.parseEther('1'));
    expect(receiver).to.eq(owner.address);
    expect(amount).to.eq(ethers.parseEther('0.05'));
  });

  // 実際のtest/mynft.tsではzero receiver、10001 bps、10000 bps境界も検証する。
});
```

---

## 8. つまずきポイント

| 症状 | 原因 | 対応 |
|---|---|---|
| Gateway で開けない | Gateway 側の障害/レート制限、またはURIのパス不一致 | 別 Gateway で再確認。`tokenURI` とファイル名（`1.json` 等）が一致しているか確認 |
| metadata root CIDの直下に`1.json`がない | file単体でuploadした、または余分な親directoryを含めた | pinning serviceのfile treeでpathを確認し、`<CID>/1.json`になる`metadata/`をfolderとしてuploadし直す |
| upload済みなのに取得できない | pinが未完了、provider側の処理中、public/private networkの選択違い | pin statusとPublic IPFSを確認し、時間を置いて複数Gatewayで再確認する |
| API credentialがbrowser codeに必要になった | admin keyをclientへ渡す設計になっている | upload APIをserver-sideへ移し、認証済みendpointから短命signed upload URLだけを返す |
| 画像が表示されない | `image`がHTTP/HTTPSや拡張子誤り | `ipfs://CID/...png` を再確認 |
| Verify失敗 | コンストラクタ引数不一致 | 引数順序・型・設定を確認。詰まったら [`docs/appendix/verify.md`](../appendix/verify.md) |
| `safeTransferFrom`失敗 | `approve`不足 | `setApprovalForAll` または `approve(id)` 実行 |

---

## 9. まとめ
- `tokenURI` とIPFSメタデータの設計（CID/パス/凍結方針）を、実装と表示確認の流れで整理した。
- CID、pinning、Gatewayを分離し、serviceを変更しても`ipfs://`とfolder内pathを維持する契約を確認した。
- public IPFSの公開範囲と、upload credentialをserver-sideへ閉じ込める境界を確認した。
- デプロイ→ミント→Gateway で表示確認までをつなぎ、`tokenURI` とファイル名の一致が重要だと分かった。
- EIP‑2981はロイヤリティ情報をsignalするinterfaceであり、支払いはマーケット側の任意実装である。receiverとBPSはconstructorで検証する。
- 固定価格マーケットの最小例を通して、実運用で必要な防御（再入対策等）を明確化した。

### 理解チェック（3問）
- Q1. NFTの `tokenURI` が指しているものは何か？オンチェーン/オフチェーンで分けて説明してみる。
- Q2. CID、pinning、Gatewayはそれぞれ何を担当するか？provider固有要素も分けて説明してみる。
- Q3. browserからuploadするとき、admin API keyをclient bundleへ入れてはいけない理由と代替手段は何か？

### 解答例（短く）
- A1. `tokenURI` はメタデータ（JSON等）への参照だ。オンチェーンでは参照先（文字列）を返し、オフチェーンでその参照先から名前/画像などを取得して表示する。
- A2. CIDはcontent-addressed identifier、pinningはdataを保持・提供し続ける契約、GatewayはHTTPで取得する経路だ。pinning serviceとGateway hostは変更できるが、`ipfs://<CID>/<path>`はprovider-neutralな参照として維持できる。
- A3. client bundleとpublic requestは利用者が読めるため、admin keyを入れると第三者が権限を再利用できる。認証済みserverにkeyを保持し、browserへはscopeと有効時間を絞ったsigned upload URLだけを返す。

### 確認コマンド（最小）
```bash
npx hardhat test test/mynft.ts
npx hardhat test test/market.ts

# 任意（テストネット：要 .env / IPFS）
npx hardhat run scripts/deploy-nft.ts --network sepolia
NFT=0x... npx hardhat run scripts/mint-nft.ts --network sepolia
```

## 10. 提出物
- [ ] `MyNFT` と `FixedPriceMarket` のアドレス、Verifyリンク
- [ ] `tokenURI(1)` の戻り値と、IPFS Gateway で開いたメタデータ/画像のスクリーンショット
- [ ] IPFSのCID、`1.json` の最終版

## 11. 実行例
- 実行ログ例：[`docs/reports/Day11.md`](../reports/Day11.md)

## 12. Source Notes（外部service鮮度）

確認日：**2026-07-23（Asia/Tokyo）**

| 対象 | 一次資料 | この章で固定する事実 |
|---|---|---|
| IPFS content addressing | https://docs.ipfs.tech/concepts/content-addressing/ | CIDはcontentと生成条件から決まるが、保存場所を示さない |
| IPFS lifecycle / pinning | https://docs.ipfs.tech/concepts/lifecycle/ | content addressing、providing／pinning、retrievalは別段階 |
| IPFS Pinning quickstart | https://docs.ipfs.tech/quickstart/pin/ | Web UI、self-hosted node、複数pinning serviceが選択肢。public IPFS dataは公開前提 |
| IPFS Gateway | https://docs.ipfs.tech/concepts/ipfs-gateway/ | GatewayはHTTP取得経路。path／subdomain、trusted／trustlessなどのmodeがある |
| Pinata upload | https://docs.pinata.cloud/files/uploading-files | Public IPFS upload、folder upload、Web App、server-side signed upload URLが提供される |
| Pinata API key | https://docs.pinata.cloud/account-management/api-keys | keyはscope／利用回数を制限でき、revoke可能。secret／JWTは再表示されない |
| Infura IPFS quickstart | https://docs.infura.io/reference/ipfs/quickstart/ | 新規IPFS key作成は停止。2024年後半にactiveだったkeyだけが継続access |

再確認条件：pinning serviceの新規登録可否、Public IPFS／folder uploadのUI・API、plan／rate limit、Gateway host、key scope／signed URL仕様、Infuraのrestricted access表示が変わったとき。または本章の版更新前と、credentialを使うupload automation導入前に一次資料を再確認する。
