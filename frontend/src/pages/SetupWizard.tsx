import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, CheckCircle2, Lock, User, Plus, Trash2, 
  Rocket, Building2, Layers, Users, ArrowLeft, ArrowRight, 
  ShieldAlert, Globe, Sparkles, Loader2 
} from 'lucide-react';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import FormSection from '../components/ui/FormSection';
import { useFormDraft } from '../hooks/useFormDraft';
import DraftRestorationModal from '../components/DraftRestorationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const BUSINESS_TYPES = [
  { value: 'PHARMACY', label: 'Pharmacy', icon: '💊', gradient: 'from-blue-600 to-indigo-400', shadow: 'shadow-blue-200' },
  { value: 'HOSPITAL', label: 'Hospital', icon: '🏥', gradient: 'from-emerald-600 to-teal-400', shadow: 'shadow-emerald-200' },
  { value: 'WHOLESALER', label: 'Wholesaler', icon: '📦', gradient: 'from-amber-500 to-yellow-400', shadow: 'shadow-amber-200' },
  { value: 'RETAILER', label: 'Retailer', icon: '🛍️', gradient: 'from-purple-600 to-pink-400', shadow: 'shadow-purple-200' },
  { value: 'DISTRIBUTOR', label: 'Distributor', icon: '🚚', gradient: 'from-cyan-500 to-blue-400', shadow: 'shadow-cyan-200' },
  { value: 'MEDICAL_STORE', label: 'Medical Store', icon: '🧾', gradient: 'from-rose-500 to-red-400', shadow: 'shadow-rose-200' },
];

const ROLES = [
  { value: 'MANAGER', label: 'Manager', icon: '👨‍💼', desc: 'Full Control', gradient: 'from-slate-700 to-slate-900' },
  { value: 'CASHIER', label: 'Cashier', icon: '💰', desc: 'Billing Only', gradient: 'from-emerald-500 to-teal-600' },
  { value: 'PHARMACIST', label: 'Pharmacist', icon: '💊', desc: 'Stock & Meds', gradient: 'from-indigo-500 to-blue-600' },
];

export default function SetupWizard() {
  const { token, user, updateSetupStatus } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    businessType: '',
    businessInfo: {
      name: user?.businessName || '',
      owner: user?.name || '',
      mobile: user?.mobile || '',
      email: user?.email || '',
    },
    compliance: {
      gst: '',
      pan: '',
      drugLicense: '',
      fssai: '',
    },
    address: {
      line1: '',
      line2: '',
      state: '',
      pincode: '',
    },
    billing: {
      currency: 'INR',
      invoicePrefix: 'INV-',
      paymentMethods: ['Cash', 'UPI'],
      creditLimit: false,
      autoGst: true,
    },
    users: {
      password: '',
      staff: [] as { name: string; role: string }[],
    }
  });

  const [newStaff, setNewStaff] = useState({ name: '', role: '' });
  
  // Draft Preservation Hook
  const { hasDraft, draftData, saveDraft, clearDraft, restoreDraft } = useFormDraft(
    'setup_wizard',
    { formData, step },
    {
      autoRestore: false, // Prompt instead of auto-restore
      onRestore: (data) => {
        setFormData(data.formData);
        setStep(data.step);
        toast.success('Setup progress restored');
      }
    }
  );

  // Auto-save draft when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft({ formData, step });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, step, saveDraft]);
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        businessInfo: {
          name: prev.businessInfo.name || user.businessName || '',
          owner: prev.businessInfo.owner || user.name || '',
          mobile: prev.businessInfo.mobile || user.mobile || '',
          email: prev.businessInfo.email || user.email || '',
        }
      }));
    }
  }, [user]);

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const nextStep = () => {
    if (isStepValid(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      toast.error('Identity Verification Failed: Check required fields');
    }
  };
  
  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const skipToFinal = () => {
    setStep(7);
    window.scrollTo(0, 0);
  };

  const isStepValid = (s: number) => {
    if (s === 1) return !!formData.businessType;
    if (s === 2) {
      const { name, owner, mobile, email } = formData.businessInfo;
      return name.trim().length >= 2 && owner.trim().length >= 2 && mobile.trim().length >= 10 && email.includes('@');
    }
    return true;
  };

  const isGateUnlocked = () => isStepValid(1) && isStepValid(2);

  const handleSubmit = async () => {
    if (!isGateUnlocked()) {
      toast.error('Critical business information missing');
      return;
    }

    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        businessType: formData.businessType,
        businessInfo: formData.businessInfo,
        compliance: formData.compliance,
        address: formData.address,
        billing: formData.billing,
        users: {
          ...formData.users,
          staff: formData.users.staff
        }
      };

      updateSetupStatus(true, formData.businessType as any);
      clearDraft(); // Clear draft on success
      toast.success('Enterprise Workspace Ready!');
      navigate('/');
    } catch (error: any) {
      const apiError = error.response?.data?.error || error.response?.data?.message;
      toast.error(apiError || 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col py-20 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <DraftRestorationModal 
        isOpen={hasDraft}
        formName="onboarding setup"
        onRestore={() => restoreDraft()}
        onDiscard={clearDraft}
        timestamp={(draftData as any)?.timestamp}
      />
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-slate-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <ShieldCheck className="w-4 h-4" /> Secure Onboarding Protocol
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter sm:text-7xl leading-none">
            Ignite Your <span className="text-indigo-600">Enterprise</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 font-bold max-w-xl mx-auto uppercase tracking-wide opacity-60">Complete these operational nodes to activate your production workspace.</p>
        </div>

        {/* Stepper - Modern High-Contrast */}
        <div className="relative mb-24 px-4 overflow-x-auto pb-4 no-scrollbar">
          <div className="absolute top-8 left-8 right-8 h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
             <div 
               className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-1000 ease-out" 
               style={{ width: `${((step - 1) / 6) * 100}%` }}
             />
          </div>
          <div className="relative flex justify-between min-w-[700px]">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => {
              const isLocked = s > 2 && !isGateUnlocked();
              const isCompleted = step > s;
              const isActive = step === s;
              
              return (
                <div key={s} className="flex flex-col items-center group relative">
                  <div className={`
                    w-16 h-16 rounded-[1.5rem] flex items-center justify-center relative z-10 transition-all duration-700
                    ${isActive ? 'bg-slate-900 text-white shadow-2xl scale-110 ring-8 ring-white' : 
                      isCompleted ? 'bg-indigo-600 text-white shadow-xl rotate-[360deg]' :
                      isLocked ? 'bg-white text-slate-200 border-2 border-slate-100 cursor-not-allowed opacity-50' :
                      'bg-white border-4 border-slate-100 text-slate-400 font-black hover:border-indigo-200'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : 
                     isLocked ? <Lock className="w-5 h-5 opacity-40" /> : 
                     <span className="text-xl font-black leading-none">{s}</span>}
                  </div>
                  <div className="absolute top-20 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-slate-900 translate-y-0 opacity-100' : isCompleted ? 'text-indigo-600' : 'text-slate-300 opacity-0'}`}>
                      {s === 1 ? 'Industry' : s === 2 ? 'Identity' : s === 3 ? 'Compliance' : s === 4 ? 'Location' : s === 5 ? 'Finance' : s === 6 ? 'Personnel' : 'Execution'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container - Premium Elevated Card */}
        <div className="bg-white rounded-[4rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="p-8 sm:p-20">
            
            {/* Step 1: Industry Selection */}
            {step === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Select Operational Domain</h3>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-60">Choose your primary industry cluster to tailor your dashboard.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {BUSINESS_TYPES.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => updateField('businessType', type.value)}
                      className={`
                        relative p-10 rounded-[3rem] border-2 cursor-pointer transition-all duration-500 group
                        hover:scale-[1.03] 
                        ${formData.businessType === type.value 
                          ? `bg-white border-indigo-600 ring-[12px] ring-indigo-50/50 ${type.shadow} shadow-2xl` 
                          : 'border-slate-50 bg-slate-50/40 hover:bg-white text-slate-600 hover:border-indigo-100 shadow-sm'}
                      `}
                    >
                      {formData.businessType === type.value && (
                         <div className="absolute -top-4 -right-4 bg-indigo-600 text-white p-3 rounded-2xl shadow-xl z-20 animate-in zoom-in spin-in-90 duration-500">
                           <CheckCircle2 className="w-6 h-6" />
                         </div>
                      )}
                      <div className={`
                        w-20 h-20 rounded-[2rem] bg-gradient-to-br ${type.gradient} 
                        flex items-center justify-center text-4xl mb-6 
                        shadow-2xl group-hover:rotate-[15deg] transition-transform duration-700
                      `}>
                        {type.icon}
                      </div>
                      <p className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs pb-4">{type.label}</p>
                      <div className={`h-1.5 w-10 bg-slate-200 rounded-full transition-all duration-700 ${formData.businessType === type.value ? 'w-full bg-indigo-600' : 'group-hover:w-16 group-hover:bg-indigo-300'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Core Identity */}
            {step === 2 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-10 duration-700">
                <FormSection 
                  title="Organization Identity" 
                  description="Define the legal and ownership structure of your production node."
                >
                  <div className="md:col-span-2">
                    <FormField label="Legal Enterprise Name" required helperText="Used for formal invoicing and legal reports">
                      <Input
                        type="text"
                        value={formData.businessInfo.name}
                        onChange={(e) => updateField('businessInfo.name', e.target.value)}
                        placeholder="e.g. LifeCare Medicos Private Limited"
                        className="font-black"
                      />
                    </FormField>
                  </div>

                  <FormField label="Owner / Authorized Principal" required>
                    <Input
                      type="text"
                      value={formData.businessInfo.owner}
                      onChange={(e) => updateField('businessInfo.owner', e.target.value)}
                      placeholder="Enter legal owner name"
                    />
                  </FormField>

                  <FormField label="Strategic Liaison Email" required>
                    <Input
                      type="email"
                      value={formData.businessInfo.email}
                      onChange={(e) => updateField('businessInfo.email', e.target.value)}
                      placeholder="operations@enterprise.com"
                    />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="Contact Uplink (Mobile)" required helperText="OTP verification may be required for secure actions">
                      <div className="relative group">
                        <Input
                          type="tel"
                          value={formData.businessInfo.mobile}
                          onChange={(e) => updateField('businessInfo.mobile', e.target.value)}
                          placeholder="9876543210"
                          maxLength={10}
                          icon={<span className="font-black text-slate-400">IN (+91)</span>}
                        />
                      </div>
                    </FormField>
                  </div>
                </FormSection>
                
                <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 text-white relative overflow-hidden group">
                   <div className="relative z-10 space-y-2">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
                         <ShieldCheck className="w-3.5 h-3.5" /> High-Persistence Security
                      </div>
                      <h5 className="text-xl font-black tracking-tight">Data Integrity Guarantee</h5>
                      <p className="text-slate-400 text-xs font-medium max-w-sm">Identity nodes are locked after verification to ensure immutable transaction tracing across your workspace.</p>
                   </div>
                   <Sparkles className="absolute top-10 right-10 w-20 h-20 text-indigo-500/10 group-hover:scale-150 transition-transform duration-1000" />
                </div>
              </div>
            )}

            {/* Step 3: Compliance Repository */}
            {step === 3 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <FormSection 
                  title="Compliance Ledger" 
                  description="Registration keys for tax authorities and licensing boards."
                >
                  <FormField label="GST Identification (GSTIN)">
                    <Input
                      type="text"
                      value={formData.compliance.gst}
                      onChange={(e) => updateField('compliance.gst', e.target.value.toUpperCase())}
                      placeholder="29AAAAA0000A1Z5"
                      className="font-mono uppercase tracking-widest text-indigo-600"
                    />
                  </FormField>
                  
                  <FormField label="Permanent Account (PAN)">
                    <Input
                      type="text"
                      value={formData.compliance.pan}
                      onChange={(e) => updateField('compliance.pan', e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="font-mono uppercase tracking-widest"
                    />
                  </FormField>
                  
                  <FormField label="Pharmacy / Drug License" helperText="Mandatory for medical pharmaceutical nodes">
                    <Input
                      type="text"
                      value={formData.compliance.drugLicense}
                      onChange={(e) => updateField('compliance.drugLicense', e.target.value)}
                      placeholder="Form 20 / 21 Number"
                    />
                  </FormField>
                  
                  <FormField label="Food Safety Key (FSSAI)">
                    <Input
                      type="text"
                      value={formData.compliance.fssai}
                      onChange={(e) => updateField('compliance.fssai', e.target.value)}
                      placeholder="14-digit sequence"
                    />
                  </FormField>
                </FormSection>
              </div>
            )}

            {/* Step 4: Geographic Node */}
            {step === 4 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <FormSection 
                  title="Physical Node Location" 
                  description="Coordinate settings for logistics and billing localization."
                >
                  <div className="md:col-span-2">
                    <FormField label="Primary Infrastructure Address">
                      <Textarea
                        value={formData.address.line1}
                        onChange={(e) => updateField('address.line1', e.target.value)}
                        placeholder="Industrial Park / Building / Street Name"
                        rows={2}
                      />
                    </FormField>
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField label="Sub-division / Landmark">
                      <Input
                        type="text"
                        value={formData.address.line2}
                        onChange={(e) => updateField('address.line2', e.target.value)}
                        placeholder="Floor, Wing or Area Marker"
                      />
                    </FormField>
                  </div>
                  
                  <FormField label="Administrative State">
                    <Select
                      value={formData.address.state}
                      onChange={(e) => updateField('address.state', e.target.value)}
                    >
                      <option value="">Select State</option>
                      {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'].map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </Select>
                  </FormField>
                  
                  <FormField label="Postal Connectivity (Pincode)">
                    <Input
                      type="text"
                      value={formData.address.pincode}
                      onChange={(e) => updateField('address.pincode', e.target.value)}
                      placeholder="6-digit unique id"
                      maxLength={6}
                    />
                  </FormField>
                </FormSection>
              </div>
            )}

            {/* Step 5: Financial Matrix */}
            {step === 5 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <FormSection 
                  title="Invoicing Matrix" 
                  description="Localization settings for currency and transaction sequences."
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6">Default Currency Node</label>
                    <div className="grid grid-cols-3 gap-6">
                      {['INR', 'USD', 'EUR'].map(curr => (
                        <button
                          key={curr}
                          onClick={() => updateField('billing.currency', curr)}
                          className={`
                            py-6 rounded-[2rem] font-black text-xs tracking-widest transition-all border-2
                            ${formData.billing.currency === curr 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' 
                              : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}
                          `}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <FormField label="Global Invoice Prefix">
                    <Input
                      type="text"
                      value={formData.billing.invoicePrefix}
                      onChange={(e) => updateField('billing.invoicePrefix', e.target.value.toUpperCase())}
                      placeholder="TXN-"
                      className="font-mono text-indigo-600 font-black"
                    />
                  </FormField>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6">Permissioned Payment Channels</label>
                    <div className="flex flex-wrap gap-4">
                      {['Cash', 'UPI', 'Credit Card', 'Bank Wire', 'Net Banking'].map(method => {
                        const isSelected = formData.billing.paymentMethods.includes(method);
                        return (
                          <button
                            key={method}
                            onClick={() => {
                              const current = formData.billing.paymentMethods;
                              const next = isSelected ? current.filter(m => m !== method) : [...current, method];
                              updateField('billing.paymentMethods', next);
                            }}
                            className={`
                              px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border-2
                              ${isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}
                            `}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </FormSection>
              </div>
            )}

            {/* Step 6: Command Personnel */}
            {step === 6 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="text-center space-y-4">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Initialize Command Personnel</h3>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-60">Provision initial staff accounts with role-based accessibility.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setNewStaff({...newStaff, role: role.value})}
                      className={`
                        relative p-10 rounded-[3rem] border-2 text-left transition-all duration-500 group
                        ${newStaff.role === role.value ? 'bg-white border-indigo-600 ring-[12px] ring-indigo-50 shadow-2xl' : 'border-slate-50 bg-slate-50/40 opacity-70 hover:opacity-100'}
                      `}
                    >
                      <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${role.gradient} flex items-center justify-center text-3xl mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                        {role.icon}
                      </div>
                      <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-[0.2em] mb-2">{role.label}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">{role.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-6 p-10 bg-indigo-50/50 rounded-[3.5rem] border-2 border-dashed border-indigo-200">
                  <div className="flex-1">
                    <FormField label="Personnel Full Identity">
                      <Input 
                        type="text" 
                        value={newStaff.name} 
                        onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                        placeholder="Access Key Name"
                        className="bg-white"
                      />
                    </FormField>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        if(!newStaff.name || !newStaff.role) return toast.error('Personnel selection invalid');
                        updateField('users.staff', [...formData.users.staff, newStaff]);
                        setNewStaff({name: '', role: ''});
                        toast.success('Personnel Initialized');
                      }}
                      className="w-full md:w-auto h-[56px] px-10 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-3 cursor-pointer group"
                    >
                      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                      <span className="font-black text-[10px] uppercase tracking-widest">Enroll Staff</span>
                    </button>
                  </div>
                </div>

                {formData.users.staff.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.users.staff.map((staff, idx) => (
                      <div key={idx} className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-in slide-in-from-left-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl text-white shadow-lg bg-gradient-to-br ${ROLES.find(r => r.value === staff.role)?.gradient || 'from-slate-400 to-slate-500'}`}>
                            {staff.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg tracking-tighter leading-none">{staff.name}</p>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mt-1.5">{staff.role}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => updateField('users.staff', formData.users.staff.filter((_, i) => i !== idx))}
                          className="w-12 h-12 rounded-2xl hover:bg-rose-50 text-slate-200 hover:text-rose-600 transition-all flex items-center justify-center group"
                        >
                          <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 7: Launchpad Activation */}
            {step === 7 && (
              <div className="text-center space-y-16 animate-in zoom-in-95 duration-1000">
                <div className="relative mx-auto w-48 h-48">
                  <div className="absolute inset-0 bg-indigo-600 rounded-[3.5rem] animate-pulse opacity-20 blur-3xl" />
                  <div className="relative w-48 h-48 bg-slate-900 text-white rounded-[3.5rem] flex items-center justify-center mx-auto shadow-2xl ring-[16px] ring-indigo-50">
                    <Rocket className="w-24 h-24 animate-bounce" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl animate-in zoom-in spin-in-90 delay-500">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Ready for Liftoff!</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs max-w-sm mx-auto leading-relaxed">
                    Your <span className="text-indigo-600">{formData.businessType}</span> environment is fully configured for real-time production.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                   <div className="bg-white p-10 rounded-[3rem] text-left border border-slate-100 shadow-xl group hover:-translate-y-2 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Target Node</p>
                        <Building2 className="w-6 h-6 text-indigo-500 group-hover:rotate-12 transition-transform" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formData.businessInfo.name}</p>
                      <div className="mt-4 flex gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className="w-6 h-1.5 bg-indigo-500 rounded-full" />)}
                      </div>
                   </div>
                   
                   <div className="bg-white p-10 rounded-[3rem] text-left border border-slate-100 shadow-xl group hover:-translate-y-2 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Industry Cluster</p>
                        <Layers className="w-6 h-6 text-indigo-500 group-hover:rotate-12 transition-transform" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formData.businessType}</p>
                      <p className="mt-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest italic opacity-60">Verified Environment</p>
                   </div>

                   <div className="md:col-span-2 bg-slate-50 p-10 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 group">
                      <div className="space-y-2">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Team Readiness</p>
                         <h5 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{formData.users.staff.length + 1} Authorized Users</h5>
                         <p className="text-slate-500 font-medium text-sm">Primary administrative access and staff roles configured.</p>
                      </div>
                      <div className="flex -space-x-3">
                         {[1, 2, 3, 4].map((i) => (
                           <div key={i} className="w-14 h-14 rounded-2xl bg-white border-2 border-white ring-1 ring-slate-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm transition-transform hover:-translate-y-1">
                             {i === 4 ? <Plus size={20} /> : <Users size={20} />}
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-20">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                {step > 1 ? (
                  <button
                    onClick={prevStep}
                    className="w-full md:w-auto px-10 py-4 bg-white hover:bg-slate-50 text-slate-500 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ArrowLeft size={16} /> Return to previous
                  </button>
                ) : (
                  <div className="hidden md:flex items-center gap-2 text-slate-300 font-bold text-[10px] tracking-widest uppercase">
                    <ShieldCheck size={16} className="text-indigo-200" /> Secure Encryption Active
                  </div>
                )}

                {step < 7 ? (
                  <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                    {step >= 3 && (
                      <button
                        onClick={nextStep}
                        className="px-8 py-4 bg-white text-slate-400 hover:text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-100 hover:border-indigo-100 transition-all active:scale-95"
                      >
                        Skip for now
                      </button>
                    )}
                    <button
                      onClick={nextStep}
                      disabled={!isStepValid(step)}
                      className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95"
                    >
                      {step === 1 ? 'Confirm Type' : step === 2 ? 'Continue' : 'Next Step'} 
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-4 active:scale-95 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-white" /> 
                        <span>Completing setup...</span>
                      </>
                    ) : (
                      <>
                        <span>Finish & Start Billing</span>
                        <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {step >= 3 && step < 7 && (
                <button 
                  onClick={skipToFinal}
                  className="mx-auto text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-6 group cursor-pointer"
                >
                  <div className="w-10 h-px bg-slate-100 group-hover:w-16 group-hover:bg-indigo-100 transition-all" />
                  Bypass Remaining Modules
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  <div className="w-10 h-px bg-slate-100 group-hover:w-16 group-hover:bg-indigo-100 transition-all" />
                </button>
              )}
            </div>
            
            {step <= 2 && (
              <div className="mt-20 border-t border-slate-50 pt-10 flex flex-col items-center gap-4">
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                   Managed by <span className="text-slate-900">Medisynex Cloud Infrastructure</span>
                 </p>
                 <div className="flex gap-4 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                    <ShieldAlert className="w-5 h-5" />
                    <Lock className="w-5 h-5" />
                    <Globe className="w-5 h-5" />
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
