import { supabase } from '../config/supabase.config';

/**
 * Supabase Service Utilities
 * 
 * Helper functions for common Supabase operations.
 */

/**
 * Get the current authenticated user's ID
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Ensure user is authenticated, throws error if not
 * @returns User ID
 * @throws Error if not authenticated
 */
export async function ensureAuthenticated(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to perform this action');
  }
  return userId;
}

/**
 * Handle Supabase errors with consistent error messages
 * @param error Supabase error object
 * @param operation Description of the operation that failed
 * @throws Error with formatted message
 */
export function handleSupabaseError(error: { message: string; code?: string }, operation: string): never {
  console.error(`Supabase error during ${operation}:`, error);
  throw new Error(`Failed to ${operation}: ${error.message}`);
}

/**
 * Check if user is currently authenticated (sync check from session)
 * @returns Boolean indicating if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}
