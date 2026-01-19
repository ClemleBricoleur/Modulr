import { useState } from 'react';
import { Header } from '../../core/components/Header';
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
      <Header title={getTitle()} onBack={handleBack} className="bg-emerald-600" />

      {/* Content */}
      {currentPage === 'dashboard' && (
        <DashboardPage
          key={refreshKey}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'consultation' && (
        <ConsultationPage />
      )}

      {currentPage === 'add' && (
        <AddTransactionPage
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  );
};
