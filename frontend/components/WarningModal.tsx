import React from 'react';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function WarningModal({ isOpen, onClose, onConfirm }: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
        <div className="flex items-start">
          {/* Warning Icon */}
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-yellow-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          {/* Content */}
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Important Notice
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Please do not use Phantom's EVM wallet for this connection. Use MetaMask or another dedicated EVM wallet instead.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Using Phantom's EVM wallet may result in connection issues or unexpected behavior.
              </p>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Continue with MetaMask
          </button>
        </div>
      </div>
    </div>
  );
} 