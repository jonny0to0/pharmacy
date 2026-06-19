import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Loader2, X, CheckCircle2, Search, Banknote, Smartphone, 
  Building, ArrowDownLeft, ArrowUpRight, CreditCard, AlertCircle 
} from 'lucide-react';
import Modal from '../components/Modal';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import { usePermission } from '../hooks/usePermission';

interface Customer { id: string; name: string; outstandingBalance: number; }
interface Supplier { id: string; name: string; outstandingBalance: number; }

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

const modeIcons: Record<string, React.ReactNode> = {
  Cash: <Banknote className="w-4 h-4" />,
  UPI: <Smartphone className="w-4 h-4" />,
  'Bank Transfer': <Building className="w-4 h-4" />,
  Cheque: <CreditCard className="w-4 h-4" />,
  Card: <CreditCard className="w-4 h-4" />,
};

const Payments = () => {
  const qc = useQueryClient();
  const { hasPermission, checkPermissionAndRun } = usePermission();
  const [activeTab, setActiveTab] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Form state
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => { const r = await api.get('/customers'); return r.data; }
  });
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => { const r = await api.get('/suppliers'); return r.data; }
  });

  const receipts = customers.filter(c => c.outstandingBalance > 0)
    .map(c => ({ id: c.id, partyName: c.name, outstanding: c.outstandingBalance, type: 'RECEIPT' as const }));
  const payables = suppliers.filter(s => s.outstandingBalance > 0)
    .map(s => ({ id: s.id, partyName: s.name, outstanding: s.outstandingBalance, type: 'PAYMENT' as const }));

  const currentList = activeTab === 'RECEIPT' ? receipts : payables;
  const filteredList = currentList.filter(p =>
    p.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecievable = customers.reduce((s, c) => s + c.outstandingBalance, 0);
  const totalPayable = suppliers.reduce((s, c) => s + c.outstandingBalance, 0);

  const resetForm = () => {
    setSelectedPartyId(''); setAmount(''); setMode('Cash'); setReference(''); setNotes(''); setFormError('');
  };

  const openModal = (type: 'RECEIPT' | 'PAYMENT', partyId?: string) => {
    setFormType(type); 
    resetForm(); 
    if (partyId) setSelectedPartyId(partyId);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedPartyId) { setFormError('Please select a party.'); return; }
    if (!amount || Number(amount) <= 0) { setFormError('Enter a valid amount.'); return; }

    setIsPending(true);
    try {
      const endpoint = formType === 'RECEIPT' ? '/payments/receive' : '/payments/pay';
      const payload = formType === 'RECEIPT'
        ? { customerId: selectedPartyId, amount: Number(amount), mode, referenceNo: reference || null }
        : { supplierId: selectedPartyId, amount: Number(amount), mode, referenceNo: reference || null };

      await api.post(endpoint, payload);

      setSuccessMsg(`${formType === 'RECEIPT' ? 'Payment received' : 'Payment made'} of ₹${parseFloat(amount).toLocaleString()} recorded!`);
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.message || 'Failed to record payment. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Treasury</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor cash flow pipelines and settle outstanding account balances.</p>
        </div>
        <div className="flex gap-4">
          <button 
            id="receive-payment-btn" 
            disabled={!hasPermission('PAYMENTS.CREATE')}
            onClick={() => {
              checkPermissionAndRun('PAYMENTS.CREATE', () => openModal('RECEIPT'));
            }}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 shadow-emerald-100"
          >
            <ArrowDownLeft size={18} />
            Receive Funds
          </button>
          <button 
            id="make-payment-btn" 
            disabled={!hasPermission('PAYMENTS.CREATE')}
            onClick={() => {
              checkPermissionAndRun('PAYMENTS.CREATE', () => openModal('PAYMENT'));
            }}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 shadow-indigo-100"
          >
            <ArrowUpRight size={18} />
            Make Payment
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold animate-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {/* Summary Cards */}
      {/* Analytics Brief */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pipeline Receivables</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">₹{totalRecievable.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm font-medium text-slate-500">{customers.filter(c => c.outstandingBalance > 0).length} client dues pending</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-600">Action Required</span>
          </div>
          <ArrowDownLeft className="absolute bottom-4 right-4 text-emerald-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={120} />
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Payables</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">₹{totalPayable.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm font-medium text-slate-500">{suppliers.filter(s => s.outstandingBalance > 0).length} supplier settlements</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-600">Outstanding</span>
          </div>
          <ArrowUpRight className="absolute bottom-4 right-4 text-rose-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={120} />
        </div>
      </div>

      {/* Ledger Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-50 p-2 gap-2 bg-slate-50/20">
          {(['RECEIPT', 'PAYMENT'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all rounded-xl cursor-pointer ${activeTab === tab ? 'text-indigo-600 bg-white shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'RECEIPT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              {tab === 'RECEIPT' ? 'Active Receivables' : 'Pending Payables'}
            </button>
          ))}
        </div>
        
        <div className="p-6 border-b border-slate-50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Identify ${activeTab === 'RECEIPT' ? 'customers' : 'suppliers'} in ledger...`}
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all bg-white" 
            />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredList.length === 0 ? (
            <div className="py-24 text-center">
              <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Zero Outstanding Balances</h3>
              <p className="text-sm text-slate-400 mt-1">All accounts are perfectly settled!</p>
            </div>
          ) : filteredList.map(party => (
            <div key={party.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <p className="font-bold text-slate-900 tracking-tight text-base">{party.partyName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${party.type === 'RECEIPT' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{party.type === 'RECEIPT' ? 'Client ID' : 'Supplier ID'}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className={`font-bold text-xl tracking-tight ${party.type === 'RECEIPT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{party.outstanding.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">unsettled</p>
                </div>
                <button 
                  disabled={!hasPermission('PAYMENTS.CREATE')}
                  onClick={() => {
                    checkPermissionAndRun('PAYMENTS.CREATE', () => openModal(party.type as 'RECEIPT' | 'PAYMENT', party.id));
                  }}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed ${party.type === 'RECEIPT' ? 'bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600 shadow-emerald-50' : 'bg-rose-600 hover:bg-rose-700 disabled:hover:bg-rose-600 shadow-rose-50'}`}
                >
                  {party.type === 'RECEIPT' ? 'Realize' : 'Settle'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Entry Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-2xl"
        title={
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formType === 'RECEIPT' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {formType === 'RECEIPT' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {formType === 'RECEIPT' ? 'Realize Inbound Funds' : 'Process Ledger Settlement'}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Manual reconciliation for non-automated payments.</p>
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
              form="paymentForm"
              disabled={isPending}
              className={`flex-1 py-3 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${formType === 'RECEIPT' ? 'bg-emerald-600 shadow-emerald-50' : 'bg-indigo-600 shadow-indigo-50'}`}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</>
              ) : (
                formType === 'RECEIPT' ? 'Confirm Receipt' : 'Confirm Disbursement'
              )}
            </button>
          </div>
        }
      >
        <form id="paymentForm" onSubmit={handleSubmit} className="p-8 space-y-10">
          <FormField label={formType === 'RECEIPT' ? 'Sender Customer' : 'Beneficiary Supplier'} required>
            <select 
              value={selectedPartyId} 
              onChange={e => setSelectedPartyId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none text-sm appearance-none"
            >
              <option value="">Identify party from records...</option>
              {(formType === 'RECEIPT' ? customers : suppliers).map(p => (
                <option key={p.id} value={p.id}>{p.name} — Outstanding: ₹{p.outstandingBalance.toLocaleString()}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Realization Amount (₹)" required>
            <Input 
              type="number" 
              min="0.01" 
              step="0.01" 
              placeholder="0.00"
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className={`font-bold text-2xl h-16 ${formType === 'RECEIPT' ? 'text-emerald-600 focus:ring-emerald-50' : 'text-indigo-600 focus:ring-indigo-50'}`}
            />
          </FormField>

          <FormField label="Transaction Instrument">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PAYMENT_MODES.map(m => (
                <button 
                  key={m} 
                  type="button" 
                  onClick={() => setMode(m)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${mode === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-white'}`}
                >
                  <div className={`${mode === m ? 'text-white' : 'text-slate-500'}`}>
                    {modeIcons[m]}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{m}</span>
                </button>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Internal Reference No.">
              <Input 
                type="text" 
                placeholder="UTR / Transaction ID"
                value={reference} 
                onChange={e => setReference(e.target.value)} 
              />
            </FormField>
            
            <FormField label="Ledger Remarks">
              <Input 
                type="text" 
                placeholder="Brief justification..."
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
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

export default Payments;
