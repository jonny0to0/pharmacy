import React from 'react';
import { User, Plus, Search, ChevronDown, UserCheck } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
}

interface ModernCustomerCardProps {
  customers: Customer[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNewCustomer?: () => void;
}

const ModernCustomerCard: React.FC<ModernCustomerCardProps> = ({ 
  customers, 
  selectedId, 
  onSelect, 
  onNewCustomer 
}) => {
  const selectedCustomer = customers.find(c => c.id === selectedId);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 group hover:shadow-md transition-all duration-300">
      
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Customer Account</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Billing Identification</p>
          </div>
        </div>
        
        <button 
          onClick={onNewCustomer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-500 rounded-xl transition-all duration-300 text-[10px] font-bold uppercase tracking-widest cursor-pointer group/btn shadow-sm"
        >
          <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
          <span>New Customer</span>
        </button>
      </div>

      <div className="relative group/select">
        <select 
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className={`
            w-full pl-5 pr-12 py-3.5 rounded-xl border font-semibold transition-all appearance-none cursor-pointer outline-none relative z-10
            ${selectedId 
              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 focus:border-indigo-600' 
              : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 focus:border-indigo-600 focus:bg-white'}
          `}
        >
          <option value="">Walk-in Customer (General)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-400 transition-transform group-focus-within/select:rotate-180">
          <ChevronDown size={20} />
        </div>

        {selectedId && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2 duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-50 shrink-0">
              <UserCheck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1.5">Identified Ledger</p>
              <p className="font-bold text-emerald-950 truncate">{selectedCustomer?.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernCustomerCard;
