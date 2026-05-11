import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Plus, Search, Package, AlertCircle, Filter, 
  MoreHorizontal, Edit3, Trash2, ArrowUpRight, 
  BarChart3, RefreshCw, AlertTriangle, ChevronRight,
  Archive, Layers, MapPin
} from 'lucide-react';
import ProductManagementModal from '../components/ProductManagementModal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import alerts from '../utils/alerts';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  location: string | null;
  batches?: any[];
  hasMedicalInfo?: boolean;
  medicalDescription?: string;
  uses?: string;
  contraindications?: string;
  sideEffects?: string;
  precautions?: string;
  dosageInfo?: string;
}

const Products = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const businessType = user?.businessType || 'PHARMACY';
  const isPharma = businessType === 'PHARMACY' || businessType === 'WHOLESALER' || businessType === 'DISTRIBUTOR';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'EXPIRY'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search: searchTerm } });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      alerts.success('Product Deleted', 'The product has been permanently removed.');
    }
  });

  const filteredProducts = products.filter(p => {
    if (filter === 'LOW') return p.currentStock <= p.minStockLevel;
    // Expiry check would need batch data enrichment, simplified for now
    return true;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await alerts.confirm('Delete Product', 'Executing permanent removal of this SKU profile. Continue?', 'Delete');
    if (result.isConfirmed) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const pageTitle = businessType === 'WHOLESALER' ? 'Warehouse Stock' : 
                   (isPharma ? 'Medicine Inventory' : 'Inventory Master');

  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockLevel).length;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage global inventory records and stock synchronization.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<RefreshCw size={18} />} onClick={() => qc.invalidateQueries({ queryKey: ['products'] })}>
             Sync
          </Button>
          <Button onClick={openAddModal} leftIcon={<Plus size={18} />}>
            Add Product
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Inventory Valuation</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-slate-900">₹{totalValue.toLocaleString()}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-600">Total Assets</span>
            </div>
            <BarChart3 className="absolute bottom-4 right-4 text-indigo-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Low Stock Alerts</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-rose-600">{lowStockCount}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-600">Reorder Required</span>
            </div>
            <AlertTriangle className="absolute bottom-4 right-4 text-rose-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0">
           <CardContent className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl h-full">
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <p className="text-xs font-semibold text-slate-400">Master Catalog</p>
                 <div className="mt-2">
                    <p className="text-white text-lg font-bold tracking-tight leading-tight">{products.length} SKUs Listed</p>
                    <p className="text-slate-400 text-[10px] mt-1">Across {new Set(products.map(p => p.category)).size} categories</p>
                 </div>
              </div>
              <Layers className="absolute -bottom-2 -right-2 w-24 h-24 text-slate-800 opacity-20" />
           </CardContent>
        </Card>
      </div>

      {/* Main Filter & Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search by SKU, Name, or Brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="text-slate-400" />}
              className="py-2.5 shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
             <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>All Items</button>
             <button onClick={() => setFilter('LOW')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'LOW' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Low Stock</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Inventory Info</th>
                <th className="px-6 py-4">Pricing (Buy/Sell)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-400 font-medium text-sm capitalize">Loading global inventory nodes...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <Archive className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No products found</h3>
                    <p className="text-sm text-slate-400 mt-1">Try refining your search parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                          <Package size={24} />
                        </div>
                        <div>
                          <p onClick={() => openEditModal(p)} className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2">
                             {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                             <Badge variant="neutral" className="bg-slate-100 text-slate-500 text-[9px] font-bold border-0">{p.category || 'General'}</Badge>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                           <span className={`text-lg font-bold tabular-nums ${p.currentStock <= p.minStockLevel ? 'text-rose-600' : 'text-slate-900'}`}>{p.currentStock}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{p.unit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                          <MapPin size={10} /> {p.location || 'Unassigned'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1">
                          <div className="text-sm font-bold text-slate-800">₹{p.sellingPrice.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">Sell</span></div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest underline decoration-slate-200">Cost: ₹{p.purchasePrice.toLocaleString()}</div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       {p.currentStock <= p.minStockLevel ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Low Stock</span>
                         </div>
                       ) : (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-tight">In Stock</span>
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2 transition-opacity">
                         <Button variant="outline" size="icon" onClick={() => openEditModal(p)} title="Edit SKU">
                           <Edit3 size={16} />
                         </Button>
                         <Button variant="danger" size="icon" onClick={() => handleDelete(p.id)} title="Archive Product">
                           <Trash2 size={16} />
                         </Button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductManagementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          qc.invalidateQueries({ queryKey: ['products'] });
          alerts.success(editingProduct ? 'Product Updated' : 'Product Added', `Product profile has been successfully ${editingProduct ? 'updated' : 'created'}.`);
        }}
        initialData={editingProduct}
      />
    </div>
  );
};

export default Products;