import React from 'react';
import { Receipt, Tag, Info } from 'lucide-react';

interface CalculationData {
  subTotal: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  totalDiscount: number;
}

interface InvoiceSummaryProps {
  calculations: CalculationData;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ calculations }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-100 p-8 flex flex-col text-gray-900 relative overflow-hidden group hover:border-primary/20 transition-all">
      {/* Visual flair - gradient orbit */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors"></div>
      
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 relative z-10">
        <Receipt className="w-4 h-4 text-primary" /> 
        <span>Invoice Summary</span>
      </h3>
      
      <div className="space-y-4 flex-1 relative z-10">
        <div className="flex justify-between items-center py-4 px-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-primary/20 transition-all hover:shadow-sm">
          <span className="text-sm font-bold text-gray-500">Items Gross Total</span>
          <span className="font-black text-xl text-gray-900 font-mono">₹{calculations.subTotal.toFixed(2)}</span>
        </div>
        
        <div className="px-5 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1.5 text-gray-400 font-black uppercase tracking-widest text-[9px]">
              <Tag className="w-3 h-3 text-emerald-500" /> Discount
            </div>
            <span className="font-black text-emerald-600 font-mono">- ₹{calculations.totalDiscount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1.5 text-gray-400 font-black uppercase tracking-widest text-[9px]">
              <Info className="w-3 h-3 text-primary" /> CGST (Central)
            </div>
            <span className="font-black text-gray-700 font-mono">₹{calculations.cgst.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1.5 text-gray-400 font-black uppercase tracking-widest text-[9px]">
              <Info className="w-3 h-3 text-primary" /> SGST (State)
            </div>
            <span className="font-black text-gray-700 font-mono">₹{calculations.sgst.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 mt-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Grand Total Amount</span>
            <div className="text-5xl font-black tracking-tighter text-gray-950 font-mono">
              ₹{calculations.grandTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;
