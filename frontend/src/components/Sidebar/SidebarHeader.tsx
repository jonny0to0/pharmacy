import React from 'react';
import { Pill, ChevronLeft } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const SidebarHeader: React.FC = () => {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');

  return (
    <div className={`h-24 px-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-800/50 shrink-0`}>
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} transition-all duration-300`}>
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/20 flex-shrink-0">
          <Pill className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden animate-fade-in">
            <span className="text-lg font-bold text-white tracking-tight block leading-none truncate uppercase">
              {isSuperAdmin ? 'PLATFORM' : (user?.businessType ? user.businessType.replace('_', ' ') : 'SaaS')}
            </span>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              {isSuperAdmin ? 'MANAGEMENT' : 'Enterprise OS'}
            </span>
          </div>
        )}
      </div>
      
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-4 top-10 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-[#0F172A] border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 shadow-xl transition-all duration-300 group shadow-indigo-900/10`}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default SidebarHeader;
