// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error EmptyMessage();

contract Hello {
    event MessageChanged(address indexed caller, string newMessage);
    string public message = "Hello Ethereum";
    function setMessage(string calldata m) external {
        if (bytes(m).length == 0) revert EmptyMessage();
        message = m;
        emit MessageChanged(msg.sender, m);
    }
}
