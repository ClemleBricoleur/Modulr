import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import type { Transaction } from '../types/finance.types';

interface TransactionCardProps {
    transaction: Transaction;
    onDelete?: (id: string) => void;
    showDelete?: boolean;
}

export const TransactionCard = ({
    transaction,
    onDelete,
    showDelete = true
}: TransactionCardProps) => {
    const isIncome = transaction.type === 'input';

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'CAD'
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        // Parse as local time to avoid timezone shift
        // dateStr is in format 'YYYY-MM-DD'
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                    {isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                    <p className="font-medium text-slate-800 dark:text-white capitalize">
                        {transaction.tag}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {transaction.owner} • {formatDate(transaction.date)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className={`font-bold ${isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                    }`}>
                    {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
                </span>

                {showDelete && onDelete && (
                    <button
                        onClick={() => onDelete(transaction.id)}
                        className="p-2 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                        aria-label="Delete transaction"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

