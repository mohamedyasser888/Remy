/**
 * Admin Leaderboard
 * ALL registered users ranked by points — includes 0-point users.
 * Refreshes every 10 seconds. CSV export available.
 */

import { useEffect, useState, useCallback } from 'react';
import { getLeaderboard, subscribeLeaderboard, REMY_TIERS, type LeaderboardEntry, type RemyTierId } from '@/services/points';
import { Loader, RemyTierBadge } from '@/components/common';

const MEDAL = ['🥇', '🥈', '🥉'];

function exportCSV(entries: LeaderboardEntry[]) {
  const rows = [
    ['Rank', 'Name', 'Points', 'Badge'],
    ...entries.map((e, index) => [index + 1, e.display_name, e.total_points, e.tier.name]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RemyBadge({ tier, compact = false }: { tier: LeaderboardEntry['tier']; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${tier.className} text-white shadow-sm ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs font-semibold'}`}>
      <RemyTierBadge tier={tier} size={compact ? 'sm' : 'md'} />
      {tier.name}
    </span>
  );
}

function exportPDF(entries: LeaderboardEntry[]) {
  const canvas  = document.createElement('canvas');
  const rowH    = 36;
  const headerH = 120;
  const footerH = 40;
  const pageW   = 794; // A4 width at 96dpi
  canvas.width  = pageW;
  canvas.height = headerH + entries.length * rowH + footerH + 20;

  const ctx = canvas.getContext('2d')!;

  // ── Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Header bar
  const grad = ctx.createLinearGradient(0, 0, pageW, 0);
  grad.addColorStop(0, '#a855f7');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pageW, 80);

  // ── Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🏆  Leaderboard', 40, 50);

  // ── Date
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'right';
  ctx.fillText(
    `Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  ·  ${entries.length} users`,
    pageW - 40, 50
  );

  // ── Column headers
  const cols = [
    { label: 'Rank',   x: 40,  w: 80,  align: 'center' as const },
    { label: 'User',   x: 140, w: 400, align: 'left'   as const },
    { label: 'Points', x: 580, w: 140, align: 'right'  as const },
  ];

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 85, pageW, 30);

  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  cols.forEach(col => {
    ctx.textAlign = col.align;
    ctx.fillText(col.label.toUpperCase(), col.x + (col.align === 'right' ? col.w : 0), 105);
  });

  // ── Rows
  const MEDALS = ['🥇', '🥈', '🥉'];
  entries.forEach((entry, i) => {
    const y = headerH + i * rowH;

    // Alternating row bg
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(0, y, pageW, rowH);

    // Highlight top 3
    if (i < 3) {
      const barColors = ['#fef3c7', '#f1f5f9', '#fef3c7'];
      ctx.fillStyle = barColors[i];
      ctx.fillRect(0, y, pageW, rowH);
      // Left accent
      const accentColors = ['#f59e0b', '#94a3b8', '#d97706'];
      ctx.fillStyle = accentColors[i];
      ctx.fillRect(0, y, 4, rowH);
    }

    // Rank
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = i < 3 ? '#92400e' : '#94a3b8';
    ctx.fillText(i < 3 ? MEDALS[i] : String(entry.rank), 80, y + rowH * 0.65);

    // Avatar circle
    ctx.fillStyle = entry.total_points > 0 ? '#a855f7' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(160, y + rowH / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = entry.total_points > 0 ? '#fff' : '#94a3b8';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(entry.display_name.charAt(0).toUpperCase(), 160, y + rowH / 2 + 4);

    // Name
    ctx.textAlign = 'left';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(entry.display_name, 182, y + rowH * 0.65);

    // Points
    ctx.textAlign = 'right';
    if (entry.total_points > 0) {
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = '#7c3aed';
      ctx.fillText(`${entry.total_points} RMS`, 720, y + rowH * 0.65);
    } else {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('—', 720, y + rowH * 0.65);
    }

    // Row bottom border
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + rowH);
    ctx.lineTo(pageW, y + rowH);
    ctx.stroke();
  });

  // ── Footer
  const footerY = headerH + entries.length * rowH + 10;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, footerY, pageW, footerH);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  const totalPts = entries.reduce((s, e) => s + e.total_points, 0);
  ctx.fillText(`${entries.length} users · ${totalPts} total points · Remy`, pageW / 2, footerY + 25);

  // ── Convert to PDF via data URL trick (open in new tab → user prints/saves as PDF)
  const imgData = canvas.toDataURL('image/png');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Leaderboard</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; display:flex; justify-content:center; align-items:flex-start; padding:20px; }
        img  { max-width:100%; box-shadow:0 4px 24px rgba(0,0,0,.12); border-radius:8px; }
        @media print {
          body { padding:0; }
          img  { max-width:100%; box-shadow:none; border-radius:0; }
        }
      </style>
    </head>
    <body>
      <img src="${imgData}" />
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    // Trigger print dialog after image loads
    win.onload = () => win.print();
  }
}

export function LeaderboardPage() {
  const [entries, setEntries]     = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [search, setSearch]       = useState('');
  const [selectedTier, setSelectedTier] = useState<RemyTierId>('rems_muse');

  const load = useCallback(async () => {
    const { entries: e } = await getLeaderboard();
    setEntries(e);
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  useEffect(() => {
    // Initial load
    load();

    // ── Supabase Realtime: instant push whenever DB changes ──────────────
    const unsubscribe = subscribeLeaderboard(load);

    // ── 3s polling fallback (catches anything Realtime might miss) ────────
    const interval = setInterval(load, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  const tierEntries = entries.filter(e => e.tier.id === selectedTier);
  const filtered = tierEntries.filter(e =>
    e.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPoints = entries.reduce((s, e) => s + e.total_points, 0);

  return (
    <div className="p-8 min-h-full bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🏆 Leaderboard</h1>
          <p className="text-slate-500 mt-1 text-sm">
            All {entries.length} users · {totalPoints} total points earned
            <span className="ml-2 text-xs text-slate-400">
              (10 RMS per post · 2 RMS per like · no spam)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-2 rounded-xl shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live · {lastUpdated || '...'}
          </div>
          {/* Export buttons */}
          <button
            onClick={() => exportCSV(filtered)}
            disabled={entries.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => exportPDF(entries)}
            disabled={entries.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:from-violet-600 hover:to-purple-700 shadow-sm disabled:opacity-40 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-slate-600 font-medium">No users yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {REMY_TIERS.map(tier => {
              const count = entries.filter(entry => entry.tier.id === tier.id).length;
              const active = selectedTier === tier.id;
              return (
                <button key={tier.id} onClick={() => setSelectedTier(tier.id)} aria-pressed={active}
                  className={`text-left rounded-2xl border p-4 transition-all ${active ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-100' : 'border-slate-200 bg-white hover:border-primary-200'}`}>
                  <div className="flex items-center justify-between gap-3"><RemyBadge tier={tier} /><span className="text-xl font-bold text-slate-800">{count}</span></div>
                  <p className="mt-2 text-xs text-slate-500">{tier.description} · users who reached this stage</p>
                </button>
              );
            })}
          </div>

          {/* ── Top 3 podium ───────────────────────────────────────── */}
          {filtered.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-2 items-end">
              {/* Podium order: 2nd (silver) left, 1st (gold) center tall, 3rd (bronze) right */}
              {[
                { entry: filtered[1], podiumIdx: 1 },
                { entry: filtered[0], podiumIdx: 0 },
                { entry: filtered[2], podiumIdx: 2 },
              ].map(({ entry, podiumIdx }) => {
                if (!entry) return <div key={podiumIdx} />;
                const heights   = ['h-44', 'h-36', 'h-28']; // gold tallest, silver, bronze
                const gradients = [
                  'from-yellow-400 to-amber-500',   // gold
                  'from-slate-400 to-slate-500',    // silver
                  'from-amber-600 to-amber-700',    // bronze
                ];
                const labels = ['🥇 #1', '🥈 #2', '🥉 #3'];
                return (
                  <div
                    key={entry.user_id}
                    className={`bg-gradient-to-br ${gradients[podiumIdx]} rounded-2xl p-5 text-center shadow-lg text-white flex flex-col items-center justify-center ${heights[podiumIdx]}`}
                  >
                    <div className="text-3xl mb-1">{MEDAL[podiumIdx]}</div>
                    <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center mb-2 border-2 border-white/40">
                      <span className="text-xl font-bold">{entry.display_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-base truncate w-full text-center px-2">{entry.display_name}</p>
                    <p className="text-white/80 text-xs mt-1">
                      <span className="text-2xl font-extrabold text-white">{entry.total_points}</span> RMS
                    </p>
                    <span className="mt-1 text-xs text-white/60">{labels[podiumIdx]}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Search ─────────────────────────────────────────────── */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
            />
          </div>

          {/* ── Full table ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Rank</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((entry, index) => {
                  const stageRank = index + 1;
                  const hasPoints = entry.total_points > 0;
                  return (
                    <tr key={entry.user_id} className="hover:bg-slate-50 transition-colors">
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          stageRank === 1 ? 'bg-yellow-100 text-yellow-600' :
                          stageRank === 2 ? 'bg-slate-100 text-slate-600' :
                          stageRank === 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {stageRank <= 3 ? MEDAL[stageRank - 1] : stageRank}
                        </span>
                      </td>
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            hasPoints ? 'bg-gradient-to-br from-primary-400 to-primary-600' : 'bg-slate-100'
                          }`}>
                            <span className={`font-bold text-sm ${hasPoints ? 'text-white' : 'text-slate-400'}`}>
                              {entry.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-800">{entry.display_name}</span>
                          <RemyTierBadge tier={entry.tier} />
                        </div>
                      </td>
                      {/* Points */}
                      <td className="px-6 py-4 text-right">
                        {hasPoints ? (
                          <>
                            <span className="font-bold text-slate-800 text-lg">{entry.total_points}</span>
                            <span className="text-slate-400 text-sm ml-1">RMS</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded-full">No points yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && search && (
              <div className="text-center py-10 text-slate-400 text-sm">
                No users matching "{search}"
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
