import React from 'react';
import { ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import ErrorBoundary from '../ErrorBoundary';

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  tag?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  title,
  subtitle,
  tag,
  icon,
  actions,
  children
}) => {
  return (
    <ErrorBoundary>
      <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Platform</span>
              <ChevronRight size={10} />
              <span className="text-indigo-600">{tag || 'Management'}</span>
            </div>
            <div className="flex items-center gap-3">
              {icon && <span className="text-slate-900">{icon}</span>}
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
              {tag && (
                <Badge variant="neutral" className="bg-slate-100 text-slate-600 border-slate-200">
                  {tag}
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-slate-500 font-medium text-sm">{subtitle}</p>}
          </div>

          {actions && <div className="flex items-center gap-3 w-full md:w-auto">{actions}</div>}
        </div>

        <div className="relative">
          {children}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminPageLayout;
