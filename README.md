# UOS/WETH Migration

This repository contains the smart contracts and frontend application for the UOS/WETH token migration from Solana to Base. The migration process involves taking a snapshot of SOL/UOS token holders, generating Merkle proofs for claims, and implementing a secure claim system.

## Implementation Overview

The migration is implemented through several key components:

### Smart Contracts (`/contracts`)
- Merkle claim contract for secure token distribution
- WETH token contract with migration functionality
- Verification system for Merkle proofs

### Frontend (`/frontend`)
- Next.js application for token claims
- Privy wallet integration for secure authentication
- Real-time claim status and balance checking
- Merkle proof verification on-chain

### Scripts (`/scripts`)
- Snapshot generation from Solana blockchain
- Merkle tree generation for claims
- Data processing utilities for migration

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
└── docs/            # Documentation
```

## Quick Start

### Prerequisites
- Node.js >= 18
- PNPM >= 8
- Foundry (for contract development)
- Solana CLI tools (for snapshot generation)

### Installation
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
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_UOS_TOKEN_ADDRESS=
```

## Features

- SOL/UOS holder snapshot
- 0.1:1 UOS/WETH airdrop
- Privy wallet integration
- Merkle proof verification
- Real-time claim status updates
- Secure authentication system

## Tokenomics & Migration

The UOS token serves as the core utility and governance token for the Universal Operating System (uOS) protocol, a meta-framework that provides a unified interface for interacting with multiple AI platforms. The protocol facilitates seamless communication and interoperability between technologies while preserving their native functionality.

### Total Supply: 1,000,000 UOS

The token distribution is structured as follows:

- **SOL/UOS Migration (10%)**: 100,000 UOS allocated for the transition from Solana to Base
  - All UOS/SOL holders receive 0.1:1 UOS/WETH
  - Claims available via uos.earth
  - Immediate availability upon launch

- **Protocol Emissions (60%)**: 600,000 UOS for vote-escrow mechanism
  - Lock periods: 1 week to 2 years
  - Weekly reward distributions
  - Revenue sharing from protocol fees
  - Multiple lock positions via veNFTs

- **Development & Operations (20%)**: 200,000 UOS
  - Treasury: 10% (100,000 UOS) - DAO governed with 4-year linear vesting
  - Team: 10% (100,000 UOS) - 4-year linear vesting via Sablier

- **Liquidity (10%)**: 100,000 UOS
  - Initial DEX Liquidity: 1% (10,000 UOS) for Uniswap v2 pair bootstrapping
  - LP Staking Rewards: 9% (90,000 UOS) distributed through Pool2

### Revenue Streams
The token facilitates multiple revenue streams including:
- App Store Revenue: Fees from app sales and subscriptions
- Premium OS Features: Subscription fees for enhanced storage and features
- Agent Task Fees: Fees from AI agent operations
- Tokenized IP Revenue: Royalties from AI-generated content
- Infrastructure Fees: Hosting and OS usage fees

## Development

### Frontend
```bash
cd frontend
pnpm dev
```

### Contracts
```bash
cd contracts
forge test
```

### Scripts
```bash
cd scripts
pnpm generate-merkle
```

## Deployment

The application is deployed on Vercel. Each push to `main` triggers a new deployment.

## Security

The migration process implements several security measures:
- Merkle proof verification for secure claims
- Privy wallet integration for secure authentication
- Rate limiting on claim requests
- Multi-sig treasury management
- Linear vesting for team and treasury allocations

## License

MIT 