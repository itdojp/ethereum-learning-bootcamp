// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VulnBank {
    mapping(address => uint256) public bal;

    function dep() external payable {
        bal[msg.sender] += msg.value;
    }

    function wd(uint256 amount) external {
        uint256 cached = bal[msg.sender];
        require(cached >= amount, "bal");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send");
        bal[msg.sender] = cached - amount;
    }
}
