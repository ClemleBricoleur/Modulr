/**
 * API Configuration
 * 
 * Toggle USE_SERVER to switch between LocalStorage and your Freebox server.
 * When your Python backend is ready, just set USE_SERVER = true and update BASE_URL.
 */

export const API_CONFIG = {
  // Toggle this when your Freebox Python server is ready
  USE_SERVER: false,
  
  // Your Freebox server IP (update when ready)
  BASE_URL: 'http://192.168.1.X:8000/api',
  
  // Simulate network delay for realistic UX testing (disable in production)
  SIMULATE_DELAY: true,
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

