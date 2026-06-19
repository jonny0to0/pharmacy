import React, { useState, useEffect } from 'react';
import { LayoutGrid, Activity, Save, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { usePermission } from '../../hooks/usePermission';

const Modules = () => {
  const { hasPermission, checkPermissionAndRun } = usePermission();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enableMedicalInfo, setEnableMedicalInfo] = useState(false);
  const [walkInBehavior, setWalkInBehavior] = useState('OPTION_A');
  const [allowPharmacistRegister, setAllowPharmacistRegister] = useState(false);
  const [restrictedMenuBehavior, setRestrictedMenuBehavior] = useState('HIDE');

  useEffect(() => {
    fetchModuleSettings();
  }, []);

  const fetchModuleSettings = async () => {
    try {
      const res = await api.get('/settings/full-profile');
      if (res.data.settings) {
        setEnableMedicalInfo(!!res.data.settings.enableMedicalInfo);
        setWalkInBehavior(res.data.settings.walkInCustomerBehavior || 'OPTION_A');
        setAllowPharmacistRegister(!!res.data.settings.allowPharmacistCustomerCreation);
        setRestrictedMenuBehavior(res.data.settings.restrictedMenuBehavior || 'HIDE');
      }
    } catch (err) {
      toast.error('Failed to load module settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    checkPermissionAndRun('SETTINGS_BUSINESS.UPDATE', async () => {
      setSaving(true);
      try {
        await api.post('/settings/modules', {
          enableMedicalInfo,
          walkInCustomerBehavior: walkInBehavior,
          allowPharmacistCustomerCreation: allowPharmacistRegister,
          restrictedMenuBehavior
        });
        toast.success('Module settings updated successfully');
      } catch (err) {
        toast.error('Failed to update module settings');
      } finally {
        setSaving(false);
      }
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Contextualizing modules...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Modules</h1>
          </div>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            Enhance your platform with specialized functional extensions tailored for your workflow.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || !hasPermission('SETTINGS_BUSINESS.UPDATE')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-70"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm text-blue-800 flex gap-4">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-bold mb-1 italic">Intelligence Toggle</p>
            <p className="font-medium opacity-90 leading-relaxed">
              Enabling modules adds new interfaces and logic to your dashboard. All data remains encrypted and safe even when modules are toggled off.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 bg-white border border-slate-200 rounded-3xl group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
            <Activity size={32} />
          </div>
          
          <div className="flex-1 space-y-2 relative">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-extrabold text-slate-900">Drug Medical Information</h3>
              {enableMedicalInfo && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full">Active</span>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Decision Support</p>
            <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
              Integrates clinical intelligence into your POS and Inventory. Manage uses, side effects, contraindications, and critical warnings for every drug in your database.
            </p>
          </div>

          <button 
            type="button" 
            onClick={() => setEnableMedicalInfo(!enableMedicalInfo)}
            className={`relative w-16 h-8 rounded-full transition-all duration-500 cursor-pointer shadow-inner ${enableMedicalInfo ? 'bg-rose-500 ring-4 ring-rose-500/10' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white shadow-lg transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${enableMedicalInfo ? 'translate-x-9' : 'translate-x-1.5'}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 bg-white border border-slate-200 rounded-3xl group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
            <Activity size={32} />
          </div>
          
          <div className="flex-1 space-y-2 relative">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-extrabold text-slate-900">Walk-in Customer Behavior</h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Panel Selection Mechanism</p>
            <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
              Configure POS behavior: Option A opens the selection list to browse or add custom walk-in profiles. Option B immediately attaches a generic predefined walk-in customer.
            </p>
          </div>

          <select 
            value={walkInBehavior} 
            onChange={e => setWalkInBehavior(e.target.value)}
            className="w-full sm:w-64 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 text-sm font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="OPTION_A">Option A: Customer Selection Modal</option>
            <option value="OPTION_B">Option B: Auto-attach Predefined Customer</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 bg-white border border-slate-200 rounded-3xl group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-655 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500" style={{ color: '#4f46e5' }}>
            <Activity size={32} />
          </div>
          
          <div className="flex-1 space-y-2 relative">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-extrabold text-slate-900">Restricted Sidebar Menus</h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">UI/UX Accessibility Control</p>
            <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
              Configure visibility of pages/menus the user does not have permission to access. Choose whether to hide them completely from the sidebar or keep them visible but grayed out and disabled.
            </p>
          </div>

          <select 
            value={restrictedMenuBehavior} 
            onChange={e => setRestrictedMenuBehavior(e.target.value)}
            className="w-full sm:w-64 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 text-sm font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="HIDE">Option A: Hide completely</option>
            <option value="DISABLE">Option B: Show as disabled</option>
          </select>
        </div>
      </div>

      <div className="pt-10">
        <div className="p-8 bg-slate-50 border border-slate-100 border-dashed rounded-3xl text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Future Intelligence</p>
          <p className="text-xs font-bold text-slate-400">More modules are under development. Stay tuned for AI Forecasting and CRM integration.</p>
        </div>
      </div>
    </div>
  );
};

export default Modules;
