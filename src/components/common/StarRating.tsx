/**
 * StarRating Component
 * Interactive 5-star rating picker + display
 */

import { useState } from 'react';

interface StarRatingProps {
  value: number;           // current rating 1-5 (0 = not rated)
  onChange?: (rating: number) => void; // undefined = read-only
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
}

const sizes = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9',
};

export function StarRating({
  value,
  onChange,
  size = 'md',
  label,
  disabled = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const isReadOnly = !onChange;
  const display    = hovered || value;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= display;
          return (
            <button
              key={star}
              type="button"
              disabled={isReadOnly || disabled}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => !isReadOnly && !disabled && setHovered(star)}
              onMouseLeave={() => !isReadOnly && !disabled && setHovered(0)}
              className={`transition-transform ${
                isReadOnly || disabled
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110 active:scale-95'
              }`}
            >
              <svg
                className={`${sizes[size]} transition-colors ${
                  filled
                    ? 'text-amber-400'
                    : 'text-neutral-300'
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          );
        })}
        {value > 0 && (
          <span className="text-sm text-neutral-500 ml-1">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}
