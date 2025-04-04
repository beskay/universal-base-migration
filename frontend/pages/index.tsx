import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import Card from '../components/Card';
import { AnimatedShinyText } from '../components/AnimatedShinyText';
import WarningModal from '../components/WarningModal';
import Toggle from '../components/Toggle';
import supabase from '../lib/supabase';
import { 
  formatAddress, 
  handleWalletError, 
  connectPhantom, 
  connectProperEvmWallet,
  isPhantomInstalled,
  isProperEvmWalletAvailable,
  isPhantomEVM
} from '../lib/walletUtils';
import { hasUosBalance, getUosBalance } from '../lib/solanaUtils';

export default function Home() {
  // Set up state without Privy
  const [solanaWallet, setSolanaWallet] = useState<string | null>(null);
  const [evmWallet, setEvmWallet] = useState<string | null>(null);
  const [manualSolanaWallet, setManualSolanaWallet] = useState<string>('');
  const [manualEvmWallet, setManualEvmWallet] = useState<string>('');
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnectingSolana, setIsConnectingSolana] = useState(false);
  const [isConnectingEVM, setIsConnectingEVM] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [uosBalance, setUosBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [walletStatus, setWalletStatus] = useState({
    phantomInstalled: false,
    evmWalletAvailable: false
  });

  // Check for wallet availability on mount - safely wrapped
  useEffect(() => {
    try {
      setWalletStatus({
        phantomInstalled: isPhantomInstalled(),
        evmWalletAvailable: isProperEvmWalletAvailable()
      });
    } catch (error) {
      console.error("Error checking wallet availability:", error);
    }
  }, []);

  // Fetch uOS balance when Solana wallet is connected
  useEffect(() => {
    if (solanaWallet) {
      const fetchUosBalance = async () => {
        setIsLoadingBalance(true);
        try {
          const balance = await getUosBalance(solanaWallet);
          setUosBalance(balance);
        } catch (error) {
          console.error('Error fetching uOS balance:', error);
          setUosBalance(null);
          setErrorMessage('Failed to fetch UOS balance. Please try again later.');
        } finally {
          setIsLoadingBalance(false);
        }
      };
      
      fetchUosBalance();
    } else {
      setUosBalance(null);
    }
  }, [solanaWallet]);

  // Function to connect Solana wallet directly using Phantom
  const connectSolanaWallet = async () => {
    try {
      // Check if EVM wallet is connected first
      if (!evmWallet) {
        setErrorMessage('Please connect your EVM wallet first before connecting your Solana wallet');
        return;
      }
      
      setIsConnectingSolana(true);
      setErrorMessage(null);
      
      const wallet = await connectPhantom();
      if (wallet) {
        setSolanaWallet(wallet);
      }
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      setErrorMessage(handleWalletError(error));
    } finally {
      setIsConnectingSolana(false);
    }
  };

  // Function to connect EVM wallet
  const connectEvmWallet = async () => {
    setShowWarningModal(true);
  };

  const handleEvmConnection = async () => {
    try {
      setIsConnectingEVM(true);
      setErrorMessage(null);
      
      const address = await connectProperEvmWallet();
      if (address) {
        setEvmWallet(address);
      }
    } catch (error) {
      console.error('Error connecting EVM wallet:', error);
      setErrorMessage(handleWalletError(error));
    } finally {
      setIsConnectingEVM(false);
    }
  };

  // Function to reset all wallet connections for testing
  const resetWalletConnections = async () => {
    // Clear local state
    setSolanaWallet(null);
    setEvmWallet(null);
    setManualSolanaWallet('');
    setManualEvmWallet('');
    setRegistrationStatus('idle');
    setErrorMessage(null);
    
    // Disconnect from Phantom if connected
    try {
      if (isPhantomInstalled()) {
        const solana = (window as any).solana;
        if (solana && solana.isConnected) {
          await solana.disconnect();
        }
      }
    } catch (error) {
      console.error('Error disconnecting from Phantom:', error);
    }
    
    // Reload the page to ensure a clean state
    window.location.reload();
  };

  // Function to validate Ethereum address
  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Function to validate Solana address
  const isValidSolanaAddress = (address: string): boolean => {
    // Basic validation for Solana addresses (base58 encoding, typically 32-44 characters)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  // Function to handle manual wallet submission
  const handleManualWalletSubmit = () => {
    setErrorMessage(null);
    
    // Validate EVM address
    if (!isValidEthAddress(manualEvmWallet)) {
      setErrorMessage('Please enter a valid EVM wallet address (0x followed by 40 hexadecimal characters)');
      return;
    }
    
    // Set the wallet address
    setEvmWallet(manualEvmWallet);
  };

  // Function to register user
  const registerUser = async () => {
    if (!solanaWallet || !evmWallet) {
      setErrorMessage('Please connect both Solana and EVM wallets before registering.');
      return;
    }

    setRegistrationStatus('registering');
    setErrorMessage(null);

    try {
      // Check if the Solana wallet has a uOS balance > 0 to prevent spam
      let hasBalance = false;
      try {
        hasBalance = await hasUosBalance(solanaWallet);
      } catch (error) {
        console.error('Error checking uOS balance:', error);
        setErrorMessage('Failed to verify uOS balance. Please try again later.');
        setRegistrationStatus('error');
        return;
      }

      if (!hasBalance) {
        setErrorMessage('You need to have a uOS balance to register for the airdrop.');
        setRegistrationStatus('error');
        return;
      }

      // Insert data into Supabase
      const { data, error } = await supabase
        .from('registered_wallets')
        .insert([
          { 
            solana_wallet: solanaWallet, 
            evm_wallet: evmWallet 
          }
        ])
        .select();

      if (error) {
        console.error('Error registering wallets:', error);
        
        // If there's a duplicate entry, we don't want to show an error
        if (error.code === '23505') {
          setRegistrationStatus('success');
          return;
        }
        
        setErrorMessage(`Registration failed: ${error.message}`);
        setRegistrationStatus('error');
        return;
      }

      console.log('Registration successful:', data);
      setRegistrationStatus('success');
    } catch (error) {
      console.error('Error in registration process:', error);
      setErrorMessage(`An unexpected error occurred during registration. Please try again later.`);
      setRegistrationStatus('error');
    }
  };

  // Toggle manual mode
  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    // Reset error messages when switching modes
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12 px-4">
      <Head>
        <title>Airdrop Registration</title>
        <meta name="description" content="Register for the airdrop" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <Navigation />

      {/* Reset button for testing */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={resetWalletConnections}
          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
        >
          Reset Wallets
        </button>
      </div>

      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Airdrop Registration</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect your Solana and EVM wallets to register for the airdrop. 
            After registration, you will be eligible to claim your WETH airdrop based on your UOS holdings.
          </p>
        </div>

        <div className="max-w-md mx-auto animate-slideIn">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Connect Your Wallets</h2>
              <Toggle 
                isEnabled={isManualMode} 
                onToggle={toggleManualMode} 
                label="Manual" 
                size="sm"
              />
            </div>
            
            {!isManualMode ? (
              // Wallet Connection Mode
              <div className="space-y-4 mb-6">
                {/* EVM Wallet Section */}
                <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200`}>
                  <div>
                    <div className="font-medium">EVM Wallet</div>
                    {evmWallet && (
                      <div className="text-sm text-gray-500 font-mono mt-1">
                        {formatAddress(evmWallet)}
                      </div>
                    )}
                  </div>
                  {evmWallet ? (
                    <div className="flex items-center text-sm text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </div>
                  ) : (
                    <Button
                      onClick={connectEvmWallet}
                      variant="secondary"
                      size="sm"
                      isLoading={isConnectingEVM}
                      disabled={!walletStatus.evmWalletAvailable}
                      className="font-mono text-white font-medium text-xs md:text-sm bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                    >
                      {walletStatus.evmWalletAvailable ? 'Connect EVM' : 'Install MetaMask'}
                    </Button>
                  )}
                </div>

                {/* Solana Wallet Section */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <div className="font-medium">Solana Wallet</div>
                    {solanaWallet && (
                      <div className="text-sm text-gray-500 font-mono mt-1">
                        {formatAddress(solanaWallet)}
                      </div>
                    )}
                    {solanaWallet && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          uOS Balance:
                        </div>
                        <div className="text-sm font-medium">
                          {isLoadingBalance ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : uosBalance !== null ? (
                            <span className="text-emerald-600">
                              {uosBalance} UOS
                            </span>
                          ) : (
                            <span className="text-gray-400">Checking balance...</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {solanaWallet ? (
                    <div className="flex items-center text-sm text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </div>
                  ) : (
                    <Button
                      onClick={connectSolanaWallet}
                      variant="accent"
                      size="sm"
                      isLoading={isConnectingSolana}
                      disabled={!walletStatus.phantomInstalled || !evmWallet}
                      className={`font-mono text-white font-medium text-xs md:text-sm ${
                        !evmWallet 
                          ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                      }`}
                    >
                      {!walletStatus.phantomInstalled 
                        ? 'Install Phantom' 
                        : !evmWallet 
                          ? 'Connect EVM First' 
                          : 'Connect Solana'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // Manual Entry Mode
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg mb-4">
                  <p className="text-sm">
                    Manual mode allows you to enter your EVM wallet address directly. Solana wallet must be connected directly through Phantom.
                  </p>
                </div>

                {/* Manual EVM Wallet Input */}
                <div className="space-y-2">
                  <label htmlFor="evmWallet" className="block text-sm font-medium text-gray-700">
                    EVM Wallet Address
                  </label>
                  <input
                    type="text"
                    id="evmWallet"
                    value={manualEvmWallet}
                    onChange={(e) => setManualEvmWallet(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {evmWallet && (
                    <div className="flex items-center text-sm text-emerald-600 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>

                {/* Submit Button for Manual Entry */}
                <Button
                  onClick={handleManualWalletSubmit}
                  variant="secondary"
                  fullWidth
                  disabled={!manualEvmWallet}
                  className="mt-2"
                >
                  Verify EVM Address
                </Button>

                {/* Solana Wallet Section - Always show connect button in manual mode */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <div className="font-medium">Solana Wallet</div>
                    {solanaWallet && (
                      <div className="text-sm text-gray-500 font-mono mt-1">
                        {formatAddress(solanaWallet)}
                      </div>
                    )}
                    {solanaWallet && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          uOS Balance:
                        </div>
                        <div className="text-sm font-medium">
                          {isLoadingBalance ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : uosBalance !== null ? (
                            <span className={`${uosBalance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {uosBalance} UOS {uosBalance === 0 && '(Not eligible)'}
                            </span>
                          ) : (
                            <span className="text-red-500">Error loading balance</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {solanaWallet ? (
                    <div className="flex items-center text-sm text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </div>
                  ) : (
                    <Button
                      onClick={connectSolanaWallet}
                      variant="accent"
                      size="sm"
                      isLoading={isConnectingSolana}
                      disabled={!walletStatus.phantomInstalled}
                      className="font-mono text-white font-medium text-xs md:text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    >
                      {walletStatus.phantomInstalled ? 'Connect Solana' : 'Install Phantom'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
                {errorMessage}
              </div>
            )}

            {!isManualMode && (
              <>
                {!walletStatus.phantomInstalled && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg mb-6">
                    <p className="font-medium">Phantom wallet not detected</p>
                    <p className="text-sm mt-1">
                      Please install <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="underline">Phantom wallet</a> to connect your Solana wallet.
                    </p>
                  </div>
                )}

                {!walletStatus.evmWalletAvailable && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg mb-6">
                    <p className="font-medium">EVM wallet not detected</p>
                    <p className="text-sm mt-1">
                      Please install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="underline">MetaMask</a> or another EVM wallet (not Phantom) to connect your Ethereum wallet.
                    </p>
                  </div>
                )}
              </>
            )}

            {registrationStatus === 'success' ? (
              <Card variant="success" className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-800">Registration Successful!</h3>
                <p className="text-emerald-700 mt-2">
                  You have successfully registered for the airdrop.
                  You will be able to claim your airdrop once it's available.
                </p>
              </Card>
            ) : (
              <Button
                onClick={registerUser}
                disabled={!solanaWallet || !evmWallet || registrationStatus === 'registering'}
                isLoading={registrationStatus === 'registering'}
                fullWidth
                size="lg"
                className="font-mono text-white font-medium text-sm md:text-base bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-black relative overflow-hidden group"
              >
                <span className="relative z-10">
                  <AnimatedShinyText className="text-white">
                    {registrationStatus === 'registering' ? 'Registering...' : 'Register for Airdrop'}
                  </AnimatedShinyText>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/50 to-emerald-400/0 group-hover:via-emerald-300/50 animate-pulse"></div>
              </Button>
            )}
          </Card>
        </div>
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500 pb-16">
        <p>Airdrop System © 2025</p>
        <p className="mt-2 text-gray-800 font-mono text-xs md:text-sm tracking-[0.15em]">- Designed by 🐬 -</p>
        <div className="mt-4 space-x-4 text-sm">
          <a href="https://uos.earth" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">uos.earth</a>
          <a href="https://uos.agency" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">uos.agency</a>
        </div>
      </footer>

      {/* Warning Modal */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={() => {
          setShowWarningModal(false);
          handleEvmConnection();
        }}
      />
    </div>
  );
} 