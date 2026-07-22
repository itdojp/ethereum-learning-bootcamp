// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract TargetedInvariant {
    address[] private targetedContracts;

    function targetContract(address target) internal {
        targetedContracts.push(target);
    }

    // Forge discovers this getter when configuring an invariant campaign.
    function targetContracts() public view returns (address[] memory) {
        return targetedContracts;
    }
}
