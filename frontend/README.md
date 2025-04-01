# UOS/WETH Airdrop System Frontend

This is the frontend for the UOS/WETH Airdrop System. It allows users to connect their Solana and EVM wallets via Privy and register for the airdrop.

## Features

- Connect Solana wallet via Privy
- Connect EVM wallet via Privy
- Register both wallet addresses in Supabase
- Simple and clean UI with Tailwind CSS

## Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account with a project set up
- Privy account with an app set up

## Setup

1. Clone the repository
2. Install dependencies:

```bash
cd frontend
npm install
# or
yarn install
```

3. Create a `.env.local` file based on `.env.local.example` and fill in your Supabase and Privy credentials:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

4. Set up your Supabase database with the following table:

```sql
CREATE TABLE registered_users (
  solana_address TEXT PRIMARY KEY,
  evm_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## Production

Build the application for production:

```bash
npm run build
# or
yarn build
```

Start the production server:

```bash
npm start
# or
yarn start
```

## User Flow

1. User connects Solana wallet via Privy
2. User connects EVM wallet via Privy
3. System saves both wallet addresses to Supabase
4. Later, after snapshot and Merkle tree generation, users can return to claim their airdrop

## Project Structure

- `components/` - React components
  - `PrivyProvider.tsx` - Privy authentication provider
  - `WalletConnector.tsx` - Component for connecting wallets
- `lib/` - Utility functions and libraries
  - `supabase.ts` - Supabase client
- `pages/` - Next.js pages
  - `_app.tsx` - Main app component
  - `index.tsx` - Home page
- `styles/` - CSS styles
  - `globals.css` - Global styles with Tailwind CSS

## Technologies Used

- Next.js - React framework
- Privy - Wallet connection
- Supabase - Database
- Tailwind CSS - Styling
- TypeScript - Type safety

## Wallet Connection Flow

The application implements a structured wallet connection flow:

1. **Initial Login**: Users start by logging in with Privy authentication.
2. **Connect Solana Wallet**: After login, users connect their Phantom wallet on the Solana network.
3. **Connect Ethereum Wallet**: Once the Solana wallet is connected, users connect their Ethereum wallet (MetaMask recommended).
4. **Complete**: When both wallets are connected, users can view their wallet addresses and UOS balance.

## Important Notes for Users

### Connecting Phantom Wallet (Solana)

When connecting your Phantom wallet, please ensure you're on the Solana network:

1. Open your Phantom wallet
2. Click on the network name at the top (it might say 'Ethereum')
3. Select 'Solana' from the dropdown
4. Only then proceed with the connection in our app

If you encounter a "No wallets available" error, use the "Connect Directly to Phantom" button provided in the interface.

### Connecting MetaMask (Ethereum)

When connecting your Ethereum wallet:

1. Select MetaMask or your preferred Ethereum wallet from the list
2. Ensure you're on the Ethereum mainnet
3. Approve the connection request

## Development Guide

### Environment Variables

The application requires the following environment variables:

```
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_SOLANA_RPC_URL=your-solana-rpc-url
NEXT_PUBLIC_UOS_TOKEN_ADDRESS=your-uos-token-address
```

### Key Components

- **useWallet Hook**: Manages wallet connections and state
- **WalletConnect Component**: Provides the UI for the wallet connection flow
- **Privy Configuration**: Configures the authentication and wallet connection options

### Wallet Connection Implementation

The application uses a direct connection to Phantom's Solana API to ensure users connect to the Solana network, avoiding issues with Phantom defaulting to Ethereum. The connection flow is managed through the `connectionStep` state variable, which tracks the current step in the process.

## Troubleshooting

### Phantom Connecting to Ethereum Instead of Solana

If Phantom is connecting to Ethereum instead of Solana:

1. Open Phantom wallet
2. Click on the network name at the top
3. Select 'Solana' from the dropdown
4. Disconnect from the app if already connected
5. Reconnect using the "Connect Directly to Phantom" button

### Wallet Connection Errors

If you encounter errors connecting your wallets:

1. Ensure you have the latest version of the wallet extensions
2. Try refreshing the page
3. Clear your browser cache
4. Make sure you're approving the connection requests in your wallet

## License

This project is licensed under the MIT License - see the LICENSE file for details. 