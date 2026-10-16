/**
 * Loader Component
 * Loading spinner and skeleton loaders
 */

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Loader({ size = 'md', centered = true }: LoaderProps) {
  const spinner = (
    <svg
      className={`animate-spin text-primary-500 ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Skeleton Loader for cards
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="aspect-[3/4] bg-neutral-200 rounded-lg mb-3" />
      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-neutral-200 rounded w-1/2" />
    </div>
  );
}

/**
 * Skeleton Loader Grid
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
