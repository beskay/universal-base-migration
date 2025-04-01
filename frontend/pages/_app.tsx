// Simple script to block Phantom's EVM functionality
import { blockPhantomEVM } from '../lib/walletUtils';

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import PageLoader from '../components/PageLoader';
import { Inter } from 'next/font/google';
import ErrorBoundary from '../components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

// Clean up any existing wallet connections
const cleanupWalletConnections = () => {
  if (typeof window === 'undefined') return;
  
  // Block Phantom EVM
  blockPhantomEVM();
  
  try {
    // Clean up any existing WalletConnect sessions to avoid conflicts
    localStorage.removeItem('walletconnect');
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
    
    // Remove any Web3Modal data
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith('wc@') || 
        key.startsWith('W3M') || 
        key.startsWith('wagmi') ||
        key.startsWith('rk-') ||
        key.includes('wallet')
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error cleaning up wallet connections:', error);
  }
};

// Run cleanup on load
if (typeof window !== 'undefined') {
  cleanupWalletConnections();
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Block Phantom EVM on component mount as well
  useEffect(() => {
    cleanupWalletConnections();
  }, []);

  // Clean up wallet connections on route change
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setLoading(true);
      cleanupWalletConnections();
    };
    
    const handleRouteChangeComplete = () => {
      setLoading(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeComplete);
    };
  }, [router]);

  return (
    <ErrorBoundary>
      <div className={inter.className}>
        {loading && <PageLoader />}
        <Component {...pageProps} />
      </div>
    </ErrorBoundary>
  );
}

export default MyApp; 