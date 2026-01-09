import { API_CONFIG, simulateDelay } from '../../../core/config/api.config';
import type {
  Transaction,
  MonthData,
  CreateTransactionInput,
  ExportData,
  PeriodFilter
} from '../types/finance.types';

const STORAGE_KEY = 'modulr_finance';

/**
 * Finance Service
 * 
 * Handles all financial transaction CRUD operations.
 * Data is organized by month for efficient querying.
 */
export const FinanceService = {
  /**
   * Get all month data
   */
  async getAllMonths(): Promise<MonthData[]> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/months`);
      if (!res.ok) throw new Error('Failed to fetch finance data');
      return res.json();
    }

    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Get data for a specific month
   */
  async getMonth(monthKey: string): Promise<MonthData | null> {
    const months = await this.getAllMonths();
    return months.find(m => m.month === monthKey) || null;
  },

  /**
   * Get all transactions (flattened)
   */
  async getAllTransactions(): Promise<Transaction[]> {
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
    const all = await this.getAllTransactions();
    return all.filter(t => t.date.startsWith(year.toString()));
  },

  /**
   * Get transactions filtered by month
   */
  async getTransactionsByMonth(monthKey: string): Promise<Transaction[]> {
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

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create transaction');
      return res.json();
    }

    const months = await this.getAllMonths();
    const monthKey = input.date.substring(0, 7); // "YYYY-MM"

    const newTransaction: Transaction = {
      ...input,
      id: Date.now(),
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
  async deleteTransaction(id: number): Promise<boolean> {
    await simulateDelay();

    if (API_CONFIG.USE_SERVER) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/finance/transactions/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
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

      // Validate and normalize each month
      const normalizedMonths: MonthData[] = [];

      // Type for legacy data with 'ammount' typo
      interface LegacyTransaction {
        id: number;
        owner: string;
        tag: string;
        amount?: number;
        ammount?: number; // Legacy typo
        date: string;
        type: 'input' | 'output';
      }

      for (const month of months) {
        if (!month.month || !Array.isArray(month.input) || !Array.isArray(month.output)) {
          throw new Error(`Invalid month data format for: ${month.month || 'unknown'}`);
        }

        // Normalize transactions (handle 'ammount' typo)
        const normalizeTransaction = (t: LegacyTransaction): Transaction => ({
          id: t.id,
          owner: t.owner,
          tag: t.tag,
          // Handle both 'amount' and 'ammount' (legacy typo)
          amount: t.amount ?? t.ammount ?? 0,
          date: t.date,
          type: t.type
        });

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
    const all = await this.getAllTransactions();
    return all.slice(0, limit);
  },
};

