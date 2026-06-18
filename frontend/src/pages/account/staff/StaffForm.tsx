import React, { useState } from 'react';
import { User, X, Shield, Mail, Phone, Briefcase, Calendar, DollarSign, Clock, UserCheck } from 'lucide-react';
import api from '../../../api/axios';
import alerts from '../../../utils/alerts';
import { useFormDraft } from '../../../hooks/useFormDraft';
import DraftRestorationModal from '../../../components/DraftRestorationModal';
import toast from 'react-hot-toast';

interface StaffFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  title: string;
  submitLabel: string;
  apiCall: (data: any) => Promise<any>;
}

const StaffForm: React.FC<StaffFormProps> = ({ onClose, onSuccess, initialData, title, submitLabel, apiCall }) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    mobile: initialData?.mobile || '',
    role: initialData?.role || 'CASHIER',
    branchIds: initialData?.branches?.map((b: any) => b.id) || [],
    employeeId: initialData?.employeeId || '',
    department: initialData?.department || '',
    designation: initialData?.designation || '',
    employmentType: initialData?.employmentType || 'FULL_TIME',
    joinDate: initialData?.joinDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    salary: initialData?.salary || '',
    workShift: initialData?.workShift || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true
  });

  // Draft Preservation Hook
  const { hasDraft, draftData, saveDraft, clearDraft, restoreDraft } = useFormDraft(
    initialData?.id ? `edit_staff_${initialData.id}` : 'add_staff',
    formData,
    {
      autoRestore: false, // Prompt instead of auto-restore
      onRestore: (data) => {
        setFormData(data);
        toast.success('Staff draft restored');
      }
    }
  );

  // Fetch roles and branches
  React.useEffect(() => {
    const fetchRolesAndBranches = async () => {
      try {
        const [rolesRes, branchesRes] = await Promise.all([
          api.get('/roles'),
          api.get('/branches')
        ]);
        setRoles(rolesRes.data);
        setBranches(branchesRes.data);
      } catch (err) {
        toast.error("Failed to load roles and branches data");
      }
    };
    fetchRolesAndBranches();
  }, []);

  // Auto-save draft when data changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft(formData);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, saveDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Race condition protection

    setLoading(true);
    try {
      const res = await apiCall(formData);
      clearDraft(); // Clear draft on success
      onSuccess();
      onClose();

      if (res && res.emailSent === false && res.inviteLink) {
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            title: 'Staff Created',
            html: `
              <p class="text-sm text-slate-500 mb-4">The staff member was created, but the invitation email could not be sent (SMTP config issue).</p>
              <p class="text-sm font-bold text-slate-700">Copy this activation link to configure the account:</p>
              <textarea readonly class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono mt-2 h-20 outline-none resize-none">${res.inviteLink}</textarea>
            `,
            icon: 'warning',
            confirmButtonText: 'Copy Link',
            confirmButtonColor: '#3085d6',
            preConfirm: () => {
              navigator.clipboard.writeText(res.inviteLink);
              toast.success('Link copied to clipboard!');
            }
          });
        });
      } else {
        alerts.success('Success', `${title} successfully`);
      }
    } catch (error: any) {
      alerts.friendlyError(error.response?.data?.error || `Something went wrong`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DraftRestorationModal 
        isOpen={hasDraft}
        formName={initialData ? `editing staff member` : 'new staff registration'}
        onRestore={() => restoreDraft()}
        onDiscard={clearDraft}
        timestamp={(draftData as any)?.timestamp}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{title}</h2>
              <p className="text-blue-100 text-xs mt-1 font-bold uppercase tracking-widest">Employee Provisioning Suite</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8 bg-white custom-scrollbar">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Identity Group */}
            <section>
              <div className="flex items-center gap-2 mb-6 border-l-4 border-blue-500 pl-4">
                <Shield className="text-blue-500" size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Core Identity & Access</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Full Name" 
                  value={formData.name} 
                  onChange={(v: string) => setFormData({...formData, name: v})} 
                  icon={<User size={18}/>} 
                  required 
                />
                <FormField 
                  label="Email Address" 
                  type="email"
                  value={formData.email} 
                  onChange={(v: string) => setFormData({...formData, email: v})} 
                  icon={<Mail size={18}/>} 
                  required 
                />
                <FormField 
                  label="Mobile Number" 
                  value={formData.mobile} 
                  onChange={(v: string) => setFormData({...formData, mobile: v})} 
                  icon={<Phone size={18}/>} 
                  required 
                />
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase tracking-tight"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                      {roles.length === 0 && (
                        <>
                          <option value="CASHIER">Cashier</option>
                          <option value="PHARMACIST">Pharmacist</option>
                          <option value="MANAGER">Manager</option>
                          <option value="BUSINESS_ADMIN">Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Assigned Branches */}
                <div className="flex flex-col gap-3 col-span-1 md:col-span-2 mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Branches</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    {branches.map((b) => {
                      const isChecked = formData.branchIds.includes(b.id);
                      return (
                        <label 
                          key={b.id} 
                          className={`flex items-center gap-3 p-4 bg-white rounded-xl border-2 cursor-pointer transition-all ${
                            isChecked ? 'border-blue-600 shadow-md shadow-blue-50' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newIds = isChecked
                                ? formData.branchIds.filter((id: string) => id !== b.id)
                                : [...formData.branchIds, b.id];
                              setFormData({ ...formData, branchIds: newIds });
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-700">{b.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Branch Node</p>
                          </div>
                        </label>
                      );
                    })}
                    {branches.length === 0 && (
                      <p className="text-xs font-bold text-slate-400 italic col-span-2">No branches configured. Assigning user to All Branches by default.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Employment Group */}
            <section>
              <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-500 pl-4">
                <Briefcase className="text-emerald-500" size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Employment Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Employee ID (Unique)" 
                  value={formData.employeeId} 
                  onChange={(v: string) => setFormData({...formData, employeeId: v})} 
                  icon={<Briefcase size={18}/>} 
                />
                <FormField 
                  label="Department" 
                  value={formData.department} 
                  onChange={(v: string) => setFormData({...formData, department: v})} 
                  icon={<Briefcase size={18}/>} 
                />
                <FormField 
                  label="Designation" 
                  value={formData.designation} 
                  onChange={(v: string) => setFormData({...formData, designation: v})} 
                  icon={<Briefcase size={18}/>} 
                />
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employment Type</label>
                  <select 
                    value={formData.employmentType}
                    onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                    className="bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <FormField 
                  label="Join Date" 
                  type="date"
                  value={formData.joinDate} 
                  onChange={(v: string) => setFormData({...formData, joinDate: v})} 
                  icon={<Calendar size={18}/>} 
                />
                <FormField 
                  label="Salary / Wage (Monthly)" 
                  type="number"
                  value={formData.salary} 
                  onChange={(v: string) => setFormData({...formData, salary: v})} 
                  icon={<DollarSign size={18}/>} 
                />
                <FormField 
                  label="Work Shift" 
                  value={formData.workShift} 
                  onChange={(v: string) => setFormData({...formData, workShift: v})} 
                  placeholder="e.g. 9:00 AM - 6:00 PM"
                  icon={<Clock size={18}/>} 
                />
                {initialData && (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <UserCheck className={formData.isActive ? 'text-emerald-500' : 'text-slate-400'} size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Account Status</p>
                      <p className="text-sm font-bold text-slate-700 mt-1 uppercase">{formData.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <button 
            type="button"
            onClick={onClose}
            className="md:px-8 px-4 py-3 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-slate-800 transition-colors"
          >
            Discard Changes
          </button>
          <div className="flex gap-4">
            <button 
              form="staff-form"
              type="submit"
              disabled={loading}
              className="md:px-12 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : submitLabel}
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

const FormField = ({ label, type = 'text', value, onChange, icon, required, placeholder }: { label: string, type?: string, value: any, onChange: (v: string) => void, icon?: React.ReactNode, required?: boolean, placeholder?: string }) => (
  <div className="flex flex-col gap-2 group">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-blue-500">
      {label} {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
        {icon}
      </div>
      <input 
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
      />
    </div>
  </div>
);

export default StaffForm;
