import { API_CONFIG, simulateDelay } from '../../../core/config/api.config';
import { supabase } from '../../../core/config/supabase.config';
import { ensureAuthenticated, handleSupabaseError } from '../../../core/lib/supabaseService';
import type {
  Transaction,
  MonthData,
  CreateTransactionInput,
  ExportData,
  PeriodFilter
} from '../types/finance.types';

const STORAGE_KEY = 'modulr_finance';

/**
 * Database row type from Supabase
 */
interface TransactionRow {
  id: string;
  user_id: string;
  owner: string;
  tag: string;
  amount: number;
  date: string;
  type: 'input' | 'output';
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to Transaction
 */
function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    owner: row.owner,
    tag: row.tag,
    amount: Number(row.amount),
    date: row.date,
    type: row.type,
  };
}

/**
 * Get the first day of the next month from a monthKey (YYYY-MM)
 * Used for exclusive date range queries (date < nextMonthFirstDay)
 */
function getFirstDayOfNextMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  // Calculate next month
  let nextYear = year;
  let nextMonth = month + 1;

  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}

/**
 * Group transactions by month
 */
function groupTransactionsByMonth(transactions: Transaction[]): MonthData[] {
  const monthMap = new Map<string, MonthData>();

  transactions.forEach(t => {
    const monthKey = t.date.substring(0, 7); // "YYYY-MM"

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        input: [],
        output: [],
        totalInput: 0,
        totalOutput: 0,
      });
    }

    const monthData = monthMap.get(monthKey)!;

    if (t.type === 'input') {
      monthData.input.push(t);
      monthData.totalInput += t.amount;
    } else {
      monthData.output.push(t);
      monthData.totalOutput += t.amount;
    }
  });

  // Sort by month descending (newest first)
  return Array.from(monthMap.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
}

/**
 * Finance Service
 * 
 * Handles all financial transaction CRUD operations.
 * Uses Supabase for persistence when enabled, falls back to localStorage.
 */
export const FinanceService = {
  /**
   * Get all month data
   */
  async getAllMonths(): Promise<MonthData[]> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch transactions');

      const transactions = (data || []).map(rowToTransaction);
      return groupTransactionsByMonth(transactions);
    }

    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get data for a specific month
   */
  async getMonth(monthKey: string): Promise<MonthData | null> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();
      const startDate = `${monthKey}-01`;
      const endDate = getFirstDayOfNextMonth(monthKey);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch month data');

      const transactions = (data || []).map(rowToTransaction);
      const months = groupTransactionsByMonth(transactions);
      return months[0] || null;
    }

    const months = await this.getAllMonths();
    return months.find(m => m.month === monthKey) || null;
  },

  /**
   * Get all transactions (flattened)
   */
  async getAllTransactions(): Promise<Transaction[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch all transactions');

      return (data || []).map(rowToTransaction);
    }

    const months = await this.getAllMonths();
    const transactions: Transaction[] = [];

    months.forEach(month => {
      transactions.push(...month.input, ...month.output);
    });

    return transactions.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /**
   * Get transactions filtered by year
   */
  async getTransactionsByYear(year: number): Promise<Transaction[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch transactions by year');

      return (data || []).map(rowToTransaction);
    }

    const all = await this.getAllTransactions();
    return all.filter(t => t.date.startsWith(year.toString()));
  },

  /**
   * Get transactions filtered by month
   */
  async getTransactionsByMonth(monthKey: string): Promise<Transaction[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();
      const startDate = `${monthKey}-01`;
      const endDate = getFirstDayOfNextMonth(monthKey);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false });

      if (error) handleSupabaseError(error, 'fetch transactions by month');

      return (data || []).map(rowToTransaction);
    }

    const month = await this.getMonth(monthKey);
    if (!month) return [];
    return [...month.input, ...month.output].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /**
   * Calculate totals
   */
  async getTotals(filter: PeriodFilter = 'all', year?: number): Promise<{
    totalInput: number;
    totalOutput: number;
    balance: number;
  }> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      let query = supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId);

      if (filter === 'year' && year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) handleSupabaseError(error, 'calculate totals');

      let totalInput = 0;
      let totalOutput = 0;

      (data || []).forEach((row: { amount: number; type: string }) => {
        if (row.type === 'input') {
          totalInput += Number(row.amount);
        } else {
          totalOutput += Number(row.amount);
        }
      });

      return { totalInput, totalOutput, balance: totalInput - totalOutput };
    }

    const months = await this.getAllMonths();
    let filteredMonths = months;

    if (filter === 'year' && year) {
      filteredMonths = months.filter(m => m.month.startsWith(year.toString()));
    }

    const totalInput = filteredMonths.reduce((sum, m) => sum + m.totalInput, 0);
    const totalOutput = filteredMonths.reduce((sum, m) => sum + m.totalOutput, 0);

    return {
      totalInput,
      totalOutput,
      balance: totalInput - totalOutput
    };
  },

  /**
   * Add a new transaction
   */
  async addTransaction(input: CreateTransactionInput): Promise<Transaction> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          owner: input.owner,
          tag: input.tag,
          amount: input.amount,
          date: input.date,
          type: input.type,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'create transaction');

      return rowToTransaction(data);
    }

    const months = await this.getAllMonths();
    const monthKey = input.date.substring(0, 7); // "YYYY-MM"

    const newTransaction: Transaction = {
      ...input,
      id: Date.now().toString(),
    };

    // Find or create month
    let monthData = months.find(m => m.month === monthKey);

    if (!monthData) {
      monthData = {
        month: monthKey,
        input: [],
        output: [],
        totalInput: 0,
        totalOutput: 0
      };
      months.push(monthData);
    }

    // Add transaction to appropriate array
    if (input.type === 'input') {
      monthData.input.push(newTransaction);
      monthData.totalInput += input.amount;
    } else {
      monthData.output.push(newTransaction);
      monthData.totalOutput += input.amount;
    }

    // Sort months chronologically
    months.sort((a, b) => b.month.localeCompare(a.month));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(months));
    return newTransaction;
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<boolean> {
    await simulateDelay();

    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete transaction error:', error);
        return false;
      }

      return true;
    }

    const months = await this.getAllMonths();
    let found = false;

    for (const month of months) {
      // Check input array
      const inputIndex = month.input.findIndex(t => t.id === id);
      if (inputIndex !== -1) {
        month.totalInput -= month.input[inputIndex].amount;
        month.input.splice(inputIndex, 1);
        found = true;
        break;
      }

      // Check output array
      const outputIndex = month.output.findIndex(t => t.id === id);
      if (outputIndex !== -1) {
        month.totalOutput -= month.output[outputIndex].amount;
        month.output.splice(outputIndex, 1);
        found = true;
        break;
      }
    }

    if (found) {
      // Remove empty months
      const cleanedMonths = months.filter(m =>
        m.input.length > 0 || m.output.length > 0
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedMonths));
    }

    return found;
  },

  /**
   * Get available years from data
   */
  async getAvailableYears(): Promise<number[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId);

      if (error) handleSupabaseError(error, 'fetch available years');

      const years = new Set<number>();
      (data || []).forEach((row: { date: string }) => {
        years.add(parseInt(row.date.substring(0, 4)));
      });

      return Array.from(years).sort((a, b) => b - a);
    }

    const months = await this.getAllMonths();
    const years = new Set<number>();

    months.forEach(m => {
      years.add(parseInt(m.month.substring(0, 4)));
    });

    return Array.from(years).sort((a, b) => b - a);
  },

  /**
   * Get available months for a year
   */
  async getAvailableMonths(year: number): Promise<string[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) handleSupabaseError(error, 'fetch available months');

      const months = new Set<string>();
      (data || []).forEach((row: { date: string }) => {
        months.add(row.date.substring(0, 7));
      });

      return Array.from(months).sort((a, b) => b.localeCompare(a));
    }

    const months = await this.getAllMonths();
    return months
      .filter(m => m.month.startsWith(year.toString()))
      .map(m => m.month)
      .sort((a, b) => b.localeCompare(a));
  },

  /**
   * Get transactions grouped by category
   */
  async getByCategory(monthKey?: string): Promise<Record<string, Transaction[]>> {
    let transactions: Transaction[];

    if (monthKey) {
      transactions = await this.getTransactionsByMonth(monthKey);
    } else {
      transactions = await this.getAllTransactions();
    }

    const grouped: Record<string, Transaction[]> = {};

    transactions.forEach(t => {
      if (!grouped[t.tag]) {
        grouped[t.tag] = [];
      }
      grouped[t.tag].push(t);
    });

    return grouped;
  },

  /**
   * Get category totals
   */
  async getCategoryTotals(type: 'input' | 'output', monthKey?: string): Promise<Record<string, number>> {
    let transactions: Transaction[];

    if (monthKey) {
      transactions = await this.getTransactionsByMonth(monthKey);
    } else {
      transactions = await this.getAllTransactions();
    }

    const totals: Record<string, number> = {};

    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        totals[t.tag] = (totals[t.tag] || 0) + t.amount;
      });

    return totals;
  },

  /**
   * Export all data as JSON
   */
  async exportData(): Promise<ExportData> {
    const months = await this.getAllMonths();

    return {
      exportDate: new Date().toISOString().split('T')[0],
      version: '1.0.0',
      data: months
    };
  },

  /**
   * Import data from JSON
   * Supports multiple formats:
   * - { months: [...] } (user's legacy format)
   * - { data: [...] } (app export format)
   * - [...] (direct array)
   * Also handles 'ammount' typo in legacy data
   */
  async importData(importedData: unknown): Promise<boolean> {
    await simulateDelay();

    try {
      let months: MonthData[];

      // Handle different formats
      const data = importedData as Record<string, unknown>;

      if (Array.isArray(importedData)) {
        // Direct array format
        months = importedData as MonthData[];
      } else if (data.months && Array.isArray(data.months)) {
        // Legacy format: { months: [...] }
        months = data.months as MonthData[];
      } else if (data.data && Array.isArray(data.data)) {
        // Export format: { data: [...] }
        months = data.data as MonthData[];
      } else {
        throw new Error('Invalid data format: expected { months: [...] }, { data: [...] }, or array');
      }

      // Type for legacy data with 'ammount' typo
      interface LegacyTransaction {
        id: number | string;
        owner: string;
        tag: string;
        amount?: number;
        ammount?: number; // Legacy typo
        date: string;
        type: 'input' | 'output';
      }

      // Normalize transactions (handle 'ammount' typo)
      const normalizeTransaction = (t: LegacyTransaction): Transaction => ({
        id: String(t.id),
        owner: t.owner,
        tag: t.tag,
        // Handle both 'amount' and 'ammount' (legacy typo)
        amount: t.amount ?? t.ammount ?? 0,
        date: t.date,
        type: t.type
      });

      if (API_CONFIG.USE_SUPABASE) {
        const userId = await ensureAuthenticated();

        // Flatten all transactions from months
        const allTransactions: CreateTransactionInput[] = [];

        for (const month of months) {
          if (!month.month || !Array.isArray(month.input) || !Array.isArray(month.output)) {
            throw new Error(`Invalid month data format for: ${month.month || 'unknown'}`);
          }

          [...month.input, ...month.output].forEach((t) => {
            const normalized = normalizeTransaction(t as LegacyTransaction);
            allTransactions.push({
              owner: normalized.owner,
              tag: normalized.tag,
              amount: normalized.amount,
              date: normalized.date,
              type: normalized.type,
            });
          });
        }

        // Insert all transactions
        if (allTransactions.length > 0) {
          const rowsToInsert = allTransactions.map(t => ({
            user_id: userId,
            ...t,
          }));

          const { error } = await supabase
            .from('transactions')
            .insert(rowsToInsert);

          if (error) handleSupabaseError(error, 'import transactions');
        }

        return true;
      }

      // Validate and normalize each month for localStorage
      const normalizedMonths: MonthData[] = [];

      for (const month of months) {
        if (!month.month || !Array.isArray(month.input) || !Array.isArray(month.output)) {
          throw new Error(`Invalid month data format for: ${month.month || 'unknown'}`);
        }

        normalizedMonths.push({
          month: month.month,
          input: month.input.map(t => normalizeTransaction(t as LegacyTransaction)),
          output: month.output.map(t => normalizeTransaction(t as LegacyTransaction)),
          totalInput: month.totalInput,
          totalOutput: month.totalOutput
        });
      }

      // Sort months chronologically (newest first)
      normalizedMonths.sort((a, b) => b.month.localeCompare(a.month));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedMonths));
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  /**
   * Download data as JSON file
   */
  async downloadExport(): Promise<void> {
    const exportData = await this.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modulr-finance-${exportData.exportDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Get recent transactions (last N)
   */
  async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) handleSupabaseError(error, 'fetch recent transactions');

      return (data || []).map(rowToTransaction);
    }

    const all = await this.getAllTransactions();
    return all.slice(0, limit);
  },

  /**
   * Delete all transactions (DEV ONLY)
   * Use with caution - this permanently deletes all user transactions
   */
  async deleteAllTransactions(): Promise<boolean> {
    if (API_CONFIG.USE_SUPABASE) {
      const userId = await ensureAuthenticated();

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Delete all transactions error:', error);
        return false;
      }

      return true;
    }

    // LocalStorage fallback
    localStorage.removeItem('modulr_finance');
    return true;
  },
};
