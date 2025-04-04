import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import { ReactNode, useEffect, useState } from 'react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base } from '@wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { isBrowser, logProviderInfo } from '../lib/walletUtils';

interface PrivyProviderProps {
  children: ReactNode;
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [privyInitialized, setPrivyInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Safely log provider info
    if (isBrowser) {
      try {
        setTimeout(() => {
          logProviderInfo();
        }, 1000);
      } catch (error) {
        console.error("Error logging provider info:", error);
      }
    }

    // Check if Privy App ID is available
    if (process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
      setPrivyInitialized(true);
    } else {
      console.warn("Privy App ID not found. Authentication features will be limited.");
    }
  }, []);

  // If not mounted, render children without Privy
  if (!mounted) {
    return <>{children}</>;
  }

  // If Privy is not initialized, render children without Privy
  if (!privyInitialized) {
    return <>{children}</>;
  }

  // Configure wagmi
  try {
    const { chains, publicClient } = configureChains(
      [base],
      [publicProvider()]
    );

    const config = createConfig({
      autoConnect: false,
      publicClient,
    });

    return (
      <PrivyAuthProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
        config={{
          loginMethods: ['wallet'],
          appearance: {
            theme: 'light',
            accentColor: '#3b82f6', // primary color
          },
          embeddedWallets: {
            createOnLogin: 'all-users',
            noPromptOnSignature: true,
          },
          supportedChains: [base],
          walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
        }}
      >
        <WagmiConfig config={config}>
          {children}
        </WagmiConfig>
      </PrivyAuthProvider>
    );
  } catch (error) {
    console.error("Error setting up Privy/Wagmi:", error);
    return <>{children}</>;
  }
}