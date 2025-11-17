// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GasNaive {
    struct Order {
        uint256 id;
        uint256 price;
        uint256 qty;
        address user;
        bool active;
    }

    mapping(uint256 => Order) public orders;
    uint256 public nextId;

    function add(uint256 price, uint256 qty) external {
        nextId += 1;
        orders[nextId] = Order({ id: nextId, price: price, qty: qty, user: msg.sender, active: true });
    }
}

contract GasPacked {
    struct Order {
        uint128 price;
        uint96 qty;
        address user;
        bool active;
        uint32 id;
    }

    mapping(uint32 => Order) public orders;
    uint32 public nextId;

    function add(uint128 price, uint96 qty) external {
        unchecked {
            nextId += 1;
        }
        orders[nextId] = Order({ id: nextId, price: price, qty: qty, user: msg.sender, active: true });
    }
}
