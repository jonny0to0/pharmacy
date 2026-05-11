import React, { useEffect, useState } from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { Settings, Save, Globe, ShieldCheck, Mail, Database, CreditCard, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface SystemSetting {
  key: string;
  value: string;
}

const PlatformSettings: React.FC = () => {
  const { data: settings, loading, error, fetchData, mutate } = useAdminData<SystemSetting[]>('/admin/settings');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});


  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach(s => map[s.key] = s.value);
      setLocalSettings(map);
    }
  }, [settings]);

  const handleSave = async () => {
    const payload = Object.entries(localSettings).map(([key, value]) => ({ key, value }));
    await mutate('put', '', { settings: payload });
  };

  const categories = [
    { id: 'general', label: 'General Info', icon: Globe, keys: ['PLATFORM_NAME', 'SUPPORT_EMAIL', 'MAINTENANCE_MODE'] },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck, keys: ['MAX_LOGIN_ATTEMPTS', 'SESSION_TIMEOUT', 'MFA_REQUIRED'] },
    { id: 'system', label: 'System Limits', icon: Database, keys: ['MAX_TENANTS', 'MAX_FILE_SIZE'] },
    { id: 'billing', label: 'Billing Config', icon: CreditCard, keys: ['CURRENCY_CODE', 'TAX_PERCENTAGE'] }
  ];

  return (
    <AdminPageLayout
      title="Platform Settings"
      subtitle="Global system parameters and operational toggles"
      tag="Config"
      icon={<Settings className="text-indigo-600" size={24} />}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchData()} disabled={loading} iconOnly className="h-12 w-12">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading} className="gap-2 px-8 shadow-xl shadow-indigo-100">
            <Save size={18} />
            Save Changes
          </Button>
        </div>
      }
    >
      {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}
      
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <header className="p-8 pb-4 bg-slate-50/50 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-slate-100">
                <cat.icon size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">{cat.label}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Category ID: {cat.id}</p>
              </div>
            </header>

            <div className="p-8 space-y-6 flex-1">
              {cat.keys.map(key => (
                <div key={key} className="space-y-2">
                   <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key.replace(/_/g, ' ')}</label>
                      {key === 'MAINTENANCE_MODE' && (
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${localSettings[key] === 'true' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {localSettings[key] === 'true' ? 'Warning' : 'Stable'}
                        </div>
                      )}
                   </div>
                   
                   {key === 'MAINTENANCE_MODE' || key === 'MFA_REQUIRED' ? (
                     <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <button 
                          onClick={() => setLocalSettings({...localSettings, [key]: localSettings[key] === 'true' ? 'false' : 'true'})}
                          className={`w-12 h-6 rounded-full relative transition-all duration-300 ${localSettings[key] === 'true' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${localSettings[key] === 'true' ? 'left-7' : 'left-1'}`} />
                        </button>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                           Currently {localSettings[key] === 'true' ? 'Enabled' : 'Disabled'}
                        </span>
                     </div>
                   ) : (
                     <input 
                       type="text" 
                       value={localSettings[key] || ''}
                       onChange={e => setLocalSettings({...localSettings, [key]: e.target.value})}
                       className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-bold placeholder:text-slate-200"
                       placeholder={`Enter ${key.toLowerCase()}`}
                     />
                   )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </AdminPageLayout>
  );
};

export default PlatformSettings;
