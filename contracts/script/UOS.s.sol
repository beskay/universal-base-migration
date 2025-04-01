// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {UOS} from "src/UOS.sol";

contract UOSScript is Script {
    UOS public uOS;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        uOS = new UOS();

        vm.stopBroadcast();
    }
}