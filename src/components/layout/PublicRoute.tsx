/**
 * Public Route Component
 * Redirect to app if already authenticated
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common';
import { ROUTES } from '@/utils/constants';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (user) {
    // Already authenticated, redirect to app
    return <Navigate to={ROUTES.WARDROBE} replace />;
  }

  return <>{children}</>;
}
