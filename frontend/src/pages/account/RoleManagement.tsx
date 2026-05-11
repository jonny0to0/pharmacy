import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import { 
  Plus, Shield, Users, ChevronRight, ShieldCheck, 
  Trash2, Copy, Save, Loader2, AlertCircle, 
  Check, X, Monitor 
} from 'lucide-react';
import toast from 'react-hot-toast';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
// Assuming usePermission exists or providing a fallback
const usePermission = () => ({ hasPermission: (p: string) => true });

interface Permission {
  id: string;
  name: string;
  action: string;
}

interface Module {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: { permission: Permission }[];
}

const RoleManagement = () => {
  const { hasPermission } = usePermission();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<{ name: string; description: string; permissionIds: string[] }>({
    name: '',
    description: '',
    permissionIds: []
  });

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesRes, modulesRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions')
      ]);
      setRoles(rolesRes.data);
      setModules(modulesRes.data);
      
      if (rolesRes.data?.length > 0) {
        handleSelectRole(rolesRes.data[0]);
      }
    } catch (err) {
      toast.error("Failed to load permission matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissionIds: role.permissions.map(p => p.permission.id)
    });
  };

  const togglePermission = (permissionId: string) => {
    if (selectedRole?.isSystem) return;
    
    setRoleForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissionIds: roleForm.permissionIds
      });
      toast.success("Permissions updated successfully");
      await fetchInitialData();
    } catch (err) {
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleData.name) {
      toast.error("Role name is required");
      return;
    }
    
    try {
      setCreating(true);
      const res = await api.post('/roles', newRoleData);
      toast.success("New role created successfully");
      setShowAddRoleModal(false);
      setNewRoleData({ name: '', description: '' });
      await fetchInitialData();
      const allRoles = await api.get('/roles');
      const newRole = allRoles.data.find((r: any) => r.name === newRoleData.name.toUpperCase()) || res.data;
      handleSelectRole(newRole);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create role");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 animate-bounce transition-all">
          <Shield size={40} />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initialising Matrix...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700 bg-white">
      {/* Header */}
      <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Roles & Permissions</h1>
          <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest opacity-60">Staff Access Control Matrix</p>
        </div>
        <button 
          onClick={() => setShowAddRoleModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] text-xs font-black transition-all shadow-2xl shadow-blue-200 active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Custom Role
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Roles List */}
        <div className="w-96 border-r border-slate-100 bg-slate-50/20 p-8 space-y-6 overflow-y-auto">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 text-center underline decoration-slate-200 underline-offset-8">Deployment Profiles</h3>
          <div className="space-y-4">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full flex items-center justify-between p-5 rounded-[2.5rem] transition-all border-2 ${
                  selectedRole?.id === role.id
                    ? 'bg-white border-blue-600 shadow-2xl shadow-blue-100 text-blue-600 scale-[1.02]'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedRole?.id === role.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {role.isSystem ? <Shield size={20} /> : <Users size={20} />}
                  </div>
                  <div className="text-left">
                    <p className="text-base font-black truncate max-w-[160px] tracking-tight lowercase first-letter:uppercase">{role.name.toLowerCase()}</p>
                    {role.isSystem && <span className="text-[9px] font-black uppercase text-blue-400/60 tracking-widest">Internal Shield</span>}
                  </div>
                </div>
                {selectedRole?.id === role.id && <ChevronRight size={18} />}
              </button>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="flex-1 overflow-y-auto bg-white p-10">
          {selectedRole ? (
            <div className="space-y-12 max-w-6xl mx-auto pb-20">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between bg-slate-900 rounded-[3rem] p-10 text-white gap-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                <div className="flex items-center gap-8 relative z-10">
                   <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                     <ShieldCheck size={40} />
                   </div>
                   <div>
                     <h2 className="text-3xl font-black tracking-tighter">{selectedRole.name}</h2>
                     <p className="text-sm text-slate-400 font-bold max-w-lg mt-1 italic opacity-80">{selectedRole.description || 'System-governed profile for infrastructure operations.'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  {!selectedRole.isSystem && (
                    <button className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-[1.5rem] transition-all active:scale-95">
                      <Trash2 size={24} />
                    </button>
                  )}
                  <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 group">
                    <Copy size={18} className="group-hover:scale-110 transition-transform" /> Clone Matrix
                  </button>
                  <button 
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                    Authorize Matrix
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
              </div>

              {selectedRole.isSystem && (
                <div className="flex items-center gap-4 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] text-amber-700 shadow-sm border-dashed">
                   <AlertCircle size={24} className="shrink-0" />
                   <p className="text-[10px] font-black tracking-widest uppercase leading-loose">Protected Infrastructure: This role is vital for core system stability. Advanced permissions are read-only to prevent terminal failures.</p>
                </div>
              )}

              {/* Matrix Grid */}
              <div className="space-y-8">
                <div className="grid grid-cols-5 gap-6 px-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] pb-2 border-b border-slate-50">
                  <div className="col-span-1">Subsystem Area</div>
                  <div className="text-center">Ignite</div>
                  <div className="text-center">Observe</div>
                  <div className="text-center">Modify</div>
                  <div className="text-center">Purge</div>
                </div>

                <div className="space-y-6">
                  {modules.map(module => (
                    <div key={module.id} className="grid grid-cols-5 gap-6 items-center p-10 bg-slate-50/30 rounded-[3rem] border border-transparent hover:bg-white hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
                      <div className="col-span-1">
                        <span className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tighter">{module.name}</span>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{module.permissions.length} nodes active</p>
                        </div>
                      </div>
                      
                      {['CREATE', 'READ', 'UPDATE', 'DELETE'].map(action => {
                        const permission = module.permissions.find(p => p.action === action);
                        const isChecked = permission ? roleForm.permissionIds.includes(permission.id) : false;
                        
                        return (
                          <div key={action} className="flex justify-center">
                            {permission ? (
                              <button
                                onClick={() => togglePermission(permission.id)}
                                className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                                  isChecked 
                                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-400/40 rotate-[360deg]' 
                                    : 'bg-white border-2 border-slate-100 text-slate-200 hover:border-blue-200 hover:text-blue-400 hover:shadow-xl hover:shadow-blue-50/50'
                                }`}
                              >
                                {isChecked ? <Check size={24} strokeWidth={4} /> : <div className="w-2 h-2 bg-slate-100 rounded-full" />}
                              </button>
                            ) : (
                              <div className="w-14 h-14 flex items-center justify-center opacity-10">
                                <X size={20} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
              <ShieldCheck size={120} className="text-slate-300 animate-pulse" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em]">Sync a matrix profile</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddRoleModal}
        onClose={() => setShowAddRoleModal(false)}
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">New Custom Role</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Construct staff deployment profile</p>
          </div>
        }
        maxWidth="max-w-md"
        footer={
          <button 
            type="submit"
            form="roleForm"
            disabled={creating}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
            Authorize New Profile
          </button>
        }
      >
        <form id="roleForm" onSubmit={handleCreateRole} className="p-10 space-y-10">
          <FormField label="Role Terminal Identifier" required>
            <Input 
              required
              placeholder="e.g. Senior Inventory Clerk"
              className="font-black text-lg"
              value={newRoleData.name}
              onChange={(e) => setNewRoleData({...newRoleData, name: e.target.value.toUpperCase()})}
            />
          </FormField>
          
          <FormField label="Functional Scope Map">
            <Textarea 
              rows={3}
              placeholder="Describe the operational responsibilities..."
              value={newRoleData.description}
              onChange={(e) => setNewRoleData({...newRoleData, description: e.target.value})}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
