import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: boolean;
  children: React.ReactNode;
}

const variants = {
  success: { bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-100', icon: CheckCircle2 },
  warning: { bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-100', icon: Clock },
  error: { bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-100', icon: AlertCircle },
  info: { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-100', icon: Info },
  neutral: { bgColor: 'bg-slate-50', textColor: 'text-slate-600', borderColor: 'border-slate-200', icon: null }
};

const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  icon = false, 
  className = '', 
  children,
  ...props 
}) => {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      {...props}
    >
      {icon && Icon && <Icon size={14} className="shrink-0" />}
      {children}
    </div>
  );
};

export default Badge;
