/**
 * Points Context — global shared state
 * All components read from the same instance, so updates are instant everywhere.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserPoints, getRemyTier } from '@/services/points';

interface PointsContextValue {
  points: number;
  tier: ReturnType<typeof getRemyTier>;
  addPoints: (amount: number) => void;
  refresh: () => Promise<void>;
}

const PointsContext = createContext<PointsContextValue>({
  points: 0,
  tier: getRemyTier(0),
  addPoints: () => {},
  refresh: async () => {},
});

export function PointsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const tier = getRemyTier(points);

  const refresh = useCallback(async () => {
    if (!user) { setPoints(0); return; }
    const p = await getUserPoints(user.id);
    setPoints(p);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPoints = useCallback((amount: number) => {
    setPoints(prev => prev + amount);
  }, []);

  return (
    <PointsContext.Provider value={{ points, tier, addPoints, refresh }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePointsContext() {
  return useContext(PointsContext);
}
