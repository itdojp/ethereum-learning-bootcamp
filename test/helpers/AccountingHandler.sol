// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FoundryVm, FoundryVmAddress} from "./FoundryVm.sol";

interface IAccountingBank {
    function bal(address account) external view returns (uint256);
    function dep() external payable;
    function wd(uint256 amount) external;
}

contract AccountingHandler {
    uint256 private constant MAX_DEPOSIT = 10 ether;
    address private constant ACTOR_0 = address(0xA11CE);
    address private constant ACTOR_1 = address(0xB0B);
    address private constant ACTOR_2 = address(0xCAFE);

    FoundryVm private constant vm = FoundryVmAddress.VM;

    IAccountingBank public immutable bank;
    uint256 public ghostDeposited;
    uint256 public ghostWithdrawn;

    constructor(IAccountingBank bank_) {
        bank = bank_;
    }

    function deposit(uint256 actorSeed, uint256 amountSeed) external {
        address actor = _actor(actorSeed);
        uint256 amount = (amountSeed % MAX_DEPOSIT) + 1;

        vm.deal(actor, actor.balance + amount);
        vm.prank(actor);
        bank.dep{value: amount}();
        ghostDeposited += amount;
    }

    function withdraw(uint256 actorSeed, uint256 amountSeed) external {
        address actor = _actor(actorSeed);
        uint256 recordedBalance = bank.bal(actor);
        if (recordedBalance == 0) return;

        uint256 amount = (amountSeed % recordedBalance) + 1;
        vm.prank(actor);
        bank.wd(amount);
        ghostWithdrawn += amount;
    }

    function sumActorBalances() external view returns (uint256) {
        return bank.bal(ACTOR_0) + bank.bal(ACTOR_1) + bank.bal(ACTOR_2);
    }

    function _actor(uint256 actorSeed) private pure returns (address) {
        uint256 selected = actorSeed % 3;
        if (selected == 0) return ACTOR_0;
        if (selected == 1) return ACTOR_1;
        return ACTOR_2;
    }
}
