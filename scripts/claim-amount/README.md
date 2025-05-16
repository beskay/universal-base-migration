# Claim Amount Generator

This directory contains scripts for calculating claim amounts for token migration.

## Purpose

The claim amount generator takes the token balances from a Solana snapshot and applies a conversion rate to determine how many tokens each address will receive on Base.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
# Conversion rate (e.g., 0.1 means users get 0.1 Base tokens for each Solana token)
CONVERSION_RATE=0.1

# Decimals for the source token (Solana)
SOURCE_TOKEN_DECIMALS=9

# Decimals for the destination token (Base)
DESTINATION_TOKEN_DECIMALS=18

# Optional: Supabase credentials for storing results
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_TABLENAME=claim_amounts
```

## Input

The script expects a `snapshot_results.json` file in the following format:
```json
{
  "walletAddress1": "1000000000",
  "walletAddress2": "2500000000"
}
```

You can obtain this file from the `/scripts/snapshot` directory after running a snapshot.

## Running the Script

```bash
npm run generate
```

## Output

The script generates `addresses.json` which contains:
```json
{
  "0xMappedAddress1": 100000000000000000,
  "0xMappedAddress2": 250000000000000000
}
```

This output file can be used directly with the Merkle tree generator in the `/scripts/merkle` directory.

## Customization

You can modify the script to:
- Add custom mapping between Solana and EVM addresses
- Apply different conversion rates for different tiers
- Add minimum or maximum claim amounts
- Apply vesting schedules 