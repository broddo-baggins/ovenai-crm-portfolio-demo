import React from 'react';
import { cn } from '@/lib/utils';

interface TypingDotsProps {
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: boolean;
  // theme?: 'default' | 'whatsapp' | 'telegram';
}

export const TypingDots: React.FC<TypingDotsProps> = ({
  className = '',
  color = 'bg-gray-600',
  size = 'md',
  containerStyle = false,
  // theme = 'whatsapp', // TODO: Implement theme-based styling
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const dotClass = cn(
    "rounded-full",
    color
  );

  // Use the global keyframes from index.css
  const animationStyle = {
    animation: 'dotPulse 1.2s infinite ease-in-out',
  };

  return (
    <div className={cn(
      containerStyle
        ? "inline-flex items-center justify-center px-3 py-1 bg-gray-100 rounded-full"
        : "",
      className
    )}>
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className={cn(sizeClasses[size], dotClass)}
            style={{
              ...animationStyle,
              animationDelay: `${dot * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}; 