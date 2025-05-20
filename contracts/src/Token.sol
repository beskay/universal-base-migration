// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract Token is ERC20, Ownable {

    constructor() ERC20("Name", "Symbol") Ownable(msg.sender) {
        _mint(msg.sender, 1000_000 * 10 ** 18);
    }
}
