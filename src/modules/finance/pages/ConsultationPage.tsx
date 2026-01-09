import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar, Tag, User } from 'lucide-react';
import { FinanceService } from '../services/financeService';
import { TransactionCard } from '../components/TransactionCard';
import type { Transaction, ViewMode } from '../types/finance.types';

interface ConsultationPageProps {
  onBack: () => void;
}

export const ConsultationPage = ({ onBack }: ConsultationPageProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'input' | 'output'>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [viewMode, selectedYear, selectedMonth]);

  const loadAvailableYears = async () => {
    const years = await FinanceService.getAvailableYears();
    setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()]);
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      let data: Transaction[];

      if (viewMode === 'month') {
        data = await FinanceService.getTransactionsByMonth(selectedMonth);
      } else if (viewMode === 'year') {
        data = await FinanceService.getTransactionsByYear(selectedYear);
      } else {
        data = await FinanceService.getAllTransactions();
      }

      setTransactions(data);

      // Extract unique categories and owners
      const cats = [...new Set(data.map(t => t.tag))];
      const owns = [...new Set(data.map(t => t.owner))];
      setCategories(cats);
      setOwners(owns);

      // Calculate category totals for expenses
      const totals: Record<string, number> = {};
      data.filter(t => t.type === 'output').forEach(t => {
        totals[t.tag] = (totals[t.tag] || 0) + t.amount;
      });
      setCategoryTotals(totals);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await FinanceService.deleteTransaction(id);
    loadTransactions();
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterCategory !== 'all' && t.tag !== filterCategory) return false;
    if (filterOwner !== 'all' && t.owner !== filterOwner) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + (direction === 'next' ? 1 : -1);

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const formatMonthDisplay = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'output')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'input')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* View Mode Selector */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {(['month', 'year', 'category'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${viewMode === mode
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {mode === 'month' ? 'Month' : mode === 'year' ? 'Year' : 'Category'}
          </button>
        ))}
      </div>

      {/* Period Navigator */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
            <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
            {formatMonthDisplay(selectedMonth)}
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      )}

      {viewMode === 'year' && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
            <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
            {selectedYear}
          </div>
          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      )}

      {/* Category Breakdown (for category view) */}
      {viewMode === 'category' && Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Expenses by Category
          </h3>
          {Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([category, total]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="capitalize text-slate-700 dark:text-slate-300">{category}</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(total)}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <Filter size={16} />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-slate-400" />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            <select
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Owners</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {(['all', 'output', 'input'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterType === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
              >
                {type === 'all' ? 'All' : type === 'output' ? 'Expenses' : 'Income'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Income</p>
          <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600 dark:text-red-400 mb-1">Expenses</p>
          <p className="font-bold text-red-700 dark:text-red-300">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Transactions ({filteredTransactions.length})
        </h3>

        {loading && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <Calendar size={32} className="mx-auto mb-2 opacity-50" />
            <p>No transactions found</p>
          </div>
        )}

        {filteredTransactions.map(transaction => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

