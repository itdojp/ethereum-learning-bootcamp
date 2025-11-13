// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// NOTE: DEMO ONLY / NOT FOR PRODUCTION
// 本契約は教材用の最小例です。実運用不可の主な理由:
// - ReentrancyGuard/CEI等の再入防御なし
// - クリエイターロイヤリティ未対応（EIP-2981非連動）
// - キャンセル/有効期限/再出品の整合性なし
// - 手数料・スリッページ・会計処理の考慮なし
// 実運用時は監査済み実装と包括的テストを使用すること。

interface IERC721X {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract FixedPriceMarket {
    event Listed(address indexed nft, uint256 indexed id, address indexed seller, uint256 price);
    event Purchased(address indexed nft, uint256 indexed id, address indexed buyer, uint256 price);

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    function list(address nft, uint256 id, uint256 price) external {
        require(IERC721X(nft).ownerOf(id) == msg.sender, "owner");
        require(price > 0, "price=0");
        require(listings[nft][id].seller == address(0), "already listed");
        listings[nft][id] = Listing(msg.sender, price);
        emit Listed(nft, id, msg.sender, price);
    }

    function buy(address nft, uint256 id) external payable {
        Listing memory L = listings[nft][id];
        require(L.seller != address(0), "no list");
        require(msg.value == L.price, "price");
        delete listings[nft][id];
        (bool ok, ) = L.seller.call{value: msg.value}("");
        require(ok, "pay");
        IERC721X(nft).safeTransferFrom(L.seller, msg.sender, id);
        emit Purchased(nft, id, msg.sender, msg.value);
    }
}
