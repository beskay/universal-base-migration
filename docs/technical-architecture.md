# Technical Architecture

This document provides a detailed overview of the technical architecture for the token migration system.

## System Components

The migration system consists of the following core components:

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│                │     │                 │     │                  │
│  Solana Chain  │────▶│ Migration Scripts│────▶│   Supabase DB    │
│                │     │                 │     │                  │
└────────────────┘     └─────────────────┘     └──────────────────┘
                                                        │
                                                        ▼
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│                │     │                 │     │                  │
│   Base Chain   │◀────│  Smart Contracts │◀────│ Frontend dApp    │
│                │     │                 │     │                  │
└────────────────┘     └─────────────────┘     └──────────────────┘
```

### 1. Migration Scripts

Located in the `/scripts` directory, these Node.js scripts handle the core migration logic:

- **Snapshot Script** (`/scripts/snapshot`)
  - Takes a snapshot of token holders on Solana
  - Uses Solana Web3.js to query token accounts
  - Stores results in JSON and Supabase

- **Claim Amount Calculator** (`/scripts/claim-amount`)
  - Processes the snapshot data
  - Supports two distribution methods:
    - Fixed ratio: Applies a configurable ratio (e.g., 0.1:1) directly to each balance
    - Proportional: Distributes a fixed claim pool amount proportionally to all holders
  - Handles edge cases and adjustments
  - Outputs claim amounts to JSON file

- **Merkle Tree Generator** (`/scripts/merkle`)
  - Creates a Merkle tree from claim amounts
  - Generates individual proofs for each address
  - Outputs the Merkle root for the smart contract

### 2. Database (Supabase)

The system uses Supabase as its database with the following tables:

- **`merkle`** - Stores Merkle proofs for each address:
  - `address` (TEXT, PRIMARY KEY) - Wallet address
  - `balance` (TEXT) - Claimable token amount
  - `proof` (TEXT[]) - Merkle proof array for verification

- **`registered_users`** - Stores the mappings between Solana and Base addresses:
  - `id` (SERIAL, PRIMARY KEY)
  - `solana_address` (TEXT, UNIQUE) - Solana wallet address
  - `evm_address` (TEXT) - Base wallet address
  - `created_at` (TIMESTAMP) - Registration timestamp

### 3. Smart Contracts

Located in the `/contracts` directory, built with Foundry:

- **Claim Contract**
  - Implements the Merkle verification logic
  - Handles token distribution
  - Prevents double-claiming
  - Manages access control

- **Token Contract**
  - ERC-20 compliant token for Base
  - Integrated with the claim contract
  - Implements vote-escrow functionality

### 4. Frontend dApp

Located in the `/frontend` directory, built with Next.js:

- **Wallet Connection**
  - Integrates with Phantom for Solana
  - Uses Rainbow Kit for Base wallets
  - Handles wallet state management

- **Registration Flow**
  - Collects and validates user's wallets
  - Stores mapping in Supabase
  - Prevents duplicate registrations

- **Claim Interface**
  - Verifies user eligibility
  - Retrieves Merkle proof from backend
  - Initiates claim transaction
  - Displays claim status

## Data Flow

### Registration Flow

1. User connects Solana wallet
2. User connects Base wallet
3. Frontend verifies wallet connections
4. Frontend sends wallet pair to Supabase
5. Supabase validates and stores mapping
6. Frontend confirms successful registration

### Claim Flow

1. User connects registered wallets
2. Frontend queries Supabase for mapped wallets
3. If mapping exists, frontend checks if address has a claim
4. Frontend retrieves Merkle proof from Supabase
5. User initiates claim transaction
6. Smart contract verifies Merkle proof
7. If valid, contract transfers tokens to user
8. Frontend updates UI with claim status

## Technical Implementation

### Environment Setup

The system uses a unified `.env` file in the root directory with the following key variables:

```
# Solana Configuration
EXTRNODE_RPC_URL=<solana-rpc-endpoint>
TOKEN_MINT_ADDRESS=<token-address>

# Supabase Configuration
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>

# Token Configuration
TOKEN_DECIMALS=18
TOKEN_SYMBOL=TOKEN
CLAIM_POOL_AMOUNT=100000

# Migration Ratio Configuration
MIGRATION_RATIO=0.1
FIXED_RATIO=false

# Base Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=<claim-contract-address>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<walletconnect-id>
```

### Migration Ratio Configuration

The system supports two approaches for token distribution:

1. **Proportional Distribution** (`FIXED_RATIO=false`):
   - Distributes the `CLAIM_POOL_AMOUNT` proportionally among all token holders
   - Each user receives a share based on their percentage of the total supply
   - Ensures the exact `CLAIM_POOL_AMOUNT` is distributed

2. **Fixed Ratio Distribution** (`FIXED_RATIO=true`):
   - Applies the `MIGRATION_RATIO` directly to each user's balance
   - For example, with a 0.1:1 ratio, 100 tokens on Solana becomes 10 tokens on Base
   - The total distributed amount may differ from `CLAIM_POOL_AMOUNT`

### Running the Migration Scripts

The migration process is orchestrated through the `scripts/migrate.js` script, which:

1. Validates environment configuration
2. Runs the Solana snapshot
3. Calculates claim amounts using the configured distribution method
4. Generates the Merkle tree
5. Outputs the Merkle root for smart contract deployment

### Deploying the Smart Contracts

Smart contracts are deployed using Foundry's Forge:

1. The Merkle root from the migration script is used in the claim contract deployment
2. The token contract is deployed with the claim contract address

### Running the Frontend

The frontend application is a Next.js app that:

1. Loads environment variables for API endpoints and contract addresses
2. Connects to Supabase for data access
3. Uses the Contract ABI to interact with the claim contract
4. Implements the user interface for the registration and claim flows

## Security Considerations

### Smart Contract Security

- **Access Control**: Only authorized addresses can access administrative functions
- **Reentrancy Protection**: Prevents reentrancy attacks during token transfers
- **Input Validation**: Validates all inputs before processing
- **Gas Efficiency**: Optimized for gas usage, particularly for Merkle verification

### Backend Security

- **Environment Variables**: Sensitive values stored in .env files (not committed to Git)
- **Service Role Keys**: Supabase service role keys only used in backend scripts
- **Input Sanitization**: All user inputs are validated and sanitized

### Frontend Security

- **Client-side Validation**: Validates all inputs before submission
- **No Private Keys**: Never requests or stores private keys
- **Limited Backend Access**: Uses row-level security in Supabase

## Deployment Architecture

The migration system is deployed as follows:

- **Frontend**: Deployed on Vercel
- **Database**: Hosted on Supabase
- **Smart Contracts**: Deployed to Base mainnet
- **Scripts**: Run locally by administrators for the migration process 