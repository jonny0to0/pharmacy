import React from 'react';
import { Tag, Box, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  currentStock: number;
  gstRate: number;
  unit: string;
}

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onSelect: (product: Product) => void;
  searchQuery: string;
}

const ProductList: React.FC<ProductListProps> = ({ products, isLoading, onSelect, searchQuery }) => {
  if (!searchQuery && products.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 transform origin-top animate-in slide-in-from-top-2 duration-200">
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-gray-500 font-medium">Searching inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-gray-500 text-center flex flex-col items-center">
          <Box className="w-10 h-10 text-gray-300 mb-2" />
          <p className="font-semibold text-gray-700">No products found</p>
          <p className="text-sm">Try searching by SKU or checking filters</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {products.map(product => (
            <li 
              key={product.id} 
              onClick={() => onSelect(product)}
              className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SKU: {product.sku}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">GST: {product.gstRate}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-black text-gray-900 text-lg">₹{product.sellingPrice.toFixed(2)}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${product.currentStock > 0 ? 'text-success' : 'text-danger'}`}>
                    {product.currentStock > 0 ? `${product.currentStock} in stock` : 'Out of stock'}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductList;
