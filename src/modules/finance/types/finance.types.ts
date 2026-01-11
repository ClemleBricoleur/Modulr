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

// Default categories for expenses/income
export const EXPENSE_CATEGORIES = [
  'assurances',
  'nourriture',
  'deplacement',
  'loyer',
  'loisirs',
  'santé',
  'shopping',
  'autres'
] as const;

export const INCOME_CATEGORIES = [
  'salaire',
  'remboursement',
  'cadeau',
  'autres'
] as const;

export const DEFAULT_OWNERS = ['Parents', 'Me'] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type Owner = typeof DEFAULT_OWNERS[number] | string;

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

