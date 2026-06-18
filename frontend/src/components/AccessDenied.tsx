import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500/10 blur-[150px] -ml-20 -mt-20 rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[150px] -mr-20 -mb-20 rounded-full" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-12 rounded-[3rem] text-center shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-500/10 animate-bounce">
          <ShieldAlert size={48} />
        </div>

        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Access Intercepted</h1>
        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-2">Security Clearance Required</p>
        
        <p className="text-slate-400 mt-6 text-sm leading-relaxed">
          Your profile does not possess the required security credentials to access this node. 
          This operational event has been logged for administrative review.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-700"
          >
            <ArrowLeft size={16} /> Return Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-rose-600/20"
          >
            <Home size={16} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
