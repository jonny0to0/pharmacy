import React from 'react';
import { Banknote, Smartphone, CreditCard, Landmark, CheckCircle2, Loader2, Download, AlertCircle } from 'lucide-react';

interface PaymentSectionProps {
  paymentMode: string;
  setPaymentMode: (mode: string) => void;
  amountPaid: string;
  setAmountPaid: (amount: string) => void;
  onCheckout: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  grandTotal: number;
  onDownloadInvoice?: () => void;
  error?: string | null;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ 
  paymentMode, 
  setPaymentMode, 
  amountPaid, 
  setAmountPaid, 
  onCheckout, 
  isLoading, 
  isSuccess, 
  grandTotal,
  onDownloadInvoice,
  error
}) => {
  const paid = parseFloat(amountPaid) || grandTotal;
  const change = Math.max(0, paid - grandTotal);

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case 'CASH': return <Banknote className="w-5 h-5" />;
      case 'UPI': return <Smartphone className="w-5 h-5" />;
      case 'CARD': return <CreditCard className="w-5 h-5" />;
      case 'CREDIT': return <Landmark className="w-5 h-5" />;
      default: return <Banknote className="w-5 h-5" />;
    }
  };

  return (
    <div className="mt-8 space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Payment Modes Grid */}
      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">Select Payment Mode</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['CASH', 'UPI', 'CARD', 'CREDIT'].map(mode => (
            <button
              key={mode}
              className={`
                py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all outline-none cursor-pointer border-2
                ${paymentMode === mode 
                  ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105 z-10' 
                  : 'bg-white border-gray-100 text-gray-400 hover:bg-white hover:border-primary/30 hover:text-primary'}
              `}
              onClick={() => setPaymentMode(mode)}
            >
              <div className={paymentMode === mode ? 'text-white' : 'text-gray-400'}>
                {getPaymentIcon(mode)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{mode}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Amount Paid & Change Logic */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Amount Received (₹)</label>
          <div className="relative">
            <input 
              type="number" 
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={grandTotal.toFixed(2)}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-gray-900 focus:outline-none focus:border-primary text-xl font-black shadow-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:border-gray-200"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Change Due (₹)</label>
          <div className="w-full h-full bg-emerald-50/50 border-2 border-dashed border-emerald-100 rounded-2xl p-4 text-emerald-600 text-xl font-black flex items-center justify-center shadow-inner">
            {change.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Complete Sale Button */}
      {!isSuccess ? (
        <button
          onClick={onCheckout}
          disabled={isLoading || grandTotal <= 0}
          className={`
            w-full py-5 rounded-[1.5rem] font-black text-xl flex flex-col items-center justify-center transition-all outline-none shadow-2xl relative overflow-hidden group
            ${grandTotal <= 0 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100' 
              : 'bg-gradient-to-br from-success to-emerald-600 hover:from-success hover:to-success text-white shadow-success/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}
          `}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> 
              <span>Processing...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 relative z-10">
                <span>Charge ₹{grandTotal.toFixed(2)}</span>
              </div>
              <span className="text-[9px] font-bold text-white/50 bg-black/20 px-3 py-1 rounded-full uppercase tracking-[0.2em] mt-2 relative z-10">
                 Ctrl + Enter
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="w-full py-5 bg-success/10 border-2 border-success/30 text-success rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg shadow-success/5">
              <CheckCircle2 className="w-7 h-7" /> Sale Completed
           </div>
           {onDownloadInvoice && (
             <button
               onClick={onDownloadInvoice}
               className="w-full py-4 bg-white hover:bg-gray-50 border border-primary/20 text-primary rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm"
             >
               <Download className="w-4 h-4" /> Download PDF Invoice
             </button>
           )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black flex items-center gap-3 uppercase tracking-wider animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
