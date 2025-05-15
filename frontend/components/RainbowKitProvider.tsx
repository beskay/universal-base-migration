import React, { ReactNode, useEffect, useState } from 'react';
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

// Make sure projectId is only accessed on the client side
const getProjectId = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
  }
  return '';
};

// Configure chains & providers
const { chains, publicClient } = configureChains(
  [base],
  [publicProvider()]
);

// Create a client-side only provider wrapper
function ClientSideProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  useEffect(() => {
    // Get project ID
    const projectId = getProjectId();
    if (!projectId) {
      console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing');
    }

    // Set up custom wallet list
    const connectors = connectorsForWallets([
      {
        groupName: 'Popular',
        wallets: [
          metaMaskWallet({ projectId, chains }),
          coinbaseWallet({ appName: 'Solana to Base Migration', chains }),
          walletConnectWallet({ projectId, chains }),
          trustWallet({ projectId, chains }),
          rainbowWallet({ projectId, chains }),
          braveWallet({ chains }),
          ledgerWallet({ projectId, chains })
        ],
      }
    ]);

    // Set up wagmi config
    const wagmiConfig = createConfig({
      autoConnect: true,
      publicClient,
      connectors
    });

    setConfig(wagmiConfig);
    setMounted(true);
  }, []);

  // This prevents SSR issues
  if (!mounted || !config) {
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

export default function RainbowKitProvider({ children }: RainbowKitProviderProps) {
  return <ClientSideProvider>{children}</ClientSideProvider>;
} 