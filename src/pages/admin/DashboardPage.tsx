/**
 * Admin Dashboard
 * Beautiful stats + charts, auto-refreshes every 5 seconds
 */

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { getDashboardStats, type DashboardStats } from '@/services/admin';
import { getImageUrl } from '@/services/storage';
import { BrandLogo, Loader } from '@/components/common';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = ['#a855f7','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4'];

// ── Tiny stat card ────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon, gradient, sub,
}: {
  title: string; value: string | number; icon: React.ReactNode;
  gradient: string; sub?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
      {/* decorative blob */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-600 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [lastUpdated, setLastUpdated] = useState('');

  const load = useCallback(async () => {
    const { stats: s } = await getDashboardStats(date);
    if (s) {
      setStats(s);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);
  useRealtimeSync(['profiles', 'posts', 'post_likes', 'page_visits'], load, { admin: true });

  if (loading && !stats) {
    return <div className="flex justify-center items-center h-full py-40"><Loader size="lg" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <BrandLogo className="w-24 h-auto mt-1" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-2 rounded-xl shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live · {lastUpdated || 'loading...'}
        </div>
      </div>

      {/* ── Stat Cards Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Clothes Uploaded"
          value={stats.totalPosts}
          gradient="bg-gradient-to-br from-pink-500 to-rose-500"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          title="Total Likes"
          value={stats.totalLikes}
          gradient="bg-gradient-to-br from-red-400 to-rose-600"
          icon={<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>}
        />
        <StatCard
          title="Today's Visitors"
          value={stats.dailyVisits}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          sub="unique users"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
        {/* Top post mini card */}
        {stats.topPost ? (
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
            <p className="text-xs text-white/70 font-medium">🏆 Most Liked</p>
            <div className="flex items-center gap-2 mt-2">
              <img src={getImageUrl(stats.topPost.image_path)} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-white/30 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{stats.topPost.name}</p>
                <p className="text-xs text-white/70">❤️ {stats.topPost.likes_count}</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
          </div>
        ) : (
          <StatCard
            title="Most Liked"
            value="—"
            gradient="bg-gradient-to-br from-amber-400 to-orange-500"
            icon={<span className="text-2xl">🏆</span>}
          />
        )}
      </div>

      {/* ── Charts Row 1: Area charts ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Visitors area chart */}
        <ChartCard title="Unique Visitors — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.visitsLast7Days}>
              <defs>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
              <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} fill="url(#gVisitors)" dot={{ fill: '#8b5cf6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Likes area chart */}
        <ChartCard title="Likes — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.likesLast7Days}>
              <defs>
                <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
              <Area type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} fill="url(#gLikes)" dot={{ fill: '#ec4899', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ── Charts Row 2: Bar + Pie ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Posts bar chart */}
        <ChartCard title="Clothes Uploaded — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.postsLast7Days} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
              <Bar dataKey="posts" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Age range bar chart */}
        <ChartCard title="👥 Users by Age Range">
          {stats.ageRanges.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.ageRanges} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  formatter={(v: unknown) => `${v} users`}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.ageRanges.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No age data yet — users must set their age on registration
            </div>
          )}
        </ChartCard>

        {/* Unique visitors picker */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Unique Visitors by Date</h3>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50 mb-4"
          />
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-violet-600">{stats.dailyVisits}</p>
              <p className="text-sm text-slate-400 mt-2">unique visitors</p>
              <p className="text-xs text-slate-300 mt-1">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
