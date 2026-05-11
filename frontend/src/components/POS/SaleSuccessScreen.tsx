import React from 'react';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

interface SaleSuccessScreenProps {
  saleData: any;
  onNewSale: () => void;
}

const SaleSuccessScreen: React.FC<SaleSuccessScreenProps> = ({ saleData, onNewSale }) => {
  const { invoiceNumber, date, items, customer, grandTotal, paymentMode, amountPaid, subTotal, discount } = saleData;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      generateInvoicePDF(saleData, null);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10 px-4 w-full">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-emerald-800 mb-2">Sale Completed Successfully</h2>
          <p className="text-emerald-600 font-medium">Invoice: {invoiceNumber} • Date: {new Date(date).toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Customer & Payment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Details</h3>
              {customer ? (
                <div>
                  <p className="font-semibold text-gray-800">{customer.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                  {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                </div>
              ) : (
                <p className="text-gray-500 italic">Walk-in Customer</p>
              )}
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium text-gray-800">{paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-emerald-600">₹{Number(amountPaid).toFixed(2)}</span>
                </div>
                {Number(amountPaid) < grandTotal && (
                  <div className="flex justify-between text-red-500 text-sm mt-1">
                    <span>Due Amount</span>
                    <span className="font-medium">₹{(grandTotal - Number(amountPaid)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sold Products</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.product?.name || item.name}
                        {item.currentStock !== undefined && (
                          <div className="text-xs text-gray-400 mt-1">
                            Remaining Stock: {Math.max(0, item.currentStock - item.quantity)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">₹{Number(item.rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">₹{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-right font-medium text-gray-600">Subtotal</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">₹{Number(subTotal).toFixed(2)}</td>
                  </tr>
                  {discount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium text-gray-600">Discount</td>
                      <td className="px-4 py-2 text-sm text-right text-red-500">-₹{Number(discount).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-right font-bold text-gray-800">Grand Total</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-indigo-600 text-lg">₹{Number(grandTotal).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-wrap justify-center gap-4">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            Print
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            PDF
          </button>

          <button
            onClick={() => {
              // Placeholder for Send Receipt
              alert("Receipt sent to customer successfully.");
            }}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            Send Receipt
          </button>

          <a
            href="/sales/history"
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            History
          </a>

          <button
            onClick={onNewSale}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            New Sale
          </button>
        </div>
      </div>
      
      {/* CSS for custom animations */}
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SaleSuccessScreen;
