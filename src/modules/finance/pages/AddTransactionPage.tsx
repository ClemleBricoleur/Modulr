import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { FinanceService } from '../services/financeService';
import { formatCurrency } from '../../../core/config/locale.config';
import type {
  TransactionType,
  CategoryOption,
  OwnerOption
} from '../types/finance.types';

interface AddTransactionPageProps {
  onSuccess: () => void;
}

export const AddTransactionPage = ({ onSuccess }: AddTransactionPageProps) => {
  const [type, setType] = useState<TransactionType>('output');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [owner, setOwner] = useState<string>('');
  const [customOwner, setCustomOwner] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tag, setTag] = useState<string>('');
  const [customTag, setCustomTag] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomOwner, setShowCustomOwner] = useState(false);
  const [showCustomTag, setShowCustomTag] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  // Load owners on mount
  const loadOwners = useCallback(async () => {
    setIsLoadingOwners(true);
    try {
      const allOwners = await FinanceService.getAllOwnersFromDB();
      setOwners(allOwners);
      if (allOwners.length > 0 && !owner) {
        setOwner(allOwners[0].name);
      }
    } catch (error) {
      console.error('Failed to load owners:', error);
    } finally {
      setIsLoadingOwners(false);
    }
  }, [owner]);

  // Load categories when type changes
  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const categoryType = type === 'input' ? 'income' : 'expense';
      const allCategories = await FinanceService.getAllCategoriesFromDB(categoryType);
      setCategories(allCategories);
      if (allCategories.length > 0) {
        setTag(allCategories[0].name);
      }
      setShowCustomTag(false);
      setCustomTag('');
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [type]);

  // Load owners on mount
  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  // Load categories when type changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const finalTag = showCustomTag ? customTag.trim() : tag;
    if (!finalTag) return;

    const finalOwner = showCustomOwner ? customOwner.trim() : owner;
    if (!finalOwner) return;

    setIsSubmitting(true);
    try {
      // If using a custom tag, save it to the database for future use
      if (showCustomTag && customTag.trim()) {
        const categoryType = type === 'input' ? 'income' : 'expense';
        await FinanceService.addUserCategory(customTag.trim(), categoryType);
        // Refresh categories list
        await loadCategories();
      }

      // If using a custom owner, save it to the database for future use
      if (showCustomOwner && customOwner.trim()) {
        await FinanceService.addUserOwner(customOwner.trim());
        // Refresh owners list
        await loadOwners();
      }

      await FinanceService.addTransaction({
        owner: finalOwner,
        tag: finalTag,
        amount: parsedAmount,
        date,
        type
      });

      // Reset amount only, keep other fields for quick batch entry
      setAmount('');

      // Show success message
      setSuccessMessage(`${type === 'input' ? 'Income' : 'Expense'} of ${formatCurrency(parsedAmount)} added!`);

      // Notify parent to refresh data (but don't navigate away)
      onSuccess();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // Categories will be updated by the useEffect that watches type
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center gap-3 animate-fade-in">
          <div className="bg-emerald-500 rounded-full p-1">
            <Check size={16} className="text-white" />
          </div>
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
            {successMessage}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('input')}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all ${type === 'input'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
            >
              <TrendingUp size={20} />
              Income
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('output')}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all ${type === 'output'
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
            >
              <TrendingDown size={20} />
              Expense
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-center">
          <label className="text-sm text-slate-500 dark:text-slate-400 block mb-2">Amount</label>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-bold text-slate-800 dark:text-white bg-transparent border-none text-center w-40 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Owner */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <label className="text-sm text-slate-500 dark:text-slate-400 block mb-3">Owner</label>

          {isLoadingOwners ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {owners.map(o => (
                <button
                  key={o.name}
                  type="button"
                  onClick={() => {
                    setOwner(o.name);
                    setShowCustomOwner(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${owner === o.name && !showCustomOwner
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                  {o.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomOwner(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${showCustomOwner
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                + Custom
              </button>
            </div>
          )}

          {showCustomOwner && (
            <input
              type="text"
              placeholder="Enter custom owner..."
              value={customOwner}
              onChange={e => setCustomOwner(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          )}
        </div>

        {/* Category */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <label className="text-sm text-slate-500 dark:text-slate-400 block mb-3">Category</label>

          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setTag(cat.name);
                    setShowCustomTag(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tag === cat.name && !showCustomTag
                    ? type === 'output'
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomTag(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${showCustomTag
                  ? type === 'output'
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                + Custom
              </button>
            </div>
          )}

          {showCustomTag && (
            <input
              type="text"
              placeholder="Enter custom category..."
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          )}
        </div>

        {/* Date */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <label className="text-sm text-slate-500 dark:text-slate-400 block mb-3">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !amount || (showCustomTag && !customTag.trim()) || (showCustomOwner && !customOwner.trim())}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${type === 'output'
            ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
            }`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus size={20} />
              Add {type === 'output' ? 'Expense' : 'Income'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

