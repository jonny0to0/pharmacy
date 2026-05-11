import React from 'react';
import { Tag, Box, ShoppingCart, Info } from 'lucide-react';

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

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  currentStock: number;
  gstRate: number;
  unit: string;
  batches?: StockBatch[];
  hasMedicalInfo?: boolean;
}

interface ModernProductResultsProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onViewInfo: (product: Product) => void;
  searchQuery: string;
  showMedicalInfo?: boolean;
  isLoading?: boolean;
}

const ModernProductResults: React.FC<ModernProductResultsProps> = ({ products, isLoading, onSelect, onViewInfo, searchQuery, showMedicalInfo }) => {
  if (!searchQuery && products.length === 0) return null;

  const now = new Date();
  const NEAR_EXPIRY_THRESHOLD = 90; // days

  const getOptimalBatch = (batches: StockBatch[]) => {
    if (!batches || batches.length === 0) return null;
    // Strict compliance: Only verified, in-stock, and unexpired batches
    const valid = batches.filter(b => b.quantity > 0 && new Date(b.expiryDate) > now && b.isVerified !== false);
    return valid.sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] transform origin-top animate-in fade-in slide-in-from-top-2 duration-300">
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Analyzing inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-slate-500 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Box size={32} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-800 text-lg">No Results Identified</p>
          <p className="text-sm text-slate-500 mt-1 max-w-[220px] leading-relaxed">Try adjusting the identifier or searching for alternative categories.</p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{products.length} Matches Identified</span>
          </div>
          <ul className="divide-y divide-slate-50">
            {products.map(product => {
              const bestBatch = getOptimalBatch(product.batches || []);
              const outOfStock = product.currentStock <= 0 || !bestBatch;
              const expDate = bestBatch ? new Date(bestBatch.expiryDate) : null;
              const isNearExpiry = expDate && (expDate.getTime() - now.getTime()) < (NEAR_EXPIRY_THRESHOLD * 24 * 60 * 60 * 1000);

              return (
                <li 
                  key={product.id} 
                  onClick={() => !outOfStock && onSelect(product)}
                  className={`px-5 py-4 transition-all duration-300 flex justify-between items-center group ${
                    outOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50/30' : 'hover:bg-indigo-50/30 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      outOfStock 
                        ? 'bg-slate-50 text-slate-400 border-slate-100' 
                        : 'bg-white text-slate-400 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-100'
                    }`}>
                      <Tag size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 group-hover:text-indigo-900 transition-colors flex items-center gap-2">
                        {product.name}
                        {showMedicalInfo && product.hasMedicalInfo && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewInfo(product);
                            }}
                            className="p-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all animate-pulse"
                            title="View Medical Intelligence"
                          >
                            <Info size={12} />
                          </button>
                        )}
                        {outOfStock && product.currentStock > 0 && <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Restricted Expiries</span>}
                        {outOfStock && product.currentStock <= 0 && <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Stock Depleted</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SKU:</span>
                          <span className="text-xs font-semibold text-slate-600">{product.sku}</span>
                        </div>
                        {bestBatch && (
                          <>
                            <span className="text-slate-200">•</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Batch:</span>
                              <span className="text-xs font-bold text-slate-700">{bestBatch.batchNumber}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isNearExpiry ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                Exp: {new Date(bestBatch.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-xl tracking-tight">
                        ₹{(bestBatch as any)?.sellingPrice?.toLocaleString() || product.sellingPrice.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-2 ${
                        product.currentStock > 10 ? 'text-emerald-500' : product.currentStock > 0 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          product.currentStock > 10 ? 'bg-emerald-500 shadow-sm' : product.currentStock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></div>
                        {product.currentStock > 0 ? `${product.currentStock} units available` : 'Out of stock'}
                      </div>
                    </div>
                    {!outOfStock && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-100 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <ShoppingCart size={18} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModernProductResults;
