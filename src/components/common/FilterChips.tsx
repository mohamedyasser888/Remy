/**
 * Filter Chips Component
 * Horizontal scrollable category filter chips
 */

interface FilterChipsProps<T extends string> {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
}

export function FilterChips<T extends string>({
  options,
  selected,
  onChange,
  getLabel = (value) => value,
}: FilterChipsProps<T>) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((option, index) => {
        const isSelected = selected === option;
        
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            style={{ animationDelay: `${index * 45}ms` }}
            className={`animate-slide-up touch-target min-w-0 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200
              ${
                isSelected
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20 ring-2 ring-primary-200 ring-offset-1'
                  : 'bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 hover:-translate-y-0.5 hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200'
              }
            `}
            aria-pressed={isSelected}
          >
            <span className="block truncate">{getLabel(option)}</span>
          </button>
        );
      })}
    </div>
  );
}
