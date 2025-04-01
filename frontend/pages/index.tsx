import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import Card from '../components/Card';
import MerkleAnimation from '../components/MerkleAnimation';
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
  isPhantomEVM,
  blockPhantomEVM
} from '../lib/walletUtils';
import { hasUosBalance, getUosBalance } from '../lib/solanaUtils';

export default function Home() {
  const { login, ready, authenticated, user, logout } = usePrivy();
  const [solanaWallet, setSolanaWallet] = useState<string | null>(null);
  const [evmWallet, setEvmWallet] = useState<string | null>(null);
  const [manualSolanaWallet, setManualSolanaWallet] = useState<string>('');
  const [manualEvmWallet, setManualEvmWallet] = useState<string>('');
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnectingSolana, setIsConnectingSolana] = useState(false);
  const [isConnectingEVM, setIsConnectingEVM] = useState(false);
  const [showMerkleAnimation, setShowMerkleAnimation] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [uosBalance, setUosBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [walletStatus, setWalletStatus] = useState({
    phantomInstalled: false,
    evmWalletAvailable: false
  });

  // Check for wallet availability on mount
  useEffect(() => {
    setWalletStatus({
      phantomInstalled: isPhantomInstalled(),
      evmWalletAvailable: isProperEvmWalletAvailable()
    });
  }, []);

  // Check for connected wallets when user is authenticated
  useEffect(() => {
    if (authenticated && user) {
      // Get linked accounts
      const linkedAccounts = user.linkedAccounts || [];
      
      // ONLY look for Solana wallets in Privy
      linkedAccounts.forEach((account: any) => {
        if (account.type === 'wallet' && account.walletClientType === 'solana') {
          setSolanaWallet(account.address);
        }
      });
    }
  }, [authenticated, user]);

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

  // Block Phantom EVM on component mount
  useEffect(() => {
    // Block Phantom's EVM provider as early as possible
    blockPhantomEVM();
  }, []);

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
      
      const solana = (window as any).solana;
      
      if (!solana || !solana.isPhantom) {
        setErrorMessage('Phantom wallet is not installed');
        return;
      }
      
      try {
        const response = await solana.connect();
        setSolanaWallet(response.publicKey.toString());
      } catch (error) {
        console.error('Error connecting to Phantom:', error);
        setErrorMessage(handleWalletError(error));
      }
    } finally {
      setIsConnectingSolana(false);
    }
  };

  // Function to connect EVM wallet directly (not using Phantom)
  const connectEvmWallet = async () => {
    setShowWarningModal(true);
  };

  const handleEvmConnection = async () => {
    try {
      setIsConnectingEVM(true);
      setErrorMessage(null);
      
      // Get the current ethereum provider
      const ethereum = (window as any).ethereum;
      
      // Strict checks to ensure we're not using Phantom's EVM
      if (!ethereum) {
        setErrorMessage('No EVM wallet detected. Please install MetaMask.');
        return;
      }
      
      // Use the enhanced isPhantomEVM function from walletUtils
      if (isPhantomEVM(ethereum)) {
        setErrorMessage('Please use MetaMask or another dedicated EVM wallet. Phantom\'s EVM wallet is not supported.');
        return;
      }
      
      // Additional check for proper EVM wallet
      if (!ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
        setErrorMessage('Please use MetaMask or Coinbase Wallet for EVM connections.');
        return;
      }
      
      // Call our blockPhantomEVM function which now marks providers instead of deleting them
      blockPhantomEVM();
      
      // Request accounts from the proper EVM wallet
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      // Double check after connection that we didn't somehow connect to Phantom
      if (isPhantomEVM(ethereum)) {
        setErrorMessage('Phantom\'s EVM wallet is not supported. Please use MetaMask or another dedicated EVM wallet.');
        return;
      }
      
      if (accounts && accounts.length > 0) {
        setEvmWallet(accounts[0]);
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
    
    // Disconnect from Privy
    if (authenticated) {
      await logout();
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
        console.error('Error checking UOS balance:', error);
        setErrorMessage('Failed to verify UOS balance. Please try again later.');
        setRegistrationStatus('error');
        return;
      }
      
      if (!hasBalance) {
        setErrorMessage('Your Solana wallet must have a uOS balance greater than 0 to register.');
        setRegistrationStatus('error');
        return;
      }
      
      // Phase 1: Registration - Store in registered_users table exactly as specified in the build document
      const { data, error } = await supabase
        .from('registered_users')
        .insert({
          solana_address: solanaWallet,
          evm_address: evmWallet
        });

      if (error) {
        if (error.code === '23505') {  // Unique violation
          setErrorMessage('This Solana wallet address is already registered.');
          setRegistrationStatus('error');
          return;
        }
        
        console.error('Error inserting record:', error);
        throw error;
      }
      
      setRegistrationStatus('success');
    } catch (error) {
      console.error('Error registering user:', error);
      setRegistrationStatus('error');
      setErrorMessage('Failed to register. Please try again later.');
    }
  };

  // Function to handle merkle animation
  const handleMerkleAnimation = () => {
    setShowMerkleAnimation(true);
  };

  // Function to handle animation completion
  const handleAnimationComplete = () => {
    setShowMerkleAnimation(false);
  };

  // Toggle manual mode
  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    // Reset error messages when switching modes
    setErrorMessage(null);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent mb-4"></div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

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

      {/* Merkle-me button - Fixed position (desktop always, mobile always at bottom left) */}
      <div 
        className={`
          fixed bottom-4 left-4 sm:bottom-8 sm:left-8
          flex justify-start flex-none z-50
        `}
        data-merkle-button
      >
        <button 
          onClick={handleMerkleAnimation}
          className="group bg-primary hover:bg-primary/90 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 
          shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1
          relative overflow-hidden animate-pulse scale-75 sm:scale-100"
          style={{
            boxShadow: '0 0 15px 5px rgba(59, 130, 246, 0.35), 0 0 8px 2px rgba(59, 130, 246, 0.5)',
            animationDuration: '3s'
          }}
        >
          <span className="relative z-10 font-mono text-gray-800 text-xs sm:text-sm">merkle-me</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200 group-hover:translate-x-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <div className="absolute inset-0 bg-blue-400 opacity-40 group-hover:opacity-60 blur-xl transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Merkle Tree Animation */}
      <MerkleAnimation 
        isVisible={showMerkleAnimation} 
        onAnimationComplete={handleAnimationComplete} 
      />

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