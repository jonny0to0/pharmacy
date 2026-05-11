import React, { useState } from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { Megaphone, Send, Target, Eye, Bell, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import AdminErrorBox from '../../components/admin/AdminErrorBox';
import Badge from '../../components/ui/Badge';

const AdminNotifications: React.FC = () => {
  const { error, loading, mutate } = useAdminData<any>('/admin/notifications');
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    targetRole: '',
    actionUrl: ''
  });

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate('post', '/broadcast', form);
    if (res.success) {
      setForm({ title: '', message: '', type: 'SYSTEM', targetRole: '', actionUrl: '' });
    }
  };

  return (
    <AdminPageLayout
      title="Broadcast Console"
      subtitle="Send global alerts and system announcements"
      tag="Comms"
      icon={<Megaphone className="text-indigo-600" size={24} />}
    >
      {error && <AdminErrorBox message={error} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Form Section */}
        <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
           <header className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Compose Announcement</h3>
              <p className="text-sm text-slate-500 font-medium">Broadcasted messages appear in the user's notification pane immediately.</p>
           </header>

           <form onSubmit={handleBroadcast} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Title</label>
                 <input 
                   type="text" 
                   required
                   value={form.title}
                   onChange={e => setForm({...form, title: e.target.value})}
                   placeholder="e.g. Scheduled System Maintenance"
                   className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-800"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Content Body</label>
                 <textarea 
                   required
                   rows={4}
                   value={form.message}
                   onChange={e => setForm({...form, message: e.target.value})}
                   placeholder="Type your message here..."
                   className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium text-slate-700 h-32 resize-none"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority Type</label>
                    <select 
                      value={form.type}
                      onChange={e => setForm({...form, type: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    >
                       <option value="SYSTEM">System Info</option>
                       <option value="ALERT">Critical Alert</option>
                       <option value="UPDATE">Product Update</option>
                       <option value="OFFER">Announcement</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Role</label>
                    <select 
                      value={form.targetRole}
                      onChange={e => setForm({...form, targetRole: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    >
                       <option value="">All Platform Users</option>
                       <option value="BUSINESS_ADMIN">Business Admins Only</option>
                       <option value="CASHIER">Cashiers Only</option>
                       <option value="PHARMACIST">Pharmacists Only</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CTA Action URL (Optional)</label>
                 <input 
                   type="text" 
                   value={form.actionUrl}
                   onChange={e => setForm({...form, actionUrl: e.target.value})}
                   placeholder="https://medisynex.com/release-notes"
                   className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-sans text-sm text-slate-600"
                 />
              </div>

              <div className="pt-4">
                 <Button 
                   variant="primary" 
                   type="submit" 
                   disabled={loading}
                   className="w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 gap-3"
                 >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={20} />}
                    Dispatch Global Broadcast
                 </Button>
              </div>
           </form>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
              <header className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Eye size={18} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Preview</span>
                 </div>
                 <Badge variant="neutral" className="bg-white">Target: {form.targetRole || 'Everyone'}</Badge>
              </header>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 animate-in fade-in duration-300">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-xl ${form.type === 'ALERT' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                          {form.type === 'ALERT' ? <ShieldAlert size={20} /> : <Bell size={20} />}
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 leading-none">{form.title || 'Notification Title'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Simulated 1m ago</p>
                       </div>
                    </div>
                 </div>
                 <p className="text-sm text-slate-600 font-medium">
                    {form.message || 'The content of your broadcast will appear here in the user notification panel...'}
                 </p>
                 {form.actionUrl && (
                   <div className="pt-2">
                      <Button variant="outline" size="sm" className="bg-slate-50 text-[9px] font-black uppercase tracking-widest h-8 px-4">
                         View Details
                      </Button>
                   </div>
                 )}
              </div>

              <div className="bg-indigo-600 p-8 rounded-[2rem] text-indigo-50 space-y-4">
                 <div className="p-3 bg-white/10 rounded-2xl w-fit">
                    <Info size={24} />
                 </div>
                 <div className="space-y-1">
                    <h4 className="font-black text-lg tracking-tight uppercase">Security Protocol</h4>
                    <p className="text-xs font-medium text-indigo-100">Every broadcast is logged in the system audit trail and cannot be retracted once dispatched. Ensure content is accurate.</p>
                 </div>
                 <div className="flex items-center gap-2 pt-2">
                    <CheckCircle2 size={16} className="text-indigo-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Signed by Super Admin</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminNotifications;
