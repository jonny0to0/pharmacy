import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Plus, Search, Receipt, X, Loader2, AlertCircle, 
  CheckCircle2, ShoppingBag, Zap, Home, Car, Users, 
  Calendar, CreditCard 
} from 'lucide-react';
import Modal from '../components/Modal';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMode: string;
  reference: string | null;
}

const CATEGORIES = [
  { id: 'Rent', icon: <Home className="w-4 h-4" /> },
  { id: 'Utilities', icon: <Zap className="w-4 h-4" /> },
  { id: 'Staff Salary', icon: <Users className="w-4 h-4" /> },
  { id: 'Conveyance', icon: <Car className="w-4 h-4" /> },
  { id: 'Supplies', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'Miscellaneous', icon: <Receipt className="w-4 h-4" /> }
];

const Expenses = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [reference, setReference] = useState('');

  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => { const res = await api.get('/expenses'); return res.data; }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      setShowModal(false);
      resetForm();
      setSuccessMsg('Expense recorded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: () => setFormError('Failed to record expense. Please try again.')
  });

  const resetForm = () => {
    setCategory('Rent'); setAmount(''); setDescription(''); 
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Cash'); setReference(''); setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!amount || Number(amount) <= 0) { setFormError('Please enter a valid amount.'); return; }
    if (!description.trim()) { setFormError('Please enter a description.'); return; }
    
    createMutation.mutate({
      category,
      amount: Number(amount),
      description,
      date,
      paymentMode,
      reference: reference || null
    });
  };

  const filtered = expenses.filter(ex =>
    ex.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMonthly = expenses.reduce((s, ex) => s + ex.amount, 0);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Operational Expenses</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track internal costs, utility bills, and maintenance disbursements.</p>
        </div>
        <button 
          id="new-expense-btn" 
          onClick={() => { setShowModal(true); resetForm(); }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Record Voucher
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
          <p className="text-xs font-semibold text-slate-500">Monthly Burn Rate</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">₹{totalMonthly.toLocaleString()}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-600">Disbursed</span>
          </div>
          <Receipt className="absolute bottom-4 right-4 text-rose-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-slate-500">Active Vouchers</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{expenses.length}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-50 text-slate-500">Recorded</span>
          </div>
          <Zap className="absolute bottom-4 right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-slate-500">Average Voucher Value</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">₹{expenses.length > 0 ? (totalMonthly / expenses.length).toLocaleString() : '0'}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-600">Mean Value</span>
          </div>
          <ShoppingBag className="absolute bottom-4 right-4 text-emerald-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
        </div>
      </div>

      {/* Expenses Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Description or Category..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-600 transition-all text-sm font-medium placeholder:text-slate-400 bg-white" 
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expense Vectors</span>
            <div className="flex -space-x-1.5 ml-2">
                 {CATEGORIES.map((cat) => (
                   <div key={cat.id} className="h-7 w-7 rounded-full border-2 border-white bg-slate-50 text-slate-400 flex items-center justify-center hover:scale-110 transition-transform cursor-help" title={cat.id}>
                     {cat.icon}
                   </div>
                 ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Timeline & ID</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Expense Description</th>
                <th className="px-6 py-4">Payment Pipeline</th>
                <th className="px-6 py-4 text-right">Settled Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
                    <p className="mt-4 text-slate-400 font-medium text-sm">Compiling financial audit ledger...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Financial Slate Clean</h3>
                    <p className="text-sm text-slate-400 mt-1">Zero operational expenses identified in current registry.</p>
                  </td>
                </tr>
              ) : filtered.map(ex => (
                <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(ex.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">VOC: <span className="text-slate-600 font-mono tracking-normal">{ex.id.slice(-6)}</span></div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {ex.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-900 max-w-xs">{ex.description}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <CreditCard size={14} className="text-slate-400" />
                       <span className="text-sm font-medium text-slate-600">{ex.paymentMode}</span>
                    </div>
                    {ex.reference && <div className="text-[10px] font-semibold text-indigo-500 uppercase tracking-tight mt-1">Ref: {ex.reference}</div>}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="font-bold text-slate-900 text-lg tracking-tight tabular-nums">
                      ₹{ex.amount.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-2xl"
        title={
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Record Voucher Entry</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Logging operational burn and maintenance costs.</p>
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
              form="expenseForm" 
              disabled={createMutation.isPending}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:shadow-none transition-all"
            >
              {createMutation.isPending ? (
                <><Loader2 size={18} className="animate-spin" /> Finalizing Audit...</>
              ) : (
                <><CheckCircle2 size={18} /> Confirm Disbursement</>
              )}
            </button>
          </div>
        }
      >
        <form id="expenseForm" onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Audit Category" required>
              <Select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.id}</option>)}
              </Select>
            </FormField>
            
            <FormField label="Transaction Date" required>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
              />
            </FormField>
          </div>

          <FormField label="Disbursement Amount (₹)" required>
            <Input 
              type="number" 
              min="0" 
              step="0.01" 
              placeholder="0.00"
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="font-bold text-2xl text-rose-600 focus:ring-rose-100 placeholder:text-rose-100"
            />
          </FormField>

          <FormField label="Narrative / Description" required>
            <Input 
              type="text" 
              placeholder="e.g. Monthly rent for Shop A-12"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Payment Mode">
              <Select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </FormField>
            
            <FormField label="Reference ID">
              <Input 
                type="text" 
                placeholder="UTR / ID (optional)"
                value={reference} 
                onChange={e => setReference(e.target.value)} 
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

export default Expenses;
