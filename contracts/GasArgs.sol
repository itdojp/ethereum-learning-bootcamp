// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error TooLong();

contract GasArgs {
    uint256 public last;

    function sumCalldata(uint256[] calldata a) public pure returns (uint256 r) {
        uint256 n = a.length;
        if (n > 10_000) revert TooLong();
        for (uint256 i; i < n; ) {
            unchecked {
                r += a[i];
                ++i;
            }
        }
    }

    function sumMemory(uint256[] memory a) public pure returns (uint256 r) {
        uint256 n = a.length;
        for (uint256 i; i < n; ) {
            unchecked {
                r += a[i];
                ++i;
            }
        }
    }

    function sumCalldataTx(uint256[] calldata a) external {
        last = sumCalldata(a);
    }

    function sumMemoryTx(uint256[] memory a) external {
        last = sumMemory(a);
    }
}
