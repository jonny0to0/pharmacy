import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut, UserCheck } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, user, stopImpersonation } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="bg-red-600 border-b border-red-700 py-2 px-4 shadow-lg sticky top-0 z-[1000] animate-in fade-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 p-1.5 rounded-full">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold tracking-wider opacity-90">Administrative Support Active</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Impersonating: {user?.name || 'Tenant Admin'}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {user?.tenantId?.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-white/80 text-sm italic mr-4">
            <UserCheck className="w-4 h-4" />
            <span>Read-only Billing Enforced</span>
          </div>
          
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95 group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            Restore My Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
