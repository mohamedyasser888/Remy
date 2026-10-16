/**
 * Heart Button Component
 * Animated heart icon for favorite/like actions
 */

import { ButtonHTMLAttributes } from 'react';

interface HeartButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isFilled: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function HeartButton({ isFilled, size = 'md', className = '', ...props }: HeartButtonProps) {
  return (
    <button
      className={`
        touch-target p-2 rounded-full
        transition-all duration-200
        hover:bg-red-50 hover:scale-110
        active:scale-95
        ${className}
      `}
      aria-label={isFilled ? 'Remove from favorites' : 'Add to favorites'}
      {...props}
    >
      <svg
        className={`
          ${sizeClasses[size]}
          transition-all duration-200
          ${isFilled ? 'text-red-500 scale-110' : 'text-neutral-400'}
        `}
        fill={isFilled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isFilled ? 0 : 2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
