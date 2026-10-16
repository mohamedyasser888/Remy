interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'w-32 h-auto' }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/rwm.jpeg"
        alt="Remy mark"
        className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
      />
      <img
        src="/remy-transparent.png"
        alt="Remy"
        className="min-w-0 flex-1 scale-125 origin-left object-contain"
      />
    </div>
  );
}
