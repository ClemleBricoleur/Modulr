/**
 * Locale and Currency Configuration
 * 
 * Centralized configuration for number/currency formatting throughout the app.
 */

export const LOCALE_CONFIG = {
  // Locale for number/date formatting
  locale: 'fr-FR',
  
  // Currency code (ISO 4217)
  currency: 'CAD',
};

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(LOCALE_CONFIG.locale, {
    style: 'currency',
    currency: LOCALE_CONFIG.currency,
  }).format(amount);
};

/**
 * Format a date for display
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(LOCALE_CONFIG.locale, {
    day: '2-digit',
    month: 'short',
  });
};

/**
 * Format a month for display
 * @param monthKey - Month key in YYYY-MM format
 * @returns Formatted month string
 */
export const formatMonth = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString(LOCALE_CONFIG.locale, {
    month: 'long',
    year: 'numeric',
  });
};
