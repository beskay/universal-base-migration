/**
 * Utility to block Phantom's EVM functionality
 * This prevents conflicts when using Phantom wallet with other EVM wallets
 */

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isPhantom?: boolean;
      request: (args: any) => Promise<any>;
      [key: string]: any;
    };
  }
}

export const blockPhantomEVM = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if ethereum object exists
  if (window.ethereum) {
    // Store the original request method
    const originalRequest = window.ethereum.request;
    
    // Override the request method to intercept Phantom EVM calls
    window.ethereum.request = function(args: any) {
      // If it's a Phantom EVM call from the injected provider, block it
      if (window.ethereum?.isPhantom && args.method.startsWith('eth_')) {
        console.warn('Blocked Phantom EVM method:', args.method);
        return Promise.reject(new Error('Phantom EVM functionality is disabled in this app'));
      }
      
      // Otherwise, proceed with the original request
      return originalRequest.apply(this, [args]);
    };
  }
}; 