# Claim Amount Generator

This directory contains scripts to generate claim amounts for a token migration based on snapshot balances.

## Overview

The claim amount generator:
1. Reads token balances from the Supabase database
2. Calculates each user's proportional share of the claim pool
3. Outputs a JSON file mapping addresses to claim amounts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the parent `scripts` directory with the following variables:
```
# Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Token configuration
TOKEN_DECIMALS=18
TOKEN_SYMBOL=YOUR_TOKEN
CLAIM_POOL_AMOUNT=100000
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| TOKEN_DECIMALS | Number of decimal places for the token | 18 |
| TOKEN_SYMBOL | Symbol used in logs and output | TOKEN |
| CLAIM_POOL_AMOUNT | Total number of tokens to distribute | 100000 |

## Running the Generator

```bash
npm run generate
```

## Output

The script generates an `addresses.json` file containing the mapping of EVM addresses to claim amounts. This file is structured as:

```json
{
  "0xAddress1": "1000000000000000000000",
  "0xAddress2": "500000000000000000000"
}
```

These values are the raw token amounts (including decimals) that will be used in the merkle tree generation.

## Notes

- The distribution is proportional to users' balances from the snapshot
- A minimum claim amount of 1 token is guaranteed for any user with a positive balance
- Rounding errors are adjusted to ensure the exact claim pool amount is distributed

## Next Steps

After generating claim amounts:
1. Use the `addresses.json` file to generate a merkle tree in the merkle directory
2. Deploy the contract with the merkle root
3. Configure the frontend with the contract address 