import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
}

export const Header = ({ title, onBack, className = '' }: HeaderProps) => {
  return (
    <div className={`bg-slate-900 dark:bg-slate-900 text-white p-4 shadow-md flex items-center sticky top-0 z-10 ${className}`}>
      {onBack && (
        <button 
          onClick={onBack} 
          className="mr-3 p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold tracking-wide">{title}</h1>
    </div>
  );
};
