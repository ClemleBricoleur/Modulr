import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export const Card = ({ children, className = '', onClick, style }: CardProps) => {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-slate-100 p-4';
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : '';
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      {children}
    </div>
  );
};

