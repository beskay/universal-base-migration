import { CSSProperties } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}

const sizeStyles = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};

export default function LoadingSpinner({ size = 'md', className = '', style }: LoadingSpinnerProps) {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-full 
        border-4 border-gray-200 border-t-blue-500
        animate-spin
        ${sizeStyles[size]}
        ${className}
      `}
      style={{
        ...style,
        animationDuration: '1s',
      }}
    >
      {/* Simple spinner with no image */}
    </div>
  );
} 