// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccountingHandler, IAccountingBank} from "../test/helpers/AccountingHandler.sol";
import {TargetedInvariant} from "../test/helpers/TargetedInvariant.sol";

contract UnsafeAccountingBank is IAccountingBank {
    mapping(address => uint256) public bal;

    function dep() external payable {
        // Intentional mutation: creates one wei of unbacked internal credit.
        bal[msg.sender] += msg.value + 1;
    }

    function wd(uint256 amount) external {
        require(bal[msg.sender] >= amount, "bal");
        bal[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "send");
    }
}

contract UnsafeAccountingInvariant is TargetedInvariant {
    UnsafeAccountingBank private bank;
    AccountingHandler private handler;

    function setUp() public {
        bank = new UnsafeAccountingBank();
        handler = new AccountingHandler(IAccountingBank(address(bank)));
        handler.deposit(0, 0);
        targetContract(address(handler));
    }

    function invariant_AccountingMatchesAssets() public view {
        uint256 assets = address(bank).balance;
        require(handler.sumActorBalances() == assets, "recorded balances differ from assets");
        require(handler.ghostDeposited() - handler.ghostWithdrawn() == assets, "ghost accounting differs from assets");
    }
}
