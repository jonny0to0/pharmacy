import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { LogOut } from 'lucide-react';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Receipt, 
  Users, 
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock
} from 'lucide-react';
import Button from '../../components/ui/Button';

// Step Components (to be created)
import Step1BusinessType from './Step1BusinessType';
import Step2BusinessInfo from './Step2BusinessInfo';
import Step3Compliance from './Step3Compliance';
import Step4Address from './Step4Address';
import Step5Billing from './Step5Billing';
import Step6Users from './Step6Users';
import Review from './Review';

const STEPS = [
  { id: 1, name: 'Business Type', icon: Building2 },
  { id: 2, name: 'Basic Info', icon: LayoutDashboard },
  { id: 3, name: 'Compliance', icon: ShieldCheck },
  { id: 4, name: 'Address', icon: MapPin },
  { id: 5, name: 'Billing', icon: Receipt },
  { id: 6, name: 'Staff Setup', icon: Users },
  { id: 7, name: 'Review', icon: CheckCircle2 },
];

const INITIAL_DATA = {
  businessType: '',
  businessInfo: {
    name: '',
    owner: '',
    mobile: '',
    email: '',
    category: '',
  },
  compliance: {
    gst: '',
    drugLicense: '',
    pan: '',
    fssai: '',
  },
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  },
  billing: {
    currency: 'INR',
    invoicePrefix: 'INV-',
    financialYear: new Date().getFullYear().toString(),
    paymentMethods: ['Cash', 'UPI'],
    creditLimit: false,
    autoGst: true,
  },
  users: {
    adminUsername: '',
    password: '',
    confirmPassword: '',
    staff: [],
  },
};

export default function SetupLayout() {
  const navigate = useNavigate();
  const { user, token, updateSetupStatus } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('business_setup_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load setup draft", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('business_setup_draft', JSON.stringify(formData));
  }, [formData]);

  const updateData = (section: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof data === 'object' 
        ? { ...(prev[section as keyof typeof prev] as object), ...data } 
        : data
    }));
  };

  const isStepValid = (s = step) => {
    if (s === 1) return !!formData.businessType;
    if (s === 2) {
      const { name, owner, mobile, email } = formData.businessInfo;
      return (
        name?.trim().length >= 2 &&
        owner?.trim().length >= 2 &&
        mobile?.trim().length >= 10 &&
        email?.includes('@')
      );
    }
    // Step 6: Admin credentials required if we are on that step
    if (s === 6) {
      return (
        formData.users.adminUsername?.length >= 3 && 
        formData.users.password?.length >= 6 &&
        formData.users.password === formData.users.confirmPassword
      );
    }
    return true;
  };

  const isGateUnlocked = () => isStepValid(1) && isStepValid(2);

  const nextStep = () => {
    if (isStepValid()) {
      setStep(s => Math.min(s + 1, 7));
    } else {
      toast.error('Please complete mandatory fields correctly');
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  const skipToFinal = () => setStep(7);

  const progress = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  const handleSubmit = async () => {
    if (!isGateUnlocked()) {
      toast.error('Business Identity (Steps 1 & 2) must be completed');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      // Batch payload adapted for complete-batch endpoint
      const payload = {
        tenantId: user?.tenantId,
        businessType: formData.businessType,
        businessInfo: formData.businessInfo,
        compliance: formData.compliance,
        address: formData.address,
        billing: formData.billing,
        users: {
          password: formData.users.password,
          staff: formData.users.staff
        }
      };

      await api.post('/setup/complete-batch', payload);
      
      updateSetupStatus(true, formData.businessType as any);
      toast.success('Enterprise Setup Complete!');
      localStorage.removeItem('business_setup_draft');
      navigate('/');
    } catch (error: any) {
      const apiError = error.response?.data?.error || error.response?.data?.message;
      toast.error(apiError || 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1BusinessType data={formData.businessType} update={(val) => updateData('businessType', val)} onNext={nextStep} />;
      case 2: return <Step2BusinessInfo data={formData.businessInfo} businessType={formData.businessType} update={(val) => updateData('businessInfo', val)} />;
      case 3: return <Step3Compliance data={formData.compliance} businessType={formData.businessType} update={(val) => updateData('compliance', val)} />;
      case 4: return <Step4Address data={formData.address} update={(val) => updateData('address', val)} />;
      case 5: return <Step5Billing data={formData.billing} update={(val) => updateData('billing', val)} />;
      case 6: return <Step6Users data={formData.users} update={(val) => updateData('users', val)} />;
      case 7: return <Review formData={formData} setStep={setStep} isSubmitting={isSubmitting} onSubmit={handleSubmit} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <div className="max-w-4xl w-full">
        
        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6 px-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                  Step {step} of 7
                </span>
                <span className="h-px w-4 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {STEPS[step - 1].name}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Enterprise Onboarding</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (confirm('Are you sure you want to logout? Your setup progress is saved locally.')) {
                    await api.post('/auth/logout');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }
                }}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Exit Setup
              </Button>
            </div>
          </div>

          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
            {/* Progress Line */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(79,70,229,0.4)]"
              style={{ width: `${progress}%` }}
            />
            
            {/* Icons */}
            <div className="relative flex justify-between">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isLocked = s.id > 2 && !isGateUnlocked();
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                
                return (
                  <div key={s.id} className="flex flex-col items-center group">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center relative z-10 transition-all duration-500
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110 ring-4 ring-white' 
                        : isCompleted 
                          ? 'bg-indigo-100 text-indigo-600' 
                          : isLocked
                            ? 'bg-slate-50 text-slate-300 border border-slate-200'
                            : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-indigo-200'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4 text-slate-300" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`
                      hidden md:block mt-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300
                      ${isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'}
                    `}>
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex-1 p-8 md:p-12">
            {renderStep()}
          </div>

          {/* Navigation */}
          {step < 7 && (
            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className={step === 1 ? 'opacity-0' : ''}
              >
                Back
              </Button>

              <div className="flex-1 flex flex-col items-center gap-2">
                {step >= 3 && step < 7 && (
                  <button 
                    onClick={skipToFinal}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all"
                  >
                    Skip to Review & Finish →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {step >= 3 && (
                  <Button
                    variant="outline"
                    onClick={nextStep}
                    className="border-transparent text-indigo-600 hover:bg-indigo-50"
                  >
                    Skip for Now
                  </Button>
                )}
                
                {step > 1 && (
                  <Button
                    size="lg"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="tracking-[0.15em] uppercase text-xs font-black shadow-lg hover:shadow-xl"
                  >
                    {step === 2 ? 'Unlock Modules' : 'Next Step'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Secured Enterprise Onboarding &bull; Multi-Tenant Architecture
        </p>
      </div>
    </div>
  );
}
