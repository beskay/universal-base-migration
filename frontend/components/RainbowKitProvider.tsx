import { ReactNode, useEffect, useState } from 'react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base } from '@wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { 
  RainbowKitProvider as RKProvider, 
  connectorsForWallets,
  lightTheme
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  rainbowWallet,
  braveWallet,
  ledgerWallet
} from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

interface RainbowKitProviderProps {
  children: ReactNode;
}

// This is a placeholder - replace with your actual project ID from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required');

// Configure chains & providers
const { chains, publicClient } = configureChains(
  [base],
  [publicProvider()]
);

// Set up custom wallet list
const connectors = connectorsForWallets([
  {
    groupName: 'Popular',
    wallets: [
      metaMaskWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'UOS/WETH Airdrop', chains }),
      walletConnectWallet({ projectId, chains }),
      trustWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
      braveWallet({ chains }),
      ledgerWallet({ projectId, chains })
    ],
  }
]);

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors
});

export default function RainbowKitProvider({ children }: RainbowKitProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // This is to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // This prevents hydration errors
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiConfig config={config}>
      <RKProvider 
        chains={chains} 
        theme={lightTheme({
          accentColor: '#3b82f6',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          fontStack: 'system'
        })}
        modalSize="compact"
      >
        {children}
      </RKProvider>
    </WagmiConfig>
  );
} 