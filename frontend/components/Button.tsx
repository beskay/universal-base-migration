import { ButtonHTMLAttributes, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary hover:bg-primaryHover text-white',
  secondary: 'bg-secondary hover:bg-secondaryHover text-white',
  accent: 'bg-accent hover:bg-accentHover text-white',
  outline: 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white',
};

const sizeStyles = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-3 px-5 text-base',
  lg: 'py-4 px-6 md:py-5 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-lg font-medium transition-colors
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" className="-ml-1 mr-3" />
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
} 