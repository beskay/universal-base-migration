const { MerkleTree } = require("merkletreejs");
const { keccak256, solidityPackedKeccak256, getAddress } = require("ethers");

// Hash account + amount using Solidity's keccak256 function (compatible with ethers v6)
function hashLeaf(account, amount) {
  return Buffer.from(
    solidityPackedKeccak256(["address", "uint256"], [getAddress(account), amount]).slice(2),
    "hex"
  );
}

// Generate Merkle tree from holders
function generateMerkleTree(holders) {
  const leaves = Object.entries(holders).map(([account, amount]) => hashLeaf(account, amount));
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  console.log(`Merkle Tree Root: ${merkleTree.getHexRoot()}`);
  return merkleTree;
}

// Generate proofs for each holder
function generateProofs(merkleTree, holders) {
  let proofs = {};
  Object.entries(holders).forEach(([account, amount]) => {
    const leaf = hashLeaf(account, amount);
    proofs[account] = merkleTree.getHexProof(leaf);
  });

  return proofs;
}

module.exports = { generateMerkleTree, generateProofs };
