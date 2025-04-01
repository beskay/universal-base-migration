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

  useEffect(() => {
    setMounted(true);

    if (isBrowser) {
      setTimeout(() => {
        logProviderInfo();
      }, 1000);
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

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
          logo: '/new-logo.jpeg'
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
}