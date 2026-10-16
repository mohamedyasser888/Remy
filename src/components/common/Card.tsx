/**
 * Card Component
 * Reusable card container with optional hover effects
 */

import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        bg-white/90 backdrop-blur-sm rounded-2xl border border-white/80 shadow-[0_8px_28px_rgba(86,55,100,0.07)] p-4
        transition-all duration-300
        ${hover ? 'hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(86,55,100,0.14)] hover:border-primary-100' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
