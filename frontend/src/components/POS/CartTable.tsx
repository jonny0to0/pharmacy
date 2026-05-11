import React from 'react';
import { ShoppingCart, PackageSearch } from 'lucide-react';
import CartItem from './CartItem';

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

interface CartTableProps {
  items: CartItemData[];
  onUpdate: (cartId: string, field: 'quantity' | 'discount', value: number) => void;
  onRemove: (cartId: string) => void;
}

const CartTable: React.FC<CartTableProps> = ({ items, onUpdate, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-gray-200/50">
          <ShoppingCart className="w-16 h-16 text-gray-200" />
        </div>
        <h3 className="text-2xl font-black text-gray-700 tracking-tight">Your cart is empty</h3>
        <p className="text-gray-500 mt-3 text-center max-w-sm font-medium leading-relaxed">
          Scan barcodes or search for products to build your checkout session. All added items will appear here.
        </p>
        <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 italic text-sm">
          <PackageSearch className="w-4 h-4 text-primary" />
          <span>Press <kbd className="font-sans font-bold text-primary">F2</kbd> to quickly focus search</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="hidden lg:grid grid-cols-[1fr,auto,auto,auto,auto] gap-6 px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
        <div>Product Details</div>
        <div className="w-32 text-center">Quantity</div>
        <div className="w-28 text-center">Discount</div>
        <div className="w-[120px] text-right">Total</div>
        <div className="w-12"></div>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <CartItem 
            key={item.cartId} 
            item={item} 
            onUpdate={onUpdate} 
            onRemove={onRemove} 
          />
        ))}
      </div>
    </div>
  );
};

export default CartTable;
