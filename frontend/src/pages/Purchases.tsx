import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Plus, Search, Receipt, Package, AlertCircle, 
  CheckCircle2, Loader2, Truck, Calendar, X 
} from 'lucide-react';
import Input from '../components/ui/Input';
import Modal from '../components/Modal';
import FormField from '../components/ui/FormField';
import Select from '../components/ui/Select';
import { useFormDraft } from '../hooks/useFormDraft';
import DraftRestorationModal from '../components/DraftRestorationModal';
import toast from 'react-hot-toast';
import { usePermission } from '../hooks/usePermission';

interface Product {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  gstRate: number;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
  gstin?: string;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  gstRate: number;
  taxAmount: number;
  total: number;
}

interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierInvoiceNo: string | null;
  date: string;
  grandTotal: number;
  amountPaid: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  supplier: { name: string; gstin: string | null };
  items: any[];
}

const statusColors: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  UNPAID: 'bg-red-100 text-red-700 border-red-200',
  PARTIAL: 'bg-amber-100 text-amber-700 border-amber-200',
};

const Purchases = () => {
  const qc = useQueryClient();
  const { hasPermission, checkPermissionAndRun } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Draft Preservation Hook
  const { hasDraft, draftData, saveDraft, clearDraft, restoreDraft } = useFormDraft(
    'purchase_entry',
    { supplierId, supplierInvoiceNo, amountPaid, items },
    {
      autoRestore: false, // Critical form => prompt instead of auto-restore
      onRestore: (data) => {
        setSupplierId(data.supplierId);
        setSupplierInvoiceNo(data.supplierInvoiceNo);
        setAmountPaid(data.amountPaid);
        setItems(data.items);
        toast.success('Purchase draft restored');
      }
    }
  );

  // Auto-save draft when data changes
  React.useEffect(() => {
    if (showModal) {
      const timeoutId = setTimeout(() => {
        saveDraft({ supplierId, supplierInvoiceNo, amountPaid, items });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [supplierId, supplierInvoiceNo, amountPaid, items, saveDraft, showModal]);

  const { data: bills = [], isLoading, error } = useQuery<PurchaseBill[]>({
    queryKey: ['purchases'],
    queryFn: async () => { const res = await api.get('/purchases'); return res.data; }
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => { const res = await api.get('/suppliers'); return res.data; }
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => { const res = await api.get('/products'); return res.data; }
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 6);

  const addItem = (product: Product) => {
    const taxAmount = product.purchasePrice * (product.gstRate / 100);
    setItems([...items, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      rate: product.purchasePrice,
      gstRate: product.gstRate,
      taxAmount: taxAmount,
      total: product.purchasePrice + taxAmount
    }]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateItem = (idx: number, field: keyof PurchaseItem, value: number) => {
    const newItems = [...items];
    const item = { ...newItems[idx], [field]: value };
    const subtotal = item.rate * item.quantity;
    item.taxAmount = subtotal * (item.gstRate / 100);
    item.total = subtotal + item.taxAmount;
    newItems[idx] = item;
    setItems(newItems);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const totals = items.reduce((acc, item) => ({
    subTotal: acc.subTotal + item.rate * item.quantity,
    totalTax: acc.totalTax + item.taxAmount,
    grandTotal: acc.grandTotal + item.total
  }), { subTotal: 0, totalTax: 0, grandTotal: 0 });

  const resetForm = () => {
    setSupplierId(''); setSupplierInvoiceNo(''); setAmountPaid(''); setItems([]); setFormError('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const billNumber = `PB-${Date.now().toString().slice(-6)}`;
      await api.post('/purchases', {
        billNumber,
        supplierInvoiceNo: supplierInvoiceNo || null,
        supplierId: supplierId || null,
        subTotal: totals.subTotal,
        totalTax: totals.totalTax,
        grandTotal: totals.grandTotal,
        amountPaid: Number(amountPaid) || 0,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          rate: i.rate,
          gstRate: i.gstRate,
          taxAmount: i.taxAmount,
          total: i.total
        }))
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      clearDraft(); // Clear draft on success
      resetForm();
      setSuccessMsg('Purchase bill recorded & stock updated!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: () => setFormError('Failed to record purchase. Please try again.')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (items.length === 0) { setFormError('Add at least one item to the purchase bill.'); return; }
    createMutation.mutate();
  };

  const filtered = bills.filter(b =>
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.supplierInvoiceNo && b.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <DraftRestorationModal 
        isOpen={hasDraft}
        formName="uncommitted purchase entry"
        onRestore={() => restoreDraft()}
        onDiscard={clearDraft}
        timestamp={(draftData as any)?.timestamp}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Purchase Register</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage procurement logs and track inbound inventory shipments.</p>
        </div>
        <button 
          id="new-purchase-btn" 
          disabled={!hasPermission('PURCHASES.CREATE')}
          onClick={() => {
            checkPermissionAndRun('PURCHASES.CREATE', () => {
              setShowModal(true);
              resetForm();
            });
          }}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={18} />
          New Purchase Entry
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold animate-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {/* Summary Cards */}
      {/* Analytics Brief */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-slate-500">Total Purchase Records</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{bills.length}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-600">Archived</span>
          </div>
          <Receipt className="absolute bottom-4 right-4 text-indigo-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-slate-500">Inbound Stock Value</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">₹{bills.reduce((s, b) => s + b.grandTotal, 0).toLocaleString()}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-600">Realized</span>
          </div>
          <Package className="absolute bottom-4 right-4 text-emerald-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-slate-500">Pending Settlements</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-rose-600">{bills.filter(b => b.status !== 'PAID').length}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-600">Outstanding</span>
          </div>
          <AlertCircle className="absolute bottom-4 right-4 text-rose-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
        </div>
      </div>

      {/* Bills Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Bill, Supplier or Invoice..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-sm font-medium placeholder:text-slate-400 bg-white" 
            />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Calendar size={14} /> Registry Status
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Bill/Invoice Number</th>
                <th className="px-6 py-4">Source Supplier</th>
                <th className="px-6 py-4 text-center">Inbound Date</th>
                <th className="px-6 py-4 text-center">Batch Vol</th>
                <th className="px-6 py-4 text-right">Settlement Amount</th>
                <th className="px-6 py-4 text-center">Protocol Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-slate-400 font-medium text-sm">Querying procurement ledger...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800">Protocol Failure</p>
                    <p className="text-xs font-semibold text-rose-500 mt-1">Failed to resolve purchase records.</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No purchases found</h3>
                    <p className="text-sm text-slate-400 mt-1">Initiate your inventory pipeline to record stock.</p>
                  </td>
                </tr>
              ) : filtered.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 text-sm tracking-tight">
                      {bill.billNumber}
                    </div>
                    {bill.supplierInvoiceNo && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-tight">
                          Invoice: <span className="text-slate-600 font-mono tracking-normal">{bill.supplierInvoiceNo}</span>
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-900">{bill.supplier?.name || 'Cash Purchase'}</div>
                    {bill.supplier?.gstin && <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{bill.supplier.gstin}</div>}
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-medium text-slate-600">
                    {new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-md border border-slate-100">
                       {bill.items?.length ?? 0} SKU(s)
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="font-bold text-slate-900 text-lg tracking-tight">
                      ₹{bill.grandTotal.toLocaleString()}
                    </div>
                    {bill.status !== 'PAID' && (
                      <div className="text-[10px] font-bold text-rose-600 mt-0.5 uppercase tracking-wider tabular-nums font-mono">
                        Due: ₹{(bill.grandTotal - bill.amountPaid).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusColors[bill.status]}`}>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-4xl"
        title={
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Receipt size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Record Inbound Purchase</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Automated stock replenishment and ledger synchronization.</p>
            </div>
          </div>
        }
        footer={
          <div className="flex gap-4 w-full px-2">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="px-8 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="purchaseForm" 
              disabled={createMutation.isPending}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:shadow-none transition-all"
            >
              {createMutation.isPending ? (
                <><Loader2 size={18} className="animate-spin" /> Finalizing pipeline...</>
              ) : (
                <><CheckCircle2 size={18} /> Confirm Purchase</>
              )}
            </button>
          </div>
        }
      >
        <form id="purchaseForm" onSubmit={handleSubmit} className="p-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Supplier Source" required>
              <Select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Direct Cash Purchase</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            
            <FormField label="Original Invoice Number">
              <Input 
                type="text" 
                placeholder="e.g. INV/2025/104"
                value={supplierInvoiceNo} 
                onChange={e => setSupplierInvoiceNo(e.target.value)} 
              />
            </FormField>
          </div>

          <FormField label="Inventory Item Lookup" required>
            <div className="relative group">
              <Input 
                type="text" 
                placeholder="Search products by brand, molecule or SKU..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                onFocus={() => setShowProductDropdown(true)}
                icon={<Search className="w-5 h-5 text-slate-400" />}
                iconPosition="left"
              />
              {showProductDropdown && productSearch && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-slate-400 text-xs font-bold uppercase tracking-widest text-center">
                      SKU not identified in registry
                    </div>
                  ) : filteredProducts.map(p => (
                    <button 
                      key={p.id} 
                      type="button" 
                      onClick={() => addItem(p)}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm tracking-tight">{p.name}</div>
                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">SKU: <span className="text-slate-700 font-mono tracking-normal">{p.sku}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">₹{p.purchasePrice}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">per {p.unit}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {items.length > 0 && (
            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">SKU Spec</th>
                    <th className="px-6 py-4 text-center w-28">Quantity</th>
                    <th className="px-6 py-4 text-right w-32">Rate (₹)</th>
                    <th className="px-6 py-4 text-right w-32">Line Total</th>
                    <th className="px-6 py-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 tracking-tight">{item.productName}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">GST Applied: {item.gstRate}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border-0 rounded-lg text-center font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={item.rate}
                          onChange={e => updateItem(idx, 'rate', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border-0 rounded-lg text-right font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none" 
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                        ₹{item.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx)} 
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 border-t border-slate-100">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Subtotal</td>
                    <td className="px-6 py-3 text-right font-bold text-slate-700">₹{totals.subTotal.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Accumulation</td>
                    <td className="px-6 py-3 text-right font-bold text-slate-700">₹{totals.totalTax.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest">Net Value</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600 text-xl tracking-tight">₹{totals.grandTotal.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="bg-indigo-50/20 p-8 rounded-2xl border border-indigo-100/50">
            <FormField label="Realized Payment (₹)" helperText="Leave empty for full auto-settlement.">
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder={`Balance: ₹${totals.grandTotal.toLocaleString()}`}
                value={amountPaid} 
                onChange={e => setAmountPaid(e.target.value)}
                className="font-bold text-2xl text-indigo-600 focus:ring-indigo-100 placeholder:text-indigo-200"
              />
            </FormField>
          </div>

          {formError && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" /> {formError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Purchases;
