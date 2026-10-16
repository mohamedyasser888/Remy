/**
 * AdminRoute — redirects to /admin login if not authenticated as admin
 */

import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdminAuth();
  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
