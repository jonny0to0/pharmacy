import React, { useState } from 'react';
import { Bell, Smartphone, Mail, AlertTriangle, CheckCircle2, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState({
    sms: true,
    email: true,
    stock: true,
    expiry: true,
    dailySummary: false,
    marketing: false
  });

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Preferences updated');
    }, 1000);
  };

  const toggles = [
    { key: 'sms', label: 'SMS Alerts', desc: 'Direct mobile transmission for critical events', icon: Smartphone, color: 'text-blue-500' },
    { key: 'email', label: 'Email Reports', desc: 'Periodic audits and transaction journals', icon: Mail, color: 'text-emerald-500' },
    { key: 'stock', label: 'Depletion Alerts', desc: 'Real-time inventory threshold warnings', icon: Bell, color: 'text-amber-500' },
    { key: 'expiry', label: 'Stability Guard', desc: 'Pre-expiry notifications (90-day window)', icon: AlertTriangle, color: 'text-rose-500' },
    { key: 'dailySummary', label: 'Terminal Summary', desc: 'Comprehensive sales & performance analytics', icon: CheckCircle2, color: 'text-indigo-500' },
  ];

  return (
    <div className="p-4 md:p-10 max-w-5xl space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Communication Nodes</h1>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Notification Matrix & Transmission Logic</p>
      </div>

      <div className="space-y-6">
        {toggles.map((item) => (
          <div 
            key={item.key} 
            className="flex items-center justify-between p-8 bg-white hover:bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-[2.5rem] transition-all duration-500 group shadow-sm hover:shadow-2xl hover:shadow-slate-200/50"
          >
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center ${item.color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                <item.icon size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.label}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60 italic">{item.desc}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setAlerts((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }))}
              className={`w-16 h-9 rounded-full transition-all duration-500 relative ${alerts[item.key as keyof typeof alerts] ? 'bg-blue-600 shadow-xl shadow-blue-200' : 'bg-slate-200 shadow-inner'}`}
            >
              <div className={`absolute top-1.5 w-6 h-6 rounded-full bg-white shadow-2xl transition-all duration-500 ${alerts[item.key as keyof typeof alerts] ? 'left-8 scale-110' : 'left-1.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-10 border-t border-slate-100">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Synchronize Toggles
        </button>
      </div>
    </div>
  );
};

export default Notifications;
