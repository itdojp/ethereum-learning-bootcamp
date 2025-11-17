// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SafeBank is ReentrancyGuard {
    mapping(address => uint256) public bal;

    function dep() external payable {
        bal[msg.sender] += msg.value;
    }

    function wd(uint256 amount) external nonReentrant {
        uint256 balance = bal[msg.sender];
        require(balance >= amount, "bal");
        bal[msg.sender] = balance - amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send");
    }
}
