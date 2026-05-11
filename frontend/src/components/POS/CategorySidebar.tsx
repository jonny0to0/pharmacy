import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Pill, ShoppingCart, Package, Grid, CheckCircle, Clock, Star, Box, ListFilter } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  iconName?: string;
}

interface CategorySidebarProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategoryId: string | null;
}

const defaultIconMap: Record<string, any> = {
  Medicines: Pill,
  FMCG: ShoppingCart,
  General: Package,
  Uncategorized: Box,
};

const CategorySidebar: React.FC<CategorySidebarProps> = ({ onCategorySelect, selectedCategoryId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories?activeOnly=true');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getIcon = (cat: Category) => {
    const IconComponent = defaultIconMap[cat.name] || Grid;
    return <IconComponent size={18} strokeWidth={2} />;
  };

  return (
    <div className="h-auto xl:h-full flex flex-col bg-white border-b xl:border-r xl:border-b-0 border-gray-200 w-full xl:w-64 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 hidden xl:flex items-center gap-2">
        <ListFilter size={18} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Categories</h2>
      </div>

      {/* Category List */}
      <div className="flex-none xl:flex-1 min-h-0 min-w-0 overflow-x-auto xl:overflow-y-auto py-3 px-3 flex flex-row xl:flex-col gap-1.5 custom-scrollbar">
        {/* All Products */}
        <button
          onClick={() => onCategorySelect(null)}
          className={`w-auto whitespace-nowrap flex-shrink-0 xl:w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            selectedCategoryId === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Grid size={18} />
          <span>All Products</span>
        </button>

        <button
          className="w-auto whitespace-nowrap flex-shrink-0 xl:w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium cursor-not-allowed"
          disabled
        >
          <Star size={18} />
          <span>Popular</span>
        </button>

        <div className="hidden xl:block my-2 border-t border-gray-100" />

        {isLoading ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-lg w-full" />
            ))}
          </div>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`w-auto whitespace-nowrap flex-shrink-0 xl:w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className={selectedCategoryId === cat.id ? 'text-blue-700' : 'text-gray-400'}>
                {getIcon(cat)}
              </div>
              <span className="truncate">{cat.name}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer Filters */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-row xl:flex-col gap-2 overflow-x-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:block mb-1">Filters</p>
        <div className="flex flex-row xl:flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer group px-2 py-1.5 rounded hover:bg-gray-100 transition-colors whitespace-nowrap">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group px-2 py-1.5 rounded hover:bg-gray-100 transition-colors whitespace-nowrap">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">Expiring Soon</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;
