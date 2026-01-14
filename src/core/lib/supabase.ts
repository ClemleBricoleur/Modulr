import { supabase } from '../config/supabase.config';

/**
 * Supabase Authentication Helper
 * 
 * Provides convenient wrapper functions for Supabase authentication operations.
 */
export const auth = {
  /**
   * Sign up a new user
   * @param email User email address
   * @param password User password
   * @returns User data and error (if any)
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign in an existing user
   * @param email User email address
   * @param password User password
   * @returns User data and error (if any)
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign out the current user
   * @returns Error (if any)
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get the currently authenticated user
   * @returns Current user or null
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Listen to authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Subscription object with unsubscribe method
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
