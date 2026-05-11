import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermission } from '../../../hooks/usePermission';
import { fetchStaff, createStaff, updateStaff, deleteStaff } from './staff.api';
import type { StaffMember } from './staff.types';
import StaffStats from './StaffStats';
import StaffTable from './StaffTable';
import StaffForm from './StaffForm';
import Button from '../../../components/ui/Button';

const StaffManagement: React.FC = () => {
  const { hasPermission } = usePermission();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, lateToday: 0 });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaff();
      setStaff(data);
      setStats({
        total: data.length,
        active: data.filter(s => s.isActive).length,
        onLeave: 0,
        lateToday: 0
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect to the server. Please verify your connection.');
      toast.error('Could not load team directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deletingStaff || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteStaff(deletingStaff.id);
      toast.success('Staff member removed successfully');
      setDeletingStaff(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] animate-pulse">Syncing Employee Records...</p>
      </div>
    );
  }

  if (error && staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center bg-white rounded-[3rem] border border-slate-100 mt-8">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 border-4 border-white shadow-xl shadow-rose-500/10">
          <AlertCircle size={40} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access Interrupted</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm">{error}</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:translate-y-0.5"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Reconnect Now
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-500 w-12 h-1.5 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Human Capital Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">
            Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Management</span>
          </h1>
          <p className="text-slate-500 mt-3 font-medium text-sm flex items-center gap-2">
            Configure system access, roles, and identity provisioning for your entire pharmacy team.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <Button 
            onClick={loadData}
            title="Refresh Records"
            variant="outline"
            size="icon"
            className="rounded-2xl border-slate-100 bg-white shadow-sm elevation-hover shrink-0"
            isLoading={loading}
          >
            {!loading && <RefreshCw size={20} className="text-slate-400 group-hover:text-indigo-600" />}
          </Button>

          {hasPermission('STAFF.CREATE') && (
            <Button 
              onClick={() => setShowAddModal(true)}
              variant="primary"
              size="lg"
              className="elevation-2 rounded-2xl flex-1 md:flex-none px-6 md:px-10"
              leftIcon={<UserPlus size={20} />}
            >
              <span className="uppercase tracking-widest text-[11px] font-black">Add New Staff</span>
            </Button>
          )}
        </div>
      </div>

      <StaffStats stats={stats} />

      <StaffTable 
        staff={staff} 
        onEdit={(s) => setEditingStaff(s)} 
        onDelete={(id, name) => setDeletingStaff({ id, name })} 
        hasPermission={hasPermission} 
      />

      {/* Add Modal */}
      {showAddModal && (
        <StaffForm 
          title="Add New Employee" 
          submitLabel="Create Account"
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          apiCall={createStaff}
        />
      )}

      {/* Edit Modal */}
      {editingStaff && (
        <StaffForm 
          title="Update Employee" 
          submitLabel="Save Changes"
          initialData={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={loadData}
          apiCall={(data) => updateStaff(editingStaff.id, data)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6 border-4 border-rose-100 shadow-xl shadow-rose-500/10 rotate-12">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Confirm Deletion</h3>
            <p className="text-slate-500 mt-4 text-sm leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800">{deletingStaff.name}</span>? 
              This will disable their system access. This action can be reversed by an admin later.
            </p>
            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-4 text-slate-500 font-black uppercase text-xs hover:text-slate-800 transition-colors"
                disabled={isDeleting}
              >
                No, Keep
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
