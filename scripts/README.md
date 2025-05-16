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

## Complete Migration Workflow

### Step 1: Take a snapshot of token holders on Solana

```bash
cd snapshot
npm install
# Configure .env file
npm run snapshot
# This generates snapshot_results.json
```

### Step 2: Calculate claim amounts for Base

```bash
cd ../claim-amount
npm install
# Copy snapshot_results.json from the snapshot directory
# Configure .env file with conversion rate
npm run generate
# This generates addresses.json
```

### Step 3: Generate Merkle tree for claiming

```bash
cd ../merkle
npm install
# Copy addresses.json from the claim-amount directory
node generateMerkletree.js
# This generates merkleTree.json with the root and proofs
```

### Step 4: Deploy the contract with the Merkle root

Use the Merkle root from the merkleTree.json file when deploying your token contract.

## Database Integration (Optional)

These scripts can optionally store results in Supabase. Configure your Supabase credentials in each .env file if you want to use this feature.

## Customization

Each script can be customized to fit your specific token migration needs. See the README in each directory for details.
