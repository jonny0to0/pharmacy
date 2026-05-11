import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Pill, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import FormSection from '../components/ui/FormSection';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    businessName: '',
    role: 'BUSINESS_ADMIN'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.businessName.trim()) {
      errors.businessName = 'Pharmacy name is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Must be exactly 10 digits';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Minimum 8 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register', formData);
      
      if (response.data && response.data.accessToken) {
        login(response.data.accessToken, response.data.user);
        navigate('/');
      }
    } catch (err: any) {
      if (!err.response) {
         setGlobalError('Network Error: Unable to reach the server.');
         setLoading(false);
         return;
      }

      const serverError = err.response?.data;
      const message = serverError?.error || 'Failed to register. Please try again.';
      
      if (message.toLowerCase().includes('email')) {
         setFormErrors(prev => ({ ...prev, email: message }));
      } else if (message.toLowerCase().includes('mobile')) {
         setFormErrors(prev => ({ ...prev, mobile: message }));
      } else {
         setGlobalError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-500">
        <div className="p-10 text-center bg-blue-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-lg ring-8 ring-blue-500/30">
                <Pill className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Medisynex</h1>
            <p className="text-blue-100 font-medium opacity-80 uppercase tracking-widest text-[10px]">
              Advanced Pharmacy OS
            </p>
          </div>
        </div>
        
        <div className="p-10">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create Your Account</h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-2">Start managing your pharmacy today</p>
          </div>

          {globalError && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-bold">{globalError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-12">
            <FormSection title="Business Information" description="Details about your pharmacy or medical store">
              <div className="md:col-span-2">
                <FormField label="Pharmacy Name" required error={formErrors.businessName}>
                  <Input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g. Medisynex Wellness Pharmacy"
                    disabled={loading}
                    error={!!formErrors.businessName}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Guardian / Admin Info" description="Primary account holder credentials">
              <FormField label="Full Name" required error={formErrors.name}>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  disabled={loading}
                  error={!!formErrors.name}
                />
              </FormField>

              <FormField label="Mobile Number" required error={formErrors.mobile} helperText="10-digit number for alerts">
                <Input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  disabled={loading}
                  error={!!formErrors.mobile}
                  maxLength={10}
                />
              </FormField>

              <FormField label="Email Address" required error={formErrors.email}>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  disabled={loading}
                  error={!!formErrors.email}
                />
              </FormField>
              
              <FormField label="Password" required error={formErrors.password}>
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    disabled={loading}
                    error={!!formErrors.password}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </FormField>
            </FormSection>
            
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-2xl px-6 py-4 font-black hover:bg-blue-700 shadow-xl shadow-blue-200 focus:outline-none transition-all flex justify-center items-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Creating Your Account...
                  </>
                ) : (
                  'Launch Medisynex Dashboard'
                )}
              </button>

              <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed font-medium">
                By clicking "Launch", you agree to our Terms of Service <br /> and Privacy Policy.
              </p>
            </div>
          </form>
        </div>
        
        <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold underline underline-offset-4 decoration-2 decoration-blue-600/30">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
