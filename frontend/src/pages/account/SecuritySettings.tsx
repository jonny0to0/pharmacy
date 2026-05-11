import React, { useState } from 'react';
import { Lock, ShieldCheck, Smartphone, LogOut, Save, Loader2, Key, History, Monitor, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';

const SecuritySettings = () => {
  const [saving, setSaving] = useState(false);
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("Passwords don't match");
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', passData);
      toast.success('Password changed successfully');
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Security & Access</h1>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Infrastructure Protection & Credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Password Change */}
        <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <Key size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Rotate Credentials</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update your system access password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-8">
            <FormField label="Current Authentication Key" required>
              <Input 
                required
                type="password"
                placeholder="••••••••"
                value={passData.oldPassword}
                onChange={(e) => setPassData({...passData, oldPassword: e.target.value})}
              />
            </FormField>
            
            <FormField label="New Security Password" required>
              <Input 
                required
                type="password"
                placeholder="Minimum 8 characters"
                value={passData.newPassword}
                onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
              />
            </FormField>

            <FormField label="Confirm Security Logic" required>
              <Input 
                required
                type="password"
                placeholder="Repeat new password"
                value={passData.confirmPassword}
                onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
              />
            </FormField>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-5 bg-slate-900 border border-slate-800 hover:bg-black text-white rounded-[2rem] font-black shadow-2xl shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-3 mt-6 disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
              Update Authentication Key
            </button>
          </form>
        </div>

        {/* 2FA & Activity */}
        <div className="space-y-8">
          {/* 2FA Card */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/30 transition-transform hover:-translate-y-1 duration-500">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Two-Step Verification</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Advanced Account Shield</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-10 font-bold leading-relaxed">
                Add a critical layer of security. We will challenge any login attempt with a dynamic OTP required from your authorized device.
              </p>
              <button className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                Enable Hardware Shield
              </button>
            </div>
            <Smartphone className="absolute -bottom-10 -right-10 w-56 h-56 text-white/5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
          </div>

          {/* Login Activity */}
          <div className="bg-white border border-slate-100 rounded-[3.5rem] p-12 space-y-10 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                <History size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Active Sessions</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit trail for authentication</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between group p-6 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all shadow-sm">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 tracking-tight">Windows 11 · Chrome</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Delhi, IN · Current Terminal</p>
                  </div>
                </div>
                <button className="px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95">
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
