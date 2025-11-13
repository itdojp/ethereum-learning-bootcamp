// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GasBench {
    uint256 public s;

    // storage 書込み（高コスト）
    function setS(uint256 x) external {
        s = x;
    }

    // memory 配列：コピーが発生
    function sumMemory(uint256[] memory a) public pure returns (uint256 r) {
        for (uint256 i = 0; i < a.length; i++) {
            r += a[i];
        }
    }

    // calldata 配列：読み取り専用で安価
    function sumCalldata(uint256[] calldata a) public pure returns (uint256 r) {
        for (uint256 i = 0; i < a.length; i++) {
            r += a[i];
        }
    }

    // TxとしてgasReporterに記録させるためのベンチ関数
    function benchSumCalldata(uint256[] calldata a) external {
        uint256 r = sumCalldata(a);
        s = r;
    }

    function benchSumMemory(uint256[] memory a) external {
        uint256 r = sumMemory(a);
        s = r;
    }

    // イベント多発のコスト比較
    event Ping(uint256 indexed i, uint256 v);

    function emitMany(uint256 n) external {
        for (uint256 i = 0; i < n; i++) {
            emit Ping(i, i);
        }
    }
}
