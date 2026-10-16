/**
 * Side Navigation Component
 * Desktop sidebar navigation
 */

import { NavLink } from 'react-router-dom';
import { useT } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { BrandLogo, Button, RemyTierBadge } from '@/components/common';
import { LanguageSwitcher } from '@/components/common';
import { usePoints } from '@/hooks/usePoints';
import { useEffect, useRef, useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

export function SideNav() {
  const t = useT();
  const { profile, signOut } = useAuth();
  const { points, tier } = usePoints();
  const [bump, setBump] = useState(false);
  const prevPoints = useRef(points);

  useEffect(() => {
    if (points !== prevPoints.current) {
      setBump(true);
      setTimeout(() => setBump(false), 600);
      prevPoints.current = points;
    }
  }, [points]);

  const navItems: NavItem[] = [
    {
      to: ROUTES.WARDROBE,
      label: t('navigation.wardrobe'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      to: ROUTES.HOME,
      label: t('navigation.home'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: ROUTES.STYLIST,
      label: t('navigation.stylist'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      to: ROUTES.TRENDS,
      label: t('navigation.trends'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      to: ROUTES.PARTNERS,
      label: t('navigation.partners'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="relative z-20 hidden lg:flex flex-col w-64 bg-neutral-50 border-r border-neutral-200 h-screen sticky top-0 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <BrandLogo className="w-40 h-auto" />
        {profile && (
            <div className="mt-2 flex flex-col items-start gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-600 font-medium">{profile.display_name}</p>
                <RemyTierBadge tier={tier} />
              </div>
              <div
                className={`flex items-center gap-1.5 bg-primary-500 rounded-full px-3 py-1.5 shadow-md transition-transform ${
                  bump ? 'scale-125' : 'scale-100'
                }`}
              >
                <span className="text-base leading-none">⭐</span>
                <span className="text-white font-extrabold text-sm leading-none">{points}</span>
                <span className="text-white/80 text-xs leading-none">RMS</span>
              </div>
            </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200 space-y-2">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          fullWidth
          onClick={handleLogout}
          className="justify-start"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('auth.logout')}
        </Button>
      </div>
    </aside>
  );
}
