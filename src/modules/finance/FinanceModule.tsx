import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DashboardPage } from './pages/DashboardPage';
import { ConsultationPage } from './pages/ConsultationPage';
import { AddTransactionPage } from './pages/AddTransactionPage';

interface FinanceModuleProps {
  goHome: () => void;
}

type FinancePage = 'dashboard' | 'consultation' | 'add';

export const FinanceModule = ({ goHome }: FinanceModuleProps) => {
  const [currentPage, setCurrentPage] = useState<FinancePage>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = (page: 'consultation' | 'add') => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    if (currentPage === 'dashboard') {
      goHome();
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleTransactionAdded = () => {
    // Just refresh the dashboard data, don't navigate
    setRefreshKey(k => k + 1);
  };

  const getTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Finances';
      case 'consultation': return 'Transactions';
      case 'add': return 'Add Transaction';
      default: return 'Finances';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 shadow-md flex items-center sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="mr-3 p-2 hover:bg-emerald-500 rounded-full transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-wide">{getTitle()}</h1>
      </div>

      {/* Content */}
      {currentPage === 'dashboard' && (
        <DashboardPage
          key={refreshKey}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'consultation' && (
        <ConsultationPage onBack={() => setCurrentPage('dashboard')} />
      )}

      {currentPage === 'add' && (
        <AddTransactionPage
          onBack={() => setCurrentPage('dashboard')}
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  );
};
