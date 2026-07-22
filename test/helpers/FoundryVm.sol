// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface FoundryVm {
    function deal(address account, uint256 newBalance) external;
    function prank(address sender) external;
}

library FoundryVmAddress {
    FoundryVm internal constant VM = FoundryVm(address(uint160(uint256(keccak256("hevm cheat code")))));
}
