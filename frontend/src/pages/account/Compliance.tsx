import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Upload, CheckCircle2, AlertCircle, Clock, CreditCard } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';

const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    VERIFIED: { icon: CheckCircle2, text: 'Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50' },
    PENDING: { icon: Clock, text: 'Pending Analysis', color: 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50' },
    REJECTED: { icon: AlertCircle, text: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm shadow-rose-50' }
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.15em] ${config.color}`}>
      <Icon size={14} className="animate-in fade-in zoom-in duration-700" />
      {config.text}
    </div>
  );
};

const Compliance = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('SETTINGS.UPDATE');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const res = await api.get('/settings/full-profile');
        setData(res.data);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to connect to compliance service';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/profile', {
        pan: (e.target as any).pan.value,
        drugLicense: (e.target as any).drugLicense.value,
        fssai: (e.target as any).fssai.value,
      });
      toast.success('Compliance details submitted for verification');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-6 animate-pulse">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
          <ShieldCheck size={40} className="animate-spin duration-[3000ms]" />
        </div>
        <p className="text-slate-400 font-black text-sm uppercase tracking-[0.3em]">Auditing Compliance data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <div className="p-12 bg-white border-2 border-rose-100 rounded-[3.5rem] text-center space-y-8 shadow-2xl shadow-rose-100/50">
          <div className="w-24 h-24 bg-rose-50 rounded-[2rem] shadow-inner mx-auto flex items-center justify-center text-rose-500">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Handshake Failure</h2>
            <p className="text-sm text-slate-500 font-black uppercase tracking-widest opacity-60 px-10">{error || 'Terminal communication error.'}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Retry Connection Pulse
          </button>
        </div>
      </div>
    );
  }

  const profile = data?.profile || {};
  const isPharmacy = data?.businessType === 'PHARMACY';

  return (
    <div className="p-4 md:p-10 max-w-6xl space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Compliance & Legal</h1>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70 mt-1">Regulatory Authorization & Identity Guard</p>
        </div>
        <div className="bg-emerald-50/50 p-6 rounded-[2rem] border-2 border-emerald-100/50 hidden md:block shadow-inner">
          <div className="flex items-center gap-4 text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em]">
            <CheckCircle2 size={24} className="text-emerald-500" /> Integrity Quotient: Optimal
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Pan Number */}
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] space-y-8 shadow-2xl shadow-slate-200/20 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner group-hover:text-blue-600 transition-colors">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Income Tax (PAN)</h3>
              </div>
              <StatusBadge status={profile.panStatus || 'PENDING'} />
            </div>
            
            <FormField label="10-Digit Alpha-numeric Identifier">
              <Input 
                name="pan"
                defaultValue={profile.pan || ''}
                placeholder="ABCDE1234F"
                className="font-black text-xl tracking-[0.3em] uppercase"
                disabled={!canEdit}
              />
            </FormField>

            <button disabled={!canEdit} type="button" className={`w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${canEdit ? 'border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 active:scale-95' : 'border-slate-100 text-slate-300 opacity-50 cursor-not-allowed'}`}>
              <Upload size={18} /> Sync Document Metadata
            </button>
          </div>

          {/* Drug License */}
          <div className={`p-10 bg-white border ${isPharmacy ? 'border-blue-600 ring-[12px] ring-blue-50/50 shadow-blue-100' : 'border-slate-100'} rounded-[3rem] space-y-8 shadow-2xl transition-all duration-500 group`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${isPharmacy ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'} rounded-2xl flex items-center justify-center shadow-inner`}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Drug License</h3>
                  {isPharmacy && <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1 animate-pulse">Mandatory Critical</p>}
                </div>
              </div>
              <StatusBadge status={profile.drugLicenseStatus || 'PENDING'} />
            </div>
            
            <FormField label="Regulatory License Identifier">
              <Input 
                name="drugLicense"
                defaultValue={profile.drugLicense || ''}
                placeholder="20-B/21-B Format"
                className="font-black text-lg"
                disabled={!canEdit}
              />
            </FormField>

            <button disabled={!canEdit} type="button" className={`w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${canEdit ? 'border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-xl hover:shadow-blue-200 active:scale-95' : 'border-slate-100 text-slate-300 opacity-50 cursor-not-allowed'}`}>
              <Upload size={18} /> Upload Authorization (PDF)
            </button>
          </div>

          {/* GST info */}
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] space-y-8 shadow-2xl shadow-slate-200/20 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner group-hover:text-blue-600 transition-colors">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">GST Registration</h3>
              </div>
              <StatusBadge status={profile.gstStatus || 'VERIFIED'} />
            </div>
            <div className="text-lg font-black text-slate-400 bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-100 text-center tracking-[0.2em] opacity-60">
              {data?.taxSettings?.gstNumber || 'GST LOGIC NOT ENABLED'}
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] text-center italic">Controlled via Financials Terminal</p>
          </div>

          {/* FSSAI */}
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] space-y-8 shadow-2xl shadow-slate-200/20 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner group-hover:text-blue-600 transition-colors">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">FSSAI License</h3>
              </div>
              <StatusBadge status={profile.fssaiStatus || 'PENDING'} />
            </div>
            
            <FormField label="Food Safety Authority ID">
              <Input 
                name="fssai"
                defaultValue={profile.fssai || ''}
                placeholder="Enter 14-digit identifier"
                className="font-black text-lg tracking-widest"
                disabled={!canEdit}
              />
            </FormField>

            <button disabled={!canEdit} type="button" className={`w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${canEdit ? 'border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 active:scale-95' : 'border-slate-100 text-slate-300 opacity-50 cursor-not-allowed'}`}>
              <Upload size={18} /> Commit Documentation
            </button>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={saving}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? <Clock size={22} className="animate-spin" /> : <ShieldCheck size={22} />}
              {saving ? 'Committing Identities...' : 'Authorize Submission'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Compliance;
