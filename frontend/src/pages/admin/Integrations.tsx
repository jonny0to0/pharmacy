import React, { useEffect, useState } from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { Blocks, Plus, Globe, Key, Settings, Trash2, RefreshCw, X, Save, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  apiKey: string | null;
  config: any;
}

const AdminIntegrations: React.FC = () => {
  const { data: integrations, loading, error, fetchData, mutate } = useAdminData<Integration[]>('/admin/integrations');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Integration> | null>(null);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.id) {
      const res = await mutate('patch', `/${editingItem.id}`, editingItem);
      if (res.success) { setShowModal(false); fetchData(); }
    } else {
      const res = await mutate('post', '', editingItem);
      if (res.success) { setShowModal(false); fetchData(); }
    }
  };

  const categories = [
    { type: 'payment', label: 'Payment Gateways', icon: '💳' },
    { type: 'sms', label: 'SMS Providers', icon: '📱' },
    { type: 'email', label: 'Mail Services', icon: '✉️' },
    { type: 'storage', label: 'Object Storage', icon: '☁️' }
  ];

  return (
    <AdminPageLayout
      title="Integrations Hub"
      subtitle="Manage third-party connections and API keys"
      tag="Marketplace"
      icon={<Blocks className="text-indigo-600" size={24} />}
      actions={
        <Button
          variant="primary"
          onClick={() => { setEditingItem({ type: 'payment', enabled: false }); setShowModal(true); }}
          className="gap-2 shadow-xl shadow-indigo-100"
        >
          <Plus size={18} />
          Add Integration
        </Button>
      }
    >
      {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}

      {!error && (
        <div className="space-y-12">
          {categories.map((cat) => {
            const items = integrations?.filter(i => i.type === cat.type) || [];
            return (
              <section key={cat.type} className="space-y-6">
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{cat.label}</h2>
                  <Badge variant="neutral" className="bg-slate-100 text-slate-500">{items.length} Configured</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.length === 0 ? (
                    <div className="col-span-full py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-3">
                      <p className="text-sm font-bold text-slate-400">No {cat.label} configured yet.</p>
                      <Button variant="outline" size="sm" onClick={() => { setEditingItem({ type: cat.type, enabled: false }); setShowModal(true); }}>
                        Get Started
                      </Button>
                    </div>
                  ) : items.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <Globe size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <button
                          onClick={async () => {
                            const res = await mutate('patch', `/${item.id}`, { enabled: !item.enabled });
                            if (res.success) fetchData();
                          }}
                          className={`w-12 h-6 rounded-full relative transition-all duration-500 ${item.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${item.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 uppercase">{item.name}</h3>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <Key size={12} />
                          <span>Key Masked: <code className="text-indigo-600">{item.apiKey || 'UNSET'}</code></span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-[9px] font-black uppercase tracking-widest bg-slate-50"
                            onClick={() => { setEditingItem(item); setShowModal(true); }}
                          >
                            <Settings size={12} className="mr-1.5" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm" className="w-10 flex items-center justify-center bg-rose-50 text-rose-600 border-rose-100" iconOnly={<Trash2 size={14} />} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-x-0 inset-y-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <header className="p-8 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingItem?.id ? 'Configure Connection' : 'Register Integration'}
                </h3>
                <p className="text-sm text-slate-500 font-medium">Securely store and manage third-party API credentials</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors">
                <X className="text-slate-400" />
              </button>
            </header>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Provider Name</label>
                <input
                  type="text"
                  required
                  value={editingItem?.name || ''}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Razorpay Main Gateway"
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type</label>
                  <select
                    value={editingItem?.type || ''}
                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-bold"
                  >
                    <option value="payment">Payment</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Initial Status</label>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, enabled: !editingItem?.enabled })}
                    className={`w-full py-3.5 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${editingItem?.enabled ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {editingItem?.enabled ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={editingItem?.apiKey || ''}
                    onChange={e => setEditingItem({ ...editingItem, apiKey: e.target.value })}
                    placeholder={editingItem?.id ? "••••••••••••••••" : "sk_live_..."}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-mono text-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/50 backdrop-blur rounded-lg border border-slate-100 text-[8px] font-black text-indigo-600 uppercase">Secure</div>
                </div>
                <p className="text-[9px] text-slate-400 ml-1 font-medium italic">Keys are encrypted at rest using AES-256-GCM. Never shared in raw format.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                  <ShieldCheck size={16} className="mr-2" />
                  Save Integration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </AdminPageLayout>
   );
};

export default AdminIntegrations;
