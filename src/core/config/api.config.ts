/**
 * API Configuration
 * 
 * Toggle USE_SUPABASE to switch between LocalStorage and Supabase.
 * Set USE_SUPABASE = true when your Supabase project is ready.
 */

export const API_CONFIG = {
  // Toggle this to use Supabase instead of localStorage
  USE_SUPABASE: true,
  
  // Simulate network delay for realistic UX testing (disable in production)
  SIMULATE_DELAY: false,
  DELAY_MS: 300,
};

/**
 * Helper to simulate network delay
 */
export const simulateDelay = async (): Promise<void> => {
  if (API_CONFIG.SIMULATE_DELAY) {
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.DELAY_MS));
  }
};
