import { FC } from "react";

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className = "",
}) => {
  return (
    <span
      className={`mx-auto max-w-md text-gray-900 font-medium transition-colors duration-200 hover:text-emerald-500 hover:animate-pulse ${className}`}
    >
      {children}
    </span>
  );
}; 