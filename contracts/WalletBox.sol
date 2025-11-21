// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error NotOwner();
error EmptyMessage();

contract WalletBox {
    address public immutable owner;
    string private _note;

    event NoteChanged(address indexed caller, string note);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(string memory initNote) {
        owner = msg.sender;
        _note = initNote;
    }

    function note() external view returns (string memory) {
        return _note;
    }

    function balance() public view returns (uint256) {
        return address(this).balance;
    }

    function setNote(string calldata newNote) external {
        if (bytes(newNote).length == 0) revert EmptyMessage();
        _note = newNote;
        emit NoteChanged(msg.sender, newNote);
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(address payable to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        require(amount <= address(this).balance, "insufficient");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "send failed");
        emit Withdrawn(to, amount);
    }
}
