import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Plus, Search, Truck, Wallet, CreditCard, ShieldCheck, 
  CheckCircle2, Loader2, Factory, Building2, Phone, 
  Mail, MapPin, Edit3, ArrowUpRight, Trash2, Zap, 
  Box, Calendar, AlertCircle 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/Modal';
import alerts from '../utils/alerts';
import SupplierDetailsDrawer from '../components/SupplierDetailsDrawer';
import FormSection from '../components/ui/FormSection';
import FormField from '../components/ui/FormField';
import { useFormDraft } from '../hooks/useFormDraft';
import DraftRestorationModal from '../components/DraftRestorationModal';
import toast from 'react-hot-toast';
import { usePermission } from '../hooks/usePermission';

interface Supplier {
  id: string;
  name: string;
  type: 'PHARMA' | 'NON_PHARMA';
  mobile: string;
  email: string | null;
  gstin: string | null;
  drugLicenseNo: string | null;
  dlExpiry: string | null;
  pan: string | null;
  address: string | null;
  state: string | null;
  outstandingBalance: number;
  purchases?: { id: string; grandTotal: number; status: string; date: string }[];
}

interface SupplierFormData {
  name: string;
  type: 'PHARMA' | 'NON_PHARMA';
  mobile: string;
  email: string;
  gstin: string;
  drugLicenseNo: string;
  dlExpiry: string;
  pan: string;
  address: string;
  state: string;
}

const INITIAL_FORM: SupplierFormData = {
  name: '', 
  type: 'PHARMA',
  mobile: '', 
  email: '', 
  gstin: '', 
  drugLicenseNo: '',
  dlExpiry: '',
  pan: '',
  address: '', 
  state: ''
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const Suppliers = () => {
  const qc = useQueryClient();
  const { hasPermission, checkPermissionAndRun } = usePermission();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [form, setForm] = useState<SupplierFormData>(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Draft Preservation Hook
  const { hasDraft, draftData, saveDraft, clearDraft, restoreDraft } = useFormDraft(
    isEditing && editId ? `edit_supplier_${editId}` : 'add_supplier',
    form,
    {
      autoRestore: false, // Prompt instead of auto-restore
      onRestore: (data) => {
        setForm(data);
        toast.success('Supplier draft restored');
      }
    }
  );

  // Auto-save draft when data changes
  React.useEffect(() => {
    if (showModal) {
      const timeoutId = setTimeout(() => {
        saveDraft(form);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [form, saveDraft, showModal]);

  const { data: suppliers = [], isLoading, error } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      if (isEditing && editId) {
        await api.put(`/suppliers/${editId}`, data);
      } else {
        await api.post('/suppliers', data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setShowModal(false);
      clearDraft(); // Clear draft on success
      setForm(INITIAL_FORM);
      alerts.success(isEditing ? 'Supplier Updated' : 'Supplier Added', `Supplier has been successfully ${isEditing ? 'updated' : 'added'}.`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to save supplier. Please check your network or try again.';
      setFormError(msg);
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      alerts.success('Supplier Deleted', 'The supplier has been successfully removed.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete supplier.';
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.type === 'PHARMA' && !form.drugLicenseNo.trim()) {
      setFormError('Drug License Number is required for Pharma suppliers.');
      return;
    }
    mutation.mutate(form);
  };

  const handeEdit = (s: Supplier) => {
    checkPermissionAndRun('SUPPLIERS.UPDATE', () => {
      setIsEditing(true);
      setEditId(s.id);
      setForm({
        name: s.name,
        type: s.type,
        mobile: s.mobile || '',
        email: s.email || '',
        gstin: s.gstin || '',
        drugLicenseNo: s.drugLicenseNo || '',
        dlExpiry: s.dlExpiry ? s.dlExpiry.slice(0, 10) : '',
        pan: s.pan || '',
        address: s.address || '',
        state: s.state || ''
      });
      setShowModal(true);
    });
  };

  const handleOpenDetails = (s: Supplier) => {
    checkPermissionAndRun('SUPPLIERS.READ', () => {
      setSelectedSupplier(s);
      setIsDrawerOpen(true);
    });
  };

  const openAddModal = () => {
    checkPermissionAndRun('SUPPLIERS.CREATE', () => {
      setIsEditing(false); 
      setForm(INITIAL_FORM); 
      setShowModal(true); 
    });
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.mobile && s.mobile.includes(searchTerm)) ||
    (s.gstin && s.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.drugLicenseNo && s.drugLicenseNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPayable = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <DraftRestorationModal 
        isOpen={hasDraft}
        formName={isEditing ? `editing vendor profile` : 'new vendor entry'}
        onRestore={() => restoreDraft()}
        onDiscard={clearDraft}
        timestamp={(draftData as any)?.timestamp}
      />
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Suppliers Ledger</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage vendor relations and infrastructure compliance.</p>
        </div>
        <Button
          onClick={openAddModal}
          leftIcon={<Plus size={18} />}
          disabled={!hasPermission('SUPPLIERS.CREATE')}
        >
          Add New Supplier
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Modern Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Vendors', val: suppliers.length, sub: 'Active', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Payables', val: `₹${totalPayable > 100000 ? `${(totalPayable/100000).toFixed(1)}L` : totalPayable.toLocaleString()}`, sub: 'Due', icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Purchases (MTD)', val: '12', sub: 'Bills', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Compliance Index', val: '98%', sub: 'Valid', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, i) => (
          <Card key={i} className="group hover:shadow-md transition-all border-0">
            <CardContent className="p-6 border border-slate-100 rounded-2xl h-full line-clamp-none">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${stat.bg} ${stat.color}`}>{stat.sub}</span>
                  </div>
                </div>
                <div className={`p-2 rounded-xl scale-110 ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Listing Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Search by Name, Phone, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="text-slate-400" />}
              className="py-2.5 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Entities Indexed</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Vendor & Compliance</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4 text-center">Outstanding Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-slate-400 font-medium text-sm">Loading records...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No vendors found</h3>
                    <p className="text-sm text-slate-400 mt-1">Initiate onboarding to populate the directory.</p>
                   </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${s.type === 'PHARMA' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                          <Factory size={24} />
                        </div>
                        <div>
                          <p onClick={() => handleOpenDetails(s)} className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2">
                            {s.name}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${s.type === 'PHARMA' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                                {s.type}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-indigo-500" /> GST: <span className="text-slate-900 font-mono">{s.gstin || '---'}</span></span>
                            <span className="flex items-center gap-1.5"><Building2 size={12} className="text-indigo-500" /> DL: <span className="text-slate-900 font-mono">{s.drugLicenseNo || '---'}</span></span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Phone size={14} className="text-indigo-500" /> {s.mobile}
                        </div>
                        {s.email && (
                          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                            <Mail size={12} /> {s.email}
                          </div>
                        )}
                        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                          <MapPin size={12} className="text-slate-300" /> {s.state || 'Local'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-lg font-bold tabular-nums ${s.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ₹{s.outstandingBalance.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payable</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Button
                           variant="outline"
                           size="icon"
                           onClick={() => handeEdit(s)}
                           title="Edit Vendor"
                           disabled={!hasPermission('SUPPLIERS.UPDATE')}
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                           variant="primary"
                           size="icon"
                           className="bg-slate-900 hover:bg-slate-800 border-transparent shadow-md"
                           onClick={() => handleOpenDetails(s)}
                           title="View Details"
                           disabled={!hasPermission('SUPPLIERS.READ')}
                        >
                          <ArrowUpRight size={16} />
                        </Button>
                        <Button
                           variant="danger"
                           size="icon"
                           onClick={async () => {
                             checkPermissionAndRun('SUPPLIERS.DELETE', async () => {
                               const result = await alerts.confirm('Delete Vendor', 'Are you sure you want to delete this vendor? This action cannot be undone.', 'Delete');
                               if(result.isConfirmed) {
                                 deleteMutation.mutate(s.id);
                               }
                             });
                           }}
                           title="Delete Vendor"
                           disabled={!hasPermission('SUPPLIERS.DELETE')}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        maxWidth="max-w-2xl"
        title={isEditing ? 'Modify Vendor Profile' : 'Onboard New Vendor'}
      >
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Type Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-full max-w-sm mx-auto">
            <button 
              type="button"
              onClick={() => setForm({ ...form, type: 'PHARMA' })}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${form.type === 'PHARMA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Zap size={14} /> Pharma
            </button>
            <button 
              type="button"
              onClick={() => setForm({ ...form, type: 'NON_PHARMA' })}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${form.type === 'NON_PHARMA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Box size={14} /> Generic
            </button>
          </div>

          <FormSection title="Core Information" description="Basic identity and contact details.">
            <div className="md:col-span-2">
              <FormField label="Legal Entity Name" required>
                <Input
                  placeholder="e.g. Universal Medical Suppliers Ltd"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Mobile Number" required>
              <Input
                type="tel" placeholder="98765 43210"
                value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                icon={<Phone size={18} className="text-slate-400" />}
              />
            </FormField>

            <FormField label="Email Address">
              <Input
                type="email" placeholder="vendor@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                icon={<Mail size={18} className="text-slate-400" />}
              />
            </FormField>
          </FormSection>

          <FormSection title="Legal & Compliance" description="Tax and industry-specific licenses.">
            <FormField label="GST Identification (GSTIN)">
              <Input
                placeholder="27AAAAA0000A1Z5"
                maxLength={15}
                value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                className="font-mono"
              />
            </FormField>

            <FormField label="Permanent Account (PAN)">
              <Input
                placeholder="ABCDE1234F"
                maxLength={10}
                value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                className="font-mono"
              />
            </FormField>

            {form.type === 'PHARMA' && (
              <>
                <FormField label="Drug License Number" required>
                  <Input
                    placeholder="e.g. 20B/21B-XXXXX"
                    value={form.drugLicenseNo} onChange={(e) => setForm({ ...form, drugLicenseNo: e.target.value.toUpperCase() })}
                    icon={<ShieldCheck size={18} className="text-indigo-400" />}
                  />
                </FormField>
                <FormField label="License Expiry">
                  <Input
                    type="date"
                    value={form.dlExpiry} onChange={(e) => setForm({ ...form, dlExpiry: e.target.value })}
                    icon={<Calendar size={18} className="text-slate-400" />}
                  />
                </FormField>
              </>
            )}
          </FormSection>

          <FormSection title="Geographic Details" description="Physical operational node.">
            <FormField label="Operating State">
               <Select
                    value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
               </Select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Infrastructure Address">
                <Textarea
                  placeholder="Street, Building, Area details..."
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                />
              </FormField>
            </div>
          </FormSection>

          {formError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-3 rounded-xl text-xs font-semibold animate-shake">
              <AlertCircle size={18} className="shrink-0" /> {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button 
              variant="outline"
              type="button" 
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              {isEditing ? 'Update Vendor' : 'Onboard Vendor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Drawer */}
      <SupplierDetailsDrawer 
        supplier={selectedSupplier} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};

export default Suppliers;
