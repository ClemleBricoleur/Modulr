import { useState, useEffect } from 'react';
import {
  ChefHat,
  Martini,
  Settings,
  Wifi,
  WifiOff,
  Smartphone,
  Wallet
} from 'lucide-react';
import { RecipeModule } from './modules/recipe/RecipeModule';
import { CocktailModule } from './modules/cocktail/CocktailModule';
import { FinanceModule } from './modules/finance/FinanceModule';
import { SettingsModal } from './core/components/SettingsModal';
import { API_CONFIG } from './core/config/api.config';

type ActiveModule = 'recipe' | 'cocktail' | 'finance' | null;

function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);
  const [serverStatus, setServerStatus] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check server status (simulated for now)
  useEffect(() => {
    const checkServer = async () => {
      if (API_CONFIG.USE_SERVER) {
        try {
          const res = await fetch(`${API_CONFIG.BASE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          setServerStatus(res.ok);
        } catch {
          setServerStatus(false);
        }
      } else {
        setServerStatus(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Render active module
  if (activeModule === 'recipe') {
    return <RecipeModule goHome={() => setActiveModule(null)} />;
  }

  if (activeModule === 'cocktail') {
    return <CocktailModule goHome={() => setActiveModule(null)} />;
  }

  if (activeModule === 'finance') {
    return <FinanceModule goHome={() => setActiveModule(null)} />;
  }

  // Home screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-white">
      {/* Status Bar */}
      <div className="px-6 py-4 flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <Smartphone size={14} />
          <span>Modulr</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {serverStatus ? (
            <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
              <Wifi size={14} />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-600">
              <WifiOff size={14} />
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 pt-8 pb-12 max-w-md mx-auto">
        {/* Greeting */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-light text-slate-500 dark:text-slate-300">
            {getGreeting()},
          </h1>
          <h2 className="text-4xl font-bold mt-1 bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Creator
          </h2>
          <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">
            {serverStatus ? 'Connected to Freebox' : 'Running in local mode'}
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recipe Module Launcher */}
          <button
            onClick={() => setActiveModule('recipe')}
            className="aspect-square bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-5 flex flex-col justify-between hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-900/40 dark:shadow-indigo-900/40 text-left group active:scale-95 animate-fade-in-up text-white"
            style={{ animationDelay: '100ms' }}
          >
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
              <ChefHat size={26} className="text-white" />
            </div>
            <div>
              <span className="block text-2xl font-bold">Food</span>
              <span className="text-indigo-200 text-sm">Recipe Manager</span>
            </div>
          </button>

          {/* Cocktail Module Launcher */}
          <button
            onClick={() => setActiveModule('cocktail')}
            className="aspect-square bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-5 flex flex-col justify-between hover:from-rose-400 hover:to-rose-500 transition-all shadow-lg shadow-rose-900/40 dark:shadow-rose-900/40 text-left group active:scale-95 animate-fade-in-up text-white"
            style={{ animationDelay: '200ms' }}
          >
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
              <Martini size={26} className="text-white" />
            </div>
            <div>
              <span className="block text-2xl font-bold">Bar</span>
              <span className="text-rose-200 text-sm">Cocktail Manager</span>
            </div>
          </button>

          {/* Finance Module Launcher */}
          <button
            onClick={() => setActiveModule('finance')}
            className="aspect-square bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-5 flex flex-col justify-between hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-900/40 dark:shadow-emerald-900/40 text-left group active:scale-95 animate-fade-in-up text-white"
            style={{ animationDelay: '300ms' }}
          >
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
              <Wallet size={26} className="text-white" />
            </div>
            <div>
              <span className="block text-2xl font-bold">Finance</span>
              <span className="text-emerald-200 text-sm">Money Manager</span>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="aspect-square bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl p-5 flex flex-col justify-center items-center text-slate-400 dark:text-slate-500 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 hover:text-slate-500 dark:hover:text-slate-400 transition-all active:scale-95 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <Settings size={32} strokeWidth={1.5} />
            <span className="text-xs mt-2">System</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-white/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <h3 className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {JSON.parse(localStorage.getItem('modulr_recipes') || '[]').length}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Recipes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">
                {JSON.parse(localStorage.getItem('modulr_cocktails') || '[]').length}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Cocktails</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {(() => {
                  const data = JSON.parse(localStorage.getItem('modulr_finance') || '[]');
                  let total = 0;
                  data.forEach((m: { totalInput: number; totalOutput: number }) => {
                    total += (m.totalInput || 0) - (m.totalOutput || 0);
                  });
                  return total >= 0 ? `€${total.toFixed(0)}` : `-€${Math.abs(total).toFixed(0)}`;
                })()}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Balance</p>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <p className="text-center text-slate-400 dark:text-slate-600 text-xs mt-8">
          Modulr v1.0.0 • PWA Ready
        </p>
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
