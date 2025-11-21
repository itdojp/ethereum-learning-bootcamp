// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EventToken {
    mapping(address => uint256) public bal;

    event TransferLogged(address indexed from, address indexed to, uint256 amount);

    function mint(uint256 amount) external {
        bal[msg.sender] += amount;
    }

    function transfer(address to, uint256 amount) external {
        require(bal[msg.sender] >= amount, "bal");
        bal[msg.sender] -= amount;
        bal[to] += amount;
        emit TransferLogged(msg.sender, to, amount);
    }
}
