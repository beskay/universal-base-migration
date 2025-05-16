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

2. Create a `.env` file with the following variables:
```
# Solana RPC endpoint (use a reliable endpoint)
SOLANA_RPC=https://api.mainnet-beta.solana.com

# Token mint address on Solana
TOKEN_MINT_ADDRESS=your_token_mint_address

# Optional: Supabase credentials for storing results
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_TABLENAME=snapshot_data
```

## Running the Snapshot

```bash
npm run snapshot
```

## Output

The script will output a JSON file `snapshot_results.json` with all token holders and their balances at the time of the snapshot. The format will be:

```json
{
  "walletAddress1": "1000000000",
  "walletAddress2": "2500000000"
}
```

## Customization

You can modify the snapshot.ts file to:
- Filter accounts based on minimum balance
- Include only specific accounts
- Adjust the output format
- Change the token decimal handling

## Next Steps

After generating the snapshot, you can use the output file to:
1. Generate claim amounts in the claim-amount directory
2. Create a Merkle tree in the merkle directory 