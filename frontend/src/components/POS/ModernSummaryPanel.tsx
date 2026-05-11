import { 
  Receipt, Tag, Info, Banknote, Smartphone, CreditCard, 
  Landmark, CheckCircle2, Loader2, Download, AlertCircle,
  ChevronRight, Wallet, Calculator, Plus
} from 'lucide-react';
import Button from '../ui/Button';

interface CalculationData {
  subTotal: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  totalDiscount: number;
}

interface ModernSummaryPanelProps {
  calculations: CalculationData;
  paymentMode: string;
  setPaymentMode: (mode: string) => void;
  amountPaid: string;
  setAmountPaid: (amount: string) => void;
  onCheckout: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  onDownloadInvoice?: () => void;
  error?: string | null;
}

const ModernSummaryPanel: React.FC<ModernSummaryPanelProps> = ({ 
  calculations,
  paymentMode,
  setPaymentMode,
  amountPaid,
  setAmountPaid,
  onCheckout,
  isLoading,
  isSuccess,
  onDownloadInvoice,
  error
}) => {
  const paid = parseFloat(amountPaid) || calculations.grandTotal;
  const change = Math.max(0, paid - calculations.grandTotal);

  const paymentModes = [
    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'emerald' },
    { id: 'UPI', label: 'UPI/App', icon: Smartphone, color: 'blue' },
    { id: 'CARD', label: 'Card', icon: CreditCard, color: 'purple' },
    { id: 'CREDIT', label: 'Credit', icon: Landmark, color: 'amber' },
  ];

  return (
    <div className="flex flex-col h-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calculator size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Checkout Summary</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Order Review & Settlement</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
        
        {/* Breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gross Total</span>
            <span className="font-bold text-lg text-slate-900">₹{calculations.subTotal.toLocaleString()}</span>
          </div>

          <div className="px-2 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Tag size={14} className="text-emerald-500" />
                Discounts Applied
              </div>
              <span className="font-bold text-emerald-600">-₹{calculations.totalDiscount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Info size={14} className="text-indigo-500" />
                Aggregated Tax
              </div>
              <span className="font-bold text-slate-700">₹{calculations.totalTax.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Payable Amount</p>
          <div className="text-4xl font-bold tracking-tight">₹{calculations.grandTotal.toLocaleString()}</div>
        </div>

        {/* Payment Modes */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Settlement Method</h4>
          <div className="grid grid-cols-2 gap-3">
            {paymentModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setPaymentMode(mode.id)}
                className={`
                  relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 group
                  ${paymentMode === mode.id 
                    ? 'bg-indigo-50 border-indigo-600 shadow-sm' 
                    : 'bg-white border-slate-50 hover:border-indigo-200'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                  ${paymentMode === mode.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50'}
                `}>
                  <mode.icon size={20} />
                </div>
                <div className="text-left">
                   <div className={`font-bold text-xs uppercase tracking-tight ${paymentMode === mode.id ? 'text-indigo-900' : 'text-slate-500'}`}>
                     {mode.label}
                   </div>
                   {paymentMode === mode.id && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cash Realization</label>
            <div className="relative group/field">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Wallet size={20} className="text-slate-300 group-focus-within/field:text-indigo-600 transition-colors" />
              </div>
              <input 
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={calculations.grandTotal.toString()}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-6 font-bold text-xl text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          {paid > calculations.grandTotal && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Banknote size={18} />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Return Change</span>
              </div>
              <span className="font-bold text-xl text-emerald-600">₹{change.toLocaleString()}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-slide-up">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs font-bold uppercase tracking-tight">{error}</div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/10">
        {!isSuccess ? (
          <Button
            size="lg"
            fullWidth
            onClick={onCheckout}
            disabled={calculations.grandTotal <= 0}
            isLoading={isLoading}
          >
            <span>Complete Settlement</span>
            {!isLoading && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block ml-2">Ctrl+Enter</span>}
          </Button>
        ) : (
          <div className="space-y-3">
             <div className="w-full py-4 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-emerald-50 animate-in zoom-in duration-500">
                <CheckCircle2 size={28} />
                <span>Ledger Synchronized</span>
             </div>
             {onDownloadInvoice && (
               <Button
                 size="md"
                 fullWidth
                 variant="outline"
                 onClick={onDownloadInvoice}
                 leftIcon={<Download size={18} className="text-indigo-600" />}
               >
                 Download Digital Invoice
               </Button>
             )}
             <Button
                size="md"
                fullWidth
                onClick={() => window.location.reload()}
                className="bg-slate-900 hover:bg-black text-white border-none shadow-xl"
                leftIcon={<Plus size={18} />}
              >
                Initiate New Billing
              </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSummaryPanel;
