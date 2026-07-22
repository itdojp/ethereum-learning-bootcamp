// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeBank} from "../contracts/SafeBank.sol";
import {AccountingHandler, IAccountingBank} from "./helpers/AccountingHandler.sol";
import {TargetedInvariant} from "./helpers/TargetedInvariant.sol";

contract Invariant is TargetedInvariant {
    SafeBank private bank;
    AccountingHandler private handler;

    function setUp() public {
        bank = new SafeBank();
        handler = new AccountingHandler(IAccountingBank(address(bank)));
        targetContract(address(handler));
    }

    function invariant_AccountingMatchesAssets() public view {
        uint256 assets = address(bank).balance;
        uint256 recordedBalances = handler.sumActorBalances();
        uint256 ghostNetDeposits = handler.ghostDeposited() - handler.ghostWithdrawn();

        require(recordedBalances == assets, "recorded balances differ from assets");
        require(ghostNetDeposits == assets, "ghost accounting differs from assets");
    }
}
