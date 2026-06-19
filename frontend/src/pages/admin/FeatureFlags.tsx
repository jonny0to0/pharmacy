import React, { useEffect, useState } from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { ToggleRight, Plus, Terminal, Activity, Tag, Save, Trash2, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  environment: string;
  rolloutPercentage: number;
  targetRole: string | null;
}

const AdminFeatureFlags: React.FC = () => {
  const { data: flags, loading, error, fetchData, mutate, setData } = useAdminData<FeatureFlag[]>('/admin/feature-flags');
  const [showModal, setShowModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<Partial<FeatureFlag> | null>(null);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlag) return;

    if (editingFlag.id) {
      const res = await mutate('patch', `/${editingFlag.id}`, editingFlag);
      if (res.success) {
        setShowModal(false);
        fetchData();
      }
    } else {
      const res = await mutate('post', '', editingFlag);
      if (res.success) {
        setShowModal(false);
        fetchData();
      }
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    const updated = { ...flag, enabled: !flag.enabled };
    const res = await mutate('patch', `/${flag.id}`, { enabled: updated.enabled });
    if (res.success) {
      setData(prev => prev?.map(f => f.id === flag.id ? updated : f) || undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this feature flag?')) {
      const res = await mutate('delete', `/${id}`);
      if (res.success) fetchData();
    }
  };

  return (
    <AdminPageLayout
      title="Feature Flags"
      subtitle="Control platform functionality and gradual rollouts"
      tag="Engineering"
      icon={<ToggleRight className="text-indigo-600" size={24} />}
      actions={
        <Button 
          variant="primary" 
          className="gap-2 shadow-lg shadow-indigo-200"
          onClick={() => { setEditingFlag({ environment: 'production', rolloutPercentage: 100 }); setShowModal(true); }}
        >
          <Plus size={18} />
          Create Flag
        </Button>
      }
    >
      {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}
      
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !flags ? (
           Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-3xl animate-pulse" />
           ))
        ) : flags?.map(flag => (
          <div key={flag.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    <code className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {flag.key}
                    </code>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{flag.name}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <Badge variant={flag.environment === 'production' ? 'info' : 'neutral'} className="text-[9px]">
                      {flag.environment}
                   </Badge>
                   <button 
                     onClick={() => handleToggle(flag)}
                     className={`w-12 h-6 rounded-full relative transition-all duration-500 ${flag.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm ${flag.enabled ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                {flag.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap gap-2">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-600 border border-slate-100">
                    <Activity size={12} className="text-indigo-500" />
                    {flag.rolloutPercentage}% ROLLING
                 </div>
                 {flag.targetRole && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-[10px] font-black text-amber-700 border border-amber-100">
                      <Tag size={12} className="text-amber-500" />
                      TARGET: {flag.targetRole}
                    </div>
                 )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-50 transition-opacity">
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="flex-1 bg-slate-50 text-[10px] font-black uppercase tracking-widest"
                 onClick={() => { setEditingFlag(flag); setShowModal(true); }}
                >
                  Edit
               </Button>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="text-rose-500 hover:text-rose-600 bg-rose-50 border-rose-100"
                 onClick={() => handleDelete(flag.id)}
                 iconOnly={<Trash2 size={14} />}
                />
            </div>
          </div>
        ))}
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-x-0 inset-y-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <header className="p-8 pb-0 flex justify-between items-start">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingFlag?.id ? 'Edit Flag' : 'New Feature Flag'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium font-sans">Configure platform feature visibility</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors">
                  <X className="text-slate-400" />
               </button>
            </header>

            <form onSubmit={handleSave} className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Flag Key (Unique)</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingFlag?.id}
                    value={editingFlag?.key || ''}
                    onChange={e => setEditingFlag({...editingFlag, key: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                    placeholder="E.G. BETA_MODULE_V2"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-mono text-sm font-bold placeholder:text-slate-300 disabled:opacity-50"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Friendly Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingFlag?.name || ''}
                    onChange={e => setEditingFlag({...editingFlag, name: e.target.value})}
                    placeholder="Display Name"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-sans text-sm font-bold"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Environment</label>
                    <select 
                      value={editingFlag?.environment || 'production'}
                      onChange={e => setEditingFlag({...editingFlag, environment: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-bold"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rollout %</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={editingFlag?.rolloutPercentage || 0}
                      onChange={e => setEditingFlag({...editingFlag, rolloutPercentage: parseInt(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-bold"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Audience (Role)</label>
                  <select 
                    value={editingFlag?.targetRole || ''}
                    onChange={e => setEditingFlag({...editingFlag, targetRole: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-bold"
                  >
                    <option value="">All Roles</option>
                    <option value="SUPER_ADMIN">System Admins Only</option>
                    <option value="BUSINESS_ADMIN">Business Admins Only</option>
                    <option value="PHARMACIST">Pharmacists Only</option>
                    <option value="CASHIER">Cashiers Only</option>
                  </select>
               </div>

               <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" className="px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                    <Save size={16} className="mr-2" />
                    Save Flag
                  </Button>
               </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminFeatureFlags;
