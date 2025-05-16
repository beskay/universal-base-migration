# Token Migration Scripts

This directory contains scripts for migrating a token from Solana to Base. The process involves:

1. Taking a snapshot of token holders on Solana
2. Calculating claim amounts for Base
3. Generating a Merkle tree for secure claiming

## Directory Structure

```
scripts/
├── snapshot/       # Scripts for taking a snapshot of token holders on Solana
├── claim-amount/   # Scripts for calculating claim amounts on Base
└── merkle/         # Scripts for generating Merkle tree and proofs
```

## Environment Setup

Create a `.env` file in the root `scripts` directory with the following variables:

```
# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Solana configuration
EXTRNODE_RPC_URL=https://api.mainnet-beta.solana.com

# Token configuration for snapshot
TOKEN_MINT_ADDRESS=your_solana_token_mint_address

# Token configuration for claim amount calculation
TOKEN_DECIMALS=18
TOKEN_SYMBOL=YOUR_TOKEN
CLAIM_POOL_AMOUNT=100000
```

You can also refer to the `.env.example` file in this directory.

## Complete Migration Workflow

### Step 1: Take a snapshot of token holders on Solana

```bash
npm run snapshot
```

### Step 2: Calculate claim amounts for Base

```bash
npm run claim-amount
```

### Step 3: Generate Merkle tree for claiming

```bash
npm run merkle
```

### Step 4: Deploy the contract with the Merkle root

Use the Merkle root from the merkleTree.json file when deploying your token contract.

## Database Integration

These scripts store results in Supabase. Configure your Supabase credentials in the .env file.

## Customization

Each script can be customized to fit your specific token migration needs. See the README in each directory for details.
