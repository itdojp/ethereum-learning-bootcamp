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
    uint96 private _royaltyBps; // 10000 = 100%

    constructor(string memory base_, address royaltyReceiver_, uint96 royaltyBps_)
        ERC721("MyNFT", "MNFT")
        Ownable(msg.sender)
    {
        _base = base_;
        _royaltyReceiver = royaltyReceiver_;
        _royaltyBps = royaltyBps_;
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    function setBase(string calldata b) external onlyOwner {
        _base = b;
    }

    function mint(address to, uint256 id) external onlyOwner {
        _safeMint(to, id);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";

        string memory suffix = string.concat(tokenId.toString(), ".json");
        if (bytes(base)[bytes(base).length - 1] == bytes1("/")) {
            return string.concat(base, suffix);
        }
        return string.concat(base, "/", suffix);
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (_royaltyReceiver, (salePrice * _royaltyBps) / 10000);
    }

    // NOTE: IERC2981 is IERC165-compliant; recognise its IID here and delegate the rest upstream.
    function supportsInterface(bytes4 iid) public view override(ERC721, IERC165) returns (bool) {
        return iid == type(IERC2981).interfaceId || super.supportsInterface(iid);
    }
}
