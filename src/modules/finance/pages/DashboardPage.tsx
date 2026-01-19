import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wallet, Download, Upload, Trash2 } from 'lucide-react';
import { FinanceService } from '../services/financeService';
import { TransactionCard } from '../components/TransactionCard';
import { formatCurrency } from '../../../core/config/locale.config';
import type { Transaction, PeriodFilter } from '../types/finance.types';

const isDev = import.meta.env.DEV;

interface DashboardPageProps {
  onNavigate: (page: 'consultation' | 'add') => void;
}

export const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [totals, setTotals] = useState({ totalInput: 0, totalOutput: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadData();
  }, [periodFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [totalsData, recent] = await Promise.all([
        FinanceService.getTotals(periodFilter, currentYear),
        FinanceService.getRecentTransactions(5)
      ]);
      setTotals(totalsData);
      setRecentTransactions(recent);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    await FinanceService.downloadExport();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = await FinanceService.importData(data);

      if (success) {
        loadData(); // Reload data after import
        alert('Data imported successfully!');
      } else {
        alert('Import failed. Please check the file format.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to read file. Please ensure it\'s a valid JSON file.');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await FinanceService.deleteTransaction(id);
    loadData();
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      '⚠️ DEV MODE: Are you sure you want to delete ALL transactions?\n\nThis action cannot be undone!'
    );

    if (!confirmed) return;

    setDeletingAll(true);
    try {
      const success = await FinanceService.deleteAllTransactions();
      if (success) {
        loadData();
        alert('All transactions deleted successfully.');
      } else {
        alert('Failed to delete transactions.');
      }
    } catch (error) {
      console.error('Delete all error:', error);
      alert('An error occurred while deleting transactions.');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/30">
        <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
          <Wallet size={16} />
          <span>Current Balance</span>
        </div>
        <p className={`text-4xl font-bold ${totals.balance < 0 ? 'text-red-200' : ''}`}>
          {loading ? '...' : formatCurrency(totals.balance)}
        </p>

        {/* Period Toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${periodFilter === 'all'
              ? 'bg-white text-emerald-600'
              : 'bg-emerald-400/30 text-white hover:bg-emerald-400/50'
              }`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriodFilter('year')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${periodFilter === 'year'
              ? 'bg-white text-emerald-600'
              : 'bg-emerald-400/30 text-white hover:bg-emerald-400/50'
              }`}
          >
            This Year
          </button>

        </div>
      </div>

      {/* Income/Expense Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Income</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white truncate">
            {loading ? '...' : formatCurrency(totals.totalInput)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <TrendingDown size={18} />
            <span className="text-sm font-medium">Expenses</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white truncate">
            {loading ? '...' : formatCurrency(totals.totalOutput)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('consultation')}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-medium transition-colors text-sm"
        >
          📊 Consult
        </button>
        <button
          onClick={() => onNavigate('add')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-colors text-sm"
        >
          ➕ Add
        </button>
      </div>

      {/* Import/Export Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {importing ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          Import
        </button>
        <button
          onClick={handleExport}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dev-only: Delete All Button */}
      {isDev && (
        <button
          onClick={handleDeleteAll}
          disabled={deletingAll}
          className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 py-3 px-4 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 border-2 border-dashed border-red-300 dark:border-red-800 disabled:opacity-50"
        >
          {deletingAll ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          🛠️ DEV: Delete All Transactions
        </button>
      )}

      {/* Recent Transactions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Recent Transactions
        </h3>

        {loading && (
          <div className="text-center py-8 text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {!loading && recentTransactions.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <Wallet size={32} className="mx-auto mb-2 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Add your first transaction!</p>
          </div>
        )}

        {recentTransactions.map(transaction => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onDelete={handleDeleteTransaction}
          />
        ))}

        {recentTransactions.length > 0 && (
          <button
            onClick={() => onNavigate('consultation')}
            className="w-full text-center text-sm text-emerald-600 dark:text-emerald-400 hover:underline py-2"
          >
            View all transactions →
          </button>
        )}
      </div>
    </div>
  );
};

