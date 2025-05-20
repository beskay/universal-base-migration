// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Airdrop is Ownable {
    error InvalidSignature();

    error InvalidProof();
    error DoubleClaim();

    // address of the token being airdropped
    IERC20 public immutable token;

    /// @notice The address whose private key will create all the signatures which claimers
    /// can use to claim their airdropped tokens
    address public signer;
    /// @notice the EIP712 domain separator for claiming
    bytes32 public immutable EIP712_DOMAIN;
    /// @notice EIP-712 typehash for claiming
    bytes32 public constant SUPPORT_TYPEHASH = keccak256("Claim(address claimer,uint256 amount)");

    /// @notice A merkle proof used to prove inclusion in a set of airdrop claimer addresses.
    /// Claimers can provide a merkle proof using this merkle root and claim their airdropped
    /// tokens
    bytes32 public merkleRoot;

    /// @notice A mapping to keep track of which addresses
    /// have already claimed their airdrop
    mapping(address => bool) public claimed;


    event MerkleRootSet(bytes32 indexed root);
    event SignerSet(address indexed signer);
    event ECDSADisabled(address owner);

    constructor(bytes32 _root, address _signer, IERC20 _token) Ownable(msg.sender) {
        merkleRoot = _root;
        signer = _signer;
        token = _token;

        EIP712_DOMAIN = keccak256(abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Token")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            ));
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;

        emit MerkleRootSet(_root);
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    
        emit SignerSet(_signer);}

    function rescueToken(address _token, uint256 amount) external onlyOwner {
        IERC20(_token).transfer(msg.sender, amount);
    }

    /* ========== MERKLE FUNCTIONS ========== */

    /// @notice Claim function for whitelisted addresses
    function claim(address account, uint256 amount, bytes32[] calldata proof) external {
        if (!_verify(_leaf(account, amount), proof)) revert InvalidProof();
        if (claimed[account]) revert DoubleClaim();

        // set claimed to true to prevent double claiming
        claimed[account] = true;

        IERC20(token).transfer(account, amount);
    }

    /// @dev See OpenZeppelin MerkleProof.
    function _verify(bytes32 leaf, bytes32[] memory proof) internal view returns (bool) {
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    /// @dev See OpenZeppelin MerkleProof.
    function _leaf(address account, uint256 amount) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(account, amount));
    }

    /* ========== ECDSA FUNCTIONS ========== */

    /// @notice Allows a msg.sender to claim their token by providing a
    /// signature signed by the `Airdrop.signer` address.
    /// @dev An address can only claim once
    /// @dev See `Airdrop.toTypedDataHash` for how to format the pre-signed data
    /// @param signature An array of bytes representing a signature created by the
    /// `Airdrop.signer` address
    /// @param _to The address the claimed token should be sent to
    function signatureClaim(bytes calldata signature, address _to, uint256 _amount) external {
        if (claimed[_to]) revert DoubleClaim();
        address addressCheck = ECDSA.recover(toTypedDataHash(_to, _amount), signature);
        if (addressCheck != signer) revert InvalidSignature();

        // set claimed to true to prevent double claiming
        claimed[_to] = true;

        IERC20(token).transfer(_to, _amount);
    }

    /// @dev Helper function for formatting the claimer data in an EIP-712 compatible way
    /// @param _claimer The address which will claim the MACRO tokens
    /// @param _amount The amount of MACRO to be claimed
    /// @return A 32-byte hash, which will have been signed by `Airdrop.signer`
    function toTypedDataHash(address _claimer, uint256 _amount) internal view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(SUPPORT_TYPEHASH, _claimer, _amount));
        return MessageHashUtils.toTypedDataHash(EIP712_DOMAIN, structHash);
    }
}
