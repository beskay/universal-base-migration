import { useState } from 'react';

interface ToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Toggle({
  isEnabled,
  onToggle,
  label,
  size = 'md',
  className = '',
}: ToggleProps) {
  const sizeStyles = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6',
  };

  const thumbSizeStyles = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const translateStyles = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-6',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="mr-2 text-sm text-gray-600">{label}</span>
      )}
      <button
        type="button"
        className={`
          ${sizeStyles[size]} 
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isEnabled ? 'bg-primary' : 'bg-gray-200'}
        `}
        role="switch"
        aria-checked={isEnabled}
        onClick={onToggle}
      >
        <span
          className={`
            ${thumbSizeStyles[size]}
            ${isEnabled ? translateStyles[size] : 'translate-x-0'}
            pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
          `}
        />
      </button>
    </div>
  );
} 