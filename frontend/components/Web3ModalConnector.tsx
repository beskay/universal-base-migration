import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import Button from './Button';

interface Web3ModalConnectorProps {
  onAddressChange?: (address: string | null) => void;
}

export default function Web3ModalConnector({ onAddressChange }: Web3ModalConnectorProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  
  // Notify parent component when address changes
  useEffect(() => {
    if (onAddressChange) {
      onAddressChange(address || null);
    }
  }, [address, onAddressChange]);
  
  const handleConnect = async () => {
    try {
      // Try to use wagmi's connect functionality first
      const availableConnector = connectors.find(c => c.ready);
      if (availableConnector) {
        connect({ connector: availableConnector });
        return;
      }
      
      // Fallback to direct ethereum provider if Web3Modal is not available
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        // Use the direct ethereum provider as fallback
        try {
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0 && onAddressChange) {
            onAddressChange(accounts[0]);
          }
          return;
        } catch (err) {
          console.error('Error connecting directly to ethereum provider:', err);
        }
      }
      
      // As a last resort, try to find the Web3Modal button 
      const modalButton = document.getElementById('w3m-button');
      if (modalButton) {
        modalButton.click();
      } else {
        setError('No wallet provider available. Please install MetaMask or another EVM wallet.');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    }
  };
  
  return (
    <div>
      {isConnected && address ? (
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2 bg-success shadow-sm shadow-green-500/20" />
          <p className="text-value truncate max-w-[240px]">
            {address}
          </p>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          className="btn-secondary text-sm bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 border-blue-200 shadow-sm hover:shadow transition-all duration-300"
        >
          Connect EVM
        </Button>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-danger">
          {error}
        </div>
      )}
    </div>
  );
} 