/**
 * Animated Background Component
 * Cute floating shapes for page backgrounds
 */

interface AnimatedBackgroundProps {
  variant?: 'default' | 'login' | 'wardrobe' | 'home' | 'stylist';
}

export function AnimatedBackground({ variant = 'default' }: AnimatedBackgroundProps) {
  const effectiveVariant = variant === 'login' ? 'default' : variant;
  const getShapes = () => {
    switch (effectiveVariant) {
      case 'wardrobe':
        return (
          <>
            {/* Hangers */}
            <div className="absolute top-10 left-10 animate-float opacity-10" style={{ animationDelay: '0s', animationDuration: '7s' }}>
              <svg className="w-16 h-16 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C11.45 2 11 2.45 11 3C11 3.55 11.45 4 12 4C12.55 4 13 3.55 13 3C13 2.45 12.55 2 12 2M18 7H13.91C13.43 5.26 11.86 4 10 4H9.83C9.3 4.44 9 5.19 9 6C9 7.1 9.9 8 11 8H13V9H6C4.9 9 4 9.9 4 11V22H20V11C20 9.9 19.1 9 18 9V7Z"/>
              </svg>
            </div>
            
            {/* Dress */}
            <div className="absolute top-1/4 right-16 animate-float opacity-10" style={{ animationDelay: '1s', animationDuration: '8s' }}>
              <svg className="w-20 h-20 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L8 6H2L5 12L2 22H22L19 12L22 6H16L12 2M12 5.5L13.5 7.5H10.5L12 5.5Z"/>
              </svg>
            </div>

            {/* Shoe */}
            <div className="absolute bottom-20 left-1/4 animate-float opacity-10" style={{ animationDelay: '2s', animationDuration: '9s' }}>
              <svg className="w-16 h-16 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18H21V20C21 21.11 20.11 22 19 22H5C3.9 22 3 21.11 3 20V18M5 16V11L7 9L9 11L11 9L13 11L15 9L17 11V16H5Z"/>
              </svg>
            </div>
          </>
        );

      case 'home':
        return (
          <>
            {/* Camera */}
            <div className="absolute top-16 left-12 animate-float opacity-10" style={{ animationDelay: '0s', animationDuration: '7s' }}>
              <svg className="w-16 h-16 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4H7L9 2H15L17 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7M12 9C13.66 9 15 10.34 15 12S13.66 15 12 15 9 13.66 9 12 10.34 9 12 9Z"/>
              </svg>
            </div>

            {/* Heart */}
            <div className="absolute top-1/3 right-20 animate-float opacity-10" style={{ animationDelay: '1.5s', animationDuration: '8s' }}>
              <svg className="w-18 h-18 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            {/* Share */}
            <div className="absolute bottom-24 left-1/3 animate-float opacity-10" style={{ animationDelay: '2.5s', animationDuration: '7.5s' }}>
              <svg className="w-14 h-14 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12S8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5S19.66 2 18 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12S4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.91 18 21.91S20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"/>
              </svg>
            </div>
          </>
        );

      case 'stylist':
        return (
          <>
            {/* Magic Wand */}
            <div className="absolute top-12 right-16 animate-float opacity-10" style={{ animationDelay: '0s', animationDuration: '7s' }}>
              <svg className="w-16 h-16 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.5 5.6L5 7L6.4 4.5L5 2L7.5 3.4L10 2L8.6 4.5L10 7L7.5 5.6M19.5 15.4L22 14L20.6 16.5L22 19L19.5 17.6L17 19L18.4 16.5L17 14L19.5 15.4M22 2L20.6 4.5L22 7L19.5 5.6L17 7L18.4 4.5L17 2L19.5 3.4L22 2M13.34 12.78L15.78 10.34L13.66 8.22L11.22 10.66L13.34 12.78M14.37 7.29L16.71 9.63C17.1 10 17.1 10.65 16.71 11.04L5.04 22.71C4.65 23.1 4 23.1 3.63 22.71L1.29 20.37C0.9 20 0.9 19.35 1.29 18.96L12.96 7.29C13.35 6.9 14 6.9 14.37 7.29Z"/>
              </svg>
            </div>

            {/* Star */}
            <div className="absolute top-1/4 left-20 animate-float opacity-10" style={{ animationDelay: '1s', animationDuration: '8s' }}>
              <svg className="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>

            {/* Sparkles */}
            <div className="absolute bottom-20 right-1/4 animate-float opacity-10" style={{ animationDelay: '2s', animationDuration: '9s' }}>
              <svg className="w-14 h-14 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.5 9.5L9 4L6.5 9.5L1 12L6.5 14.5L9 20L11.5 14.5L17 12L11.5 9.5M19.5 3.5L17 2L15.5 4.5L13 6L15.5 7.5L17 10L18.5 7.5L21 6L19.5 3.5Z"/>
              </svg>
            </div>
          </>
        );

      default:
        return (
          <>
            {/* Generic cute shapes */}
            <div className="absolute top-10 left-10 animate-float opacity-10" style={{ animationDelay: '0s', animationDuration: '7s' }}>
              <svg className="w-16 h-16 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            
            <div className="absolute top-1/3 right-16 animate-float opacity-10" style={{ animationDelay: '1.5s', animationDuration: '8s' }}>
              <svg className="w-20 h-20 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>

            <div className="absolute bottom-20 left-1/4 animate-float opacity-10" style={{ animationDelay: '2.5s', animationDuration: '9s' }}>
              <svg className="w-16 h-16 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-neutral-50"></div>
      
      {/* Floating shapes */}
      {getShapes()}
      
      {/* Sparkles */}
      <div className="absolute top-1/4 left-1/3 animate-sparkle" style={{ animationDelay: '0s' }}>
        <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
      </div>
      <div className="absolute top-2/3 right-1/4 animate-sparkle" style={{ animationDelay: '1s' }}>
        <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
      </div>
      <div className="absolute bottom-1/3 left-1/2 animate-sparkle" style={{ animationDelay: '2s' }}>
        <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
      </div>
      <div className="absolute top-1/2 right-1/3 animate-sparkle" style={{ animationDelay: '0.5s' }}>
        <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
      </div>
      
      {/* Pulse circles */}
      <div className="absolute top-20 right-1/4 w-32 h-32 rounded-full bg-primary-200/10 animate-pulse-slow"></div>
      <div className="absolute bottom-32 left-1/3 w-40 h-40 rounded-full bg-pink-200/10 animate-pulse-slower"></div>
      <div className="absolute top-1/2 left-1/4 w-36 h-36 rounded-full bg-purple-200/10 animate-pulse-slow"></div>
    </div>
  );
}
