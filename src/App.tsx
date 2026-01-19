import { useState, useEffect } from 'react';
import {
  Settings,
  Wifi,
  WifiOff,
  Smartphone,
  Wallet,
  LogOut
} from 'lucide-react';
import { FinanceModule } from './modules/finance/FinanceModule';
import { SettingsModal } from './core/components/SettingsModal';
import { AuthProvider, useAuth } from './core/context/AuthContext';
import { AuthGuard } from './core/components/AuthGuard';
import { API_CONFIG } from './core/config/api.config';

type ActiveModule = 'finance' | null;

function AppContent() {
  const { user, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get user display name
  const getUserName = () => {
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'User';
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  // Render active module
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
          {API_CONFIG.USE_SUPABASE ? (
            <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
              <Wifi size={14} />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-600">
              <WifiOff size={14} />
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
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
            {getUserName()}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">
            {API_CONFIG.USE_SUPABASE ? 'Connected to cloud' : 'Running in local mode'}
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Finance Module Launcher */}
          <button
            onClick={() => setActiveModule('finance')}
            className="aspect-square bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-5 flex flex-col justify-between hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-900/40 dark:shadow-emerald-900/40 text-left group active:scale-95 animate-fade-in-up text-white"
            style={{ animationDelay: '100ms' }}
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
            style={{ animationDelay: '200ms' }}
          >
            <Settings size={32} strokeWidth={1.5} />
            <span className="text-xs mt-2">System</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-4 bg-white/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <h3 className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Status</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${API_CONFIG.USE_SUPABASE ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {API_CONFIG.USE_SUPABASE ? 'Cloud sync active' : 'Local storage mode'}
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {user?.email}
            </span>
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

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
