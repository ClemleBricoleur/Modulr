import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { FinanceService } from '../services/financeService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  DEFAULT_OWNERS,
  type TransactionType
} from '../types/finance.types';

interface AddTransactionPageProps {
  onBack?: () => void;  // Optional - navigation handled by parent
  onSuccess: () => void;
}

export const AddTransactionPage = ({ onSuccess }: AddTransactionPageProps) => {
  const [type, setType] = useState<TransactionType>('output');
  const [owner, setOwner] = useState<string>(DEFAULT_OWNERS[0]);
  const [customOwner, setCustomOwner] = useState('');
  const [tag, setTag] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomOwner, setShowCustomOwner] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const categories = type === 'output' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await FinanceService.addTransaction({
        owner: showCustomOwner ? customOwner : owner,
        tag,
        amount: parsedAmount,
        date,
        type
      });

      // Reset amount only, keep other fields for quick batch entry
      setAmount('');

      // Show success message
      const formattedAmount = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CAD'
      }).format(parsedAmount);
      setSuccessMessage(`${type === 'input' ? 'Income' : 'Expense'} of ${formattedAmount} added!`);

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
    setTag(newType === 'output' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
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

          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_OWNERS.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  setOwner(o);
                  setShowCustomOwner(false);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${owner === o && !showCustomOwner
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {o}
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
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setTag(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${tag === cat
                  ? type === 'output'
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
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
          disabled={isSubmitting || !amount}
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

