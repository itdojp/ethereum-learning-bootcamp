// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GasEvent {
    event Log1(address indexed caller, uint256 value);
    event Log2(address indexed caller, address indexed other, uint256 value);

    function e1(uint256 value) external {
        emit Log1(msg.sender, value);
    }

    function e2(address other, uint256 value) external {
        emit Log2(msg.sender, other, value);
    }
}
