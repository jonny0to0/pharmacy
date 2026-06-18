import React, { useState, useEffect } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import FormSection from './ui/FormSection';
import FormField from './ui/FormField';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { useFormDraft } from '../hooks/useFormDraft';
import DraftRestorationModal from './DraftRestorationModal';
import toast from 'react-hot-toast';
import api from '../api/axios';

export interface CustomerInput {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  gst_number?: string;
  address?: string;
  state?: string;
  customerType: 'regular' | 'wholesale';
  creditLimit?: number;
  dob?: string | null;
  gender?: string | null;
  membershipType?: 'Regular' | 'Premium' | 'Corporate';
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CustomerInput) => Promise<void>;
  editingCustomer?: CustomerInput | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCustomer
}) => {
  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    phone: '',
    email: '',
    gst_number: '',
    address: '',
    state: '',
    customerType: 'regular',
    creditLimit: 0,
    dob: '',
    gender: '',
    membershipType: 'Regular',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State to check duplicates in real-time
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);

  // Load existing customers to do real-time phone number checks
  useEffect(() => {
    if (isOpen) {
      api.get('/customers')
        .then(res => setExistingCustomers(res.data))
        .catch(err => console.error('Failed to prefetch customers for validation', err));
    }
  }, [isOpen]);

  // Hook for draft preservation
  const { hasDraft, draftData, saveDraft, clearDraft, restoreDraft } = useFormDraft(
    editingCustomer?.id ? `edit_customer_${editingCustomer.id}` : 'add_customer',
    formData,
    {
      autoRestore: false, // Prompt instead of auto-restore
      onRestore: (data) => {
        setFormData(data);
        toast.success('Customer draft restored');
      }
    }
  );

  // Auto-save draft when data changes
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        saveDraft(formData);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, saveDraft, isOpen]);

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        id: editingCustomer.id,
        name: editingCustomer.name || '',
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        gst_number: editingCustomer.gst_number || '',
        address: editingCustomer.address || '',
        state: editingCustomer.state || '',
        customerType: editingCustomer.customerType || 'regular',
        creditLimit: editingCustomer.creditLimit || 0,
        dob: editingCustomer.dob ? new Date(editingCustomer.dob).toISOString().split('T')[0] : '',
        gender: editingCustomer.gender || '',
        membershipType: editingCustomer.membershipType || 'Regular',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        gst_number: '',
        address: '',
        state: '',
        customerType: 'regular',
        creditLimit: 0,
        dob: '',
        gender: '',
        membershipType: 'Regular',
      });
    }
    setErrors({});
    setApiError(null);
  }, [editingCustomer, isOpen]);

  // Real-time duplicate phone finder
  const duplicateCustomer = formData.phone.length >= 10
    ? existingCustomers.find(c => c.phone === formData.phone && c.id !== formData.id)
    : null;

  const validate = () => {
    const newErrors: Partial<Record<keyof CustomerInput, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone must be at least 10 digits';
    } else if (duplicateCustomer) {
      newErrors.phone = 'Customer with this phone number already exists';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      if (duplicateCustomer) {
        toast.error('Cannot save: Phone number must be unique');
      }
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      await onSave(formData);
      clearDraft(); // Clear draft on success
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <DraftRestorationModal 
        isOpen={hasDraft}
        formName={editingCustomer ? `editing ${editingCustomer.name}` : 'new customer'}
        onRestore={() => restoreDraft()}
        onDiscard={clearDraft}
        timestamp={ (draftData as any)?.timestamp }
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingCustomer ? 'Modify Customer Profile' : 'Register New Customer'}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="customerForm"
              disabled={isSubmitting || !!duplicateCustomer}
              className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:shadow-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? 'Committing...' : 'Save Customer'}
            </button>
          </div>
        }
      >
        <form id="customerForm" onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="space-y-8">
            {apiError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                {apiError}
              </div>
            )}

            <FormSection 
              title="Customer Identity" 
              description="Primary contact information for the client node."
            >
              <FormField 
                label="Full Legal Name" 
                required 
                error={errors.name}
              >
                <Input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Johnathan Smith"
                  error={!!errors.name}
                />
              </FormField>

              <FormField 
                label="Contact Number" 
                required 
                error={errors.phone || (duplicateCustomer ? 'Phone number registered' : undefined)}
                helperText="Mobile identifier for communication."
              >
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                    placeholder="98765 43210"
                    error={!!errors.phone || !!duplicateCustomer}
                    maxLength={15}
                  />
                  {duplicateCustomer && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                      <span>⚠️ A customer with this mobile number is already registered (Name: {duplicateCustomer.name}).</span>
                    </div>
                  )}
                </div>
              </FormField>

              <FormField 
                label="Email Address" 
                error={errors.email}
              >
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="customer@domain.com"
                  error={!!errors.email}
                />
              </FormField>

              <FormField label="Membership Type">
                <Select
                  value={formData.membershipType}
                  onChange={e => setFormData({...formData, membershipType: e.target.value as any})}
                >
                  <option value="Regular">Regular</option>
                  <option value="Premium">Premium</option>
                  <option value="Corporate">Corporate</option>
                </Select>
              </FormField>

              <FormField label="Date of Birth">
                <Input
                  type="date"
                  value={formData.dob || ''}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                />
              </FormField>

              <FormField label="Gender">
                <Select
                  value={formData.gender || ''}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </Select>
              </FormField>

              <FormField label="Customer Segment">
                <Select
                  value={formData.customerType}
                  onChange={e => setFormData({...formData, customerType: e.target.value as 'regular' | 'wholesale'})}
                >
                  <option value="regular">Regular Retail</option>
                  <option value="wholesale">Wholesale Partner</option>
                </Select>
              </FormField>
            </FormSection>

            <FormSection 
              title="Commercial Parameters" 
              description="Operational details and financial boundaries."
            >
              <FormField label="GST Identification">
                <Input
                  type="text"
                  value={formData.gst_number}
                  onChange={e => setFormData({...formData, gst_number: e.target.value.toUpperCase()})}
                  placeholder="27AADCB2230M1Z2"
                  className="font-mono uppercase"
                />
              </FormField>

              <FormField 
                label="Credit Boundary (₹)" 
                helperText="Maximum permitted outstanding balance."
              >
                <Input
                  type="number"
                  value={formData.creditLimit}
                  onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Residential/Business Node">
                  <Textarea
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Complete physical address details..."
                    rows={2}
                  />
                </FormField>
              </div>

              <FormField label="State Hierarchy">
                <Input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                  placeholder="e.g. Maharashtra"
                />
              </FormField>
            </FormSection>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CustomerModal;
