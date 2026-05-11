import React, { useState } from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { Search, UserCog, Key, LogOut, History, Shield, CheckCircle2, ChevronRight, Activity, SearchIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  roles: string[];
  tenantId: string | null;
  tenant?: { businessName: string };
  createdAt: string;
}

const AdminSupportTools: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, loading, error, fetchData, mutate } = useAdminData<PlatformUser[]>('/admin/support/search-user');
  const { startImpersonation } = useAuth();
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) fetchData({ query: searchQuery });
  };

  const handleForceLogout = async (userId: string) => {
    if (confirm('Verify: Force logout will invalidate all active sessions for this user. Continue?')) {
      await mutate('post', '/force-logout', { userId });
    }
  };



  // Improved direct impersonation handler
  const triggerImpersonation = async (user: PlatformUser) => {
     if (!user.tenantId) return;
     const reason = prompt('Administrative Reason for Impersonation (Mandatory):');
     if (!reason) return;

     try {
       // We use the existing admin/impersonate route
       const response = await import('../../api/axios').then(m => m.default.post(`/admin/impersonate/${user.tenantId}`, { reason }));
       if (response.data.success && response.data.token) {
          startImpersonation(response.data.token);
       }
     } catch (err: any) {
        alert(err.response?.data?.error || "Impersonation failed");
     }
  };

  return (
    <AdminPageLayout
      title="Support Console"
      subtitle="Identity management and diagnostic tools"
      tag="Support"
      icon={<UserCog className="text-indigo-600" size={24} />}
    >
      {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}

      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left: User Search & List */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user, email or phone..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-[2rem] focus:border-indigo-600 outline-none transition-all shadow-sm font-bold text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <button type="submit" className="hidden" />
          </form>

          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results</span>
                {loading && <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />}
             </div>
             
             {users?.map(user => (
               <button 
                 key={user.id}
                 onClick={() => setSelectedUser(user)}
                 className={`w-full p-4 rounded-3xl border text-left transition-all duration-300 ${selectedUser?.id === user.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-900 shadow-sm'}`}
               >
                 <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm truncate">{user.name}</p>
                    {selectedUser?.id === user.id && <CheckCircle2 size={14} className="text-indigo-200 shrink-0" />}
                 </div>
                 <p className={`text-[10px] font-medium truncate ${selectedUser?.id === user.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {user.email}
                 </p>
                 <div className={`mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter ${selectedUser?.id === user.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                    <Shield size={10} />
                    {user.roles[0] || 'USER'}
                 </div>
               </button>
             ))}

             {!loading && users?.length === 0 && searchQuery && (
                <div className="py-12 text-center space-y-3">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <SearchIcon className="text-slate-300" size={20} />
                   </div>
                   <p className="text-xs font-bold text-slate-400">No users found</p>
                </div>
             )}
          </div>
        </div>

        {/* Right: Identity Details & Actions */}
        <div className="lg:col-span-3">
          {selectedUser ? (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500">
                <header className="bg-slate-50/50 p-8 border-b border-slate-100">
                   <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 text-2xl font-black">
                            {selectedUser.name.charAt(0)}
                         </div>
                         <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedUser.name}</h2>
                            <div className="flex items-center gap-2">
                               <Badge variant="info" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px]">{selectedUser.roles.join(', ')}</Badge>
                               <span className="text-slate-300">/</span>
                               <span className="text-xs font-bold text-slate-500">{selectedUser.tenant?.businessName || 'PLATFORM USER'}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Status</span>
                         </div>
                      </div>
                   </div>
                </header>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Details</h3>
                         <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400 font-medium italic">Email Address</span>
                               <span className="text-slate-800 font-bold">{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400 font-medium italic">Mobile Number</span>
                               <span className="text-slate-800 font-bold">{selectedUser.mobile}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400 font-medium italic">Registered On</span>
                               <span className="text-slate-800 font-bold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400 font-medium italic">Platform ID</span>
                               <span className="text-[10px] text-slate-400 font-mono font-black uppercase">{selectedUser.id}</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Session Telemetry</h3>
                         <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                  <Activity size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-800 tracking-tight">Active Sessions</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Last Activity: Just now</p>
                               </div>
                            </div>
                            <Badge variant="neutral" className="bg-indigo-100 text-indigo-700">1 Online</Badge>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Administrative Actions</h3>
                      <div className="space-y-3">
                         <button 
                           onClick={() => triggerImpersonation(selectedUser)}
                           className="w-full p-6 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] transition-all flex items-center justify-between group shadow-xl shadow-slate-200"
                         >
                            <div className="flex items-center gap-4 text-left">
                               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                  <Shield size={24} className="text-indigo-400" />
                               </div>
                               <div>
                                  <p className="font-black tracking-tight text-lg leading-tight uppercase">Support Impersonation</p>
                                  <p className="text-[10px] text-slate-400 font-medium font-sans">Strictly Logged & Audit Traced</p>
                               </div>
                            </div>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                         </button>

                         <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleForceLogout(selectedUser.id)}
                              className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-[2rem] hover:bg-rose-100 transition-all text-left"
                            >
                               <LogOut size={20} className="mb-2" />
                               <p className="text-xs font-black uppercase tracking-tighter">Force Logout</p>
                            </button>
                            <button className="p-5 bg-amber-50 border border-amber-100 text-amber-700 rounded-[2rem] hover:bg-amber-100 transition-all text-left">
                               <Key size={20} className="mb-2" />
                               <p className="text-xs font-black uppercase tracking-tighter">Reset Pass</p>
                            </button>
                            <button className="p-5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-[2rem] hover:bg-indigo-100 transition-all text-left col-span-2 flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <History size={20} />
                                  <p className="text-xs font-black uppercase tracking-tighter">View Deep Audit History</p>
                               </div>
                               <ChevronRight size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <div className="p-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm">
                   <UserCog size={32} />
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">No User Selected</h3>
                   <p className="text-sm text-slate-400 font-medium max-w-xs">Use the search console to find and manage platform identity credentials.</p>
                </div>
             </div>
          )}
         </div>
      </div>
   )}
</AdminPageLayout>
  );
};

export default AdminSupportTools;
