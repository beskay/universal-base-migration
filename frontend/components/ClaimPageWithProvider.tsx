import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from './Navigation';
import Button from './Button';
import Card from './Card';
import { formatAddress } from '../lib/walletUtils';
import { formatEther, parseEther } from 'viem';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { AIRCADE_ABI, AIRCADE_CONTRACT_ADDRESS } from '../lib/contracts/AIRcade';
import { useVerifyProof } from '../hooks/useVerifyProof';

// This is a placeholder - replace with your actual project ID from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
if (!projectId) throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required');

// The actual claim form component
const ClaimForm = () => {
  const { address: evmWallet, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Add logging to verify contract address
  console.log('Using contract address:', AIRCADE_CONTRACT_ADDRESS);
  
  const [claimStatus, setClaimStatus] = useState<'idle' | 'checking' | 'eligible' | 'ineligible' | 'claiming' | 'claimed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [airdropAmount, setAirdropAmount] = useState<string | null>(null);
  const [merkleProof, setMerkleProof] = useState<string[] | null>(null);

  // Check if address has already claimed
  const { data: hasClaimed } = useContractRead({
    address: AIRCADE_CONTRACT_ADDRESS,
    abi: AIRCADE_ABI,
    functionName: 'claimed',
    args: evmWallet ? [evmWallet] : undefined,
    enabled: Boolean(evmWallet),
  });

  // Prepare the contract write configuration
  const { config: contractConfig } = usePrepareContractWrite({
    address: AIRCADE_CONTRACT_ADDRESS,
    abi: AIRCADE_ABI,
    functionName: 'claim',
    args: evmWallet && airdropAmount && merkleProof ? [
      evmWallet,
      BigInt(airdropAmount),
      merkleProof
    ] : undefined,
    enabled: Boolean(evmWallet && airdropAmount && merkleProof),
    onError: (error: Error) => {
      console.error('Contract prepare error:', error);
      setErrorMessage(`Error preparing contract: ${error.message}`);
    }
  } as any);

  const { write: claim, isLoading: isClaimLoading, isSuccess: isClaimSuccess, error: claimError } = useContractWrite(contractConfig);

  // Reset state when wallet changes
  useEffect(() => {
    if (evmWallet) {
      setClaimStatus('idle');
      setErrorMessage(null);
    }
  }, [evmWallet]);

  // Update claim status based on transaction state
  useEffect(() => {
    if (isClaimLoading) {
      setClaimStatus('claiming');
    } else if (isClaimSuccess) {
      setClaimStatus('claimed');
    } else if (claimError) {
      setClaimStatus('error');
      setErrorMessage(claimError.message);
    }
  }, [isClaimLoading, isClaimSuccess, claimError]);

  // Function to check eligibility
  const checkEligibility = async () => {
    if (!evmWallet) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    // Check if already claimed first
    if (hasClaimed) {
      return; // Early return as the UI will show the claimed state
    }

    setClaimStatus('checking');
    setErrorMessage(null);

    try {
      console.log(`Checking eligibility for address: ${evmWallet}`);
      
      // This now uses the direct API call
      const merkleProofData = await getMerkleProof(evmWallet);
      
      if (!merkleProofData) {
        console.log(`No merkle proof found for address: ${evmWallet}`);
        setClaimStatus('ineligible');
        return;
      }
      
      console.log(`Found merkle proof data:`, merkleProofData);
      console.log(`Balance from proof:`, merkleProofData.balance);
      console.log(`Proof from data:`, merkleProofData.proof);
      
      // User is eligible
      setClaimStatus('eligible');
      setAirdropAmount(merkleProofData.balance);
      
      // Handle the proof field which might be in different formats
      let proofArray: string[];
      
      if (typeof merkleProofData.proof === 'string') {
        // It could be a JSON string
        try {
          // Try parsing as JSON
          proofArray = JSON.parse(merkleProofData.proof as unknown as string);
          console.log('Parsed proof from JSON string:', proofArray);
        } catch (e) {
          // Not valid JSON, treat as a single string
          proofArray = [merkleProofData.proof as unknown as string];
          console.log('Using proof as single string:', proofArray);
        }
      } else if (Array.isArray(merkleProofData.proof)) {
        // It's already an array
        proofArray = merkleProofData.proof;
        console.log('Using proof as array:', proofArray);
      } else {
        // Unexpected format
        console.error('Unexpected proof format:', typeof merkleProofData.proof, merkleProofData.proof);
        setClaimStatus('error');
        setErrorMessage('Invalid proof format. Please contact support.');
        return;
      }
      
      // First filter out any null/undefined values
      const validProofs = proofArray.filter(p => p !== null && p !== undefined);
      
      // Convert proof strings to proper format expected by the contract (as numbers wrapped in strings)
      const formattedProofs = validProofs.map(p => {
        // Clean the input (remove quotes, unnecessary spaces, etc.)
        const cleanValue = String(p).replace(/['"]+/g, '').trim();
        console.log('Raw proof value:', cleanValue);
        
        if (cleanValue.startsWith('0x')) {
          // If it's already a hex string with 0x prefix, use it directly
          return cleanValue;
        } else if (/^\d+$/.test(cleanValue)) {
          // If it's a plain number, just return it as is, contract will handle it
          return cleanValue;
        } else {
          // If it's something else (like a hex without 0x), add 0x prefix
          return `0x${cleanValue}`;
        }
      });
      
      console.log('Final formatted proofs:', formattedProofs);
      setMerkleProof(formattedProofs);
      
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setClaimStatus('error');
      setErrorMessage(`Failed to check eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Function to claim tokens
  const claimTokens = async () => {
    if (!evmWallet || !merkleProof || !airdropAmount) {
      setErrorMessage('Missing required data for claiming.');
      return;
    }

    // Double check if already claimed
    if (hasClaimed) {
      setClaimStatus('error');
      setErrorMessage('This address has already claimed their tokens.');
      return;
    }

    try {
      claim?.();
    } catch (error) {
      console.error('Error claiming tokens:', error);
      setClaimStatus('error');
      setErrorMessage('Failed to claim tokens. Please try again later.');
    }
  };

  return !isConnected ? (
    <Card hover className="text-center">
      <h2 className="text-2xl font-bold mb-8">Get Started</h2>
      <p className="text-gray-600 mb-10 text-lg">
        Enter your Ethereum wallet address to check eligibility and claim your tokens.
      </p>
      <div className="flex justify-center py-4">
        <ConnectButton />
      </div>
    </Card>
  ) : (
    <Card>
      <h2 className="text-2xl font-bold mb-8">Claim Your Tokens</h2>
      
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-5 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mb-4 md:mb-0">
            <div className="font-medium text-lg">EVM Wallet</div>
            <div className="text-sm text-gray-500 font-mono mt-2">
              {formatAddress(evmWallet)}
            </div>
          </div>
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-10 text-center">
          {errorMessage}
        </div>
      )}

      {claimStatus === 'idle' && hasClaimed && (
        <div className="p-5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg mb-10 text-center">
          <p className="text-lg font-medium">Nice try, you have claimed, no double dipping here! 😉</p>
        </div>
      )}

      {claimStatus === 'idle' && !hasClaimed && (
        <Button
          onClick={checkEligibility}
          fullWidth
          size="lg"
          className="font-mono text-white text-base py-5 bg-gray-800 hover:bg-gray-700 mt-6"
        >
          Check Eligibility
        </Button>
      )}

      {claimStatus === 'checking' && (
        <div className="p-8 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">
          <div className="animate-pulse">
            <svg className="mx-auto h-10 w-10 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-lg">Checking eligibility...</p>
          </div>
        </div>
      )}

      {claimStatus === 'ineligible' && (
        <Card variant="warning" className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-yellow-800">Not Eligible</h3>
          <p className="text-yellow-700 mt-2">
            Your wallet is not eligible for the AIRcade token claim.
            This could be because you didn't register in time or your eligibility couldn't be verified.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-primary hover:text-primaryHover font-medium">
              Return to registration
            </Link>
          </div>
        </Card>
      )}

      {claimStatus === 'eligible' && (
        <div className="space-y-6">
          <Card variant="success" className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-green-800">Eligible for Claim!</h3>
            <p className="text-green-700 mt-2">
              You are eligible to claim <span className="font-bold">{airdropAmount ? formatEther(BigInt(airdropAmount)) : '0'}</span> AIRcade tokens.
            </p>
          </Card>
          
          <Button
            onClick={claimTokens}
            variant="secondary"
            fullWidth
            size="lg"
            className="font-mono text-white text-sm md:text-base bg-gray-800 hover:bg-gray-700"
          >
            Claim Tokens
          </Button>
        </div>
      )}

      {claimStatus === 'claiming' && (
        <Card variant="info" className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-blue-800">Claiming Tokens...</h3>
          <p className="text-blue-700 mt-2">
            Please wait while your transaction is being processed.
          </p>
        </Card>
      )}

      {claimStatus === 'claimed' && (
        <Card variant="success" className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-green-800">Tokens Claimed!</h3>
          <p className="text-green-700 mt-2">
            You have successfully claimed your AIRcade tokens.
            The tokens should appear in your wallet shortly.
          </p>
        </Card>
      )}

      {claimStatus === 'error' && (
        <Button
          onClick={checkEligibility}
          fullWidth
          size="lg"
          className="font-mono text-white text-sm md:text-base bg-gray-800 hover:bg-gray-700"
        >
          Try Again
        </Button>
      )}
    </Card>
  );
};

// The main component with the RainbowKit provider
const ClaimPageWithProvider = () => {
  const [mounted, setMounted] = useState(false);
  
  // This is to prevent hydration errors
  useEffect(() => {
    setMounted(true);
    
    // Clean up any existing wallet connections
    if (typeof window !== 'undefined') {
      // Clear all wallet connection data from localStorage
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      
      // Remove any Web3Modal data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('wc@') || key.startsWith('W3M') || key.startsWith('wagmi')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  // This prevents hydration errors
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Claim AIRcade Tokens</title>
        <meta name="description" content="Verify your eligibility and claim your AIRcade tokens" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="max-w-5xl mx-auto mt-8 md:-mt-32">
        <div className="text-center mb-8 md:mb-12 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Claim AIRcade Tokens</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Verify your eligibility and claim your AIRcade tokens based on the merkle proof.
          </p>
        </div>

        <div className="max-w-2xl mx-auto animate-slideIn px-4">
          <ClaimForm />
        </div>
      </main>

      <footer className="mt-12 text-center pb-8">
        <p className="text-xl font-bold text-gray-900">AIRcade</p>
        <p className="mt-2 text-gray-800 font-mono text-xs md:text-sm tracking-[0.15em]">
          - Designed by <a href="https://x.com/__U_O_S__" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors duration-200">🐬</a> -
        </p>
      </footer>
    </div>
  );
};

export default ClaimPageWithProvider; 