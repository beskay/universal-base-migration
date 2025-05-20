// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Airdrop} from "../src/Airdrop.sol";
import {Token} from "../src/Token.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AirdropTest is Test {
    Airdrop public airdrop;
    Token public token;

    // ECDSA vars
    address signer = vm.addr(1); // The trusted signer
    address user = vm.addr(2);   // User who will claim
    uint256 amount = 1000 * 10 ** 18; // Amount to be claimed
    bytes32 public constant SUPPORT_TYPEHASH = keccak256("Claim(address claimer,uint256 amount)");

    function setUp() public {
        token = new Token();
        airdrop = new Airdrop(
            0xa99796701bf15c5d4e0b9d081e93b9bd5d1c03c27e314a7ffd836296872bbfd7,
            signer,
            token
        );

        // transfer token for claims to the contract
        token.transfer(address(airdrop), 100_000 * 10 ** 18);
    }

    /* Restricted Functions */

    function test_rescueToken() public {
        uint256 balance = token.balanceOf(address(this));
        airdrop.rescueToken(address(token), 10e20);
        assertEq(token.balanceOf(address(this)), balance + 10e20);
    }

    /* Merkle Tree Tests */

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

        airdrop.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);
        assertEq(token.balanceOf(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b)), 188999999999999967232);

        assertEq(token.balanceOf(address(airdrop)), 100_000 * 10 ** 18 - 188999999999999967232);
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
        airdrop.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);

        // wrong amount
        vm.expectRevert();
        proof[7] = 0x52f90604106e2d415f11c54a274a312750e9d04d36953254ef1805bed9f373d2;
        airdrop.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 1000_000_000, proof);
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

        airdrop.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);
        assertEq(token.balanceOf(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b)), 188999999999999967232);

        vm.expectRevert();
        airdrop.claim(address(0xb12077ED0931888aDDB2Cb7E75af252E73ebE49b), 188999999999999967232, proof);
    }

    /* ECDSA Tests */

    function testValidClaim() public {
        bytes memory sig = _generateSignature(user, amount);
        vm.prank(user);
        airdrop.signatureClaim(sig, user, amount);

        assertEq(token.balanceOf(user), amount);
    }

    function testRevertOnDoubleClaim() public {
        bytes memory sig = _generateSignature(user, amount);
        vm.prank(user);
        airdrop.signatureClaim(sig, user, amount);

        // Attempt double claim
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("DoubleClaim()"));
        airdrop.signatureClaim(sig, user, amount);
    }

    function testRevertOnInvalidSignature() public {
        address fakeUser = vm.addr(3);
        bytes memory sig = _generateSignature(fakeUser, amount); // Sign for a different user

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("InvalidSignature()"));
        airdrop.signatureClaim(sig, user, amount);
    }

    function _generateSignature(address _claimer, uint256 _amount) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(airdrop.SUPPORT_TYPEHASH(), _claimer, _amount));
        bytes32 digest = MessageHashUtils.toTypedDataHash(airdrop.EIP712_DOMAIN(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest); // signer is vm.addr(1)
        return abi.encodePacked(r, s, v);
    }    
}
