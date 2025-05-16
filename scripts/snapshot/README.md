# Solana Token Snapshot

This directory contains scripts for taking a snapshot of token balances on Solana.

## Prerequisites

- Node.js 18+
- A connection to a Solana RPC endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the parent `scripts` directory with the following variables:
```
# Solana RPC endpoint (use a reliable endpoint)
EXTRNODE_RPC_URL=https://api.mainnet-beta.solana.com

# Required: Token mint address on Solana 
TOKEN_MINT_ADDRESS=your_token_mint_address

# Supabase credentials for storing results
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Important Note

The `TOKEN_MINT_ADDRESS` environment variable is required. The script will exit with an error if this is not provided. This allows you to use any Solana token mint for snapshots, not just the UOS token.

## Running the Snapshot

```bash
npm run snapshot
```

## Output

The script will update the `solana_balance` column in the Supabase database for each registered user, storing their token balance at the time of the snapshot.

## Customization

You can modify the snapshot.ts file to:
- Filter accounts based on minimum balance
- Include only specific accounts
- Adjust the output format
- Change the token decimal handling

## Next Steps

After generating the snapshot, you can use the data to:
1. Generate claim amounts in the claim-amount directory
2. Create a Merkle tree in the merkle directory 