import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, Percent, Wallet, Save, Loader2, Navigation, Building2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';

const BillingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    invoicePrefix: 'INV-',
    gstNumber: '',
    autoGstCalculation: true,
    paymentMethods: ['CASH', 'UPI'],
    defaultCurrency: 'INR'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/settings/full-profile');
        if (res.data) {
          const tax = res.data.taxSettings || {};
          setFormData({
            invoicePrefix: tax.invoicePrefix || 'INV-',
            gstNumber: tax.gstNumber || '',
            autoGstCalculation: tax.autoGstCalculation ?? true,
            paymentMethods: tax.paymentMethods ? tax.paymentMethods.split(',') : ['CASH', 'UPI'],
            defaultCurrency: tax.defaultCurrency || 'INR'
          });
        }
      } catch (err) {
        toast.error('Failed to load billing settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const togglePaymentMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/tax-billing', {
        ...formData,
        paymentMethods: formData.paymentMethods.join(',')
      });
      toast.success('Billing settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">
      <Wallet className="w-12 h-12 mb-4 opacity-20" />
      Syncing Ledgers...
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-6xl space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Billing & Financials</h1>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Tax Logic & Transaction Infrastructure</p>
      </div>

      <form onSubmit={handleSave} className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Invoice Formatting */}
          <div className="bg-white border border-slate-100 p-12 rounded-[3.5rem] space-y-10 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl shadow-inner flex items-center justify-center text-blue-600">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Invoice System</h3>
            </div>
            
            <FormField label="Dynamic Invoice Prefix">
              <Input 
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({...formData, invoicePrefix: e.target.value.toUpperCase()})}
                placeholder="e.g. INV-"
                className="font-black text-lg tracking-widest"
              />
              <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest text-center italic">
                Sequence Format: <span className="text-blue-600 underline underline-offset-4">{formData.invoicePrefix}2026-0001</span>
              </p>
            </FormField>
          </div>

          {/* Tax Configuration */}
          <div className="bg-white border border-slate-100 p-12 rounded-[3.5rem] space-y-10 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl shadow-inner flex items-center justify-center text-blue-600">
                <Percent size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Tax Identification</h3>
            </div>
            
            <div className="space-y-8">
              <FormField label="Authorized GSTIN Number">
                <Input 
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                  placeholder="15-digit Alpha-numeric"
                  maxLength={15}
                  className="font-black tracking-widest text-lg"
                />
              </FormField>
              
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-calculation Logic</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Real-time GST application</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, autoGstCalculation: !formData.autoGstCalculation})}
                  className={`w-14 h-8 rounded-full transition-all relative ${formData.autoGstCalculation ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${formData.autoGstCalculation ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted Payment Methods */}
        <FormSection title="Transaction Methods Infrastructure">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            {['CASH', 'UPI', 'CARD', 'CREDIT', 'BANK_TRANSFER'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => togglePaymentMethod(method)}
                className={`p-10 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 active:scale-95 ${
                  formData.paymentMethods.includes(method) 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 scale-105' 
                  : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:border-slate-100 hover:text-slate-600 shadow-sm'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                  formData.paymentMethods.includes(method) ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300'
                }`}>
                  {method === 'CASH' && <Wallet size={24} />}
                  {method === 'UPI' && <Navigation size={24} />}
                  {method === 'CARD' && <CreditCard size={24} />}
                  {method === 'CREDIT' && <FileText size={24} />}
                  {method === 'BANK_TRANSFER' && <Building2 size={24} />}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  formData.paymentMethods.includes(method) ? 'text-white' : 'text-slate-400'
                }`}>
                  {method.replace('_', ' ')}
                </span>
                {formData.paymentMethods.includes(method) && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </FormSection>

        <div className="flex justify-end pt-10 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={saving}
            className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 transition-all flex items-center gap-3 group active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} className="group-hover:scale-110 transition-transform" />}
            Commit Financial Identity
          </button>
        </div>
      </form>
    </div>
  );
};

export default BillingSettings;
