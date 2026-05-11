import React from 'react';
import { Minus, Plus, Trash2, Tag, Percent } from 'lucide-react';

interface CartItemData {
  cartId: string;
  name: string;
  sku: string;
  rate: number;
  quantity: number;
  discount: number;
  gstRate: number;
  currentStock: number;
}

interface CartItemProps {
  item: CartItemData;
  onUpdate: (cartId: string, field: 'quantity' | 'discount', value: number) => void;
  onRemove: (cartId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdate, onRemove }) => {
  const itemTaxable = (item.rate * item.quantity) - item.discount;
  const itemTotal = itemTaxable * (1 + item.gstRate / 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center gap-6 relative group border-l-4 border-l-transparent hover:border-l-primary capitalize">
      <div className="flex-1 flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
          <Tag className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900 text-lg leading-tight truncate">{item.name}</h4>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
             <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg uppercase tracking-wider">SKU: {item.sku}</span>
             <span className="text-[10px] font-black bg-blue-50 text-primary px-2 py-0.5 rounded-lg uppercase tracking-wider">Rate: ₹{item.rate}</span>
             <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg uppercase tracking-wider">GST: {item.gstRate}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 w-full lg:w-auto">
        
        {/* Quantity Controls */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Quantity</label>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-12 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <button 
              className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white transition-colors cursor-pointer"
              onClick={() => onUpdate(item.cartId, 'quantity', item.quantity - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input 
              type="number" 
              value={item.quantity}
              onChange={(e) => onUpdate(item.cartId, 'quantity', Number(e.target.value))}
              className="w-12 h-full text-center bg-transparent font-black text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white transition-colors cursor-pointer"
              onClick={() => onUpdate(item.cartId, 'quantity', item.quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Discount Control */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Discount (₹)</label>
          <div className="relative h-12 w-28">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-black">₹</span>
            </div>
            <input 
              type="number" 
              value={item.discount}
              onChange={(e) => onUpdate(item.cartId, 'discount', Number(e.target.value))}
              className="h-full w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 font-black text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Total Price */}
        <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Total</label>
          <div className="font-black text-xl text-gray-900 h-12 flex items-center pr-1">
            ₹{itemTotal.toFixed(2)}
          </div>
        </div>

        {/* Remove Button */}
        <button 
           onClick={() => onRemove(item.cartId)} 
           className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-50 text-danger hover:bg-danger hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-red-200"
           title="Remove from cart"
        >
           <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
