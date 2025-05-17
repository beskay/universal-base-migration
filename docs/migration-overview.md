# Migration Overview

## Introduction

The Token Migration facilitates the transition of tokens from the Solana blockchain to the Base network. This process ensures that token holders on Solana can claim an equivalent amount of tokens on Base through a secure, transparent, and verifiable process.

## Migration Ratio

The system supports two methods for token distribution:

### Fixed Ratio Distribution

- A configurable ratio (e.g., 0.1:1) can be set for the migration
- Each user receives tokens on Base in direct proportion to their Solana balance
- For example, with a 0.1:1 ratio, a user with 100 tokens on Solana would receive 10 tokens on Base

### Proportional Distribution

- A fixed claim pool amount is distributed proportionally among all token holders
- Each user's share is calculated based on their percentage of the total Solana token supply
- The total distributed amount equals exactly the configured claim pool amount

## Key Components

The migration system consists of several key components:

1. **Snapshot System**: Takes a snapshot of all token holders on Solana
2. **Claim Amount Calculator**: Calculates the claim amounts for each address based on the snapshot
3. **Merkle Tree Generator**: Creates a Merkle tree for secure and gas-efficient claims
4. **Smart Contracts**: Handles the claim verification and token distribution on Base
5. **Frontend Application**: User interface for connecting wallets and claiming tokens
6. **Database**: Stores snapshots, claim amounts, and Merkle proofs

## Migration Workflow

The migration process follows these steps:

### Backend Process (One-time setup)

1. **Snapshot Generation**
   - Script queries the Solana blockchain to capture token holders and their balances
   - Token holder data is stored in Supabase

2. **Claim Amount Calculation**
   - Based on the snapshot, claim amounts are calculated using the configured distribution method
   - Results are saved to a JSON file and stored in Supabase

3. **Merkle Tree Generation**
   - A Merkle tree is created from the claim amounts
   - The Merkle root is deployed in the claim contract
   - Individual Merkle proofs are stored in Supabase for verification

4. **Contract Deployment**
   - The claim contract is deployed to Base with the Merkle root
   - The token contract is deployed with the claim contract address

### User Claim Process

1. **Wallet Connection**
   - User connects their Solana wallet (Phantom) containing tokens
   - User connects their Base wallet (MetaMask, Rainbow, etc.)

2. **Registration**
   - User registers both wallet addresses in the frontend
   - The system records the mapping between Solana and Base addresses

3. **Claim Verification**
   - Backend verifies the Solana address has a valid claim amount
   - The system retrieves the Merkle proof for the address

4. **Token Claim**
   - User initiates a claim transaction on Base
   - The smart contract verifies the Merkle proof
   - Upon successful verification, tokens are minted to the user's Base address

## Security Features

- **Merkle Proofs**: Cryptographic verification ensures only legitimate token holders can claim
- **One-time Claims**: Each address can only claim once
- **Wallet Verification**: Dual wallet verification prevents unauthorized claims
- **Smart Contract Security**: Contracts are audited and use battle-tested patterns

## Timeline

- **Snapshot Date**: TBD
- **Claim Period Start**: TBD
- **Claim Period End**: None (Claims remain open indefinitely)

## Next Steps

For technical details on the system architecture, see the [Technical Architecture](./technical-architecture.md) document.

For information on how to use the migration system, see the [User Guides](./user-guides.md) document. 