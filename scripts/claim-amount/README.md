# Claim Amount Generator

This directory contains scripts to generate claim amounts for a token migration based on snapshot balances.

## Overview

The claim amount generator:
1. Reads token balances from the Supabase database
2. Calculates each user's claim amount based on configuration
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

# Migration ratio configuration
MIGRATION_RATIO=0.1
FIXED_RATIO=false
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| TOKEN_DECIMALS | Number of decimal places for the token | 18 |
| TOKEN_SYMBOL | Symbol used in logs and output | TOKEN |
| CLAIM_POOL_AMOUNT | Total number of tokens to distribute | 100000 |
| MIGRATION_RATIO | The ratio of tokens to distribute per Solana token (e.g., 0.1:1) | 0.1 |
| FIXED_RATIO | Whether to use a fixed ratio (true) or proportional distribution (false) | false |

## Distribution Methods

The script supports two methods for calculating claim amounts:

### 1. Proportional Distribution (FIXED_RATIO=false)

In this mode, the script:
- Distributes the `CLAIM_POOL_AMOUNT` proportionally based on users' balances
- Each user gets a share of the pool proportional to their share of the total balance
- The total distributed amount will exactly match `CLAIM_POOL_AMOUNT`

### 2. Fixed Ratio Distribution (FIXED_RATIO=true)

In this mode, the script:
- Applies the `MIGRATION_RATIO` directly to each user's balance
- For example, with a ratio of 0.1, a user with 100 tokens on Solana gets 10 tokens on Base
- The total distributed amount may differ from `CLAIM_POOL_AMOUNT`

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

- A minimum claim amount of 1 token is guaranteed for any user with a positive balance
- When using proportional distribution, rounding errors are adjusted to ensure the exact claim pool amount is distributed

## Next Steps

After generating claim amounts:
1. Use the `addresses.json` file to generate a merkle tree in the merkle directory
2. Deploy the contract with the merkle root
3. Configure the frontend with the contract address 