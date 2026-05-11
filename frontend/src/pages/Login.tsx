import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Pill, Loader2, Eye, EyeOff } from 'lucide-react';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier, password } : { mobile: identifier, password };
      
      const response = await api.post('/auth/login', payload);
      
      if (response.data && response.data.accessToken) {
        const { user } = response.data;
        
        import('../utils/alerts').then(({ alerts }) => {
          alerts.success('Login Successful', `Welcome back, ${user.name}!`);
        });

        login(response.data.accessToken, user);
        
        const returnUrl = sessionStorage.getItem('returnUrl');
        if (returnUrl) {
          sessionStorage.removeItem('returnUrl');
          // Show a subtle notification as requested
          import('../utils/alerts').then(({ alerts }) => {
            alerts.success('Session Restored', 'Returning to your previous workflow...');
          });
          navigate(returnUrl);
        } else {
          if (user.roles.includes('SUPER_ADMIN')) {
            navigate('/admin/dashboard');
          } else if (user.roles.includes('CASHIER')) {
            navigate('/sales');
          } else if (user.roles.includes('PHARMACIST')) {
            navigate('/products');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err: any) {
      import('../utils/alerts').then(({ alerts }) => {
        alerts.friendlyError(err.response?.data?.error || 'Invalid credentials');
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-10 text-center bg-blue-600 relative overflow-hidden">
          {/* Decorative Background Pattern */}
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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-2">Sign in to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField 
              label="Email or Mobile" 
              error={error.includes('fields') ? error : undefined}
            >
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@medisynex.com"
                disabled={loading}
              />
            </FormField>
            
            <FormField 
              label="Password"
            >
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
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
            
            <div className="flex justify-end">
              <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                Forgot password?
              </a>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-2xl px-6 py-4 font-black hover:bg-blue-700 shadow-xl shadow-blue-200 focus:outline-none transition-all flex justify-center items-center gap-3 mt-8 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>
        
        <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold underline underline-offset-4 decoration-2 decoration-blue-600/30">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
