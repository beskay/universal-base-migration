/**
 * Utility functions for handling wallet provider conflicts
 */

// Check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Function to safely handle Phantom's EVM functionality - modified to not modify window.ethereum
export const blockPhantomEVM = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Instead of modifying properties, just detect Phantom EVM for later checks
    if ((window as any).phantom) {
      const phantomEthereum = (window as any).phantom.ethereum;
      
      // Just log the detection, don't try to modify the property
      if (phantomEthereum) {
        console.log('Phantom EVM detected - will be ignored in app logic');
      }
    }
  } catch (error) {
    console.error('Error in blockPhantomEVM:', error);
  }
};

// More comprehensive check for Phantom's EVM provider
export const isPhantomEVM = (provider: any): boolean => {
  if (!provider) return false;
  
  try {
    return Boolean(
      provider.isPhantom || 
      ((window as any).phantom && (window as any).phantom.ethereum === provider)
    );
  } catch (error) {
    console.error('Error in isPhantomEVM:', error);
    return false;
  }
};

// Safe access to window.ethereum to prevent errors
export const getEthereum = () => {
  if (!isBrowser) return null;
  
  try {
    // Only return ethereum if it's not Phantom
    const ethereum = (window as any).ethereum;
    if (ethereum && !isPhantomEVM(ethereum)) {
      return ethereum;
    }
  } catch (error) {
    console.error('Error in getEthereum:', error);
  }
  
  return null; // Return null if it's Phantom or no provider exists
};

// Safe access to Solana wallet adapter
export const getSolanaWallet = () => {
  if (!isBrowser) return null;
  return (window as any).solana;
};

// Function to safely check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  if (!isBrowser) return false;
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

// Function to safely check if a Solana wallet is installed
export const isSolanaWalletInstalled = () => {
  if (!isBrowser) return false;
  return Boolean((window as any).solana);
};

// Function to check if Phantom is installed
export const isPhantomInstalled = () => {
  if (!isBrowser) return false;
  const solana = (window as any).solana;
  return Boolean(solana && solana.isPhantom);
};

// Function to check if a proper EVM wallet is available (not Phantom)
export const isProperEvmWalletAvailable = () => {
  if (!isBrowser) return false;
  
  // Check if ethereum is available
  const { ethereum } = window;
  if (!ethereum) return false;
  
  // Enhanced check to ensure it's not Phantom's ethereum provider
  if (isPhantomEVM(ethereum)) {
    return false; // This is Phantom's ethereum provider, not a proper EVM wallet
  }
  
  // Check for explicit support for known EVM wallets
  if (ethereum.isMetaMask || ethereum.isCoinbaseWallet) {
    return true;
  }
  
  // Fall back to checking that it's definitely not Phantom
  if ((window as any).phantom?.ethereum === ethereum) {
    return false;
  }
  
  // If we made it here, it's likely a proper EVM wallet
  return true;
};

// Function to handle wallet connection errors
export const handleWalletError = (error: any): string => {
  console.error('Wallet connection error:', error);
  
  if (error.code === 4001) {
    return 'User rejected the connection request.';
  }
  
  if (error.code === -32002) {
    return 'Connection request already pending. Check your wallet extension.';
  }
  
  return 'Failed to connect wallet. Please try again.';
};

// Function to format wallet address for display
export const formatAddress = (address: string | null | undefined): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Function to detect wallet provider conflicts
export const detectProviderConflicts = (): boolean => {
  if (!isBrowser) return false;
  
  // Check if multiple providers are trying to inject
  const providers = [];
  if ((window as any).ethereum) providers.push('ethereum');
  if ((window as any).solana) providers.push('solana');
  if ((window as any).phantom) providers.push('phantom');
  if ((window as any).coinbaseWalletExtension) providers.push('coinbase');
  
  return providers.length > 1;
};

// Function to log provider info for debugging
export const logProviderInfo = () => {
  if (!isBrowser) return;
  
  console.log('Wallet providers detected:');
  if ((window as any).ethereum) {
    console.log('- Ethereum provider:', (window as any).ethereum.constructor.name);
    if ((window as any).ethereum.isMetaMask) console.log('  - MetaMask detected');
    if ((window as any).ethereum.isCoinbaseWallet) console.log('  - Coinbase Wallet detected');
    
    // Check if this is Phantom's ethereum provider
    if (isPhantomInstalled() && (window as any).phantom?.ethereum === (window as any).ethereum) {
      console.log('  - This is Phantom\'s ethereum provider');
    }
  }
  
  if ((window as any).solana) {
    console.log('- Solana provider detected');
    if ((window as any).solana.isPhantom) console.log('  - Phantom detected');
  }
  
  if ((window as any).phantom) {
    console.log('- Phantom provider detected');
    console.log('  - Has ethereum provider:', Boolean((window as any).phantom.ethereum));
  }
  
  if (detectProviderConflicts()) {
    console.warn('Multiple wallet providers detected. This may cause conflicts.');
  }
  
  console.log('Proper EVM wallet available:', isProperEvmWalletAvailable());
};

// Function to connect to Phantom wallet directly
export const connectPhantom = async (): Promise<string | null> => {
  if (!isBrowser) return null;
  
  const solana = (window as any).solana;
  
  if (!solana || !solana.isPhantom) {
    throw new Error('Phantom wallet is not installed');
  }
  
  try {
    // Connect to Phantom
    const response = await solana.connect();
    return response.publicKey.toString();
  } catch (error) {
    console.error('Error connecting to Phantom:', error);
    throw error;
  }
};

// Function to connect to a proper EVM wallet (not Phantom)
export const connectProperEvmWallet = async (): Promise<string | null> => {
  if (!isBrowser) return null;
  
  if (!isProperEvmWalletAvailable()) {
    throw new Error('No proper EVM wallet detected. Please install MetaMask or another EVM wallet.');
  }
  
  try {
    // Call our blockPhantomEVM function which now marks providers instead of deleting them
    blockPhantomEVM();
    
    // Request accounts from the proper EVM wallet
    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    
    // Even after connection, double check this isn't Phantom
    if (isPhantomEVM((window as any).ethereum)) {
      throw new Error('Phantom\'s EVM wallet is not supported. Please use MetaMask or another dedicated EVM wallet.');
    }
    
    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('Error connecting to EVM wallet:', error);
    throw error;
  }
}; 