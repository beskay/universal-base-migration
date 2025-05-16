# Merkle Tree Generator

This directory contains scripts for generating a Merkle tree and proofs for token migration.

## Usage

1. Make sure you have addresses and balances in `addresses.json` with the format:
```json
{
  "0xUserAddress1": "1000000000000000000",
  "0xUserAddress2": "2000000000000000000"
}
```

2. Run the script to generate Merkle tree and proofs:
```bash
npm install
node generateMerkletree.js
```

3. The script will:
   - Generate the Merkle tree
   - Compute proofs for each address
   - Save results to `merkleTree.json`
   - Optionally upload to Supabase (if configured)

## Configuration

This script uses the `.env` file in the parent `scripts` directory. Make sure it includes Supabase configuration:
```
# Supabase configuration (needed for database storage)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Output Format

The `merkleTree.json` file will contain:
```json
{
  "root": "0x...",
  "proofs": {
    "0xAddress1": {
      "balance": "1000000000000000000",
      "proof": ["0x...", "0x..."]
    },
    "0xAddress2": {
      "balance": "2000000000000000000",
      "proof": ["0x...", "0x..."]
    }
  }
}
```

You'll need this Merkle root in your smart contract for verification. 