/**
 * Type definitions for Phantom wallet
 */

declare interface PhantomProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

declare interface SolanaProvider {
  solana?: PhantomProvider;
}

declare global {
  interface Window {
    phantom?: SolanaProvider;
  }
}

export {}; 