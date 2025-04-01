// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract UOS is ERC20, Ownable {
    error InvalidProof();
    error DoubleClaim();

    mapping(address => bool) public claimed;
    bytes32 public MERKLE_ROOT;

    event MerkleRootSet(bytes32 indexed root);

    constructor() ERC20("Universal Operating System", "uOS") Ownable(msg.sender) {
        _mint(msg.sender, 1000_000 * 10 ** 18);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        MERKLE_ROOT = _root;

        emit MerkleRootSet(_root);
    }

    function rescueToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /// @notice Claim function for whitelisted addresses
    function claim(address account, uint256 amount, bytes32[] calldata proof) external {
        if (!_verify(_leaf(account, amount), proof)) revert InvalidProof();
        if (claimed[account]) revert DoubleClaim();

        // set claimed to true to prevent double claiming
        claimed[account] = true;

        _transfer(address(this), account, amount);
    }

    /* ========== VIEWS ========== */

    /// @dev See OpenZeppelin MerkleProof.
    function _verify(bytes32 leaf, bytes32[] memory proof) internal view returns (bool) {
        return MerkleProof.verify(proof, MERKLE_ROOT, leaf);
    }

    /// @dev See OpenZeppelin MerkleProof.
    function _leaf(address account, uint256 amount) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(account, amount));
    }
}
