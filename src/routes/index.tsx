/**
 * Application Routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AppLayout } from '@/components/layout';
import { AdminRoute } from '@/components/layout/AdminRoute';
import { Login, Register } from '@/pages/auth';
import { WardrobePage } from '@/pages/wardrobe/WardrobePage';
import { HomePage } from '@/pages/home/HomePage';
import { StylistPage } from '@/pages/stylist/StylistPage';
import { TrendsPage } from '@/pages/trends/TrendsPage';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { AdminHomePage } from '@/pages/admin/AdminHomePage';
import { AdminTrendsPage } from '@/pages/admin/AdminTrendsPage';
import { LeaderboardPage } from '@/pages/admin/LeaderboardPage';
import { MessagesPage } from '@/pages/admin/MessagesPage';
import { AdminPartnersPage } from '@/pages/admin/AdminPartnersPage';
import { PartnersPage } from '@/pages/partners/PartnersPage';
import { ROUTES } from '@/utils/constants';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public user routes ─────────────────────────────────── */}
      <Route path={ROUTES.LOGIN}    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path={ROUTES.REGISTER} element={<PublicRoute><Register /></PublicRoute>} />

      {/* ── User app routes ────────────────────────────────────── */}
      <Route path={ROUTES.APP} element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to={ROUTES.WARDROBE} replace />} />
        <Route path="wardrobe"  element={<WardrobePage />} />
        <Route path="home"      element={<HomePage />} />
        <Route path="stylist"   element={<StylistPage />} />
        <Route path="trends"    element={<TrendsPage />} />
        <Route path="partners"  element={<PartnersPage />} />
      </Route>

      {/* ── Admin login (public) ─────────────────────────────── */}
      <Route path="/admin"       element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ── Admin panel (protected — nested under /admin) ──────── */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="home"        element={<AdminHomePage />} />
        <Route path="trends"      element={<AdminTrendsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="messages"    element={<MessagesPage />} />
        <Route path="partners"    element={<AdminPartnersPage />} />
      </Route>

      {/* ── Catch all ─────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to={ROUTES.APP} replace />} />
    </Routes>
  );
}
