import { ReactNode, useEffect, useState } from 'react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base } from '@wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { createWeb3Modal } from '@web3modal/wagmi';

interface Web3ModalProviderProps {
  children: ReactNode;
}

// Replace with your project ID from WalletConnect Cloud
// You can get one from https://cloud.walletconnect.com/
// This is a placeholder to prevent runtime errors - you must replace with your actual project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required');

export default function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Configure chains & providers
  const { chains, publicClient } = configureChains(
    [base],
    [publicProvider()]
  );

  // Set up wagmi config
  const config = createConfig({
    autoConnect: true,
    publicClient,
  });
  
  // Only create Web3Modal instance if projectId is available and we're in the browser
  useEffect(() => {
    if (typeof window !== 'undefined' && projectId) {
      try {
        createWeb3Modal({
          wagmiConfig: config,
          projectId,
          chains,
          themeMode: 'light',
          
          // Only include specific trusted wallets
          // This is the most reliable way to ensure only approved wallets are available
          includeWalletIds: [
            // MetaMask - confirmed ID
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
            // Coinbase Wallet - confirmed ID
            'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
            // Rainbow
            '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
            // Trust Wallet
            '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
            // Rabby Wallet
            '1824ae268e5494adb8560d0e9eaab53f6cec4347672a07e8bb7f5d32f011a95a',
            // Brave Wallet
            'f5b4eeb6015d66be3f5940a895cbaa49ef3439e518cd771270e6b553b48f31d2',
            // Exodus
            '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26',
            // OKX Wallet
            '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709',
            // Zerion
            'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18',
            // Frame
            '808da5321462e41bf9a7fda09c0e0ca2dc49bbfd3da9edf7d8b4c9d0a24db77c',
            // Frontier
            '4d3a948663a13cfcf9200d0c89c3bb48735930bcdb062f90cccdfa6f06d6cd4e',
            // Taho (formerly Tally Ho)
            'f896cbca30c2d0bda09a499c16f4526cbc91e3ee736d4cae30f2d4d22c936adc',
            // Coin98
            'b825bd328fade924c1dfe595571f3e7511063c3edbded60d23818f1d7b7219dd',
            // MathWallet
            '9994b72a9d2c852848e3306785b06bd516d4a028451880990fee79ad3b39459b'
          ],
          
          // Also exclude known problematic wallets (belt and suspenders approach)
          excludeWalletIds: [
            '3f603a19c48ad574bc66c8995ff790693f6f5a9f94c83a8a73428c22b8721278', // Phantom wallet - explicitly excluded to prevent EVM connection issues
            // Removed as per instructions
          ],
        });
      } catch (error) {
        console.error('Error creating Web3Modal:', error);
      }
    }
  }, [config, chains]);

  // Apply custom theme variables using CSS
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--w3m-accent-color', '#3b82f6');
      document.documentElement.style.setProperty('--w3m-background-color', 'rgba(255, 255, 255, 0.6)');
      document.documentElement.style.setProperty('--w3m-font-family', 'Inter, sans-serif');
      document.documentElement.style.setProperty('--w3m-border-radius-master', '0.75rem');
    }
  }, []);

  // This prevents hydration errors
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiConfig config={config}>
      {children}
    </WagmiConfig>
  );
} 