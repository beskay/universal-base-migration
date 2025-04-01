// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {UOS} from "../src/UOS.sol";

contract UOSTest is Test {
    UOS public uOS;

    function setUp() public {
        uOS = new UOS();

        uOS.setMerkleRoot(0xa99796701bf15c5d4e0b9d081e93b9bd5d1c03c27e314a7ffd836296872bbfd7);

        // transfer uOS for claims to the contract
        uOS.transfer(address(uOS), 100_000 * 10 ** 18);
    }

    function test_claimTokens() public {
        bytes32[] memory proof = new bytes32[](8);
        proof[0] = 0xd862a913d4e8261fa28d5b1238cc4a493dc39c8aaea991d2aa20dc4ec74bcfb4;
        proof[1] = 0xa69337f36a70c717f66dc5144f2d55579de43ef23ac273b601f7a2ac29bc9ce2;
        proof[2] = 0x72a366d317e72def7c5c9fbc208c4d53a0236baec46c13bbf2a9fd4081454520;
        proof[3] = 0x4390d6fb3273149046ae6078474d8e5b309040a37db3efcb7c82d208722e3e21;
        proof[4] = 0x051bce032963e09cee57abb9fbab00a8e7a61d318a1aa14ce8c819f0a7b7a44f;
        proof[5] = 0x1a8d77ab482a6cd0af1ccfa0ae6a94e875b4a6d8bc6f52e8199026ed85c4b78a;
        proof[6] = 0x2bd8ce075065c0fe1ba2c0bb665d4a8dcb792b7e3de20de2ec452643da7a06b1;
        proof[7] = 0x52f90604106e2d415f11c54a274a312750e9d04d36953254ef1805bed9f373d2;

        uOS.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);
        assertEq(uOS.balanceOf(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b)), 188999999999999967232);

        assertEq(uOS.balanceOf(address(uOS)), 100_000 * 10 ** 18 - 188999999999999967232);
    }

    function test_RevertClaimTokens() public {
        bytes32[] memory proof = new bytes32[](8);
        proof[0] = 0xd862a913d4e8261fa28d5b1238cc4a493dc39c8aaea991d2aa20dc4ec74bcfb4;
        proof[1] = 0xa69337f36a70c717f66dc5144f2d55579de43ef23ac273b601f7a2ac29bc9ce2;
        proof[2] = 0x72a366d317e72def7c5c9fbc208c4d53a0236baec46c13bbf2a9fd4081454520;
        proof[3] = 0x4390d6fb3273149046ae6078474d8e5b309040a37db3efcb7c82d208722e3e21;
        proof[4] = 0x051bce032963e09cee57abb9fbab00a8e7a61d318a1aa14ce8c819f0a7b7a44f;
        proof[5] = 0x1a8d77ab482a6cd0af1ccfa0ae6a94e875b4a6d8bc6f52e8199026ed85c4b78a;
        proof[6] = 0x2bd8ce075065c0fe1ba2c0bb665d4a8dcb792b7e3de20de2ec452643da7a06b1;
        proof[7] = 0x52f90604106e2d415f11c54a274a312750e9d04d36953254ef1805bed9f373d0;

        // wrong proof
        vm.expectRevert();
        uOS.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);

        // wrong amount
        vm.expectRevert();
        proof[7] = 0x52f90604106e2d415f11c54a274a312750e9d04d36953254ef1805bed9f373d2;
        uOS.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 1000_000_000, proof);
    }

    function test_RevertDoubleClaim() public {
        bytes32[] memory proof = new bytes32[](8);
        proof[0] = 0xd862a913d4e8261fa28d5b1238cc4a493dc39c8aaea991d2aa20dc4ec74bcfb4;
        proof[1] = 0xa69337f36a70c717f66dc5144f2d55579de43ef23ac273b601f7a2ac29bc9ce2;
        proof[2] = 0x72a366d317e72def7c5c9fbc208c4d53a0236baec46c13bbf2a9fd4081454520;
        proof[3] = 0x4390d6fb3273149046ae6078474d8e5b309040a37db3efcb7c82d208722e3e21;
        proof[4] = 0x051bce032963e09cee57abb9fbab00a8e7a61d318a1aa14ce8c819f0a7b7a44f;
        proof[5] = 0x1a8d77ab482a6cd0af1ccfa0ae6a94e875b4a6d8bc6f52e8199026ed85c4b78a;
        proof[6] = 0x2bd8ce075065c0fe1ba2c0bb665d4a8dcb792b7e3de20de2ec452643da7a06b1;
        proof[7] = 0x52f90604106e2d415f11c54a274a312750e9d04d36953254ef1805bed9f373d2;

        uOS.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);
        assertEq(uOS.balanceOf(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b)), 188999999999999967232);

        vm.expectRevert();
        uOS.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);
    }

    function test_rescueToken() public {
        uint256 balance = uOS.balanceOf(address(this));
        uOS.rescueToken(address(uOS), 10e20);
        assertEq(uOS.balanceOf(address(this)), balance + 10e20);
    }
}
