import { useEffect, useRef } from 'react';
import { supabase, supabaseAdmin } from '@/services/supabase';

/**
 * Keeps a view synchronized with database changes. Realtime is the primary
 * path; the fallback refresh protects the UI when a browser sleeps or a
 * Supabase channel temporarily disconnects.
 */
export const REALTIME_FALLBACK_MS = 30_000;
export const REALTIME_DEBOUNCE_MS = 120;

type RealtimeTable =
  | 'profiles'
  | 'wardrobe_items'
  | 'posts'
  | 'post_likes'
  | 'trends'
  | 'trend_likes'
  | 'partners'
  | 'partner_posts'
  | 'messages'
  | 'page_visits';

export function useRealtimeSync(
  tables: RealtimeTable[],
  refresh: () => void | Promise<void>,
  options: { fallbackMs?: number; admin?: boolean } = {},
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const runRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refreshRef.current(), REALTIME_DEBOUNCE_MS);
    };

    const client = options.admin ? (supabaseAdmin ?? supabase) : supabase;
    const channel = client.channel(`live-sync:${tables.join('-')}:${Math.random().toString(36).slice(2)}`);

    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        runRefresh,
      );
    });

    channel.subscribe();
    void refreshRef.current();
    const fallback = window.setInterval(() => void refreshRef.current(), options.fallbackMs ?? REALTIME_FALLBACK_MS);

    return () => {
      if (timer) clearTimeout(timer);
      window.clearInterval(fallback);
      void client.removeChannel(channel);
    };
    // Tables are intentionally serialized so callers can pass stable literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join('|'), options.fallbackMs, options.admin]);
}
