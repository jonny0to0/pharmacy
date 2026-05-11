import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2, ReceiptText } from 'lucide-react';

interface StockBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  isVerified: boolean;
  isMigrated: boolean;
  sellingPrice: number;
  mrp: number;
}

interface CartItemData {
  cartId: string;
  name: string;
  sku: string;
  rate: number;
  quantity: number;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  gstRate: number;
  currentStock: number;
  batches?: StockBatch[];
  selectedBatchId?: string;
  discountAmt?: number;
  total?: number;
}

interface ModernCartProps {
  items: CartItemData[];
  onUpdate: (cartId: string, field: 'quantity' | 'discountValue' | 'discountType' | 'selectedBatchId', value: any) => void;
  onRemove: (cartId: string) => void;
}

const ModernCart: React.FC<ModernCartProps> = ({ items, onUpdate, onRemove }) => {
  const now = new Date();
  const NEAR_EXPIRY_DAYS = 90;

      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-700 text-center">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-indigo-50/50 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-indigo-50">
            <ShoppingCart size={40} className="text-indigo-200" />
            <div className="absolute top-2 right-2 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Cart is Empty</h3>
        <p className="text-slate-500 mt-2 max-w-sm font-medium leading-relaxed text-sm">
          Identify products or scan barcodes to begin. FEFO logic will automatically select optimal batches.
        </p>
      </div>

  return (
    <div className="flex flex-col gap-3 animate-fade-in pb-8">
      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-[1.2fr,200px,220px,120px,40px] gap-4 px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100">
        <span>Product Narrative</span>
        <span className="text-center">Active Batch Info</span>
        <span className="text-center">Quantity & Concession</span>
        <span className="text-right pr-4">Aggregated Total</span>
        <span></span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const selectedBatch = item.batches?.find(b => b.id === item.selectedBatchId);
          const expiryDate = selectedBatch?.expiryDate ? new Date(selectedBatch.expiryDate) : null;
          const isExpired = expiryDate && expiryDate < now;
          const isNearExpiry = expiryDate && !isExpired && (expiryDate.getTime() - now.getTime()) < (NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          
          return (
            <div 
              key={item.cartId}
              className={`group bg-white border rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-md ${isExpired ? 'border-rose-100 bg-rose-50/20' : 'border-slate-50 hover:border-indigo-100'}`}
            >
              <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr,200px,220px,120px,40px] items-center gap-4">
                
                {/* Identity */}
                <div className="flex items-center gap-4 w-full min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${isExpired ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100'}`}>
                    <ReceiptText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-base leading-tight truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">SKU: {item.sku}</span>
                      <span className="text-slate-200">•</span>
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        (selectedBatch?.quantity || 0) > 10 ? 'text-emerald-600' : (selectedBatch?.quantity || 0) > 0 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                         {selectedBatch?.quantity || 0} units remaining
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch / Expiry Selection */}
                <div className="w-full lg:w-auto">
                  <div className="relative group/batch">
                    <select 
                      value={item.selectedBatchId}
                      onChange={(e) => onUpdate(item.cartId, 'selectedBatchId', e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none disabled:opacity-50 ${isExpired ? 'text-rose-600 border-rose-200' : isNearExpiry ? 'text-amber-700' : 'text-slate-700'}`}
                    >
                      {item.batches?.map(b => (
                        <option key={b.id} value={b.id} disabled={b.quantity <= 0}>
                          {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()}) - {b.quantity} Left
                        </option>
                      ))}
                    </select>
                    {isExpired && <div className="text-[9px] font-bold text-rose-600 uppercase mt-1.5 ml-1 flex items-center gap-1"><Trash2 size={12} /> Expired Batch</div>}
                    {isNearExpiry && !isExpired && <div className="text-[9px] font-bold text-amber-600 uppercase mt-1.5 ml-1 flex items-center gap-1">Nearest Expiry</div>}
                  </div>
                </div>

                {/* Controls (Qty & Discount) */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-center">
                  {/* Qty */}
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 h-12 shadow-inner">
                    <button 
                      onClick={() => onUpdate(item.cartId, 'quantity', item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdate(item.cartId, 'quantity', Number(e.target.value))}
                      className="w-10 text-center bg-transparent border-none focus:ring-0 font-bold text-lg text-slate-900"
                    />
                    <button 
                      onClick={() => onUpdate(item.cartId, 'quantity', item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Discount Toggle & Input */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl h-12 overflow-hidden shadow-sm focus-within:border-indigo-600 transition-all">
                    <button 
                      onClick={() => onUpdate(item.cartId, 'discountType', item.discountType === 'PERCENT' ? 'FLAT' : 'PERCENT')}
                      className="h-full px-3 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-xs transition-colors"
                    >
                      {item.discountType === 'PERCENT' ? '%' : '₹'}
                    </button>
                    <input 
                      type="number"
                      value={item.discountValue}
                      onChange={(e) => onUpdate(item.cartId, 'discountValue', Number(e.target.value))}
                      placeholder="0"
                      className="w-16 h-full px-3 font-bold text-slate-900 border-none focus:ring-0 text-sm"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="text-right w-full lg:w-auto px-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:block mb-1">Total Gap</div>
                  <div className="font-bold text-xl text-slate-900 tracking-tight">₹{item.total?.toLocaleString()}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Incl. {item.gstRate}% GST</div>
                </div>

                {/* Remove */}
                <div className="flex justify-end lg:justify-center w-full lg:w-auto">
                   <button 
                    onClick={() => onRemove(item.cartId)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ModernCart;
