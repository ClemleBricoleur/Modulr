/**
 * AI Configuration for Statement Scanner
 * Manages AI provider settings stored in localStorage
 */

export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

const STORAGE_KEY_PROVIDER = 'modulr_ai_provider';
const STORAGE_KEY_API_KEY = 'modulr_ai_api_key';

/**
 * Get AI configuration from localStorage
 */
export function getAIConfig(): AIConfig {
  const provider = (localStorage.getItem(STORAGE_KEY_PROVIDER) as AIProvider) || 'openai';
  const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';

  return { provider, apiKey };
}

/**
 * Set AI configuration in localStorage
 */
export function setAIConfig(provider: AIProvider, apiKey: string): void {
  localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
  localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
}

/**
 * Check if AI is configured (has valid API key)
 */
export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return config.apiKey.length > 10; // Basic validation
}

/**
 * Get the API endpoint for the selected provider
 */
export function getAIEndpoint(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'gemini':
      const model = getAIModel(provider);
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    default:
      return '';
  }
}

/**
 * Get the model name for the selected provider
 */
export function getAIModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'gemini':
      return 'gemini-3-flash-preview';
    case 'claude':
      return 'claude-3-5-sonnet-20241022';
    default:
      return '';
  }
}
