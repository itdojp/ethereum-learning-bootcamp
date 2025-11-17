// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GasTest {
    uint256 public count;

    function store(uint256 x) external {
        count = x;
    }

    function add(uint256 x, uint256 y) external pure returns (uint256) {
        return x + y;
    }

    function testRewrite(uint256 x) external {
        count = x;
        count = x;
    }
}
