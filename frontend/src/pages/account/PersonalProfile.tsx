import React, { useState, useEffect } from 'react';
import { Save, Loader2, User, Mail, BadgeCheck, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/ImageCrop/ImageUploader';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

const PersonalProfile = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    avatarKey: null,
    avatar: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/settings/full-profile');
        if (res.data && res.data.currentUser) {
          const u = res.data.currentUser;
          setFormData({
            name: u.name || '',
            email: u.email || '',
            avatarKey: u.avatarKey || null,
            avatar: u.avatar || null
          });
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev: any) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.post('/settings/personal-profile', formData);
      toast.success('Personal profile updated');
      
      if (authUser) {
        setAuthUser({
          ...authUser,
          name: res.data.user.name,
          email: res.data.user.email,
          avatarUrl: res.data.user.avatar?.urls?.thumb
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">
      <User className="w-12 h-12 mb-4 opacity-20" />
      Syncing Credentials...
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 pb-20 bg-slate-50/50 min-h-screen">
      {/* Banner - More sophisticated gradient and pattern */}
      <div className="h-64 w-full bg-[#0f172a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#1e293b,transparent)] opacity-60" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(45%_45%_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative -mt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-12 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl w-44 h-44 shrink-0 relative overflow-hidden">
              <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-slate-100 relative group-hover:scale-[1.02] transition-transform duration-500">
                <ImageUploader 
                  type="user-avatar"
                  value={formData.avatar}
                  onChange={(key) => setFormData((p: any) => ({ ...p, avatarKey: key }))}
                  aspectRatio={1}
                  className="w-full h-full absolute inset-0 text-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-100/50 shadow-sm">
                 <BadgeCheck size={14} /> Active Individual Account
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UID: {authUser?.id?.slice(-8).toUpperCase() || 'SYSTEM'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">{formData.name || 'Staff Member'}</h1>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md shadow-lg shadow-slate-200">
                {authUser?.roles?.[0]?.replace('_', ' ') || 'Staff Member'}
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                 <Mail size={16} className="text-slate-400" />
                 <span className="text-sm font-bold tracking-tight">{formData.email}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 pb-4 flex gap-4">
             <Button 
                type="submit"
                form="profile-form"
                disabled={saving}
                isLoading={saving}
                size="lg"
                leftIcon={!saving ? <Save size={20} /> : undefined}
                className="shadow-xl shadow-indigo-200 uppercase tracking-[0.15em] font-black text-xs px-8 rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
              >
                {saving ? 'Synchronizing...' : 'Commit Changes'}
              </Button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <form id="profile-form" onSubmit={handleSave} className="space-y-8">
              
              {/* Account Identity Data Section - REDESIGNED */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                <div className="p-8 md:p-10 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <User size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize">Account Identity Data</h2>
                      <p className="text-xs font-bold text-slate-500 tracking-tight mt-1">Foundational credentials and identification markers.</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal name</label>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">Required</span>
                      </div>
                      <div className="relative group/input">
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within/input:opacity-15 transition duration-500"></div>
                         <Input 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Alexander Pierce"
                            icon={<User className="w-5 h-5" />}
                            className="bg-slate-50 border-slate-100 hover:bg-white focus:bg-white transition-all h-14 font-bold text-slate-900 text-base rounded-2xl"
                            error={!!errors.name}
                          />
                          {errors.name && <p className="text-[10px] font-bold text-red-500 mt-2 ml-1 uppercase tracking-widest">{errors.name}</p>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium ml-1">Must match your valid government identification.</p>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Authentication Email</label>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">Immutable</span>
                      </div>
                      <div className="relative group/input">
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within/input:opacity-15 transition duration-500"></div>
                         <Input 
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="alexander@pharmacy.com"
                            icon={<Mail className="w-5 h-5" />}
                            className="bg-slate-50 border-slate-100 hover:bg-white focus:bg-white transition-all h-14 font-bold text-slate-900 text-base rounded-2xl"
                            error={!!errors.email}
                          />
                          {errors.email && <p className="text-[10px] font-bold text-red-500 mt-2 ml-1 uppercase tracking-widest">{errors.email}</p>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium ml-1 italic">Used for high-priority security alerts and session recovery.</p>
                    </div>

                  </div>
                </div>

                <div className="bg-slate-50/80 p-6 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Secure Cloud Synchronizer active</span>
                   </div>
                   <div className="text-[10px] font-medium text-slate-400">
                     Encryption Layer: AES-256
                   </div>
                </div>
              </div>

            </form>
          </div>

          {/* Sidebar / Info Area - REDESIGNED (Modern & Classic) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-700">
               {/* Header - Classic structured look */}
               <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Privacy Audit Trail</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Monitoring</span>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Content - Modern Analytical Style */}
               <div className="p-8 flex-1">
                 <p className="text-xs font-bold text-slate-500 leading-relaxed mb-8">
                   Every administrative access and modification to your core identity data is cryptographically logged for complete end-to-end traceability.
                 </p>

                 {/* Visual Timeline / Status Cards */}
                 <div className="space-y-6">
                    <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
                      {/* Event 1 */}
                      <div className="relative group/event">
                        <div className="absolute -left-[33px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm z-10 group-hover:scale-125 transition-transform duration-300"></div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all duration-300 group-hover:border-indigo-200 group-hover:bg-white group-hover:shadow-md group-hover:shadow-indigo-50">
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Last Modification</p>
                           <p className="text-xs font-bold text-slate-900">Personal Details Synchronized</p>
                           <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">Today, 14:23 • via Web Platform</p>
                        </div>
                      </div>

                      {/* Event 2 */}
                      <div className="relative group/event">
                        <div className="absolute -left-[33px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 shadow-sm z-10 group-hover:scale-125 transition-transform duration-300"></div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all duration-300 group-hover:border-slate-300 group-hover:bg-white">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Creation</p>
                           <p className="text-xs font-bold text-slate-800 opacity-60">System Identity Challenge Passed</p>
                           <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">Today, 09:12 • via 2FA Auth</p>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Security Footer - Classic Certificate Look */}
                 <div className="mt-10 pt-8 border-t border-slate-100">
                    <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 flex items-start gap-4">
                       <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                          <BadgeCheck size={16} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-1">Governance Standard</p>
                          <p className="text-[9px] font-bold text-indigo-700/80 leading-relaxed uppercase tracking-widest">
                            Verified ISO/IEC 27001 Compliant Audit Architecture
                          </p>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Interaction Layer */}
               <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Encryption: SHA-256</span>
                  <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                    Request Logs
                  </button>
               </div>
            </div>

            {/* Verification Status Card - Integrated look */}
            <div className="bg-emerald-600 rounded-[2.2rem] p-8 text-white flex items-center gap-6 shadow-xl shadow-emerald-100">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                 <BadgeCheck size={32} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Identity Status</p>
                  <p className="text-xl font-black tracking-tight leading-none">Security Cleared</p>
                  <p className="text-[10px] font-medium text-emerald-200 mt-2 uppercase tracking-tighter opacity-70">Last Audit: 2026-04-17</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;
