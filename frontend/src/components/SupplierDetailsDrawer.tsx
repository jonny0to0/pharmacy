import React from 'react';
import { 
  X, Receipt, CreditCard, ArrowUpRight, ArrowDownLeft, 
  Calendar, FileText, Download, Building2, ExternalLink
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  type: 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  amount: number;
  balance: number;
  description: string | null;
  date: string;
  referenceId: string | null;
}

interface Supplier {
  id: string;
  name: string;
  type: 'PHARMA' | 'NON_PHARMA';
  drugLicenseNo: string | null;
  dlExpiry: string | null;
  gstin: string | null;
  outstandingBalance: number;
  ledgerEntries?: LedgerEntry[];
}

interface SupplierDetailsDrawerProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

const SupplierDetailsDrawer: React.FC<SupplierDetailsDrawerProps> = ({ supplier, isOpen, onClose }) => {
  if (!supplier) return null;

  const now = new Date();
  const dlExpiry = supplier.dlExpiry ? new Date(supplier.dlExpiry) : null;
  const isDlExpired = dlExpiry && dlExpiry < now;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] transform transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{supplier.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${supplier.type === 'PHARMA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {supplier.type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-500">ID: {supplier.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
              <p className={`text-lg font-black ${supplier.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{supplier.outstandingBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTIN</p>
              <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">{supplier.gstin || 'N/A'}</p>
            </div>
            <div className={`p-3 rounded-xl border ${isDlExpired ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DL Number</p>
              <p className={`text-sm font-bold ${isDlExpired ? 'text-rose-700' : 'text-slate-700'} font-mono`}>
                {supplier.drugLicenseNo || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DL Expiry</p>
              <p className={`text-sm font-bold ${isDlExpired ? 'text-rose-600' : 'text-slate-700'}`}>
                {supplier.dlExpiry ? new Date(supplier.dlExpiry).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction Ledger</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-all cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 pt-2">
            {!supplier.ledgerEntries || supplier.ledgerEntries.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">No Transactions Recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {supplier.ledgerEntries.map((entry) => (
                  <div key={entry.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        entry.type === 'PURCHASE' ? 'bg-amber-50 text-amber-600' : 
                        entry.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600' : 
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {entry.type === 'PURCHASE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                            {entry.type}
                          </span>
                          <span className="text-slate-300 tracking-tighter">•</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Ref: {entry.referenceId?.slice(-6).toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.date).toLocaleDateString()}
                          <span className="text-slate-300">•</span>
                          {entry.description || 'General transaction'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-lg tracking-tight ${
                        entry.type === 'PURCHASE' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {entry.type === 'PAYMENT' ? '-' : '+'} ₹{entry.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-end gap-1">
                        Bal: <span className="text-slate-600">₹{entry.balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-4 shrink-0">
          <button className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-slate-50 active:scale-95 transition-all shadow-sm cursor-pointer">
            <CreditCard className="w-4 h-4" /> Record Payment
          </button>
          <button className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 cursor-pointer">
            <Receipt className="w-4 h-4" /> New Bill
          </button>
        </div>
      </div>
    </>
  );
};

export default SupplierDetailsDrawer;
