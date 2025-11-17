// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract AdminBox is Ownable, Pausable {
    string private data;

    constructor() Ownable(msg.sender) {}

    function set(string calldata value) external onlyOwner whenNotPaused {
        data = value;
    }

    function get() external view returns (string memory) {
        return data;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
