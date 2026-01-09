import { useState, useRef } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { DashboardPage } from './pages/DashboardPage';
import { ConsultationPage } from './pages/ConsultationPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { FinanceService } from './services/financeService';

interface FinanceModuleProps {
  goHome: () => void;
}

type FinancePage = 'dashboard' | 'consultation' | 'add';

export const FinanceModule = ({ goHome }: FinanceModuleProps) => {
  const [currentPage, setCurrentPage] = useState<FinancePage>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setCurrentPage('dashboard');
    setRefreshKey(k => k + 1);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = await FinanceService.importData(data);
      
      if (success) {
        setRefreshKey(k => k + 1);
        alert('Data imported successfully!');
      } else {
        alert('Failed to import data. Invalid format.');
      }
    } catch (error) {
      alert('Failed to read file. Make sure it\'s a valid JSON file.');
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <div className="bg-emerald-600 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={handleBack} 
            className="mr-3 p-2 hover:bg-emerald-500 rounded-full transition-colors active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-wide">{getTitle()}</h1>
        </div>
        
        {currentPage === 'dashboard' && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label 
              htmlFor="import-file"
              className="p-2 hover:bg-emerald-500 rounded-full transition-colors cursor-pointer"
              title="Import data"
            >
              <Upload size={20} />
            </label>
          </div>
        )}
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

