import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';

/**
 * Auth Guard Props
 */
interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Auth Guard Component
 * Protects content that requires authentication
 * Shows loading state while checking auth, login modal if not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login modal if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900">
        <LoginModal />
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
