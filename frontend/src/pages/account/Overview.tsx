import React, { useEffect, useState } from 'react';
import { 
  Building2, User, Phone, Mail, CheckCircle2, 
  ArrowRight, ShieldCheck, CreditCard, Users, Zap, LayoutDashboard, Activity 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Overview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{title: string, message: string} | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/settings/full-profile');
      setData(res.data);
    } catch (err: any) {
      console.error("Overview Fetch Error:", err);
      const status = err.response?.status;
      const code = err.code;

      let title = "Connection Error";
      let message = "Could not retrieve business overview. Please try again or contact support.";

      if (code === 'ERR_NETWORK') {
        title = "Server Unreachable";
        message = "Our servers are currently unreachable. Please ensure the backend is running and try again.";
      } else if (status === 401) {
        title = "Session Expired";
        message = "Your session has ended. Please log in again to continue.";
      } else if (status === 403) {
        title = "Access Denied";
        message = "You don't have permission to view this data.";
      }

      setError({ 
        title: err.response?.data?.error || title, 
        message: err.response?.data?.message || message 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <div className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading overview...</div>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-lg mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-xl shadow-amber-100/50">
        <Zap size={48} strokeWidth={2.5} />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{error?.title || "Overview Unavailable"}</h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          {error?.message || "We encountered a problem while retrieving your business overview. This is usually temporary."}
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button 
          onClick={() => fetchData()} 
          className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Activity size={18} />
          Try Again
        </button>
        {error?.title === "Business context missing" && (
          <button 
            onClick={() => navigate('/setup')} 
            className="w-full h-14 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            Go to Setup Wizard
          </button>
        )}
      </div>
    </div>
  );

  const profile = data?.profile || {};
  const tenant = data || {};

  // Dynamic progress calculation
  const calculateProgress = () => {
    let score = 0;
    const totalFields = 8;
    if (tenant.businessName) score++;
    if (profile.ownerName) score++;
    if (profile.phone) score++;
    if (profile.email) score++;
    if (profile.address) score++;
    if (profile.pan) score++;
    if (profile.drugLicense) score++;
    if (profile.logoUrl) score++;
    return Math.round((score / totalFields) * 100);
  };

  const progress = calculateProgress();

  const stats = [
    { label: 'Business Type', value: tenant.businessType || 'Pharmacy', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Subscription', value: tenant.currentPlan || 'FREE', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Setup Progress', value: `${progress}%`, icon: CheckCircle2, color: progress === 100 ? 'text-green-600' : 'text-amber-500', bg: progress === 100 ? 'bg-green-50' : 'bg-amber-50' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-blue-100 ring-4 ring-white">
            {tenant.businessName?.[0] || 'M'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{tenant.businessName || 'Business Name'}</h1>
            <p className="text-slate-500 font-medium mt-1">Managed by {profile.ownerName || 'Admin'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            <LayoutDashboard size={18} /> Back to Dashboard
          </button>
          <button 
            onClick={() => navigate('/account/profile')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            {progress < 100 ? 'Complete Setup' : 'View Profile'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 group">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl font-black text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact info card */}
        <div className="bg-white border border-slate-100 rounded-[40px] p-8 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Business Registry
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 group p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                <Phone size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</p>
                <p className="text-sm font-bold text-slate-700">{profile.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                <Mail size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Email</p>
                <p className="text-sm font-bold text-slate-700">{profile.email || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 px-2 flex items-center gap-2">
             <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
             Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Business Profile', path: '/account/profile', icon: Building2, color: 'text-blue-600' },
              { label: 'System Modules', path: '/account/modules', icon: Activity, color: 'text-rose-600' },
              { label: 'Manage Staff', path: '/account/staff', icon: Users, color: 'text-green-600' },
              { label: 'Security', path: '/account/security', icon: ShieldCheck, color: 'text-red-500' },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 border border-transparent hover:border-slate-100 rounded-[32px] transition-all group active:scale-95"
              >
                <div className={`w-12 h-12 mb-3 rounded-2xl bg-white group-hover:bg-blue-600 flex items-center justify-center ${action.color} group-hover:text-white transition-all shadow-sm`}>
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-bold text-slate-600">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
