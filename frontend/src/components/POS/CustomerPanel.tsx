import React from 'react';
import { User, Plus } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
}

interface CustomerPanelProps {
  customers: Customer[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNewCustomer?: () => void;
}

const CustomerPanel: React.FC<CustomerPanelProps> = ({ customers, selectedId, onSelect, onNewCustomer }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-gray-100 p-6 relative overflow-hidden group hover:border-primary/20 transition-all">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary transition-all group-hover:w-2 opacity-80"></div>
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> 
          <span>Target Customer</span>
        </h3>
        {/* Placeholder for adding new customer if needed */}
        <button 
          onClick={onNewCustomer}
          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer flex items-center gap-1 group/btn"
        >
          <Plus className="w-3 h-3 group-hover/btn:rotate-90 transition-transform" /> New
        </button>
      </div>

      <div className="relative z-10">
        <select 
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary font-bold text-gray-800 outline-none transition-all cursor-pointer shadow-sm appearance-none pr-10 hover:border-gray-200"
        >
          <option value="">Walk-in Customer (Cash)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default CustomerPanel;
