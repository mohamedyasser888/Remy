/**
 * useAuth Hook
 * Manages authentication state and provides auth operations
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as authService from '@/services/auth';
import type { Profile, SignUpData, SignInData } from '@/types';
import { handleSupabaseError, logError } from '@/utils/errorHandling';
import { recordVisit } from '@/services/admin';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (data: SignInData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Wraps the app and provides auth state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { profile: userProfile, error } = await authService.getUserProfile(userId);
    
    if (error) {
      logError(error, 'Fetch profile');
      return;
    }

    setProfile(userProfile);
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    authService.getCurrentSession().then((currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
        recordVisit(currentSession.user.id);
      }

      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = authService.onAuthStateChange(async (newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (data: SignUpData): Promise<{ error: Error | null }> => {
    try {
      const { error } = await authService.signUp(data);

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      // Profile will be created via trigger and loaded via auth state change
      return { error: null };
    } catch (error) {
      logError(error, 'Sign up');
      return { error: handleSupabaseError(error) };
    }
  };

  // Sign in function
  const signIn = async (data: SignInData): Promise<{ error: Error | null }> => {
    try {
      const { error } = await authService.signIn(data);

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      // Session and profile will be loaded via auth state change
      return { error: null };
    } catch (error) {
      logError(error, 'Sign in');
      return { error: handleSupabaseError(error) };
    }
  };

  // Sign out function
  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await authService.signOut();

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      // State will be cleared via auth state change
      return { error: null };
    } catch (error) {
      logError(error, 'Sign out');
      return { error: handleSupabaseError(error) };
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Access auth state and operations
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
