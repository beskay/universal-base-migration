import { usePrivy, type WalletWithMetadata } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { blockPhantomEVM, isPhantomEVM } from '../lib/walletUtils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import WarningModal from './WarningModal';

export default function WalletConnector() {
  const { login, authenticated, user, ready } = usePrivy();
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showRainbowKit, setShowRainbowKit] = useState(false);
  
  // Get account from wagmi for Rainbow wallet
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();

  // Block Phantom EVM on component mount
  useEffect(() => {
    blockPhantomEVM();
  }, []);

  // Reset RainbowKit visibility when connection status changes
  useEffect(() => {
    if (isEvmConnected) {
      setShowRainbowKit(false);
    }
  }, [isEvmConnected]);

  useEffect(() => {
    if (ready && authenticated && user) {
      // Get connected wallets
      const wallets = (user.linkedAccounts || []).filter((account): account is WalletWithMetadata => 
        account.type === 'wallet'
      );
      
      // ONLY find Solana wallet
      const solanaWallet = wallets.find(wallet => 
        wallet.walletClientType === 'solana'
      );
      
      if (solanaWallet?.address) {
        setSolanaAddress(solanaWallet.address);
      }
    }
  }, [ready, authenticated, user]);

  const handleWalletConnection = async (walletType: 'solana') => {
    try {
      // Block Phantom EVM before connecting
      blockPhantomEVM();
      
      // Check if EVM wallet is connected first
      if (!isEvmConnected) {
        setErrorMessage('You must connect an EVM wallet before connecting a Solana wallet');
        return;
      }
      
      // For Solana, allow any Solana wallet using Privy
      await login();
    } catch (error) {
      console.error(`Error connecting ${walletType} wallet:`, error);
      setErrorMessage(`Failed to connect ${walletType} wallet`);
    }
  };

  // Save wallet addresses to Supabase
  const saveWalletAddresses = async () => {
    if (!solanaAddress || !evmAddress) {
      setErrorMessage('Both Solana and EVM wallets must be connected');
      return;
    }

    setRegistrationStatus('loading');
    
    try {
      const { error } = await supabase.from('registered_users').insert({
        solana_address: solanaAddress,
        evm_address: evmAddress
      });

      if (error) {
        console.error('Error saving wallet addresses:', error);
        setErrorMessage(error.message);
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

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  // Custom connect button that shows warning first
  const CustomConnectButton = () => (
    <button
      onClick={() => setShowWarningModal(true)}
      className="btn-secondary text-sm bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 border-blue-200 shadow-sm hover:shadow transition-all duration-300"
    >
      Connect EVM
    </button>
  );

  return (
    <div className="window max-w-md mx-auto p-6">
      <h1 className="mb-4 text-center">Airdrop Registration</h1>
      
      <p className="text-base text-secondary mb-8 text-center">
        Connect your Solana and EVM wallets to register for the airdrop.
        After registration, you will be eligible to claim your WETH airdrop based on your UOS holdings.
      </p>
      
      {!authenticated && !isEvmConnected ? (
        <div className="text-center">
          <button
            onClick={() => setShowWarningModal(true)}
            className="btn-primary w-full"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="mb-4">Connect Your Wallets</h2>
            
            <div className="space-y-4">
              {/* RainbowKit Wallet Connection */}
              <div className="window p-4 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-shadow duration-300">
                <div className="flex items-center justify-between mb-2">
                  <p className="label">EVM Wallet</p>
                  {!isEvmConnected && !showRainbowKit && <CustomConnectButton />}
                  {(showRainbowKit || isEvmConnected) && <ConnectButton />}
                </div>
                {isEvmConnected && evmAddress && (
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 rounded-full mr-2 bg-success shadow-sm shadow-green-500/20" />
                    <p className="text-value truncate max-w-[240px]">
                      {evmAddress}
                    </p>
                  </div>
                )}
              </div>

              {/* Solana Wallet Section - Using Privy */}
              <div className={`window p-4 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-shadow duration-300 ${!isEvmConnected ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="label">Solana Wallet</p>
                  {!solanaAddress && (
                    <button
                      onClick={() => handleWalletConnection('solana')}
                      disabled={!isEvmConnected}
                      className={`btn-secondary text-sm bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 border-blue-200 shadow-sm hover:shadow transition-all duration-300 ${!isEvmConnected ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {!isEvmConnected ? 'Connect EVM First' : 'Connect Solana'}
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    solanaAddress ? 'bg-success shadow-sm shadow-green-500/20' : 'bg-danger shadow-sm shadow-red-500/20'
                  }`} />
                  <p className="text-value">
                    {solanaAddress || (!isEvmConnected ? 'Connect EVM wallet first' : 'Not connected')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
              {errorMessage}
            </div>
          )}

          {solanaAddress && evmAddress && (
            <button
              onClick={saveWalletAddresses}
              disabled={registrationStatus === 'loading' || registrationStatus === 'success'}
              className={`btn-primary w-full ${
                registrationStatus === 'loading' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {registrationStatus === 'loading' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {registrationStatus === 'success' ? 'Registration Complete' : 'Complete Registration'}
            </button>
          )}
        </div>
      )}

      {/* Warning Modal */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={() => {
          setShowWarningModal(false);
          setShowRainbowKit(true);
          // Delay to ensure state update and modal close animation complete
          setTimeout(() => {
            const connectButton = document.querySelector('[data-testid="rk-connect-button"]');
            if (connectButton instanceof HTMLElement) {
              connectButton.click();
            }
          }, 100);
        }}
      />
    </div>
  );
} 