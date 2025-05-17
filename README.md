# Universal Migration Tool

A comprehensive tool for migrating tokens from Solana to Base blockchain, providing a seamless experience for token holders.

## Core Features

- **Cross-Chain Migration**: Move tokens securely from Solana to Base with integrity validation
- **Merkle Proof Verification**: Secure claim system using cryptographic proofs
- **Snapshot Generation**: Automated tools to capture token holder state on Solana
- **User-Friendly Interface**: Clean frontend for simplified claim process

## Technology Stack

### Backend
- **Supabase**: Database and authentication for migration records
- **Merkle Trees**: Cryptographic proof generation for secure claims
- **Smart Contracts**: Solidity contracts for on-chain verification

### Frontend
- **Next.js**: React framework for the user interface
- **Vercel**: Deployment platform with CI/CD integration
- **Web3 Integration**: Wallet connection for blockchain interactions

## Implementation Overview

The migration process follows these steps:

1. **Snapshot Generation**: Capture token balances on Solana
2. **Merkle Tree Creation**: Generate proofs for all eligible addresses
3. **Deployment**: Smart contracts deployed to Base blockchain
4. **Claim System**: User-friendly interface for claiming migrated tokens

## Project Structure

```
.
├── contracts/          # Smart contract development
│   ├── src/          # Contract source files
│   ├── test/         # Contract tests
│   └── script/       # Deployment scripts
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   └── lib/          # Utility functions
├── scripts/          # Token migration scripts
│   ├── snapshot/     # Solana snapshot tools
│   ├── claim-amount/ # Claim amount calculation
│   └── merkle/       # Merkle proof generation
```

## Deployment

The application is deployed on Vercel, providing:
- Automatic deployments from the main branch
- Custom domain configuration
- Performance monitoring
- Edge network distribution

## Supabase Integration

Supabase powers the backend with:
- User authentication
- Migration records storage
- API endpoints for claim status
- Real-time updates for claim process

## Development

### Prerequisites
- Node.js >= 18
- PNPM >= 8
- Foundry (for contract development)
- Solana CLI tools (for snapshot generation)

### Setup
```bash
# Install dependencies
pnpm install

# Start frontend development server
pnpm dev

# Run contract tests
pnpm test
```

### Environment Variables
Copy `.env.example` to `.env` and fill in the required variables:
```bash
# Supabase (for database storage)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# Solana Configuration (for snapshot)
EXTRNODE_RPC_URL=
TOKEN_MINT_ADDRESS=

# Token Configuration (for claim amount calculation)
TOKEN_DECIMALS=18
TOKEN_SYMBOL=TOKEN
CLAIM_POOL_AMOUNT=100000
MIGRATION_RATIO=0.1
FIXED_RATIO=false
```

## Security Features

- Merkle proof verification for secure claims
- Secure wallet authentication
- Rate limiting on claim requests
- Multi-sig treasury management

## License

MIT 