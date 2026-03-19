/**
 * Statement Preview Modal
 * Displays extracted transactions from a bank statement scan
 * Allows users to review, edit, and import transactions
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { FinanceService } from '../services/financeService';
import { formatCurrency } from '../../../core/config/locale.config';
import type { ExtractedTransaction } from '../../../core/services/aiService';
import type { CategoryOption, OwnerOption } from '../types/finance.types';

/**
 * Preview transaction with additional fields for user input
 */
interface PreviewTransaction extends ExtractedTransaction {
  id: string;
  owner: string;
  category: string;
  selected: boolean;
}

interface StatementPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: ExtractedTransaction[];
  onImport: () => void;
}

export const StatementPreviewModal = ({
  isOpen,
  onClose,
  transactions,
  onImport,
}: StatementPreviewModalProps) => {
  const [previewTransactions, setPreviewTransactions] = useState<PreviewTransaction[]>([]);
  const [categories, setCategories] = useState<{ income: CategoryOption[]; expense: CategoryOption[] }>({
    income: [],
    expense: [],
  });
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories and owners
  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incomeCategories, expenseCategories, ownersList] = await Promise.all([
        FinanceService.getAllCategoriesFromDB('income'),
        FinanceService.getAllCategoriesFromDB('expense'),
        FinanceService.getAllOwnersFromDB(),
      ]);

      setCategories({
        income: incomeCategories,
        expense: expenseCategories,
      });
      setOwners(ownersList);
    } catch (err) {
      console.error('Failed to load options:', err);
      setError('Failed to load categories and owners');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize preview transactions when modal opens
  useEffect(() => {
    if (isOpen && transactions.length > 0) {
      loadOptions();

      // Create preview transactions with default values
      const previews: PreviewTransaction[] = transactions.map((t, index) => ({
        ...t,
        id: `preview-${index}`,
        owner: '',
        category: '',
        selected: true,
      }));

      setPreviewTransactions(previews);
    }
  }, [isOpen, transactions, loadOptions]);

  // Set default owner/category when options are loaded
  useEffect(() => {
    if (owners.length > 0 && previewTransactions.length > 0) {
      setPreviewTransactions(prev => prev.map(t => ({
        ...t,
        owner: t.owner || owners[0]?.name || '',
        category: t.category || (t.type === 'input'
          ? categories.income[0]?.name
          : categories.expense[0]?.name) || '',
      })));
    }
  }, [owners, categories, previewTransactions.length]);

  const handleToggleSelect = (id: string) => {
    setPreviewTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleToggleAll = () => {
    const allSelected = previewTransactions.every(t => t.selected);
    setPreviewTransactions(prev =>
      prev.map(t => ({ ...t, selected: !allSelected }))
    );
  };

  const handleOwnerChange = (id: string, owner: string) => {
    setPreviewTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, owner } : t))
    );
  };

  const handleCategoryChange = (id: string, category: string) => {
    setPreviewTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, category } : t))
    );
  };

  const handleImport = async () => {
    const selectedTransactions = previewTransactions.filter(t => t.selected);

    if (selectedTransactions.length === 0) {
      setError('Please select at least one transaction to import');
      return;
    }

    // Validate all selected transactions have owner and category
    const invalidTransactions = selectedTransactions.filter(t => !t.owner || !t.category);
    if (invalidTransactions.length > 0) {
      setError('Please assign an owner and category to all selected transactions');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      // Import each transaction
      for (const t of selectedTransactions) {
        await FinanceService.addTransaction({
          owner: t.owner,
          tag: t.category,
          amount: t.amount,
          date: t.date,
          type: t.type,
        });
      }

      onImport();
      onClose();
    } catch (err) {
      console.error('Failed to import transactions:', err);
      setError('Failed to import transactions. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = previewTransactions.filter(t => t.selected).length;
  const selectedIncome = previewTransactions
    .filter(t => t.selected && t.type === 'input')
    .reduce((sum, t) => sum + t.amount, 0);
  const selectedExpense = previewTransactions
    .filter(t => t.selected && t.type === 'output')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Review Extracted Transactions
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedCount} of {previewTransactions.length} transactions selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={18} />
            <span className="font-medium">{formatCurrency(selectedIncome)}</span>
          </div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <TrendingDown size={18} />
            <span className="font-medium">{formatCurrency(selectedExpense)}</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleToggleAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {previewTransactions.every(t => t.selected) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-600 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {previewTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className={`p-4 rounded-xl border-2 transition-all ${transaction.selected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleSelect(transaction.id)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${transaction.selected
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                      {transaction.selected && <Check size={14} />}
                    </button>

                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'input'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          }`}>
                          {transaction.type === 'input' ? 'Income' : 'Expense'}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {transaction.date}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate mb-3">
                        {transaction.description}
                      </p>

                      {/* Owner & Category Selects */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Owner
                          </label>
                          <select
                            value={transaction.owner}
                            onChange={(e) => handleOwnerChange(transaction.id, e.target.value)}
                            disabled={!transaction.selected}
                            className="w-full p-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select owner...</option>
                            {owners.map(o => (
                              <option key={o.name} value={o.name}>{o.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Category
                          </label>
                          <select
                            value={transaction.category}
                            onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                            disabled={!transaction.selected}
                            className="w-full p-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select category...</option>
                            {(transaction.type === 'input' ? categories.income : categories.expense).map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={`text-right font-bold ${transaction.type === 'input'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                      }`}>
                      {transaction.type === 'input' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || selectedCount === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check size={18} />
                Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
