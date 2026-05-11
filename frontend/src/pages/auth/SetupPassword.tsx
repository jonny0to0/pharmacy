import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, CheckCircle, AlertCircle, Loader2, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const SetupPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/setup-password', { token, password });
      setSuccess(true);
      toast.success('Account setup successful!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup account. The link may be expired.');
      toast.error('Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-8 border-4 border-emerald-100 shadow-xl shadow-emerald-500/10 rotate-12">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Setup Complete</h1>
          <p className="text-slate-500 mt-4 leading-relaxed">
            Your account has been successfully activated. You can now log in to the Medisynex platform with your new password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="p-10 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex p-3 bg-white/20 rounded-2xl backdrop-blur-md mb-6 border border-white/30 rotate-3">
              <Pill size={32} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Medisynex</h1>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.3em] mt-2 opacity-80">Security Provisioning</p>
          </div>
        </div>
        
        <div className="p-10">
          <div className="flex items-center gap-2 mb-8 border-l-4 border-blue-500 pl-4">
            <Shield className="text-blue-500" size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Secure Account Activation</h3>
          </div>

          {error ? (
            <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-2">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-rose-900 font-black uppercase tracking-tight text-lg mb-1">Invitation Issue</h3>
                <p className="text-rose-700/70 font-medium text-sm leading-relaxed px-4">
                  {error.includes('expired') || error.includes('Invalid') 
                    ? "This invitation link has expired or is no longer valid. For security, links expire after 24 hours." 
                    : error}
                </p>
              </div>
              
              <div className="w-full h-px bg-rose-200/50 my-2"></div>
              
              <div className="space-y-4 w-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Next Steps</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors shadow-sm"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
                >
                  Return to Login
                </button>
                <p className="text-[10px] font-bold text-rose-400/80 italic mt-4">
                  * Please contact your administrator to request a new invitation.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing Setup...
                  </>
                ) : (
                  'Activate Account'
                )}
              </button>
            </form>
          )}
        </div>
        
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Secure Encryption Policy Applied
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
