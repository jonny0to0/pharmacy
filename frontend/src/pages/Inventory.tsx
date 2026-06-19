import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Search, Package, AlertCircle, RefreshCw, 
  AlertTriangle, MapPin, Archive, Layers, 
  Settings, SlidersHorizontal, BarChart3, Info,
  TrendingUp, Check, ShieldAlert, BookOpen
} from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import alerts from '../utils/alerts';
import toast from 'react-hot-toast';

interface Batch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string | null;
  mfgDate: string | null;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryName: string | null;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  location: string | null;
  stockbatch?: Batch[];
}

const Inventory = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { hasPermission } = usePermission();
  const businessType = user?.businessType || 'PHARMACY';
  const isPharma = businessType === 'PHARMACY' || businessType === 'WHOLESALER' || businessType === 'DISTRIBUTOR';

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'EXPIRY'>('ALL');
  
  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Audit Correction');

  const { data: inventory = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['inventory', searchTerm],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { search: searchTerm } });
      return res.data;
    }
  });

  const adjustMutation = useMutation({
    mutationFn: async (payload: { productId: string, batchId?: string, quantity: number, reason: string }) => {
      await api.post('/inventory/adjust', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      alerts.success('Stock Adjusted', 'The stock levels have been successfully updated.');
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      setSelectedBatchId('');
      setAdjustQuantity('');
      setAdjustReason('Audit Correction');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    }
  });

  const handleOpenAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    if (product.stockbatch && product.stockbatch.length > 0) {
      setSelectedBatchId(product.stockbatch[0].id);
    } else {
      setSelectedBatchId('');
    }
    setAdjustQuantity('');
    setAdjustReason('Audit Correction');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error('Please enter a non-zero integer quantity');
      return;
    }

    // If subtracting, ensure we don't go below zero for the batch/product stock
    if (qty < 0) {
      if (selectedBatchId) {
        const batch = selectedProduct.stockbatch?.find(b => b.id === selectedBatchId);
        if (batch && batch.quantity + qty < 0) {
          toast.error(`Cannot subtract more than available batch stock (${batch.quantity})`);
          return;
        }
      } else if (selectedProduct.currentStock + qty < 0) {
        toast.error(`Cannot subtract more than available total stock (${selectedProduct.currentStock})`);
        return;
      }
    }

    adjustMutation.mutate({
      productId: selectedProduct.id,
      batchId: selectedBatchId || undefined,
      quantity: qty,
      reason: adjustReason
    });
  };

  // Filter logic
  const filteredInventory = inventory.filter(p => {
    if (filter === 'LOW') return p.currentStock <= p.minStockLevel;
    if (filter === 'EXPIRY') {
      // Products with batches expiring in the next 90 days
      return p.stockbatch?.some(b => {
        if (!b.expiryDate) return false;
        const daysToExpiry = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        return daysToExpiry > 0 && daysToExpiry <= 90;
      });
    }
    return true;
  });

  // Analytics Metrics
  const totalValuation = inventory.reduce((sum, p) => {
    if (p.stockbatch && p.stockbatch.length > 0) {
      return sum + p.stockbatch.reduce((bsum, b) => bsum + (b.quantity * (b.purchasePrice || p.purchasePrice)), 0);
    }
    return sum + (p.currentStock * p.purchasePrice);
  }, 0);

  const lowStockCount = inventory.filter(p => p.currentStock <= p.minStockLevel).length;

  const nearExpiryCount = inventory.reduce((sum, p) => {
    const expiringBatches = p.stockbatch?.filter(b => {
      if (!b.expiryDate) return false;
      const days = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 90;
    }).length || 0;
    return sum + expiringBatches;
  }, 0);

  const pageTitle = businessType === 'WHOLESALER' ? 'Warehouse Stock' : 
                   (isPharma ? 'Medicine Inventory' : 'Inventory Master');

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor real-time stock levels, check drug expiry profiles, and perform audit corrections.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<RefreshCw size={18} />} onClick={() => qc.invalidateQueries({ queryKey: ['inventory'] })}>
             Sync
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0 bg-white">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Inventory Valuation</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-slate-900">₹{totalValuation.toLocaleString()}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-600">Assets Valuation</span>
            </div>
            <TrendingUp className="absolute bottom-4 right-4 text-indigo-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0 bg-white">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Low Stock SKUs</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-rose-600">{lowStockCount}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-600">Reorder Required</span>
            </div>
            <AlertTriangle className="absolute bottom-4 right-4 text-rose-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0 bg-white">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Near Expiry Batches</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-amber-600">{nearExpiryCount}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-50 text-amber-600">Within 90 Days</span>
            </div>
            <AlertCircle className="absolute bottom-4 right-4 text-amber-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
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
             {isPharma && (
               <button onClick={() => setFilter('EXPIRY')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'EXPIRY' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Expiring Soon</button>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Medicine Details</th>
                <th className="px-6 py-4">Batch Breakdown</th>
                <th className="px-6 py-4">Storage location</th>
                <th className="px-6 py-4 text-center">Total Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-400 font-medium text-sm capitalize">Loading global inventory records...</p>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <Archive className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No stock items found</h3>
                    <p className="text-sm text-slate-400 mt-1">Try modifying search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                           <Package size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                             {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                             <Badge variant="neutral" className="bg-slate-100 text-slate-500 text-[9px] font-bold border-0">{p.categoryName || 'General'}</Badge>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {p.stockbatch && p.stockbatch.length > 0 ? (
                        <div className="space-y-2">
                          {p.stockbatch.map((b) => {
                            const isExpired = b.expiryDate && new Date(b.expiryDate) <= new Date();
                            const isNearExpiry = b.expiryDate && !isExpired && ( (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 90 );
                            return (
                              <div key={b.id} className="flex items-center justify-between gap-4 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-lg transition-colors text-xs">
                                <div>
                                  <span className="font-bold text-slate-700">Batch: {b.batchNumber}</span>
                                  {b.expiryDate && (
                                    <div className="mt-0.5 text-[10px] font-semibold flex items-center gap-1">
                                      <span>Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
                                      {isExpired && <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-600 font-bold uppercase text-[8px]">Expired</span>}
                                      {isNearExpiry && <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-600 font-bold uppercase text-[8px]">Near Expiry</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-slate-800">{b.quantity}</span>
                                  <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">{p.unit}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold italic">No batch tracking configured</span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mt-1">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{p.location || 'Unassigned Rack'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-center">
                      <div className="flex flex-col items-center">
                         <span className="text-lg font-extrabold text-slate-900 tabular-nums">{p.currentStock}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-center">
                       {p.currentStock <= 0 ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                            <span className="text-[10px] font-bold uppercase tracking-tight">Out of Stock</span>
                         </div>
                       ) : p.currentStock <= p.minStockLevel ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                            <span className="text-[10px] font-bold uppercase tracking-tight">Low Stock</span>
                         </div>
                       ) : (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-tight">Healthy</span>
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         leftIcon={<Settings size={14} />} 
                         onClick={() => handleOpenAdjustModal(p)}
                         disabled={!hasPermission('INVENTORY.CREATE')}
                       >
                         Adjust
                       </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Stock Adjustment Audit</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Correct inventory counts for selected item and record audit logs.</p>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              type="button" 
              onClick={() => setIsAdjustModalOpen(false)} 
              className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="stockAdjustmentForm" 
              disabled={adjustMutation.isPending}
              className="px-6 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {adjustMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
              Apply Adjustment
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <form id="stockAdjustmentForm" onSubmit={handleAdjustSubmit} className="p-6 space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected Product</label>
              <div className="mt-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{selectedProduct.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">SKU: {selectedProduct.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-700">{selectedProduct.currentStock} {selectedProduct.unit}</p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Current Stock</p>
                </div>
              </div>
            </div>

            {selectedProduct.stockbatch && selectedProduct.stockbatch.length > 0 && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Batch to Adjust</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl p-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 cursor-pointer"
                >
                  {selectedProduct.stockbatch.map(b => (
                    <option key={b.id} value={b.id}>
                      Batch: {b.batchNumber} (Current stock: {b.quantity} {selectedProduct.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Adjustment Quantity</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -5 to reduce, 10 to add"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl p-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500"
                />
                <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                  Use negative numbers to subtract stock (e.g. damaged drugs) and positive numbers to add stock.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl p-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 cursor-pointer"
                >
                  <option value="Audit Correction">Audit Correction</option>
                  <option value="Damaged Stock">Damaged Stock</option>
                  <option value="Stock Loss">Stock Loss</option>
                  <option value="Supplier Return">Supplier Return</option>
                  <option value="Expired Product Disposal">Expired Product Disposal</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
