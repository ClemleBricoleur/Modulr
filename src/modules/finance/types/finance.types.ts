export interface Transaction {
  id: string;            // UUID from Supabase
  owner: string;
  tag: string;           // category
  amount: number;
  date: string;          // "YYYY-MM-DD"
  type: 'input' | 'output';
}

export interface MonthData {
  month: string;         // "YYYY-MM"
  input: Transaction[];
  output: Transaction[];
  totalInput: number;
  totalOutput: number;
}

export interface FinanceData {
  months: MonthData[];
}

export interface ExportData {
  exportDate: string;
  version: string;
  data: MonthData[];
}

// ============================================
// CATEGORY AND OWNER TYPES (Database)
// ============================================

export type CategoryType = 'income' | 'expense';

/**
 * Default category from the categories table
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  created_at: string;
}

/**
 * User custom category from the user_categories table
 */
export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  created_at: string;
}

/**
 * Default owner from the owners table
 */
export interface Owner {
  id: string;
  name: string;
  created_at: string;
}

/**
 * User custom owner from the user_owners table
 */
export interface UserOwner {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

/**
 * Combined category (default or custom)
 */
export interface CategoryOption {
  name: string;
  isCustom: boolean;
  id?: string;  // Only present for custom categories
}

/**
 * Combined owner (default or custom)
 */
export interface OwnerOption {
  name: string;
  isCustom: boolean;
  id?: string;  // Only present for custom owners
}

// ============================================
// LEGACY CONSTANTS (for backward compatibility)
// These will be replaced by database values
// ============================================

// Default categories for expenses/income
export const EXPENSE_CATEGORIES = [
  'Assurances',
  'Nourriture',
  'Deplacement',
  'Loisirs',
  'Shopping',
  'Abonnement',
  'Santé'
] as const;

export const INCOME_CATEGORIES = [
  'Salaire',
  'Remboursement',
  'Cadeau'
] as const;

export const DEFAULT_OWNERS = ['Moi'] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type OwnerType = typeof DEFAULT_OWNERS[number] | string;

export type TransactionType = 'input' | 'output';

export interface CreateTransactionInput {
  owner: string;
  tag: string;
  amount: number;
  date: string;
  type: TransactionType;
}

export type PeriodFilter = 'year' | 'all';
export type ViewMode = 'month' | 'year' | 'category';

