import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal, Info, ShoppingCart, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useCartStore, type Product } from '../../store/useCartStore';

interface ProductWorkspaceProps {
  selectedCategoryId: string | null;
  onViewInfo: (product: Product) => void;
  showMedicalInfo: boolean;
}

const ProductWorkspace: React.FC<ProductWorkspaceProps> = ({ 
  selectedCategoryId, 
  onViewInfo,
  showMedicalInfo 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', debouncedSearch, selectedCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      
      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
    enabled: true,
  });

  return (
    <div className="flex-1 flex flex-col min-h-[60vh] xl:min-h-0 xl:h-full bg-gray-50">
      {/* Search Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-gray-700 outline-none transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid/List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 min-[1920px]:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 h-40 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Search size={32} className="text-gray-300 mb-2" />
            <p className="text-base font-medium">No products found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 min-[1920px]:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} onViewInfo={onViewInfo} showMedicalInfo={showMedicalInfo} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
             {products.map((product) => (
              <ProductListItem key={product.id} product={product} onAdd={addToCart} onViewInfo={onViewInfo} showMedicalInfo={showMedicalInfo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAdd, onViewInfo, showMedicalInfo }: { product: Product; onAdd: any; onViewInfo: any; showMedicalInfo: boolean }) => {
  const inStock = product.currentStock > 0;
  
  return (
    <div 
      className={`group bg-white border border-gray-200 rounded-lg p-4 flex flex-col hover:border-blue-400 hover:shadow-sm transition-all ${!inStock ? 'opacity-70' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${inStock ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
          <Tag size={20} />
        </div>
        {showMedicalInfo && product.hasMedicalInfo && (
          <button 
            onClick={() => onViewInfo(product)}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            title="Medical Info"
          >
            <Info size={16} />
          </button>
        )}
      </div>

      <div className="mb-4 flex-1">
        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight mb-1" title={product.name}>{product.name}</h3>
        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
      </div>

      <div className="flex items-end justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-base font-bold text-gray-900">₹{(product.sellingPrice || 0).toLocaleString()}</p>
          <p className={`text-[11px] font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            {inStock ? `${product.currentStock} in stock` : 'Out of stock'}
          </p>
        </div>
        
        <button
          disabled={!inStock}
          onClick={() => onAdd(product)}
          className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
            inStock 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Add to cart"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );
};

const ProductListItem = ({ product, onAdd, onViewInfo, showMedicalInfo }: { product: Product; onAdd: any; onViewInfo: any; showMedicalInfo: boolean }) => {
  const inStock = product.currentStock > 0;

  return (
    <div className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors ${!inStock ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${inStock ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
          <Tag size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-800">{product.name}</h3>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500">SKU: {product.sku}</span>
            <span className={`text-[11px] font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
              {inStock ? `${product.currentStock} ${product.unit}` : 'Out of stock'}
            </span>
            {showMedicalInfo && product.hasMedicalInfo && (
              <button 
                onClick={() => onViewInfo(product)}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
              >
                <Info size={12} />
                Info
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-base font-bold text-gray-900">₹{(product.sellingPrice || 0).toLocaleString()}</p>
        </div>
        <button
          disabled={!inStock}
          onClick={() => onAdd(product)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            inStock 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          <ShoppingCart size={16} />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};

export default ProductWorkspace;
