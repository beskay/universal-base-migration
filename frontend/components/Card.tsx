import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  emeraldShadow?: boolean;
}

const variantStyles = {
  default: 'bg-white',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

export default function Card({ 
  children, 
  className = '', 
  hover = false, 
  variant = 'default',
  emeraldShadow = true
}: CardProps) {
  return (
    <div 
      className={`
        rounded-xl border p-6 md:p-8 lg:p-10
        ${variantStyles[variant]} 
        ${hover ? 'transition-shadow hover:shadow-card-hover' : 'shadow-card'} 
        ${emeraldShadow ? 'shadow-lg md:shadow-xl shadow-emerald-500/20 backdrop-blur-sm' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
} 