# UOS Token Balance Snapshot Script

This script takes a snapshot of UOS token balances for all registered users in the system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file by copying `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (not the anon key)
- `EXTRNODE_RPC_URL`: (Optional) Your ExtrNode RPC URL with API key

## Running the Script

To take a snapshot:
```bash
npm run snapshot
```

The script will:
1. Fetch all registered users from the `registered_users` table
2. Get their UOS token balances using multiple RPC endpoints for reliability
3. Store the results in the `snapshot_data` table
4. Print a summary of the results including:
   - Number of successful/failed addresses
   - Total UOS tokens
   - Average UOS per holder
   - Maximum and minimum balances

## Error Handling

- The script uses multiple RPC endpoints for reliability
- Failed addresses are logged and can be retried
- Rate limiting is handled with batch processing and delays
- All errors are logged for debugging

## Database Schema

The script expects the following tables in Supabase:

```sql
-- Table of registered users
CREATE TABLE registered_users (
  id SERIAL PRIMARY KEY,
  solana_address TEXT NOT NULL UNIQUE,
  evm_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for snapshot data
CREATE TABLE snapshot_data (
  id SERIAL PRIMARY KEY,
  solana_address TEXT NOT NULL REFERENCES registered_users(solana_address),
  evm_address TEXT NOT NULL,
  uos_balance TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
``` 