import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import supabase from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

// ClientOnly wrapper component to prevent SSR errors with wagmi hooks
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}

// Helper function for better address formatting
const formatDisplayAddress = (address: string | undefined | null): string => {
  if (!address) return '';
  if (address.length <= 16) return address;
  
  // For longer addresses, show first 8 and last 8 characters
  return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
};

// Main component without wagmi hooks
function WalletConnectorInner() {
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRainbowKit, setShowRainbowKit] = useState(false);
  
  // Get account from wagmi for Rainbow wallet - this is now safely wrapped in ClientOnly
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();

  // Reset RainbowKit visibility when connection status changes
  useEffect(() => {
    if (isEvmConnected) {
      setShowRainbowKit(false);
    }
  }, [isEvmConnected]);

  // Check if the wallet addresses are already registered
  const checkIfAlreadyRegistered = async (solAddress: string, evmAddr: string) => {
    // Check if solana address already exists
    const { data: solData, error: solError } = await supabase
      .from('registered_users')
      .select('id')
      .eq('solana_address', solAddress)
      .limit(1);
    
    if (solError) {
      console.error('Error checking Solana address:', solError);
      return { isRegistered: false, error: solError.message };
    }
    
    if (solData && solData.length > 0) {
      return { 
        isRegistered: true, 
        error: 'This Solana wallet address has already been registered for migration. Each Solana address can only be registered once.' 
      };
    }
    
    // Check if evm address already exists
    const { data: evmData, error: evmError } = await supabase
      .from('registered_users')
      .select('id')
      .eq('evm_address', evmAddr)
      .limit(1);
    
    if (evmError) {
      console.error('Error checking EVM address:', evmError);
      return { isRegistered: false, error: evmError.message };
    }
    
    if (evmData && evmData.length > 0) {
      return { 
        isRegistered: true, 
        error: 'This Base wallet address has already been registered for migration. Each Base address can only be registered once.' 
      };
    }
    
    return { isRegistered: false, error: null };
  };

  // Handle Phantom wallet connection
  const connectPhantom = async () => {
    try {
      // Check if Phantom wallet is installed
      const isPhantomInstalled = window.phantom?.solana?.isPhantom || false;
      
      if (!isPhantomInstalled) {
        setErrorMessage('Phantom wallet is not installed. Please install it first.');
        return null;
      }

      // Connect to Phantom wallet
      if (window.phantom?.solana) {
        const { publicKey } = await window.phantom.solana.connect();
        const phantomAddress = publicKey.toString();
        setSolanaAddress(phantomAddress);
        return phantomAddress;
      } else {
        setErrorMessage('Phantom wallet is not available.');
        return null;
      }
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      setErrorMessage('Failed to connect to Phantom wallet');
      return null;
    }
  };

  // Connect another Solana wallet (for future extension)
  const connectOtherSolanaWallet = async () => {
    // This would implement connection to other Solana wallets
    setErrorMessage('Only Phantom wallet is supported for Solana currently');
    return null;
  };

  // Handle Solana wallet connection
  const handleSolanaConnection = async () => {
    try {
      // Check if Base wallet is connected first
      if (!isEvmConnected) {
        setErrorMessage('You must connect a Base wallet before connecting a Solana wallet');
        return;
      }
      
      const solAddress = await connectPhantom();
      if (solAddress) {
        setSolanaAddress(solAddress);
      }
    } catch (error) {
      console.error('Error connecting Solana wallet:', error);
      setErrorMessage('Failed to connect Solana wallet');
    }
  };

  // Save wallet addresses to Supabase
  const saveWalletAddresses = async () => {
    if (!solanaAddress || !evmAddress) {
      setErrorMessage('Both Solana and Base wallets must be connected');
      return;
    }

    setRegistrationStatus('loading');
    
    try {
      // Check if either address is already registered
      const { isRegistered, error: checkError } = await checkIfAlreadyRegistered(solanaAddress, evmAddress);
      
      if (isRegistered) {
        setErrorMessage(checkError);
        setRegistrationStatus('error');
        return;
      }
      
      const { error } = await supabase.from('registered_users').insert({
        solana_address: solanaAddress,
        evm_address: evmAddress
      });

      if (error) {
        console.error('Error saving wallet addresses:', error);
        // Check for duplicate key error as a fallback
        if (error.message.includes('duplicate key value') && error.message.includes('registered_users_solana_address_key')) {
          setErrorMessage(
            'This Solana wallet address has already been registered for migration. Each Solana address can only be registered once.'
          );
        } else if (error.message.includes('duplicate key value') && error.message.includes('registered_users_evm_address_key')) {
          setErrorMessage(
            'This Base wallet address has already been registered for migration. Each Base address can only be registered once.'
          );
        } else {
          setErrorMessage(error.message);
        }
        setRegistrationStatus('error');
      } else {
        setRegistrationStatus('success');
        setErrorMessage(null);
      }
    } catch (err) {
      console.error('Error saving wallet addresses:', err);
      setErrorMessage('An unexpected error occurred');
      setRegistrationStatus('error');
    }
  };

  // Custom connect button that shows warning first
  const CustomConnectButton = () => (
    <button
      onClick={() => {
        setShowRainbowKit(true);
        // Directly click the Rainbow connect button
        setTimeout(() => {
          const connectButton = document.querySelector('[data-testid="rk-connect-button"]');
          if (connectButton instanceof HTMLElement) {
            connectButton.click();
          }
        }, 100);
      }}
      className="btn-secondary text-sm bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 border-blue-200 shadow-sm hover:shadow transition-all duration-300"
    >
      Connect Base
    </button>
  );

  return (
    <div className="window max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="mb-4 text-center text-gray-800">Connect Your Wallets</h1>
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="mb-4 text-gray-700">Wallet Connection</h2>
        </div>
        
        <div className="space-y-4">
          {/* Base Wallet Connection */}
          <div className="bg-white p-4 shadow-sm border border-gray-100 rounded-lg hover:shadow transition-shadow duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="label text-gray-700">Base Wallet</p>
              {!isEvmConnected && !showRainbowKit && <CustomConnectButton />}
              {(showRainbowKit || isEvmConnected) && <ConnectButton />}
            </div>
            {isEvmConnected && evmAddress && (
              <div className="flex items-center mt-2 w-full">
                <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-green-500 shadow-sm" />
                <p className="text-gray-600 font-mono text-sm">
                  {formatDisplayAddress(evmAddress)}
                </p>
              </div>
            )}
          </div>

          {/* Solana Wallet Section */}
          <div className={`bg-white p-4 shadow-sm border border-gray-100 rounded-lg hover:shadow transition-shadow duration-300 ${!isEvmConnected ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="label text-gray-700">Solana Wallet</p>
              {!solanaAddress && (
                <button
                  onClick={handleSolanaConnection}
                  disabled={!isEvmConnected}
                  className={`btn-secondary text-sm bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 border-blue-200 shadow-sm hover:shadow transition-all duration-300 ${!isEvmConnected ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {!isEvmConnected ? 'Connect Base First' : 'Connect Phantom'}
                </button>
              )}
            </div>
            <div className="flex items-center w-full">
              <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                solanaAddress ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <p className="text-gray-600 font-mono text-sm">
                {solanaAddress ? formatDisplayAddress(solanaAddress) : (!isEvmConnected ? 'Connect Base wallet first' : 'Not connected')}
              </p>
            </div>

            {typeof window !== 'undefined' && !window.phantom?.solana?.isPhantom && !solanaAddress && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                <p className="text-sm text-yellow-700">
                  Phantom wallet not detected. Please install{' '}
                  <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Phantom wallet
                  </a>{' '}
                  to connect your Solana wallet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
              <div className="mt-1 text-sm text-red-700">
                {errorMessage}
              </div>
              {errorMessage.includes('already been registered') && (
                <div className="mt-2 text-sm">
                  <a href="/claim" className="font-medium text-red-800 underline hover:text-red-600">
                    Go to claim page
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {registrationStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Registration Successful</h3>
              <div className="mt-1 text-sm text-green-700">
                Your wallets have been successfully registered for the Solana to Base migration. 
                You can now proceed to the claim page when the migration is ready.
              </div>
              <div className="mt-2 text-sm">
                <a href="/claim" className="font-medium text-green-800 underline hover:text-green-600">
                  Go to claim page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {solanaAddress && evmAddress && registrationStatus !== 'success' && (
        <button
          onClick={saveWalletAddresses}
          disabled={registrationStatus === 'loading'}
          className={`py-3 px-4 w-full rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors ${
            registrationStatus === 'loading' ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {registrationStatus === 'loading' ? (
            <><LoadingSpinner size="sm" className="mr-2" /> Registering...</>
          ) : (
            'Register for Migration'
          )}
        </button>
      )}
    </div>
  );
}

// Export a wrapped version that only runs on the client
export default function WalletConnector() {
  return (
    <ClientOnly>
      <WalletConnectorInner />
    </ClientOnly>
  );
} 