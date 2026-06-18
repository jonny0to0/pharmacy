import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import { 
  Plus, Shield, Users, ChevronRight, ShieldCheck, 
  Trash2, Save, Loader2, AlertCircle, Check, X, Info, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { usePermission } from '../../hooks/usePermission';

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
  const [deleting, setDeleting] = useState(false);
  
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editRoleData, setEditRoleData] = useState({ name: '', description: '' });
  const [updatingRole, setUpdatingRole] = useState(false);

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
        // Preserving the selected role if reloading
        const currentSelected = selectedRole 
          ? rolesRes.data.find((r: Role) => r.id === selectedRole.id) 
          : null;
        handleSelectRole(currentSelected || rolesRes.data[0]);
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
    setEditRoleData({
      name: role.name,
      description: role.description || ''
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
      
      // Auto select the new role
      if (res.data) {
        handleSelectRole(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create role");
    } finally {
      setCreating(false);
    }
  };

  const handleEditRoleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!editRoleData.name) {
      toast.error("Role name is required");
      return;
    }

    try {
      setUpdatingRole(true);
      const res = await api.put(`/roles/${selectedRole.id}`, editRoleData);
      toast.success("Role details updated successfully");
      setShowEditRoleModal(false);
      
      // Update data and refresh selection
      await fetchInitialData();
      
      const updatedRole = {
        ...selectedRole,
        name: res.data.name,
        description: res.data.description
      };
      setSelectedRole(updatedRole);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update role details");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole || selectedRole.isSystem) return;
    if (!window.confirm(`Are you sure you want to delete the custom role "${selectedRole.name}"?`)) return;

    try {
      setDeleting(true);
      await api.delete(`/roles/${selectedRole.id}`);
      toast.success("Role deleted successfully");
      setSelectedRole(null);
      await fetchInitialData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Permission Matrix...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500 w-8 h-1 rounded-full"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Access Control Control-room</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Roles & Permissions</h1>
          <p className="text-slate-500 text-xs font-medium">Configure functional access profiles for your team members.</p>
        </div>
        <button 
          onClick={() => setShowAddRoleModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-100 active:scale-95 group self-start sm:self-auto"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Custom Role
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Mobile Role Switcher (Hidden on large screens) */}
        <div className="w-full lg:hidden flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected Profile</label>
          <select
            value={selectedRole?.id || ''}
            onChange={(e) => {
              const role = roles.find(r => r.id === e.target.value);
              if (role) handleSelectRole(role);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name} {role.isSystem ? '(System)' : '(Custom)'}
              </option>
            ))}
          </select>
        </div>

        {/* Roles List Sidebar (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col w-80 bg-white border border-slate-150 rounded-2xl p-6 space-y-4 shrink-0 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Access Profiles</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-50/50 border-blue-200 text-blue-700 shadow-sm'
                    : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedRole?.id === role.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {role.isSystem ? <Shield size={16} /> : <Users size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold truncate max-w-[160px] tracking-tight">{role.name}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                      {role.isSystem ? 'System Role' : 'Custom'}
                    </span>
                  </div>
                </div>
                {selectedRole?.id === role.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Permission Matrix Detail Panel */}
        <div className="flex-1 w-full bg-white border border-slate-150 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {selectedRole ? (
            <div className="space-y-6">
              {/* Role Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 rounded-2xl p-6 md:p-8 text-white gap-4 relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{selectedRole.name}</h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl font-medium leading-relaxed">
                      {selectedRole.description || 'Custom administrative access configuration for this business tenant.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative z-10 shrink-0 self-end md:self-auto">
                  {!selectedRole.isSystem && (
                    <>
                      <button 
                        onClick={() => {
                          setEditRoleData({
                            name: selectedRole.name,
                            description: selectedRole.description || ''
                          });
                          setShowEditRoleModal(true);
                        }}
                        className="p-3 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all active:scale-95"
                        title="Edit Role Details"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button 
                        onClick={handleDeleteRole}
                        disabled={deleting}
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95"
                        title="Delete Custom Role"
                      >
                        {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    Save Permissions
                  </button>
                </div>
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl -mr-16 -mt-16 rounded-full" />
              </div>

              {selectedRole.isSystem && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs font-medium">
                  <AlertCircle size={18} className="shrink-0 text-amber-600" />
                  <p>System roles are system-defined and their default permissions cannot be modified.</p>
                </div>
              )}

              {/* Matrix Grid (Desktop View) */}
              <div className="hidden sm:block space-y-3">
                <div className="grid grid-cols-5 gap-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100">
                  <div className="col-span-1">Module / Resource</div>
                  <div className="text-center">Create</div>
                  <div className="text-center">View / Read</div>
                  <div className="text-center">Update / Edit</div>
                  <div className="text-center">Delete</div>
                </div>

                <div className="space-y-2">
                  {modules.map(module => (
                    <div key={module.id} className="grid grid-cols-5 gap-4 items-center px-6 py-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all group">
                      <div className="col-span-1">
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{module.name}</span>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{module.permissions.length} actions available</p>
                      </div>
                      
                      {['CREATE', 'READ', 'UPDATE', 'DELETE'].map(action => {
                        const permission = module.permissions.find(p => p.action === action);
                        const isChecked = permission ? roleForm.permissionIds.includes(permission.id) : false;
                        
                        return (
                          <div key={action} className="flex justify-center">
                            {permission ? (
                              <button
                                onClick={() => togglePermission(permission.id)}
                                disabled={selectedRole.isSystem}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  isChecked 
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-100' 
                                    : 'bg-white border border-slate-200 text-slate-300 hover:border-slate-350 hover:text-slate-500'
                                } ${selectedRole.isSystem ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-95'}`}
                              >
                                {isChecked ? <Check size={16} strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                              </button>
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center opacity-20">
                                <X size={14} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile View Card Matrix (Active on mobile screens) */}
              <div className="sm:hidden space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Permissions</h3>
                <div className="space-y-4">
                  {modules.map(module => (
                    <div key={module.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                      <div>
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{module.name}</span>
                        <p className="text-[9px] text-slate-400 font-semibold">{module.permissions.length} actions configured</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {['CREATE', 'READ', 'UPDATE', 'DELETE'].map(action => {
                          const permission = module.permissions.find(p => p.action === action);
                          const isChecked = permission ? roleForm.permissionIds.includes(permission.id) : false;
                          if (!permission) return null;

                          return (
                            <button
                              key={action}
                              onClick={() => togglePermission(permission.id)}
                              disabled={selectedRole.isSystem}
                              className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all justify-center ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              } ${selectedRole.isSystem ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                              }`}>
                                {isChecked && <Check size={10} strokeWidth={4} />}
                              </div>
                              <span className="capitalize">{action.toLowerCase()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full py-16 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <ShieldCheck size={80} className="text-slate-300 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an Access Profile</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddRoleModal}
        onClose={() => setShowAddRoleModal(false)}
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">New Custom Role</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define custom staff access level</p>
          </div>
        }
        maxWidth="max-w-md"
        footer={
          <button 
            type="submit"
            form="roleForm"
            disabled={creating}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create Role
          </button>
        }
      >
        <form id="roleForm" onSubmit={handleCreateRole} className="p-6 space-y-6">
          <FormField label="Role Name" required>
            <Input 
              required
              placeholder="e.g. Lead Assistant"
              className="font-bold text-base"
              value={newRoleData.name}
              onChange={(e) => setNewRoleData({...newRoleData, name: e.target.value.toUpperCase()})}
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea 
              rows={3}
              placeholder="e.g. Manages store inventory operations under direct supervision."
              value={newRoleData.description}
              onChange={(e) => setNewRoleData({...newRoleData, description: e.target.value})}
            />
          </FormField>
        </form>
      </Modal>

      {/* Edit Role Details Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => setShowEditRoleModal(false)}
        title={
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Edit Custom Role</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update role name and description</p>
          </div>
        }
        maxWidth="max-w-md"
        footer={
          <button 
            type="submit"
            form="editRoleForm"
            disabled={updatingRole}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
          >
            {updatingRole ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        }
      >
        <form id="editRoleForm" onSubmit={handleEditRoleDetails} className="p-6 space-y-6">
          <FormField label="Role Name" required>
            <Input 
              required
              placeholder="e.g. Lead Assistant"
              className="font-bold text-base"
              value={editRoleData.name}
              onChange={(e) => setEditRoleData({...editRoleData, name: e.target.value.toUpperCase()})}
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea 
              rows={3}
              placeholder="e.g. Manages store inventory operations under direct supervision."
              value={editRoleData.description}
              onChange={(e) => setEditRoleData({...editRoleData, description: e.target.value})}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
