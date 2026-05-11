import React from 'react';
import {
  ShoppingCart, Trash2, Minus, Plus, Wallet,
  Banknote, Smartphone, CreditCard, Landmark,
  CheckCircle2, Calculator, ArrowRight, User
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import Button from '../ui/Button';

interface BillingPanelProps {
  onCheckout: () => void;
  onCustomerSelect: () => void;
  isLoading: boolean;
}

const BillingPanel: React.FC<BillingPanelProps> = ({
  onCheckout,
  onCustomerSelect,
  isLoading
}) => {
  const {
    cart,
    customer,
    paymentMode,
    amountPaid,
    updateQuantity,
    removeFromCart,
    setPaymentMode,
    setAmountPaid,
    getTotals
  } = useCartStore();

  const { subtotal, tax, discount, total } = getTotals();
  const paid = parseFloat(amountPaid) || total;
  const change = Math.max(0, paid - total);

  const paymentModes = [
    { id: 'CASH', label: 'Cash', icon: Banknote },
    { id: 'UPI', label: 'UPI', icon: Smartphone },
    { id: 'CARD', label: 'Card', icon: CreditCard },
    { id: 'CREDIT', label: 'Credit', icon: Landmark },
  ];

  return (
    <div className="h-auto xl:h-full flex flex-col bg-white border-t xl:border-l xl:border-t-0 border-gray-200 w-full xl:w-[400px] shrink-0">
      {/* Customer Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div
          onClick={onCustomerSelect}
          className="flex-1 flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Customer</p>
              <p className="text-sm font-semibold text-gray-800">{customer?.name || 'Walk-in Customer'}</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-gray-400">
            <ShoppingCart size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Your cart is empty</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartId} className="p-2.5 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="font-semibold text-gray-800 text-sm truncate" title={item.name}>{item.name}</h4>
                  <p className="text-xs text-gray-500">₹{item.rate} × {item.quantity}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium border-x border-gray-300">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-semibold text-gray-900 text-sm">₹{(item.rate * item.quantity).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-800">₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (GST)</span>
            <span className="font-medium text-gray-800">₹{tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-blue-700">₹{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Logic */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Payment Method</p>
          <div className="grid grid-cols-4 gap-2">
            {paymentModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setPaymentMode(mode.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-colors ${paymentMode === mode.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <mode.icon size={16} />
                <span className="text-xs font-medium">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input & Change */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Wallet size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={`Paid ${total}`}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          {paid > total && (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-xs font-medium text-green-700">Change Due</span>
              <span className="text-sm font-bold text-green-700">₹{change.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Button
          fullWidth
          size="md"
          onClick={onCheckout}
          disabled={cart.length === 0 || isLoading}
          isLoading={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          {isLoading ? 'Processing...' : 'Complete Sale'}
        </Button>
      </div>
    </div>
  );
};

export default BillingPanel;
