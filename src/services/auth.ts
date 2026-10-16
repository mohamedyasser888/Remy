/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

import { supabase } from './supabase';
import type { SignUpData, SignInData, Profile } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Sign up a new user with email, password, and profile information
 * Profile is created automatically via database trigger
 */
export async function signUp(data: SignUpData): Promise<{ user: User | null; error: Error | null }> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName,
          gender: data.gender,
          age: data.age,
        },
      },
    });

    if (error) throw error;

    // Also update profile with age after creation
    if (authData.user) {
      await supabase
        .from('profiles')
        .update({ age: data.age })
        .eq('id', authData.user.id);
    }

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(data: SignInData): Promise<{ session: Session | null; error: Error | null }> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    return { session: authData.session, error: null };
  } catch (error) {
    return { session: null, error: error as Error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get user profile from profiles table
 */
export async function getUserProfile(userId: string): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

/**
 * Subscribe to authentication state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}
