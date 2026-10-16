import type { RemyTier } from '@/services/points';

function TierIcon({ tier }: { tier: RemyTier }) {
  if (tier.id === 'remy_ulite') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M4 7.5 8 3h8l4 4.5-8 13-8-13Z" fill="currentColor" opacity=".95" />
        <path d="m4 7.5 8 2.5 8-2.5M12 10v10.5M8 3l4 7 4-7" stroke="white" strokeWidth="1.1" opacity=".8" />
      </svg>
    );
  }
  if (tier.id === 'remy_icon') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="m4 6 4 3 4-5 4 5 4-3-1.2 10H5.2L4 6Z" fill="currentColor" />
        <path d="M6 19h12M8 21h8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
        <path d="m12 8 .8 1.5 1.7.2-1.25 1.15.3 1.65-1.55-.75-1.55.75.3-1.65L9.5 9.7l1.7-.2L12 8Z" fill="white" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 2 20 6.5v5.1c0 4.6-3.1 8.3-8 10.4-4.9-2.1-8-5.8-8-10.4V6.5L12 2Z" fill="currentColor" />
      <path d="m12 6 .95 2.45 2.6.12-2 1.6.68 2.5L12 11.2l-2.23 1.47.68-2.5-2-1.6 2.6-.12L12 6Z" fill="white" />
      <path d="M8 16.5c1.2 1.2 2.5 1.9 4 2.5 1.5-.6 2.8-1.3 4-2.5" stroke="white" strokeWidth="1" opacity=".8" />
    </svg>
  );
}

export function RemyTierBadge({ tier, size = 'sm' }: { tier: RemyTier; size?: 'sm' | 'md' }) {
  return (
    <span className="group relative inline-flex items-center justify-center">
      <span
        aria-label={tier.name}
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${tier.id === 'rems_muse' ? 'from-slate-300 via-slate-500 to-slate-700' : tier.id === 'remy_icon' ? 'from-yellow-300 via-amber-400 to-yellow-700' : 'from-cyan-200 via-sky-400 to-blue-700'} text-white shadow-md ring-2 ring-white transition-transform duration-200 group-hover:scale-110 ${size === 'md' ? 'h-8 w-8' : 'h-6 w-6'}`}
      >
        <TierIcon tier={tier} />
      </span>
      <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-48 -translate-x-1/2 translate-y-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="block font-semibold">{tier.name}</span>
        <span className="mt-0.5 block text-[10px] text-slate-300">{tier.description}</span>
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
      </span>
    </span>
  );
}
