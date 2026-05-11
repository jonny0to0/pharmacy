import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, UserCircle } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, stopImpersonation, user } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="bg-rose-600 text-white py-2 px-6 flex items-center justify-between sticky top-0 z-[100] shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-rose-700/50 px-2 py-1 rounded">
          <ShieldAlert size={14} className="text-rose-200" />
          <span>Restricted Support Access</span>
        </div>
        
        <div className="flex items-center gap-3">
          <UserCircle size={18} className="text-rose-200" />
          <p className="text-sm font-bold">
            Impersonating: <span className="underline decoration-rose-300 underline-offset-4">{user.name}</span>
          </p>
          <span className="h-4 w-px bg-rose-500/50 mx-1 hidden md:block" />
          <p className="text-[10px] text-rose-100 font-mono hidden md:block">
            {user.email} (Tenant: {user.tenantId || 'NONE'})
          </p>
        </div>
      </div>

      <button 
        onClick={stopImpersonation}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 shadow-lg shadow-rose-900/20"
      >
        <LogOut size={14} />
        Stop Impersonation
      </button>
    </div>
  );
};

export default ImpersonationBanner;
